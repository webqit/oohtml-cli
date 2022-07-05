
/**
 * @imports
 */
import Fs from 'fs';
import Path from 'path';
import { _from as _arrFrom } from '@webqit/util/arr/index.js';

export const type = 'input';
export function handle( event, args, recieved, next ) {
    // Only .json files
    if ( recieved || !event.resource.endsWith('.json') ) return next( recieved );
    let basename = Path.basename( event.resource );
    let cleanList = list => _arrFrom( list ).reduce(( list, iten ) => list.concat( iten.split( ',' ) ), []).map(s => s.trim()).filter(s => s);
    let only = cleanList( (args || {}).only ), except = cleanList( (args || {}).except );
    if ( ( only.length && !only.includes( basename ) ) || ( except.length && except.includes( basename ) ) ) return next( recieved );
    // Validated
    let contents = Fs.readFileSync( event.resource ).toString();
    return {
        type: 'application/json',
        contents,
        toOutput() { 
            return { json: JSON.parse(this.contents), };
        },
    };    
}