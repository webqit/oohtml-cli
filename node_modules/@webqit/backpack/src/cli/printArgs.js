
/**
 * imports
 */
import Chalk from 'chalk';
import { _isFunction, _isTypeObject } from '@webqit/util/js/index.js';

/**
 * Prints args
 * 
 * @param object|array  params 
 * @param number        indentation 
 * @param bool          filter 
 * 
 * @return void
 */
export default function print(params, indentation = 0, filter = true) {
    Object.keys(params).forEach(prop => {
        if (filter && (prop === 'ROOT' || prop.startsWith('__'))) {
            return;
        }
        console.log(Chalk.blueBright('> ') + '  '.repeat(indentation) + prop + ': ' + (
            _isFunction(params[prop]) ? '(function)' + params[prop].name : (_isTypeObject(params[prop]) ? '(object)' : Chalk.blueBright(params[prop]))
        ));
        if (_isTypeObject(params[prop])) {
            print(params[prop], indentation + 1, filter);
        }
    });
}
