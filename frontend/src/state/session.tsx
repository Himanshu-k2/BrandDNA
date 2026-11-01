import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type Role = 'creator' | 'reviewer' | 'admin';

export interface Persona {
  role: Role;
  name: string;
  initials: string;
  title: string;
  org: string;
  email: string;
}

export const PERSONAS: Record<Role, Persona> = {
  admin: {
    role: 'admin',
    name: 'Jordan Blake',
    initials: 'JB',
    title: 'Workspace Admin',
    org: 'Enterprise Brand Director',
    email: 'admin@demobrands.test'
  },
  reviewer: {
    role: 'reviewer',
    name: 'Sarah Chen',
    initials: 'SC',
    title: 'Brand Reviewer',
    org: 'Account & Brand Manager',
    email: 'reviewer@demobrands.test'
  },
  creator: {
    role: 'creator',
    name: 'Alex Rivera',
    initials: 'AR',
    title: 'Content Creator',
    org: 'Horizon Media Agency',
    email: 'creator@demobrands.test'
  }
};

export const canApprove = (role: Role) => role !== 'creator';

/** Short role names shown in the sidebar role pill. */
export const ROLE_LABEL: Record<Role, string> = {
  reviewer: 'Reviewer',
  admin: 'Platform Admin',
  creator: 'Content Creator'
};

/** Each persona's landing route (the default-active sidebar item). */
export const dashboardPath = (role: Role) => `/dashboard?role=${role}`;

interface SessionValue {
  persona: Persona;
  setRole: (role: Role) => void;
}

const SessionContext = createContext<SessionValue | null>(null);
const STORAGE_KEY = 'branddna.role';

function readRole(): Role {
  const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
  return stored === 'admin' || stored === 'reviewer' || stored === 'creator' ? stored : 'creator';
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(readRole);
  const setRole = useCallback((next: Role) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setRoleState(next);
  }, []);
  const value = useMemo(() => ({ persona: PERSONAS[role], setRole }), [role, setRole]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
