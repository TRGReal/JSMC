class Packet {

    #name;
    #data;
    #client;

    constructor(name, data, client) {
        this.#name = name;
        this.#data = data;
        this.#client = client;
    }

    getName() {
        return this.#name;
    }

    getData() {
        return this.#data;
    }

    getClient() {
        return this.#client;
    }

}

module.exports = Packet;
