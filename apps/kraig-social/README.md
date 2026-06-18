# Kraig Social Web App

React Router SSR application for the public `kraig.social` experience and the localhost delivery
lab demo.

## What This App Does

- Renders the public site with server-side React Router routes.
- Demonstrates gateway-directed module delivery on `/lab`.
- Provides a local CMS-like dashboard on `/admin/content`.
- Renders public article routes and timed encrypted drop routes.
- Generates `/sitemap.xml` from public manifest entries.
- Registers `/service-worker.js` so encrypted bundles can be preloaded and unlocked locally.
- Runs production-like traffic through `server/index.js`.

## Important Routes

- `/` high-concept public entry point for the delivery platform.
- `/lab` ring/A-B decision cockpit and federated module preview.
- `/articles/:slug` public SSR article route.
- `/drops/:slug` timed encrypted content drop route.
- `/admin/content` local-only content authoring and manifest preview surface.
- `/sitemap.xml` sitemap generated from indexable, published manifest content.
- `/health` simple health endpoint.

## Local Demo

From the repository root, install dependencies once:

```bash
node common/scripts/install-run-rush.js update --subspace default
```

Build the remote, gateway, and app:

```bash
node common/scripts/install-run-rush.js build --to @kraigwalker/kraig-social-dispatch-panel
node common/scripts/install-run-rush.js build --to @kraigwalker/kraig-social-gateway
node common/scripts/install-run-rush.js build --to @kraigwalker/kraig-social
```

Start the gateway in one terminal:

```bash
cd apps/gateway
node lib/index.js
```

Start this app in another terminal:

```bash
cd apps/kraig-social
GATEWAY_ORIGIN=http://localhost:3001 HOST=0.0.0.0 PORT=3000 node server/index.js
```

Open `http://localhost:3000/lab`.

The gateway serves the remote's browser and Node SSR manifests from the independently built
`apps/dispatch-panel/dist/releases` tree. The host registers the gateway-selected immutable remote
at runtime and renders the same release during SSR and hydration.

## Development Commands

Run commands from this folder:

```bash
rushx dev
rushx build
rushx test
rushx typecheck
rushx lint
```

`rushx test` delegates to the Heft rig test phase, which runs Vitest from the shared toolchain.
Do not add project-local `vite` or `vitest` dependencies just to run tests.

## Runtime Environment

- `HOST` optional, default `0.0.0.0`.
- `PORT` optional, default `3000`.
- `GATEWAY_ORIGIN` optional, default `http://localhost:3001`.

The production-like server applies HTML security headers. The localhost demo currently allows
inline scripts/styles because React Router hydration and the demo remote module need them. Tighten
this before production hosting.

## Maintainer Notes

- Keep durable public content SSR-friendly. Client-only federation should enhance, not replace,
  indexable routes.
- The delivery lab intentionally uses federated SSR. Remote failures must stay inside its loading
  and error fallback instead of failing the document response.
- Locked or scheduled content should not be included in the sitemap until the manifest marks it
  published and indexable.
- `/service-worker.js` is a committed public demo worker. The package worker source lives in
  `workers/service`; keep behavior aligned when changing the encrypted preload protocol.
- `/sw.1.js` is served as a compatibility alias for old local registrations.
- Testing Library dependencies belong here because route tests import them directly. Vite and
  Vitest belong to the Heft rigs/toolchain.
