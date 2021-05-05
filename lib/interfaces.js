'use strict';
module.exports = {
    'file:': require('./interfaces/file'),
    's3:': require('./interfaces/s3'),
    'http:': require('./interfaces/http'),
    'https:': require('./interfaces/http')
};
