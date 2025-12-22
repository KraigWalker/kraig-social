# syntax=docker/dockerfile:1.5
# ---- build stage ----
FROM node:24.11.1-bookworm-slim AS build
WORKDIR /repo

# Rush sometimes needs git (and CA certs for HTTPS fetches)
RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy Rush config + package manifests first for better layer caching
COPY rush.json ./
COPY common/config/rush/ common/config/rush/
COPY common/scripts/ common/scripts/

# Copy package.json files based on rush.json to avoid manual maintenance
RUN --mount=type=bind,source=.,target=/src,ro \
    node -e "const fs=require('fs');const path=require('path');const rush=require('/src/rush.json');for(const p of rush.projects){const src=path.join('/src',p.projectFolder,'package.json');const dest=path.join('/repo',p.projectFolder,'package.json');fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(src,dest);}"

# Install + build with Rush (uses repo-pinned Rush + pnpm)
RUN node common/scripts/install-run-rush.js install -t @kraigwalker/kraig-social

# Copy the rest of the monorepo after install to keep cache hits high
COPY . .
# Build (same as `rush build`).
RUN node common/scripts/install-run-rush.js build -t @kraigwalker/kraig-social

# ---- runtime stage ----
FROM nginx:alpine AS runtime
COPY apps/kraig-social/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/kraig-social/dist /usr/share/nginx/html

EXPOSE 80
