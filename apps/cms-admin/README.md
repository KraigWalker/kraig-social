# CMS Admin

React Router admin UI for CMS posts and versions.

## What this app does

- Server-rendered admin console for CMS content metadata.
- Reads and mutates posts/versions through the `cms-api` service.

## Local development

### Prerequisites

- Node.js 24.x
- Rush monorepo tooling
- `cms-api` running and reachable

### 1. Install dependencies (one-time per clone)

From the monorepo root:

```bash
rush install --subspace default
```

### 2. Configure environment

Required:

- `CMS_API_BASE_URL` example: `http://localhost:3335`

Optional:

- `CMS_API_TOKEN` bearer token for server-side requests to `cms-api`

### 3. Start the app in dev mode

From the app folder:

```bash
cd apps/cms-admin
CMS_API_BASE_URL=http://localhost:3335 rushx dev
```

Open `http://localhost:5173`.

## Local production-like run

From the app folder:

```bash
cd apps/cms-admin
rushx build
CMS_API_BASE_URL=http://localhost:3335 HOST=0.0.0.0 PORT=3000 rushx start
```

Open `http://localhost:3000`.

## Runtime environment variables

- `CMS_API_BASE_URL` required
- `CMS_API_TOKEN` optional, but required if API routes require bearer auth
- `HOST` optional, default `0.0.0.0`
- `PORT` optional, default `3000`

## Staging and production requirements

### Compute/runtime

- Node.js 24.x runtime.
- Build first (`rushx build`) and then run (`rushx start`).

### Upstream dependency requirements

- `CMS_API_BASE_URL` must be reachable from the app process.
- If `CMS_API_TOKEN` is provided, it is sent as `Authorization: Bearer <token>` for API calls.

### Security and networking requirements

- Keep `CMS_API_TOKEN` in secret storage (not in source control).
- Ensure `cms-api` allows browser origin access for this app origin through
  `CMS_ALLOWED_ORIGINS` on the API service.
