# @kraigwalker/heft-node-service-rig

Heft rig for backend Node.js services. It extends `@kraigwalker/heft-base-rig`, so it includes
the shared OXC lint, format, and fix phases.

## Capabilities

- `heft run --only build -- --clean` deletes `lib` and runs `tsgo`.
- `heft run --only typecheck` runs `tsgo --noEmit`.
- `heft run --only test` runs `vitest run` through the shared toolchain.
- `heft run --only lint`, `format`, and `fix` come from the base rig.
- The rig/toolchain own Vitest. Service projects should not add direct `vitest` dependencies just
  to run unit tests.
- `tsgo` concurrency is controlled by `@kraigwalker/heft-toolchain`:
  - default local mode: `--checkers ${KRAIG_TSGO_CHECKERS:-4}`
  - `KRAIG_LOW_MEMORY=1` or `CI=true`: `--singleThreaded`
  - optional `config/heft-toolchain.json`: `{ "tsgoMode": "fast" | "balanced" | "single-threaded" }`

## Expected Project Shape

- Source files live under `src`.
- Build output goes to `lib`.
- The project owns its `tsconfig.json`; for ESM Node services, use NodeNext settings and emit JS:

```json
{
  "include": ["src/**/*.ts"],
  "compilerOptions": {
    "lib": ["ES2022"],
    "types": ["node"],
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "src",
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "skipLibCheck": true
  }
}
```

NodeNext projects should use `.js` extensions in relative TypeScript imports so emitted ESM
imports resolve in Node.

## Usage

Add dev dependencies:

```json
{
  "devDependencies": {
    "@kraigwalker/heft-node-service-rig": "workspace:*",
    "@kraigwalker/heft-toolchain": "workspace:*",
    "@rushstack/heft": "1.2.17"
  }
}
```

Add `config/rig.json`:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/rig-package/rig.schema.json",
  "rigPackageName": "@kraigwalker/heft-node-service-rig"
}
```

Use these package scripts:

```json
{
  "scripts": {
    "build": "heft run --only build -- --clean",
    "fix": "heft run --only fix",
    "format": "heft run --only format",
    "lint": "heft run --only lint",
    "test": "heft run --only test",
    "typecheck": "heft run --only typecheck",
    "_phase:build": "heft run --only build -- --clean",
    "_phase:fix": "heft run --only fix",
    "_phase:format": "heft run --only format",
    "_phase:lint": "heft run --only lint",
    "_phase:typecheck": "heft run --only typecheck"
  }
}
```

## Rush Integration

Use `lib` as the build cache output and integer operation weights:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/rush/v5/rush-project.schema.json",
  "operationSettings": [
    { "operationName": "_phase:build", "outputFolderNames": ["lib"], "weight": 2 },
    { "operationName": "_phase:typecheck", "weight": 2 },
    { "operationName": "_phase:lint", "weight": 1 },
    { "operationName": "_phase:format", "weight": 1 },
    { "operationName": "_phase:fix", "weight": 1 }
  ]
}
```
