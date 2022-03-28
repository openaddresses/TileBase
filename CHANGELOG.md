# CHANGELOG

## Emoji Cheatsheet
- :pencil2: doc updates
- :bug: when fixing a bug
- :rocket: when making general improvements
- :white_check_mark: when adding tests
- :arrow_up: when upgrading dependencies
- :tada: when adding new features

## Version History

### v3.0.1

- :arrow_up: Update base deps

### v3.0.0

- :rocket: Enforce `format` & `name` config properties

### v2.0.0

- :rocket: Switch to be an ES Module

### v1.6.1

- :arrow_up: General Dep Maintenance - Update ESLint rules to ECMA v13

### v1.6.0

- :tada: Add suggested status codes to thrown Errors

### v1.5.0

- :tada: Add `.tilejson()` function for generating a minimal TileJSON Object
- :arrow_up: General Dep Update

### v1.4.0

- :bug: Fix a major bug in tile generation
- :arrow_up: Update all deps
- :white_check_mark: Add 1:1 (byte:byte) tests between GetTile in TileBase vs MBTiles

### v1.3.2

- :bug: Fix a bug in index_count where bounds weren't treated as inclusive
- :white_check_mark: Add tests to confirm index counts

### v1.3.1

- :rocket: Remove console log

### v1.3.0

- :bug: Fix a bug in bbox creation during conversion
- :rocket: Add stats printout at end of cli conversion

### v1.2.0

- :tada: Add support for `http://`, `https://`, & `s3://`

### v1.1.0

- :tada: Add Config class to clean up TileBase interface, most functions exposed via
         the config class are not things folks should use directly
- :tada: Add support for custom interfaces, currently support `file://`
- :arrow_up: Updated to latest deps
- :rocket: Add CI test runner & linter
- :rocket: Add Documentation.JS Linting
- :bug: Fix Docuemntation.JS class instances

### v1.0.0

- Initial Release
