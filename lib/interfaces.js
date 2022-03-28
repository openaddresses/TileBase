import file from './interfaces/file.js';
import s3 from './interfaces/s3.js';
import http from './interfaces/http.js';

export default {
    'file:': file,
    's3:': s3,
    'http:': http,
    'https:': http
};
