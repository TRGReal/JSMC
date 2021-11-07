const PChat = require('prismarine-chat')("1.17.1");

const Plugin = require("../Plugin.js");

class ChatHandler extends Plugin {

	constructor() {
		super("ChatHandler", "1.0", false);
	}

	handlePacket(packet) {
		const PacketBuilder = this.getPacketBuilder();
		const client = packet.getClient();
		const name = packet.getName();
		const data = packet.getData();

		if (name === "chat") {
			if (!data.message.startsWith("/")) {
				const ChatMessage = new PacketBuilder();

				ChatMessage.writeVarInt(0x0F);

				const chatPrefix = this.getConfig().chat.chatPrefix.replace("%player%", client.username);

				if (this.getConfig().chat.allowChatColour) {
					const builtMessage = PChat.MessageBuilder.fromString(chatPrefix + data.message);

					ChatMessage.writeString(JSON.stringify(builtMessage.toJSON()));
				} else {
					const builtMessage = PChat.MessageBuilder.fromString(chatPrefix);
					const extraMessage = new PChat.MessageBuilder();

					extraMessage.setText(data.message);

					builtMessage.addExtra(extraMessage);

					ChatMessage.writeString(JSON.stringify(builtMessage.toJSON()));
				}

				ChatMessage.write8(0);
				ChatMessage.writeUUID(client.uuid);

				for (const bClientID in this.getClients()) {
					const bClient = this.getClients()[bClientID];

					if (bClient.state === "GAME") {
						bClient.socket.write(ChatMessage.getResult());
					}
				}
			} else {
				if (data.message === "/totemtest") {
					const TotemPacket = new PacketBuilder();

					TotemPacket.writeVarInt(0x24);

					TotemPacket.write32(52);
					TotemPacket.writeBoolean(false);
					TotemPacket.writeDouble(0);
					TotemPacket.writeDouble(5);
					TotemPacket.writeDouble(0);
					TotemPacket.writeFloat32(0);
					TotemPacket.writeFloat32(0);
					TotemPacket.writeFloat32(0);
					TotemPacket.writeFloat32(0);
					TotemPacket.write32(1);

					client.socket.write(TotemPacket.getResult());

					const EntityStatus = new PacketBuilder();

					EntityStatus.writeVarInt(0x1B);

					EntityStatus.write32(client.id);
					EntityStatus.write8(35);

					client.socket.write(TotemPacket.getResult());
				}
			}
		}
	}

	onDisconnect(client) {
		const PacketBuilder = this.getPacketBuilder();
		const ChatMessage = new PacketBuilder();

		const message = PChat.MessageBuilder.fromString(this.getConfig().chat.leaveMessage.replace("%player%", client.username));

		ChatMessage.writeVarInt(0x0F);
		ChatMessage.writeString(JSON.stringify(message));
		ChatMessage.write8(0);
		ChatMessage.writeUUID("00000000-0000-0000-0000-000000000000");

		for (const bClientID in this.getClients()) {
			const bClient = this.getClients()[bClientID];

			if (bClient.state === "GAME") {
				bClient.socket.write(ChatMessage.getResult());
			}
		}
	}

	onLogin(client) {
		const PacketBuilder = this.getPacketBuilder();
		const ChatMessage = new PacketBuilder();

		const message = PChat.MessageBuilder.fromString(this.getConfig().chat.joinMessage.replace("%player%", client.username));

		ChatMessage.writeVarInt(0x0F);
		ChatMessage.writeString(JSON.stringify(message));
		ChatMessage.write8(0);
		ChatMessage.writeUUID("00000000-0000-0000-0000-000000000000");

		for (const bClientID in this.getClients()) {
			const bClient = this.getClients()[bClientID];

			if (bClient.state === "GAME") {
				bClient.socket.write(ChatMessage.getResult());
			}
		}
	}

}

module.exports = ChatHandler;
