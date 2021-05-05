'use strict';

const test = require('tape');
const path = require('path');
const TileBase = require('../tilebase.js');
const { VectorTile } = require('@mapbox/vector-tile');
const Protobuf = require('pbf');

test('TileBase(s3://)', async (t) => {
    try {
        const tb = new TileBase('s3://v2.openaddresses.io/tilebase/test.tb');

        await tb.open();

        t.ok(tb instanceof TileBase, 'TileBase');
        t.equals(tb.config_length, 318, 'config_length: 318');
        t.equals(tb.version, 1, 'version: 1');
        t.deepEquals(tb.config.config, {
            min: 0,
            max: 14,
            ranges: {
                0: [0, 0, 0, 0],
                1: [0, 0, 0, 0],
                2: [1, 1, 1, 1],
                3: [2, 3, 2, 3],
                4: [4, 6, 4, 6],
                5: [8, 12, 8, 12],
                6: [17, 24, 17, 24],
                7: [35, 48, 35, 48],
                8: [71, 97, 71, 97],
                9: [143, 195, 143, 195],
                10: [286, 391, 286, 391],
                11: [572, 783, 572, 783],
                12: [1144, 1567, 1144, 1567],
                13: [2289, 3135, 2289, 3135],
                14: [4579, 6271, 4579, 6271]
            }
        }, 'config: { obj }');

        let tile = false;
        tile = await tb.tile(0, 0, 0, true);
        tile = new VectorTile(new Protobuf(tile));
        t.equals(tile.layers.feat.length, 1, 'z0 feat');

        tile = await tb.tile(1, 0, 0, true);
        tile = new VectorTile(new Protobuf(tile));
        t.equals(tile.layers.feat.length, 1, 'z1 feat');

        tile = await tb.tile(2, 1, 1, true);
        tile = new VectorTile(new Protobuf(tile));
        t.equals(tile.layers.feat.length, 1, 'z2 feat');

        tile = await tb.tile(14, 4579, 6271, true);
        tile = new VectorTile(new Protobuf(tile));
        t.equals(tile.layers.feat.length, 1, 'z14 feat');

        await tb.close();
    } catch (err) {
        t.error(err, 'no errors');
    }

    t.end();
});
