const PacketBuilder = require("../utils/packet/PacketBuilder");

class Plugin {

    #utils;
    #clients;
    #config;
    #buffers;
	#name;
    #PluginLoader;
	#version;
	#customStartMessage;

	constructor(name, version, customStartMessage) {
		this.#name = name;
		this.#version = version;
		this.#customStartMessage = customStartMessage;
	}

    preparePlugin(utils, clients, config, buffers, PluginLoader) {
        this.#utils = utils;
        this.#clients = clients;
        this.#config = config;
        this.#buffers = buffers;
        this.#PluginLoader = PluginLoader;
    }

    getLogUtils() {
        return this.#utils.LogUtils;
    }

    getPacketBuilder() {
        return PacketBuilder;
    }

    getClients() {
        return this.#clients;
    }

    getConfig() {
        return this.#config;
    }

	getDimensionsBuffer() {
        return this.#buffers.dimensions;
    }

    getCodecBuffer() {
        return this.#buffers.codec;
    }

	getVersion() {
		return this.#version;
	}

	getName() {
		return this.#name;
	}

	getKeyPair() {
		return this.#utils.keyPair;
	}

	hasCustomStartMessage() {
		return this.#customStartMessage;
	}

    getPluginLoader() {
        return this.#PluginLoader;
    }

	onEnable() {

	}

	handlePacket() {

	}

	onDisconnect() {

	}

    onLogin() {

    }

    onJoin() {

    }

    onTick() {
        
    }
	
	onPreWrite() {
	
	}

}

module.exports = Plugin;
