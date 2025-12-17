# ---- build stage (Rush + pnpm) ----
FROM node:24.11.1-bookworm-slim AS build
WORKDIR /repo

RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY . .

# Install dependencies via repo-pinned Rush + pnpm
RUN node common/scripts/install-run-rush.js install

# Build just this project (and its deps)
RUN node common/scripts/install-run-rush.js build -t @kraigwalker/kraig-training


# ---- runtime stage (SSR) ----
FROM node:24.11.1-bookworm-slim AS runtime
WORKDIR /repo
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Copy Rush's shared install + the project (including its node_modules shims/.bin)
COPY --from=build /repo/common/temp /repo/common/temp
COPY --from=build /repo/apps/kraig-training /repo/apps/kraig-training

EXPOSE 3000

CMD ["node", "/repo/apps/kraig-training/node_modules/.bin/react-router-serve", "/repo/apps/kraig-training/build/server/index.js"]
