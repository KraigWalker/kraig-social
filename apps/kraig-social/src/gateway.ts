import type {
  DecisionResponse,
  DeliveryManifest,
  ManifestEntry,
} from '@kraigwalker/kraig-social-content-sdk';

const serverEnv = globalThis as typeof globalThis & {
  process?: { env?: { GATEWAY_ORIGIN?: string } };
};

export const gatewayOrigin =
  typeof window === 'undefined'
    ? (serverEnv.process?.env?.GATEWAY_ORIGIN ?? 'http://localhost:3001')
    : ((window as Window & { __KRAIG_GATEWAY_ORIGIN__?: string }).__KRAIG_GATEWAY_ORIGIN__ ??
      'http://localhost:3001');

export type { DecisionResponse, DeliveryManifest, ManifestEntry };

export async function fetchManifest(): Promise<DeliveryManifest> {
  const response = await fetch(`${gatewayOrigin}/api/content/manifest`);
  if (!response.ok) {
    throw new Error(`Gateway manifest failed with ${response.status}`);
  }
  return (await response.json()) as DeliveryManifest;
}

export async function resolveDecision(params: {
  clientId: string;
  ring: string;
  contentId?: string;
  moduleId?: string;
  forceVariant?: string;
}): Promise<DecisionResponse> {
  const response = await fetch(`${gatewayOrigin}/api/decision/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contentId: params.contentId,
      moduleId: params.moduleId,
      client: {
        clientId: params.clientId,
        ring: params.ring,
        traits: {},
      },
      context: {
        forceVariant: params.forceVariant,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gateway decision failed with ${response.status}`);
  }
  return (await response.json()) as DecisionResponse;
}

export function gatewayUrl(path: string): string {
  if (path.startsWith('http')) {
    return path;
  }
  return `${gatewayOrigin}${path}`;
}
