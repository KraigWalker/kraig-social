import type { Route } from './+types/article';
import { fetchManifest, type ManifestEntry } from '../gateway';

const fallbackArticle: ManifestEntry = {
  id: 'fallback',
  contentId: 'posts/encrypted-modules-level-2',
  releaseId: 'repo-dispatch-article-2026-06',
  variantId: 'control',
  status: 'published',
  route: '/articles/encrypted-modules-level-2',
  action: 'add',
  title: 'Encrypted Modules: Level 2',
  description: 'A field note on gateway-selected modules, timed unlocks, and safe live delivery.',
  body:
    'Kraig Social keeps public content crawlable while progressively loading gateway-selected modules for interactive readers.',
  seo: {
    indexable: true,
    title: 'Encrypted Modules: Level 2 | Kraig Social',
    description: 'A field note on gateway-selected modules, timed unlocks, and safe live delivery.',
    canonicalPath: '/articles/encrypted-modules-level-2',
  },
};

export async function loader({ params }: Route.LoaderArgs) {
  try {
    const manifest = await fetchManifest();
    const article = manifest.entries.find((entry) => entry.route === `/articles/${params.slug}`);
    return { article: article ?? fallbackArticle };
  } catch {
    return { article: fallbackArticle };
  }
}

export const meta: Route.MetaFunction = ({ data }) => {
  const article = data?.article ?? fallbackArticle;
  return [
    { title: article.seo.title },
    { name: 'description', content: article.seo.description },
    { property: 'og:title', content: article.seo.title },
    { property: 'og:description', content: article.seo.description },
    { tagName: 'link', rel: 'canonical', href: article.seo.canonicalPath },
  ];
};

export default function Article({ loaderData }: Route.ComponentProps) {
  const { article } = loaderData;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.description,
    datePublished: article.seo.lastmod,
    dateModified: article.seo.lastmod,
    mainEntityOfPage: article.seo.canonicalPath,
  };

  return (
    <main className="experience-shell compact readable">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="article-shell">
        <p className="system-label">Public article</p>
        <h1>{article.title}</h1>
        <p className="hero-lede">{article.description}</p>
        <div className="article-body">
          <p>{article.body}</p>
          <p>
            The durable HTML path stays indexable. The richer client path asks the gateway for
            variants and can safely fall back if a remote module is unavailable.
          </p>
        </div>
        <a className="inline-action" href="/lab">
          Inspect the live decision path
        </a>
      </article>
    </main>
  );
}
