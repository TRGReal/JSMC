const PChat = require('prismarine-chat')('1.17.1').MessageBuilder;

const BufferUtils = require("../misc/BufferUtils.js");

class PacketBuilder extends BufferUtils {

    getResult() {
        const PacketBuffer = new BufferUtils();

        PacketBuffer.writeVarInt(this.buf.length);
        PacketBuffer.writeBytes(this.buf);

        return PacketBuffer.buf;
    }

    setLoginDisconnect(reason) {
        this.writeVarInt(0x00);
        this.writeString(JSON.stringify(PChat.fromString(reason)));
    }

    setGameDisconnect(reason) {
        this.writeVarInt(0x1A);
        this.writeString(JSON.stringify(PChat.fromString(reason)));
    }

}

module.exports = PacketBuilder;
