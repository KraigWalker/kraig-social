import express from 'express';
import { getDeliveryManifest } from '../services/local-data.js';

export const contentRouter = express.Router();

contentRouter.get('/manifest', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.json(await getDeliveryManifest());
});
