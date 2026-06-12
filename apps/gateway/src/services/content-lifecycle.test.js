import { describe, expect, it } from 'vitest';
import { createAdminContent, getDeliveryManifest } from './local-data.ts';
import { unlockRelease } from './unlock-service.ts';

describe('local content lifecycle', () => {
  it('adds CMS-created encrypted drops to the delivery manifest', async () => {
    const record = await createAdminContent({
      title: `Manifest Test ${Date.now()}`,
      description: 'A test encrypted drop.',
      body: 'Encrypted test payload.',
      unlockAt: new Date(Date.now() + 60_000).toISOString(),
    });

    const manifest = await getDeliveryManifest();
    const entry = manifest.entries.find((item) => item.releaseId === record.releaseId);

    expect(entry).toBeDefined();
    expect(entry?.encrypted?.algorithm).toBe('AES-GCM');
    expect(entry?.encryptedPayloadUrl).toContain(record.releaseId);
    expect(entry?.seo.indexable).toBe(false);
  });

  it('blocks unlock requests until the scheduled unlock time', async () => {
    const record = await createAdminContent({
      title: `Locked Test ${Date.now()}`,
      unlockAt: new Date(Date.now() + 60_000).toISOString(),
    });

    const result = await unlockRelease({
      releaseId: record.releaseId,
      contentId: record.id,
      variantId: record.variantId,
      clientId: 'test-client',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('too_early');
      expect(result.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it('releases AES-GCM key material after unlock time', async () => {
    const record = await createAdminContent({
      title: `Unlocked Test ${Date.now()}`,
      unlockAt: new Date(Date.now() - 1000).toISOString(),
    });

    const result = await unlockRelease({
      releaseId: record.releaseId,
      contentId: record.id,
      variantId: record.variantId,
      clientId: 'test-client',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.algorithm).toBe('AES-GCM');
      expect(result.keyId).toBe(`${record.releaseId}:${record.variantId}`);
      expect(result.key.length).toBeGreaterThan(20);
    }
  });
});
