import {
    XencelabsQuickKeys,
    XencelabsQuickKeysDisplayOrientation,
    XencelabsQuickKeysManagerInstance
} from '@xencelabs-quick-keys/node'
import { exit } from 'process'

const input = require('./input')
const config = require('./config')
const commands = require('./commands')
const notification = require('./notification')

// let term = new input.EventEmitter()

let conf: any;
let deviceFound = false;
let device: XencelabsQuickKeys;

// --| Sleep for duration -----------------------
function sleep(time: number | undefined) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

// --| Check if device was found ----------------
async function checkDevice() {
    await sleep(50).then(async () => {
        if (!deviceFound) {
            console.log('No device found. Is it powered on?'); exit(0);
        }
    })
}

// start listening for devices
XencelabsQuickKeysManagerInstance.on('connect', async (qkDevice) => {
    await qkDevice.startData();

    if (qkDevice === undefined) { console.log('Error locating device...'); exit(0); }

    conf = await config.readConfig();

    deviceFound = true;
    device = qkDevice;

    // --| Notification listener ------
    notification.setDevice(device);
    notification.startWatcher(conf.settings.notification_path);

    // --| Perform button down action -
    qkDevice.on('down', (_keyIndex) => { return; });

    // --| Perform button up action ---
    qkDevice.on('up', async (keyIndex) => {
        // --| If command is not set, return
        if (conf.buttons[keyIndex].command == "") { return; }
        commands.runCommand(conf.buttons[keyIndex].command);

        // --| If overlay text is not set, return
        if (conf.buttons[keyIndex].press_overlay.text == "") { return; }
        await qkDevice.showOverlayText(conf.buttons[keyIndex].press_overlay.duration, conf.buttons[keyIndex].press_overlay.text);
    });

    // --| Perform Wheel actions ------
    qkDevice.on('wheel', async (e) => {
        commands.runCommand(conf.wheel[e].command)
        await qkDevice.showOverlayText(conf.wheel[e].press_overlay.duration, conf.wheel[e].press_overlay.text)
    });

    // --| Log running errors ---------
    qkDevice.on('error', (error) => { console.error(error) });

    // --| Set device orientation -----
    await qkDevice.setDisplayOrientation(XencelabsQuickKeysDisplayOrientation.Rotate180);

    // --| Set button text ------------
    try {
        for (let button in conf.buttons) {
            await qkDevice.setKeyText(Number.parseInt(conf.buttons[button]), conf.buttons[button].text)
        }
    } catch (error) { console.error(error); exit(1); };

    // --| Set wheel color ------------
    var color = conf.wheel.color;
    await qkDevice.setWheelColor(color[0], color[1], color[2])
    input.start();

    input.on('notification', async (data: any) => {
        console.log(data.message);
        let duration = 2;
        if (data.duration !== undefined) { duration = Number.parseInt(data.duration); }
        console.log(duration);
        await device.showOverlayText(duration, data.message);
    });
})

// --| Run upon device disconnect ---------------
XencelabsQuickKeysManagerInstance.on('disconnect', (qkDevice) => {
    console.log('disconnected %s', qkDevice.deviceId)
    exit(0)
})

// --| Log detected connection errors -----------
XencelabsQuickKeysManagerInstance.on('error', (error) => {
    console.error(error);
    exit(1);
})

// --| Locate connected device ------------------
console.log('Looking for connected device...')
XencelabsQuickKeysManagerInstance.scanDevices()

// --| If device not found ----------------------
checkDevice()