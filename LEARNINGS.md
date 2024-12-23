1. You can serve a page with CSP nonces for scripts/styles and stil lbe able to have the client cache the resource for later.

2. After activation, the service worker will now control pages, but only those that were opened after the register() is successful. In other words, documents will have to be reloaded to actually be controlled, because a document starts life with or without a service worker and maintains that for its lifetime. To override this default behavior and adopt open pages, a service worker can call clients.claim().
