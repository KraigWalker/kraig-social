# CircuitClub

CircuitClub is an experimental installable web app demonstrator for a gay and trans-men focused community product. It explores coarse hex-grid discovery, local-first profiles, favourites, text messaging, and community self-moderation without relying on third-party domains.

## Current demonstrator scope

- React Router SSR app served under `/circuit-club`.
- Installable PWA with a same-origin service worker and manifest.
- Browser-local profile, favourite, message, report, and media state.
- Coarse cell derivation from browser geolocation. Precise latitude/longitude is not persisted.
- Strict same-origin security headers in the Express runtime.

## Privacy direction

The current app intentionally avoids precise map pins. It derives a coarse cell ID in the browser and discards coordinates immediately. A production version should replace the simplified cell derivation with a reviewed H3 resolution policy, k-anonymity thresholds, randomized update timing, anti-triangulation checks, and server-side enforcement that never returns singleton cell membership.

## Local development

From the monorepo root:

```bash
rush install --subspace default
cd apps/circuit-club
rushx dev
```

Open `http://localhost:5173/circuit-club/`.

## Production-like run

```bash
cd apps/circuit-club
rushx build
HOST=0.0.0.0 PORT=3000 rushx start
```

Open `http://localhost:3000/circuit-club/`.

## Docker

```bash
docker build -f apps/circuit-club/Dockerfile -t circuit-club .
docker run --rm -p 3000:3000 circuit-club
```

## Runtime variables

- `HOST` optional, default `0.0.0.0`
- `PORT` optional, default `3000`
- `BASE_PATH` optional, default `/circuit-club`
