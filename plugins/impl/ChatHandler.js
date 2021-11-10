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

				const builtMessage = new PChat.MessageBuilder();
				builtMessage.setTranslate("chat.type.text");
				
				const usernameWith = new PChat.MessageBuilder();
				usernameWith.setText(client.username);
				usernameWith.setClickEvent("suggest_command", "/msg " + client.username + " ");
				usernameWith.setInsertion(client.username);

				const messageWith = this.getConfig().chat.allowChatColour ? PChat.MessageBuilder.fromString(data.message) : new PChat.MessageBuilder().setText(data.message);

				builtMessage.addWith(usernameWith);
				builtMessage.addWith(messageWith);

				ChatMessage.writeString(JSON.stringify(builtMessage.toJSON()));
				ChatMessage.write8(0);
				ChatMessage.writeUUID(client.uuid);

				for (const bClientID in this.getClients()) {
					const bClient = this.getClients()[bClientID];

					if (bClient.state === "GAME") {
						if (bClient.settings.chatMode === 0) {
							bClient.socket.write(ChatMessage.getResult());
						}
					}
				}
			} else {
				if (data.message === "/totemtest") {
					const EntityStatus = new PacketBuilder();

					EntityStatus.writeVarInt(0x1B);

					EntityStatus.write32(client.id);
					EntityStatus.write8(35);

					client.socket.write(EntityStatus.getResult());
				} else if (data.message === "/advancementtest") {
					const ChatMessage = new PacketBuilder();

					const BuiltMessage = new PChat.MessageBuilder();

					BuiltMessage.setTranslate("chat.type.advancement.task");

					const AdvancementWith = new PChat.MessageBuilder();

					AdvancementWith.setInsertion(client.username);
					AdvancementWith.setText(client.username);

					const TextWith = new PChat.MessageBuilder();

					TextWith.setTranslate("achievement.openInventory");

					BuiltMessage.addWith(AdvancementWith);
					BuiltMessage.addWith(TextWith);

					ChatMessage.writeVarInt(0x0F);
					ChatMessage.writeString(JSON.stringify(BuiltMessage.toJSON()));
					ChatMessage.write8(0);
					ChatMessage.writeUUID("00000000-0000-0000-0000-000000000000");

					client.socket.write(ChatMessage.getResult());
				}
			}
		}
	}

	onDisconnect(client) {
		const PacketBuilder = this.getPacketBuilder();
		const ChatMessage = new PacketBuilder();

		const builtMessage = new PChat.MessageBuilder();

		builtMessage.setTranslate("multiplayer.player.quit");
		builtMessage.setColor("yellow");

		const usernameWith = new PChat.MessageBuilder();

		usernameWith.setInsertion(client.username);
		usernameWith.setText(client.username);

		builtMessage.addWith(usernameWith);

		ChatMessage.writeVarInt(0x0F);
		ChatMessage.writeString(JSON.stringify(builtMessage.toJSON()));
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

		const builtMessage = new PChat.MessageBuilder();

		// {
		// 	"translate": "chat.type.text",
		// 	"with": [
		// 		{
		// 			"text":"Herobrine",
		// 			"clickEvent": {
		// 				"action": "suggest_command",
		// 				"value":"/msg Herobrine "
		// 			},
		// 			"hoverEvent": {
		// 				"action":"show_entity",
		// 				"value": "{id:f84c6a79-0a4e-45e0-879b-cd49ebd4c4e2,name:Herobrine}"
		// 			},
		// 			"insertion": "Herobrine"
		// 		},
		// 		{
		// 			"text": "I don't exist"
		// 		}]
		// 	}

		builtMessage.setTranslate("multiplayer.player.joined");
		builtMessage.setColor("yellow");

		const usernameWith = new PChat.MessageBuilder();

		usernameWith.setInsertion(client.username);
		usernameWith.setText(client.username);

		builtMessage.addWith(usernameWith);

		ChatMessage.writeVarInt(0x0F);
		ChatMessage.writeString(JSON.stringify(builtMessage.toJSON()));
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
