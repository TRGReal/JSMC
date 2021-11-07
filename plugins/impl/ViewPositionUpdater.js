const Plugin = require("../Plugin.js");

class ViewPositionUpdater extends Plugin {

	constructor() {
		super("ViewPositionUpdater", "1.0", false);
	}

    handlePacket(packet) {
		const PacketBuilder = this.getPacketBuilder();
		
        if (packet.getName() === "player_position" || packet.getName() === "player_position_look") {
            const chunkX = Math.floor(packet.getData().x / 16);
            const chunkZ = Math.floor(packet.getData().z / 16);

            const UpdateViewPosition = new PacketBuilder();

            UpdateViewPosition.writeVarInt(0x49);
            UpdateViewPosition.writeVarInt(chunkX);
            UpdateViewPosition.writeVarInt(chunkZ);

            packet.getClient().socket.write(UpdateViewPosition.getResult());
        }
    }

}

module.exports = ViewPositionUpdater;
