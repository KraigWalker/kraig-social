# Kraig Social Gateway

Local delivery control plane for Kraig Social. The gateway chooses federated modules, evaluates
release decisions, serves manifests, releases timed unlock keys, emits developer signals, and
backs the local CMS-like demo.

## Responsibilities

- Select immutable Module Federation releases and serve their standard Vite-built artifacts.
- Resolve LaunchDarkly-style decisions for rings, A/B variants, overrides, and developer signals.
- Expose a Server-Sent Events stream for real-ish production hot module reload demos.
- Generate and serve a merged delivery manifest.
- Create local encrypted content bundles for the admin demo.
- Enforce timed unlocks and return AES-GCM key material after `unlockAt`.
- Write local JSONL audit events for decisions and unlocks.

## Main Endpoints

- `GET /healthz`
- `GET /mf/releases/:version/browser/mf-manifest.json`
- `GET /mf/releases/:version/server/mf-manifest.json`
- `GET /mf/content/*`
- `POST /api/decision/resolve`
- `GET /api/content/manifest`
- `POST /api/unlock/:releaseId`
- `GET /api/signals`
- `POST /api/signals`
- `GET /api/signals/stream`
- `GET /api/admin/content`
- `POST /api/admin/content`
- `POST /api/admin/content/expire`

## Local Run

From the repository root:

```bash
node common/scripts/install-run-rush.js build --to @kraigwalker/kraig-social-dispatch-panel
node common/scripts/install-run-rush.js build --to @kraigwalker/kraig-social-gateway
cd apps/gateway
node lib/index.js
```

The gateway listens on `http://localhost:3001` by default.

## Development Commands

Run commands from this folder:

```bash
rushx build
rushx test
rushx typecheck
rushx lint
```

`rushx test` runs through the shared Heft `test` phase. Vitest is provided by
`@kraigwalker/heft-toolchain`; do not add project-local `vitest` or `vite` dependencies for this
service.

## Local Data

The gateway creates local demo state on demand:

- `.kraig-social-data/admin-content.json`
- `.kraig-social-data/keys.json`
- `.kraig-social-data/audit.jsonl`
- `dist/mf/content/payloads/*`

These files are intentionally local runtime artifacts and are ignored by git. `keys.json` contains
demo key material and must never be treated as production secret storage.

## Core Terms

```ts
type ContentId = string;
type ModuleId = string;
type ReleaseId = string;
type VariantId = string;
type RingId = 'dev' | 'friends' | 'public';
type ClientId = string;
```

- A content item is the author-facing unit: article, page, demo, or module.
- A module is a standard Module Federation remote selected by the gateway and built independently.
- A release is a published package of content or modules.
- A variant is a concrete implementation selected by decision rules.
- A drop is a release with preload, unlock, and expiry semantics.

## Maintainer Notes

- `src/services/local-data.ts` is deliberately fixture-backed for localhost. Replace it with a DB
  and object store before production hosting.
- `src/services/decision-engine.ts` should remain deterministic for a given `clientId`, ring, and
  ruleset.
- Remote manifests are revalidated; hashed release assets are immutable and may be cached for one
  year.
- Unlock responses are `Cache-Control: no-store`; keep key material out of logs.
- Browser-delivered keys enforce timing and product experience, not perfect secrecy from a
  determined client after unlock.
- New gateway routes should use shared contracts from `@kraigwalker/kraig-social-content-sdk`
  whenever the browser app or workers consume their payloads.
