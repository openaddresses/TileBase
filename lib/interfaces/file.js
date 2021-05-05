'use strict';

const fs = require('fs/promises');

/**
 * @class TileBaseFile
 *
 * @prop {string} loc Location of TileBase File
 */
class TileBaseFile {
    /**
     * @constructor
     *
     * @param {string} loc Location of TileBase file
     */
    constructor(loc) {
        this.isopen = false;
        this.loc = loc;
        this.handler = false
    }

    async open() {
        this.handler = await fs.open((new URL(this.loc)).pathname);
        this.isopen = true;
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
        const buff = Buffer.alloc(size);
        await this.handler.read(buff, 0, size, position);

        return buff;
    }

    async close() {
        await this.handler.close();
        this.isopen = false;
    }
}

module.exports = TileBaseFile;
