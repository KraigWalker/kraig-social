import * as React from "react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import crypto from "node:crypto";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import hpp from "hpp";
import { execSync } from "node:child_process";
import { renderToPipeableStream } from "react-dom/server";
import { Shell } from "./components/Shell.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.env.NODE_ENV = "production";

const app = express();
const PORT: number = 3000;
let GITHUB_WEBHOOK_SECRET = "";

try {
  GITHUB_WEBHOOK_SECRET = fs
    .readFileSync(process.env.GITHUB_WEBHOOK_SECRET_FILE, "utf8")
    .trim();
  console.log(
    "Loaded GitHub webhook secret from /run/secrets/github_webhook_secret"
  );
} catch (err) {
  console.warn("Could not read secret file:", err);
}

const DOCKER_COMPOSE_FILE =
  process.env.DOCKER_COMPOSE_FILE || "docker-stack.yml";
const STACK_NAME = process.env.STACK_NAME || "mystack";

const critFilePath = path.join(__dirname, "public", "critical.1.css");
const critContents = fs.readFileSync(critFilePath, "utf-8");

/**
 * Create a SHA-512 hash for the critical CSS and Base64-encode it.
 * Format for CSP: "sha512-<Base64Hash>"
 * @todo Probably need a more robust way to create hashes for all executable files.
 */
const critHash = `sha512-${crypto
  .createHash("sha512")
  .update(critContents, "utf8")
  .digest("base64")}`;

/**
 * @todo
 * Read if we are in production or development mode from process.env or .env file
 * if we are in dev mode, allow localhost:port
 * if we are in production mode, allow only the domain
 */

const corsOptions = {
  origin: function (origin: any, callback: any) {
    // db.loadOrigins is an example call to load
    // a list of origins from a backing database
    // db.loadOrigins(function (error, origins) {
    //  //  callback(error, origins);
    // });
  },
};

let cachedIndex: any;

const mainFilePath = path.join(__dirname, "public", "main.3.js");
const mainContents = fs.readFileSync(mainFilePath, "utf-8");

/**
 * Create a SHA-512 hash for the ServiceWorker and Base64-encode it.
 * Format for CSP: "sha512-<Base64Hash>"
 * @todo Probably need a more robust way to create hashes for all executable files.
 */
const mainScriptHash = `sha512-${crypto
  .createHash("sha512")
  .update(mainContents, "utf8")
  .digest("base64")}`;

const swFilePath = path.join(__dirname, "public", "sw.1.js");
const swContents = fs.readFileSync(swFilePath, "utf-8");

/**
 * Create a SHA-512 hash for the ServiceWorker and Base64-encode it.
 * Format for CSP: "sha512-<Base64Hash>"
 * @todo Probably need a more robust way to create hashes for all executable files.
 */
const swScriptHash = `sha512-${crypto
  .createHash("sha512")
  .update(swContents)
  .digest("base64")}`;

/**
 * Security hardening
 */
app.disable("x-powered-by");
app.set("etag", false);

const getResCSPNonce = (req: any, res: any) => `'nonce-${res.locals.cspNonce}'`;

app.use((req: any, res: any, next: any) => {
  res.locals.cspNonce = crypto.randomBytes(32).toString("base64");
  next();
});

function isServiceWorkerRequest(req: any) {
  // come back to this later
  return req.get("Service-Worker") === "script" || req.query.sw === "1";
}

// Serve static files
app.use(
  express.static(path.join(__dirname, "public"), {
    index: false,
    etag: false,
    lastModified: false,
  })
);

/**
 * This masks the "/public" directory from the URL
 */
app.get("/critical.1.css", (req: any, res: any) => {
  res.sendFile(path.join(__dirname, "public", "critical.1.css"));
});

/**
 * This masks the "/public" directory from the URL
 */
app.get("/main.3.js", (req: any, res: any) => {
  res.sendFile(path.join(__dirname, "public", "main.3.js"));
});

/**
 * ServiceWorker script - loaded if clients support ServiceWorkers
 * This masks the "/public" directory from the URL
 */
app.get("/sw.1.js", (req: any, res: any) => {
  res.sendFile(path.join(__dirname, "public", "sw.1.js"));
});

/**
 * Robots.txt
 */
app.get("/Robots.txt", (req: any, res: any) => {
  res.setHeader("Cache-Control", "max-age:86400");
  res.setHeader("Content-Type", "text/plain");
  res.sendFile(path.join(__dirname, "public", "Robots.txt"));
});

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      reportOnly: false,
      directives: {
        "default-src": ["'none'"],
        "base-uri": ["'none'"],
        "font-src": ["'none'"],
        "form-action": ["'none'"],
        "frame-ancestors": ["'none'"],
        "img-src": ["'none'"],
        "object-src": ["'none'"],
        "script-src-elem": [getResCSPNonce, `'${mainScriptHash}'`],
        "script-src-attr": ["'none'"],
        "style-src-elem": [getResCSPNonce, `'${critHash}'`],
        "style-src-attr": ["'none'"],
        "style-src": [
          "https://kraig.social/critical.1.css",
          getResCSPNonce,
          `'${critHash}'`,
        ],
        /** @note This doesn't seem to be working without adding self */
        "worker-src": ["'self'", `'${swScriptHash}'`],
        "require-trusted-types-for": ["'script'"],
        "upgrade-insecure-requests": [],
      },
    },
    strictTransportSecurity: {
      maxAge: 63072000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

app.use(cors());
app.use(hpp());

/** GitHub Redeploy Webhook */
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

/**
 * Middleware to verify the GitHub Webhook Secret
 */
function verifyGitHubSignature(req, res, next) {
  if (!GITHUB_WEBHOOK_SECRET) {
    return res.status(400).send("GitHub Webhook secret not set");
  }

  const signature = req.header("X-Hub-Signature-256");
  if (!signature) {
    return res.status(400).send("Midding X-Hub-Signature-256 header");
  }

  const [algo, expectedSig] = signature.split("=");
  if (algo !== "sha256") {
    return res.status(400).send("Only sha256 is supported");
  }

  // Compute the expected signature
  const hmac = crypto.createHmac("sha256", GITHUB_WEBHOOK_SECRET);
  hmac.update(req.rawBody);

  const calculatedSig = hmac.digest("hex");

  // Compare signatures in constant time
  if (
    !crypto.timingSafeEqual(
      Buffer.from(calculatedSig, "hex"),
      Buffer.from(expectedSig, "hex")
    )
  ) {
    return res.status(400).send("Invalid signature");
  }

  next();
}

app.post("/back_office/redeploy", verifyGitHubSignature, (req, res) => {
  // 1. Optionally check the event type
  const eventType = req.header("X-GitHub-Event") || "unknown";
  console.log(`Received GitHub event: ${eventType}`);

  // 2. (Optional) If you only want to respond to GHCR "package" events:
  if (eventType !== "package") {
    return res.status(200).send("Ignoring event");
  }

  try {
    execSync(
      `docker stack deploy -c ${DOCKER_COMPOSE_FILE} ${STACK_NAME} --detach=false`,
      {
        stdio: "inherit",
      }
    );
    console.log("Successfully redeployed stack:", STACK_NAME);

    res.status(200).send("Redeployed successfully");
  } catch (err) {
    console.error("Error during redeploy:", err);
    return res.status(500).send("Error redeploying");
  }
});

// Serve atproto-did.txt when /.well-known/atproto-did is requested
app.get("/.well-known/atproto-did", (req: any, res: any) => {
  res.setHeader("Content-Type", "text/plain");
  res.status(200);
  res.sendFile(
    path.join(__dirname, "public", ".well-known", "atproto-did.txt")
  );
});

app.get("*", (req: any, res: any) => {
  try {
    // 1. Check if the request is from a ServiceWorker
    const fromServiceWorker = isServiceWorkerRequest(req);

    // 4. Prepare Streaming SSR
    // The `renderToPipeableStream` function returns a Readable Stream with a `pipe` method
    // We can use to stream the HTML response to the client as it's being rendered
    let didError = false;

    // 5. Start rendering. Pass initial props or data as needed.
    const { pipe } = renderToPipeableStream(
      <Shell cspNonce={res.locals.cspNonce} />,
      {
        bootstrapModules: ["main.3.js"],
        nonce: res.locals.cspNonce,
        onShellReady() {
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.setHeader(
            "Cache-Control",
            "max-age:0, private, must-revalidate, no-cache"
          );

          // preload headers for critical css and main script (with nonce)
          res.set(
            "Link",
            `</critical.1.css>; rel="preload"; as="style"; crossorigin="anonymous"; media="all"; nonce="${res.locals.cspNonce}"; integrity="${critHash}", </main.3.js>; rel="modulepreload"; as="script"; crossorigin="anonymous"; nonce="${res.locals.cspNonce}" integrity="${mainScriptHash}"`
          );

          res.set(
            "Permissions-Policy",
            "accelerometer=(),ambient-light-sensor=(),attribution-reporting=(),autoplay=(),bluetooth=(),browsing-topics=(),camera=(),compute-pressure=(),cross-origin-isolated=(),display-capture=(),document-domain=(),encrypted-media=(),fullscreen=(),gamepad=(),geolocation=(),gyroscope=(),hid=(),identity-credentials-get=(),idle-detection=(),local-fonts=(),magnetometer=(),microphone=(),midi=(),otp-credentials=(),payment=(),picture-in-picture=(),publickey-credentials-create=(),publickey-credentials-get=(),screen-wake-lock=(),serial=(),speaker-selection=(),storage-access=(),sync-xhr=(),usb=(),wake-lock=(),web-share=(),window-management=(),xr-spatial-tracking=()"
          );

          pipe(res);
        },
        onShellError(error: any) {
          console.error(error);
          res.end();
        },
        onAllReady() {
          res.end();
        },
        onError(error: any) {
          console.error(error);
          res.status(500).end("Internal Server Error");
        },
      }
    );
  } catch (e) {
    console.error(e);
    res.status(500).send("Server error");
  }
});

// custom 404
//app.use((req: any, res: any, next: any) => {
//  res.status(404).send("Sorry can't find that!");
//});

// custom error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
