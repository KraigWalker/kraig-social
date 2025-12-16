# ---- build stage ----
FROM node:24.11.1-bookworm-slim AS build
WORKDIR /repo

# Rush sometimes needs git (and CA certs for HTTPS fetches)
RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy the whole monorepo (simple + reliable first; can optimize later)
COPY . .

# Install + build with Rush (uses repo-pinned Rush + pnpm)
RUN node common/scripts/install-run-rush.js install
# Build (same as `rush build`).
RUN node common/scripts/install-run-rush.js build -t @kraigwalker/kraig-social

# ---- runtime stage ----
FROM nginx:alpine AS runtime
COPY apps/kraig-social/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/kraig-social/dist /usr/share/nginx/html

EXPOSE 80