# ---- build stage (Rush + pnpm) ----
FROM node:24.11.1-bookworm-slim AS build
WORKDIR /repo

# Rush/pnpm sometimes needs git (and CA certs) during install
RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy the monorepo (simple + reliable; can optimize later with Docker cache layers)
COPY . .

# Install dependencies via repo-pinned Rush + pnpm
RUN node common/scripts/install-run-rush.js install

# Build just this project (and its deps)
RUN node common/scripts/install-run-rush.js build -t @kraigwalker/kraig-training


# ---- runtime stage (static) ----
# For now, serve the client build as a static SPA.
# (You can switch to a Node runtime later if/when you enable SSR.)
FROM nginx:alpine AS runtime

# Minimal SPA-friendly nginx config (works well when your reverse proxy strips /training)
RUN cat > /etc/nginx/conf.d/default.conf <<'NGINX'
server {
  listen 80;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  location = /health {
    add_header Content-Type text/plain;
    return 200 'ok';
  }

  # Cache static assets hard
  location ~* \.(?:js|css|map|png|jpg|jpeg|gif|svg|ico|webp|avif|woff2?)$ {
    try_files $uri =404;
    expires 30d;
    add_header Cache-Control "public, max-age=2592000, immutable";
  }

  # SPA fallback
  location / {
    try_files $uri $uri/ /index.html;
  }
}
NGINX

# React Router framework mode client build output
COPY --from=build /repo/apps/kraig-training/build/client /usr/share/nginx/html

EXPOSE 80