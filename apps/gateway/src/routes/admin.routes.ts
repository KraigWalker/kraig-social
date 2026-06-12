import express from 'express';
import { z } from 'zod';
import {
  createAdminContent,
  expireAdminContent,
  getDeliveryManifest,
  listAdminContent,
} from '../services/local-data.js';
import { createDeveloperSignal } from '../services/signals.js';

export const adminRouter = express.Router();

const createContentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  unlockAt: z.string().datetime().optional(),
});

const expireContentSchema = z.object({
  contentId: z.string().min(1),
});

adminRouter.get('/content', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    records: await listAdminContent(),
    manifest: await getDeliveryManifest(),
  });
});

adminRouter.post('/content', async (req, res) => {
  const parsed = createContentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'invalid_request' });
  }

  const record = await createAdminContent(parsed.data);
  const signal = createDeveloperSignal({
    type: 'release.promoted',
    releaseId: record.releaseId,
    payload: { contentId: record.id },
  });

  res.status(201).json({ ok: true, record, signal });
});

adminRouter.post('/content/:contentId/expire', async (req, res) => {
  const record = await expireAdminContent(req.params.contentId);
  if (!record) {
    return res.status(404).json({ ok: false, error: 'not_found' });
  }

  const signal = createDeveloperSignal({
    type: 'module.revoked',
    releaseId: record.releaseId,
    payload: { contentId: record.id },
  });

  res.json({ ok: true, record, signal });
});

adminRouter.post('/content/expire', async (req, res) => {
  const parsed = expireContentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'invalid_request' });
  }

  const record = await expireAdminContent(parsed.data.contentId);
  if (!record) {
    return res.status(404).json({ ok: false, error: 'not_found' });
  }

  const signal = createDeveloperSignal({
    type: 'module.revoked',
    releaseId: record.releaseId,
    payload: { contentId: record.id },
  });

  res.json({ ok: true, record, signal });
});
