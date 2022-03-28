import test from 'tape';
import TileBase from '../tilebase.js';
import TBError from '../lib/error.js';

test('Errors', async (t) => {
    try {
        const tb = new TileBase('file://' + new URL('./fixtures/min.tb', import.meta.url).pathname);

        try {
            await tb.tile(1, 1, 1);
            t.fail();
        } catch (err) {
            t.deepEquals(err, new TBError(400, 'TileBase file is not open'));
        }

        try {
            await tb.tilejson();
            t.fail();
        } catch (err) {
            t.deepEquals(err, new TBError(400, 'TileBase file is not open'));
        }

        try {
            await tb.close();
            t.fail();
        } catch (err) {
            t.deepEquals(err, new TBError(400, 'TileBase file is already closed'));
        }

        await tb.open();

        t.deepEquals(tb.config.config, {
            min: 14,
            max: 14,
            ranges: {
                14: [1, 1, 1, 1]
            }
        });

        try {
            await tb.tile(13, 1, 1);
            t.fail();
        } catch (err) {
            t.deepEquals(err, new TBError(404, 'Zoom not supported'));
        }

        try {
            await tb.tile(14, 2, 1);
            t.fail();
        } catch (err) {
            t.deepEquals(err, new TBError(404, 'X above range'));
        }

        try {
            await tb.tile(14, 0, 1);
            t.fail();
        } catch (err) {
            t.deepEquals(err, new TBError(404, 'X below range'));
        }

        try {
            await tb.tile(14, 1, 2);
            t.fail();
        } catch (err) {
            t.deepEquals(err, new TBError(404, 'Y above range'));
        }

        try {
            await tb.tile(14, 1, 0);
            t.fail();
        } catch (err) {
            t.deepEquals(err, new TBError(404, 'Y below range'));
        }

        await tb.close();
    } catch (err) {
        t.error(err);
    }

    t.end();
});
