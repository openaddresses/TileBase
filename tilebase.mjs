import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';
import { promisify } from 'util';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import MBTiles from '@mapbox/mbtiles';
import tc from '@mapbox/tile-cover';
import { point } from '@turf/helpers';

const __dirname = dirname(fileURLToPath(import.meta.url));

const schema = JSON.parse(fs.readFileSync(path.resolve(__dirname, './lib/schema.json')));

/**
 * @class Tilebase
 *
 * @prop {Object} config Read Config Options
 * @prop {Number} config_length Length of Config in Bytes
 * @prop {FileHandle|MemHandle} handle TileBase read options
 */
export default class TileBase {
    /**
     * @constructor
     */
    constructor(loc) {
        this.config_length = 0;

        this.version = null;
        this.handle = fs.openSync(loc);
        this.config = {};

        this.config_range();
        this.config_read();
        this.config_verify(this.config);
    }

    /**
     * Read the config portion of a TileBase file
     *   Note: usually called by the constructor
     *
     * @returns {Number} Bytes of Config Data
     */
    config_range() {
        const buff = new Buffer.alloc(7);
        fs.readSync(this.handle, buff);

        if (buff[0] !== 116 && buff[1] !== 98) {
            throw new Error('Invalid TileBase File');
        } if (buff[2] !== 1) {
            throw new Error('Unsupported Version');
        }

        this.version = buff[2];
        this.config_length = buff.readUInt32BE(3);

        return this.config_length;
    }

    config_read() {
        let config = new Buffer.alloc(this.config_length);
        fs.readSync(this.handle, config), 7;
        try {
            this.config = JSON.parse(config.toString());
        } catch (err) {
            throw new Error('JSON Config could not be parsed');
        }
    }

    config_verify(config) {
        const ajv = new Ajv();
        const valid = ajv.validate(schema, config);
        if (!valid) throw new Error(JSON.stringify(ajv.errors));

        for (let z = config.min; z <= config.max; z++) {
            const range = config.ranges[z];
        }
    }

    /**
     * Return a single tile from a TileBase file
     *
     * @param {Number} z Z Coordinate
     * @param {Number} x X Coordinate
     * @param {Number} y Y Coordinate
     *
     * @returns Buffer Tile
     */
    async tile(z, x, y) {
        if (!this.config.ranges[z]) throw new Error('Zoom not supported');
        if (x < this.config.ranges[z][0] || x > this.config.ranges[z][2]) throw new Error('X out of range');
        if (y < this.config.ranges[z][1] || x > this.config.ranges[z][3]) throw new Error('Y out of range');

        let bytes = 0;
        for (let c = this.config.min; c < z; c++) {
            bytes += (this.config.ranges[c][2] - this.config.ranges[c][0]) * (this.config.ranges[c][3] - this.config.ranges[c][1]) + 1
        }

        const x_diff = this.config.ranges[z][2] - this.config.ranges[z][0];
        bytes += x_diff * (y - this.config.ranges[z][1]);
        bytes += x - this.config.ranges[z][0]

        return bytes;
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
                    TileBase.write_config(output, config);

                    const tb = fs.createWriteStream(output, { flags:'a' });
                    const tbt = fs.createWriteStream(output + '.tiles');

                    let current_byte = BigInt(0);

                    // Request each of the tiles within a range for a specific zoom
                    for (let z = config.min; z <= config.max; z++) {
                        for (let x = config.ranges[z][0]; x <= config.ranges[z][2]; x++) {
                            for (let y = config.ranges[z][1]; y <= config.ranges[z][3]; y++) {
                                const tile = await getTile(mbtiles, z, x, y);
                                const tile_ln = BigInt(tile.length);

                                let tileloc = Buffer.alloc(16);
                                tileloc.writeBigUInt64LE(current_byte, 0)
                                tileloc.writeBigUInt64LE(tile_ln, 8)

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
                        return resolve(new TileBase(output));
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
                mbtiles.getTile(z, x, y, (err, info) => {
                    if (err && err.message === 'Tile does not exist') return resolve(Buffer.alloc(0));
                    if (err) return reject(err);
                    return resolve(info);
                });
            });
        }
    }

    static write_config(output, config) {
        config = JSON.stringify(config);
        if (config.length > 4294967295) throw new Error('Config Exceeds allowed byte size');

        const buff = new Buffer.alloc(7 + config.length);
        buff[0] = 116; // Magic Number
        buff[1] = 98;
        buff[2] = 1; // Version Number
        buff.writeUInt32BE(config.length, 3)
        buff.write(config, 7);

        fs.writeFileSync(output, buff);
    }

    /**
     * Convert a TileBase file to MBTiles
     *
     * @param {String} output Location to output MBTiles
     */
    to_mbtiles(output) {

    }
}
