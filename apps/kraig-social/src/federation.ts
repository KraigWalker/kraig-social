import {
  createInstance,
  type ModuleFederationRuntimePlugin,
} from '@module-federation/runtime';
import ssrEntryLoader from '@module-federation/vite/ssrEntryLoader';
import type { ComponentType } from 'react';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import * as ReactDomClient from 'react-dom/client';
import * as ReactJsxRuntime from 'react/jsx-runtime';
import type {
  DecisionResponse,
  FederatedRemoteReference,
} from '@kraigwalker/kraig-social-content-sdk';
import { gatewayUrl } from './gateway';

export interface DispatchPanelProps {
  decision: DecisionResponse;
}

interface DispatchPanelModule {
  default: ComponentType<DispatchPanelProps>;
}

const componentPromises = new Map<string, Promise<ComponentType<DispatchPanelProps>>>();
const registeredRemotes = new Set<string>();

const shareConfig = {
  singleton: true,
  strictVersion: true,
  requiredVersion: '19.2.7',
};
const sharedDependencies = {
    react: {
      version: '19.2.7',
      lib: () => React,
      shareConfig,
    },
    'react-dom': {
      version: '19.2.7',
      lib: () => ReactDom,
      shareConfig,
    },
    'react-dom/client': {
      version: '19.2.7',
      lib: () => ReactDomClient,
      shareConfig,
    },
    'react/jsx-runtime': {
      version: '19.2.7',
      lib: () => ReactJsxRuntime,
      shareConfig: {
        singleton: true,
        strictVersion: true,
        requiredVersion: '19.2.7',
      },
    },
};
const serverRuntimePath = (
  globalThis as typeof globalThis & { __KRAIG_MF_RUNTIME_PATH__?: string }
).__KRAIG_MF_RUNTIME_PATH__;
const federation = createInstance({
  name: 'kraig_social_runtime',
  remotes: [],
  shared: sharedDependencies,
  plugins: [
    ssrEntryLoader({
      resolvedShared: serverRuntimePath
        ? { '@module-federation/runtime': serverRuntimePath }
        : undefined,
    }) as ModuleFederationRuntimePlugin,
  ],
});

function exposedModuleId(remote: FederatedRemoteReference): string {
  return `${remote.name}/${remote.expose.replace(/^\.\//u, '')}`;
}

export function loadDispatchPanel(
  remote: FederatedRemoteReference
): Promise<ComponentType<DispatchPanelProps>> {
  const existing = componentPromises.get(remote.name);
  if (existing) {
    return existing;
  }

  const promise = (async () => {
    if (!registeredRemotes.has(remote.name)) {
      federation.registerRemotes([
        {
          name: remote.name,
          entry: gatewayUrl(remote.browserManifestUrl),
          type: 'module',
        },
      ]);
      registeredRemotes.add(remote.name);
    }

    if (typeof window !== 'undefined') {
      await federation.preloadRemote([
        {
          nameOrAlias: remote.name,
          exposes: [remote.expose],
        },
      ]);
    }
    const loaded = (await federation.loadRemote(
      exposedModuleId(remote)
    )) as DispatchPanelModule | null;
    if (!loaded?.default) {
      throw new Error(`Remote ${exposedModuleId(remote)} did not expose a React component`);
    }
    return loaded.default;
  })();

  componentPromises.set(remote.name, promise);
  promise.catch(() => componentPromises.delete(remote.name));
  return promise;
}
