# CMS Admin App Brainstorm (separate from kraig-social)

Goal: A standalone CMS web app that manages JSX-based posts plus metadata, versioning,
scheduled publishing, encrypted preloads, and client update/cancel signals.

## Core Concepts

- Content stored as JSX files with frontmatter-like metadata (status, publish_at, edition, version, tags, seo, etc)
- Multiple versions per post (draft, scheduled, published, archived), with ability to roll forward/back
- Separate "payload" layer that can be encrypted for preloading
- Manifest system for clients to pull newest content versions and delete/replace cached payloads

## Proposed Architecture

- CMS app (admin UI) hosted separately; auth via SSO or separate admin auth
- Content repository (git-based or object store) for JSX + assets
- Metadata and version registry (DB) to track versions, status, schedule, and relationships
- Build pipeline to render posts to static assets and optional encrypted payload bundles
- Delivery API to serve manifests, encrypted payloads, and decryption keys
- Service worker + client manifest polling to update/preload/cancel content

## Data Model (baseline)

Post:

- id, slug, title, description, author, tags, category
- status: draft | scheduled | published | archived | cancelled
- publish_at, embargo_until, updated_at
- edition (major content version), version (incrementing build)
- Map fields to schema.org BlogPost/BlogPosting (headline, description, datePublished, dateModified, author, image, keywords, articleSection, inLanguage, mainEntityOfPage)

Schema.org BlogPost/BlogPosting mapping (draft):

| Post field | Schema.org property | Notes |
| --- | --- | --- |
| title | headline | required |
| description | description | meta description / excerpt |
| slug | mainEntityOfPage | canonical URL |
| canonical_url | url | absolute URL |
| author | author | Person |
| publish_at | datePublished | ISO 8601 |
| updated_at | dateModified | ISO 8601 |
| tags | keywords | array or comma string |
| category | articleSection | primary category |
| language | inLanguage | BCP47 |
| hero_image | image | absolute URL |
| body | articleBody | rendered HTML |
| reading_time | timeRequired | ISO 8601 duration |
| word_count | wordCount | integer |
| site_name | isPartOf | Blog |
| publisher | publisher | Organization |

PostVersion:
- post_id, version, edition, status, created_at
- source_ref (git SHA or object ID), rendered_asset_id
- payload_hash, encrypted_payload_hash, encryption_key_id (optional)

Manifest:
- manifest_version, generated_at
- entries: post_id, version, edition, status, payload_hash, encrypted_payload_hash, action
- action: add | update | remove | rollback | invalidate

KeyRelease:
- key_id, post_id, version, unlock_at, endpoint, ttl, client_retry_after

## Data Model Spec (self-hosted + Cloudflare cache)

Assumptions:
- PostgreSQL for metadata and version registry (Drizzle ORM)
- Self-hosted S3-compatible object store (MinIO) for assets and payloads
- Cloudflare in front for caching; assets/manifests emit cache tags derived from post and version

Tables (baseline, extend as needed):

posts
- id (uuid, pk)
- slug (unique, lowercase), title, description
- status (enum), edition (int), current_version_id (fk)
- author_id (fk), category, tags (text[])
- language (bcp47), canonical_url
- hero_image_asset_id (fk), og_image_asset_id (fk)
- publish_at, embargo_until, created_at, updated_at
- cancelled_at, archived_at

post_versions
- id (uuid, pk), post_id (fk)
- version (int, incrementing), status (enum)
- source_ref (git sha or object id), content_hash (sha256)
- rendered_asset_id (fk), encrypted_payload_asset_id (fk)
- changelog, created_at, published_at
- previous_version_id (fk, optional)

assets
- id (uuid, pk), kind (rendered|encrypted|image|attachment)
- storage_key (object store path), content_type, size_bytes
- sha256, etag, cache_tag (for Cloudflare purge)
- created_at

manifests
- id (uuid, pk), manifest_version (int), generated_at
- etag, cache_tag
- diff_base_version (int, optional)

manifest_entries
- id (uuid, pk), manifest_id (fk)
- post_id (fk), post_version_id (fk)
- action (add|update|remove|rollback|invalidate)
- payload_asset_id (fk), encrypted_payload_asset_id (fk)
- payload_hash, encrypted_payload_hash
- effective_at (timestamp), remove_after (timestamp, optional)

key_releases
- id (uuid, pk), post_version_id (fk)
- key_id (uuid), key_blob_encrypted (bytes)
- unlock_at, ttl_seconds
- endpoint_path, retry_after_seconds
- created_at, revoked_at

audit_logs
- id (uuid, pk), actor_id (fk)
- action (publish|rollback|cancel|key_access|manifest_generate)
- post_id (fk), post_version_id (fk), asset_id (fk, optional)
- details_json (jsonb), created_at

post_slug_history
- id (uuid, pk), post_id (fk)
- old_slug, new_slug, changed_at

users
- id (uuid, pk), email, display_name
- role (author|editor|publisher|admin)

Versioning rules (draft):
- version increments on every build/render for a post
- edition increments on major editorial changes or public version bumps
- current_version_id points to the live version; scheduled versions use publish_at
- rollback updates current_version_id to an older version and emits a manifest rollback action
- cancel sets status=cancelled and emits invalidate/remove actions for cached payloads
- cache_tag should be stable per post/version, e.g. post:{id} and post:{id}:v{version}, for Cloudflare purges

## Editorial Workflow

- Create/edit JSX in repo or in-app editor (with live preview)
- CMS stores metadata, maps to content source
- Approval gates: draft -> review -> scheduled -> published
- Rollback: choose older version and mark as current; update manifest with rollback action
- Cancel post: mark cancelled and emit invalidate/remove action

## Publishing + Versioning

- Build posts into static assets; generate payload bundle per version
- Maintain immutable payloads per version; maintain "current" pointer for each post
- Edition bumps allow semantic grouping (v1, v2) while version increments track builds
- Post data includes canonical URL and optional redirects for retired versions

## Encrypted Preload Flow

- Generate encrypted payload bundle with key stored server-side
- Service worker preloads encrypted payload for scheduled posts
- Key release endpoint enforces unlock_at; returns retry_after when too early
- Optional push notification just before unlock to improve deliverability
- Client decrypts and caches decrypted content after unlock
- Server can invalidate/replace any payload via manifest updates

## Client Update/Cancel Signaling

- Client polls manifest on interval or receives push hints
- Manifest entry action dictates:
  - add/update: fetch payload
  - rollback: replace with older version
  - invalidate/remove: delete cached payload and derived content
- Optional diff responses keyed by ETag to reduce payload size

## CMS Admin UI Requirements

- Post list with filters (status, scheduled, edition)
- Version history with compare, rollback, and publish controls
- Scheduling UI with time zone handling and preview
- Preload status dashboard (preloaded/decrypted counts, errors)
- Manifest and key-release audit logs
- Preview links (draft and scheduled)

## SEO + Editorial Best Practices

- Structured data (JSON-LD), open graph, and canonical URL fields
- Sitemaps split by published status with lastmod
- 301 redirects when rolling forward/back to avoid SEO loss
- Slug history to avoid broken links
- Content linting (word count, readability, meta description length)

## Questions / Clarifications

- Where do JSX files live: git repo, CMS storage, or both?
- Should edits be done in CMS UI or directly in repo?
- Does "edition" map to a public version or internal release cycle?
- How strict should access control be (roles: author, editor, publisher)?
- Preferred delivery stack for manifests/keys (same domain as public site or separate)?

## Agent Task Breakdown

- Requirements: confirm JSX source of truth (repo vs CMS store) and expected author flow
- Requirements: confirm whether edits happen in CMS UI, local repo, or both
- Requirements: define roles, permissions, and approval gates for publish and rollback
- Requirements: define "edition" meaning and versioning rules visible to readers
- Requirements: confirm delivery domains for manifests, payloads, and keys
- Data model: enumerate core entities (post, version, manifest entry, key release, audit log)
- Data model: define version identity scheme and relationships to edition and status
- Data model: define post status transitions and allowed actions per status
- Data model: define manifest entry actions and required fields per action
- Data model: define audit log schema for publish, rollback, cancel, and key access
- Data model: map post fields to schema.org BlogPost/BlogPosting properties
- Storage: evaluate git-backed content vs object store for JSX source
- Storage: decide where rendered assets and encrypted payloads live
- Storage: define naming and versioning conventions for assets and payloads
- API: list admin CRUD endpoints for posts and versions
- API: define manifest endpoint shape and caching headers
- API: define encrypted payload endpoint and cache behavior
- API: define key-release endpoint, unlock rules, and retry-after responses
- API: define preview endpoints for draft and scheduled content
- Manifest: define diffing strategy (ETag or version cursor) and response format
- Manifest: define rollback semantics and client behavior expectations
- Manifest: define invalidate/remove semantics for cancelled content
- Encryption: choose encryption algorithm and key format
- Encryption: define key storage and rotation strategy
- Encryption: define unlock policy and server time handling
- Encryption: define client retry/backoff and error handling
- Service worker: design cache layout for encrypted and decrypted payloads
- Service worker: define preload schedule and background sync usage
- Service worker: define update and invalidation flow from manifest
- Service worker: define rollback handling and content replacement rules
- Pipeline: define JSX render pipeline inputs and outputs
- Pipeline: define encrypted bundle generation steps and triggers
- Pipeline: define manifest generation timing and publish hooks
- Editorial: define authoring workflow and review checklist
- Editorial: define schedule UI behavior with time zone handling
- Editorial: define rollback and cancel steps and side effects
- UI IA: map main screens and navigation (list, editor, preview, history)
- UI IA: define version compare and diff UX expectations
- UI IA: define preload dashboard metrics and filters
- UI IA: define audit log views and export requirements
- SEO: define canonical URL rules and redirect strategy
- SEO: define sitemap generation rules and update cadence
- SEO: define JSON-LD/OG fields and validation rules
- Observability: define metrics for preload, decrypt, update, and failures
- Observability: define logging for key access attempts and retries
- Security: define auth mechanism for CMS and API
- Security: define access control checks per endpoint and action
- Security: define secrets handling and environment variable requirements
- Testing: define unit tests for manifest generation and key release
- Testing: define integration tests for service worker update flow
- Testing: define E2E tests for scheduling, publish, rollback, cancel
