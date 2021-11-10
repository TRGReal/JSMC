const Plugin = require("../Plugin.js");

class EncryptionIntercept extends Plugin {
	
	constructor() {
		super("EncryptionIntercept", "1.0", false);
	}
	
	onPreWrite(packet) {
		const data = packet.getData();
		const client = packet.getClient();
		
		if (client.encryption.shouldEncrypt) {
			client.encryption.cipher.write(data);
		} else {
			client.socket.realWrite(data);
		}
		
		packet.setCancelled(true);
	}
	
}

module.exports = EncryptionIntercept;