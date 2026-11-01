import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { AlarmClock, BellOff, BookOpen, CheckCheck, CircleAlert, MessageSquareText, ServerCog, Tag, type LucideIcon } from 'lucide-react';
import { Button, Card, EmptyState, ICON, PageHeader, Pill, Stagger, Tabs, focusRing } from '@/components/mono/ui';
import { StatusBadge } from '@/components/mono/status';
import { ALERTS, type AlertKind } from '@/data/platform';
import { cn } from '@/lib/cn';
import { DURATION, EASE } from '@/lib/motion';
import { useSession } from '@/state/session';
import { notificationsAPI } from '@/api/notifications';

const KIND: Record<AlertKind, { icon: LucideIcon; label: string }> = {
  sla: { icon: AlarmClock, label: 'Deadline' },
  review: { icon: MessageSquareText, label: 'Review' },
  pricing: { icon: Tag, label: 'Pricing' },
  guideline: { icon: BookOpen, label: 'Guideline' },
  system: { icon: ServerCog, label: 'System' }
};

type Filter = 'all' | 'urgent' | 'unread';

/** "System Alerts" (reviewer / admin) and "Notifications" (creator). List card radius 24 · padding 8 → rows 16 · row padding 12 → icon chip 4. */
export function AlertsPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { persona } = useSession();
  const [filter, setFilter] = useState<Filter>('all');
  const [read, setRead] = useState<Set<string>>(new Set());
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);
  const notifications = pathname === '/notifications';

  useEffect(() => {
    notificationsAPI.getAll().then(res => {
      const data = res.data?.data?.notifications || res.data?.notifications || res.data;
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((n: any) => ({
          id: n._id || n.id,
          kind: 'review' as AlertKind,
          title: n.title || 'Brand Governance Update',
          body: n.message || n.body || 'Review status update recorded.',
          time: 'Recently',
          audience: ['creator', 'reviewer', 'admin'],
          urgent: n.priority === 'urgent' || n.priority === 'high'
        }));
        setLiveAlerts(mapped);
      }
    }).catch(err => {
      console.warn('Backend notifications fetch notice:', err);
    });
  }, []);

  const combinedAlerts = useMemo(() => {
    if (!liveAlerts.length) return ALERTS;
    return [...liveAlerts, ...ALERTS];
  }, [liveAlerts]);

  const mine = useMemo(() => combinedAlerts.filter(alert => alert.audience.includes(persona.role)), [combinedAlerts, persona.role]);
  const rows = mine.filter(alert => (filter === 'urgent' ? alert.urgent : filter === 'unread' ? !read.has(alert.id) : true));
  const unread = mine.filter(alert => !read.has(alert.id)).length;

  const markAll = () => {
    setRead(new Set(mine.map(alert => alert.id)));
    notificationsAPI.markAllAsRead().catch(() => {});
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={notifications ? 'Notifications' : 'System Alerts'}
        subtitle={notifications ? 'Review decisions, guideline changes and deadlines for your content.' : 'Deadlines, rule changes and engine health across every brand workspace.'}
        actions={
          <Button variant="secondary" size="lg" disabled={unread === 0} onClick={markAll}>
            <CheckCheck className="size-5" {...ICON} /> Mark all as read
          </Button>
        }
      />

      <Tabs
        label="Filter alerts"
        value={filter}
        onChange={setFilter}
        items={[
          { id: 'all', label: 'All', count: mine.length },
          { id: 'urgent', label: 'Urgent', count: mine.filter(alert => alert.urgent).length },
          { id: 'unread', label: 'Unread', count: unread }
        ]}
      />

      <Stagger index={1}>
        <Card className="p-2">
          {rows.length === 0 ? (
            <EmptyState icon={BellOff} title="Nothing here">
              You’re all caught up on {filter === 'all' ? 'alerts' : `${filter} alerts`}.
            </EmptyState>
          ) : (
            <ul className="flex flex-col">
              <AnimatePresence initial={false}>
                {rows.map(alert => {
                  const kind = KIND[(alert.kind as AlertKind) in KIND ? (alert.kind as AlertKind) : 'system'];
                  const isRead = read.has(alert.id);
                  return (
                    <motion.li key={alert.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: DURATION.fast, ease: EASE }}>
                      <button
                        type="button"
                        onClick={() => {
                          setRead(set => new Set(set).add(alert.id));
                          if (alert.to) navigate(alert.to);
                        }}
                        className={cn('flex w-full cursor-pointer items-start gap-3 rounded-item p-3 text-left transition-colors hover:bg-silver/24', focusRing)}
                      >
                        <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-min', isRead ? 'bg-silver/40 text-graphite' : 'bg-ink text-paper')}>
                          <kind.icon className="size-5" {...ICON} />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className={cn('text-ui text-ink', !isRead && 'font-semibold')}>{alert.title}</span>
                            {alert.urgent && (
                              <StatusBadge tone="danger" icon={CircleAlert}>
                                Urgent
                              </StatusBadge>
                            )}
                            <Pill variant="outline">{kind.label}</Pill>
                          </span>
                          <span className="text-body text-graphite">{alert.body}</span>
                          <span className="text-caption text-mid">
                            {alert.time}
                            {!isRead && ' · Unread'}
                          </span>
                        </span>
                        {!isRead && <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-ink" />}
                      </button>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </Card>
      </Stagger>
    </div>
  );
}
