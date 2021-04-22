const test = require('tape');
const path = require('path');
const {TileBase} = require('../');

test('TileBase#Config', async (t) => {
    try {
        await TileBase.to_tb(path.resolve(__dirname, './fixtures/single.mbtiles'), '/tmp/test.tb');
    } catch (err) {
        t.error(err, 'no errors');
    }

    t.end();
});
