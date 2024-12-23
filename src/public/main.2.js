/**
 * The main goal file is as follows:
 * 1. Register a serviceworker if suppoterd
 * 2. Carry out a limited range of operations in response to messages from the serviceworker
 * 3. Carry out immediate operations that do not require the serviceworker in response to user actions
 */
async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    // be extra-cautious about registering the service worker
    // If the page is already controlled by a SW, `navigator.serviceWorker.controller` is non-null
    if (!navigator.serviceWorker.controller) {
      navigator.serviceWorker.getRegistration("/sw.1.js").then(async () => {
        if (!registration) {
          try {
            const registration = await navigator.serviceWorker.register(
              "/sw.1.js",
              {
                scope: "/",
              }
            );

            if (registration.installing) {
              console.log("Service Worker installing");
            } else if (registration.waiting) {
              console.log("Service Worker installed");
            } else if (registration.active) {
              console.log("Service Worker active");
            }
          } catch (error) {
            console.error("Service Worker registration failed with ", error);
          }
        } else {
          console.log("Service Worker already registered");
        }
      });
    }
  }
}

registerServiceWorker();
