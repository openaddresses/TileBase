import fs from 'fs';
import { promisify } from 'util';
import MBTiles from '@mapbox/mbtiles';
import bboxPolygon from '@turf/bbox-polygon';
import centroid from '@turf/centroid';
import TBError from './lib/error.js';

import zlib from 'zlib';
import TB from '@mapbox/tilebelt';

import Config from './lib/config.js';
import interfaces from './lib/interfaces.js';
const gunzip = promisify(zlib.gunzip);

/**
 * @class
 * @prop {Config} config Read Config Options
 * @prop {number} config_length Length of Config in Bytes
 *
 * @prop {number} start_index Byte Index to start of Tile Addresses
 * @prop {number} start_tile Byte Index to start of Tile Data
 * @prop {number} version TileBase Version
 *
 * @prop {boolean} isopen Is the TileBase file open
 *
 * @prop {FileHandle|MemHandle} handle TileBase read options
 */
class TileBase {
    /**
     * @constructor
     *
     * @param {string} url URL location of TileBase
     * @param {Object} opts Options Object
     */
    constructor(url, opts) {
        if (!opts) opts = {};
        this.isopen = false;

        this.version = null;

        this.config_length = 0; // The length of the config object in bytes

        const p = new URL(url);
        if (!interfaces[p.protocol]) throw new TBError(400, `${p.protocol} not supported`);

        this.handler = new interfaces[p.protocol](url);
        this.config = new Config(this);

        this.start_index = false;
        this.start_tile = false;

    }

    /**
     * Open a TileBase file for reading
     */
    async open() {
        if (this.isopen) throw new TBError(400, 'TileBase file is already open');

        await this.handler.open();

        await this.config.range();
        await this.config.read();
        await this.config.verify();

        this.start_index = 7 + this.config_length; // The number of bytes to the start of the index
        this.start_tile = this.start_index + this.config.index_count(); // The number of bytes to the start of the tiles

        this.isopen = true;
    }

    /**
     * Close a TileBase file from reading
     */
    async close() {
        if (!this.isopen) throw new TBError(400, 'TileBase file is already closed');

        await this.handler.close();
        this.isopen = false;
    }

    /**
     * Return the format of tiles in the TileBase file
     *
     * @return {string}
     */
    format() {
        return this.config.config.format;
    }

    /**
     * Return a partial TileJSON Object for the TileBase File
     * Note: TileBase file will not populate the URL fields
     *
     * @returns {Object} TileJSON Object
     */
    tilejson() {
        if (!this.isopen) throw new TBError(400, 'TileBase file is not open');

        const ul = TB.tileToBBOX([
            this.config.config.ranges[this.config.config.max][0],
            this.config.config.ranges[this.config.config.max][1],
            this.config.config.max
        ]);

        const lr = TB.tileToBBOX([
            this.config.config.ranges[this.config.config.max][2],
            this.config.config.ranges[this.config.config.max][3],
            this.config.config.max
        ]);

        const bounds = [ul[0], ul[1], lr[2], lr[3]];

        return {
            tilejson: '2.0.0',
            name: this.config.config.name,
            description: this.config.config.description || 'unspecified',
            attribution: this.config.config.attribution || 'unspecified',
            version: this.config.config.version || '1.0.0',
            scheme: 'xyz',
            tiles: [],
            minzoom: this.config.config.min,
            maxzoom: this.config.config.max,
            bounds: bounds,
            center: centroid(bboxPolygon(bounds)).geometry.coordinates
        };
    }

    /**
     * Return a single tile from a TileBase file
     *
     * @param {number} z Z Coordinate
     * @param {number} x X Coordinate
     * @param {number} y Y Coordinate
     * @param {boolean} unzip Auto unzip tiles
     *
     * @returns Buffer Tile
     */
    async tile(z, x, y, unzip = false) {
        if (!this.isopen) throw new TBError(400, 'TileBase file is not open');
        z = parseInt(z);
        x = parseInt(x);
        y = parseInt(y);

        for (const ele of [x, y, z]) {
            if (isNaN(ele)) throw new TBError(400, 'ZXY coordinates must be integers');
        }

        if (!this.config.config.ranges[z]) throw new TBError(404, 'Zoom not supported');
        if (x < this.config.config.ranges[z][0]) throw new TBError(404, 'X below range');
        if (x > this.config.config.ranges[z][2]) throw new TBError(404, 'X above range');
        if (y < this.config.config.ranges[z][1]) throw new TBError(404, 'Y below range');
        if (y > this.config.config.ranges[z][3]) throw new TBError(404, 'Y above range');

        let tiles = 0;
        // Calculate tile counts below requested zoom
        for (let c = this.config.config.min; c < z; c++) {
            tiles += (this.config.config.ranges[c][2] - this.config.config.ranges[c][0] + 1) * (this.config.config.ranges[c][3] - this.config.config.ranges[c][1] + 1);
        }

        // Calculate tile counts at requested zoom
        const x_diff = this.config.config.ranges[z][2] - this.config.config.ranges[z][0] + 1;
        const pre = x_diff * (y - this.config.config.ranges[z][1]);

        tiles += pre + x - this.config.config.ranges[z][0];

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
     * @param {string} input Location to input MBTiles
     * @param {string} output Location to output TileBase
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

                    if (isNaN(Number(info.minzoom))) return reject(new TBError(400, 'Missing metadata.minzoom'));
                    if (isNaN(Number(info.maxzoom))) return reject(new TBError(400, 'Missing metadata.maxzoom'));
                    if (!info.bounds) return reject(new TBError(400, 'Missing metadata.bounds'));

                    config.min = info.minzoom;
                    config.max = info.maxzoom;

                    // These are required by the mbtiles spec
                    config.name = info.name || 'Unnamed Dataset';
                    config.format = info.format || 'pbf';

                    // In the future we could look at ensuring these don't exceed max config size
                    // and auto truncating if they do - max size ~4gb
                    if (info.attribution) config.attribution = info.attribution;
                    if (info.description) config.attribution = info.description;
                    if (info.type) config.attribution = info.type;
                    if (info.version) config.attribution = info.version;

                    // Create Config File & Write to DB
                    for (let z = config.min; z <= config.max; z++) {
                        const ul = TB.pointToTile(
                            info.bounds[0] < -179 ? -179 : info.bounds[0],
                            info.bounds[3] > 85 ? 85 : info.bounds[3],
                            z
                        );

                        const lr = TB.pointToTile(
                            info.bounds[2] > 179 ? 179 : info.bounds[2],
                            info.bounds[1] < -85 ? -85 : info.bounds[1],
                            z
                        );

                        config.ranges[z] = [ul[0], ul[1], lr[0], lr[1]];
                    }

                    Config.write(output, config);

                    const tb = fs.createWriteStream(output, { flags:'a' });
                    const tbt = fs.createWriteStream(output + '.tiles');

                    let current_byte = BigInt(0);

                    // Request each of the tiles within a range for a specific zoom
                    for (let z = config.min; z <= config.max; z++) {
                        for (let y = config.ranges[z][1]; y <= config.ranges[z][3]; y++) {
                            for (let x = config.ranges[z][0]; x <= config.ranges[z][2]; x++) {
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
                    if (err instanceof TBError) return reject(err);
                    return reject(new TBError(500, err.message));
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

export default TileBase;
