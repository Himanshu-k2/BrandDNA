import { type Role } from '@/state/session';
import { type WorkspaceUser } from './platform';
import client from '@/api/client';

export interface JoiningRequest {
  id: string;
  name: string;
  email: string;
  role: Role;
  roleTitle: string;
  brand: string;
  connectionsCount: number;
  requestedAt: string;
  status: 'pending' | 'accepted' | 'declined';
  activationToken: string;
  avatarUrl?: string;
}

const STORAGE_KEY_REQUESTS = 'branddna_joining_requests';
const STORAGE_KEY_REGISTERED_USERS = 'branddna_registered_users';
export const VERCEL_PRODUCTION_URL = 'https://brand-3tc74k0an-mewo3.vercel.app';

const INITIAL_REQUESTS: JoiningRequest[] = [
  {
    id: 'req-1',
    name: 'Alfred Harris',
    email: 'alfred.harris@designagency.com',
    role: 'creator',
    roleTitle: 'UX Lead',
    brand: 'NovaFit Health',
    connectionsCount: 20,
    requestedAt: '10 mins ago',
    status: 'pending',
    activationToken: 'act_alfred_harris_991',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'req-2',
    name: 'David Hill',
    email: 'david.hill@demobrands.test',
    role: 'creator',
    roleTitle: 'Front-End Developer',
    brand: 'OmniCloud',
    connectionsCount: 2,
    requestedAt: '2 hours ago',
    status: 'accepted',
    activationToken: 'act_david_hill_442',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'req-3',
    name: 'Sarah Field',
    email: 'sarah.field@apexfintech.test',
    role: 'brand_manager',
    roleTitle: 'Project Manager',
    brand: 'Apex FinTech',
    connectionsCount: 16,
    requestedAt: 'Yesterday',
    status: 'accepted',
    activationToken: 'act_sarah_field_883',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  }
];

export function getJoiningRequests(): JoiningRequest[] {
  if (typeof window === 'undefined') return INITIAL_REQUESTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_REQUESTS);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(INITIAL_REQUESTS));
      return INITIAL_REQUESTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_REQUESTS;
  }
}

export function saveJoiningRequests(requests: JoiningRequest[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(requests));
  } catch {
    // Ignore storage quota errors
  }
}

export function addJoiningRequest(data: {
  name: string;
  email: string;
  role: Role;
  brand?: string;
  avatarUrl?: string;
}): JoiningRequest {
  const current = getJoiningRequests();
  const id = `req-${Date.now()}`;
  const activationToken = `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const roleTitleMap: Record<Role, string> = {
    creator: 'Content Creator · Design Studio',
    brand_manager: 'Brand Manager · Governance',
    admin: 'Platform Admin · Operations'
  };

  const newRequest: JoiningRequest = {
    id,
    name: data.name,
    email: data.email,
    role: data.role,
    roleTitle: roleTitleMap[data.role],
    brand: data.brand || 'NovaFit Health',
    connectionsCount: 1,
    requestedAt: 'Just now',
    status: 'pending',
    activationToken,
    avatarUrl: data.avatarUrl
  };

  const updated = [newRequest, ...current];
  saveJoiningRequests(updated);
  return newRequest;
}

export async function acceptJoiningRequest(id: string): Promise<{
  request: JoiningRequest | null;
  activationLink: string;
}> {
  const current = getJoiningRequests();
  let updatedRequest: JoiningRequest | null = null;

  const nextList = current.map(item => {
    if (item.id === id) {
      updatedRequest = { ...item, status: 'accepted' as const, requestedAt: 'Just approved' };
      return updatedRequest;
    }
    return item;
  });

  saveJoiningRequests(nextList);

  if (!updatedRequest) {
    return { request: null, activationLink: '' };
  }

  const req = updatedRequest as JoiningRequest;

  // Always use the live Vercel production domain for email activation links
  const baseAppUrl =
    typeof window !== 'undefined' && window.location.origin.includes('vercel.app')
      ? window.location.origin
      : VERCEL_PRODUCTION_URL;

  const activationLink = `${baseAppUrl}/login?mode=activate&email=${encodeURIComponent(
    req.email
  )}&name=${encodeURIComponent(req.name)}&role=${req.role}&brand=${encodeURIComponent(req.brand)}&token=${req.activationToken}`;

  // Register in user management with 'invited' status
  registerUser({
    name: req.name,
    email: req.email,
    role: req.role,
    status: 'invited',
    brands: [req.brand]
  });

  // Dispatch real email via backend API (supports both localhost and production Render)
  const payload = {
    to: req.email,
    name: req.name,
    role: req.role,
    brand: req.brand,
    activationLink
  };

  try {
    await client.post('/api/auth/send-invite', payload);
    console.log('[INVITE EMAIL] Successfully requested backend dispatch to:', req.email);
  } catch (err) {
    console.warn('[INVITE EMAIL] Primary dispatch attempt notice, trying fallbacks:', err);

    // Fallback 1: Direct to localhost backend if developer is running locally
    try {
      await fetch('http://localhost:5001/api/auth/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch {
      // Fallback 2: Direct to Render production backend
      try {
        await fetch('https://branddna-1-wndy.onrender.com/api/auth/send-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch {
        // Log final state
      }
    }
  }

  return { request: updatedRequest, activationLink };
}

export function declineJoiningRequest(id: string): void {
  const current = getJoiningRequests();
  const nextList = current.map(item => {
    if (item.id === id) {
      return { ...item, status: 'declined' as const };
    }
    return item;
  });
  saveJoiningRequests(nextList);
}

// ── User Management Storage for Google users & Activated Members ──

export function getRegisteredUsers(): WorkspaceUser[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_REGISTERED_USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRegisteredUsers(users: WorkspaceUser[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(users));
  } catch {
    // Ignore storage quota
  }
}

export function registerUser(user: {
  name: string;
  email: string;
  role: Role;
  status?: 'active' | 'invited' | 'suspended';
  initials?: string;
  brands?: string[];
}): WorkspaceUser {
  const current = getRegisteredUsers();
  const existing = current.find(u => u.email.toLowerCase() === user.email.toLowerCase());

  const initials =
    user.initials ||
    user.name
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ||
    'US';

  const newUser: WorkspaceUser = {
    id: existing ? existing.id : `user-${Date.now()}`,
    name: user.name,
    email: user.email,
    role: user.role,
    initials,
    status: user.status || 'active',
    lastActive: user.status === 'invited' ? 'Invite sent' : 'Online now',
    brands: user.brands || ['NovaFit Health', 'OmniCloud']
  };

  // Prepend so the newly signed-in or activated user is at the TOP of the user management table!
  const filtered = current.filter(u => u.email.toLowerCase() !== user.email.toLowerCase());
  const updated = [newUser, ...filtered];
  saveRegisteredUsers(updated);
  return newUser;
}
