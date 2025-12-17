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
RUN node common/scripts/install-run-rush.js build -t @kraigwalker/kraig-training-admin


# ---- runtime stage (SSR) ----
FROM node:24.11.1-bookworm-slim AS runtime
WORKDIR /repo/apps/kraig-training-admin
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Copy Rush's shared install + the project (including its node_modules shims/.bin)
COPY --from=build /repo/common/temp /repo/common/temp
COPY --from=build /repo/apps/kraig-training /repo/apps/kraig-training-admin

EXPOSE 3000

CMD ["./node_modules/.bin/react-router-serve", "build/server/index.js"]