'use strict';

import fs from 'fs/promises';

/**
 * @class
 * @prop {string} url Location of TileBase File
 */
class TileBaseFile {
    /**
     * @constructor
     *
     * @param {string} url Location of TileBase file
     */
    constructor(url) {
        this.isopen = false;
        this.url = url;
        this.handler = false
    }

    async open() {
        this.handler = await fs.open((new URL(this.url)).pathname);
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

export default TileBaseFile;
