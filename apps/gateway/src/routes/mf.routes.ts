import express from "express";
import path from "node:path";

export const mfRouter = express.Router();

export const mfRoot = path.resolve(process.cwd(), "dist/mf");

mfRouter.use(
  "/assets",
  express.static(path.join(mfRoot, "assets"), {
    immutable: true,
    maxAge: "1y",
    index: false,
    redirect: false,
  }),
);

mfRouter.use(
  "/content",
  express.static(path.join(mfRoot, "content"), {
    maxAge: "30s",
    etag: true,
  }),
);

mfRouter.use(
  "/releases",
  express.static(path.join(mfRoot, "releases"), {
    maxAge: "30s",
    etag: true,
  }),
);

mfRouter.get("/registry.json", async (_req, res) => {
  res.setHeader("Cache-Control", "no-cache");
  res.sendFile(path.join(mfRoot, "registry.json"));
});
