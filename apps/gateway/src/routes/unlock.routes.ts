import express from 'express';
import { unlockRequestSchema } from '@kraigwalker/kraig-social-content-sdk';
import { unlockRelease } from '../services/unlock-service.js';

export const unlockRouter = express.Router();

unlockRouter.post('/:releaseId', async (req, res) => {
  const parsed = unlockRequestSchema.safeParse(req.body);

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

  if (!result.ok && result.reason === 'invalid_code') {
    return res.status(403).json(result);
  }

  if (!result.ok && result.reason === 'rate_limited') {
    return res.status(429).json(result);
  }

  if (!result.ok && result.reason === 'revoked') {
    return res.status(410).json(result);
  }

  if (!result.ok && result.reason === 'not_found') {
    return res.status(404).json(result);
  }

  return res.json(result);
});
