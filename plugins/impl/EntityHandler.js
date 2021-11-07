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

                    eClient.socket.write(EntityMetadata.getResult());
                }

                break;
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

    sendEntities(client, entities) {
        if (!entities) return this.sendEntities(client, Object.values(this.getClients()));

        // Removes entities that aren't in the game yet.
        entities.forEach(entity => {
            const index = entities.indexOf(entity);
            if (entity.state !== "GAME" || entity.id === client.id) entities.splice(index, index);
        });

        console.log(entities);

        if (entities.length > 0) {
            const PacketBuilder = this.getPacketBuilder();
            const PlayerInfoIntro = new PacketBuilder();

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

                SpawnPlayer.writeVarInt(0x04);
                SpawnPlayer.writeVarInt(entity.id);
                SpawnPlayer.writeUUID(entity.uuid);
                SpawnPlayer.writeDouble(0);
                SpawnPlayer.writeDouble(5);
                SpawnPlayer.writeDouble(0);
                SpawnPlayer.write8(0);
                SpawnPlayer.write8(0);

                client.socket.write(SpawnPlayer.getResult());
            });
        }
    }

}

module.exports = EntityHandler;
