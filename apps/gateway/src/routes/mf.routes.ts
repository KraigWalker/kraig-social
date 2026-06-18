import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const mfRouter = express.Router();

export const mfRoot = path.resolve(process.cwd(), 'dist/mf');
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const releaseRoot = path.resolve(currentDirectory, '../../../dispatch-panel/dist/releases');

mfRouter.use(
  '/assets',
  express.static(path.join(mfRoot, 'assets'), {
    immutable: true,
    maxAge: '1y',
    index: false,
    redirect: false,
  })
);

mfRouter.use(
  '/content',
  express.static(path.join(mfRoot, 'content'), {
    maxAge: '30s',
    etag: true,
  })
);

mfRouter.use(
  '/releases',
  express.static(releaseRoot, {
    immutable: true,
    maxAge: '1y',
    etag: true,
    index: false,
    redirect: false,
    setHeaders(res, filePath) {
      if (filePath.endsWith('mf-manifest.json') || filePath.endsWith('mf-stats.json')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  })
);
