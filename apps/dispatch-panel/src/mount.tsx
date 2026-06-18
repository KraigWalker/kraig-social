import { createRoot, hydrateRoot, type Root } from 'react-dom/client';
import DispatchPanel from './DispatchPanel';
import type { DispatchDecision } from './contracts';

export function mount(target: HTMLElement, decision: DispatchDecision): () => void {
  let root: Root;
  const element = <DispatchPanel decision={decision} />;

  if (target.hasChildNodes()) {
    root = hydrateRoot(target, element);
  } else {
    root = createRoot(target);
    root.render(element);
  }

  return () => root.unmount();
}
