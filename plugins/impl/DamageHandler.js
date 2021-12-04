const Plugin = require("../Plugin.js");

class DamageHandler extends Plugin {

    constructor() {
        super("DamageHandler", "1.0", false);
    }
    // so that's how the minesucht fly bypassed
    // yep. but instead of 0.05 bukkit events use 1.0/255
    // because you can detect the motion used in minesucht
    //then how did it flag my anticheat oh ig
    handlePacket(packet) {
        const PacketBuilder = this.getPacketBuilder();
        const client = packet.getClient();
        const data = packet.getData();
        const name = packet.getName();

        if ((new Date().getTime() - client.joinTime) > 3000) {
            switch (name) {
                case "player_position":
                case "player_position_look":
                case "player_rotation":
                case "player_movement":
                    {
                        if (isOnGround(client.entity.getPosition().y)) {
                        // if (client.entity.onGround()) {
                            // if the player is on the ground and their y diff between ground pos
                            // and current pos is long enough then damage the player and show animation

                            const yDiff = client.entity.getGroundPosition().y - client.entity.getPosition().y;
                            const damage = (yDiff * 0.5) - 1.5;

                            if (damage > 0) {
                                client.entity.setHealth(Math.max(0, client.entity.getHealth() - damage));

                                const EntityAnimation = new PacketBuilder();

                                EntityAnimation.writeVarInt(0x06);
                                EntityAnimation.writeVarInt(client.id);
                                EntityAnimation.writeU8(1);

                                const UpdateHealth = new PacketBuilder();
                                
                                UpdateHealth.writeVarInt(0x52);
                                UpdateHealth.writeFloat32(client.entity.getHealth());
                                UpdateHealth.writeVarInt(client.entity.getFood());
                                UpdateHealth.writeFloat32(client.entity.getFoodSaturation());

                                // nah, the only reason you see the respawn screen is because the
                                // server sends an update health packet with health 0
                            
                                for (const lClientID in this.getClients()) {
                                    const lClient = this.getClients()[lClientID];

                                    if (lClient.state === "GAME") {
                                        lClient.socket.write(EntityAnimation.getResult());
                                    }
                                }
                                // fixed
                                client.socket.write(UpdateHealth.getResult()); //i haven't fixed that yet, yeah but i also need to fix the join issue
                                client.entity.setGroundPosition();
                            }

                            client.entity.startGroundUpdates();
                        } else {
                            if (client.entity.getGroundUpdates()) {
                                client.entity.setGroundPosition();
                                client.entity.stopGroundUpdates();
                            }
                        }
                    }

                    break;
                }
            }
    }
}

function isOnGround(y) {
    return y % 0.015625 == 0;
}

module.exports = DamageHandler;