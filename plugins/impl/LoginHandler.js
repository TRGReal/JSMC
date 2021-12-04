const Plugin = require("../Plugin.js");

const crypto = require('crypto');
const mauth = require('yggdrasil').server({});
const NBT = require('prismarine-nbt');
const PChunk = require('prismarine-chunk')("1.17.1");
const PChat = require('prismarine-chat').MessageBuilder;
const Vec3 = require('vec3');

const Entity = require("../../utils/entity/Entity.js");

const States = { "HANDSHAKING": "HANDSHAKING", "STATUS": "STATUS", "LOGIN": "LOGIN", "GAME": "GAME" };

class LoginHandler extends Plugin {

    constructor() {
		super("LoginHandler", "1.0", false);
	}

    handlePacket(packet) {
		const PacketBuilder = this.getPacketBuilder();
        const data = packet.getData();
        const name = packet.getName();
        const client = packet.getClient();

        switch (name) {
    		case "handshake":
    			client.version = {};
    			client.version.protocolVersion = data.protocolVersion;
    			client.version.majorVersion = "unknown";

    			if (data.nextState === 1) {
    				client.state = States.STATUS;
    			} else if (data.nextState === 2) {
    				client.state = States.LOGIN;
    			}

    			this.getLogUtils().debug("Incoming handshake from " + client.socket.remoteAddress + "");

    			break;
    		case "login_start":
                client.username = data.username;

    			this.getLogUtils().info(`${client.username} is logging in... [ip=${client.socket.remoteAddress},id=${client.id}]`);

    			const randomBytes = crypto.randomBytes(4);

    			client.encryption.bytes = randomBytes;
    			client.serverId = "";

    			const exportKey = this.getKeyPair().exportKey("pkcs8-public-der");
    			const EncryptionRequest = new PacketBuilder();

    			EncryptionRequest.writeVarInt(0x01);
    			EncryptionRequest.writeString(client.serverId);
    			EncryptionRequest.writeVarInt(exportKey.length);
    			EncryptionRequest.writeBytes(exportKey);
    			EncryptionRequest.writeVarInt(randomBytes.length);
    			EncryptionRequest.writeBytes(randomBytes);

    			client.socket.write(EncryptionRequest.getResult());

    			break;
    		case "encryption_response":
                let sharedSecret, verifyToken;

                try {
                    sharedSecret = crypto.privateDecrypt({
                        "key": this.getKeyPair().exportKey(),
                        "padding": crypto.constants.RSA_PKCS1_PADDING
                    }, data.sharedSecret);

                    verifyToken = crypto.privateDecrypt({
                        "key": this.getKeyPair().exportKey(),
                        "padding": crypto.constants.RSA_PKCS1_PADDING
                    }, data.verifyToken);
                } catch (err) {
                    const LoginDisconnect = new PacketBuilder();
                    LoginDisconnect.setLoginDisconnect("&cFailed to encrypt token correctly!");
                    client.socket.write(LoginDisconnect.getResult());

                    console.log(err);

                    client.socket.destroy();

                    this.getLogUtils().debug("Disconnected " + client.username + " for failing to encrypt a token correctly (encryption response).");
                }

    			if (!client.encryption.bytes.equals(verifyToken)) {
    				const LoginDisconnect = new PacketBuilder();
    				LoginDisconnect.setLoginDisconnect("&cUntrustworthy client, failed to encrypt token correctly.");
    				client.socket.write(LoginDisconnect.getResult());

    				this.getLogUtils().debug("Disconnected " + client.username + " for failing to encrypt verify token correctly.");
    			}

                client.encryption.sharedSecret = sharedSecret;
    			client.encryption.cipher = crypto.createCipheriv("aes-128-cfb8", sharedSecret, sharedSecret);
    			client.encryption.decipher = crypto.createDecipheriv("aes-128-cfb8", sharedSecret, sharedSecret);

    			mauth.hasJoined(client.username, client.serverId, sharedSecret, this.getKeyPair().exportKey("pkcs8-public-der"), (err, profile) => {
    				if (err) {
    					const LoginDisconnect = new PacketBuilder();
    					LoginDisconnect.setGameDisconnect("&cFailed to authenticate you, maybe the auth servers are down?");
    					client.socket.write(LoginDisconnect.getResult());

                        console.log(err);

    					return this.getLogUtils().debug("Disconnected " + client.username + " for failing to authenticate.");
    				}

    				client.encryption.cipher.on('data', encrypted => {
    					client.socket.realWrite(encrypted);
    				});

    				client.encryption.shouldEncrypt = true;
    				client.encryption.shouldRegisterDecipher = true;
    				client.uuid = profile.id.replace(/(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})/, '$1-$2-$3-$4-$5');
    				client.username = profile.name;
    				client.textureProperties = profile.properties;
                    client.entity = new Entity(client.uuid, client.username, { "x": 0, "y": 6, "z": 0, "yaw": 0, "pitch": 0 });

                    if (!this.getConfig().allowSamePlayerJoin) {
                        for (const id in this.getClients()) {
                            const value = this.getClients()[id];

                            if (value !== client) {
                                if (value.username === client.username) {
                                    const GameDisconnect = new PacketBuilder();
                                    GameDisconnect.setGameDisconnect("&cYou logged in from another location!");
                                    value.socket.write(GameDisconnect.getResult());

                                    value.socket.destroy();

                                    this.getLogUtils().info("Disconnected " + value.username + " logging in from another location.");
                                }
                            }
                        }
                    }

    				this.getLogUtils().debug("Finished encryption for " + client.username + ", sending login success.");

					// const SetCompression = new PacketBuilder();
					
					// SetCompression.writeVarInt(0x03);
					// SetCompression.writeVarInt(client.compressionThreshold);
					
					// client.socket.write(SetCompression.getResult());
					// client.compressionEnabled = true;

    				const LoginSuccess = new PacketBuilder();

    				LoginSuccess.writeVarInt(0x02);
    				LoginSuccess.writeUUID(client.uuid);
    				LoginSuccess.writeString(client.username);

                    client.socket.write(LoginSuccess.getResult());

    				const JoinGame = new PacketBuilder();

    				JoinGame.writeVarInt(0x26);
    				JoinGame.write32(client.id); // Entity ID
    				JoinGame.writeBoolean(false); // Is Hardcore
    				JoinGame.writeU8(0); // Gamemode
    				JoinGame.write8(-1); // Previous Gamemode (-1 due to no previous).
    				JoinGame.writeVarInt(3); // World Type Count
    				JoinGame.writeString("minecraft:overworld") // World Types
    				JoinGame.writeString("minecraft:the_nether");
    				JoinGame.writeString("minecraft:the_end");
    				JoinGame.writeBytes(this.getCodecBuffer());
    				JoinGame.writeBytes(this.getDimensionsBuffer());
    				JoinGame.writeString("minecraft:overworld");
    				JoinGame.writeLong(0);
    				JoinGame.writeVarInt(0); // Max Players (ignored usually).
    				JoinGame.writeVarInt(10); // View Distance
    				JoinGame.writeBoolean(false); // Reduced Debug Info
    				JoinGame.writeBoolean(true); // Should Show Respawn Screen
    				JoinGame.writeBoolean(false); // Is Debug World
    				JoinGame.writeBoolean(true); // Is Superflat (changes horizon to y0 from y63).

                    client.socket.write(JoinGame.getResult());

    				const PluginMessage = new PacketBuilder();

    				PluginMessage.writeVarInt(0x18);
    				PluginMessage.writeString("minecraft:brand");
    				PluginMessage.writeString("JSMC");

    				client.socket.write(PluginMessage.getResult());

    				const ServerDifficulty = new PacketBuilder();

    				ServerDifficulty.writeVarInt(0x0E);
    				ServerDifficulty.writeU8(2); // Unsigned Byte (Difficulty)
    				ServerDifficulty.writeBoolean(true); // Difficulty Locked

    				client.socket.write(ServerDifficulty.getResult());

    				const PlayerAbilities = new PacketBuilder();

    				PlayerAbilities.writeVarInt(0x32);
    				PlayerAbilities.write8(0); // Flag Bitfield (0 = no abilities).
    				PlayerAbilities.writeFloat32(0.05); // Flying Speed.
    				PlayerAbilities.writeFloat32(0.1); // FOV Modifier.

                    client.socket.write(PlayerAbilities.getResult());

    				const HeldItemChange = new PacketBuilder();

    				HeldItemChange.writeVarInt(0x48);
    				HeldItemChange.write8(0); // Slot Byte (0 - 8).

    				client.socket.write(HeldItemChange.getResult());

    				const EntityStatus = new PacketBuilder();

    				EntityStatus.writeVarInt(0x1B);
                    EntityStatus.write32(client.id);
    				EntityStatus.write8(28); // Entity Status [Player] - Set OP Permission Level 4

                    client.socket.write(EntityStatus.getResult());

                    const PlayerInfo = new PacketBuilder();

                    PlayerInfo.writeVarInt(0x36);
                    PlayerInfo.writeVarInt(0); // Action Type (Add Player)
                    PlayerInfo.writeVarInt(1); // Number Of Players (following Array) - this value will always be 1 because we are introducing the local player only.
                    PlayerInfo.writeUUID(client.uuid); // UUID of Array Player <= local player.
                    PlayerInfo.writeString(client.username); // Username of Array Player.
                    PlayerInfo.writeVarInt(client.textureProperties.length); // Array Length of Textures
                    client.textureProperties.forEach(texture => {
                        PlayerInfo.writeString(texture.name); // Texture Name Type.
                        PlayerInfo.writeString(texture.value); // Texture Base64 Value.
                        PlayerInfo.writeBoolean(texture.signature != null); // Is Signed
                        if (texture.signature != null) PlayerInfo.writeString(texture.signature); // Signature (only if isSigned is true).
                    });
                    PlayerInfo.writeVarInt(0); // Gamemode (0 is survival).
                    PlayerInfo.writeVarInt(-1); // Ping (-1 means not set).
                    PlayerInfo.writeBoolean(false); // Has Display Name.
                    // PlayerInfo.writeString(client.username); // Display Name (only if has display name is true).

                    client.socket.write(PlayerInfo.getResult());

                    const PlayerPositionLook = new PacketBuilder();

                    PlayerPositionLook.writeVarInt(0x38);
                    PlayerPositionLook.writeDouble(0); // X
                    PlayerPositionLook.writeDouble(6); // Y
                    PlayerPositionLook.writeDouble(0); // Z
                    PlayerPositionLook.writeFloat32(0); // Yaw
                    PlayerPositionLook.writeFloat32(0); // Pitch
                    PlayerPositionLook.write8(0); // Relativity Flags
                    PlayerPositionLook.writeVarInt(0); // Teleport ID
                    PlayerPositionLook.writeBoolean(true); // Should Dismount

                    const chunkArea = 10;
                    const chunkArray = [];

                    this.getLogUtils().debug("Generating fake superflat chunks (with " + chunkArea + " radius)...");

                    const chunkPackets = [];
                    const writeChunks = () => {
                        chunkPackets.forEach(packet => {
                            client.socket.write(packet.getResult());
                        });
                    }

                    const chunk = new PChunk();

                    for (let x = 0; x < 64; x++) {
                        for (let z = 0; z < 64; z++) {
                            var random = Math.random() * 5;
                            var noise = Math.abs(getNoise(x, z)) + Math.abs(getNoise(x, z)) * 7;
                            //chunk.setBlockType(new Vec3(x, 5, z), 8);
                            //chunk.setBlockData(new Vec3(x, 5, z), 1);
                            for (var a = noise; a > 0; --a) {
                            chunk.setBlockStateId(new Vec3(x, 1 + a, z), 2);
                            chunk.setBlockStateId(new Vec3(x + Math.round(x+z * 0.1), 1 + a + Math.round(x+z * 0.01), z + Math.round(x+z * 0.1)), 2);
                            chunk.setBlockStateId(new Vec3(x + Math.round(x+z * 0.15), 1 + a + Math.round(x+z * 0.01), z + Math.round(x+z * 0.15)), 2);
                            chunk.setBlockStateId(new Vec3(x + Math.round(x+z * 0.2), 1 + a + Math.round(x+z * 0.01), z + Math.round(x+z * 0.2)), 2);
                            //chunk.setBlockStateId(new Vec3(x, 3 + noise, z), 3);
                            //chunk.setBlockStateId(new Vec3(x, 2 + noise, z), 3);
                            chunk.setBlockStateId(new Vec3(x + 1, a, z), 2);
                            chunk.setBlockStateId(new Vec3(x + 1, a, z + 1), 3);
                            chunk.setBlockStateId(new Vec3(x + 1, a, z - 1), 3);
                            chunk.setBlockStateId(new Vec3(x - 1, a, z + 1), 3);
                            }
                            chunk.setBlockType(new Vec3(x, 2, z), 25);

                            for (let y = 0; y < 256; y++) {
                                chunk.setSkyLight(new Vec3(x, y, z), Math.round(y / 18));
                            }
                        }
                    }

                    const WorldSurfaceNBT = NBT.writeUncompressed({
                        "type": "compound",
                        "name": "",
                        "value": {}
                    });

                    const mask = chunk.getMask();
                    const biomes = chunk.dumpBiomes();
                    const chunkData = chunk.dump();

                    for (let chunkX = -10; chunkX < chunkArea; chunkX++) {
                        for (let chunkZ = -10; chunkZ < chunkArea; chunkZ++) {
                            const ChunkPacket = new PacketBuilder();

                            ChunkPacket.writeVarInt(0x22);
                            ChunkPacket.write32(chunkX);
                            ChunkPacket.write32(chunkZ);
                            ChunkPacket.writeVarInt(mask.length);
                            ChunkPacket.write32(mask[0][0]);
                            ChunkPacket.write32(mask[0][1]);
                            ChunkPacket.writeBytes(WorldSurfaceNBT);
                            ChunkPacket.writeVarInt(biomes.length);

                            biomes.forEach(biome => {
                                ChunkPacket.writeVarInt(biome);
                            });

                            ChunkPacket.writeVarInt(chunkData.length);
                            ChunkPacket.writeBytes(chunkData);
                            ChunkPacket.writeVarInt(0);

                            chunkPackets.push(ChunkPacket);
                        }
                    }

                    writeChunks();
                    client.socket.write(PlayerPositionLook.getResult());

    				client.state = States.GAME;
                    client.keepAlive.started = true;

    				client.joinDiff = new Date().getTime() - client.joinTime;

                    this.getPluginLoader().onClientLogin(client);

    				this.getLogUtils().success(client.username + " has logged in. [time=" + client.joinDiff + "ms]");
                
    			});

    			break;
    	}

        if (client.keepAliveHandler != null) {
            client.keepAliveHandler.handlePacket(packet);
            client.viewPositionUpdater.handlePacket(packet);
        }
    }

}

//credit to https://github.com/solvingcode/noisemap/blob/master/src/lib/NoiseGenerator.js
function noise(x, z){
    const integerX = parseInt(x)
    const integerZ = parseInt(z)

    const fractionalX = x - integerX
    const fractionalZ = z - integerZ

    const a = this.getNoise(integerX, integerZ)
    const b = this.getNoise(integerX + 1, integerZ)

    const c = this.getNoise(integerX, integerZ + 1)
    const d = this.getNoise(integerX + 1, integerZ + 1)

    const f = this.cosineInterpolate(a, b, fractionalX)
    const g = this.cosineInterpolate(c, d, fractionalZ)

    const result = this.cosineInterpolate(f, g, fractionalZ)

    return result
}

function getNoiseValue(t){
    t += 6910259012; //binary for mimikyuin
    t = BigInt((t << 13) ^ t)
    t = (t * (t * t * 15731n + 789221n) + 1376312589n)
    t = parseInt(t.toString(2).slice(-31), 2)
    return 1.0 - t / 1073741824
}

function getNoise(x, z){
    return getNoiseValue(x + z * 16);
}

function cosineInterpolate(a, b, t){
    const c = (1 - Math.cos(t * 3.1415927)) * .5
    return (1. - c) * a + c * b
}

function perlinNoise(x, z){
    var r = 0
    for (var i = 0; i <= this.configs.octaves; i++) {
        var frequency = Math.pow(2, i)
        var amplitude = Math.pow(this.configs.persistance, i)
        var noise = this.noise(x * frequency / this.configs.smoothness, z * frequency / this.configs.smoothness)
        r += noise * amplitude
    }
    var result = (r / 2 + 1) * this.configs.amplitude - 20
    return result > 0 ? result : 1
}

module.exports = LoginHandler;
