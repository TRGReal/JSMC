// to be completed
// intercepts packets from socket.write to compress them if needed by the threshold
// done using zlib
// https://nodejs.org/api/zlib.html
// https://wiki.vg/Protocol#With_compression

const zlib = require('zlib');
const Plugin = require("../Plugin.js");
const Packet = require("../../utils/packet/Packet.js");

class CompressorIntercept extends Plugin {
	
	constructor() {
		super("CompressorIntercept", "1.0", false);
	}
	
	onPreWrite(packet) {
		const PacketBuilder = this.getPacketBuilder();
		const data = packet.getData();
		const client = packet.getClient();
		
		if (client.compressionThreshold > 0 && client.compressionEnabled) {
			console.log("compressing");
			const NewPacket = new PacketBuilder();
			
			NewPacket.writeVarInt(data.length);
			NewPacket.writeBytes(zlib.deflateSync(data, {
				"level": zlib.constants.Z_BEST_COMPRESSION
			}));
			
			packet.setData(NewPacket.getResult());
		}
	}
	
}

module.exports = CompressorIntercept;
