class Entity {

    #uuid;
    #name;

    constructor(uuid, name) {
        this.#uuid = uuid;
        this.#name = name;
    }

    getName() {
        return this.#name;
    }

    getUUID() {
        return this.#uuid;
    }

}

module.exports = Entity;
