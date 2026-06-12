import { useEffect, useMemo, useState } from 'react';
import type { Route } from './+types/drop';
import { fetchManifest, gatewayOrigin, gatewayUrl, type ManifestEntry } from '../gateway';

interface DecryptedPayload {
  title: string;
  description: string;
  body: string;
  route: string;
}

function fromBase64Url(value: string): ArrayBuffer {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const bytes = new Uint8Array(
    atob(padded)
      .split('')
      .map((character) => character.charCodeAt(0))
  );
  return bytes.buffer as ArrayBuffer;
}

async function decryptPayload(entry: ManifestEntry, keyBase64Url: string): Promise<DecryptedPayload> {
  if (!entry.encrypted) {
    throw new Error('Missing encrypted bundle metadata');
  }

  const key = await crypto.subtle.importKey(
    'raw',
    fromBase64Url(keyBase64Url),
    'AES-GCM',
    false,
    ['decrypt']
  );
  const response = await fetch(gatewayUrl(entry.encrypted.ciphertextUrl));
  const encryptedBytes = await response.arrayBuffer();
  const clearBytes = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64Url(entry.encrypted.iv) },
    key,
    encryptedBytes
  );
  return JSON.parse(new TextDecoder().decode(clearBytes)) as DecryptedPayload;
}

export async function loader({ params }: Route.LoaderArgs) {
  const manifest = await fetchManifest();
  const entry = manifest.entries.find((item) => item.route === `/drops/${params.slug}`);
  if (!entry) {
    throw new Response('Not found', { status: 404 });
  }
  return { entry };
}

export const meta: Route.MetaFunction = ({ data }) => {
  const entry = data?.entry;
  if (!entry) {
    return [{ title: 'Drop not found | Kraig Social' }];
  }
  return [
    { title: entry.seo.title },
    { name: 'description', content: entry.seo.description },
    { name: 'robots', content: entry.seo.indexable ? 'index,follow' : 'noindex,nofollow' },
  ];
};

export default function Drop({ loaderData }: Route.ComponentProps) {
  const { entry } = loaderData;
  const [payload, setPayload] = useState<DecryptedPayload | null>(
    entry.body
      ? {
          title: entry.title,
          description: entry.description,
          body: entry.body,
          route: entry.route,
        }
      : null
  );
  const [status, setStatus] = useState('Checking encrypted preload status');
  const unlockAt = useMemo(() => (entry.unlockAt ? new Date(entry.unlockAt) : undefined), [entry.unlockAt]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/service-worker.js').then(async (registration) => {
        const worker = registration.active ?? registration.waiting ?? registration.installing;
        worker?.postMessage({
          type: 'CONTENT_MANIFEST',
          entries: [entry],
          gatewayOrigin,
        });
      });
    }
  }, [entry]);

  async function unlock() {
    setStatus('Requesting unlock key');
    const response = await fetch(`${gatewayOrigin}/api/unlock/${entry.releaseId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentId: entry.contentId,
        variantId: entry.variantId,
        clientId: window.localStorage.getItem('kraig-social-client-id') ?? 'drop-reader',
      }),
    });
    const result = (await response.json()) as
      | { ok: true; key: string; keyId: string }
      | { ok: false; reason: string; retryAfterSeconds?: number };

    if (!result.ok) {
      setStatus(
        result.reason === 'too_early'
          ? `Still locked. Try again in ${result.retryAfterSeconds ?? 1}s.`
          : `Unlock failed: ${result.reason}`
      );
      return;
    }

    navigator.serviceWorker.controller?.postMessage({
      type: 'MF_UNLOCK_KEY',
      entry,
      key: result.key,
      keyId: result.keyId,
      gatewayOrigin,
    });
    const nextPayload = await decryptPayload(entry, result.key);
    setPayload(nextPayload);
    setStatus('Unlocked and decrypted');
  }

  return (
    <main className="experience-shell compact readable">
      <article className="article-shell">
        <p className="system-label">Timed encrypted drop</p>
        <h1>{payload?.title ?? entry.title}</h1>
        <p className="hero-lede">{payload?.description ?? entry.description}</p>
        <div className="drop-status">
          <span>Status</span>
          <strong>{payload ? 'Readable' : status}</strong>
        </div>
        {!payload && unlockAt ? (
          <p>
            Unlock scheduled for <strong>{unlockAt.toLocaleString()}</strong>. The encrypted bundle
            is eligible for ServiceWorker preload before the key is released.
          </p>
        ) : null}
        {payload ? (
          <div className="article-body">
            <p>{payload.body}</p>
          </div>
        ) : (
          <button className="primary-action" type="button" onClick={() => void unlock()}>
            Request unlock key
          </button>
        )}
      </article>
    </main>
  );
}
