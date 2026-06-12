import { useEffect, useState } from 'react';
import type { Route } from './+types/admin-content';
import { gatewayOrigin, type DeliveryManifest } from '../gateway';

interface AdminRecord {
  id: string;
  title: string;
  description: string;
  body: string;
  route: string;
  releaseId: string;
  variantId: string;
  unlockAt: string;
  status: string;
  lastmod: string;
}

export const meta: Route.MetaFunction = () => [
  { title: 'Content Admin | Kraig Social' },
  { name: 'robots', content: 'noindex,nofollow' },
];

export default function AdminContent() {
  const [records, setRecords] = useState<AdminRecord[]>([]);
  const [manifest, setManifest] = useState<DeliveryManifest | null>(null);
  const [status, setStatus] = useState('Loading content registry');

  async function loadAdminState() {
    const response = await fetch(`${gatewayOrigin}/api/admin/content`);
    const data = (await response.json()) as { records: AdminRecord[]; manifest: DeliveryManifest };
    setRecords(data.records);
    setManifest(data.manifest);
    setStatus(`Loaded ${data.records.length} admin records`);
  }

  async function createDrop() {
    setStatus('Creating encrypted bundle');
    const unlockAt = new Date(Date.now() + 1000 * 30).toISOString();
    await fetch(`${gatewayOrigin}/api/admin/content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Operator Note',
        description: 'A CMS-created encrypted bundle opening in roughly 30 seconds.',
        body:
          'This was authored through the local CMS-like dashboard, encrypted by the gateway, and announced through the signal stream.',
        unlockAt,
      }),
    });
    await loadAdminState();
  }

  async function expire(contentId: string) {
    setStatus(`Expiring ${contentId}`);
    await fetch(`${gatewayOrigin}/api/admin/content/expire`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId }),
    });
    await loadAdminState();
  }

  useEffect(() => {
    void loadAdminState().catch((error) => {
      setStatus(error instanceof Error ? error.message : 'Gateway unavailable');
    });
  }, []);

  return (
    <main className="experience-shell compact">
      <header className="page-header">
        <p className="system-label">Local CMS</p>
        <h1>Encrypted bundle authoring</h1>
        <p>
          Create local timed content drops, expire existing records, and inspect the merged delivery
          manifest used by the ServiceWorker and public routes.
        </p>
      </header>

      <section className="admin-actions">
        <button className="primary-action" type="button" onClick={() => void createDrop()}>
          Create encrypted 30s drop
        </button>
        <a className="secondary-action" href="/sitemap.xml">
          View sitemap
        </a>
        <span>{status}</span>
      </section>

      <section className="content-table" aria-label="Admin content records">
        {records.map((record) => (
          <article className="content-row" key={`${record.id}:${record.releaseId}`}>
            <div>
              <h2>{record.title}</h2>
              <p>{record.description}</p>
              <a href={record.route}>{record.route}</a>
            </div>
            <div>
              <span className="pill">{record.status}</span>
              <p>{new Date(record.unlockAt).toLocaleString()}</p>
              <button className="secondary-action compact-button" type="button" onClick={() => void expire(record.id)}>
                Expire
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="telemetry-grid single" aria-label="Manifest preview">
        <article>
          <h2>Merged manifest</h2>
          <pre>{manifest ? JSON.stringify(manifest, null, 2) : 'No manifest loaded'}</pre>
        </article>
      </section>
    </main>
  );
}
