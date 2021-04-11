const path = require('path');
const test = require('tape');
const {TileBase} = require('../');

test('Min', (t) => {
    const tb = new TileBase(path.resolve(__dirname, './fixtures', 'min.tb'));

    t.deepEquals(tb.config, {
        min: 14,
        max: 14,
        ranges: {
            14: [1, 1, 1, 1]
        }
    });

    t.end();
});
