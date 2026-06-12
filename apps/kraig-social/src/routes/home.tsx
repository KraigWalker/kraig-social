import type { Route } from './+types/home';

export const meta: Route.MetaFunction = () => [
  { title: 'Kraig Social | Next-generation delivery lab' },
  {
    name: 'description',
    content:
      'A localhost-demoable delivery lab for federated modules, timed encrypted content drops, ring releases, and real-time production update signals.',
  },
  { property: 'og:title', content: 'Kraig Social Delivery Lab' },
  {
    property: 'og:description',
    content:
      'Explore gateway-selected modules, encrypted timed drops, ring releases, and live delivery signals.',
  },
];

const capabilities = [
  ['Gateway decisions', 'Ring releases, A/B bucketing, overrides, and developer signals.'],
  ['Encrypted drops', 'Preloaded bundles stay locked until the gateway releases a WebCrypto key.'],
  ['Production refresh', 'Hot-capable modules can be reselected without a full page reload.'],
  ['Public SEO', 'Unlocked public content receives canonical metadata and sitemap coverage.'],
];

export default function Home() {
  return (
    <main className="experience-shell">
      <section className="hero-grid" aria-labelledby="home-heading">
        <div className="hero-copy">
          <p className="system-label">Kraig Social / localhost control plane</p>
          <h1 id="home-heading">A site that behaves like a release system.</h1>
          <p className="hero-lede">
            Kraig Social is now a delivery lab: the shell asks a gateway what to render, the
            ServiceWorker preloads encrypted content before it opens, and live developer signals can
            steer hot-capable modules in real time.
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="/lab">
              Open delivery lab
            </a>
            <a className="secondary-action" href="/admin/content">
              Manage content drops
            </a>
          </div>
        </div>
        <div className="signal-board" aria-label="Delivery system status">
          <div className="signal-row">
            <span>Gateway</span>
            <strong>localhost:3001</strong>
          </div>
          <div className="signal-row">
            <span>Module slot</span>
            <strong>dispatch-panel</strong>
          </div>
          <div className="signal-row">
            <span>Decision modes</span>
            <strong>rings / A-B / flags</strong>
          </div>
          <div className="signal-row">
            <span>Content lock</span>
            <strong>AES-GCM timed key</strong>
          </div>
        </div>
      </section>

      <section className="capability-grid" aria-label="Platform capabilities">
        {capabilities.map(([title, detail]) => (
          <article className="capability-card" key={title}>
            <h2>{title}</h2>
            <p>{detail}</p>
          </article>
        ))}
      </section>

      <section className="content-band" aria-labelledby="public-content-heading">
        <div>
          <p className="system-label">Public content path</p>
          <h2 id="public-content-heading">SSR first, dynamic when it matters.</h2>
        </div>
        <p>
          Public articles remain crawlable React Router pages. Rich interactive surfaces are loaded
          through gateway decisions after hydration, keeping the durable web and the experimental
          delivery layer separate.
        </p>
        <a className="inline-action" href="/articles/encrypted-modules-level-2">
          Read the public field note
        </a>
      </section>
    </main>
  );
}
