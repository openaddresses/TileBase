'use strict';

/**
 * @class
 * @extends Error
 *
 * @param {number} status Suggested HTTP Status
 * @param {string} message Error Message
 */
class TBError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

module.exports = TBError;
