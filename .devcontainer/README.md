# Dev Container

This repository has a Dev Container for local development. It is separate from
`apps/kraig-social/Dockerfile`, which is the production-oriented app image.

## Start

1. Open the repository in VS Code or another Dev Containers-compatible client.
2. Choose **Reopen in Container**.
3. Wait for the post-create command to run:

```bash
node common/scripts/install-run-rush.js install --subspace default
```

## Common Commands

Run commands through the repo-pinned Rush scripts so the container uses the
same Rush and pnpm versions as the repository.

Install dependencies from the monorepo root:

```bash
node common/scripts/install-run-rush.js install --subspace default
```

Start the main app dev server:

```bash
cd apps/kraig-social
node ../../common/scripts/install-run-rushx.js dev
```

Open `http://localhost:5173`.

Run a production-like app server:

```bash
cd apps/kraig-social
node ../../common/scripts/install-run-rushx.js build
HOST=0.0.0.0 PORT=3000 node ../../common/scripts/install-run-rushx.js start
```

Open `http://localhost:3000`.

Build the app and its dependencies from the monorepo root:

```bash
node common/scripts/install-run-rush.js build -t @kraigwalker/kraig-social
```

The gateway defaults to port `3001`.
