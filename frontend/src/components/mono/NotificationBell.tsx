import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useSession } from '@/state/session';
import { ALERTS } from '@/data/platform';
import { getUnreadMessagesForRole } from '@/lib/personaMessages';

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

const READ_STORAGE_KEY = 'branddna_read_alerts';

export function getReadAlertIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function markAlertsAsRead(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    const current = getReadAlertIds();
    ids.forEach(id => current.add(id));
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(current)));
    window.dispatchEvent(new CustomEvent('branddna:alerts_read'));
  } catch {}
}

export function NotificationBell({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { persona } = useSession();
  const [readIds, setReadIds] = useState<Set<string>>(getReadAlertIds);
  const [unreadPersonaMsgs, setUnreadPersonaMsgs] = useState(0);

  useEffect(() => {
    const update = () => {
      setReadIds(getReadAlertIds());
      setUnreadPersonaMsgs(getUnreadMessagesForRole(persona.role).length);
    };

    update();
    window.addEventListener('branddna:alerts_read', update);
    window.addEventListener('branddna:persona_message', update);
    window.addEventListener('storage', update);

    return () => {
      window.removeEventListener('branddna:alerts_read', update);
      window.removeEventListener('branddna:persona_message', update);
      window.removeEventListener('storage', update);
    };
  }, [persona.role]);

  const targetPath = persona.role === 'creator' ? '/notifications' : '/alerts';
  const isActive = pathname === targetPath;

  // Unread system alerts for current role
  const unreadAlertsCount = useMemo(() => {
    const targetRole = persona.role === 'brand_manager' ? 'reviewer' : persona.role;
    const applicable = ALERTS.filter(alert => alert.audience.includes(targetRole));
    return applicable.filter(alert => !readIds.has(alert.id)).length;
  }, [persona.role, readIds]);

  const totalUnread = unreadAlertsCount + unreadPersonaMsgs;
  const hasUnread = totalUnread > 0;

  return (
    <button
      type="button"
      onClick={() => navigate(targetPath)}
      aria-label={`Notifications${totalUnread > 0 ? `, ${totalUnread} unread` : ''}`}
      title={totalUnread > 0 ? `Notifications (${totalUnread} unread)` : 'Notifications'}
      className={cn(
        'relative press flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-silver bg-paper text-ink shadow-sm transition-[background-color,border-color,transform] duration-200 hover:border-mid hover:bg-silver/24 active:scale-95',
        focusRing,
        isActive && 'border-ink bg-silver/20',
        className
      )}
    >
      <Bell className="size-5 text-ink" strokeWidth={1.5} />
      {hasUnread && (
        <span className="absolute top-2.5 right-2.5 flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-orange opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-brand-orange ring-2 ring-paper" />
        </span>
      )}
    </button>
  );
}
