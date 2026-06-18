import { createRoot } from 'react-dom/client';
import DispatchPanel from './DispatchPanel';

const version = import.meta.env.DISPATCH_PANEL_VERSION ?? '1.1.0';
const target = document.getElementById('root');

if (target) {
  createRoot(target).render(
    <DispatchPanel
      decision={{
        moduleId: 'dispatch-panel',
        variantId: 'standalone',
        reason: 'remote-development',
        ttlSeconds: 10,
        hotReloadCapable: true,
        remote: {
          name: `dispatch_panel_${version.replaceAll('.', '_')}`,
          version,
        },
      }}
    />
  );
}
