import type {
  DecisionRequest,
  DecisionResponse,
  RingId,
} from '@kraigwalker/kraig-social-content-sdk';
import { randomUUID } from 'node:crypto';
import { writeAuditLog } from './audit-log.js';
import { getLatestActiveModule } from './local-data.js';
import { getRecentSignals } from './signals.js';

function stableBucket(value: string): number {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0) % 100;
}

function normalizeRing(ring: string | undefined): RingId {
  if (ring === 'dev' || ring === 'friends' || ring === 'public') {
    return ring;
  }
  return 'public';
}

export async function resolveDecision(request: DecisionRequest): Promise<DecisionResponse> {
  const ring = normalizeRing(request.client.ring);
  const moduleId = request.moduleId ?? 'dispatch-panel';
  const forceVariant =
    typeof request.context.forceVariant === 'string' ? request.context.forceVariant : undefined;
  const recentSignals = getRecentSignals();
  const hasWorkSignal = recentSignals.some(
    (signal) =>
      signal.moduleId === moduleId ||
      signal.type === 'devcontainer.opened' ||
      signal.type === 'flag.enabled'
  );
  const bucket = stableBucket(`${request.client.clientId}:${moduleId}`);

  let variantId = 'control';
  let reason = `ring:${ring}:stable-control`;

  if (forceVariant) {
    variantId = forceVariant;
    reason = `override:${forceVariant}`;
  } else if (ring === 'dev') {
    variantId = hasWorkSignal ? 'live-workbench' : 'next';
    reason = hasWorkSignal ? 'developer-signal-targeted' : 'dev-ring';
  } else if (ring === 'friends') {
    variantId = bucket < 50 ? 'next' : 'control';
    reason = `friends-ab:${bucket < 50 ? 'next' : 'control'}:${bucket}`;
  }

  const moduleEntry = await getLatestActiveModule(moduleId, ring);
  const contentId = request.contentId ?? 'home/delivery-lab';
  const response: DecisionResponse = {
    decisionId: randomUUID(),
    contentId,
    moduleId,
    variantId,
    releaseId: `dispatch-panel-${moduleEntry.version}`,
    moduleVersion: moduleEntry.version,
    remote: moduleEntry,
    reason,
    ttlSeconds: ring === 'public' ? 60 : 10,
    serverNow: new Date().toISOString(),
    hotReloadCapable: true,
  };

  await writeAuditLog({
    type: 'decision.resolve',
    actor: request.client.clientId,
    details: {
      ring,
      moduleId,
      variantId,
      reason,
      decisionId: response.decisionId,
    },
  });

  return response;
}
