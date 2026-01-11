import express from "express";
import { createRequestHandler } from "@react-router/express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as build from "../build/server/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildDir = path.resolve(__dirname, "../build/client");

const app = express();
const htmlSecurityHeaders = {
  "Content-Security-Policy":
    "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; connect-src 'self'",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy":
    "accelerometer=(), autoplay=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), usb=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": 'require-corp; report-to="default"',
  "Cross-Origin-Resource-Policy": "same-site",
};
const assetCorsHeaders = {
  "Access-Control-Allow-Origin": "https://kraig.social",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "DNT,User-Agent,If-Modified-Since,Cache-Control,Content-Type,Range",
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

app.use((req, res, next) => {
  const isAssetPath =
    req.path.startsWith("/assets/") ||
    /\.(?:js|css|png|jpg|jpeg|gif|svg|webp|ico|woff2?)$/i.test(req.path);

  if (isAssetPath) {
    for (const [key, value] of Object.entries(assetCorsHeaders)) {
      if (!res.hasHeader(key)) {
        res.setHeader(key, value);
      }
    }

    const vary = res.getHeader("Vary");
    if (!vary) {
      res.setHeader("Vary", "Origin");
    } else if (typeof vary === "string" && !vary.includes("Origin")) {
      res.setHeader("Vary", `${vary}, Origin`);
    }
  }

  next();
});

app.use(
  "/assets",
  express.static(path.join(buildDir, "assets"), {
    immutable: true,
    maxAge: "1y",
  }),
);
app.use(express.static(buildDir, { maxAge: "1h" }));

app.use(createRequestHandler({ build }));

const host = process.env.HOST ?? "0.0.0.0";
const port = Number.parseInt(process.env.PORT ?? "3000", 10);

app.listen(port, host, () => {
  console.log(`kraig-social server listening on http://${host}:${port}`);
});
