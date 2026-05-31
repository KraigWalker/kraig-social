import express from "express";
import { createRequestHandler } from "@react-router/express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as build from "../build/server/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildDir = path.resolve(__dirname, "../build/client");
const basePath = process.env.BASE_PATH ?? "/circuit-club";

const app = express();
const htmlSecurityHeaders = {
  "Content-Security-Policy":
    "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data: blob:; media-src 'self' blob:; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self'; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy":
    "accelerometer=(), autoplay=(), camera=(self), geolocation=(self), gyroscope=(), magnetometer=(), microphone=(self), midi=(), payment=(), usb=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
};

app.disable("x-powered-by");
app.set("trust proxy", true);

app.use((req, res, next) => {
  let contentType;
  const originalSetHeader = res.setHeader.bind(res);

  res.setHeader = (name, value) => {
    if (typeof name === "string" && name.toLowerCase() === "content-type") {
      contentType = Array.isArray(value) ? value[0] : value;
    }
    return originalSetHeader(name, value);
  };

  const applyHtmlHeaders = () => {
    const currentType =
      contentType ??
      (typeof res.getHeader === "function" ? res.getHeader("Content-Type") : undefined);
    if (typeof currentType === "string" && currentType.toLowerCase().includes("text/html")) {
      for (const [key, value] of Object.entries(htmlSecurityHeaders)) {
        if (!res.hasHeader(key)) {
          res.setHeader(key, value);
        }
      }
    }
  };

  const originalWriteHead = res.writeHead.bind(res);
  res.writeHead = (...args) => {
    applyHtmlHeaders();
    return originalWriteHead(...args);
  };

  const originalEnd = res.end.bind(res);
  res.end = (...args) => {
    applyHtmlHeaders();
    return originalEnd(...args);
  };

  next();
});

app.get("/", (_req, res) => {
  res.redirect(302, basePath);
});

app.get(`${basePath}/health`, (_req, res) => {
  res.json({ ok: true, app: "circuit-club" });
});

app.use(
  `${basePath}/assets`,
  express.static(path.join(buildDir, "assets"), {
    immutable: true,
    maxAge: "1y",
  }),
);
app.use(basePath, express.static(buildDir, { maxAge: "1h" }));
app.use(createRequestHandler({ build }));

const host = process.env.HOST ?? "0.0.0.0";
const port = Number.parseInt(process.env.PORT ?? "3000", 10);

app.listen(port, host, () => {
  console.log(`circuit-club server listening on http://${host}:${port}${basePath}`);
});
