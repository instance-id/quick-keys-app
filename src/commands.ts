
const util = require('util');
const exec = util.promisify(require('node:child_process').exec);

// --| Run Command ------------------------------
async function runCommand(command: string) {
    var output: string = "";

    const { stdout, stderr } = await exec(command);
    if (stderr) { console.log(stderr) }
    if (stdout) { output = stdout; }
    return output;
}

module.exports = { runCommand };