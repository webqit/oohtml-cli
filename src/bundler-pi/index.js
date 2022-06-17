
/**
 * imports
 */
import Bundler from './Bundler.js';

/**
 * @description
 */
export const desc = {
    bundle: 'Bundle files from the current directory into HTML modules.',
};

/**
 * @build
 */
export async function bundle() {
	const cx = this || {};
	if (!cx.config.Bundler) {
        throw new Error(`The Bundler configurator "config.Bundler" is required in context.`);
    }
	return ( new Bundler( cx ) ).bundle();
}