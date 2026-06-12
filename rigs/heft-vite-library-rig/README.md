# @kraigwalker/heft-vite-library-rig

Heft rig for Vite-built libraries and future per-component UI packages. It extends
`@kraigwalker/heft-base-rig`, so it includes the shared OXC lint, format, and fix phases.

## Capabilities

- `heft run --only build -- --clean` deletes `dist`, emits declarations with `tsgo`, then runs
  `vite build`.
- `heft run --only typecheck` runs `tsgo --noEmit`.
- `heft run --only test` runs `vitest run` through the shared toolchain.
- `heft run --only lint`, `format`, and `fix` come from the base rig.
- The rig/toolchain own Vite and Vitest binaries. Library projects should not add direct `vite` or
  `vitest` dependencies just to build or test.
- The library owns its `vite.config.ts`, including library entry, formats, file names, externals,
  and sourcemap policy.
- `tsgo` concurrency is controlled by `@kraigwalker/heft-toolchain`:
  - default local mode: `--checkers ${KRAIG_TSGO_CHECKERS:-4}`
  - `KRAIG_LOW_MEMORY=1` or `CI=true`: `--singleThreaded`
  - optional `config/heft-toolchain.json`: `{ "tsgoMode": "fast" | "balanced" | "single-threaded" }`

## Expected Project Shape

- Source files live under `src`.
- Public exports should flow through `src/index.ts`.
- `tsconfig.json` should emit declarations into `dist`.
- `vite.config.ts` should use library mode and avoid emptying declaration output after `tsgo`
  runs. Set `build.emptyOutDir` to `false`.

Example Vite config:

```ts
export default {
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    modulePreload: { polyfill: false },
    sourcemap: true,
    target: 'es2022',
  },
};
```

## Usage

Add dev dependencies:

```json
{
  "devDependencies": {
    "@kraigwalker/heft-toolchain": "workspace:*",
    "@kraigwalker/heft-vite-library-rig": "workspace:*",
    "@rushstack/heft": "1.2.17"
  }
}
```

Add `config/rig.json`:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/rig-package/rig.schema.json",
  "rigPackageName": "@kraigwalker/heft-vite-library-rig"
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

Use `dist` as the cache output. For small UI component packages, start with weight `1` for
build and typecheck; larger libraries can use `2`.

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/rush/v5/rush-project.schema.json",
  "operationSettings": [
    { "operationName": "_phase:build", "outputFolderNames": ["dist"], "weight": 1 },
    { "operationName": "_phase:typecheck", "weight": 1 },
    { "operationName": "_phase:lint", "weight": 1 },
    { "operationName": "_phase:format", "weight": 1 },
    { "operationName": "_phase:fix", "weight": 1 }
  ]
}
```
