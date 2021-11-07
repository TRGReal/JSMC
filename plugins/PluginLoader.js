const fs = require('fs');

class PluginLoader {

    #utils;
    #plugins;
    #clients;
    #config;
    #buffers;
    #lastTickTime;

    constructor(utils, clients, config, buffers) {
        utils.LogUtils.info("Starting PluginLoader...");
        this.#utils = utils;
        this.#plugins = [];
        this.#clients = clients;
        this.#config = config;
        this.#buffers = buffers;
    }

    loadPlugins() {
        this.#utils.LogUtils.info("Loading plugins...");

        const implDir = fs.readdirSync("./plugins/impl/");

        implDir.forEach(fileName => {
            const fileLoadTime = new Date().getTime();

            if (fileName.endsWith(".js")) {
				this.#utils.LogUtils.debug("Starting " + fileName + " plugin...");

                const PluginFile = require("./impl/" + fileName);
                const LoadedPlugin = new PluginFile();
				LoadedPlugin.preparePlugin(this.#utils, this.#clients, this.#config, this.#buffers, this);

                if (!LoadedPlugin.hasCustomStartMessage()) this.#utils.LogUtils.info("Started " + LoadedPlugin.getName() + " v" + LoadedPlugin.getVersion() + " [" + (new Date().getTime() - fileLoadTime) + "ms].");

                this.#plugins.push(LoadedPlugin);

                LoadedPlugin.onEnable();
            }
        });

        this.#utils.LogUtils.info("Starting ticker...");

        this.#lastTickTime = new Date().getTime();
        setInterval(this.onTick.bind(this), 50);
    }

    handlePacket(packet) {
        this.#plugins.forEach(plugin => {
            plugin.handlePacket(packet);
        });
    }

	onClientDisconnect(client) {
		this.#plugins.forEach(plugin => {
			plugin.onDisconnect(client);
		});
	}

    onClientJoin(client) {
        this.#plugins.forEach(plugin => {
            plugin.onJoin(client);
        });
    }

    onClientLogin(client) {
        this.#plugins.forEach(plugin => {
            plugin.onLogin(client);
        });
    }

    onTick() {
        this.#plugins.forEach(plugin => {
            plugin.onTick();
        });

        const tickTime = new Date().getTime() - this.#lastTickTime;
        const roundedMulti = Math.round((tickTime / 50) * 100) / 100;

        if (tickTime >= 1000) {
            this.#utils.LogUtils.warn("Tick took " + roundedMulti + "x longer than it should have! (" + tickTime + "ms).");
        }

        this.#lastTickTime = new Date().getTime();
    }

}

module.exports = PluginLoader;
