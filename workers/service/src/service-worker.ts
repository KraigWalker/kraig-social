const serviceWorker = self as unknown as ServiceWorkerGlobalScope;

const CACHE_NAME = 'kraig-social-mf-assets-v1';

serviceWorker.addEventListener('install', () => {
  serviceWorker.skipWaiting();
});

serviceWorker.addEventListener('activate', (event) => {
  event.waitUntil(serviceWorker.clients.claim());
});

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
