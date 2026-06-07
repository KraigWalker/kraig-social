# Kraig Social Service Worker

Standalone ServiceWorker bundle for `@kraigwalker/kraig-social`.

This package is maintained as its own Rush project so the ServiceWorker can have an independent source tree, build output, typecheck, and dependency graph while still being released with the main `kraig-social` app.

## Scripts

- `rushx build` emits `dist/service-worker.js`.
- `rushx typecheck` validates the worker TypeScript project.
- `rushx lint` runs ESLint for the worker source.

The scaffold is intentionally passive. It claims clients after activation, but it does not define caching, offline behavior, or request interception yet.

## Monorepo release policy

This package belongs to the Rush version policy named `kraig-social`.

The policy is configured in `common/config/rush/version-policies.json` and attached in `rush.json` to:

- `@kraigwalker/kraig-social`
- `@kraigwalker/kraig-social-service-worker`
- `@kraigwalker/kraig-social-shared-worker`

The policy uses `lockStepVersion`, which means these packages should move through release versions together. Do not manually edit the `version` field in this package's `package.json` for a release. Rush owns release version changes through the version policy.

## Browser update detection

The Rush version policy does not control when a browser installs a new ServiceWorker.

Rush versions are repository and release metadata. They help the monorepo keep `@kraigwalker/kraig-social`, `@kraigwalker/kraig-social-service-worker`, and `@kraigwalker/kraig-social-shared-worker` on the same release number, and they drive changelogs/publish workflows.

Browsers detect ServiceWorker updates by fetching the registered worker script URL and comparing the script bytes with the previously installed worker. A package version bump alone does not make a browser update the worker unless the deployed `service-worker.js` response changes at the registered URL.

In practice:

- A changed worker source file should produce changed `dist/service-worker.js` bytes, which browsers can detect after deployment.
- A Rush-only version bump may not change the emitted worker script. If the deployed script bytes are identical, browsers should treat it as the same worker.
- The registered ServiceWorker URL, response headers, and deployment cache behavior matter. Do not let a CDN or reverse proxy serve stale `service-worker.js` when a worker update is intended.
- Avoid relying on filename hashes for the registered worker script unless the app registration code is also updated. Browsers update the worker associated with the registered script URL.

## Releasing changes

For normal changes to this worker:

1. Make the source change in `workers/service`.
2. Run validation from the repo root:

```bash
rush build --to @kraigwalker/kraig-social
```

3. If the change affects runtime behavior, add a Rush change file:

```bash
rush change
```

4. When prompted, choose the affected worker package and the appropriate change type. Because this project is part of the `kraig-social` lock-step policy, the resulting release version is coordinated with the app and the shared worker.

For release preparation:

1. Confirm `common/config/rush/version-policies.json` has the intended `nextBump` for the `kraig-social` policy.
2. Run the repo's normal Rush versioning step from the release branch:

```bash
rush version
```

3. Review the generated version and changelog changes before committing them.
4. Run the release build:

```bash
rush build --to @kraigwalker/kraig-social
```

The web app depends on this package using `workspace:*`, so Rush builds this worker before the app when building to `@kraigwalker/kraig-social`.

## Release checklist

- Do not publish or version this worker separately from the `kraig-social` policy.
- Do not manually edit package versions for release bumps.
- Keep generated `dist/` output out of source control unless the repo policy changes.
- Commit any Rush-generated lockfile or repo-state updates from `rush update`.
- Include a change file for runtime behavior changes so release notes explain why the worker version changed.
