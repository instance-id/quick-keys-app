import { exit } from "node:process";

const path = require('path');
const JSON5 = require('json5');
const fsPromises = require('node:fs/promises');

let config: any;
let data: string;
const p = path.join(__dirname, "../config.json");

// --| Load and parse the config file -----------
async function readConfig() {
    try {
        data = await fsPromises.readFile(p);
        config = JSON5.parse(data);
    }
    catch (err) { console.log("Could not load config file", err); exit(1); }

    console.log("Config Loaded");
    return config;
}

module.exports = { readConfig };