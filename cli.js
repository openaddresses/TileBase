#! /usr/bin/env node

import { URL } from 'url';
import fs from 'fs';
import path from 'path';
import TileBase from './tilebase.js';
import minimist from 'minimist';

const argv = minimist(process.argv, {
    boolean: ['help', 'version']
});

if (argv.version) version();
else if (argv.help || !argv._[2]) help();
else if (argv._[2] === 'convert') convert();

function help() {
    if (!argv._[2]) {
        console.log();
        version();
        console.log();
        console.log('Usage:');
        console.log('  tilebase <subcommand> [--help] [--version]');
        console.log();
        console.log('Subcommands:');
        console.log('  convert       Convert an MBTiles file to TileBase');
        console.log();
    } else if (argv._[2] === 'convert') {
        console.log();
        console.log('Usage:');
        console.log('  tilebase convert <input.mbtiles> <output.tilebase> [--help]');
        console.log();
        console.log('Parameters:');
        console.log('  <input.mbtiles>          Input MBTiles File');
        console.log('  <output.tilebase>        Output TileBase File');
        console.log();
    } else {
        console.log('Unknown Subcommand');
        process.exit(1);
    }
}

function version() {
    const pkg = JSON.parse(fs.readFileSync(new URL('package.json', import.meta.url).pathname));
    console.log(`TileBase@${pkg.version}`);
}

async function convert() {
    if (!argv._[3] || !argv._[4]) {
        console.log('<input.mbtiles> and <output.tilebase> required');
        process.exit(1);
    }

    try {
        const tb = await TileBase.to_tb(
            path.resolve(process.cwd(), argv._[3]),
            path.resolve(process.cwd(), argv._[4])
        );

        await tb.open();
        console.log('Success');
        console.log(`${(tb.start_tile - tb.start_index) / 16} tiles`);
        console.log(`${tb.start_tile} byte index`);
        await tb.close();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
