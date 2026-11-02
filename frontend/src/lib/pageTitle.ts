import type { Role } from '@/state/session';

const DASHBOARD: Record<Role, string> = {
  creator: 'Creator Dashboard',
  admin: 'Platform Dashboard',
  brand_manager: 'Brand Manager Dashboard'
};

const STATIC: Record<string, string> = {
  '/login': 'Log in',
  '/reviews/new': 'Create new content',
  '/dashboard/content': 'My Submissions & Drafts',
  '/dashboard/queue': 'Approval Queue',
  '/brand-manager/assets': 'Brand Asset Library',
  '/brand-manager/uploads': 'Guideline Ingestion',
  '/submissions': 'All Submissions',
  '/brands': 'Brand Workspaces',
  '/alerts': 'System Alerts',
  '/notifications': 'Notifications',
  '/admin/users': 'User & Role Mgmt',
  '/audit': 'Audit Log Ledger',
  '/guidelines': 'Brand Guidelines Hub',
  '/settings': 'Settings',
  '/brand': 'Logo guidelines',
  '/design-system': 'Design system'
};

/** Browser tab title: "Page name | BrandDNA". Mirrors the visible page names; no routing logic. */
export function pageTitle(pathname: string, search: string, role: Role) {
  let name = STATIC[pathname];
  if (!name && pathname === '/dashboard') {
    const param = new URLSearchParams(search).get('role');
    name = DASHBOARD[param === 'creator' || param === 'admin' || param === 'brand_manager' ? param : role];
  }
  if (!name && pathname.startsWith('/reviews/')) name = 'Review';
  return name ? `${name} | BrandDNA` : 'BrandDNA';
}
