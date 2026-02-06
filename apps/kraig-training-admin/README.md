# Kraig Training Admin

Admin web app for the training stack, built with React Router SSR.

## What this app does

- Shows bootstrap/admin readiness status for training.
- Queries the training API server-side at `/admin/bootstrap`.

## Local development

### Prerequisites

- Node.js 24.x
- Rush monorepo tooling
- Training API running locally

### 1. Install dependencies (one-time per clone)

From the monorepo root:

```bash
rush install --subspace default
```

### 2. Configure environment

Required:

- `TRAINING_API_BASE_URL` example: `http://localhost:8787`

### 3. Start the app in dev mode

From the app folder:

```bash
cd apps/kraig-training-admin
TRAINING_API_BASE_URL=http://localhost:8787 rushx dev
```

Open `http://localhost:5173`.

## Local production-like run

From the app folder:

```bash
cd apps/kraig-training-admin
rushx build
TRAINING_API_BASE_URL=http://localhost:8787 HOST=0.0.0.0 PORT=3000 rushx start
```

Open `http://localhost:3000`.

## Runtime environment variables

- `TRAINING_API_BASE_URL` required
- `HOST` optional, default `0.0.0.0`
- `PORT` optional, default `3000`

## Staging and production requirements

### Compute/runtime

- Node.js 24.x runtime.
- Build first (`rushx build`) and then run (`rushx start`).

### Upstream dependency requirements

- `TRAINING_API_BASE_URL` must be reachable from the app process.
- The admin page depends on `GET {TRAINING_API_BASE_URL}/admin/bootstrap`.
- If this endpoint is unavailable or returns non-2xx, the UI will show an admin status error state.

### Deployment notes in this repo

- `deploy/compose/training.yml` defines this app as `kraig-training-admin`.
- In local compose (`deploy/compose/training-local.yml`), it is mapped to `http://localhost:3001`.
