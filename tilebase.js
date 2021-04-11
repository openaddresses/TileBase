const fs = require('fs');

/**
 * @class Tilebase
 *
 * @prop {Path} loc Location of Input TileBase
 */
class TileBase {
    /**
     * @constructor
     */
    constructor(loc) {
        this.loc = loc;

        this.config();
    }

    /**
     * Read the config portion of a TileBase file
     *   Note: usually called by the constructor
     */
    config() {

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
