# Kraig Training API

Fastify-based API for the training stack. It powers auth, health checks, and
Strava integrations, backed by PostgreSQL via Drizzle ORM.

## Features

- Fastify server with sensible defaults (CORS, Helmet, sensible)
- Better Auth with email/password
- PostgreSQL + Drizzle ORM schema + migrations
- Strava OAuth connect flow + webhook verification
- Health checks for app + DB

## Requirements

- Node.js 24+
- PostgreSQL 17+

## Local development

### Option A: Run with Docker Compose (recommended)

From the repo root:

```bash
docker compose -f deploy/compose/training-local.yml up --build
```

This starts Postgres, the API, and both training apps.

### Option B: Run the API directly

From the repo root:

```bash
node common/scripts/install-run-rush.js install --subspace default
node common/scripts/install-run-rushx.js dev
```

## Environment variables

Required:

- `DATABASE_URL` - Postgres connection string
- `BETTER_AUTH_URL` - Base URL used by Better Auth
- `BETTER_AUTH_SECRET` - Secret for signing sessions

Optional:

- `PORT` (default: `8787`)
- `HOST` (default: `0.0.0.0`)
- `DATABASE_POOL_SIZE` (default: `5`)
- `APP_NAME` (default: `Kraig Training`)

Strava:

- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `STRAVA_REDIRECT_URI` (e.g. `http://localhost:8787/integrations/strava/oauth/callback`)
- `STRAVA_WEBHOOK_VERIFY_TOKEN` (used by webhook verification)

## Key endpoints

Health:

- `GET /health`
- `GET /health/db`

Auth (Better Auth):

- `GET|POST|PUT|PATCH|DELETE|OPTIONS /api/auth`
- `GET|POST|PUT|PATCH|DELETE|OPTIONS /api/auth/*`

Strava:

- `GET /integrations/strava/oauth/start` - returns OAuth URL for the signed-in user
- `GET /integrations/strava/oauth/callback` - handles OAuth redirect
- `GET /integrations/strava/status` - shows current connection status
- `DELETE /integrations/strava/connection` - disconnects the current user
- `GET /integrations/strava/webhook` - verifies Strava webhook subscription
- `POST /integrations/strava/webhook` - receives Strava webhook events

## Database and migrations

Drizzle config: `services/kraig-training-api/drizzle.config.ts`

From the repo root:

```bash
node common/scripts/install-run-rushx.js db:generate
node common/scripts/install-run-rushx.js db:migrate
node common/scripts/install-run-rushx.js db:studio
```

Note: `DATABASE_URL` must be set for the CLI commands.

## Project structure

- `src/index.ts` - Fastify server + routes
- `src/db.ts` - Postgres pool + Drizzle client
- `src/schema.ts` - Drizzle schema (auth tables + Strava)
- `src/auth.ts` - Better Auth configuration
- `src/auth-session.ts` - Session lookup helper
- `src/strava.ts` - Strava OAuth + storage helpers

## Testing

No automated tests are wired up yet.
