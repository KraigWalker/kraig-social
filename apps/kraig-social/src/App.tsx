import './App.css'

const trainingUpdates = [
  {
    title: 'Cohort lab: building habits',
    detail: 'Sprint through a live debugging session with guided practice prompts and take-home drills.',
  },
  {
    title: 'Office hours & AMA',
    detail: 'Personalized prep for shipping day — bring blockers, get unblocked, stay on pace.',
  },
  {
    title: 'Trainer notes',
    detail: 'Rewriting modules to feel like a workbook, not a slide deck. Expect checklists and margin notes.',
  },
]

const blueskyMoments = [
  { time: '2h ago', text: 'Shaping a lo-fi UI that feels like a favorite notebook. Leaving room for scribbles.' },
  { time: '5h ago', text: 'Training rewrite: more reps, fewer slides. Every concept gets a practical drill.' },
  { time: 'Yesterday', text: 'Testing a “front page” layout for the site — bold header, quick reads, no clutter.' },
]

const codeIdeas = [
  { title: 'AI workshop kit', note: 'Reusable facilitation cards, timers, and scoring blocks for live cohorts.' },
  { title: 'Social home revamp', note: 'Notebook-inspired shell with quick links to articles, code, and training.' },
  { title: 'Playbook snippets', note: 'Tiny experiments in ergonomics — keyboard-first flows and high-contrast states.' },
]

function App() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <div className="page">
        <div className="notebook-frame">
          <header className="app-header">
            <div className="brand-block">
              <div className="brand-mark" aria-hidden="true">
                KW
              </div>
              <div className="title-stack">
                <p className="eyebrow">Reading | Making | Training</p>
                <h1>Kraig Walker</h1>
                <p className="subline">Articles, code experiments, and cohort updates</p>
              </div>
            </div>

            <nav aria-label="Primary">
              <ul className="nav-list">
                <li>
                  <a href="#articles">Articles</a>
                </li>
                <li>
                  <a href="#code">Code</a>
                </li>
                <li>
                  <a href="/training">Training</a>
                </li>
                <li>
                  <a href="#bluesky">Bluesky</a>
                </li>
              </ul>
            </nav>
          </header>

          <main id="main-content" className="content">
            <div className="content-grid">
              <section id="articles" className="panel lead-story" aria-labelledby="front-page-heading">
                <span className="panel-label">Front page</span>
                <p className="section-kicker">Feature</p>
                <h2 id="front-page-heading">Design training that feels like practice, not theory.</h2>
                <p className="lede">
                  Notes from building a learning path that behaves like a workbook: guided reps, margin scribbles,
                  and moments to ship what you just learned.
                </p>
                <p className="meta">Updated this week · 6 minute read</p>
                <a className="story-link" href="#articles">
                  Read the article draft
                </a>
              </section>

              <div className="sidebar">
                <section id="training" className="panel" aria-labelledby="training-heading">
                  <span className="panel-label">Training log</span>
                  <h3 id="training-heading">Live sessions in motion</h3>
                  <ul className="stacked-list">
                    {trainingUpdates.map((item) => (
                      <li key={item.title}>
                        <p className="list-title">{item.title}</p>
                        <p className="list-detail">{item.detail}</p>
                      </li>
                    ))}
                  </ul>
                  <a className="inline-link" href="/training">
                    See the training plan
                  </a>
                </section>

                <section id="bluesky" className="panel" aria-labelledby="bluesky-heading">
                  <span className="panel-label">Bluesky status</span>
                  <h3 id="bluesky-heading">Latest signal</h3>
                  <div className="status-stack">
                    {blueskyMoments.map((moment) => (
                      <article key={moment.time} className="status-card">
                        <p className="status-time">{moment.time}</p>
                        <p className="status-text">{moment.text}</p>
                      </article>
                    ))}
                  </div>
                  <a className="inline-link" href="#bluesky">
                    Follow the thread
                  </a>
                </section>
              </div>
            </div>

            <section id="code" className="panel code-panel" aria-labelledby="code-heading">
              <span className="panel-label">Code lab</span>
              <div className="code-grid">
                <div>
                  <h3 id="code-heading">Building right now</h3>
                  <p className="lede lede-small">
                    A notebook of experiments — clean ergonomics, accessible shortcuts, and playful UI tests.
                  </p>
                </div>
                <ul className="code-list">
                  {codeIdeas.map((idea) => (
                    <li key={idea.title}>
                      <p className="list-title">{idea.title}</p>
                      <p className="list-detail">{idea.note}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </main>

          <footer className="app-footer">
            <p>Off-white paper, bold red lines — a digital workbook for the things I&apos;m making.</p>
            <p className="footer-note">Accessible, responsive, and ready for desktop, mobile, or TV.</p>
            <nav aria-label="Footer">
              <ul className="footer-links">
                <li>
                  <a href="/privacy">Privacy Notice</a>
                </li>
                <li>
                  <a href="/cookies">Cookies &amp; Tracking</a>
                </li>
                <li>
                  <a href="/accessibility">Accessibility Statement</a>
                </li>
                <li>
                  <a href="/service-worker-policy">Service Worker Policy</a>
                </li>
                <li>
                  <a href="/terms">Terms of Use</a>
                </li>
                <li>
                  <a href="/contact">Contact</a>
                </li>
                <li>
                  <a href="/status">Status Page</a>
                </li>
              </ul>
            </nav>
          </footer>
        </div>
      </div>
    </>
  )
}

export default App
