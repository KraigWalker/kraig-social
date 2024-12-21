const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const helmet = require("helmet");
const app = express();
const PORT = process.env.PORT || 3000;

let cachedIndex;

function setCustomCacheControl(res, file) {
  if (path.extname(file) === ".html") {
    // Custom Cache-Control for HTML files
    res.setHeader("Cache-Control", "public, no-transform, no-max-age=0");
  } else {
    res.setHeader(
      "Cache-Control",
      "public, no-transform, max-age=31536000, immutable"
    );
  }
}

// Load and cache index.html at startup
const indexPath = path.join(__dirname, "public", "index.html");
fs.readFile(indexPath, "utf8", (err, data) => {
  if (err) {
    console.error("Error loading index.html:", err);
    process.exit(1); // Exit if the file can't be loaded
  }
  cachedIndex = data;
});

/**
 * Security hardening
 */
app.disable("x-powered-by");
app.set("etag", false);

// Serve static files
app.use(
  express.static(path.join(__dirname, "public"), {
    index: false,
    etag: false,
    lastModified: false,
    setHeaders: setCustomCacheControl,
  })
);

app.use(helmet({ contentSecurityPolicy: false }));

// Simple route
app.get("/", (req, res) => {
  // Generate a secure randome nonce (base64 encoded)
  const nonce = crypto.randomBytes(16).toString("base64");

  res.setHeader(
    "Cache-Control",
    "max-age:0, private, must-revalidate, no-cache, no-transform, no-store"
  );

  // Set CSP header
  res.setHeader(
    "Content-Security-Policy",
    `base-uri 'none';default-src 'self';script-src 'unsafe-inline' 'nonce-${nonce}';object-src 'none';require-trusted-types-for 'script';`
  );

  // Read the index.html file
  const indexPath = path.join(__dirname, "public", "index.html");

  if (!cachedIndex) {
    res.status(500).send("Error loading index.html");
    return;
  }

  // Inject the nonce into the script tag
  const modifiedData = cachedIndex.replace(
    '<script async defer src="/main.1.js"></script>',
    `<script async defer src="/main.1.js" nonce="${nonce}"></script>`
  );

  res.send(modifiedData);
});

app.get("/main.1.js", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "main.1.js"));
});

// custom 404
app.use((req, res, next) => {
  res.status(404).send("Sorry can't find that!");
});

// custom error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
