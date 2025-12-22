# syntax=docker/dockerfile:1.7
# ---- shared deps stage (Rush + pnpm) ----
FROM node:24.11.1-bookworm-slim AS deps
WORKDIR /repo

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

# Install dependencies via repo-pinned Rush + pnpm
RUN --mount=type=cache,id=pnpm-store,target=/repo/common/temp/pnpm-store \
    --mount=type=cache,id=rush-install-run,target=/repo/common/temp/install-run \
    --mount=type=cache,id=rush-home,target=/root/.rush \
    --mount=type=cache,id=npm-cache,target=/root/.npm \
    node common/scripts/install-run-rush.js install --subspace default

# ---- build stage (build all training targets once) ----
FROM deps AS build-all

# Copy the rest of the monorepo after install to keep cache hits high
COPY . .

RUN --mount=type=cache,id=rush-install-run,target=/repo/common/temp/install-run \
    --mount=type=cache,id=npm-cache,target=/root/.npm \
    --mount=type=cache,id=rush-build-cache,target=/repo/common/temp/build-cache \
    env RUSH_BUILD_CACHE_ENABLED=1 RUSH_BUILD_CACHE_WRITE_ALLOWED=1 \
    node common/scripts/install-run-rush.js build \
      --to @kraigwalker/kraig-training \
      --to @kraigwalker/kraig-training-admin \
      --to @kraigwalker/kraig-training-api

# Prepare minimal deploy folders for each service
RUN --mount=type=cache,id=rush-install-run,target=/repo/common/temp/install-run \
    --mount=type=cache,id=npm-cache,target=/root/.npm \
    sh -c "set -e; \
      node common/scripts/install-run-rush.js deploy --scenario training \
        --project @kraigwalker/kraig-training \
        --target-folder /repo/common/deploy/kraig-training \
        --overwrite & pid1=$!; \
      node common/scripts/install-run-rush.js deploy --scenario training \
        --project @kraigwalker/kraig-training-admin \
        --target-folder /repo/common/deploy/kraig-training-admin \
        --overwrite & pid2=$!; \
      node common/scripts/install-run-rush.js deploy --scenario training \
        --project @kraigwalker/kraig-training-api \
        --target-folder /repo/common/deploy/kraig-training-api \
        --overwrite & pid3=$!; \
      wait $pid1; wait $pid2; wait $pid3"

# ---- runtime stage (kraig-training) ----
FROM node:24.11.1-bookworm-slim AS kraig-training
WORKDIR /repo/apps/kraig-training
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Copy the deployed bundle for this app
COPY --link --from=build-all /repo/common/deploy/kraig-training/ /repo/

EXPOSE 3000

CMD ["./node_modules/.bin/react-router-serve", "build/server/index.js"]

# ---- runtime stage (kraig-training-admin) ----
FROM node:24.11.1-bookworm-slim AS kraig-training-admin
WORKDIR /repo/apps/kraig-training-admin
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Copy the deployed bundle for this app
COPY --link --from=build-all /repo/common/deploy/kraig-training-admin/ /repo/

EXPOSE 3000

CMD ["./node_modules/.bin/react-router-serve", "build/server/index.js"]

# ---- runtime stage (kraig-training-api) ----
FROM node:24.11.1-bookworm-slim AS kraig-training-api
WORKDIR /repo/services/kraig-training-api

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8787

# Copy the deployed bundle for this service
COPY --link --from=build-all /repo/common/deploy/kraig-training-api/ /repo/

EXPOSE 8787

CMD ["node", "dist/index.js"]
