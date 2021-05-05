'use strict';

const AWS = require('aws-sdk');
const s3 = new AWS.S3();

/**
 * @class
 * @prop {string} url S3 Location of TileBase File
 */
class TileBaseS3 {
    /**
     * @constructor
     *
     * @param {string} url S3 Location of TileBase file
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
        const u = new URL(this.url);
        const res = await s3.getObject({
            Bucket: u.host,
            Key: u.pathname.replace(/^\//, ''),
            Range: `bytes=${position}-${position + size - 1}`
        }).promise();

        return res.Body;
    }

    async close() {
        this.isopen = false;
    }
}

module.exports = TileBaseS3;
