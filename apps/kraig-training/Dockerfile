# syntax=docker/dockerfile:1.7
# ---- build stage (Rush + pnpm) ----
FROM node:24.11.1-bookworm-slim AS build
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

# Copy the rest of the monorepo after install to keep cache hits high
COPY . .

# Build just this project (and its deps)
RUN --mount=type=cache,id=rush-install-run,target=/repo/common/temp/install-run \
    --mount=type=cache,id=npm-cache,target=/root/.npm \
    node common/scripts/install-run-rush.js build -t @kraigwalker/kraig-training


# ---- runtime stage (SSR) ----
FROM node:24.11.1-bookworm-slim AS runtime
WORKDIR /repo/apps/kraig-training
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Copy Rush's shared install + the project (including its node_modules shims/.bin)
COPY --from=build /repo/common/temp /repo/common/temp
COPY --from=build /repo/apps/kraig-training /repo/apps/kraig-training

EXPOSE 3000

CMD ["./node_modules/.bin/react-router-serve", "build/server/index.js"]
