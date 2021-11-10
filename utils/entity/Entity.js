class Entity {

    #uuid;
    #name;
    #x;
    #y;
    #z;
    #yaw;
    #pitch;
    #onGround;
    #totalUpdates;
    #lastX;
    #lastY;
    #lastZ;
    #onFire;
    #sneaking;
    #sprinting;

    constructor(uuid, name, spawnPosition) {
        this.#uuid = uuid;
        this.#name = name;
        this.#totalUpdates = {};

        this.#x = spawnPosition.x;
        this.#y = spawnPosition.y;
        this.#z = spawnPosition.z;

        this.#lastX = spawnPosition.x;
        this.#lastY = spawnPosition.y;
        this.#lastZ = spawnPosition.z;

        this.#yaw = spawnPosition.yaw;
        this.#pitch = spawnPosition.pitch;

        this.#onFire = false;

        this.#sneaking = false;
        this.#sprinting = false;
    }

    getName() {
        return this.#name;
    }

    getUUID() {
        return this.#uuid;
    }

    setPosition(x, y, z) {
        this.#lastX = this.#x;
        this.#lastY = this.#y;
        this.#lastZ = this.#z;

        this.#x = x;
        this.#y = y;
        this.#z = z;
    }

    setAngle(yaw, pitch) {
        this.#yaw = yaw;
        this.#pitch = pitch;
    }

    setGround(onGround) {
        this.#onGround = onGround;
    }

    getPosition() {
        return { "x": this.#x, "y": this.#y, "z": this.#z };
    }

    getLastPosition() {
        return { "x": this.#lastX, "y": this.#lastY, "z": this.#lastZ };
    }

    getAngle() {
        return { "yaw": this.#yaw, "pitch": this.#pitch };
    }

    onGround() {
        return this.#onGround;
    }

    updateTotal(type) {
        this.#totalUpdates[type] = true;

        // Prevents update total from including both the position_angle and position to prevent packet collisions (in EntityHandler).
        if (Object.keys(this.#totalUpdates).includes("position_angle")) {
            delete this.#totalUpdates.angle;
            delete this.#totalUpdates.position;
        }
    }

    getUpdateTotal() {
        return this.#totalUpdates;
    }

    resetUpdateTotal() {
        this.#totalUpdates = [];
    }

    isOnFire() {
        return this.#onFire;
    }

    setOnFire(type) {
        this.#onFire = type;
    }

    setSneaking(type) {
        this.#sneaking = type;
    }

    setSprinting(type) {
        this.#sprinting = type;
    }

    isSneaking() {
        return this.#sneaking;
    }

    isSprinting() {
        return this.#sprinting;
    }

}

module.exports = Entity;
