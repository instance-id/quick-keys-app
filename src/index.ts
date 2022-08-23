import {
    XencelabsQuickKeys,
    XencelabsQuickKeysDisplayOrientation,
    XencelabsQuickKeysManagerInstance,
    XencelabsQuickKeysWheelSpeed
} from '@xencelabs-quick-keys/node'
import { exit } from 'process'

const input = require('./input')
const config = require('./config')
const commands = require('./commands')
const notification = require('./notification')

let conf: any;
let deviceFound = false;
let device: XencelabsQuickKeys;
let orientation: XencelabsQuickKeysDisplayOrientation;
let wheelSpeed: XencelabsQuickKeysWheelSpeed;

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

async function setDeviceSettings(customMsg: string = "") {
    await device.setSleepTimeout(conf.settings.sleep_timeout);

    // --| Set wheel speed ------------
    switch (conf.settings.wheel_step) {
        case 1: wheelSpeed = XencelabsQuickKeysWheelSpeed.Slowest; break;
        case 2: wheelSpeed = XencelabsQuickKeysWheelSpeed.Slower; break;
        case 3: wheelSpeed = XencelabsQuickKeysWheelSpeed.Normal; break;
        case 4: wheelSpeed = XencelabsQuickKeysWheelSpeed.Faster; break;
        case 5: wheelSpeed = XencelabsQuickKeysWheelSpeed.Fastest; break;
        default: break;
    }
    await device.setWheelSpeed(wheelSpeed);

    // --| Set device orientation -----
    switch (conf.settings.orientation) {
        case 0: orientation = XencelabsQuickKeysDisplayOrientation.Rotate0; break;
        case 90: orientation = XencelabsQuickKeysDisplayOrientation.Rotate90; break;
        case 180: orientation = XencelabsQuickKeysDisplayOrientation.Rotate180; break;
        case 270: orientation = XencelabsQuickKeysDisplayOrientation.Rotate270; break;
        default: break;
    }
    await device.setDisplayOrientation(orientation);

    // --| Set wheel color ------------
    let color = conf.wheel.color;
    let red = [255, 0, 0];
    let cst = [color[0], color[1], color[2]]

    let colors = [
        { color: red, duration: 0 },
        { color: cst, duration: 200 },
        { color: red, duration: 400 },
        { color: cst, duration: 600 },
        { color: red, duration: 800 },
        { color: cst, duration: 1000 },
    ];

    colors.forEach(async (c) => {
        await sleep(c.duration).then(async () => {
            await device.setWheelColor(c.color[0], c.color[1], c.color[2]);
        })
    });

    // --| Display welcome message ----
    let overlayText = (customMsg === "" ? conf.settings.welcome_text : customMsg);
    await device.showOverlayText(4, overlayText).then(async () => {
        // --| Set button text ------------
        try {
            for (let button in conf.buttons) {
                let num = Number.parseInt(button);
                if (num > 7) { break; }
                let keyText = conf.buttons[button].text;

                if (keyText.length > 8) {
                    keyText = keyText.substring(0, 8);
                    console.log(`Button ${button} text is too long, truncated to ${keyText}`);
                }

                await device.setKeyText(num, keyText)
            }
        } catch (error) { console.error(error); exit(1); };
    });;
}

// start listening for devices
XencelabsQuickKeysManagerInstance.on('connect', async (qkDevice) => {
    await qkDevice.startData();

    if (qkDevice === undefined) { console.log('Error locating device...'); exit(0); }
    conf = await config.readConfig();

    deviceFound = true;
    device = qkDevice;

    // --| Notification listener -----------
    notification.setDevice(device);
    notification.startWatcher(conf.settings.notification_path);

    // --| Perform button down action ------
    qkDevice.on('down', (_keyIndex) => { return; });

    // --| Perform button up action --------
    qkDevice.on('up', async (keyIndex) => {
        // --| If command is not set, return
        if (conf.buttons[keyIndex].command == "") { return; }

        if (conf.buttons[keyIndex].command == "reload_config") {
            conf = await config.readConfig();
            await setDeviceSettings("Reloading Config");
            return;
        }

        commands.runCommand(conf.buttons[keyIndex].command);

        // --| If overlay text is not set, return
        if (conf.buttons[keyIndex].press_overlay.text == "") { return; }
        await qkDevice.showOverlayText(conf.buttons[keyIndex].press_overlay.duration, conf.buttons[keyIndex].press_overlay.text);
    });

    // --| Perform Wheel actions -----------
    // --| Allows an array of commands -----
    qkDevice.on('wheel', async (e) => {
        let cmd = conf.wheel[e].command;
        if (Array.isArray(cmd)) {
            cmd.forEach(async (c) => {
                let output = await commands.runCommand(c);
                if (output !== "") {
                    let displayText = `${conf.wheel[e].press_overlay.text} ${output}`;
                    await qkDevice.showOverlayText(conf.wheel[e].press_overlay.duration, displayText); return;
                } else { await qkDevice.showOverlayText(conf.wheel[e].press_overlay.duration, conf.wheel[e].press_overlay.text) }
            })
        } else {
            let output = await commands.runCommand(cmd)
            if (output !== "") {
                let displayText = `${conf.wheel[e].press_overlay.text} ${output}`;
                await qkDevice.showOverlayText(conf.wheel[e].press_overlay.duration, displayText); return;
            } else { await qkDevice.showOverlayText(conf.wheel[e].press_overlay.duration, conf.wheel[e].press_overlay.text) }
        }
    });

    // --| Log running errors --------------
    qkDevice.on('error', (error) => { console.error(error) });

    // --| Set initial device settings -----
    await setDeviceSettings();

    await sleep(1100).then(async () => {
        input.start();
        input.on('notification', async (data: any) => {
            console.log(data.message);
            let duration = 2;
            if (data.duration !== undefined) { duration = Number.parseInt(data.duration); }
            console.log(duration);
            await device.showOverlayText(duration, data.message);
        });

        input.on('reload', async (_data: any) => {
            console.log("Reloading Settings");
            conf = await config.readConfig();
            await setDeviceSettings();
        });
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