import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  FileCheck2,
  PlusCircle,
  Inbox,
  Bell,
  Users,
  FileText,
  UploadCloud,
  Palette,
  ShieldAlert,
  ClipboardList,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ open, onClose }) {
  const { user, isPlatformAdmin, isReviewer, isBrandManager, isContentCreator, getRoleDisplayName, getDashboardRoute } = useAuth();

  // Navigation Items by Role
  const adminLinks = [
    { to: '/admin/dashboard', label: 'Platform Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'User & Role Mgmt', icon: Users },
    { to: '/brands', label: 'Brand Workspaces', icon: Building2 },
    { to: '/review-queue', label: 'Approval Queue', icon: Inbox, badge: 'Sign-off' },
    { to: '/reviews', label: 'All Submissions', icon: FileCheck2 },
    { to: '/admin/audit-logs', label: 'Audit Log Ledger', icon: ClipboardList },
    { to: '/notifications', label: 'System Alerts', icon: Bell }
  ];

  const reviewerLinks = [
    { to: '/review-queue', label: 'Approval Queue', icon: Inbox, badge: 'Needs Sign-off', highlight: true },
    { to: '/reviews', label: 'All Submissions', icon: FileCheck2 },
    { to: '/brands', label: 'Brand Workspaces', icon: Building2 },
    { to: '/notifications', label: 'System Alerts', icon: Bell }
  ];

  const brandManagerLinks = [
    { to: '/brand-manager/dashboard', label: 'Brand Overview', icon: LayoutDashboard },
    { to: '/brands', label: 'Guidelines & Facts', icon: Building2 },
    { to: '/brand-manager/assets', label: 'Brand Asset Library', icon: Palette },
    { to: '/brand-manager/uploads', label: 'Upload & Extract (PDF)', icon: UploadCloud, highlight: true },
    { to: '/reviews/new', label: 'Test Content Review', icon: PlusCircle },
    { to: '/reviews', label: 'Review History', icon: FileCheck2 },
    { to: '/notifications', label: 'Notifications', icon: Bell }
  ];

  const creatorLinks = [
    { to: '/creator/dashboard', label: 'Creator Dashboard', icon: LayoutDashboard },
    { to: '/reviews/new', label: 'Check New Content', icon: PlusCircle, highlight: true },
    { to: '/reviews', label: 'My Submissions & Drafts', icon: FileCheck2 },
    { to: '/brands', label: 'Brand Guidelines Hub', icon: Building2 },
    { to: '/notifications', label: 'Notifications', icon: Bell }
  ];

  let currentLinks = creatorLinks;
  if (isPlatformAdmin) {
    currentLinks = adminLinks;
  } else if (isReviewer) {
    currentLinks = reviewerLinks;
  } else if (isBrandManager) {
    currentLinks = brandManagerLinks;
  }

  const navClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
      isActive
        ? 'bg-teal-50 text-teal-800 font-bold shadow-xs border border-teal-100/80'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-1 overflow-y-auto">
          <div className="px-3 py-1.5 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
              Workspace Role
            </span>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md inline-block border border-teal-200/60 mt-1">
              {getRoleDisplayName()}
            </span>
          </div>

          <nav className="space-y-1">
            {currentLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={navClass}
              >
                <item.icon
                  className={`h-4.5 w-4.5 ${
                    item.highlight ? 'text-teal-600' : 'text-slate-500'
                  }`}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md border border-amber-200">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom Workspace Badge */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              NF
            </div>
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-xs font-bold text-slate-800 truncate">NovaFit Health</span>
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active Brand
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
