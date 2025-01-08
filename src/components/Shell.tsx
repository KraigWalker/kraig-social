import * as React from "react";
import * as path from "node:path";
import * as fs from "node:fs";
import * as crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import { GlobalHeader } from "./GlobalHeader.js";
import { GlobalFooter } from "./GlobalFooter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const critFilePath = path.join(__dirname, "../", "public", "critical.1.css");
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

export function Shell({
  isServiceWorker = false,
  isDataSaver = false,
  cspNonce,
}) {
  return (
    <html>
      <head>
        <link
          rel="preload"
          media="all"
          href="/critical.1.css"
          as="style"
          crossOrigin="anonymous"
          nonce={cspNonce}
          integrity={critHash}
        />
        <link
          rel="stylesheet"
          media="all"
          href="/critical.1.css"
          crossOrigin="anonymous"
          nonce={cspNonce}
          integrity={critHash}
        />
      </head>
      <body>
        {!isServiceWorker && <GlobalHeader />}
        <main id="main" tabIndex={-1}>
          <ul>
            <li>
              <h2>An Article Headline</h2>
            </li>
          </ul>
        </main>
        {!isServiceWorker && <GlobalFooter />}
      </body>
    </html>
  );
}
