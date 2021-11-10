const chalk = require('chalk');

class LogUtils {
	
	#isDebug;
	
	constructor(isDebug) {
		this.#isDebug = isDebug;
	}

	generateTimeMsg() {
		return new Date().toLocaleString();
	}

	debug(msg) {
		if (!this.#isDebug) return;

		const time = this.generateTimeMsg();

		console.log(chalk.gray(`[${time}] [DEBUG] ${msg}`));
	}

	success(msg) {
		const time =  this.generateTimeMsg();

		console.log(chalk.green.bold(`[${time}] [SUCCESS] ${msg}`));
	}

	general(msg) {
		const time = this.generateTimeMsg();

		console.log(`[${time}] ${msg}`)
	}

	info(msg) {
		const time = this.generateTimeMsg();

		console.log(`[${time}] [INFO] ${msg}`);
	}

	error(msg) {
		const time = this.generateTimeMsg();

		console.log(chalk.red.bold(`[${time}] [ERROR] ${msg}`));
	}

	warn(msg) {
		const time = this.generateTimeMsg();

		console.log(chalk.hex("ffcc00")(`[${time}] [WARNING] ${msg}`));
	}
}

module.exports = (isDebug) => {
	return new LogUtils(isDebug);
};