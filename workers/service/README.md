# Kraig Social Service Worker

Standalone ServiceWorker source package for Kraig Social encrypted preload and runtime cache
behavior.

## What This Worker Does

- Claims clients immediately after activation.
- Preloads encrypted content bundles from delivery manifest messages.
- Caches encrypted payloads separately from decrypted payloads.
- Accepts unlock-key messages from the app.
- Decrypts AES-GCM payloads in the worker.
- Stores decrypted JSON responses under an internal cache URL.
- Deletes encrypted and decrypted payloads when manifest actions expire or revoke content.
- Caches runtime module requests under the module asset cache when requested through the worker
  runtime path.

## Message Protocol

The app posts a manifest message when a drop route loads:

```ts
{
  type: 'CONTENT_MANIFEST',
  gatewayOrigin: 'http://localhost:3001',
  entries: [manifestEntry]
}
```

After the gateway releases a key, the app posts:

```ts
{
  type: 'MF_UNLOCK_KEY',
  gatewayOrigin: 'http://localhost:3001',
  key: '<base64url raw AES key>',
  entry: manifestEntry
}
```

The worker stores decrypted content at:

```text
/__kraig/decrypted/:releaseId/:variantId
```

## Development Commands

Run commands from this folder:

```bash
rushx build
rushx typecheck
rushx lint
```

This project uses `@kraigwalker/heft-worker-rig`. Vite is provided by the rig/toolchain, not by
this package.

## App Integration

The package builds `dist/service-worker.js`, but the current localhost app also keeps a committed
copy at `apps/kraig-social/public/service-worker.js` for immediate demo registration. Keep the two
implementations aligned when changing the message protocol or cache layout.

## Maintainer Notes

- Do not cache unlock-key responses. The gateway returns them with `Cache-Control: no-store`.
- Keep encrypted and decrypted caches versioned so incompatible payload formats can be invalidated.
- Browser-delivered keys are suitable for timed release UX, not for defending content forever
  against a determined client.
- The registered worker URL and response cache headers determine browser update behavior. A Rush
  package version bump alone does not update installed workers.

## Release Policy

This package participates in the `kraig-social` Rush lock-step version policy with the app and
shared worker. Do not manually edit the package version for releases.
