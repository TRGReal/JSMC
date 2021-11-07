const Plugin = require("../Plugin.js");

const PChat = require('prismarine-chat')("1.17.1");
// const tinygradient = require('tinygradient');

const States = { "HANDSHAKING": "HANDSHAKING", "STATUS": "STATUS", "LOGIN": "LOGIN", "GAME": "GAME" };

class PingHandler extends Plugin {

    constructor() {
        super("PingHandler", "1.0", false);
    }

    handlePacket(packet) {
		const PacketBuilder = this.getPacketBuilder();
        const data = packet.getData();
        const name = packet.getName();
        const client = packet.getClient();

        switch (name) {
    		case "request":
    			const response = {};

    			response.version = {};
    			response.version.name = "1.17.1";
    			response.version.protocol = 756;

    			let dynamicMaxPlayers = 1;
    			let sampleList = [];

    			for (const id in this.getClients()) {
    				const player = this.getClients()[id];

    				if (player.state === States.GAME) {
    					dynamicMaxPlayers++;

    					sampleList.push({
    						"name": player.username,
    						"id": player.uuid
    					});
    				}
    			}

    			const maxPlayers = this.getConfig().status.maxPlayers === -1 ? dynamicMaxPlayers : this.getConfig().status.maxPlayers;

    			response.players = {};
    			response.players.max = maxPlayers;
    			response.players.online = sampleList.length;
    			if (this.getConfig().status.showSampleList && sampleList.length !== 0) response.players.sample = sampleList;

    			response.description = {};
    			response.description.text = this.getConfig().status.motd;

    			if (this.getConfig().status.shouldUseFavIcon) response.favIcon = "data:image/png;base64," + fs.readFileSync("./favicon.png").toString("base64");

    			const StatusResponse = new PacketBuilder();

    			StatusResponse.writeVarInt(0x00);
    			StatusResponse.writeString(JSON.stringify(response));

    			client.socket.write(StatusResponse.getResult());

    			break;
    		case "ping":			
    			const PingResponse = new PacketBuilder();

    			PingResponse.writeVarInt(0x01);
    			PingResponse.writeBytes(data.payload);

    			client.socket.write(PingResponse.getResult());

    			break;
    	}
    }

}

// function rgbHex(red, green, blue, alpha) {
// 	const isPercent = (red + (alpha || '')).toString().includes('%');
//
// 	if (typeof red === 'string') {
// 		[red, green, blue, alpha] = red.match(/(0?\.?\d{1,3})%?\b/g).map(component => Number(component));
// 	} else if (alpha !== undefined) {
// 		alpha = Number.parseFloat(alpha);
// 	}
//
// 	if (typeof red !== 'number' ||
// 		typeof green !== 'number' ||
// 		typeof blue !== 'number' ||
// 		red > 255 ||
// 		green > 255 ||
// 		blue > 255
// 	) {
// 		throw new TypeError('Expected three numbers below 256');
// 	}
//
// 	if (typeof alpha === 'number') {
// 		if (!isPercent && alpha >= 0 && alpha <= 1) {
// 			alpha = Math.round(255 * alpha);
// 		} else if (isPercent && alpha >= 0 && alpha <= 100) {
// 			alpha = Math.round(255 * alpha / 100);
// 		} else {
// 			throw new TypeError(`Expected alpha value (${alpha}) as a fraction or percentage`);
// 		}
//
// 		alpha = (alpha | 1 << 8).toString(16).slice(1);
// 	} else {
// 		alpha = '';
// 	}
//
// 	return ((blue | green << 8 | red << 16) | 1 << 24).toString(16).slice(1) + alpha;
// }

module.exports = PingHandler;
