import type { UnlockResponse } from '@kraigwalker/kraig-social-content-sdk';
import { findStoredKey } from './local-data.js';
import { writeAuditLog } from './audit-log.js';

interface UnlockReleaseRequest {
  releaseId: string;
  contentId: string;
  variantId: string;
  clientId: string;
  code?: string;
}

export async function unlockRelease(request: UnlockReleaseRequest): Promise<UnlockResponse> {
  const serverNow = new Date();
  const storedKey = await findStoredKey(request);

  if (!storedKey) {
    return { ok: false, reason: 'not_found', serverNow: serverNow.toISOString() };
  }

  if (storedKey.revoked) {
    return { ok: false, reason: 'revoked', serverNow: serverNow.toISOString() };
  }

  const unlockAt = new Date(storedKey.unlockAt);
  if (unlockAt > serverNow) {
    const retryAfterSeconds = Math.max(1, Math.ceil((unlockAt.getTime() - serverNow.getTime()) / 1000));
    return {
      ok: false,
      reason: 'too_early',
      retryAfterSeconds,
      serverNow: serverNow.toISOString(),
    };
  }

  await writeAuditLog({
    type: 'unlock.release',
    actor: request.clientId,
    details: {
      releaseId: request.releaseId,
      contentId: request.contentId,
      variantId: request.variantId,
      keyId: storedKey.keyId,
    },
  });

  const response: UnlockResponse = {
    ok: true,
    releaseId: request.releaseId,
    contentId: request.contentId,
    variantId: request.variantId,
    keyId: storedKey.keyId,
    key: storedKey.key,
    algorithm: 'AES-GCM',
    serverNow: serverNow.toISOString(),
  };
  return response;
}
