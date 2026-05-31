# syntax=docker/dockerfile:1.7
FROM node:24.11.1-bookworm-slim AS build
WORKDIR /repo

RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY rush.json ./
COPY common/scripts/ common/scripts/

RUN --mount=type=cache,id=rush-install-run,target=/repo/common/temp/install-run \
    --mount=type=cache,id=npm-cache,target=/root/.npm \
    node common/scripts/install-run-rush.js setup

COPY common/config/rush/ common/config/rush/
COPY common/config/subspaces/ common/config/subspaces/

COPY apps/circuit-club/package.json apps/circuit-club/package.json
COPY apps/kraig-social/package.json apps/kraig-social/package.json
COPY apps/kraig-training/package.json apps/kraig-training/package.json
COPY apps/kraig-training-admin/package.json apps/kraig-training-admin/package.json
COPY apps/cms-admin/package.json apps/cms-admin/package.json
COPY services/kraig-training-api/package.json services/kraig-training-api/package.json
COPY services/cms-api/package.json services/cms-api/package.json
COPY services/github-gateway/package.json services/github-gateway/package.json

RUN --mount=type=cache,id=pnpm-store,target=/repo/common/temp/pnpm-store \
    --mount=type=cache,id=rush-install-run,target=/repo/common/temp/install-run \
    --mount=type=cache,id=rush-home,target=/root/.rush \
    --mount=type=cache,id=npm-cache,target=/root/.npm \
    node common/scripts/install-run-rush.js install --subspace default

COPY . .
RUN --mount=type=cache,id=rush-install-run,target=/repo/common/temp/install-run \
    --mount=type=cache,id=npm-cache,target=/root/.npm \
    node common/scripts/install-run-rush.js build -t @kraigwalker/circuit-club

FROM node:24.11.1-bookworm-slim AS runtime
WORKDIR /repo/apps/circuit-club
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV BASE_PATH=/circuit-club

COPY --from=build /repo/common/temp /repo/common/temp
COPY --from=build /repo/apps/circuit-club /repo/apps/circuit-club

EXPOSE 3000

CMD ["node", "server/index.js"]
