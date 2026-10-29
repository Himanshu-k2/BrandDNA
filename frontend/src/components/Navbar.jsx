import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../api/notifications';
import { ShieldCheck, Bell, LogOut, Menu, X, Sparkles } from 'lucide-react';

export default function Navbar({ onMenuToggle, menuOpen }) {
  const { user, logout, getRoleDisplayName, getDashboardRoute } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchUnread = async () => {
      if (!user) return;
      try {
        const { data } = await notificationsAPI.getAll({ unreadOnly: true });
        if (isMounted) {
          const list = Array.isArray(data) ? data : data?.data || [];
          setUnreadCount(list.length);
        }
      } catch {
        // Silent fail for polling
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColors = {
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    platform_admin: 'bg-purple-100 text-purple-700 border-purple-200',
    reviewer: 'bg-blue-100 text-blue-700 border-blue-200',
    brand_manager: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    creator: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    content_creator: 'bg-emerald-100 text-emerald-700 border-emerald-200'
  };

  return (
    <header className="sticky top-0 z-40 bg-navy-900 border-b border-navy-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section: Logo & Mobile Toggle */}
          <div className="flex items-center gap-3.5">
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-xl text-navy-300 hover:text-white hover:bg-navy-800 transition-colors"
              aria-label="Toggle Navigation"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link to={getDashboardRoute()} className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  Brand<span className="text-teal-400">DNA</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    AI
                  </span>
                </span>
              </div>
            </Link>
          </div>

          {/* Right section: Notifications & Profile */}
          <div className="flex items-center gap-3">
            <Link
              to="/notifications"
              className="relative p-2 rounded-xl text-navy-300 hover:text-white hover:bg-navy-800 transition-colors"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-teal-400 text-navy-950 font-bold text-[10px] rounded-full flex items-center justify-center shadow-sm animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            <div className="h-5 w-px bg-navy-800 hidden sm:block"></div>

            {/* User Pill */}
            {user && (
              <div className="flex items-center gap-2.5 pl-1">
                <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 font-bold text-xs flex items-center justify-center uppercase">
                  {user.name?.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-white leading-tight">{user.name}</span>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border mt-0.5 inline-block ${
                      roleColors[user.role] || 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {getRoleDisplayName()}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="ml-2 p-2 rounded-xl text-navy-300 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-4.5 w-4.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
