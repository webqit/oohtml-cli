
/**
 * imports
 */
import Fs from 'fs';
import Path from 'path';
import { _wrapped } from '@webqit/util/str/index.js';
import { _isObject } from '@webqit/util/js/index.js';

/**
 * Reads contents of the .env file as an object.
 * 
 * @param string file
 * 
 * @return object
 */
export function read(file) {
    file = Path.resolve(file);
    // Parse
    if (Fs.existsSync(file)) {
        return parse(Fs.readFileSync(file).toString());
    }
}

/**
 * Creates a .env file from an object.
 * 
 * @param object vars
 * @param string file
 * 
 * @return bool
 */
export function write(vars, file) {
    file = Path.resolve(file);
    var dir = Path.dirname(file);
    if (!Fs.existsSync(dir)) {
        Fs.mkdirSync(dir, {recursive:true});
    }
    return Fs.writeFileSync(file, stringify(vars));
}

/**
 * Parses a string into object vars.
 * 
 * @param string str - String declarations or file.
 * 
 * @return object
 */
export function parse(str) {
    var parsed = {};
    var tokens = str.split(/\r?\n/g);
    tokens.forEach(token => {
        if (token.trim().startsWith('//') || !token.includes('=')) {
            return;
        }
        var [ key, val ] = token.split('=');
        if (val && _wrapped(val, '{', '}')) {
            //val = JSON.parse(val);
        }
        parsed[key] = val;
    });
    return parsed;
}

/**
 * Stringifies object vars back into a string.
 * 
 * @param object obj
 * 
 * @return string
 */
export function stringify(obj) {
    return Object.keys(obj).reduce((tokens, key) => {
        tokens.push(key + (!key.startsWith('#') ? '=' : '') + (_isObject(obj[key]) ? JSON.stringify(obj[key]) : obj[key] || ''));
        return tokens;
    }, []).join("\r\n");
}
