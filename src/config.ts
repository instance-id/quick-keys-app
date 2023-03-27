import { exit } from "node:process";

const toml = require('toml');
const path = require('path');
const fsPromises = require('node:fs/promises');

let config: any;
let data: string;
const p = path.join(__dirname, "../config/config.toml");

interface configOpts { [key: string]: any }

// --| Load and parse the config file -----------
async function readConfig(opts?:configOpts) {
   let fp=p
   if (typeof opts === 'object') {

      if (typeof opts['configPath'] != 'undefined') {
        var x = opts['configPath'] || "config.toml"
	fp = path.join(__dirname,`../config/${x}`);
      }
    }
    try {
        data = await fsPromises.readFile(fp);
        config = toml.parse(data);
    }
    catch (err) { console.log("Could not load config file", err); exit(1); }

    console.log(`Config Loaded : ${fp}`);
    return config;
}

module.exports = { readConfig };