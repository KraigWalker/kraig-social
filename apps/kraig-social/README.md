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

## Demo Guide

The demo runs three pieces:

1. The independently built `dispatch-panel` Module Federation remote.
2. The gateway on `http://localhost:3001`, which selects releases and manages content drops.
3. This React Router SSR host on `http://localhost:3000`.

The remote is served by the gateway from its built release directory, so it does not need a
separate runtime process. Browser requests reach the gateway through the host's same-origin
`/__gateway` proxy; port `3001` only needs to be reachable by the host process.

### 1. Install and build

Use the repository-supported Node.js version (`>=24.11.1 <25.0.0`). From the repository root,
install dependencies once:

```bash
node common/scripts/install-run-rush.js update --subspace default
```

Build the two remote releases, the gateway, and the host:

```bash
node common/scripts/install-run-rush.js build --to @kraigwalker/kraig-social-dispatch-panel
node common/scripts/install-run-rush.js build --to @kraigwalker/kraig-social-gateway
node common/scripts/install-run-rush.js build --to @kraigwalker/kraig-social
```

Rebuild the relevant project after changing its source. In particular, changes to the dispatch
panel are not visible until its release artifacts are rebuilt.

### 2. Start the services

In terminal 1, start the gateway:

```bash
cd apps/gateway
node lib/index.js
```

In terminal 2, start the production-like SSR host:

```bash
cd apps/kraig-social
GATEWAY_ORIGIN=http://localhost:3001 HOST=0.0.0.0 PORT=3000 node server/index.js
```

Confirm both processes are ready:

```bash
curl http://localhost:3001/healthz
curl http://localhost:3000/health
```

Each request should return a successful response. Then open `http://localhost:3000`.

### 3. Demo gateway-selected modules

Open `http://localhost:3000/lab` and use this sequence:

1. Start on the **dev** ring. The decision telemetry should select module version `1.1.0` and the
   `next` variant.
2. Click **Enable flag signal** or **Module built signal**. The signal appears in the Signals list,
   the decision is resolved again over the live Server-Sent Events connection, and the variant
   changes to `live-workbench`.
3. Select the **public** ring. The gateway should select stable module version `1.0.0` and the
   `control` variant.
4. Select the **friends** ring. The gateway uses a stable client ID from local storage to assign
   either `control` or `next`; repeated decisions for that browser keep the same A/B assignment.

Point out the `reason`, `moduleVersion`, `variantId`, and remote manifest URLs in the Decision JSON.
They show that the host is rendering a gateway-selected immutable release rather than importing the
panel directly. The selected remote is used for both SSR and browser hydration.

### 4. Demo an encrypted timed drop

Open `http://localhost:3000/admin/content`:

1. Click **Create encrypted 30s drop**.
2. Open the new `/drops/...` link from the content row.
3. Click **Request unlock key** before the displayed unlock time. The gateway should report that
   the drop is still locked and provide a retry delay.
4. After the unlock time, click **Request unlock key** again. The gateway releases the AES-GCM key,
   and the browser decrypts and displays the already available bundle.
5. Return to the admin page and click **Expire** to demonstrate revocation.

The browser registers `/service-worker.js` on the drop page and offers the encrypted bundle for
preload before the key is available. The demo protects release timing; it is not intended as DRM
after the key has reached the browser.

### 5. Demo the public SSR path

Use these routes to show that durable public content remains independent of the federated lab:

- `http://localhost:3000/articles/encrypted-modules-level-2` renders a public SSR article.
- `http://localhost:3000/sitemap.xml` contains only published, indexable manifest entries.
- `http://localhost:3000/admin/content` shows the merged delivery manifest used by the routes and
  service worker.

### Troubleshooting

- If buttons render but do nothing, rebuild the host and restart `server/index.js`; the running
  server keeps the previously imported SSR build in memory.
- If the lab says the federated module is unavailable, rebuild `apps/dispatch-panel` and restart the
  gateway.
- If SSR reports a gateway request failure, verify `http://localhost:3001/healthz` and make sure the
  host was started with `GATEWAY_ORIGIN=http://localhost:3001`.
- If the browser requests `http://localhost:3001` directly, rebuild and restart the host. Current
  builds use the same-origin `/__gateway` proxy so container port forwarding is not required.
- If ports `3000` or `3001` are occupied, stop the conflicting process or set matching `PORT` and
  `GATEWAY_ORIGIN` values.
- If the timed-drop demo contains state from an earlier run, stop the gateway, remove
  `apps/gateway/.kraig-social-data`, and restart it to create fresh local fixtures.
- If the service worker appears stale, unregister it in the browser's Application developer tools,
  then reload the page.

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
