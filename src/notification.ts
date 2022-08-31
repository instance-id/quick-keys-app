import { XencelabsQuickKeys } from "@xencelabs-quick-keys/node";

const path = require('path');
const fs = require('node:fs');
const JSON5 = require('json5');
const fsPromises = require('node:fs/promises');

let notification: string;
// let device: XencelabsQuickKeys;
let previousMTime = new Date(0);
var colorLerp = require('color-lerp');

// --| Set Device -------------------------------
// function setDevice(this: any, device: XencelabsQuickKeys) {
//     this.device = device;
// }

// --| Sleep for duration -----------------------
function sleep(time: number | undefined) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

async function readNotification(dev: XencelabsQuickKeys) {
    var notifyData = await fsPromises.readFile(notification);
    var notifyJson = JSON5.parse(notifyData);
    handleNotification({ message: notifyJson.text, duration: notifyJson.duration, device: dev });
}

interface namedParamaters{
    message: string,
    duration?: number,
    color1?: string,
    color2?: string,
    device: XencelabsQuickKeys
}

// --| Read Notification ------------------------
async function handleNotification({message, duration, color1, color2, device}: namedParamaters) {
    let start_color = color1 ? color1 : "hsl(0, 100%, 50%)";
    let end_color = color2 ? color2 : "hsl(317, 100%, 50%)";
    let duration_value = duration ? duration : 4;

    try {
        await device.showOverlayText(duration_value, message)

        var lerp_start = colorLerp(start_color, end_color, 50, 'rgb');
        var lerp_end = colorLerp(end_color, start_color, 50, 'rgb');

        var total = 49;
        var time = 0;
        var time2 = 0;
        var lastValue: any;
        var interval = setInterval(async () => {
            time++;
            if (time > total) {
                clearInterval(interval);
                return;
            }
            var value = lerp_start[time];
            var color = value.replace(/[^0-9,.]/g, '').split(',').map(Number);

            if (lastValue !== value) {
                await device.setWheelColor(color[0], color[1], color[2]);
                lastValue = value;
            }
        }, 100);


        // --| Testing color change sequences ---
        await sleep(50 * 51).then(async () => {
            return;

            var interval2 = setInterval(async () => {
                time2++;
                if (time > total) {
                    clearInterval(interval2);
                    return;
                }
                var value = lerp_end[time2];
                var color = value.replace(/[^0-9,.]/g, '').split(',').map(Number);

                if (lastValue !== value) {
                    await device.setWheelColor(color[0], color[1], color[2]);
                    lastValue = value;
                }
            }, 50);
        });
    }
    catch (err) { console.log(err); }
}

// --| Start Watcher ----------------------------
function startWatcher(notification_file: string, device: XencelabsQuickKeys) {
    let notifPath = path.join(__dirname, notification_file);
    notification = notifPath;
    let dev = device;

    // --| Watch for changes to notification file
    fs.watch(notifPath, async (_event: any, filename: any) => {
        if (filename) {
            const stats = fs.statSync(filename);
            if (stats.mtime.valueOf() === previousMTime.valueOf()) {
                return;
            }

            previousMTime = stats.mtime;
            readNotification(dev);
        }
    });
}

module.exports = { /* setDevice, */ handleNotification, startWatcher };