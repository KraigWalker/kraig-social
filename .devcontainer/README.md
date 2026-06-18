# Dev Container

This repository has a Dev Container for local development. It is separate from
`apps/kraig-social/Dockerfile`, which is the production-oriented app image.

The development image is pre-built by GitHub Actions and published to:

```text
ghcr.io/kraigwalker/kraig-social-devcontainer:latest
```

The build definition lives in the Rush project at
`tools/devcontainer-image`. The local configuration only references the
published image, which keeps container startup fast and prevents local feature
installation and image compilation.

## Start

1. Open the repository in VS Code or another Dev Containers-compatible client.
2. Choose **Reopen in Container**.
3. Wait for the post-create command to run:

```bash
rush install --subspace default
rush install-autoinstaller --name oxc-autoinstaller
```

If the package is private, authenticate Docker before opening the repository:

```bash
echo "$CR_PAT" | docker login ghcr.io -u USERNAME --password-stdin
```

For anonymous pulls, set the package visibility to public after its first
publication in GitHub Packages.

## Rebuild the image

The `Build dev container image` workflow runs when the image definition changes
on `main`, and it can also be started manually. It publishes:

- `latest`
- the full Git commit SHA

The workflow uses `latest` as a layer cache. To test the image definition
locally with the Dev Container CLI:

```bash
npx --yes @devcontainers/cli build \
  --workspace-folder . \
  --config tools/devcontainer-image/devcontainer.json
```

## Dev Container performance

This container uses Docker volumes for Rush-related caches so generated files and package manager state are stored on fast container storage instead of directly in the mounted repo workspace:

- `kraig-social-npm-cache` -> `/home/node/.npm`
- `kraig-social-pnpm-store` -> `/home/node/.pnpm-store`
- `kraig-social-rush-home` -> `/home/node/.rush`

`common/temp` intentionally stays on the workspace filesystem. Rush moves
autoinstaller directories through its recycler there, which requires the source
and destination to be on the same filesystem.

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
