const serviceWorkerURLPolicy = trustedTypes.createPolicy(
  "serviceWorkerURLPolicy",
  {
    createScriptURL: (url) => url,
  }
);

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
      navigator.serviceWorker.getRegistration("/sw.1.js").then(async (reg) => {
        if (!reg) {
          try {
            const swUrl = serviceWorkerURLPolicy.createScriptURL("/sw.1.js");

            const registration = await navigator.serviceWorker.register(swUrl, {
              scope: "/",
            });

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

// listen for messages from the service worker
navigator.serviceWorker.addEventListener("message", (event) => {
  if (event.data?.type === "SERVICE_WORKER_ACTIVE") {
    // update p tag with active class
    const p = document.querySelector("p");
    p.classList.add("active");
  }
});
