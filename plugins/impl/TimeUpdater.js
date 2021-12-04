const Plugin = require("../Plugin.js");

class TimeUpdater extends Plugin {

    #currentTime;

	constructor() {
		super("TimeUpdater", "1.0", false);

        this.#currentTime = 0;
	}

    onTick() {
        ++this.#currentTime;
        this.sendTimeUpdate();
    }

    onLogin() {
        this.sendTimeUpdate();
    }

    sendTimeUpdate() {
        const PacketBuilder = this.getPacketBuilder();
        const TimeUpdate = new PacketBuilder();

        TimeUpdate.writeVarInt(0x58);
        TimeUpdate.writeLong(this.#currentTime);
        TimeUpdate.writeLong(this.#currentTime % 24000);

        for (const lClientID in this.getClients()) {
            const lClient = this.getClients()[lClientID];

            if (lClient.state === "GAME") {
                lClient.socket.write(TimeUpdate.getResult());
            }
        }
    }

}

module.exports = TimeUpdater;
