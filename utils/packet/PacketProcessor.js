const PacketBuilder = require("./PacketBuilder.js");
const BufferUtils = require("../misc/BufferUtils.js");
const Packet = require("./Packet.js");

const States = { "HANDSHAKING": "HANDSHAKING", "STATUS": "STATUS", "LOGIN": "LOGIN", "GAME": "GAME" };

class PacketProcessor {

    #LogUtils;

    constructor(LogUtils) {
        this.#LogUtils = LogUtils;
    }

    handlePacket(data, client) {
        try {
            const parsedPacket = new BufferUtils(data);

            const packetArray = convertToPacketArray(parsedPacket);
            var wrapped = new BufferUtils(packetArray[0]);
            var packetQueue = [];

            if (packetArray.length > 1) {
                packetQueue = packetArray.slice(1);
            }

            var packetLength = wrapped.readVarInt();
            var packetId = wrapped.readVarInt();
        } catch (err) {
            client.socket.destroy();

            this.#LogUtils.debug(client.socket.remoteAddress + " sent an invalid packet group and was disconnected.");
            console.log(err);

            return { "error": true };
        }

        let packetName = null;
        let packetData = null;

        switch (client.state) {
            case States.HANDSHAKING:
                switch (packetId) {
                    case 0x00:
                        {
                            const protocolVersion = wrapped.readVarInt();
                            const serverAddress = wrapped.readString();
                            const serverPort = wrapped.readU16();
                            const nextState = wrapped.readVarInt();

                            packetName = "handshake";
                            packetData = { protocolVersion, serverAddress, serverPort, nextState };
                        }

                        break;
                }

                break;
            case States.STATUS:
                switch (packetId) {
                    case 0x00:
                        packetName = "request";
                        packetData = {};

                        break;
                    case 0x01:
                        const payload = wrapped.readBytes(8);

                        packetName = "ping";
                        packetData = { payload };

                        break;
                }

                break;
            case States.LOGIN:
                switch (packetId) {
                    case 0x00:
                        const username = wrapped.readString();

                        packetName = "login_start";
                        packetData = { username };

                        break;
                    case 0x01:
                            const sharedSecretLength = wrapped.readVarInt();
                            const sharedSecret = wrapped.readBytes(sharedSecretLength).buf;
                            const verifyTokenLength = wrapped.readVarInt();
                            const verifyToken = wrapped.readBytes(verifyTokenLength).buf;

                            packetName = "encryption_response";
                            packetData = { sharedSecret, verifyToken };

                        break;
                }

                break;
            case States.GAME:
                switch (packetId) {
					case 0x03:
    					{
    						const message = wrapped.readString();

    						packetName = "chat";
    						packetData = { message };
    					}

    					break;
                    case 0x05:
                        {
                            const locale = wrapped.readString();
                            const viewDistance = wrapped.read8();
                            const chatMode = wrapped.readVarInt();
                            const chatColors = wrapped.readBoolean();
                            const displayedSkinParts = wrapped.readU8();
                            const mainHand = wrapped.readVarInt();
                            const disableTextFiltering = wrapped.readBoolean();

                            packetName = "settings";
                            packetData = { locale, viewDistance, chatMode, chatColors, displayedSkinParts, mainHand, disableTextFiltering };
                        }

                        break;
                    case 0x11:
                        {
                            const x = wrapped.readDouble();
                            const y = wrapped.readDouble();
                            const z = wrapped.readDouble();
                            const onGround = wrapped.readBoolean();

                            packetName = "player_position";
                            packetData = { x, y, z, onGround };
                        }

                        break;
                    case 0x12:
                        {
                            const x = wrapped.readDouble();
                            const y = wrapped.readDouble();
                            const z = wrapped.readDouble();
                            const yaw = wrapped.readFloat32();
                            const pitch = wrapped.readFloat32();
                            const onGround = wrapped.readBoolean();

                            packetName = "player_position_look";
                            packetData = { x, y, z, yaw, pitch, onGround };
                        }

                        break;
                    case 0x13:
                        {
                            const yaw = wrapped.readFloat32();
                            const pitch = wrapped.readFloat32();
                            const onGround = wrapped.readBoolean();

                            packetName = "player_rotation";
                            packetData = { yaw, pitch, onGround };
                        }

                        break;
                    case 0x14:
                        {
                            const onGround = wrapped.readBoolean();

                            packetName = "player_movement";
                            packetData = { onGround };
                        }

                        break;
                    case 0x15:
                        {
                            const x = wrapped.readDouble();
                            const y = wrapped.readDouble();
                            const z = wrapped.readDouble();
                            const yaw = wrapped.readFloat32();
                            const pitch = wrapped.readFloat32();

                            packetName = "vehicle_move";
                            packetData = { x, y, z, yaw, pitch };
                        }

                        break;
                    case 0x16:
                        {
                            const leftPaddleTurning = wrapped.readBoolean();
                            const rightPaddleTurning = wrapped.readBoolean();

                            packetName = "steer_boat";
                            packetData = { leftPaddleTurning, rightPaddleTurning };
                        }

                        break;
                    case 0x0F:
                        {
                            const keepAliveId = wrapped.readLong();

                            packetName = "keep_alive";
                            packetData = { keepAliveId };
                        }

                        break;
                }

                break;
        }

        return { "packet": new Packet(packetName, packetData, client), "queue": packetQueue };
    }

}

function convertToPacketArray(packet, array = []) {
	if (packet.cursor !== packet.buf.length) {
		const length = packet.readVarInt();
		const bytes = packet.readBytes(length);

		const formedPacket = new BufferUtils();

		formedPacket.writeVarInt(length);
		formedPacket.writeBytes(bytes);

		array.push(formedPacket.buf);

		return convertToPacketArray(packet, array);
	}

	return array;
}

module.exports = PacketProcessor;
