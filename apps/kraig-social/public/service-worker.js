const ENCRYPTED_CACHE = 'kraig-social-encrypted-bundles-v1';
const DECRYPTED_CACHE = 'kraig-social-decrypted-content-v1';
const MODULE_CACHE = 'kraig-social-mf-assets-v1';

function fromBase64Url(value) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return new Uint8Array(
    atob(padded)
      .split('')
      .map((character) => character.charCodeAt(0))
  );
}

function encryptedUrl(entry, gatewayOrigin) {
  const path = entry.encrypted?.ciphertextUrl ?? entry.encryptedPayloadUrl;
  if (!path) {
    return undefined;
  }
  return path.startsWith('http') ? path : `${gatewayOrigin}${path}`;
}

function decryptedUrl(entry) {
  return `/__kraig/decrypted/${encodeURIComponent(entry.releaseId)}/${encodeURIComponent(entry.variantId)}`;
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

async function handleRuntimeModuleRequest(request) {
  const cache = await caches.open(MODULE_CACHE);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }
  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
}

async function preloadContentManifest(message) {
  const encryptedCache = await caches.open(ENCRYPTED_CACHE);
  const decryptedCache = await caches.open(DECRYPTED_CACHE);

  await Promise.all(
    message.entries.map(async (entry) => {
      if (entry.action === 'expire' || entry.action === 'revoke') {
        const url = encryptedUrl(entry, message.gatewayOrigin);
        await decryptedCache.delete(decryptedUrl(entry));
        if (url) {
          await encryptedCache.delete(url);
        }
        return;
      }

      const url = encryptedUrl(entry, message.gatewayOrigin);
      if (!url || (await encryptedCache.match(url))) {
        return;
      }

      const response = await fetch(url);
      if (response.ok) {
        await encryptedCache.put(url, response);
      }
    })
  );
}

async function storeUnlockKey(message) {
  if (!message.entry.encrypted) {
    return;
  }

  const url = encryptedUrl(message.entry, message.gatewayOrigin);
  if (!url) {
    return;
  }

  const encryptedCache = await caches.open(ENCRYPTED_CACHE);
  const encryptedResponse = (await encryptedCache.match(url)) ?? (await fetch(url));
  const encryptedBytes = await encryptedResponse.arrayBuffer();
  const cryptoKey = await self.crypto.subtle.importKey(
    'raw',
    fromBase64Url(message.key),
    'AES-GCM',
    false,
    ['decrypt']
  );
  const clearBytes = await self.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64Url(message.entry.encrypted.iv) },
    cryptoKey,
    encryptedBytes
  );

  const decryptedCache = await caches.open(DECRYPTED_CACHE);
  await decryptedCache.put(
    decryptedUrl(message.entry),
    new Response(clearBytes, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  );
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/mf/runtime/')) {
    event.respondWith(handleRuntimeModuleRequest(event.request));
  }

  if (url.pathname.startsWith('/__kraig/decrypted/')) {
    event.respondWith(
      caches.open(DECRYPTED_CACHE).then(async (cache) => {
        return (
          (await cache.match(url.pathname)) ??
          new Response(JSON.stringify({ ok: false, error: 'not_decrypted' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
          })
        );
      })
    );
  }
});

self.addEventListener('message', (event) => {
  const message = event.data;

  if (message?.type === 'CONTENT_MANIFEST') {
    event.waitUntil(preloadContentManifest(message));
  }

  if (message?.type === 'MF_UNLOCK_KEY') {
    event.waitUntil(storeUnlockKey(message));
  }
});
