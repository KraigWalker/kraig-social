FROM node:24.11.1-bookworm-slim AS build
WORKDIR /repo

RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY . .

RUN node common/scripts/install-run-rush.js install
RUN node common/scripts/install-run-rush.js build -t @kraigwalker/github-gateway

FROM node:24.11.1-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=9090

COPY --from=build /repo/common/temp /repo/common/temp
COPY --from=build /repo/services/github-gateway /repo/services/github-gateway

WORKDIR /repo/services/github-gateway
EXPOSE 9090

CMD ["node", "dist/index.js"]