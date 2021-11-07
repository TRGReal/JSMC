// to be completed
// intercepts packets from socket.write to compress them if needed by the threshold
// done using zlib
// https://nodejs.org/api/zlib.html
// https://wiki.vg/Protocol#With_compression

const Plugin = require("../Plugin.js");

class CompressorIntercept extends Plugin {
	
	constructor() {
		super("CompressorIntercept", "1.0", false);
	}
	
}

module.exports = CompressorIntercept;