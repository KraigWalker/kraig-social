const serviceWorker = self as unknown as ServiceWorkerGlobalScope;

const CACHE_NAME = 'kraig-social-mf-assets-v1';

serviceWorker.addEventListener('install', () => {
  serviceWorker.skipWaiting();
});

serviceWorker.addEventListener('activate', (event) => {
  event.waitUntil(serviceWorker.clients.claim());
});

async function handleRuntimeModuleRequest(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
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

async function preloadPlan(plan: unknown): Promise<void> {
  if (!Array.isArray(plan)) {
    return;
  }

  const cache = await caches.open(CACHE_NAME);
  await Promise.all(
    plan
      .filter((asset): asset is string => typeof asset === 'string')
      .map(async (asset) => {
        const response = await fetch(asset);
        if (response.ok) {
          await cache.put(asset, response);
        }
      })
  );
}

async function deleteAssets(assetIds: unknown): Promise<void> {
  if (!Array.isArray(assetIds)) {
    return;
  }

  const cache = await caches.open(CACHE_NAME);
  await Promise.all(
    assetIds
      .filter((asset): asset is string => typeof asset === 'string')
      .map((asset) => cache.delete(asset))
  );
}

async function storeUnlockKey(_message: unknown): Promise<void> {
  return;
}

async function runGarbageCollection(_now: unknown): Promise<void> {
  return;
}

serviceWorker.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/mf/runtime/')) {
    event.respondWith(handleRuntimeModuleRequest(event.request));
  }
});

serviceWorker.addEventListener('message', (event) => {
  const message = event.data;

  if (message?.type === 'MF_PRELOAD_PLAN') {
    event.waitUntil(preloadPlan(message.plan));
  }

  if (message?.type === 'MF_DELETE_ASSETS') {
    event.waitUntil(deleteAssets(message.assetIds));
  }

  if (message?.type === 'MF_UNLOCK_KEY') {
    event.waitUntil(storeUnlockKey(message));
  }

  if (message?.type === 'MF_GC') {
    event.waitUntil(runGarbageCollection(message.now));
  }
});
