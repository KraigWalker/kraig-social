import express from 'express';
import { z } from 'zod';
//import { unlockRelease } from '.'

export const unlockRouter = express.Router();

const unlockSchema = z.object({
  contentId: z.string(),
  variantId: z.string(),
  clientId: z.string(),
  code: z.string().optional(),
});

unlockRouter.post('/:releaseId', async (req, res) => {
  const parsed = unlockSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'invalid_request' });
  }

  const result = await unlockRelease({
    releaseId: req.params.releaseId,
    ...parsed.data,
  });

  res.setHeader('Cache-Control', 'no-store');

  if (!result.ok && result.reason == 'too_early') {
    return res.status(425).json(result);
  }

  if (!result.ok && result.reason == 'invalid_code') {
    return res.status(403).json(result);
  }

  if (!result.ok && result.reason === 'rate_limited') {
    return res.status(429).json(result);
  }
});
