import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type Role = 'brand_manager' | 'creator' | 'admin';

export interface Persona {
  role: Role;
  name: string;
  initials: string;
  title: string;
  org: string;
  email: string;
}

export const PERSONAS: Record<Role, Persona> = {
  brand_manager: {
    role: 'brand_manager',
    name: 'Priya Kapoor',
    initials: 'PK',
    title: 'Brand Manager',
    org: 'Brand Asset Operations',
    email: 'brandmanager@branddna.com'
  },
  creator: {
    role: 'creator',
    name: 'Alex Rivera',
    initials: 'AR',
    title: 'Content Creator',
    org: 'Horizon Media Agency',
    email: 'creator@demobrands.test'
  },
  admin: {
    role: 'admin',
    name: 'Jordan Blake',
    initials: 'JB',
    title: 'Workspace Admin',
    org: 'Enterprise Brand Director',
    email: 'admin@demobrands.test'
  }
};

/** Only brand manager and admin can review and accept / sign off content. */
export const canApprove = (role: Role) => role === 'brand_manager' || role === 'admin';

/** Short role names shown in the sidebar role pill. */
export const ROLE_LABEL: Record<Role, string> = {
  brand_manager: 'Brand Manager',
  creator: 'Content Creator',
  admin: 'Platform Admin'
};

/** Each persona's landing route (the default-active sidebar item). */
export const dashboardPath = (role: Role) => `/dashboard?role=${role}`;

interface SessionValue {
  persona: Persona;
  setRole: (role: Role) => void;
  setCustomUser: (user: Partial<Persona> | null) => void;
}

const SessionContext = createContext<SessionValue | null>(null);
const STORAGE_KEY = 'branddna.role';
const CUSTOM_USER_KEY = 'branddna_custom_user';

function readRole(): Role {
  const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
  return stored === 'admin' || stored === 'brand_manager' || stored === 'creator'
    ? stored
    : 'brand_manager';
}

function readCustomUser(): Partial<Persona> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CUSTOM_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(readRole);
  const [customUser, setCustomUserState] = useState<Partial<Persona> | null>(readCustomUser);

  const setRole = useCallback((next: Role) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setRoleState(next);
  }, []);

  const setCustomUser = useCallback((user: Partial<Persona> | null) => {
    if (user) {
      window.localStorage.setItem(CUSTOM_USER_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(CUSTOM_USER_KEY);
    }
    setCustomUserState(user);
  }, []);

  const persona: Persona = useMemo(() => {
    const base = PERSONAS[role];
    if (customUser) {
      const name = customUser.name || base.name;
      const initials =
        customUser.initials ||
        name
          .split(' ')
          .map(w => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() ||
        base.initials;
      return {
        ...base,
        ...customUser,
        role,
        name,
        email: customUser.email || base.email,
        initials
      };
    }
    return base;
  }, [role, customUser]);

  const value = useMemo(() => ({ persona, setRole, setCustomUser }), [persona, setRole, setCustomUser]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
