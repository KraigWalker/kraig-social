import type { InferSelectModel } from "drizzle-orm";
import type { posts, postVersions } from "./schema.js";

type PostRecord = InferSelectModel<typeof posts>;
type PostVersionRecord = InferSelectModel<typeof postVersions>;

export function buildBlogPosting(
  post: PostRecord,
  version?: PostVersionRecord | null,
  authorName?: string | null,
) {
  const siteName = process.env.CMS_SITE_NAME ?? "kraig.social";
  const siteUrl = process.env.CMS_SITE_URL ?? post.canonicalUrl ?? undefined;
  const canonicalUrl = post.canonicalUrl ?? undefined;
  const assetBaseUrl = process.env.CMS_ASSET_BASE_URL;
  const heroImageUrl =
    assetBaseUrl && post.heroImageAssetId
      ? `${assetBaseUrl.replace(/\/$/, "")}/assets/${post.heroImageAssetId}`
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description ?? undefined,
    datePublished: post.publishAt?.toISOString(),
    dateModified: post.updatedAt?.toISOString(),
    author:
      authorName || post.authorId
        ? {
            "@type": "Person",
            name: authorName ?? post.authorId,
          }
        : undefined,
    image: heroImageUrl,
    keywords: post.tags ?? undefined,
    articleSection: post.category ?? undefined,
    inLanguage: post.language ?? undefined,
    mainEntityOfPage: canonicalUrl
      ? {
          "@type": "WebPage",
          "@id": canonicalUrl,
        }
      : undefined,
    url: canonicalUrl,
    isPartOf: siteUrl
      ? {
          "@type": "Blog",
          name: siteName,
          url: siteUrl,
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: siteName,
    },
    version: version?.version ?? undefined,
  };
}
