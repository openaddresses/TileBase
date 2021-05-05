<h1 align=center>TileBase</h1>
<p align=center>Range Based Single File MBTiles-like Tile Store</p>

## Usage

TileBase can be accessed in several ways through the following client libraries

| Language | Link |
| -------- | ---- |
| NodeJS   | [USAGE](https://openaddresses.github.io/tilebase/)

## Command Line Library

The default command line requires that node be installed. The easiest way to do this
is usually via [NVM](https://github.com/nvm-sh/nvm)

Once node is installed, from the git repository, run the following to install
dependencies.


```sh
npm install
```

```sh
npm link
```

The TileBase cli should now be able to be used from your command line via

```sh
tilebase --help
```

## Format Spec (v1)

A TileBase file is designed as a single file tile store. It is functionally similiar to a MBTiles file,
except it is optimized for Cloud Storage based serving and does not allow dynamic updates.

TileBase files allow Ranged requests from Cloud Storage providers, avoiding the generally expensive
operation of pushing individual tiles to the store.

__TileBase File__
```
<Magic Bytes><Version><File Config Length>
<Variable Length File Config>
<Variable Length Tile Addresses>
<Variable Length Tile Data>
```

### File Header

Every TileBase file will begin with `74 62` (`tb` in ASCII)  followed by an 8-bit unsigned integer
representing the TileBase spec version number.

Since there is currently only one version of the spec, all TileBase files will start with the following:
```
74 62 01
```

Following the Magic Bytes is a single 32 bit unsigned Little Endian Integer containing the number of following bytes
that make up the JSON file config.

```
74
62      tb Magic Bytes
01      1
D3
04
00
00      1234 bytes
```

### File Config

After the header, a stringified JSON object contains the config necessary to read the
TileBase file. The length of the binary JSON config MUST be equal to the length
specifier preceding the config.

```
{
    "min": <min zoom>,
    "max": <max zoom>,
    "ranges": {
        "<zoom>": [<min x>, <min y>, <max x>, <max y>]
        ...
    }
}
```

### Tile Addresses

After the JSON config is a block of Tile Addresses. There will be one tile
address for every tile that would fall within the rectangular `ranges` array.
Should a vector tile be empty, it will have a `Byte Address` to where the tile
would have been in the file, however with a `Vector Tile Size` of 0.

Byte addresses reference the number of bytes to the initial byte from the end
of the TileAddresses Block.

IE: the first byte address of any TileBase file will be 0, as it will be the
first byte after the Tile Addresses block.

_Example: Single Tile Address_
```
<LE-UInt64 Byte Address><LE-UInt64 Vector Tile Size>
```

### Tile Data

Tile Data is simply a blob of continuous gzipped Mapbox Vector Tiles. Their order
is determined simply by the order in which they are reference by the Tile
Address blob.

