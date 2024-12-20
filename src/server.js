const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, "public"), { index: false }));

// Simple route
app.get("/", (req, res) => {
  // Generate a secure randome nonce (base64 encoded)
  const nonce = crypto.randomBytes(16).toString("base64");

  // Set CSP header
  res.setHeader(
    "Content-Security-Policy",
    `base-uri 'none';default-src 'self';script-src 'unsafe-inline' 'nonce-${nonce}';object-src 'none';require-trusted-types-for 'script';`
  );

  // Read the index.html file
  const indexPath = path.join(__dirname, "public", "index.html");

  fs.readFile(indexPath, "utf8", (err, data) => {
    if (err) {
      res.status(500).send("Error loading index.html");
      return;
    }

    // Inject the nonce into the script tag
    const modifiedData = data.replace(
      '<script src="main.js" />',
      `<script src="main.js" nonce="${nonce}" />`
    );

    res.send(modifiedData);
  });
});

app.get("/main.js", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "main.js"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
