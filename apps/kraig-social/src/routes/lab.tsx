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

const ringHelp = {
  dev: {
    title: 'Development',
    detail: 'Uses release 1.1.0 and reacts to recent developer signals.',
  },
  friends: {
    title: 'Friends',
    detail: 'Uses release 1.1.0 with a stable, browser-specific A/B assignment.',
  },
  public: {
    title: 'Public',
    detail: 'Pins every visitor to the stable 1.0.0 control experience.',
  },
} as const;

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
  const ring = ['dev', 'friends', 'public'].includes(requestedRing ?? '') ? requestedRing! : 'dev';

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

function FederatedPanel({
  decision,
  onRendered,
}: {
  decision: DecisionResponse;
  onRendered: (rendered: true) => void;
}) {
  const DispatchPanel = use(loadDispatchPanel(decision.remote));
  useEffect(() => {
    onRendered(true);
  }, [DispatchPanel, onRendered]);
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
  const [signalStreamConnected, setSignalStreamConnected] = useState(false);
  const [remoteRendered, setRemoteRendered] = useState(false);

  const clientId = useMemo(() => (typeof window === 'undefined' ? 'ssr' : getClientId()), []);
  const selectedRing = ringHelp[ring as keyof typeof ringHelp];

  async function refreshDecision(reason = 'manual refresh') {
    setStatus(`Resolving decision: ${reason}`);
    setRemoteRendered(false);
    try {
      const nextDecision = await resolveDecision({
        clientId,
        ring,
        contentId: 'home/delivery-lab',
        moduleId: 'dispatch-panel',
      });
      setDecision(nextDecision);
      setStatus(
        `Decision ${nextDecision.decisionId.slice(0, 8)} selected ${nextDecision.variantId}`
      );
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
    source.onopen = () => {
      setSignalStreamConnected(true);
    };
    source.addEventListener('signal', (event) => {
      const message = JSON.parse((event as MessageEvent).data) as {
        type: string;
        createdAt: string;
      };
      setSignals((items) =>
        [`${message.type} at ${new Date(message.createdAt).toLocaleTimeString()}`, ...items].slice(
          0,
          5
        )
      );
      if (decision?.hotReloadCapable) {
        void refreshDecision(message.type);
      }
    });
    source.onerror = () => {
      setSignalStreamConnected(false);
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

      <section className="demo-explainer" aria-labelledby="demo-explainer-heading">
        <div>
          <p className="system-label">What this demonstrates</p>
          <h2 id="demo-explainer-heading">The host does not choose its own module.</h2>
        </div>
        <p>
          The host sends the selected ring and this browser's stable client ID to the gateway. The
          gateway returns a decision naming an immutable remote release and variant. The host then
          loads that release's Module Federation manifest and renders it in the preview.
        </p>
        <ol className="demo-flow" aria-label="Module delivery sequence">
          <li>
            <span>1</span> Choose an audience ring
          </li>
          <li>
            <span>2</span> Gateway resolves a decision
          </li>
          <li>
            <span>3</span> Host loads the selected remote
          </li>
          <li>
            <span>4</span> Signals can trigger reselection
          </li>
        </ol>
      </section>

      <section className="lab-layout">
        <aside className="control-panel" aria-label="Decision controls">
          <div className="control-group">
            <h2>1. Choose a release ring</h2>
            <p>
              Rings model progressively wider audiences. Changing the ring immediately asks the
              gateway for a new decision.
            </p>
            <div className="segmented-control">
              {(Object.keys(ringHelp) as Array<keyof typeof ringHelp>).map((item) => (
                <button
                  className={item === ring ? 'active' : ''}
                  key={item}
                  type="button"
                  onClick={() => setRing(item)}
                  aria-pressed={item === ring}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="control-help" aria-live="polite">
              <strong>{selectedRing.title}</strong>
              <span>{selectedRing.detail}</span>
            </div>
          </div>

          <div className="control-group">
            <h2>2. Ask for a decision</h2>
            <p>
              Re-run the gateway rules without changing the ring. The decision ID changes, while a
              stable rule should keep the same release and variant.
            </p>
            <button
              className="primary-action full"
              type="button"
              onClick={() => void refreshDecision()}
            >
              Resolve decision
            </button>
          </div>

          <div className="control-group">
            <h2>3. Simulate delivery events</h2>
            <p>
              These publish events to the gateway's live signal stream. In the dev ring, either
              event targets the <code>live-workbench</code> variant and refreshes the preview.
            </p>
            <button
              className="secondary-action full"
              type="button"
              onClick={() => void triggerSignal('flag.enabled')}
            >
              Enable flag signal
            </button>
            <span className="button-help">Simulates enabling a feature flag for this module.</span>
            <button
              className="secondary-action full"
              type="button"
              onClick={() => void triggerSignal('module.built')}
            >
              Module built signal
            </button>
            <span className="button-help">
              Simulates a new development build becoming available.
            </span>
          </div>

          <div className="status-box" aria-live="polite">
            <span>Status</span>
            <strong>{status}</strong>
          </div>
        </aside>

        <section className="remote-stage" aria-label="Federated module preview">
          <div className="stage-heading">
            <div>
              <p className="system-label">Result</p>
              <h2>Gateway-selected remote</h2>
            </div>
            <span className={decision ? 'connection-badge online' : 'connection-badge'}>
              {decision ? 'Decision received' : 'Waiting for decision'}
            </span>
          </div>
          <div className="remote-slot">
            {decision ? (
              <RemoteErrorBoundary
                key={decision.remote.name}
                fallback={<RemoteFallback message="The selected release could not be loaded." />}
              >
                <Suspense fallback={<RemoteFallback message="Loading the selected release…" />}>
                  <FederatedPanel decision={decision} onRendered={setRemoteRendered} />
                </Suspense>
              </RemoteErrorBoundary>
            ) : (
              <RemoteFallback
                message={loaderData.error ?? 'No release decision is available yet.'}
              />
            )}
          </div>
        </section>
      </section>

      <section className="working-checklist" aria-labelledby="working-heading">
        <div>
          <p className="system-label">Is it working?</p>
          <h2 id="working-heading">Follow the live handoff</h2>
          <p>Each green check confirms one boundary in the delivery path.</p>
        </div>
        <ul>
          <li className={decision ? 'complete' : ''}>
            <span>{decision ? '✓' : '…'}</span>
            <div>
              <strong>Gateway decision</strong>
              <small>
                {decision ? `Received ${decision.decisionId.slice(0, 8)}` : 'Not received yet'}
              </small>
            </div>
          </li>
          <li className={decision?.remote ? 'complete' : ''}>
            <span>{decision?.remote ? '✓' : '…'}</span>
            <div>
              <strong>Immutable release selected</strong>
              <small>
                {decision
                  ? `${decision.moduleId}@${decision.moduleVersion}`
                  : 'Waiting for a release'}
              </small>
            </div>
          </li>
          <li className={remoteRendered ? 'complete' : ''}>
            <span>{remoteRendered ? '✓' : '…'}</span>
            <div>
              <strong>Federated preview rendered</strong>
              <small>
                {remoteRendered && decision
                  ? `Showing variant ${decision.variantId}`
                  : 'Loading the selected module…'}
              </small>
            </div>
          </li>
          <li className={signalStreamConnected ? 'complete' : ''}>
            <span>{signalStreamConnected ? '✓' : '…'}</span>
            <div>
              <strong>Live signal stream</strong>
              <small>
                {signalStreamConnected ? 'Connected over Server-Sent Events' : 'Connecting…'}
              </small>
            </div>
          </li>
        </ul>
      </section>

      <section className="telemetry-grid" aria-label="Decision telemetry">
        <article>
          <h2>Decision</h2>
          <p className="telemetry-help">
            Raw gateway output. Watch <code>moduleVersion</code>, <code>variantId</code>, and{' '}
            <code>reason</code> change as you use the controls.
          </p>
          <pre>{decision ? JSON.stringify(decision, null, 2) : 'No decision yet'}</pre>
        </article>
        <article>
          <h2>Signals</h2>
          <p className="telemetry-help">
            The newest events received from the gateway's live SSE connection.
          </p>
          <ul className="plain-list">
            {signals.length ? (
              signals.map((signal) => <li key={signal}>{signal}</li>)
            ) : (
              <li>No signals yet</li>
            )}
          </ul>
        </article>
      </section>
    </main>
  );
}
