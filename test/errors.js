'use strict';

const path = require('path');
const test = require('tape');
const TileBase = require('../');
const TBError = require('../lib/error');

test('Errors', async (t) => {
    try {
        const tb = new TileBase('file://' + path.resolve(__dirname, './fixtures', 'min.tb'));

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
