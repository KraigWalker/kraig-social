# Kraig Social

Main public web app for `kraig.social`, built with React Router SSR.

## What this app does

- Renders the main site with server-side rendering.
- Serves static assets from the build output.
- Runs on an Express server (`apps/kraig-social/server/index.js`) in production.

## Local development

### Prerequisites

- Node.js 24.x
- Rush monorepo tooling (use the repo-pinned Rush commands)

### 1. Install dependencies (one-time per clone)

From the monorepo root:

```bash
rush install --subspace default
```

### 2. Start the app in dev mode

From the app folder:

```bash
cd apps/kraig-social
rushx dev
```

Open `http://localhost:5173`.

## Local production-like run

From the app folder:

```bash
cd apps/kraig-social
rushx build
HOST=0.0.0.0 PORT=3000 rushx start
```

Open `http://localhost:3000`.

## Runtime environment variables

- `HOST` optional, default `0.0.0.0`
- `PORT` optional, default `3000`

## Staging and production requirements

### Compute/runtime

- Node.js 24.x runtime.
- Build artifacts must be generated before start (`rushx build`).
- Startup command is `rushx start` (runs `node server/index.js`).

### Networking and routing

- Reverse proxy should route public traffic for `kraig.social` root paths to this app.
- In this repo, `deploy/compose/kraig-social.yml` routes host `kraig.social` to port `3000` and excludes `/training`.

### Security headers and CORS behavior

- The Express server injects strict HTML security headers on HTML responses.
- Asset CORS headers are currently hard-coded to allow `https://kraig.social` only.
  For a staging domain, update `assetCorsHeaders` in `apps/kraig-social/server/index.js`.
