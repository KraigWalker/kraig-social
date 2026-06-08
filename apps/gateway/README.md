## 2. Core terminology

Use these terms consistently in code.

```ts
type ContentId = string; // "posts/running-2026"
type ModuleId = string; // "demo/parkrun-map"
type ReleaseId = string; // "2026-07-pride-drop"
type VariantId = string; // "control" | "variant-a" | "vip"
type RingId = string; // "dev" | "friends" | "public"
type AssetId = string; // content-addressed asset hash or logical id
type ClientId = string; // anonymous stable client id
```

A **content item** is your author-facing unit: article, page, demo, interactive module.

A **module** is the executable JS/CSS/static bundle emitted by the build.

A **release** is a published package of one or more content items/modules.

A **variant** is a concrete implementation that can be selected by rules.

A **drop** is a release with preload/unlock/expiry semantics.
