import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('lab', 'routes/lab.tsx'),
  route('articles/:slug', 'routes/article.tsx'),
  route('drops/:slug', 'routes/drop.tsx'),
  route('admin/content', 'routes/admin-content.tsx'),
  route('sitemap.xml', 'routes/sitemap.ts'),
  route('health', 'routes/health.ts'),
] satisfies RouteConfig;
