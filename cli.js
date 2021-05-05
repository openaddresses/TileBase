#! /usr/bin/env node

'use strict';

const pkg = require('./package.json');
const path = require('path');
const TileBase = require('.');
const argv = require('minimist')(process.argv, {
    boolean: ['help', 'version']
});

if (argv.version) return version();
if (argv.help || !argv._[2]) return help();
if (argv._[2] === 'convert') return convert();

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
    console.log(`TileBase@${pkg.version}`);
}

async function convert() {
    if (!argv._[3] || !argv._[4]) {
        console.log('<input.mbtiles> and <output.tilebase> required');
        process.exit(1);
    }

    try {
        await TileBase.to_tb(
            path.resolve(__dirname, argv._[3]),
            path.resolve(__dirname, argv._[4])
        );

        console.error('ok - converted TileBase');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
