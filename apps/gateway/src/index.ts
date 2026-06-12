import express from 'express';
import { mfRouter } from './routes/mf.routes.js';
import { decisionRouter } from './routes/decision.routes.js';
import { unlockRouter } from './routes/unlock.routes.js';
import { contentRouter } from './routes/content.routes.js';
import { signalsRouter } from './routes/signals.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { ensureLocalDemoData } from './services/local-data.js';

const app = express();

app.use(express.json({ limit: '256kb' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin ?? '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.get('/healthz', (_req, res) => {
  res.json({ ok: true });
});

app.use('/mf', mfRouter);
app.use('/api/decision', decisionRouter);
app.use('/api/unlock', unlockRouter);
app.use('/api/content', contentRouter);
app.use('/api/signals', signalsRouter);
app.use('/api/admin', adminRouter);

await ensureLocalDemoData();

app.listen(process.env.PORT ?? 3001, () => {
  console.log('gateway listening on http://localhost:%s', process.env.PORT ?? 3001);
});
