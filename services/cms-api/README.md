# CMS API

Fastify + Drizzle + Better Auth service for CMS metadata.

## Environment

- `DATABASE_URL` (required)
- `PORT` (default 3335)
- `BETTER_AUTH_URL` (base URL for Better Auth)
- `BETTER_AUTH_SECRET` (required by Better Auth)
- `BETTER_AUTH_ISSUER` (optional JWT issuer override)
- `BETTER_AUTH_AUDIENCE` (optional JWT audience override)
- `CMS_ALLOWED_ORIGINS` (required in production; comma-separated list of browser origins allowed to call CMS API)
- `CMS_SITE_URL` (used for schema.org `isPartOf`)
- `CMS_SITE_NAME` (used for schema.org `publisher`)
- `CMS_ASSET_BASE_URL` (base URL for asset URLs in JSON-LD)

## Auth

Better Auth routes are exposed at `/api/auth/*`. The JWT plugin exposes:

- `GET /api/auth/jwks`
- `GET /api/auth/token` (requires a valid session)

## Local commands

- `rushx dev`
- `rushx db:generate`
- `rushx db:migrate`
