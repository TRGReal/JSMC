class RawOutboundPacket {
	
	#data;
	#client;
	#cancelled;
	
	constructor(data, client) {
		this.#data = data;
		this.#client = client;
		this.#cancelled = false;
	}
	
	getData() {
		return this.#data
	}
	
	setData(data) {
		this.#data = data;
	}
	
	getClient() {
		return this.#client;	
	}
	
	isCancelled() {
		return this.#cancelled;
	}
	
	setCancelled(cancelled) {
		this.#cancelled = cancelled;
	}
	
}

module.exports = RawOutboundPacket;