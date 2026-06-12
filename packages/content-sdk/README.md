# Kraig Social Content SDK

Shared TypeScript contracts and Zod schemas for Kraig Social content delivery.

## What This Package Owns

- Content authoring config shape used by repo-authored content.
- Public delivery manifest contracts.
- Module registry entry contracts.
- Decision request and response contracts.
- Timed encrypted bundle metadata.
- Unlock request and response contracts.
- Developer signal contracts.

The package is intentionally small and schema-first. Runtime services should validate external
payloads with these schemas before making delivery decisions.

## Public API

Import from the package root:

```ts
import {
  defineContent,
  contentConfigSchema,
  decisionRequestSchema,
  deliveryManifestSchema,
  unlockResponseSchema,
} from '@kraigwalker/kraig-social-content-sdk';
```

Use `defineContent` for repo-authored content configs:

```ts
import { defineContent } from '@kraigwalker/kraig-social-content-sdk';

export default defineContent({
  id: 'posts/example',
  title: 'Example',
  description: 'A public example article.',
  kind: 'article',
  route: '/articles/example',
  release: {
    releaseId: 'example-2026-06',
    ring: 'public',
  },
  delivery: {
    preload: false,
    encrypted: false,
  },
  variants: [
    {
      id: 'control',
      entry: '/articles/example',
      rings: ['public', 'friends', 'dev'],
    },
  ],
  seo: {
    indexable: true,
    title: 'Example | Kraig Social',
    description: 'A public example article.',
    canonicalPath: '/articles/example',
  },
});
```

## Development Commands

Run commands from this folder:

```bash
rushx build
rushx typecheck
rushx lint
```

The package uses `@kraigwalker/heft-vite-library-rig`. Vite is provided by the rig/toolchain, not
by this project.

## Maintainer Notes

- Keep shared wire shapes backward-compatible when possible. App, gateway, and worker code all
  depend on these contracts.
- Prefer adding schema fields with defaults before making fields required.
- Use `.js` extensions in relative exports so NodeNext consumers can resolve emitted ESM.
- The Vite config exports a plain object so this package does not need a direct `vite` dependency.
