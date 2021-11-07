const Plugin = require("../Plugin.js");

const defaults = {
    "kickTimeout": 30000,
    "checkTimeoutInterval": 2000
};

class KeepAliveHandler extends Plugin {

    constructor() {
        super("KeepAliveHandler", "1.0", false);
    }

    keepAliveLoop(client) {
		const PacketBuilder = this.getPacketBuilder();

        if (!client.keepAlive.started) return;

        const elapsed = new Date().getTime() - client.keepAlivelastKeepAlive;

        if (elapsed > defaults.kickTimeout) {
            this.getLogUtils.debug(client.username + " has been disconnected for failing to respond to keep alives.");

            return client.socket.destroy();
        }

        client.keepAlive.sendKeepAliveTime = new Date().getTime();

        const KeepAlivePacket = new PacketBuilder();

        KeepAlivePacket.writeVarInt(0x21);
        KeepAlivePacket.writeLong(Math.floor(Math.random() * 2147483648));

        client.socket.write(KeepAlivePacket.getResult());
    }

    onKeepAlive(client) {
        if (client.keepAlive.sendKeepAliveTime) client.latency = new Date().getTime() - client.keepAlive.sendKeepAliveTime;

        client.keepAlive.lastKeepAlive = new Date().getTime();

		const PacketBuilder = this.getPacketBuilder();
		const PlayerInfo = new PacketBuilder();

		PlayerInfo.writeVarInt(0x36);
		PlayerInfo.writeVarInt(2);
		PlayerInfo.writeVarInt(1);
		PlayerInfo.writeUUID(client.uuid);
		PlayerInfo.writeVarInt(client.latency);

		const clients = this.getClients();

		for (const lClientID in clients) {
			const lClient = clients[lClientID];

			if (lClient.state === "GAME") {
				lClient.socket.write(PlayerInfo.getResult());
			}
		}
    }

    handlePacket(packet) {
		const client = packet.getClient();

		if (!client.keepAlive) {
			client.keepAlive = {};
			client.keepAlive.started = false;
			client.keepAlive.lastKeepAlive = new Date().getTime();
			client.keepAlive.keepAliveTimer = setInterval(this.keepAliveLoop.bind(this, client), defaults.checkTimeoutInterval);
			client.keepAlive.sendKeepAliveTime = null;
		}

        if (packet.getName() === "keep_alive" && client.keepAlive.started) this.onKeepAlive(client);
    }

	onDisconnect(client) {
        if (client.state === "GAME") client.keepAlive.started = false;
	}

	// TODO: Handle client disconnect.

}

module.exports = KeepAliveHandler;
