# syntax=docker/dockerfile:1.7
# ---- build stage ----
FROM node:24.11.1-bookworm-slim AS build
WORKDIR /repo

# Rush sometimes needs git (and CA certs for HTTPS fetches)
RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy Rush config + package manifests first for better layer caching
COPY rush.json ./
COPY common/scripts/ common/scripts/

# Prime Rush download (cached as long as Rush config/scripts unchanged)
RUN --mount=type=cache,id=rush-install-run,target=/repo/common/temp/install-run \
    --mount=type=cache,id=npm-cache,target=/root/.npm \
    node common/scripts/install-run-rush.js setup

COPY common/config/rush/ common/config/rush/
COPY common/config/subspaces/ common/config/subspaces/

# Copy package.json files for projects
COPY apps/kraig-social/package.json apps/kraig-social/package.json
COPY apps/kraig-training/package.json apps/kraig-training/package.json
COPY apps/kraig-training-admin/package.json apps/kraig-training-admin/package.json
COPY services/kraig-training-api/package.json services/kraig-training-api/package.json
COPY services/github-gateway/package.json services/github-gateway/package.json

# Install + build with Rush (uses repo-pinned Rush + pnpm)
RUN --mount=type=cache,id=pnpm-store,target=/repo/common/temp/pnpm-store \
    --mount=type=cache,id=rush-install-run,target=/repo/common/temp/install-run \
    --mount=type=cache,id=rush-home,target=/root/.rush \
    --mount=type=cache,id=npm-cache,target=/root/.npm \
    node common/scripts/install-run-rush.js install --subspace default

# Copy the rest of the monorepo after install to keep cache hits high
COPY . .
# Build (same as `rush build`).
RUN --mount=type=cache,id=rush-install-run,target=/repo/common/temp/install-run \
    --mount=type=cache,id=npm-cache,target=/root/.npm \
    node common/scripts/install-run-rush.js build --to @kraigwalker/kraig-social

# ---- runtime stage ----
FROM nginx:alpine AS runtime
COPY apps/kraig-social/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/kraig-social/dist /usr/share/nginx/html

EXPOSE 80
