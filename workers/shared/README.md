# Kraig Social Shared Worker

Standalone SharedWorker bundle for cross-tab coordination experiments in Kraig Social.

## Current Behavior

The worker accepts `connect` events, starts each connected port, and echoes incoming messages back
with a `kraig-social:shared-worker:message` envelope. This keeps the app wiring testable while the
delivery platform evolves.

## Intended Use

Future iterations can use this worker for:

- sharing gateway decision state across tabs
- coalescing manifest polling
- coordinating content unlock attempts
- broadcasting developer-signal status to multiple open windows

Keep the protocol explicit and versioned before the worker becomes stateful.

## Development Commands

Run commands from this folder:

```bash
rushx build
rushx typecheck
rushx lint
```

This project uses `@kraigwalker/heft-worker-rig`. Vite is provided by the rig/toolchain, not by
this package.

## Maintainer Notes

- Avoid storing secret material in the SharedWorker. Timed unlock keys belong in the ServiceWorker
  flow and should stay short-lived.
- Add tests before introducing persistent state or cross-tab consensus behavior.
- Keep generated `dist/` output out of source control unless repo policy changes.

## Release Policy

This package participates in the `kraig-social` Rush lock-step version policy with the app and
service worker. Do not manually edit the package version for releases.
