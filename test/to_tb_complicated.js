'use strict';

const test = require('tape');
const path = require('path');
const TileBase = require('../tilebase.js');
const { VectorTile } = require('@mapbox/vector-tile');
const MBTiles = require('@mapbox/mbtiles');
const Protobuf = require('pbf');

test('TileBase#To_TB (complicated)', async (t) => {
    try {
        const tb = await TileBase.to_tb(path.resolve(__dirname, './fixtures/mesa.mbtiles'), '/tmp/mesa.tb');
        await tb.open();

        t.ok(tb instanceof TileBase, 'TileBase');
        t.equals(tb.config_length, 92, 'config_length: 92');
        t.equals(tb.version, 1, 'version: 1');
        t.deepEquals(tb.config.config, {
            min: 8,
            max: 10,
            ranges: {
                8: [50, 97, 51, 98],
                9: [100, 195, 103, 196],
                10: [201, 390, 206, 393]
            }
        }, 'config: { obj }');

        const mbt = await mbtiles(path.resolve(__dirname, './fixtures/mesa.mbtiles'));

        // Iterate through each tile and validate that it is a VT
        let tiles = 0;
        for (const zoom of Object.keys(tb.config.config.ranges)) {
            for (let x = tb.config.config.ranges[zoom][0]; x <= tb.config.config.ranges[zoom][2]; x++) {
                for (let y = tb.config.config.ranges[zoom][1]; y <= tb.config.config.ranges[zoom][3]; y++) {
                    tiles++;

                    const orig_tile = await tb.tile(zoom, x, y, false);
                    const mbt_tile = await getTile(mbt, zoom, x, y);

                    t.deepEquals(mbt_tile, orig_tile);

                    const tile = new VectorTile(new Protobuf(await tb.tile(zoom, x, y, true)));
                    t.ok(tile, `${zoom}/${x}/${y} is valid`);

                }
            }
        }

        t.equals(tiles, 36, 'correct total tile count');

        await tb.close();
    } catch (err) {
        t.error(err, 'no errors');
    }

    t.end();
});

function mbtiles(input) {
    return new Promise((resolve, reject) => {
        new MBTiles(input + '?mode=ro', (err, mbtiles) => {
            if (err) return reject(err);
            return resolve(mbtiles);
        });
    });
}

function getTile(mbtiles, z, x, y) {
    return new Promise((resolve, reject) => {
        mbtiles.getTile(z, x, y, (err, tile) => {
            if (err && err.message === 'Tile does not exist') return resolve(Buffer.alloc(0));
            if (err) return reject(err);
            return resolve(tile);
        });
    });
}
