import { defineContent } from "@kraigwalker/kraig-social-content-sdk";

export default defineContent({
  id: "posts/encrypted-modules-level-2",
  title: "Encrypted Modules: Level 2",
  description: "A field note on gateway-selected modules, timed unlocks, and safe live delivery.",
  kind: "article",
  route: "/articles/encrypted-modules-level-2",
  release: {
    releaseId: "repo-dispatch-article-2026-06",
    ring: "public",
  },
  delivery: {
    preload: false,
    encrypted: false,
  },
  variants: [
    {
      id: "control",
      entry: "/articles/encrypted-modules-level-2",
      rings: ["public", "friends", "dev"],
    },
  ],
  seo: {
    indexable: true,
    title: "Encrypted Modules: Level 2 | Kraig Social",
    description: "A field note on gateway-selected modules, timed unlocks, and safe live delivery.",
    canonicalPath: "/articles/encrypted-modules-level-2",
  },
  body: "This article is the repo-authored baseline content used by the delivery manifest.",
});
