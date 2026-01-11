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

Serve the SSR app (Express + React Router adapter):

```bash
npm run start
```

## Headers

The Express server applies HTML-only security headers and CORS headers for static assets.
