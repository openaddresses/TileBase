<h1 align=center>TileBase</h1>
<p align=center>Range Based Single File MBTiles-like Tile Store</p>

## Format Spec (v1)

A TileBase file is designed as a single file tile store. It is functionally similiar to a MBTiles file,
except it is optimized for Cloud Storage based serving and does not allow dynamic updates.

TileBase files allow Ranged requests from Cloud Storage providers, avoiding the generally expensive
operation of pushing individual tiles to the store.

__TileBase File__
```
<Magic Bytes><Fixed Length Tile Config>

<Variable Length Tile Config>
<Variable Length Tile Data>
```

### File Header

Every TileBase file will begin with `74 62` (`tb` in ASCII)  followed by an 8-bit unsigned integer
representing the TileBase spec version number.

Since there is currently only one version of the spec, all TileBase files will start with the following:
```
74 62 01
```

Following the Magic Bytes is a single 32 bit unsigned Bi Endian Integer containing the number of following bytes
that make up the JSON file config.

```
74
63      tb Magic Bytes
01      1
00
00
04
D3      1234 bytes
```

### File Config

```
{
    "min": <min zoom>,
    "max": <max zoom>,
    "ranges": {
        "<zoom>": [<min x>, <min y>, <max x>, <max y>]
    }
}
```

### Tile Config

```
LE-UInt64 Memory Address
```

### Tile Data


