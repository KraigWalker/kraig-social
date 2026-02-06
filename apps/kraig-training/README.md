# Kraig Training

Training web app for `kraig.social`, built with React Router SSR.

## What this app does

- Serves the training UI at the `/training` base path.
- Uses server-side rendering.
- Includes a server-side health loader that checks the training API.

## Local development

### Prerequisites

- Node.js 24.x
- Rush monorepo tooling
- Training API running locally if you want health/API-backed behavior

### 1. Install dependencies (one-time per clone)

From the monorepo root:

```bash
rush install --subspace default
```

### 2. Configure environment

Required for API-backed features:

- `TRAINING_API_BASE_URL` example: `http://localhost:8787`

### 3. Start the app in dev mode

From the app folder:

```bash
cd apps/kraig-training
TRAINING_API_BASE_URL=http://localhost:8787 rushx dev
```

Open `http://localhost:5173/training`.

## Local production-like run

From the app folder:

```bash
cd apps/kraig-training
rushx build
TRAINING_API_BASE_URL=http://localhost:8787 HOST=0.0.0.0 PORT=3000 rushx start
```

Open `http://localhost:3000/training`.

## Runtime environment variables

- `TRAINING_API_BASE_URL` required for API checks and server-side health route
- `HOST` optional, default `0.0.0.0`
- `PORT` optional, default `3000`

## Staging and production requirements

### Compute/runtime

- Node.js 24.x runtime.
- Build artifacts are required before start (`rushx build`).
- Start command is `rushx start` (`react-router-serve ./build/server/index.js`).

### Path/base URL requirements

- This app is configured with `basename: "/training"` in `react-router.config.ts`.
- Your reverse proxy must preserve the `/training` prefix when forwarding traffic.
  If `/training` is stripped before requests reach the app, routing will break.

### Upstream dependency requirements

- `TRAINING_API_BASE_URL` must point to a reachable training API instance from the app process.
- In this repo's production compose (`deploy/compose/training.yml`), it uses the internal URL `http://kraig-training-api:8787`.
