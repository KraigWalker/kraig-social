import express from "express";
import { createRequestHandler } from "@react-router/express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as build from "../build/server/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildDir = path.resolve(__dirname, "../build/client");

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", true);

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
