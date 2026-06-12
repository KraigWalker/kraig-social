import type { DeveloperSignal } from '@kraigwalker/kraig-social-content-sdk';
import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';

const signalEmitter = new EventEmitter();
const recentSignals: DeveloperSignal[] = [];

export function createDeveloperSignal(
  input: Partial<DeveloperSignal> & Pick<DeveloperSignal, 'type'>
): DeveloperSignal {
  const signal: DeveloperSignal = {
    id: input.id ?? randomUUID(),
    type: input.type,
    moduleId: input.moduleId,
    releaseId: input.releaseId,
    flagKey: input.flagKey,
    payload: input.payload ?? {},
    createdAt: input.createdAt ?? new Date().toISOString(),
  };

  recentSignals.unshift(signal);
  recentSignals.splice(25);
  signalEmitter.emit('signal', signal);
  return signal;
}

export function getRecentSignals(): DeveloperSignal[] {
  return [...recentSignals];
}

export function onDeveloperSignal(listener: (signal: DeveloperSignal) => void): () => void {
  signalEmitter.on('signal', listener);
  return () => signalEmitter.off('signal', listener);
}
