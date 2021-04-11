const path = require('path');
const test = require('tape');
const {TileBase} = require('../');

test('Min', (t) => {
    const tb = new TileBase(path.resolve(__dirname, './fixtures', 'min.tb'));

    t.deepEquals(tb.config, {

    });

    t.end();
});
