const fs = require('fs');

/**
 * @class Tilebase
 *
 * @prop {Path} loc Location of Input TileBase
 * @prop {Object} config Read Config Options
 * @prop {Number} config_length Length of Config in Bytes
 * @prop {FileHandle} handle FileHandle to loc
 */
class TileBase {
    /**
     * @constructor
     */
    constructor(loc) {
        this.loc = loc;
        this.config_length = 0;

        this.handle = fs.openSync(loc);
        this.config = {};

        this.read_config();
    }

    /**
     * Read the config portion of a TileBase file
     *   Note: usually called by the constructor
     */
    read_config() {
        const buff = new Buffer.alloc(7);
        fs.readSync(this.handle, buff);

        if (buff[0] !== 116 && buff[1] !== 98) {
            throw new Error('Invalid TileBase File');
        } if (buff[2] !== 1) {
            throw new Error('Unsupported Version');
        }

        this.config_length = buff.readUInt32BE(3);
        console.error(this.config_length)

        let config = new Buffer.alloc(this.config_length);
        fs.readSync(this.handle, config), 7;
        try {
            this.config = JSON.parse(config.toString());
        } catch (err) {
            throw new Error('JSON Config could not be parsed');
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

module.exports = TileBase;
