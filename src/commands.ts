import { exec } from "child_process";

// --| Run Command ------------------------------
function runCommand(command: string) {
    exec(command, (err: any, _stdout: any, _stderr: any) => {
        if (err) {
            console.log(err)
        }

        if (_stdout) {
            console.log(_stdout)
        }

        if (_stderr) {
            console.log(_stderr)
        }
    });
}

module.exports = { runCommand };