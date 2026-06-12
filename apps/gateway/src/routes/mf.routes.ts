import express from 'express';
import path from 'node:path';
import { getModuleRegistry } from '../services/local-data.js';

export const mfRouter = express.Router();

export const mfRoot = path.resolve(process.cwd(), 'dist/mf');

function remoteEntrySource(moduleId: string, version: string): string {
  const accent = version === '1.1.0' ? '#7df9ff' : '#ff4f87';
  const label = version === '1.1.0' ? 'live workbench' : 'stable dispatch';
  return `
const accent = ${JSON.stringify(accent)};
const label = ${JSON.stringify(label)};

export function mount(target, decision) {
  target.innerHTML = "";
  const card = document.createElement("section");
  card.style.cssText = [
    "border:1px solid color-mix(in srgb, " + accent + " 55%, transparent)",
    "background:linear-gradient(135deg, rgba(8,14,24,.94), rgba(20,26,38,.88))",
    "box-shadow:0 20px 80px rgba(0,0,0,.35)",
    "border-radius:8px",
    "padding:18px",
    "color:#f7fbff",
    "min-height:220px",
    "display:grid",
    "gap:14px"
  ].join(";");
  card.innerHTML = \`
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
      <span style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:\${accent};">\${label}</span>
      <span style="font-size:12px;color:#a8b3c7;">\${decision.moduleId}@\${decision.moduleVersion}</span>
    </div>
    <h3 style="margin:0;font-size:28px;line-height:1.05;">Gateway-selected module online</h3>
    <p style="margin:0;color:#dbe7ff;line-height:1.55;">Variant <strong>\${decision.variantId}</strong> was selected because <strong>\${decision.reason}</strong>.</p>
    <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;">
      <div style="border:1px solid rgba(255,255,255,.12);padding:12px;border-radius:6px;"><b>Ring</b><br><span>\${decision.reason.split(':')[1] ?? "public"}</span></div>
      <div style="border:1px solid rgba(255,255,255,.12);padding:12px;border-radius:6px;"><b>TTL</b><br><span>\${decision.ttlSeconds}s</span></div>
      <div style="border:1px solid rgba(255,255,255,.12);padding:12px;border-radius:6px;"><b>HMR</b><br><span>\${decision.hotReloadCapable ? "capable" : "locked"}</span></div>
    </div>
  \`;
  target.append(card);
  return () => card.remove();
}

export const metadata = {
  moduleId: ${JSON.stringify(moduleId)},
  version: ${JSON.stringify(version)},
  hotReloadCapable: true
};
`;
}

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
  express.static(path.join(mfRoot, 'releases'), {
    maxAge: '30s',
    etag: true,
  })
);

mfRouter.get('/registry.json', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.json({
    generatedAt: new Date().toISOString(),
    modules: await getModuleRegistry(),
  });
});

mfRouter.get('/remotes/:moduleId/:version/remoteEntry.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send(remoteEntrySource(req.params.moduleId, req.params.version));
});
