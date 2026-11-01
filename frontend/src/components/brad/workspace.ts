import { useSyncExternalStore } from 'react';
import { BRANDS } from '@/data/demo';

/** Active brand workspace, reported by the sidebar switcher so Brad can scope its answers. */
let active: string = BRANDS[0].id;
const listeners = new Set<() => void>();

export function setActiveWorkspace(id: string) {
  if (id === active) return;
  active = id;
  listeners.forEach(listener => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useActiveWorkspace = () => useSyncExternalStore(subscribe, () => active);
