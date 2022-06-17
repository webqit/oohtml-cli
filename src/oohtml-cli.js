#!/usr/bin/env node

/**
 * @imports
 */
import Url from 'url';
import Path from 'path';
import { jsonFile } from '@webqit/backpack/src/dotfile/index.js';
import { Logger, Cli } from '@webqit/backpack';
import * as OohtmlCliPI from './index.js';

const dirSelf = Path.dirname(Url.fileURLToPath(import.meta.url));
const oohtmlCliJson = jsonFile.read(Path.join(dirSelf, '../package.json'));
const appJson = jsonFile.read('./package.json');

/**
 * @cx
 */
const cx = OohtmlCliPI.Context.create({
    meta: { title: oohtmlCliJson.title, version: oohtmlCliJson.version },
    app: { title: appJson.title, version: appJson.version },
    logger: Logger,
    config: OohtmlCliPI.config,
});

/**
 * @cli
 */
const cli = new Cli(OohtmlCliPI);
await cli.exec(cx);
