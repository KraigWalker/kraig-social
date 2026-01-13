# AGENTS.md

This repo is a **Rush monorepo** powering `kraig.social`.

The primary app is the **kraig-social web app**: a **Node.js server-rendered** application using **React Router 7 (framework mode)** for SSR.

This file is guidance for humans and AI agents contributing to the repo: how to work safely, how to run things locally, and what “good changes” look like.

---

## Goals

- Keep `kraig.social` fast, stable, and pleasant to work on.
- Prefer **simple, durable web primitives** over novelty.
- Keep SSR reliable and debuggable.
- Treat production as real: avoid breaking changes, ship in small increments.

---

## Repo shape (expected)

This is a Rush monorepo; exact paths may vary. Typical structure:

- `apps/` — runnable applications
  - `apps/kraig-social/` — SSR web app (Node)
- `packages/` — shared libraries
- `common/` — Rush config, autoinstallers, temp
- `docker-compose.yml` — deployment and local orchestration (at repo root or infra folder)

If your actual paths differ, update the commands and links below accordingly.

---

## Tooling

- Node.js: use the repo-pinned version (see `.nvmrc`, `.node-version`, or `package.json#engines` if present)
- Rush: monorepo orchestrator
- Docker Compose: local parity with production and Dokploy
- React Router 7: framework mode SSR

---

## Local development

### Install

Use Rush, not npm/yarn/pnpm directly in leaf packages:

- `rush update` (or `rush install`, depending on your workflow)
- `rush rebuild`

### Dev server (typical)

One of these patterns will exist:

- `rushx dev` (from within `apps/kraig-social`)
- or `rush dev --to kraig-social`
- or `rushx start`

If the exact script names differ, find them in:

- `apps/kraig-social/package.json`
- root `rush.json` (projects list)
- root `package.json` (convenience scripts)

### Build

- `rush build` (or `rush rebuild`)
- Ideally run the app in “production mode” locally after build to match SSR behavior.

---

## Docker / Compose

Production is deployed via **docker-compose** through **Dokploy**. Treat `docker-compose.yml` as a production contract.

### Principles

- Keep images reproducible.
- Prefer multi-stage builds.
- Don’t bake secrets into images.
- Configuration via environment variables.

### Local parity

If compose is designed for both prod + local usage:

- `docker compose up --build`

If you have separate files:

- `docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build`

Document the exact command(s) used in this repo once confirmed.

---

## SSR expectations (React Router 7 framework mode)

When editing SSR routes/loaders/actions:

- Assume code can run on the server only; avoid relying on `window` unless guarded.
- Keep loaders deterministic and quick.
- Ensure correct cache headers (if you use any).
- Prefer small, composable route modules.

---

## Contribution style

### Preferred change shape

- Small PRs
- One behavior change at a time
- Add tests where feasible (or at least a manual test checklist)

### Coding principles

- Keep the site accessible by default (semantic HTML, focus states, reduced motion)
- Performance matters (SSR should stay quick; keep client JS lean)
- Avoid introducing heavy dependencies unless they directly pay their rent

### UI decisions

- Prefer progressive enhancement.
- Avoid “JS for layout” where possible.
- When adding interactivity, ensure it degrades gracefully.

---

## Quality gates

Before merging:

- Typecheck passes
- Lint passes
- Build passes
- SSR renders routes without runtime errors
- A quick smoke test against core pages

If you have Playwright/Vitest/etc, list the exact commands here.

---

## Environment & secrets

Never commit secrets.

If env vars are required:

- document them in `.env.example`
- keep production-only values in Dokploy/hosting secrets manager

Common SSR envs might include:

- `NODE_ENV`
- `PORT`
- canonical site URL
- analytics keys (if any)
- feature flags (if any)

---

## Deployment notes (Dokploy)

Dokploy deploys via docker-compose. Rules:

- Changing `docker-compose.yml` or Dockerfiles is a production-affecting change.
- Keep containers stateless; use volumes only when necessary.
- If there’s a reverse proxy (Traefik/Nginx/etc), document ports and headers behavior.

Add the Dokploy service name / stack name here when known.

---

## Commit / PR guidance

Write commit messages that explain the intent:

- `feat:` new capability
- `fix:` bug fix
- `chore:` repo/tooling changes
- `refactor:` behavior-preserving changes

PR description should include:

- What changed
- Why
- How you tested (commands + pages)

---

## Safe defaults for agents

When uncertain:

- Don’t change deployment files.
- Don’t add dependencies.
- Don’t refactor broadly.
- Prefer additive changes and feature flags/toggles if needed.

---

## Contact / ownership

Owner/maintainer: Kraig Walker  
Site: `kraig.social`

Add links to key docs:

- `PLAN.md` — project roadmap and themes
- `README.md` — setup and overview (if present)
