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
