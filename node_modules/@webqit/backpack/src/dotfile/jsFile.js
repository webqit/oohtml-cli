
/**
 * @imports
 */
import Fs from 'fs';
import Path from 'path';
import { _isArray } from '@webqit/util/js/index.js'
import { _each } from '@webqit/util/obj/index.js'

/**
 * Generates a JavaScript source file
 */
export function write(data, outputFile, description) {

    // Source code
    var source = '';

    // Write imports
    if (data.imports) {
        source += 
`
/**
 * @imports
 */
`;

        _each(data.imports, (path, imports) => {
            source += `import ${_isArray(imports) ? `{ ${imports.join(', ')} }` : (imports ? `${imports} from` : ``)} '${path}';
`;
        });
    }

    // Description
    source += 
`
/**
 * -----------------
 * ${description}
 * -----------------
 */

`;

    // Main body
    source += data.code.join("\r\n");

    // Write exports
    if (data.exports) {
        source += 
`
/**
 * @exports
 */
`;

        source += `export ${_isArray(data.exports) ? `{ ${data.exports.join(', ')} }` : `${data.exports}`};
        `;
    }

    Fs.mkdirSync(Path.dirname(outputFile), {recursive:true});
    Fs.writeFileSync(outputFile, source);
}