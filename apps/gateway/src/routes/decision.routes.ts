import express from 'express';
import { decisionRequestSchema } from '@kraigwalker/kraig-social-content-sdk';
import { resolveDecision } from '../services/decision-engine.js';

export const decisionRouter = express.Router();

decisionRouter.post('/resolve', async (req, res) => {
  const parsed = decisionRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'invalid_request' });
  }

  const decision = await resolveDecision(parsed.data);

  res.setHeader('Cache-Control', 'no-store');
  res.json(decision);
});
