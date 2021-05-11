'use strict';

const test = require('tape');
const Config = require('../lib/config');

test('config#index_count - simply', (t) => {
    const cnf = new Config({});
    cnf.config = {
        min: 4,
        max: 5,
        ranges: {
            4: [1, 2, 1, 2],
            5: [1, 2, 1, 2]
        }
    }

    // 16 bytes per tile
    t.equals(cnf.index_count(), 2 * 16);
    t.end();
});

test('config#index_count - complex', (t) => {
    const cnf = new Config({});
    cnf.config = {
        min: 4,
        max: 5,
        ranges: {
            4: [1, 2, 1, 2],
            5: [1, 2, 1, 2]
        }
    }

    // 16 bytes per tile
    t.equals(cnf.index_count(), 2 * 16);
    t.end();
});
