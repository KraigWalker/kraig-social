# @kraigwalker/heft-worker-rig

Heft rig for web worker, service worker, and shared worker bundles. It extends
`@kraigwalker/heft-base-rig`, so it includes the shared OXC lint, format, and fix phases.

## Capabilities

- `heft run --only build -- --clean` deletes `dist` and runs `vite build`.
- `heft run --only typecheck` runs `tsgo --noEmit`.
- `heft run --only test` runs `vitest run` through the shared toolchain.
- `heft run --only lint`, `format`, and `fix` come from the base rig.
- The rig/toolchain own Vite and Vitest binaries. Worker projects should not add direct `vite` or
  `vitest` dependencies just to build or test.
- The worker package owns its `vite.config.ts`, including input file and output file names.
- `tsgo` concurrency is controlled by `@kraigwalker/heft-toolchain`:
  - default local mode: `--checkers ${KRAIG_TSGO_CHECKERS:-4}`
  - `KRAIG_LOW_MEMORY=1` or `CI=true`: `--singleThreaded`
  - optional `config/heft-toolchain.json`: `{ "tsgoMode": "fast" | "balanced" | "single-threaded" }`

## Expected Project Shape

- Worker source lives under `src`.
- `tsconfig.json` should include the appropriate worker libs, for example `["ES2022", "WebWorker"]`.
- `vite.config.ts` should set a single worker entry and stable output name.

Example Vite build settings:

```ts
export default {
  build: {
    emptyOutDir: true,
    modulePreload: { polyfill: false },
    outDir: 'dist',
    rollupOptions: {
      input: 'src/service-worker.ts',
      output: {
        entryFileNames: 'service-worker.js',
        format: 'es',
      },
    },
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
    "@kraigwalker/heft-worker-rig": "workspace:*",
    "@rushstack/heft": "1.2.17"
  }
}
```

Add `config/rig.json`:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/rig-package/rig.schema.json",
  "rigPackageName": "@kraigwalker/heft-worker-rig"
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

Use `dist` as the build cache output and integer operation weights:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/rush/v5/rush-project.schema.json",
  "operationSettings": [
    { "operationName": "_phase:build", "outputFolderNames": ["dist"], "weight": 2 },
    { "operationName": "_phase:typecheck", "weight": 2 },
    { "operationName": "_phase:lint", "weight": 1 },
    { "operationName": "_phase:format", "weight": 1 },
    { "operationName": "_phase:fix", "weight": 1 }
  ]
}
```
