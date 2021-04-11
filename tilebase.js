const fs = require('fs');

/**
 * @class Tilebase
 *
 * @prop {Object} config Read Config Options
 * @prop {Number} config_length Length of Config in Bytes
 * @prop {FileHandle|MemHandle} handle TileBase read options
 */
class TileBase {
    /**
     * @constructor
     */
    constructor(loc) {
        this.config_length = 0;

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
        if (!config.min) throw new Error('Config.min value must be present');
        config.min = parseInt(config.min);
        if (isNaN(config.min)) throw new Error('Config.min must be an integer');

        if (!config.max) throw new Error('Config.max value must be present');
        config.max = parseInt(config.max);
        if (isNaN(config.min)) throw new Error('Config.max must be an integer');

        if (!config.ranges) throw new Error('Config.ranges value must be present');
        if (typeof config.ranges !== 'object') throw new Error('Config.ranges must be an object');

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
     * @param {String} output Location to output TileBase
     *
     * @returns TileBase
     */
    static to_tb(output) {

    }

    /**
     * Convert a TileBase file to MBTiles
     *
     * @param {String} output Location to output MBTiles
     */
    to_mbtiles(output) {

    }
}

module.exports = {
    TileBase
};
