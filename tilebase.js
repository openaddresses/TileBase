'use strict';

const fs = require('fs');
const { promisify } = require('util');
const MBTiles = require('@mapbox/mbtiles');
const tc = require('@mapbox/tile-cover');
const { point } = require('@turf/helpers');
const zlib = require('zlib');

const Config = require('./lib/config');
const interfaces = require('./lib/interfaces');
const gunzip = promisify(zlib.gunzip);

/**
 * @class Tilebase
 *
 * @prop {Config} config Read Config Options
 * @prop {Number} config_length Length of Config in Bytes
 *
 * @prop {Number} start_index Byte Index to start of Tile Addresses
 * @prop {Number} start_tile Byte Index to start of Tile Data
 * @prop {Number} version TileBase Version
 *
 * @prop {Boolean} isopen Is the TileBase file open
 *
 * @prop {FileHandle|MemHandle} handle TileBase read options
 */
class TileBase {
    /**
     * @constructor
     *
     * @param {String} url URL location of TileBase
     * @param {Object} opts Options Object
     */
    constructor(url, opts) {
        if (!opts) opts = {};
        this.isopen = false;

        this.version = null;

        this.config_length = 0; // The length of the config object in bytes

        const p = new URL(url);
        if (!interfaces[p.protocol]) throw new Error(`${p.protocol} not supported`);

        this.handler = new interfaces[p.protocol](url);
        this.config = new Config(this);

        this.start_index = false;
        this.start_tile = false;

    }

    async open() {
        await this.handler.open();

        await this.config.range();
        await this.config.read();
        await this.config.verify();

        this.start_index = 7 + this.config_length; // The number of bytes to the start of the index
        this.start_tile = this.start_index + this.config.index_count(); // The number of bytes to the start of the tiles

        this.isopen = true;
    }

    async close() {
        await this.handler.close();
        this.isopen = false;
    }

    /**
     * Return a single tile from a TileBase file
     *
     * @param {Number} z Z Coordinate
     * @param {Number} x X Coordinate
     * @param {Number} y Y Coordinate
     * @param {Boolean} unzip Auto unzip tiles
     *
     * @returns Buffer Tile
     */
    async tile(z, x, y, unzip = false) {
        if (!this.config.config.ranges[z]) throw new Error('Zoom not supported');
        if (x < this.config.config.ranges[z][0] || x > this.config.config.ranges[z][2]) throw new Error('X out of range');
        if (y < this.config.config.ranges[z][1] || x > this.config.config.ranges[z][3]) throw new Error('Y out of range');

        let tiles = 0;
        for (let c = this.config.config.min; c < z; c++) {
            tiles += (this.config.config.ranges[c][2] - this.config.config.ranges[c][0]) * (this.config.config.ranges[c][3] - this.config.config.ranges[c][1]) + 1;
        }

        const x_diff = this.config.config.ranges[z][2] - this.config.config.ranges[z][0];
        tiles += x_diff * (y - this.config.config.ranges[z][1]);
        tiles += x - this.config.config.ranges[z][0];

        const idxbuff = await this.handler.read(this.start_index + (tiles * 16), 16);

        const idx = Number(idxbuff.readBigUInt64LE(0));
        const size = Number(idxbuff.readBigUInt64LE(8));

        if (size === 0) {
            return Buffer.alloc(0);
        } else {
            let tile = await this.handler.read(this.start_tile + idx, size);

            if (!unzip) return tile;

            tile = await gunzip(tile);
            return new Uint8Array(tile).buffer;
        }
    }

    /**
     * Convert an MBtiles file to TileBase
     *
     * @param {String} input Location to input MBTiles
     * @param {String} output Location to output TileBase
     *
     * @returns TileBase
     */
    static to_tb(input, output) {
        return new Promise((resolve, reject) => {
            const config = {
                min: false,
                max: false,
                ranges: {}
            };

            new MBTiles(input + '?mode=ro', async (err, mbtiles) => {
                if (err) return reject(err);

                try {
                    const info = await getInfo(mbtiles);

                    if (isNaN(Number(info.minzoom))) return reject(new Error('Missing metadata.minzoom'));
                    if (isNaN(Number(info.maxzoom))) return reject(new Error('Missing metadata.maxzoom'));
                    if (!info.bounds) return reject(new Error('Missing metadata.bounds'));

                    config.min = info.minzoom;
                    config.max = info.maxzoom;

                    // Create Config File & Write to DB
                    for (let z = config.min; z <= config.max; z++) {
                        const min = tc.tiles(point([info.bounds[0], info.bounds[1]]).geometry, { min_zoom: z, max_zoom: z })[0];
                        const max = tc.tiles(point([info.bounds[2], info.bounds[3]]).geometry, { min_zoom: z, max_zoom: z })[0];

                        config.ranges[z] = [min[0], min[1], max[0], max[1]];
                    }
                    Config.write(output, config);

                    const tb = fs.createWriteStream(output, { flags:'a' });
                    const tbt = fs.createWriteStream(output + '.tiles');

                    let current_byte = BigInt(0);

                    // Request each of the tiles within a range for a specific zoom
                    for (let z = config.min; z <= config.max; z++) {
                        for (let x = config.ranges[z][0]; x <= config.ranges[z][2]; x++) {
                            for (let y = config.ranges[z][1]; y <= config.ranges[z][3]; y++) {
                                const tile = await getTile(mbtiles, z, x, y);
                                const tile_ln = BigInt(tile.length);

                                const tileloc = Buffer.alloc(16);
                                tileloc.writeBigUInt64LE(current_byte, 0);
                                tileloc.writeBigUInt64LE(tile_ln, 8);

                                tb.write(tileloc);
                                tbt.write(tile);

                                current_byte += tile_ln;
                            }
                        }
                    }

                    tbt.close();
                    fs.createReadStream(output + '.tiles').pipe(tb);

                    tb.on('close', () => {
                        fs.unlinkSync(output + '.tiles');
                        return resolve(new TileBase('file://' + output));
                    });
                } catch (err) {
                    return reject(err);
                }
            });
        });

        function getInfo(mbtiles) {
            return new Promise((resolve, reject) => {
                mbtiles.getInfo((err, info) => {
                    if (err) return reject(err);
                    return resolve(info);
                });
            });
        }

        function getTile(mbtiles, z, x, y) {
            return new Promise((resolve, reject) => {
                mbtiles.getTile(z, x, y, (err, tile) => {
                    if (err && err.message === 'Tile does not exist') return resolve(Buffer.alloc(0));
                    if (err) return reject(err);
                    return resolve(tile);
                });
            });
        }
    }
}

module.exports = TileBase;
