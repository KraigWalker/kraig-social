# PLAN.md

This is the living plan for **kraig.social**.

It’s intentionally lightweight: it documents _direction_, not a strict backlog. The site can evolve through small, meaningful increments.

---

## North Star

Build a personal site that:

- feels authored (not “template-personal-brand”)
- supports multiple modes (professional, playful, personal, experimental)
- stays fast and stable (SSR-first, client JS only when it pays)
- can grow over time without needing a redesign every month

---

## Current architecture (baseline)

- Rush monorepo
- `kraig-social` SSR Node.js app
- React Router 7 (framework mode) for SSR
- Deployed live via docker-compose using Dokploy

Assumptions to validate/record:

- runtime node version
- where env vars live (.env / Dokploy secrets)
- any reverse proxy details (Traefik/Nginx/CF)
- caching/CDN behavior

---

## Design principles

### Queer web instincts (practical)

- **Thresholds not funnels:** multiple entry points, no “one true CTA”.
- **Fragments over case-studies:** show work as evolving pieces, not perfect narratives.
- **Time-aware:** “currently forming”, “recently”, “archived”, “returning soon”.
- **Soft navigation:** association and wandering are valid.
- **Progressive enhancement:** the site should work without heroic client JS.

### Product principles

- Ship in small slices.
- Prefer durable web primitives and boring tech.
- Resist complexity until it unlocks something real.

---

## Workstreams

### 1) Foundation (now / always)

Goal: stability, speed, confidence.

- [ ] Confirm/document local dev commands (Rush + app scripts)
- [ ] Add `.env.example` and document required vars
- [ ] Basic health checks / smoke test script
- [ ] Observability baseline (logs, error handling, optional tracing)

Definition of done:

- a new contributor can run the site locally in <10 minutes
- deploy remains predictable

---

### 2) Homepage as a threshold

Goal: a homepage that is honest, minimal, and allows multiple entry modes.

Candidate structure:

- A single paragraph that frames the site as “forming”
- 3–5 entry points (Work / Running / Notes / Experiments / Elsewhere)
- “Recently” strip: latest change, latest note, latest project fragment
- Soft footer navigation

- [ ] Replace placeholder with threshold copy + entry points
- [ ] Add “status language” (forming / open / archived) used site-wide
- [ ] Add a small “recently updated” section (even if manual at first)

Definition of done:

- homepage feels intentional without requiring lots of content

---

### 3) Portfolio as fragments

Goal: reduce maintenance burden and avoid forced narratives.

- [ ] Create a simple “fragment” content type (MD/MDX/JSON—whatever fits)
- [ ] Render fragments as cards with:
  - title
  - one-line “what it is”
  - one “truth” (lesson / constraint / what changed)
  - status badge
- [ ] Optional: “related fragments” via tags

Definition of done:

- adding a new portfolio item is quick, consistent, and doesn’t require a full case study

---

### 4) Notes (writing without pressure)

Goal: publish thoughts without building a full CMS.

- [ ] Notes index page
- [ ] Single note page template
- [ ] “This may change” footer microcopy
- [ ] RSS feed (optional but nice)
- [ ] Minimal taxonomy (tags, moods, or themes)

Definition of done:

- you can post short notes quickly and they look good

---

### 5) Experiments / Lab

Goal: a contained area for playful prototypes (DOM crystal, delivery experiments, etc.) without destabilizing the main site.

- [ ] `/lab` index
- [ ] Each experiment has:
  - what it is
  - constraints
  - link to demo
  - link to code
- [ ] Guard rails:
  - experiments don’t leak heavy JS onto core pages
  - experiments can be archived cleanly

Definition of done:

- the site can be weird in one place while staying solid elsewhere

---

### 6) Performance & delivery

Goal: keep SSR fast and client payload small.

- [ ] Establish baseline metrics (TTFB, LCP, bundle sizes)
- [ ] Audit client bundle: why is it included and how big is it?
- [ ] Prefer partial hydration / islands only where needed
- [ ] Ensure caching headers are intentional (HTML vs assets)

Definition of done:

- performance regressions are visible and avoidable

---

## Release approach

- Small releases frequently.
- Each change includes a manual test checklist.
- Avoid “big bang” redesigns.

Suggested release cadence:

- weekly tiny improvements (copy, layout, a fragment)
- monthly “capability” (notes, lab index, RSS, etc.)

---

## Backlog seed ideas (optional)

- A “Now” page (current focus, training block, interests)
- A “Uses” page (tools, setup, favs)
- A “Colophon” (how the site is made; tech + principles)
- A subtle “mode toggle” (professional / personal / quiet)
- Time-locked content (if it supports the vibe, not as complexity theatre)

---

## Decisions log (add as you go)

Keep short notes on decisions that affect future work:

- Why SSR choices were made
- Why certain dependencies were added
- Deployment trade-offs (Dokploy/Compose constraints)
- Caching strategy

---

## Next 3 small steps

1. Replace homepage placeholder with threshold microcopy + 3–5 entry points.
2. Add “status language” badge system used by fragments and notes.
3. Create one portfolio fragment and one note to validate the templates.

(These are deliberately tiny: ship them without needing a redesign.)
