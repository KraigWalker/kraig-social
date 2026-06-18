import type { CSSProperties } from 'react';
import type { DispatchPanelProps } from './contracts';

function releaseTheme(version: string): { accent: string; label: string } {
  return version === '1.1.0'
    ? { accent: '#7df9ff', label: 'live workbench' }
    : { accent: '#ff4f87', label: 'stable dispatch' };
}

const cardStyle: CSSProperties = {
  background: 'linear-gradient(135deg, rgba(8,14,24,.94), rgba(20,26,38,.88))',
  boxShadow: '0 20px 80px rgba(0,0,0,.35)',
  borderRadius: 8,
  padding: 18,
  color: '#f7fbff',
  minHeight: 220,
  display: 'grid',
  gap: 14,
};

export default function DispatchPanel({ decision }: DispatchPanelProps) {
  const { accent, label } = releaseTheme(decision.remote.version);

  return (
    <section
      data-federated-release={`${decision.remote.name}@${decision.remote.version}`}
      style={{ ...cardStyle, border: `1px solid color-mix(in srgb, ${accent} 55%, transparent)` }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase', color: accent }}>
          {label}
        </span>
        <span style={{ fontSize: 12, color: '#a8b3c7' }}>
          {decision.moduleId}@{decision.remote.version}
        </span>
      </div>
      <h3 style={{ margin: 0, fontSize: 28, lineHeight: 1.05 }}>Gateway-selected module online</h3>
      <p style={{ margin: 0, color: '#dbe7ff', lineHeight: 1.55 }}>
        Variant <strong>{decision.variantId}</strong> was selected because <strong>{decision.reason}</strong>.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 }}>
        <Metric label="Release" value={decision.remote.version} />
        <Metric label="TTL" value={`${decision.ttlSeconds}s`} />
        <Metric label="HMR" value={decision.hotReloadCapable ? 'capable' : 'locked'} />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: '1px solid rgba(255,255,255,.12)', padding: 12, borderRadius: 6 }}>
      <b>{label}</b>
      <br />
      <span>{value}</span>
    </div>
  );
}
