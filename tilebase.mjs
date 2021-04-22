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
    tile(z, x, y) {

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

            new MBTiles(input + '?mode=ro', (err, mbtiles) => {
                if (err) return reject(err);

                mbtiles.getInfo((err, info) => {
                    if (err) return reject(err);

                    if (isNaN(Number(info.minzoom))) return reject(new Error('Missing metadata.minzoom'));
                    if (isNaN(Number(info.maxzoom))) return reject(new Error('Missing metadata.maxzoom'));
                    if (!info.bounds) return reject(new Error('Missing metadata.bounds'));

                    config.min = info.minzoom;
                    config.max = info.maxzoom;

                    for (let z = config.min; z <= config.max; z++) {
                        const min = tc.tiles(point([info.bounds[0], info.bounds[1]]).geometry, { min_zoom: z, max_zoom: z })[0];
                        const max = tc.tiles(point([info.bounds[2], info.bounds[3]]).geometry, { min_zoom: z, max_zoom: z })[0];

                        config.ranges[z] = [min[0], min[1], max[0], max[1]];
                    }

                    TileBase.write_config(output, config);

                    return resolve(new TileBase(output));
                });
            });
        });
    }

    static write_config(output, config) {
        config = JSON.stringify(config);

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
