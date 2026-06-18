import type {
  DeliveryManifest,
  FederatedRemoteReference,
  ManifestEntry,
  RingId,
} from '@kraigwalker/kraig-social-content-sdk';
import { createHash, randomBytes, webcrypto } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

interface StoredKey {
  keyId: string;
  releaseId: string;
  contentId: string;
  variantId: string;
  key: string;
  unlockAt: string;
  revoked?: boolean;
}

interface AdminRecord {
  id: string;
  title: string;
  description: string;
  body: string;
  route: string;
  releaseId: string;
  variantId: string;
  unlockAt: string;
  expiresAt?: string;
  status: ManifestEntry['status'];
  override?: boolean;
  lastmod: string;
}

const dataRoot = path.resolve(process.cwd(), '.kraig-social-data');
const mfRoot = path.resolve(process.cwd(), 'dist/mf');
const contentRoot = path.join(mfRoot, 'content');
const payloadRoot = path.join(contentRoot, 'payloads');
const adminPath = path.join(dataRoot, 'admin-content.json');
const keysPath = path.join(dataRoot, 'keys.json');

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '');
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return new Uint8Array(Buffer.from(padded, 'base64'));
}

function sha256(value: Uint8Array | string): string {
  return createHash('sha256').update(value).digest('hex');
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(filePath, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function encryptPayload(params: {
  releaseId: string;
  contentId: string;
  variantId: string;
  payload: unknown;
  unlockAt: string;
}): Promise<{
  encryptedPayloadUrl: string;
  key: StoredKey;
  iv: string;
  keyId: string;
  sha256: string;
}> {
  await mkdir(payloadRoot, { recursive: true });

  const keyBytes = randomBytes(32);
  const ivBytes = randomBytes(12);
  const key = await webcrypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt']);
  const clearBytes = encoder.encode(JSON.stringify(params.payload));
  const encrypted = new Uint8Array(
    await webcrypto.subtle.encrypt({ name: 'AES-GCM', iv: ivBytes }, key, clearBytes)
  );

  const keyId = `${params.releaseId}:${params.variantId}`;
  const fileName = `${params.releaseId}-${params.variantId}.bundle`;
  await writeFile(path.join(payloadRoot, fileName), encrypted);

  return {
    encryptedPayloadUrl: `/mf/content/payloads/${fileName}`,
    key: {
      keyId,
      releaseId: params.releaseId,
      contentId: params.contentId,
      variantId: params.variantId,
      key: toBase64Url(keyBytes),
      unlockAt: params.unlockAt,
    },
    iv: toBase64Url(ivBytes),
    keyId,
    sha256: sha256(encrypted),
  };
}

function publicEntries(now: Date): ManifestEntry[] {
  const publishedAt = new Date(now.getTime() - 1000 * 60 * 60).toISOString();
  return [
    {
      id: 'repo-dispatch-article:v1',
      contentId: 'posts/encrypted-modules-level-2',
      releaseId: 'repo-dispatch-article-2026-06',
      variantId: 'control',
      status: 'published',
      route: '/articles/encrypted-modules-level-2',
      payloadUrl: '/mf/content/repo-dispatch-article.json',
      action: 'add',
      title: 'Encrypted Modules: Level 2',
      description:
        'A field note on gateway-selected modules, timed unlocks, and safe live delivery.',
      body:
        'This public article is rendered by the shell for crawlers, while the gateway coordinates richer module decisions for interactive readers.',
      seo: {
        indexable: true,
        title: 'Encrypted Modules: Level 2 | Kraig Social',
        description:
          'A field note on gateway-selected modules, timed unlocks, and safe live delivery.',
        canonicalPath: '/articles/encrypted-modules-level-2',
        lastmod: publishedAt,
      },
    },
  ];
}

function adminToManifestEntry(record: AdminRecord): ManifestEntry {
  const now = new Date();
  const effectiveStatus =
    record.status === 'scheduled' && new Date(record.unlockAt) <= now ? 'published' : record.status;
  const slug = record.route.split('/').filter(Boolean).at(-1) ?? record.id;
  const encryptedPayloadUrl = `/mf/content/payloads/${record.releaseId}-${record.variantId}.bundle`;

  return {
    id: `${record.id}:${record.releaseId}:${record.variantId}`,
    contentId: record.id,
    releaseId: record.releaseId,
    variantId: record.variantId,
    status: effectiveStatus,
    route: record.route,
    encryptedPayloadUrl,
    unlockAt: record.unlockAt,
    expiresAt: record.expiresAt,
    action: effectiveStatus === 'expired' || effectiveStatus === 'revoked' ? 'expire' : 'add',
    title: record.title,
    description: record.description,
    encrypted: {
      algorithm: 'AES-GCM',
      iv: '',
      keyId: `${record.releaseId}:${record.variantId}`,
      ciphertextUrl: encryptedPayloadUrl,
      sha256: '',
    },
    seo: {
      indexable: effectiveStatus === 'published',
      title: `${record.title} | Kraig Social`,
      description: record.description,
      canonicalPath: `/drops/${slug}`,
      lastmod: record.lastmod,
    },
    body: effectiveStatus === 'published' ? record.body : undefined,
  };
}

async function hydrateEncryptedMetadata(entry: ManifestEntry): Promise<ManifestEntry> {
  if (!entry.encrypted) {
    return entry;
  }

  const metaPath = path.join(payloadRoot, `${entry.releaseId}-${entry.variantId}.meta.json`);
  const metadata = await readJsonFile<{ iv: string; sha256: string } | null>(metaPath, null);
  if (!metadata) {
    return entry;
  }

  return {
    ...entry,
    encrypted: {
      ...entry.encrypted,
      iv: metadata.iv,
      sha256: metadata.sha256,
    },
  };
}

export async function ensureLocalDemoData(): Promise<void> {
  await mkdir(dataRoot, { recursive: true });
  await mkdir(payloadRoot, { recursive: true });
  await mkdir(path.join(mfRoot, 'assets'), { recursive: true });
  await mkdir(path.join(mfRoot, 'releases'), { recursive: true });

  const existingAdmin = await readJsonFile<AdminRecord[] | null>(adminPath, null);
  const existingKeys = await readJsonFile<StoredKey[] | null>(keysPath, null);
  if (existingAdmin && existingKeys) {
    return;
  }

  const unlockAt = new Date(Date.now() + 1000 * 45).toISOString();
  const record: AdminRecord = {
    id: 'drops/temporal-dispatch',
    title: 'Temporal Dispatch',
    description: 'A locked content bundle that preloads now and opens on schedule.',
    body:
      'The bundle was already waiting in the ServiceWorker cache. The gateway released the key only after the unlock time arrived.',
    route: '/drops/temporal-dispatch',
    releaseId: 'temporal-dispatch-local',
    variantId: 'control',
    unlockAt,
    status: 'scheduled',
    lastmod: new Date().toISOString(),
  };

  const encrypted = await encryptPayload({
    releaseId: record.releaseId,
    contentId: record.id,
    variantId: record.variantId,
    unlockAt: record.unlockAt,
    payload: {
      title: record.title,
      description: record.description,
      body: record.body,
      route: record.route,
    },
  });

  await writeJsonFile(path.join(payloadRoot, `${record.releaseId}-${record.variantId}.meta.json`), {
    iv: encrypted.iv,
    sha256: encrypted.sha256,
  });
  await writeJsonFile(adminPath, [record]);
  await writeJsonFile(keysPath, [encrypted.key]);
}

function remoteReference(version: string): FederatedRemoteReference {
  const name = `dispatch_panel_${version.replaceAll('.', '_')}`;
  return {
    name,
    version,
    expose: './DispatchPanel',
    mountExpose: './mount',
    browserManifestUrl: `/mf/releases/${version}/browser/mf-manifest.json`,
    serverManifestUrl: `/mf/releases/${version}/server/mf-manifest.json`,
  };
}

export async function getLatestActiveModule(
  moduleId: string,
  ring: RingId
): Promise<FederatedRemoteReference> {
  if (moduleId !== 'dispatch-panel') {
    throw new Error(`Unknown federated module: ${moduleId}`);
  }
  const preferred = ring === 'public' ? '1.0.0' : '1.1.0';
  return remoteReference(preferred);
}

export async function getDeliveryManifest(): Promise<DeliveryManifest> {
  await ensureLocalDemoData();
  const now = new Date();
  const adminRecords = await readJsonFile<AdminRecord[]>(adminPath, []);
  const entries = await Promise.all(
    [...publicEntries(now), ...adminRecords.map(adminToManifestEntry)].map(hydrateEncryptedMetadata)
  );

  return {
    manifestVersion: 1,
    generatedAt: now.toISOString(),
    entries,
  };
}

export async function listAdminContent(): Promise<AdminRecord[]> {
  await ensureLocalDemoData();
  return readJsonFile<AdminRecord[]>(adminPath, []);
}

export async function createAdminContent(input: {
  title?: string;
  description?: string;
  body?: string;
  unlockAt?: string;
}): Promise<AdminRecord> {
  await ensureLocalDemoData();
  const now = new Date();
  const slug = (input.title ?? 'Local Content Drop')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-|-$/gu, '');
  const releaseId = `${slug || 'local-drop'}-${now.getTime()}`;
  const record: AdminRecord = {
    id: `drops/${slug || 'local-drop'}`,
    title: input.title ?? 'Local Content Drop',
    description: input.description ?? 'A locally authored encrypted timed content bundle.',
    body:
      input.body ??
      'This content was generated from the local CMS-like dashboard and decrypted in the client.',
    route: `/drops/${slug || 'local-drop'}`,
    releaseId,
    variantId: 'control',
    unlockAt: input.unlockAt ?? new Date(now.getTime() + 1000 * 30).toISOString(),
    status: 'scheduled',
    override: true,
    lastmod: now.toISOString(),
  };
  const encrypted = await encryptPayload({
    releaseId: record.releaseId,
    contentId: record.id,
    variantId: record.variantId,
    unlockAt: record.unlockAt,
    payload: {
      title: record.title,
      description: record.description,
      body: record.body,
      route: record.route,
    },
  });
  const records = await readJsonFile<AdminRecord[]>(adminPath, []);
  const keys = await readJsonFile<StoredKey[]>(keysPath, []);
  await writeJsonFile(path.join(payloadRoot, `${record.releaseId}-${record.variantId}.meta.json`), {
    iv: encrypted.iv,
    sha256: encrypted.sha256,
  });
  await writeJsonFile(adminPath, [...records, record]);
  await writeJsonFile(keysPath, [...keys, encrypted.key]);
  return record;
}

export async function expireAdminContent(contentId: string): Promise<AdminRecord | undefined> {
  const records = await readJsonFile<AdminRecord[]>(adminPath, []);
  const next = records.map((record) =>
    record.id === contentId
      ? { ...record, status: 'expired' as const, lastmod: new Date().toISOString() }
      : record
  );
  await writeJsonFile(adminPath, next);
  return next.find((record) => record.id === contentId);
}

export async function findStoredKey(params: {
  releaseId: string;
  contentId: string;
  variantId: string;
}): Promise<StoredKey | undefined> {
  await ensureLocalDemoData();
  const keys = await readJsonFile<StoredKey[]>(keysPath, []);
  return keys.find(
    (key) =>
      key.releaseId === params.releaseId &&
      key.contentId === params.contentId &&
      key.variantId === params.variantId
  );
}

export { fromBase64Url, toBase64Url };
