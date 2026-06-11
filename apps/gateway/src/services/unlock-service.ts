interface UnlockReleaseRequest {
  releaseId: string;
  contentId: string;
  variantId: string;
  clientId: string;
  code?: string;
}

type UnlockReleaseResult =
  | {
      ok: true;
      releaseId: string;
      contentId: string;
      variantId: string;
    }
  | {
      ok: false;
      reason: 'too_early' | 'invalid_code' | 'rate_limited';
    };

export async function unlockRelease(request: UnlockReleaseRequest): Promise<UnlockReleaseResult> {
  if (!request.code) {
    return { ok: false, reason: 'invalid_code' };
  }

  return {
    ok: true,
    releaseId: request.releaseId,
    contentId: request.contentId,
    variantId: request.variantId,
  };
}
