const startTime = new Date().getTime();

const net = require('net');
const fs = require('fs');
const NodeRSA = require('node-rsa');
const NBT = require('prismarine-nbt');

const BufferUtils = require('./utils/misc/BufferUtils.js');
const PacketBuilder = require('./utils/packet/PacketBuilder.js');
const States = { "HANDSHAKING": "HANDSHAKING", "STATUS": "STATUS", "LOGIN": "LOGIN", "GAME": "GAME" };
const config = require('./config.json');
const LogUtils = require('./utils/logs/LogUtils.js')(config.debug);
const Packet = require("./utils/packet/Packet.js");

LogUtils.info("Starting Minecraft server...");
LogUtils.info("Generating keypair (1024-bit).");

const serverKeyPair = NodeRSA({ b: 1024 });

const clientIDRef = {};

LogUtils.info("Preparing dimension codec and dimensions for login data...");

const dimensionCodec = JSON.parse(fs.readFileSync('./loginData/dimensionCodec.json').toString());
const dimensions = JSON.parse(fs.readFileSync('./loginData/dimensions.json').toString());

const codecBuffer = NBT.writeUncompressed(dimensionCodec);
const dimensionsBuffer = NBT.writeUncompressed(dimensions);

LogUtils.info("Starting services...");

const PacketProcessorFile = require("./utils/packet/PacketProcessor.js");
const PacketProcessor = new PacketProcessorFile(LogUtils);

const PluginLoaderFile = require("./plugins/PluginLoader.js");
const PluginLoader = new PluginLoaderFile({ LogUtils, "keyPair": serverKeyPair }, clientIDRef, config, { "dimensions": dimensionsBuffer, "codec": codecBuffer });
PluginLoader.loadPlugins();

LogUtils.info("Starting TCP listening server.");

const server = net.createServer(socket => {

	LogUtils.debug("New client connecting to server at " + socket.remoteAddress + ".");

	const client = {};

	client.joinTime = new Date().getTime();
	client.socket = socket;
	client.id = generateClientID() + "";
	client.state = "HANDSHAKING";
	client.encryption = {
		"shouldEncrypt": false,
		"shouldRegisterDecipher": false
	};
	client.disconnected = false;

	clientIDRef[client.id] = client;

	// Write encryption intercept.
	socket.realWrite = socket.write;
	socket.write = buffer => {
		if (!client.disconnected) {
			if (client.encryption.shouldEncrypt) {
				client.encryption.cipher.write(buffer);
			} else {
				socket.realWrite(buffer);
			}
		}
	}

	PluginLoader.onClientJoin(client);

	socket.on("data", data => {
		try {
			if (client.encryption.shouldRegisterDecipher) {
				client.encryption.shouldRegisterDecipher = false;

				client.encryption.decipher.on("data", data => {
					handleIncomingData(data, client);
				});

				LogUtils.debug("Registed client AES decipher for " + client.username + ", now forwarding packets.");
			}

			if (!client.encryption.shouldEncrypt) {
				handleIncomingData(data, client);
			} else {
				client.encryption.decipher.write(data);
			}
		} catch (err) {
			switch (client.state) {
				case "STATUS":
					// Leave out break to let NodeJS pass message on (virtually the same thing).
				case "HANDSHAKING":
					LogUtils.debug("Client in handshake was disconnected for sending invalid packets. [" + socket.remoteAddress + "]");
					socket.destroy();

					break;
				case "LOGIN":
					const LoginDisconnect = new PacketBuilder();

					LoginDisconnect.setLoginDisconnect("Sent an invalid packet.");
					socket.write(LoginDisconnect.getResult());

					break;
				case "GAME":
					const GameDisconnect = new PacketBuilder();

					GameDisconnect.setGameDisconnect("Sent an invalid packet.");
					socket.write(GameDisconnect.getResult());

					break;
			}

			console.log(err);
		}
	});

	socket.on("close", () => {
		client.disconnected = true;
		if (client.state === "GAME") PluginLoader.onClientDisconnect(client);

		socket.destroy();

		delete clientIDRef[client.id];
	});

	socket.on("error", err => {
		LogUtils.debug("Connection error from " + socket.remoteAddress + ".");

		socket.destroy();
	});

});

server.on('listening', () => {
	LogUtils.info("Listening for connections... [" + (new Date().getTime() - startTime) / 1000 + " seconds]");
});

function handleIncomingData(data, client) {
	const processed = PacketProcessor.handlePacket(data, client);

	if (processed.error) return;

	const queue = processed.queue;

	PluginLoader.handlePacket(processed.packet);

	if (queue.length !== 0) {
		queue.forEach(packet => {
			handleIncomingData(packet, client);
		});
	}
}

function generateClientID(preId = 1) {
	if (true) { // stops repetitive callback errors
		let repeat = false;

		for (var id in clientIDRef) {
			if (id == preId) {
				preId++;
				repeat = true;

				continue;
			}
		}

		return repeat ? generateClientID(preId) : preId;
	}
}

server.listen(config.port);

// const net = require('net');
//
// const server = net.createServer(socket => {
//
// 	const client = net.Socket();
// 	client.connect(25565, "mc.hypixel.io");
//
// 	socket.on('data', data => {
// 		if (data.toString().includes("127.0.0.1")) {
// 			data = Buffer.from(data.toString(), "mc.hypixel.io");
// 		}
//
// 		client.write(data);
//
// 		console.log(data);
// 		console.log("^ c");
// 	});
//
// 	client.on('data', data => {
// 		socket.write(data);
//
// 		console.log(data);
// 		console.log("^ s");
// 	});
//
// 	socket.on('close', () => {
// 		socket.destroy();
// 		client.destroy();
// 	});
//
// 	client.on('close', () => {
// 		client.destroy();
// 		socket.destroy();
// 	});
//
// });
//
// server.listen(25565);
