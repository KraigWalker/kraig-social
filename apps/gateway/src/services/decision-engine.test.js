import { describe, expect, it } from 'vitest';
import { resolveDecision } from './decision-engine.ts';
import { createDeveloperSignal } from './signals.ts';

describe('resolveDecision', () => {
  it('returns a stable friends-ring A/B assignment for the same client', async () => {
    const request = {
      contentId: 'home/delivery-lab',
      moduleId: 'dispatch-panel',
      client: {
        clientId: 'client-stability-check',
        ring: 'friends',
        traits: {},
      },
      context: {},
    };

    const first = await resolveDecision(request);
    const second = await resolveDecision(request);

    expect(second.variantId).toBe(first.variantId);
    expect(second.moduleId).toBe('dispatch-panel');
    expect(second.reason).toMatch(/^friends-ab:/u);
    expect(second.remote.name).toBe('dispatch_panel_1_1_0');
    expect(second.remote.browserManifestUrl).toBe(
      '/mf/releases/1.1.0/browser/mf-manifest.json'
    );
  });

  it('uses developer signals to target hot workbench variants in the dev ring', async () => {
    createDeveloperSignal({
      type: 'module.built',
      moduleId: 'dispatch-panel',
      payload: { test: true },
    });

    const decision = await resolveDecision({
      contentId: 'home/delivery-lab',
      moduleId: 'dispatch-panel',
      client: {
        clientId: 'developer-signal-check',
        ring: 'dev',
        traits: {},
      },
      context: {},
    });

    expect(decision.variantId).toBe('live-workbench');
    expect(decision.reason).toBe('developer-signal-targeted');
    expect(decision.hotReloadCapable).toBe(true);
    expect(decision.remote.version).toBe('1.1.0');
  });

  it('honors explicit variant overrides', async () => {
    const decision = await resolveDecision({
      contentId: 'home/delivery-lab',
      moduleId: 'dispatch-panel',
      client: {
        clientId: 'override-check',
        ring: 'public',
        traits: {},
      },
      context: {
        forceVariant: 'operator-preview',
      },
    });

    expect(decision.variantId).toBe('operator-preview');
    expect(decision.reason).toBe('override:operator-preview');
    expect(decision.remote.version).toBe('1.0.0');
  });
});
