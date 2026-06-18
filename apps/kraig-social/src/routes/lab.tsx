import {
  Component,
  Suspense,
  use,
  useEffect,
  useMemo,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import { useLoaderData } from 'react-router';
import type { Route } from './+types/lab';
import { gatewayOrigin, resolveDecision, type DecisionResponse } from '../gateway';
import { loadDispatchPanel } from '../federation';

export const meta: Route.MetaFunction = () => [
  { title: 'Delivery Lab | Kraig Social' },
  {
    name: 'description',
    content: 'Local control surface for Kraig Social gateway decisions and hot module refresh.',
  },
  { name: 'robots', content: 'noindex' },
];

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const requestedRing = url.searchParams.get('ring');
  const ring = ['dev', 'friends', 'public'].includes(requestedRing ?? '')
    ? requestedRing!
    : 'dev';

  try {
    const decision = await resolveDecision({
      clientId: url.searchParams.get('clientId') ?? 'ssr',
      ring,
      contentId: 'home/delivery-lab',
      moduleId: 'dispatch-panel',
    });
    return { decision, ring, error: null };
  } catch (error) {
    return {
      decision: null,
      ring,
      error: error instanceof Error ? error.message : 'Gateway decision failed',
    };
  }
}

function getClientId(): string {
  const key = 'kraig-social-client-id';
  const existing = window.localStorage.getItem(key);
  if (existing) {
    return existing;
  }
  const next = crypto.randomUUID();
  window.localStorage.setItem(key, next);
  return next;
}

function FederatedPanel({ decision }: { decision: DecisionResponse }) {
  const DispatchPanel = use(loadDispatchPanel(decision.remote));
  return <DispatchPanel decision={decision} />;
}

class RemoteErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Federated dispatch panel failed to render', error, info);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function RemoteFallback({ message }: { message: string }) {
  return (
    <section className="remote-fallback" role="status">
      <p className="system-label">Federated module unavailable</p>
      <h2>The delivery controls are still online.</h2>
      <p>{message}</p>
    </section>
  );
}

export default function Lab() {
  const loaderData = useLoaderData<typeof loader>();
  const [ring, setRing] = useState(loaderData.ring);
  const [decision, setDecision] = useState<DecisionResponse | null>(loaderData.decision);
  const [status, setStatus] = useState(
    loaderData.error ??
      (loaderData.decision
        ? `Decision ${loaderData.decision.decisionId.slice(0, 8)} selected ${loaderData.decision.variantId}`
        : 'Waiting for gateway decision')
  );
  const [signals, setSignals] = useState<string[]>([]);

  const clientId = useMemo(() => (typeof window === 'undefined' ? 'ssr' : getClientId()), []);

  async function refreshDecision(reason = 'manual refresh') {
    setStatus(`Resolving decision: ${reason}`);
    try {
      const nextDecision = await resolveDecision({
        clientId,
        ring,
        contentId: 'home/delivery-lab',
        moduleId: 'dispatch-panel',
      });
      setDecision(nextDecision);
      setStatus(`Decision ${nextDecision.decisionId.slice(0, 8)} selected ${nextDecision.variantId}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Decision failed');
    }
  }

  async function triggerSignal(type: string) {
    await fetch(`${gatewayOrigin}/api/signals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        moduleId: 'dispatch-panel',
        flagKey: type === 'flag.enabled' ? 'dispatch-panel.next' : undefined,
        payload: { source: 'lab' },
      }),
    });
  }

  useEffect(() => {
    void refreshDecision('ring changed');
  }, [ring]);

  useEffect(() => {
    const source = new EventSource(`${gatewayOrigin}/api/signals/stream`);
    source.addEventListener('signal', (event) => {
      const message = JSON.parse((event as MessageEvent).data) as { type: string; createdAt: string };
      setSignals((items) => [`${message.type} at ${new Date(message.createdAt).toLocaleTimeString()}`, ...items].slice(0, 5));
      if (decision?.hotReloadCapable) {
        void refreshDecision(message.type);
      }
    });
    source.onerror = () => {
      setStatus('Signal stream disconnected; gateway may be offline');
    };
    return () => source.close();
  }, [decision?.hotReloadCapable, ring]);

  return (
    <main className="experience-shell compact">
      <header className="page-header">
        <p className="system-label">Delivery lab</p>
        <h1>Gateway-directed experience control</h1>
        <p>
          Switch release rings, ask the gateway for a decision, and watch a remote module slot
          refresh when developer-facing signals arrive.
        </p>
      </header>

      <section className="lab-layout">
        <aside className="control-panel" aria-label="Decision controls">
          <div>
            <h2>Ring</h2>
            <div className="segmented-control">
              {['dev', 'friends', 'public'].map((item) => (
                <button
                  className={item === ring ? 'active' : ''}
                  key={item}
                  type="button"
                  onClick={() => setRing(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <button className="primary-action full" type="button" onClick={() => void refreshDecision()}>
            Resolve decision
          </button>
          <button className="secondary-action full" type="button" onClick={() => void triggerSignal('flag.enabled')}>
            Enable flag signal
          </button>
          <button className="secondary-action full" type="button" onClick={() => void triggerSignal('module.built')}>
            Module built signal
          </button>

          <div className="status-box">
            <span>Status</span>
            <strong>{status}</strong>
          </div>
        </aside>

        <section className="remote-stage" aria-label="Federated module preview">
          <div className="remote-slot">
            {decision ? (
              <RemoteErrorBoundary
                key={decision.remote.name}
                fallback={<RemoteFallback message="The selected release could not be loaded." />}
              >
                <Suspense fallback={<RemoteFallback message="Loading the selected release…" />}>
                  <FederatedPanel decision={decision} />
                </Suspense>
              </RemoteErrorBoundary>
            ) : (
              <RemoteFallback message={loaderData.error ?? 'No release decision is available yet.'} />
            )}
          </div>
        </section>
      </section>

      <section className="telemetry-grid" aria-label="Decision telemetry">
        <article>
          <h2>Decision</h2>
          <pre>{decision ? JSON.stringify(decision, null, 2) : 'No decision yet'}</pre>
        </article>
        <article>
          <h2>Signals</h2>
          <ul className="plain-list">
            {signals.length ? signals.map((signal) => <li key={signal}>{signal}</li>) : <li>No signals yet</li>}
          </ul>
        </article>
      </section>
    </main>
  );
}
