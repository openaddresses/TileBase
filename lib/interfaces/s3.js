'use strict';

/**
 * @class TileBaseS3
 *
 * @prop {String} loc S3 Location of TileBase File
 */
class TileBaseS3 {
    /**
     * @constructor
     *
     * @param {String} loc S3 Location of TileBase file
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

module.exports = TileBaseS3;
