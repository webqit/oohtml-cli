
/**
 * @imports
 */
import Path from 'path';
import { _merge } from '@webqit/util/obj/index.js';
import { jsonFile, envFile, anyExists } from './index.js';
import { initialGetIndex } from '../cli/Promptx.js';

/**
 * @exports
 */
export default class Dotfile {

    /**
     * The default initializer.
     * 
     * @param Context cx
     */
    constructor(cx) {
        if (!cx.name) {
            throw new Error(`Context must have a "name" property.`);
        }
        this.cx = cx;
        this.givenExt = this.cx.flags.mode ? `.${this.cx.flags.mode}` : '';
        this.availableExt = anyExists([ this.givenExt, '', '.example' ], ext => this.resolveFileName(ext));
        if (this.isEnv) {
            this.availableEnvExt = anyExists([ this.givenExt, '', '.example' ], ext => this.resolveEnvFileName(ext));
        }
    }

    // ------------

    get jsonDir() {
        return Path.join(this.cx.CWD || ``, `./.webqit/${this.cx.name}/`);
    }

    get envDir() {
        return Path.resolve(this.cx.CWD || '');
    }

    // ------------

    static read(...args) {
        let instance = new this(...args);
        return instance.read();
    }


    static write(config, ...args) {
        let instance = new this(...args);
        return instance.write(config);
    }

    // ------------

    async read() {
        let config = jsonFile.read(this.resolveFileName(this.availableExt));
        if (this.isEnv) {
            let config2 = { entries: envFile.read(this.resolveEnvFileName(this.availableEnvExt)) || {}, };
            // The rewrite below is because entries should not also appear in json
            //config.entries = _merge(config.entries || {}, config2.entries);
            config = _merge(config, config2);
        }
        return this.withDefaults(config);
    }

    async write(config) {
        if (this.isEnv) {
            config = { ...config };
            envFile.write(config.entries, this.resolveEnvFileName(this.givenExt));
            // The delete below is because entries should not also appear in json
            delete config.entries;
        }
        jsonFile.write(config, this.resolveFileName(this.givenExt));
    }

    getSchema() {
        return [];
    }

    // ------------

    resolveFileName(ext) {
        return `${this.jsonDir}/${this.name}${ext}.json`;
    }

    resolveEnvFileName(ext) {
        return `${this.envDir}/.${this.name}${ext}`;
    }

    withDefaults(config) {
        return config;
    }

    indexOfInitial(options, initial) {
        return initialGetIndex(options, initial);
    }

}