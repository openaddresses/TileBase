import test from 'tape';
import TileBase from '../tilebase.js';
import { VectorTile } from '@mapbox/vector-tile';
import MBTiles from '@mapbox/mbtiles';
import Protobuf from 'pbf';

test('TileBase#To_TB (complicated)', async (t) => {
    try {
        const tb = await TileBase.to_tb(new URL('./fixtures/mesa.mbtiles', import.meta.url).pathname, '/tmp/mesa.tb');
        await tb.open();

        t.ok(tb instanceof TileBase, 'TileBase');
        t.equals(tb.config_length, 147, 'config_length: 147');
        t.equals(tb.version, 1, 'version: 1');
        t.deepEquals(tb.config.config, {
            min: 8,
            max: 10,
            name: 'mesa.mbtiles',
            format: 'pbf',
            attribution: '2',
            ranges: {
                8: [50, 97, 51, 98],
                9: [100, 195, 103, 196],
                10: [201, 390, 206, 393]
            }
        }, 'config: { obj }');

        const mbt = await mbtiles(new URL('./fixtures/mesa.mbtiles', import.meta.url).pathname);

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

        t.deepEquals(tb.tilejson(), {
            tilejson: '2.0.0',
            name: 'mesa.mbtiles',
            description: 'unspecified',
            attribution: '2',
            version: '1.0.0',
            scheme: 'xyz',
            tiles: [],
            minzoom: 8,
            maxzoom: 10,
            bounds: [-109.3359375, 39.095962936305476, -107.2265625, 38.54816542304657],
            center: [-108.28125, 38.82206417967602]
        });

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

