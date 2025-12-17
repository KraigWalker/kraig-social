# ---- build stage (Rush + pnpm) ----
FROM node:24.11.1-bookworm-slim AS build
WORKDIR /repo

RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY . .

RUN node common/scripts/install-run-rush.js install
RUN node common/scripts/install-run-rush.js build -t @kraigwalker/kraig-training-api


# ---- runtime stage ----
FROM node:24.11.1-bookworm-slim AS runtime
WORKDIR /repo/services/kraig-training-api

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8787

# Keep Rush layout intact for pnpm shims
COPY --from=build /repo/common/temp /repo/common/temp
COPY --from=build /repo/services/kraig-training-api /repo/services/kraig-training-api

EXPOSE 8787

# Adjust if your built entry differs (e.g. dist/index.js)
CMD ["node", "dist/index.js"]