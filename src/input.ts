var fJSON = require('fbbk-json');
import { EventEmitter } from 'events';

let debug = false

class TermInput extends EventEmitter {
    debug = false;

    constructor() {
        super();
        this.emit('ready');
    }

    start() {
        process.stdin.on('data', (chunk: string) => {
            let regexp: RegExp = /(?:\:)(\w+)(?:\s)?([\w \.\,\"\{\}\:\'\[\]]+)?/gi;
            var text = chunk.toString().replace(/(\r\n|\n|\r)/g, "");
            
            var eventName = 'command';
            var matched = regexp.exec(text) || [];

            if (matched) { eventName = matched[1]; text = matched[2]; }
            if (text) {
                try { var json = fJSON.parse(text); text = json; }
                catch (ex) {
                    if (debug) {
                        console.log(ex);
                    }
                }
            }
            console.log(text);
            this.emit(eventName, text);
        });
    }
}

module.exports = new TermInput();