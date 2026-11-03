import { BookOpen, Building2, CirclePlus, ClipboardList, FileCheck, FilePen, Inbox, LayoutGrid, UserCheck, UserCog, type LucideIcon } from 'lucide-react';
import { dashboardPath, type Role } from '@/state/session';

export interface NavBadge {
  /** Preferred text. */
  full: string;
  /** Used when label + full badge would not fit — the label is never truncated. */
  short: string;
}

export interface NavItem {
  label: string;
  icon: LucideIcon;
  to: string;
  match: (pathname: string) => boolean;
  badge?: NavBadge;
  count?: { value: number; urgent: boolean };
}

const on =
  (...paths: string[]) =>
  (pathname: string) =>
    paths.some(path => (path.endsWith('*') ? pathname.startsWith(path.slice(0, -1)) : pathname === path));

/** Persona → menu. The shell, states and styling are shared; only these items differ. */
export const NAV: Record<Role, NavItem[]> = {
  brand_manager: [
    { label: 'Brand Dashboard', icon: LayoutGrid, to: dashboardPath('brand_manager'), match: on('/dashboard') },
    { label: 'Approval Queue', icon: Inbox, to: '/dashboard/queue', match: on('/dashboard/queue', '/reviews/*'), badge: { full: 'Sign-off', short: 'Sign-off' } },
    { label: 'Brand Asset Library', icon: Building2, to: '/brand-manager/assets', match: on('/brand-manager/assets') },
    { label: 'Guideline Ingestion', icon: BookOpen, to: '/brand-manager/uploads', match: on('/brand-manager/uploads') },
    { label: 'All Submissions', icon: FileCheck, to: '/submissions', match: on('/submissions') },
    { label: 'Audit Log Ledger', icon: ClipboardList, to: '/audit', match: on('/audit') }
  ],
  admin: [
    { label: 'Platform Dashboard', icon: LayoutGrid, to: dashboardPath('admin'), match: on('/dashboard') },
    { label: 'Approval Queue', icon: Inbox, to: '/dashboard/queue', match: on('/dashboard/queue', '/reviews/*'), badge: { full: 'Sign-off', short: 'Sign-off' } },
    { label: 'Joining Requests', icon: UserCheck, to: '/admin/invitations', match: on('/admin/invitations'), badge: { full: 'Pending', short: 'Req' } },
    { label: 'User & Role Mgmt', icon: UserCog, to: '/admin/users', match: on('/admin/users') },
    { label: 'Brand Workspaces', icon: Building2, to: '/brands', match: on('/brands') },
    { label: 'All Submissions', icon: FileCheck, to: '/submissions', match: on('/submissions') },
    { label: 'Audit Log Ledger', icon: ClipboardList, to: '/audit', match: on('/audit') }
  ],
  creator: [
    { label: 'Creator Dashboard', icon: LayoutGrid, to: dashboardPath('creator'), match: on('/dashboard') },
    { label: 'New Content', icon: CirclePlus, to: '/reviews/new', match: on('/reviews/new') },
    { label: 'My Submissions & Drafts', icon: FilePen, to: '/dashboard/content', match: pathname => pathname === '/dashboard/content' || (pathname.startsWith('/reviews/') && pathname !== '/reviews/new') },
    { label: 'Brand Guidelines', icon: BookOpen, to: '/guidelines', match: on('/guidelines', '/brands') }
  ]
};
