import express from 'express';
import { z } from 'zod';
// import { resolveDecision } from '../services/decision.service';

export const decisionRouter = express.Router();

const requestSchema = z.object({
  contentId: z.string(),
  client: z.object({
    clientId: z.string(),
    ring: z.string().optional(),
    traits: z.record(z.string(), z.unknown()).default({}),
  }),
  context: z.record(z.string(), z.unknown()).default({}),
});

decisionRouter.post('/resolve', async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'invalid_request' });
  }

  //const decision = await resolveDecision(parsed.data);

  res.setHeader('Cache-Control', 'no-store');
  res.json({
    ...decisionRouter,
    serverNow: new Date().toISOString(),
  });
});
