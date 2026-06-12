import type { Route } from './+types/sitemap';
import { fetchManifest } from '../gateway';

function xmlEscape(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export async function loader({ request }: Route.LoaderArgs) {
  const origin = new URL(request.url).origin;
  const urls = [`${origin}/`];

  try {
    const manifest = await fetchManifest();
    for (const entry of manifest.entries) {
      if (entry.seo.indexable && entry.status === 'published') {
        urls.push(`${origin}${entry.seo.canonicalPath}`);
      }
    }
  } catch {
    urls.push(`${origin}/articles/encrypted-modules-level-2`);
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${xmlEscape(url)}</loc>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}
