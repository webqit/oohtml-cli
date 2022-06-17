
/**
 * @imports
 */
import Fs from 'fs';
import * as envFile from './envFile.js';
import * as jsFile from './jsFile.js';
import * as jsonFile from './jsonFile.js';
import { _unique } from '@webqit/util/arr/index.js';
import Dotfile from './Dotfile.js';

/**
 * @anyExists
 */
export function anyExists(files, nameCallback = null) {
    return _unique(files).reduce((prev, file) => prev !== false ? prev : (Fs.existsSync(nameCallback ? nameCallback(file) : file) ? file : false), false);
}

/**
 * @exports
 */
export {
    Dotfile as default,
    envFile,
    jsFile,
    jsonFile,
}
