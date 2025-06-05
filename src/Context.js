
export default class Context {

    /**
     * Initializes a context.
     * 
     * @param Object  dict 
     * @param String  CD 
     */
    constructor(dict, CD = null) {
        // dict can be plain object or some Context instance itself
        // Using it as only a prototype protects it from being mutated down here
        Object.defineProperty(this, 'dict', { value: Object.create(dict), });
        // Now, for enumerable props thet need to be enumerable, where no getter/setter on both instances
        for (let prop in this.dict) {
            if (prop in this) continue;
            this[prop] = this.dict[prop];
        }
        if (arguments.length > 1) {
            Object.defineProperty(this.dict, 'CWD', { get: () => CD });
        }
    }

    get name() {
        return 'oohtml-cli';
    }

    // create
    static create(...args) {
        return new this(...args);
    }

    // CWD
    get CWD() {
        return this.dict.CWD || '';
    }

    // meta
    get meta() {
        return this.dict.meta || {};
    }

    // app
    get app() {
        return this.dict.app || {};
    }

    // config
    get config() {
        return this.dict.config || {};
    }

    // flags
    get flags() {
        return this.dict.flags || {};
    }

    set flags(value) {
        this.dict.flags = value;
    }

    // layout
    get layout() {
        return this.dict.layout || {};
    }

    set layout(value) {
        this.dict.layout = value;
    }

    // options
    get options() {
        return this.dict.options || {};
    }

    set options(value) {
        this.dict.options = value;
    }

    // logger
    get logger() {
        return this.dict.logger;
    }

    set logger(value) {
        this.dict.logger = value;
    }

}