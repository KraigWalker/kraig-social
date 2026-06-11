import express from 'express';
import { mfRouter } from './routes/mf.routes.js';
import { decisionRouter } from './routes/decision.routes.js';
//import { unlockRouter } from "./routes/unlock.routes";

const app = express();

app.use(express.json({ limit: '256kb' }));

app.get('/healthz', (_req, res) => {
  res.json({ ok: true });
});

app.use('/mf', mfRouter);
app.use('/api/decision', decisionRouter);
//app.use("/api/unlock", unlockRouter);

app.listen(process.env.PORT ?? 3001, () => {
  console.log('gateway listening');
});
