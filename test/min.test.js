'use strict';

import path = from 'path';
import test from 'tape';
import TileBase from '../tilebase.js';

test('Min', async (t) => {
    try {
        const tb = new TileBase('file://' + path.resolve(__dirname, './fixtures', 'min.tb'));
        await tb.open();

        t.deepEquals(tb.config.config, {
            min: 14,
            max: 14,
            ranges: {
                14: [1, 1, 1, 1]
            }
        });

        await tb.close();
    } catch (err) {
        t.error(err);
    }

    t.end();
});
