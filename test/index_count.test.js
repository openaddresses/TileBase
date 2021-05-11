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
    };

    // 16 bytes per tile
    t.equals(cnf.index_count(), 2 * 16);
    t.end();
});

test('config#index_count - 1 zoom', (t) => {
    const cnf = new Config({});
    cnf.config = {
        min: 8,
        max: 8,
        ranges: {
            '8': [50, 97, 51, 98]
        }
    };

    // 16 bytes per tile
    t.equals(cnf.index_count(), 4 * 16);
    t.end();
});

test('config#index_count - complex', (t) => {
    const cnf = new Config({});
    cnf.config = {
        min: 8,
        max: 15,
        ranges: {
            '8': [50, 97, 51, 98],
            '9': [100, 195, 103, 196],
            '10': [201, 390, 206, 393],
            '11': [403, 780, 413, 786],
            '12': [807, 1560, 826, 1572],
            '13': [1614, 3120, 1652, 3145],
            '14': [3228, 6240, 3305, 6290],
            '15': [6457, 12480, 6610, 12581]
        }
    };

    // 16 bytes per tile
    t.equals(cnf.index_count(), 21073 * 16);
    t.end();
});
