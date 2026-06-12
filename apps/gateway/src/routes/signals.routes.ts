import express from 'express';
import { developerSignalSchema } from '@kraigwalker/kraig-social-content-sdk';
import { createDeveloperSignal, getRecentSignals, onDeveloperSignal } from '../services/signals.js';

export const signalsRouter = express.Router();

signalsRouter.get('/', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ signals: getRecentSignals() });
});

signalsRouter.post('/', (req, res) => {
  const parsed = developerSignalSchema.partial({ id: true, createdAt: true }).safeParse(req.body);
  if (!parsed.success || !parsed.data.type) {
    return res.status(400).json({ ok: false, error: 'invalid_request' });
  }

  const signal = createDeveloperSignal({
    ...parsed.data,
    type: parsed.data.type,
  });
  res.status(201).json({ ok: true, signal });
});

signalsRouter.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const writeSignal = (signal: unknown) => {
    res.write(`event: signal\n`);
    res.write(`data: ${JSON.stringify(signal)}\n\n`);
  };

  writeSignal({
    id: 'connected',
    type: 'devcontainer.opened',
    payload: { workspace: process.cwd() },
    createdAt: new Date().toISOString(),
  });

  const unsubscribe = onDeveloperSignal(writeSignal);
  const heartbeat = setInterval(() => {
    res.write(`event: heartbeat\n`);
    res.write(`data: ${JSON.stringify({ serverNow: new Date().toISOString() })}\n\n`);
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});
