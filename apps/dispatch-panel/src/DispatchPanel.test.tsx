import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import DispatchPanel from './DispatchPanel';
import { mount } from './mount';
import type { DispatchDecision } from './contracts';

const decision: DispatchDecision = {
  moduleId: 'dispatch-panel',
  variantId: 'next',
  reason: 'dev-ring',
  ttlSeconds: 10,
  hotReloadCapable: true,
  remote: {
    name: 'dispatch_panel_1_1_0',
    version: '1.1.0',
  },
};

describe('DispatchPanel remote contracts', () => {
  it('renders the selected immutable release through the React contract', () => {
    const html = renderToString(<DispatchPanel decision={decision} />);

    expect(html).toContain('dispatch_panel_1_1_0@1.1.0');
    expect(html).toContain('live workbench');
    expect(html).toContain('Variant <strong>next</strong>');
  });

  it('mounts and unmounts through the compatibility adapter', async () => {
    const target = document.createElement('div');
    const cleanup = mount(target, decision);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(target.textContent).toContain('Gateway-selected module online');
    cleanup();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(target.textContent).toBe('');
  });
});
