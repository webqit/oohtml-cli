
/**
 * @imports
 */
import Fs from 'fs';
import Path from 'path';
import Showdown from 'showdown';
import Jsdom from 'jsdom';
import { _beforeLast } from '@webqit/util/str/index.js';
import { _last } from '@webqit/util/arr/index.js';
import { _merge } from '@webqit/util/obj/index.js';
import '../prism.js';

export const type = 'input';
export async function handle( event, args, recieved, next ) {
    // Only .md files
    if ( recieved || !event.resource.endsWith('.md') ) return next( recieved );
    
    // --------------
    let fixLinksToReadme = () => ({
        type: 'lang', 
        regex: /\[(.*)\]\((.*)?\/readme\.md(.*)?\)/ig, 
        replace: '[$1]($2$3)',
    } );
    let fixRelativeUrls = () => ({
        type: 'lang', 
        filter: text => text.replace( /(?<=\])\(([^\)]*)?\)/g, ( match, matchGroup1 ) => {
            if ( !matchGroup1.match( /^(\/|#|http:|https:|file:|ftp:)/ ) ) {
                return `(${ Path.join(event.params.public_base_url || '', getNamespace( Path.dirname(event.resource), event.params.publicIndentation + event.indentation ), matchGroup1 ) })`;
            }
            return match;
        } ),
    } );
    let getNamespace = (filename, indentation) => {
		return ( indentation && filename.replace( /\\/g, '/' ).split( '/' ).filter(s => s).slice( - indentation ).join( '/' ) ) || '';
	};
    var showdownParams = { metadata: true, tables: true, extensions: [ fixLinksToReadme, fixRelativeUrls ] };
    var markdown = new Showdown.Converter( showdownParams );
    if ( args.flavor ) {
        markdown.setFlavor( args.flavor );
    }
    let html = markdown.makeHtml (Fs.readFileSync( event.resource ).toString() );
    let preFormattedBlock = 0;
    let contents = `<div>\n${ html.split( /\n/g ).map( line => {
        let preStarters = line.split( /\<pre/g );
        let preStoppers = line.split( /\<\/pre\>/g );
        if ( preStarters.length > 1 ) preFormattedBlock += preStarters.length - 1;
        if ( preStoppers.length > 1 ) preFormattedBlock -= preStoppers.length - 1;
        if ( preFormattedBlock || preStoppers.length > 1 ) return line;
        return `\t${ line }`;
     } ).join( `\n` ) }\n</div>`;
    let json = markdown.getMetadata();
    // --------------

    json.outline = []
    if ( args.code_highlighting || args.outline_generation ) {
        let jsdomInstance = new Jsdom.JSDOM( contents ),
            contentElement = jsdomInstance.window.document.body.firstElementChild;
        if ( args.outline_generation ) {
            let lastItem;
            contentElement.childNodes.forEach( node => {
                let textContent = ( node.textContent || '' ).trim();
                if ( node.nodeType === 1/** ELEMENT_NODE */ && [ 'H1', 'H2', 'H3', 'H4', 'H5', 'H6' ].includes( node.nodeName ) ) {
                    let level = parseInt( node.nodeName.substr( 1 ) ), 
                        item = { level, title: textContent, uri: node.id, subtree: [] };
                    if ( level === 1 || !json.outline.length ) {
                        json.outline.push( item );
                    } else if ( level > lastItem.level ) {
                        lastItem.subtree.push( item );
                        Object.defineProperty( item, 'parent', { value: lastItem, enumerable: false } );
                    } else {
                        let _parent = lastItem;
                        while( _parent && level <= _parent.level ) {
                            _parent = _parent.parent;
                        }
                        if ( !_parent ) {
                            _parent = _last( json.outline );
                        }
                        _parent.subtree.push( item );
                        Object.defineProperty( item, 'parent', { value: _parent, enumerable: false } );
                    }
                    lastItem = item;
                }
            });
        }
        if ( args.code_highlighting ) {
            Array.from( contentElement.querySelectorAll( 'pre' ) ).forEach( el => {
                el.classList.add( 'line-numbers' );
                el.classList.add( 'match-braces' );
            } );
            Prism.highlightAllUnder( contentElement );
            contents = contentElement.outerHTML;
        }
    }

    return {
        type: 'text/html',
        contents,
        json,
    };    
}