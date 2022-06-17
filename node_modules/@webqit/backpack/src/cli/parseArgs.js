
/**
 * @imports
 */
import { _last as _arrLast, _from as _arrFrom } from '@webqit/util/arr/index.js';

/**
 * Parses command-line args to a more-usable format
 * 
 * @param array args
 * 
 * @return object
 */
export default function(argv) {
    var command = argv[2], args = argv.slice(3), keywords = {}, flags = {}, options = {}, ellipsis;
    if (_arrLast(args) === '...') {
        args.pop();
        ellipsis = true;
    }
    args.forEach(arg => {
        if (arg.indexOf('=') > -1 || arg.startsWith('--')) {
            var target = options;
            if (arg.startsWith('--')) {
                target = flags;
                arg = arg.substr(2);
            }
            if (arg.indexOf('+=') > -1) {
                arg = arg.split('+=');
                var arg_name = arg[0];
                target[arg_name] = _arrFrom(target[arg_name]);
                target[arg_name].push(arg[1]);
            } else {
                arg = arg.split('=');
                var arg_name = arg[0];
                target[arg_name] = arg.length === 1 || arg[1] === 'TRUE' ? true : (arg[1] === 'FALSE' ? false : arg[1]);
            }
        } else {
            keywords[arg] = true;
        }
    });
    return {
        command,
        keywords,
        flags,
        options,
        ellipsis,
    }
}