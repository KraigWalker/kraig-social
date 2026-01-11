# Kraig Social (React Router SSR)

A server-rendered React Router app running on Node, with Nginx as a reverse proxy.

## Getting Started

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

## Build and Run

Create a production build:

```bash
npm run build
```

Serve the SSR app:

```bash
npm run start
```

## Nginx

The reverse proxy config lives at `apps/kraig-social/nginx.conf`. It proxies to the Node app on port 3000 and applies
security/CORS headers for static assets.
