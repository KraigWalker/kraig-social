self.addEventListener("install", (event) => {
  // Let this worker become active immediately (no waiting).
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  // Claim all clients immediately, so that the worker controls all pages.
  event.waitUntil(
    (async () => {
      if (self.clients && self.clients.claim) {
        await self.clients.claim();

        // Now we can reach out to all controlled clients (pages)
        const allClients = await self.clients.matchAll();

        // For each controlled page, send a message requesting data
        allClients.forEach((client) => {
          client.postMessage({ type: "SEND_SHELL_CONTENT" });
        });
      }
    })()
  );
});

self.addEventListener("message", async (event) => {
  if (event.data?.type === "SHELL_CONTENT") {
    // Put this HTML into the cache or IndexedDB
    // Perform cannibalisation logic:
    // - Remove nonce attribes from script/style tags
    // Create new headers
    //   const cacheName = 'shell-content';
    //   const cache = await caches.open(cacheName);
    // Create a response from the HTML string
    //   const response = new Response('some html', {
    //       headers: { 'Content-Type': 'text/html' }
    //   });
    // await cache.put();
  }
});
