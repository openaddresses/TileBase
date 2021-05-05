'use strict';

/**
 * @class TileBaseHTTP
 *
 * @prop {String} loc HTTP Location of TileBase File
 */
class TileBaseHTTP {
    /**
     * @constructor
     *
     * @param {String} loc HTTP Location of TileBase file
     */
    constructor(loc) {
        this.loc = loc;
    }

    /**
     * Return a buffer containing the requested bytes
     *
     * @param {BigInt} position     Byte to start reading
     * @param {BigInt} size         Number of bytes to read
     *
     * @returns {Buffer}
     */
    async read(position, size) {

    }
}

module.exports = TileBaseHTTP;
