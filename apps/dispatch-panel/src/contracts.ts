export interface DispatchDecision {
  moduleId: string;
  variantId: string;
  reason: string;
  ttlSeconds: number;
  hotReloadCapable: boolean;
  remote: {
    name: string;
    version: string;
  };
}

export interface DispatchPanelProps {
  decision: DispatchDecision;
}
