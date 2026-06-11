const sharedWorker = self as unknown as SharedWorkerGlobalScope;

sharedWorker.addEventListener('connect', (event: MessageEvent) => {
  const [port] = event.ports;

  if (!port) {
    return;
  }

  port.addEventListener('message', (messageEvent: MessageEvent) => {
    port.postMessage({
      type: 'kraig-social:shared-worker:message',
      payload: messageEvent.data,
    });
  });

  port.start();
});
