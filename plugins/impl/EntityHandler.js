const Plugin = require("../Plugin.js");

class EntityHandler extends Plugin {

    #entityList;

    constructor() {
        super("EntityHandler", "1.0", false);

        this.#entityList = [];
    }

    handlePacket(packet) {
        const client = packet.getClient();
        const name = packet.getName();
        const data = packet.getData();

        const clients = this.getClients();
        const PacketBuilder = this.getPacketBuilder();

        switch (name) {
            case "settings":
                client.settings = data;

                const EntityMetadata = new PacketBuilder();

                EntityMetadata.writeVarInt(0x4D);
                EntityMetadata.writeVarInt(client.id);

                // Entity Info Bit Mask (fire, crouching, sprinting, etc...)
                EntityMetadata.writeU8(0);
                EntityMetadata.writeVarInt(0);
                EntityMetadata.write8(0);

                // Skin Parts
                EntityMetadata.writeU8(17); // Player Displayed Skin Parts (index)
                EntityMetadata.writeVarInt(0); // Byte (type)
                EntityMetadata.write8(data.displayedSkinParts); // Skin Part Bit Mask

                // Main Hand
                EntityMetadata.writeU8(18);
                EntityMetadata.writeVarInt(0);
                EntityMetadata.write8(data.mainHand);

                // Finishing Byte
                EntityMetadata.writeU8(0xff);

                for (var eClientID in clients) {
                    const eClient = clients[eClientID];

                    if (eClient.state === "GAME") {
                        eClient.socket.write(EntityMetadata.getResult());
                    }
                }

                break;
            case "player_position":
                client.entity.setPosition(data.x, data.y, data.z);
                client.entity.setGround(data.onGround);
                client.entity.updateTotal("position");
                client.entity.updateTotal("ground");

                break;
            case "player_position_look":
                client.entity.setPosition(data.x, data.y, data.z);
                client.entity.setAngle(data.yaw % 180, data.pitch);
                client.entity.setGround(data.onGround);
                client.entity.updateTotal("position_angle");
                client.entity.updateTotal("ground");

                break;
            case "player_rotation":
                client.entity.setAngle(data.yaw % 180, data.pitch);
                client.entity.setGround(data.onGround);
                client.entity.updateTotal("angle");
                client.entity.updateTotal("ground");

                break;
            case "player_movement":
                client.entity.setGround(data.onGround);
                client.entity.updateTotal("ground");

                break;
            case "entity_action":
                switch (data.actionId) {
                    case 0:
                        client.entity.setSneaking(true);
                        break;
                    case 1:
                        client.entity.setSneaking(false);
                        break;
                    case 3:
                        client.entity.setSprinting(true);
                        break;
                    case 4:
                        client.entity.setSprinting(false);
                        break;
                }

                client.entity.updateTotal("metadata");

                break;
            case "animation":
                const AnimationPacket = new PacketBuilder();

                AnimationPacket.writeVarInt(0x06);
                AnimationPacket.writeVarInt(client.id);
                AnimationPacket.writeU8(data.hand === 0 ? 0 : 3); // Translate Entity Animation ID

                for (const bClientID in this.getClients()) {
                    const bClient = this.getClients()[bClientID];

                    if (bClient.state === "GAME" && bClient.id !== client.id) {
                        bClient.socket.write(AnimationPacket.getResult());
                    }
                }
                
                break;
        }
    }

    onTick() {
        const PacketBuilder = this.getPacketBuilder();

        for (const lClientID in this.getClients()) {
            const lClient = this.getClients()[lClientID];

            if (lClient.state === "GAME" && Object.keys(lClient.entity.getUpdateTotal()).length > 1) {
                const PacketQueue = [];

                Object.keys(lClient.entity.getUpdateTotal()).forEach(update => {
                    switch (update) {
                        case "position":
                            {
                                const lP = lClient.entity.getLastPosition();
                                const nP = lClient.entity.getPosition();

                                // Send an Entity Teleport if the total distance is more than 8 or no change (for precision due to other positions being relative).
                                if (((nP.x - lP.x) > 8 || (nP.y - lP.y) > 8 || (nP.z - lP.z) > 8) || ((nP.x - lP.x) === 0 || (nP.y - lP.y) === 0 || (nP.z - lP.z) === 0)) {
                                    const EntityTeleport = new PacketBuilder();

                                    const angle = lClient.entity.getAngle();

                                    EntityTeleport.writeVarInt(0x61);
                                    EntityTeleport.writeVarInt(lClient.id);
                                    EntityTeleport.writeDouble(nP.x);
                                    EntityTeleport.writeDouble(nP.y);
                                    EntityTeleport.writeDouble(nP.Z);
                                    EntityTeleport.write8(Math.floor(angle.yaw * 255 / 360));
                                    EntityTeleport.write8(Math.floor(angle.pitch * 255 / 360));
                                    EntityTeleport.writeBoolean(lClient.entity.onGround());

                                    // PacketQueue.push(EntityTeleport.getResult());
                                } else {
                                    const PositionPacket = new PacketBuilder();

                                    PositionPacket.writeVarInt(0x29);
                                    PositionPacket.writeVarInt(lClient.id);
                                    PositionPacket.write16((nP.x * 32 - lP.x * 32) * 128);
                                    PositionPacket.write16((nP.y * 32 - lP.y * 32) * 128);
                                    PositionPacket.write16((nP.z * 32 - lP.z * 32) * 128);
                                    PositionPacket.writeBoolean(lClient.entity.onGround());

                                    // PacketQueue.push(PositionPacket.getResult());
                                }
                            }

                            break;
                        case "position_angle":
                            {
                                const lP = lClient.entity.getLastPosition();
                                const nP = lClient.entity.getPosition();
                                const angle = lClient.entity.getAngle();

                                if ((nP.x - lP.x) > 8) {
                                    const EntityTeleport = new PacketBuilder();

                                    const angle = lClient.entity.getAngle();

                                    EntityTeleport.writeVarInt(0x61);
                                    EntityTeleport.writeVarInt(lClient.id);
                                    EntityTeleport.writeDouble(nP.x);
                                    EntityTeleport.writeDouble(nP.y);
                                    EntityTeleport.writeDouble(nP.Z);
                                    EntityTeleport.write8(Math.floor(angle.yaw * 255 / 360));
                                    EntityTeleport.write8(Math.floor(angle.pitch * 255 / 360));
                                    EntityTeleport.writeBoolean(lClient.entity.onGround());

                                    // PacketQueue.push(EntityTeleport.getResult());
                                } else {
                                    const PositionRotationPacket = new PacketBuilder();

                                    PositionRotationPacket.writeVarInt(0x2A);
                                    PositionRotationPacket.writeVarInt(lClient.id);
                                    PositionRotationPacket.write16((nP.x * 32 - lP.x * 32) * 128);
                                    PositionRotationPacket.write16((nP.y * 32 - lP.y * 32) * 128);
                                    PositionRotationPacket.write16((nP.z * 32 - lP.z * 32) * 128);
                                    PositionRotationPacket.write8(Math.floor(angle.yaw * 255 / 360));
                                    PositionRotationPacket.write8(Math.floor(angle.pitch * 255 / 360));
                                    PositionRotationPacket.writeBoolean(lClient.entity.onGround());

                                    // PacketQueue.push(PositionRotationPacket.getResult());
                                }
                            }

                            break;
                        case "angle":
                            {
                                const RotationPacket = new PacketBuilder();

                                const angle = lClient.entity.getAngle();

                                RotationPacket.writeVarInt(0x2B);
                                RotationPacket.writeVarInt(lClient.id);
                                RotationPacket.write8(Math.floor(angle.yaw * 255 / 360));
                                RotationPacket.write8(Math.floor(angle.pitch * 255 / 360));
                                RotationPacket.writeBoolean(lClient.entity.onGround());
								
								const TestPacket = new PacketBuilder();
								
								TestPacket.write8(Math.floor(angle.yaw * 255 / 360));
								
								console.log(TestPacket.buf);

                                PacketQueue.push(RotationPacket.getResult());
                            }

                            break;
                        case "metadata":
                            {
                                const EntityMetadata = new PacketBuilder();

                                EntityMetadata.writeVarInt(0x4D);
                                EntityMetadata.writeVarInt(lClient.id);
                                
                                // Entity Info Bitmask
                                let FlagBitmask = 0;

                                if (lClient.entity.isOnFire()) FlagBitmask |= 0x01;
                                if (lClient.entity.isSneaking()) FlagBitmask |= 0x02;
                                if (lClient.entity.isSprinting()) FlagBitmask |= 0x08;

                                EntityMetadata.writeU8(0);
                                EntityMetadata.writeVarInt(0);
                                EntityMetadata.write8(FlagBitmask);

                                EntityMetadata.writeU8(0xff);

                                PacketQueue.push(EntityMetadata.getResult());
                            }

                            break;
						case "latency":
							{
								const PlayerInfo = new PacketBuilder();

								PlayerInfo.writeVarInt(0x36);
								PlayerInfo.writeVarInt(2);
								PlayerInfo.writeVarInt(1);
								PlayerInfo.writeUUID(lClient.uuid);
								PlayerInfo.writeVarInt(lClient.latency);

								const clients = this.getClients();

								for (const lClientID in clients) {
									const lClient = clients[lClientID];

									if (lClient.state === "GAME") {
										lClient.socket.write(PlayerInfo.getResult());
									}
								}
							}
						
							break;
                    }
                });

                lClient.entity.resetUpdateTotal();

                for (const bClientID in this.getClients()) {
                    const bClient = this.getClients()[bClientID];

                    if (bClient.state === "GAME" && bClient.id !== lClient.id) {
                        PacketQueue.forEach(packet => {
                            bClient.socket.write(packet);
                        });
                    }
                }
            }
        }
    }

    onLogin(client) {
        for (const lClientID in this.getClients()) {
            const lClient = this.getClients()[lClientID];

            if (lClient.state === "GAME") {
                if (client.id === lClient.id) {
                    this.sendEntities(client);
                } else {
                    this.sendEntities(lClient, [ client ]);
                }
            }
        }
    }

    onDisconnect(client) {
        const PacketBuilder = this.getPacketBuilder();
        const EntityDestroy = new PacketBuilder();

        EntityDestroy.writeVarInt(0x3A);
        EntityDestroy.writeVarInt(1); // 1 entity to destroy
        EntityDestroy.writeVarInt(client.id);

        const PlayerInfoRemove = new PacketBuilder();

        PlayerInfoRemove.writeVarInt(0x36);
		PlayerInfoRemove.writeVarInt(4);
		PlayerInfoRemove.writeVarInt(1);
		PlayerInfoRemove.writeUUID(client.uuid);

        for (const lClientID in this.getClients()) {
            const lClient = this.getClients()[lClientID];

            if (lClient.state === "GAME" && lClient.id !== client.id) {
                lClient.socket.write(EntityDestroy.getResult());
				lClient.socket.write(PlayerInfoRemove.getResult());
            }
        }
    }

    sendEntities(client, selectedEntities) {
        if (!selectedEntities) return this.sendEntities(client, Object.values(this.getClients()));

        // Removes entities that aren't in the game yet. (entity state is game and client id is not the same)
        const entities = selectedEntities.filter(entity => entity.state === "GAME" && entity.id !== client.id);

        if (entities.length > 0) {
            const PacketBuilder = this.getPacketBuilder();
            const PlayerInfoIntro = new PacketBuilder();
			
			console.log(entities.length);

            // Player Info Handler
            PlayerInfoIntro.writeVarInt(0x36);
            PlayerInfoIntro.writeVarInt(0);
            PlayerInfoIntro.writeVarInt(entities.length);

            entities.forEach(entity => {				
                PlayerInfoIntro.writeUUID(entity.uuid);
                PlayerInfoIntro.writeString(entity.username);
                PlayerInfoIntro.writeVarInt(entity.textureProperties.length);

                entity.textureProperties.forEach(texture => {
                    PlayerInfoIntro.writeString(texture.name);
                    PlayerInfoIntro.writeString(texture.value);
                    PlayerInfoIntro.writeBoolean(texture.signature != null);
                    if (texture.signature != null) PlayerInfoIntro.writeString(texture.signature);
                });

                PlayerInfoIntro.writeVarInt(0);
                PlayerInfoIntro.writeVarInt(-1);
                PlayerInfoIntro.writeBoolean(false); // has display name
            });
			
			client.socket.write(PlayerInfoIntro.getResult());

            // Entity Spawn Handler
            entities.forEach(entity => {
				const SpawnPlayer = new PacketBuilder();

                const position = entity.entity.getPosition();
                const angle = entity.entity.getAngle();

                SpawnPlayer.writeVarInt(0x04);
                SpawnPlayer.writeVarInt(entity.id);
                SpawnPlayer.writeUUID(entity.uuid);
                SpawnPlayer.writeDouble(position.x);
                SpawnPlayer.writeDouble(position.y);
                SpawnPlayer.writeDouble(position.z);
                SpawnPlayer.write8(Math.floor(angle.pitch * 255 / 360));
                SpawnPlayer.write8(Math.floor(angle.pitch * 255 / 360));

                client.socket.write(SpawnPlayer.getResult());
            });
        }
    }

}

module.exports = EntityHandler;
