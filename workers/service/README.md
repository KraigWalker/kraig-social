# Kraig Social Service Worker

Standalone ServiceWorker bundle for `@kraigwalker/kraig-social`.

## Scripts

- `rushx build` emits `dist/service-worker.js`.
- `rushx typecheck` validates the worker TypeScript project.
- `rushx lint` runs ESLint for the worker source.

The scaffold is intentionally passive. It claims clients after activation, but it does not define caching, offline behavior, or request interception yet.
