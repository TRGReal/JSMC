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
	#health;
	#food;
	#foodSaturation;
    #groundX;
    #groundY;
    #groundZ;
    #groundUpdates;

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

        this.#groundX = spawnPosition.x;
        this.#groundY = spawnPosition.y;
        this.#groundZ = spawnPosition.z;

        this.#yaw = spawnPosition.yaw;
        this.#pitch = spawnPosition.pitch;

        this.#onFire = false;
		this.#health = 20;
		this.#food = 20;
		this.#foodSaturation = 5;

        this.#sneaking = false;
        this.#sprinting = false;

        this.#groundUpdates = true;
    }

    getName() {
        return this.#name;
    }

    getUUID() {
        return this.#uuid;
    }

    setPosition(x, y, z) {
        this.#x = x;
        this.#y = y;
        this.#z = z;
    }

    resetLastPosition() {
        this.#lastX = this.#x;
        this.#lastY = this.#y;
        this.#lastZ = this.#z;
    }

    setAngle(yaw, pitch) {
        this.#yaw = yaw;
        this.#pitch = pitch;
    }

    setGroundPosition() {
        this.#groundX = this.#x;
        this.#groundY = this.#y;
        this.#groundZ = this.#z;
    }

    getGroundPosition() {
        return { "x": this.#groundX, "y": this.#groundY, "z": this.#groundZ };
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

    setHealth(health) {
		this.#health = health;
	}
	
	getHealth() {
		return this.#health;
	}
	
	getFood() {
		return this.#food;
	}
	
	setFood(amount) {
		this.#food = amount;
	}
	
	getFoodSaturation() {
		return this.#foodSaturation;
	}
	
	setFoodSaturation(saturation) {
		this.#foodSaturation = saturation;
	}
    
    getGroundUpdates() {
        return this.#groundUpdates;
    }

    startGroundUpdates() {
        this.#groundUpdates = true;
    }

    stopGroundUpdates() {
        this.#groundUpdates = false;
    }

}

module.exports = Entity;
