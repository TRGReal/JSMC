const Plugin = require("../Plugin.js");

const dgram = require("dgram");

class LANBroadcastService extends Plugin {
	
	constructor() {
		super("LANBroadcastService", "1.0", false);
	}
	
	onEnable() {
		if (this.getConfig().lan.shouldUse) setInterval(this.sendLANPing.bind(this), 1500);
	}
	
	sendLANPing() {
		const dgramClient = dgram.createSocket("udp4");
			
		const message = Buffer.from(`[MOTD]${this.getConfig().lan.motdMessage}[/MOTD][AD]${this.getConfig().port}[/AD]`);
		
		dgramClient.send(message, 4445, "224.0.2.60", err => {
			dgramClient.close();
		});
	}
	
}

module.exports = LANBroadcastService;