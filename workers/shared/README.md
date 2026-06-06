# Kraig Social Shared Worker

Standalone SharedWorker bundle for `@kraigwalker/kraig-social`.

## Scripts

- `rushx build` emits `dist/shared-worker.js`.
- `rushx typecheck` validates the worker TypeScript project.
- `rushx lint` runs ESLint for the worker source.

The scaffold currently echoes messages back through each connected port so the app can verify wiring before a richer worker protocol is added.
