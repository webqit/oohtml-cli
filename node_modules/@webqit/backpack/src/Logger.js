
/**
 * imports
 */
import { _isArray, _isObject, _isNumber, _isString, _isNull, _isUndefined } from '@webqit/util/js/index.js';
import { _each } from '@webqit/util/obj/index.js';
import Chalk from 'chalk';
import Clui from 'clui';
import Figlet from 'figlet';
import Clear from 'clear';

/**
 * Initializes a server on the given working directory.
 */
export default class Logger {

    // @alias: console.log()
    static log(...args) {
        return console.log(...args);
    }
            
    // @alias: console.info()
    static info(...args) {
        return console.info(...args);
    }
        
    // @alias: console.info()
    static success(...args) {
        return console.info(...args);
    }
    
    // @alias: console.error()
    static error(...args) {
        return console.error(...args);
    }
    
    // @alias: new Clui.Spinner()
    static waiting(...args) {
        if (args.length === 1 && !args[0].endsWith('...')) {
            args[0] += '...';
        }
        return new Clui.Spinner(...args);
    }
    
    // @title
    static title(...args) {
        return console.info(...args);
    }
    
    // @title
    static banner(txt, tag, ...args) {
        Clear();
        return console.info(Chalk.cyan(
            Figlet.textSync(txt, {horizontalLayout: 'full'}) + Chalk.bgBlue(Chalk.black(tag))
        ));
    }

    // @f
    static f(strings, ...vars) {
        return strings.reduce((build, str, i) => {
            let _var = '';
            if (i < vars.length) {
                if (strings[i + 1] && strings[i + 1].trim() === ':' && _isString(vars[i])) {
                    _var = this.style.var(vars[i]);
                } else {
                    _var = this.style.val(vars[i]);
                }
            }
            return build + str + _var;
        }, '');
    }

    // @f
    static get color() {
        return Chalk;
    }
};

/**
 * @tokens
 */

Logger.style = {
    
    // @val()
    val(input, indentation) {
        if (_isObject(input)) {
            return this.object(input, indentation);
        }
        if (_isArray(input)) {
            return this.array(input, indentation);
        }
        if (_isNull(input)) {
            return this.keyword('null', indentation);
        }
        if (_isUndefined(input)) {
            return this.keyword('undefined', indentation);
        }
        if (_isNumber(input)) {
            return this.number(input, indentation);
        }
        if (_isString(input)) {
            if ((input.includes('/') || input.includes('\\')) && (input.includes(':') || input.includes('.'))) {
                return this.url(input, indentation);
            }
            return this.string(input, indentation);
        }
        return input;
    },

    // @var()
    var(input, indentation) {
        return Chalk.blueBright(Chalk.bold(input));
    },

    // @keyword()
    keyword(input, indentation) {
        return Chalk.yellow(input);
    },

    // @comment()
    comment(input, indentation) {
        return Chalk.gray(input);
    },

    // @token()
    token(input, indentation) {
        return Chalk.gray(input);
    },

    // @url()
    url(input, indentation) {
        return Chalk.underline(Chalk.greenBright(input));
    },

    // @err()
    err(input, indentation) {
        return Chalk.redBright(input);
    },

    // -----------------

    // @comment()
    object(input, indentation = 0) {
        var obj = [],
            prefix = this.token('> ') + (' '.repeat(indentation));
        _each(input, (k, v) => {
            obj.push(prefix + this.var(k) + this.token(': ') + this.val(v, indentation + 1));
        });
        return obj.join("\r\n");
    },

    // @comment()
    array(input, indentation) {
        return input.map(v => this.val(v, indentation)).join(this.token(', '));
    },

    // @comment()
    string(input, indentation) {
        return Chalk.blueBright(input);
    },

    // @comment()
    number(input, indentation) {
        return Chalk.greenBright(input);
    },
};