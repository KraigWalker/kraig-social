# @kraigwalker/heft-vite-app-rig

Heft rig for React Router/Vite web applications. It extends `@kraigwalker/heft-base-rig`, so
it includes the shared OXC lint, format, and fix phases.

## Capabilities

- `heft run --only build -- --clean` deletes `dist` and runs `react-router build`.
- `heft run --only typecheck` runs `react-router typegen`, then `tsgo --noEmit`.
- `heft run --only test` runs `vitest run` through the shared toolchain.
- `heft run --only lint`, `format`, and `fix` come from the base rig.
- The rig owns the default Vite config, React Router app config, and shared TypeScript
  compiler options.
- The rig/toolchain own Vite and Vitest binaries. App projects should not add direct `vite` or
  `vitest` dependencies just to build or test.
- If an app needs additional Vite plugins, it may provide `vite.app.config.ts`; the rig merges that
  file with the shared React Router configuration.
- The app keeps ownership of routes, application source, static assets, and project-root-relative
  TypeScript include/path settings.
- `tsgo` concurrency is controlled by `@kraigwalker/heft-toolchain`:
  - default local mode: `--checkers ${KRAIG_TSGO_CHECKERS:-4}`
  - `KRAIG_LOW_MEMORY=1` or `CI=true`: `--singleThreaded`
  - optional `config/heft-toolchain.json`: `{ "tsgoMode": "fast" | "balanced" | "single-threaded" }`

## Expected Project Shape

- React Router application source and config live in the app project.
- The app needs a root `react-router.config.mjs` shim because React Router discovers that file
  from the project root:

```js
export { default } from '@kraigwalker/heft-vite-app-rig/react-router-config';
```

- `react-router typegen` writes `.react-router` files used by the app `tsconfig.json`.
- Production build output goes to `dist`.
- The app `tsconfig.json` should extend the rig config and contain only root-relative settings:

```json
{
  "extends": "@kraigwalker/heft-vite-app-rig/profiles/default/tsconfig.json",
  "include": ["**/*", "**/.server/**/*", "**/.client/**/*", ".react-router/types/**/*"],
  "compilerOptions": {
    "rootDirs": [".", "./.react-router/types"],
    "paths": {
      "~/*": ["./src/*"]
    }
  }
}
```

## Usage

Add dev dependencies:

```json
{
  "devDependencies": {
    "@kraigwalker/heft-toolchain": "workspace:*",
    "@kraigwalker/heft-vite-app-rig": "workspace:*",
    "@rushstack/heft": "1.2.17"
  }
}
```

Add `config/rig.json`:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/rig-package/rig.schema.json",
  "rigPackageName": "@kraigwalker/heft-vite-app-rig"
}
```

Use these package scripts:

```json
{
  "scripts": {
    "build": "heft run --only build -- --clean",
    "dev": "node node_modules/@kraigwalker/heft-toolchain/scripts/react-router-dev.cjs",
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

If the app imports test-only libraries, such as `@testing-library/react`, those dependencies belong
to the app. Tooling binaries such as Vite and Vitest stay in the rig/toolchain.

## Rush Integration

Use `dist` and `.react-router` as build outputs. Do not also claim `.react-router` as a
typecheck output; Rush requires outputs in one command to be disjoint.

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/rush/v5/rush-project.schema.json",
  "operationSettings": [
    { "operationName": "_phase:build", "outputFolderNames": ["dist", ".react-router"], "weight": 4 },
    { "operationName": "_phase:typecheck", "weight": 3 },
    { "operationName": "_phase:lint", "weight": 1 },
    { "operationName": "_phase:format", "weight": 1 },
    { "operationName": "_phase:fix", "weight": 1 }
  ]
}
```
