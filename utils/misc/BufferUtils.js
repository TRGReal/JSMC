const UUID = require("uuid");

class BufferUtils {

	cursor;
	buf;

	constructor(buildFrom = 0, isHex) {
		this.cursor = 0;
		if (typeof buildFrom != "number") {
			if (typeof buildFrom === "string" && isHex) {
				this.buf = Buffer.from(buildFrom, "hex");
			} else {
				this.buf = Buffer.from(buildFrom);
			}
		} else {
			this.buf = Buffer.alloc(buildFrom);
		}
	}

	#resizeBuffer(addsize) {
		let newlen = this.cursor + addsize;
		if (this.buf.length < this.cursor + addsize) {
			newlen = newlen - this.buf.length + this.cursor;
		}
		const newb = Buffer.alloc(newlen);
		this.buf.copy(newb);
		this.buf = newb;
	}

	readBoolean() {
		return this.readU8() != 0x00;
	}

	readU8() {
		return this.buf[this.cursor++];
	}

	readU16(isBigEndian = true) {
		const uint16 = this.buf[isBigEndian ? "readUInt16BE" : "readUInt16LE"](
			this.cursor
		);
		this.cursor += 2;
		return uint16;
	}

	readU32(isBigEndian = true) {
		let uint32 = this.buf[isBigEndian ? "readUInt32BE" : "readUInt32LE"](
			this.cursor
		);
		this.cursor += 4;
		return uint32;
	}

	read8() {
		return this.buf.readInt8(this.cursor++);
	}

	read16(isBigEndian = true) {
		const int16 = this.buf[isBigEndian ? "readInt16BE" : "readInt16LE"](
			this.cursor
		);
		this.cursor += 2;
		return int16;
	}

	read32(isBigEndian = true) {
		const int32 = this.buf[isBigEndian ? "readInt32BE" : "readInt32LE"](
			this.cursor
		);
		this.cursor += 4;
		return int32;
	}

	readFloat32(isBigEndian = true) {
		const float32 = this.buf[isBigEndian ? "readFloatBE" : "readFloatLE"](
			this.cursor
		);
		this.cursor += 4;
		return float32;
	}

	readDouble(isBigEndian = true) {
		const double = this.buf[isBigEndian ? "readDoubleBE" : "readDoubleLE"](
			this.cursor
		);
		this.cursor += 8;
		return double;
	}

	readLong(isBigEndian = true) {
		const double = this.buf[isBigEndian ? "readBigInt64BE" : "readBigInt64LE"](
			this.cursor
		);
		this.cursor += 8;
		return double;
	}

	readVarInt() {
		let readMore = true;
		let shift = 0;
		let output = 0;
		while (readMore) {
			let b = this.buf.readUInt8(this.cursor++);
			if (b >= 0x80) {
				readMore = true;
				b ^= 0x80;
			} else {
				readMore = false;
			}

			output |= b << shift;
			shift += 7;
		}

		return output;
	}

	readVarUInt() {
		return this.readVarInt() >>> 0;
	}

	readString() {
		const length = this.readVarUInt();
		return this.readBytes(length).buf.toString("utf8");
	}

	readBytes(length) {
		const buffer = new BufferUtils(
			this.buf.slice(this.cursor, this.cursor + length)
		);
		this.cursor += length;
		return buffer;
	}

	writeBoolean(value) {
		this.writeU8(value ? 1 : 0);
	}

	writeU8(value) {
		this.#resizeBuffer(1);
		if (value > 255 || value < 0) {
			return new RangeError(
				"Value " + value + " outside of UInt8 Range [0 - 255]"
			);
		}
		this.buf[this.cursor++] = value;
	}

	writeU16(value, isBigEndian = true) {
		this.#resizeBuffer(2);
		if (value > 65535 || value < 0) {
			return new RangeError(
				"Value " + value + " outside of UInt16 Range [0 - 65535]"
			);
		}
		if (isBigEndian) {
			this.buf.writeUInt16BE(value, this.cursor);
		} else {
			this.buf.writeUInt16LE(value, this.cursor);
		}
		this.cursor += 2;
	}

	writeU32(value, isBigEndian = true) {
		this.#resizeBuffer(4);
		if (value > 4294967295 || value < 0) {
			return new RangeError(
				"Value " + value + " outside of UInt8 Range [0 - 4294967295]"
			);
		}
		if (isBigEndian) {
			this.buf.writeUInt32BE(value, this.cursor);
		} else {
			this.buf.writeUInt32LE(value, this.cursor);
		}
		this.cursor += 4;
	}

	write8(value) {
		this.#resizeBuffer(1);
		if (value > 127 || value < -128) {
			return new RangeError(
				"Value " + value + " outside of UInt8 Range [-128 - 127]"
			);
		}
		this.buf.writeInt8(value, this.cursor++);
	}

	write16(value, isBigEndian = true) {
		this.#resizeBuffer(2);
		if (value > 32767 || value < -32768) {
			return new RangeError(
				"Value " + value + " outside of UInt16 Range [-32768 - 32767]"
			);
		}
		if (isBigEndian) {
			this.buf.writeInt16BE(value, this.cursor);
		} else {
			this.buf.writeInt16LE(value, this.cursor);
		}
		this.cursor += 2;
	}

	write32(value, isBigEndian = true) {
		this.#resizeBuffer(4);
		if (value > 2147483647 || value < -2147483648) {
			return new RangeError(
				"Value " + value + " outside of UInt8 Range [-2147483648 - 2147483647]"
			);
		}
		if (isBigEndian) {
			this.buf.writeInt32BE(value, this.cursor);
		} else {
			this.buf.writeInt32LE(value, this.cursor);
		}
		this.cursor += 4;
	}

	writeFloat32(value, isBigEndian = true) {
		this.#resizeBuffer(4);
		let temp;
		if (isBigEndian) {
			temp = this.buf.writeFloatBE(value, this.cursor);
		} else {
			temp = this.buf.writeFloatLE(value, this.cursor);
		}
		this.cursor += 4;
		return temp;
	}

	writeDouble(value, isBigEndian = true) {
		this.#resizeBuffer(8);
		let temp;
		if (isBigEndian) {
			temp = this.buf.writeDoubleBE(value, this.cursor);
		} else {
			temp = this.buf.writeDoubleLE(value, this.cursor);
		}
		this.cursor += 8;
		return temp;
	}

	writeLong(value, isBigEndian = true) {
		this.#resizeBuffer(8);
		let temp;
		if (isBigEndian) {
			temp = this.buf.writeBigInt64BE(BigInt(value), this.cursor);
		} else {
			temp = this.buf.writeBigInt64LE(BigInt(value), this.cursor);
		}
		this.cursor += 8;
		return temp;
	}

	writeVarInt(value) {
		this.writeVarUInt(value >>> 0);
	}

	writeVarUInt(value) {
		do {
			let b = value & 0xff;
			if (value >= 0x80) {
				b |= 0x80;
			}
			this.#resizeBuffer(1);
			this.buf.writeUInt8(b, this.cursor++);
			value >>>= 7;
		} while (value != 0);
	}

	writeString(value) {
		let bytes = Buffer.from(value);
		this.writeVarUInt(bytes.length);
		this.writeBytes(bytes);
	}

	writeUUID(uuid) {
		const parsed = Buffer.from(UUID.parse(uuid));

		this.writeBytes(parsed);
	}

	writeBytes(bytes) {
		if (bytes instanceof BufferUtils) {
			bytes = bytes.buf;
		}
		this.#resizeBuffer(bytes.length);
		const b = Buffer.from(bytes);
		b.copy(this.buf, this.cursor);
		this.cursor += b.length;
	}
	dataRemaining() {
		return this.buf.slice(this.cursor);
	}
	static concat(...BufferUtilss) {
		return new BufferUtils(Buffer.concat(BufferUtilss.map((PB) => PB.buf)));
	}
	get length() {
		return this.buf.length;
	}
}

module.exports = BufferUtils;
