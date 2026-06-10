# Dev Container

This repository has a Dev Container for local development. It is separate from
`apps/kraig-social/Dockerfile`, which is the production-oriented app image.

## Start

1. Open the repository in VS Code or another Dev Containers-compatible client.
2. Choose **Reopen in Container**.
3. Wait for the post-create command to run:

```bash
rush install --subspace default
```

## Common Commands

The Dev Container adds `rush`, `rushx`, and `rush-pnpm` wrappers to `PATH`.
They delegate to the repo-pinned scripts in `common/scripts`, so Rush and pnpm
versions still come from the repository configuration.

Install dependencies from the monorepo root:

```bash
rush install --subspace default
```

Start the main app dev server:

```bash
cd apps/kraig-social
rushx dev
```

Open `http://localhost:5173`.

Run a production-like app server:

```bash
cd apps/kraig-social
rushx build
HOST=0.0.0.0 PORT=3000 rushx start
```

Open `http://localhost:3000`.

Build the app and its dependencies from the monorepo root:

```bash
rush build -t @kraigwalker/kraig-social
```

The gateway defaults to port `3001`.
