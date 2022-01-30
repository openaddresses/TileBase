'use strict';

import fetch from 'node-fetch';

/**
 * @class
 * @prop {string} url HTTP Location of TileBase File
 */
class TileBaseHTTP {
    /**
     * @constructor
     *
     * @param {string} url HTTP Location of TileBase file
     */
    constructor(url) {
        this.url = url;
    }

    async open() {
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
        const res = await fetch(this.url, {
            method: 'GET',
            headers: {
                Range: `bytes=${position}-${position + size - 1}`
            }
        });

        return await res.buffer();
    }

    async close() {
        this.isopen = false;
    }
}

export default TileBaseHTTP;
