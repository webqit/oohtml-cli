
/**
 * @imports
 */
import Fs from 'fs';
import Url from 'url';
import Path from 'path';
import Jsdom from 'jsdom';
import Mime from 'mime-types';
import { _merge } from '@webqit/util/obj/index.js';
import { _isFunction } from '@webqit/util/js/index.js';
import { _isObject, _isNumeric, _isString } from '@webqit/util/js/index.js';
import { _before, _beforeLast, _after } from '@webqit/util/str/index.js';
import Lexer from '@webqit/util/str/Lexer.js';

/**
 * ---------------------------
 * The Bundler class
 * ---------------------------
 */
export default class Bundler {
		
	/**
	 * A Bundler instance.
	 *
	 * @param Context		cx
	 * @param Object		context
	 *
	 * @return void
	 */
	constructor( cx, context = { indentation: 0 } ) {
		if ( !cx.config.Bundler ) {
			throw new Error( `The Bundler configurator "config.Bundler" is required in context.` );
		}
		this.cx = cx;
		this.params = new Promise( async resolve => {
			let config = await ( new this.cx.config.Bundler( this.cx ) ).read();
			config.entryDir = Path.join( this.cx.CWD, config.entry_dir );
			config.outputDir = Path.join( this.cx.CWD, config.output_dir );
			config.outfile = config.filename && Path.join( config.outputDir, config.filename );
			config.entryDirIsOutputDir = Path.resolve( config.outputDir ) === Path.resolve( config.entryDir );
			config.indentation = context.indentation || 0;
			config.contentIndentation = context.indentation;
			config.publicIndentation = context.indentation;
			if ( config.filename ) {
				config.contentIndentation = 0;
			}
			if ( config.public_base_url ) {
				config.publicIndentation = 0;
			} else if ( context.public_base_url ) {
				config.public_base_url = context.public_base_url;
			}
			if ( config.plugins ) {
				if ( typeof config.plugins === 'string' ) {
					config.plugins = config.plugins.split( ',' );
				}
				const plugins = config.plugins;
				config.plugins = [];
				const resolveLoaders = async plugin => {
					if ( !( plugin = plugins.shift() ) ) return;

					if ( _isString( plugin ) ) {
						plugin = { name: plugin.trim() };
					}
					if ( _isObject( plugin ) && plugin.name ) {
						var pluginName = plugin.name, isDefault;
						if ( pluginName.startsWith( 'default:' ) ) {
							isDefault = true;
							pluginName = pluginName.replace( 'default:', '' );
						}
						// ---------------
						var pluginUrl = pluginName;
						if ( isDefault ) {
							pluginUrl = Path.join( Path.dirname( import.meta.url ), '/plugins', pluginName + '.js' );
						}
						var imported;
						if ( Fs.existsSync( Url.fileURLToPath( pluginUrl ) ) && ( imported = await import( pluginUrl ) ) && imported.handle ) {
							plugin = { ...imported, ...plugin, };
						} else {
							throw new Error( `Plugin "${ pluginName }" not found at ${ pluginUrl }, or is missing a ".handle()" method.` );
						}
					}
					config.plugins.push( plugin );
					await resolveLoaders();
				};
				await resolveLoaders();
			}
			resolve( config );
		});
	}
		
	/**
	 * Bundles and saves.
	 *
	 * @return object
	 */
	async bundle() {
		let params = await this.params;
		let waiting;
		if ( this.cx.logger ) {
			this.cx.logger.info( '' );
			this.cx.logger.title( `${ 'Creating HTML bundles' } ... ` + this.cx.logger.f`FROM: ${ params.entryDir }` );
			waiting = this.cx.logger.waiting( `...` );
			waiting.start();
		}
		let bundle = await this.readdir( params.entryDir, params.contentIndentation );
		let result = await this.save( bundle, params.outputDir, params.filename );
		if ( this.cx.logger ) {
			waiting.stop();
			this.cx.logger.info( this.cx.logger.f`${ bundle.total } total files bundled ... ` + this.cx.logger.f`TO: ${ params.outfile }` );
			this.cx.logger.info( '' );
		}
		return result;
	}

	async route( event, callback ) {
		let params = await this.params;
		let callPlugin = async function( index, ...args ) {
			try {
				if ( params.plugins && params.plugins[ index ] ) {
					let plugin = params.plugins[ index ];
					if ( event.type !== plugin.type ) return callPlugin( index + 1, ...args );
					return plugin.handle( event, plugin.args, args[ 0 ], async ( ..._args ) => {
						return callPlugin( index + 1, ..._args );
					} );
				}
				if ( args[ 0 ] ) return args[ 0 ];
				return callback();
			} catch( e ) {
				return { error: e, }
			}
		};
		return callPlugin( 0 );
	}

	async readdir( dirname, indentation = 0 ) {
		let params = await this.params;
		let contents = {}, total = 0;
		let resources = Fs.readdirSync( dirname );
		let readShift = async () => {
			if ( !resources.length ) return;
			let basename = resources.shift();
			let resource = Path.join( dirname, basename );
			let a = Path.resolve( resource ), b = Path.resolve( params.outfile );
			if ( a === b || a === `${b}.json` ) {
				return readShift();
			}
			// ---------------------
			let outdirEquivalent = Path.join( params.outputDir, this.getNamespace( dirname, indentation ), basename ),
				isDirectory = Fs.statSync( resource ).isDirectory(),
				resourceObj, subCx, subConfig;
			if ( isDirectory && ( subCx = this.cx.constructor.create( this.cx, resource ) ) && ( subConfig = new subCx.config.Bundler( subCx ) ) && (
				Fs.existsSync( subConfig.jsonDir ) || Fs.existsSync( Path.join( outdirEquivalent, 'index.html' ) )
			) ) {
				if ( this.cx.flags.recursive ) {
					let subBundler = new this.constructor( subCx, {
						indentation: params.indentation + indentation + 1,
						public_base_url: params.public_base_url,
					} );
					resourceObj = await subBundler.bundle();
				}
			} else {
				resourceObj = await this.route( { type: 'input', resource, indentation, params, isDirectory }, async () => {
					if ( isDirectory ) {
						if ( ( params.ignore_folders_by_prefix || [] ).filter( prfx => basename.substr( 0, prfx.length ) === prfx ).length ) return;
						return this.readdir( resource, indentation + 1 );
					}
					if ( params.hide_file_extensions ) { basename = _beforeLast( basename, '.' ); }
					return this.load( resource, indentation );
				});
			}
			if ( resourceObj && resourceObj.error ) {
				console.warn( resourceObj.error );
			} else if ( resourceObj ) {
				total += resourceObj.total || 1;
				if ( !resourceObj.type ) {
					throw new Error( `Loader result object must have a "type" property.` );
				}
				if ( !resourceObj.indentation ) {
					resourceObj = { ...resourceObj, indentation };
				}
				contents[ basename ] = resourceObj;
			}
			await readShift();
		};
		await readShift();
		return {
			type: 'raw-bundle',
			contents,
			indentation,
			total,
		};
	}

	async load( resource, indentation = 0 ) {
		let params = await this.params;
		let ext = Path.extname( resource ) || '';
		let mime = Mime.lookup( ext );
		let contents, size;
		if ( mime && [ 'image/', 'video/', 'audio/' ].some( mimeClass => mime.startsWith( mimeClass ) ) ) {
			contents = Fs.readFileSync( resource );
			size = Fs.statSync( resource ).size;
		} else if ( mime === 'text/html' ) {
			contents = Fs.readFileSync( resource ).toString();
			if ( [ '<!doc', '<?xml' ].includes(( contents = contents.toString() ).trim().substring( 0, 5 ).toLowerCase() ) ) {
				contents = null;
			}
		}
		return contents && { contents, type: mime, size, indentation };
	}

	async save( bundle, outdir, filename = null ) {
		let params = await this.params, contentsArray = [], outline = {};
		await Object.keys( bundle.contents ).reduce( async ( prev, name ) => {
			await prev;
			let { html, json } = await this.route( { type: 'output', resource: bundle.contents[ name ], params }, async () => {
				let resourceObj = bundle.contents[ name ];
				if ( resourceObj.toOutput ) {
					return resourceObj.toOutput();
				}
				if ( resourceObj.type === 'raw-bundle' ) {
					let { contents, outline } = await this.save( resourceObj, Path.join( outdir, name ) );
					return {
						html: this.createModule( name, contents, params, resourceObj.indentation ),
						json: outline,
					}
				}
				if ( resourceObj.type === 'ext-bundle' ) {
					if ( resourceObj.autoEmbed ) return {};
					return {
						html: this.createExtModule( name, resourceObj.htmlPublicUrl, params, resourceObj.indentation ),
						json: resourceObj.jsonPublicUrl,
					}
				}
				if ( resourceObj.type === 'bundle' ) {
					let { contents, outline } = resourceObj;
					return {
						html: this.createModule( name, contents, params, resourceObj.indentation ),
						json: outline,
					}
				}
				let { contents, ...rest } = resourceObj;
				if ( [ 'image/', 'video/', 'audio/' ].some( mimeClass => resourceObj.type.startsWith( mimeClass ) ) ) {
					let src;
					if ( resourceObj.size && resourceObj.size < params.max_data_url_size ) {
						src = `data:${ resourceObj.type };base64,${ contents.toString( 'base64' ) }`;
					} else {
						if ( !params.entryDirIsOutputDir ) {
							let absFilename = Path.join( outdir, name );
							Fs.mkdirSync( Path.dirname( absFilename ), { recursive: true } );
							Fs.writeFileSync( absFilename, contents );
						}
						let publicDir = this.getNamespace( outdir, params.publicIndentation );
						src = Path.join( params.public_base_url, publicDir, name );
					}
					if ( resourceObj.type.startsWith( 'image/' ) ) {
						contents = `<img src="${ src }" />`;
					} else if ( resourceObj.type.startsWith( 'video/' ) ) {
						contents = `<video>\n\t<source src="${ src }" type="${ resourceObj.type }" />\n</video>`;
					} else if ( resourceObj.type.startsWith( 'audio/' ) ) {
						contents = `<audio>\n\t<source src="${ src }" type="${ resourceObj.type }" />\n</audio>`;
					}
				} else if ( resourceObj.type !== 'text/html' ) {
					throw new Error( `Could not resolve output for a resource of type "${resourceObj.type}".` );
				}
				return {
					html: this.createExport( name, contents, params, resourceObj.indentation ),
					...rest
				}
			} );
			if ( html || json ) {
				contentsArray.push( html );
				outline[ name ] = json;
			}
		}, null );
		// ----------
		let contents = contentsArray.join( '' );
		// ----------
		if ( filename ) {
			let publicDir = this.getNamespace( outdir, params.publicIndentation ),
				htmlPublicUrl,
				jsonPublicUrl;
			let outfile = Path.join( outdir, filename );
			Fs.mkdirSync( Path.dirname( outfile ), { recursive: true } );
			Fs.writeFileSync( outfile, contents );
			if ( params.create_outline_file ) {
				let filename2 = filename + '.json';
				let outfileJson = Path.join( outdir, filename2 );
				Fs.writeFileSync( outfileJson, JSON.stringify( outline, null, 4 ) );
				jsonPublicUrl = Path.join( params.public_base_url, publicDir, filename2 );
			}
			htmlPublicUrl = Path.join( params.public_base_url, publicDir, filename );
			// ------------------
			// Embed/unembed
			let targetDocumentFile = Path.join( outdir, 'index.html' ), embedList = [], unembedList = [];
			if ( this.cx.flags[ 'auto-embed' ] ) {
				embedList.push( htmlPublicUrl );
			} else {
				unembedList.push( htmlPublicUrl );
			}
			let autoEmbed = this.handleEmbeds( targetDocumentFile, embedList, unembedList, this.cx.flags[ 'auto-embed' ], params );
			// ------------------
			// Result
			return { htmlPublicUrl, jsonPublicUrl, type: 'ext-bundle', autoEmbed };
		}
		// ----------
		return { type: 'bundle', contents, outline, total: bundle.total, indentation: params.indentation };
	}

	createExtModule( name, htmlPublicUrl, params, indentation ) {
		indentation = indentation;
		let attrs = [ `${ params.module_id_attr }="${ name }"`, `src="${ htmlPublicUrl }"` ];
		if ( params.module_ext ) { attrs.unshift( `is="${ params.module_ext }"` ); }
		if ( params.submodules_srcmode === 'lazy' ) { attrs.push( `loading="lazy"` ); }
		return `\n${ ' '.repeat( indentation * 4 )}<template ${ attrs.join( ' ' ) }></template>`;
	}

	createModule( name, contents, params, indentation ) {
		indentation = indentation - 1;
		let attrs = [ `${ params.module_id_attr }="${ name }"` ];
		if ( params.module_ext ) { attrs.unshift( `is="${ params.module_ext }"` ); }
		return `\n${ ' '.repeat( indentation * 4 )}<template ${ attrs.join( ' ' ) }>${ contents }\n${ ' '.repeat( indentation * 4 )}</template>`;
	}

	createExport( name, contents, params, indentation ) {
		// --------
		const divideByComment = tag => {
			let _comment = '', _tag;
			if ( tag.trim().startsWith( '<!--' ) ) {
				_comment = _before( tag, '-->' ) + '-->';
				_tag = _after( tag, '-->' );
			} else {
				_tag = tag;
			}
			// Shift whitespace too
			_comment += _before( _tag, '<' );
			tag = '<' + _after( _tag, '<' );
			return [ _comment, _tag ];
		};
		// --------
		const getAttributeDefinition = ( tag, attributeName )  => {
			let comment;
			( [ comment, tag ] = divideByComment( tag ) );
			// --------------
			let regexes = [ ' ' + attributeName + '([ ]+)?=([ ]+)?"([^"])+"', " " + attributeName + "([ ]+)?=([ ]+)?'([^'])+'" ];
			return regexes.reduce(( result, regex ) => {
				return result || Lexer.match( tag, regex, { stopChars: '>', useRegex:'i', blocks: [] } )[ 0 ];
			}, '' );
		};
		// --------
		const defineAttribute = ( tag, attributeName, attributeValue ) => {
			let comment;
			( [ comment, tag ] = divideByComment( tag ) );
			if ( !tag ) return comment;
			let [ tagEnd ] = tag.split( '' ).reduce( ( [ a, quotes ], char, i ) => {
				if ( a ) return [ a ];
				if ( [ "'", '"' ].includes( char ) ) {
					if ( quotes[ 0 ] === char ) quotes.splice( 0 );
					else quotes.push( char );
				} else if ( !quotes.length && char === '>' ) {
					return [ i ];
				}
				return [ null, quotes ];
			}, [ null, [] ] );
			var parts = [ tag.substring( 0, tagEnd ), tag.substring( tagEnd + 1 ) ];
			var isSelfClosingTag = parts[ 0 ].trim().endsWith('/');
			return comment + ( isSelfClosingTag ? _beforeLast( parts[ 0 ], '/') : parts[ 0 ] ) + ' ' + attributeName + '="' + attributeValue + '"' + ( isSelfClosingTag ? ' /' : '' ) +  '>' + parts[ 1 ];
		};
		// --------
		if ( params.export_mode === 'element' && params.export_element && params.export_id_attr ) {
			contents = `<${ params.export_element } ${ params.export_id_attr }="${ name }">${ contents }</${ params.export_element }>`;
		} else if ( params.export_mode === 'attribute' && params.export_group_attr && !getAttributeDefinition( contents, params.export_group_attr ) ) {
			contents = defineAttribute( contents, params.export_group_attr, name );
		}
		return "\n" + this.normalizeIndentation( contents, indentation );
	}

	// -----------
	// HELPERS
	// -----------

	normalizeIndentation( rawSource, expectedIndentLevel ) {
		let rawSourceSplit = rawSource.split( /\n/g );
		// Go past empty lines
		while ( rawSourceSplit.length > 1 && !rawSourceSplit[ 0 ].trim().length ) rawSourceSplit.shift();
		// Get indent level from first none-empty line
		let firstLineIndentLevel = rawSourceSplit[ 0 ].split(/[^\s]/)[ 0 ].length;
		if ( firstLineIndentLevel !== expectedIndentLevel * 4 ) {
			let preFormattedBlock = 0;
			return rawSourceSplit.map( ( line, i ) => {
				let preStarters = line.split( /\<pre/g );
				let preStoppers = line.split( /\<\/pre\>/g );
				if ( preStarters.length > 1 ) preFormattedBlock += preStarters.length - 1;
				if ( preStoppers.length > 1 ) preFormattedBlock -= preStoppers.length - 1;
				if ( preFormattedBlock || preStoppers.length > 1 ) return line;
				let lineIndentLevel = line.split(/[^\s]/)[ 0 ].length;
				if ( lineIndentLevel < firstLineIndentLevel ) {
					return ' '.repeat( Math.max( 0, (expectedIndentLevel * 4 ) - ( firstLineIndentLevel - lineIndentLevel ) ) ) + line.substring( lineIndentLevel );
				}
				return ' '.repeat( expectedIndentLevel * 4 ) + line.substring( firstLineIndentLevel );
			} ).join( "\n" );
		}
		return rawSource;
	}

	getNamespace( filename, indentation ) {
		return ( indentation && filename.replace( /\\/g, '/' ).split( '/' ).filter(s => s).slice( - indentation ).join( '/' ) ) || '';
	}


	/**
	 * Handles auto-embeds
	 * 
	 * @param String    targetDocumentFile
	 * @param Array     embedList
	 * @param Array     unembedList
	 * @param String    name
	 * @param Object    params
	 * 
	 * @return Void
	 */
	handleEmbeds( targetDocumentFile, embedList, unembedList, name, params ) {
		let targetDocument, successLevel = 0;
		if ( Fs.existsSync( targetDocumentFile ) && ( targetDocument = Fs.readFileSync( targetDocumentFile ).toString() ) && targetDocument.trim().startsWith( '<!DOCTYPE html' ) ) {
			successLevel = 1;
			let dom = new Jsdom.JSDOM( targetDocument ), by = 'oohtml-cli', touched;
			let embed = ( src, after ) => {
				src = src.replace(/\\/g, '/');
				let embedded = dom.window.document.querySelector( `template[src="${ src }"]` );
				if ( !embedded ) {
					embedded = dom.window.document.createElement( 'template' );
					if ( params.module_ext ) {
						embedded.setAttribute( 'is', params.module_ext );
					}
					embedded.setAttribute( params.module_id_attr, name );
					embedded.setAttribute( 'src', src );
					embedded.setAttribute( 'by', by );
					if ( after ) {
						after.after( `\n\t\t`, embedded );
					} else {
						dom.window.document.head.appendChild( embedded );
					}
					touched = true;
				}
				return embedded;
			};
			let unembed = src => {
				src = Path.join( '/', src );
				src = src.replace(/\\/g, '/');
				let embedded = dom.window.document.querySelector( `template[src="${ src }"][by="${ by }"]` );
				if ( embedded ) {
					embedded.remove();
					touched = true;
				}
			};
			embedList.reverse().reduce( ( prev, src ) => {
				return embed( src, prev );
			}, dom.window.document.querySelector( `template[${ params.module_id_attr }][src]` ) || dom.window.document.querySelector( `template[${ params.module_id_attr }]` ) );
			unembedList.forEach( src => {
				unembed( src );
			} );
			if ( touched ) {
				Fs.writeFileSync( targetDocumentFile, dom.serialize() );
				successLevel = 2;
			}
		}
		return successLevel;
	}
}