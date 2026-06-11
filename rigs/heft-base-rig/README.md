# @kraigwalker/heft-base-rig

Shared Heft baseline for Kraig Social Rush projects. This rig provides the common quality
phases that every buildable project can inherit.

## Capabilities

- `heft run --only lint` runs `oxlint .`.
- `heft run --only format` runs `oxfmt --check .`.
- `heft run --only fix` runs `oxlint . --fix` and then `oxfmt .`.
- All tasks delegate through `@kraigwalker/heft-toolchain`, so OXC dependency versions and
binary lookup stay centralized.

## Usage

Most projects should use one of the specialized rigs instead of this base rig directly. If a
tooling-only project only needs lint/format/fix, add these dev dependencies:

```json
{
  "devDependencies": {
    "@kraigwalker/heft-base-rig": "workspace:*",
    "@kraigwalker/heft-toolchain": "workspace:*",
    "@rushstack/heft": "1.2.17"
  }
}
```

Then add `config/rig.json`:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/rig-package/rig.schema.json",
  "rigPackageName": "@kraigwalker/heft-base-rig"
}
```

Use these package scripts:

```json
{
  "scripts": {
    "fix": "heft run --only fix",
    "format": "heft run --only format",
    "lint": "heft run --only lint",
    "_phase:fix": "heft run --only fix",
    "_phase:format": "heft run --only format",
    "_phase:lint": "heft run --only lint"
  }
}
```

## Rush Integration

Add `config/rush-project.json` operation settings for `_phase:lint`, `_phase:format`, and
`_phase:fix`. Use integer weights; lightweight quality phases should normally use `1`.

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/rush/v5/rush-project.schema.json",
  "operationSettings": [
    { "operationName": "_phase:lint", "weight": 1 },
    { "operationName": "_phase:format", "weight": 1 },
    { "operationName": "_phase:fix", "weight": 1 }
  ]
}
```

