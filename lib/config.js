'use strict';

const fs = require('fs');
const os = require('os');
const Ajv = require('ajv');
const schema = require('./schema.json');
const fs = require('fs/promises');

/**
 * @class
 * @prop {TileBase} tb TileBase Object
 * @prop {Object} config
 * @prop {number} config.min Min Zoom
 * @prop {number} config.max Maz Zoom
 * @prop {Object} config.ranges BBOX Ranges per zoom level
 *
 * @prop {FileHandle} cache
 */
class Config {
    constructor(tb) {
        this.tb = tb;
        this.config = {};

        this.cache = false;
    }

    /**
     * Write the header & config option to a given file location
     *
     * @param {string} output TileBase file to output to
     * @param {Object} config Config JSON Object
     */
    static write(output, config) {
        config = JSON.stringify(config);
        if (config.length > 4294967295) throw new Error('Config Exceeds allowed byte size');

        const buff = new Buffer.alloc(7 + config.length);
        buff[0] = 116; // Magic Number
        buff[1] = 98;
        buff[2] = 1; // Version Number
        buff.writeUInt32LE(config.length, 3);
        buff.write(config, 7);

        fs.writeFileSync(output, buff);
    }

    /**
     * Cache the config & TileAddresses to the local fs
     */
    async cache() {
        this.cache = await fs.open((new URL(this.url)).pathname);
    }

    /**
     * Read a config file from the TileBase file
     */
    async read() {
        const buff = await this.tb.handler.read(7, this.tb.config_length);

        try {
            this.config = JSON.parse(buff.toString());
        } catch (err) {
            throw new Error('JSON Config could not be parsed');
        }
    }

    /**
     * Verify the current config file against the schema
     */
    verify() {
        const ajv = new Ajv();
        const valid = ajv.validate(schema, this.config);
        if (!valid) throw new Error(JSON.stringify(ajv.errors));

        for (let z = this.config.min; z <= this.config.max; z++) {
            const range = this.config.ranges[z];

            if (range.length !== 4) throw new Error('Each .ranges entry must contain 4 tile bounds');
            for (const r of range) {
                if (isNaN(Number(r))) throw new Error('Each .ranges entry must contain numeric tile bounds');
            }
        }
    }

    /**
     * Return the number of bytes in the Tile Address Block
     *
     * @returns {number}
     */
    index_count() {
        let tiles = 0;
        for (let c = this.config.min; c <= this.config.max; c++) {
            tiles += (this.config.ranges[c][2] - this.config.ranges[c][0] + 1) * (this.config.ranges[c][3] - this.config.ranges[c][1] + 1);
        }

        return tiles * 16;
    }


    /**
     * Read the config portion of a TileBase file
     *   Note: usually called by the constructor
     *
     * @returns {number} Bytes of Config Data
     */
    async range() {
        const buff = await this.tb.handler.read(0, 7);

        if (!buff) throw new Error('No buffer returned');
        if (buff.length !== 7) throw new Error('Incorrect buffer length returned');

        if (buff[0] !== 116 && buff[1] !== 98) {
            throw new Error('Invalid TileBase File');
        } if (buff[2] !== 1) {
            throw new Error('Unsupported Version');
        }

        this.tb.version = buff[2];
        this.tb.config_length = buff.readUInt32LE(3);

        return this.tb.config_length;
    }
}

module.exports = Config;
