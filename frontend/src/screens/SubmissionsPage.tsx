import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BadgeCheck, CircleAlert, CirclePlus, FileSearch, Hourglass, Inbox, PenLine, Search } from 'lucide-react';
import { MonoAvatar } from '@/components/mono/Brand';
import { Button, Card, EmptyState, ICON, PageHeader, Pill, ScoreBadge, Stagger, StatValue, TD, TH, TR, Tabs, focusRing } from '@/components/mono/ui';
import { StatusDot, type Tone } from '@/components/mono/status';
import { SUBMISSIONS, type Submission, type SubmissionStatus } from '@/data/demo';
import { cn } from '@/lib/cn';
import { useSession } from '@/state/session';
import type { LucideIcon } from 'lucide-react';
import { reviewsAPI } from '@/api/reviews';

type Filter = 'all' | 'needs_changes' | 'pending' | 'approved';

export const STATUS: Record<SubmissionStatus, { label: string; tone: Tone; icon: LucideIcon }> = {
  needs_changes: { label: 'Needs changes', tone: 'danger', icon: CircleAlert },
  pending: { label: 'Pending', tone: 'warning', icon: Hourglass },
  approved: { label: 'Approved', tone: 'success', icon: BadgeCheck },
  draft: { label: 'Draft', tone: 'neutral', icon: PenLine }
};

const ACTION: Record<SubmissionStatus, string> = {
  pending: 'View diagnostic',
  needs_changes: 'Open editor',
  approved: 'View certificate',
  draft: 'Continue draft'
};

const initials = (name: string) => name.split(' ').map(part => part[0]).join('');

/** "My Submissions & Drafts" (creator) and "All Submissions" (reviewer / admin). */
export function SubmissionsPage({ scope }: { scope: 'mine' | 'all' }) {
  const navigate = useNavigate();
  const { persona } = useSession();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [liveRows, setLiveRows] = useState<Submission[]>([]);

  useEffect(() => {
    reviewsAPI.getAll().then(res => {
      const data = res.data?.data?.reviews || res.data?.reviews || res.data;
      if (Array.isArray(data) && data.length > 0) {
        const mapped: Submission[] = data.map((item: any) => ({
          id: item._id || item.id,
          title: item.title || 'Marketing Content Review',
          channel: item.contentType || 'Social Post',
          brand: item.brand?.name || item.brandName || 'NovaFit',
          version: item.currentVersion || 1,
          score: item.overallScore || 95,
          status: (item.status === 'pending_review' ? 'pending' : item.status === 'in_review' ? 'pending' : item.status) as SubmissionStatus,
          reviewer: 'Sarah Chen',
          modified: 'Recently'
        }));
        setLiveRows(mapped);
      }
    }).catch(err => {
      console.warn('Backend submissions fetch notice:', err);
    });
  }, []);

  const allSubmissions = useMemo(() => {
    if (!liveRows.length) return SUBMISSIONS;
    const existingIds = new Set(liveRows.map(r => r.id));
    return [...liveRows, ...SUBMISSIONS.filter(s => !existingIds.has(s.id))];
  }, [liveRows]);

  const counts = useMemo(
    () => ({
      all: allSubmissions.length,
      needs_changes: allSubmissions.filter(s => s.status === 'needs_changes').length,
      pending: allSubmissions.filter(s => s.status === 'pending').length,
      approved: allSubmissions.filter(s => s.status === 'approved').length
    }),
    [allSubmissions]
  );
  const rows = allSubmissions.filter(s => (filter === 'all' || s.status === filter) && `${s.title} ${s.brand} ${s.channel}`.toLowerCase().includes(query.trim().toLowerCase()));
  const visible = expanded ? rows : rows.slice(0, 8);
  const open = (row: Submission) => navigate(row.status === 'approved' ? `/reviews/${row.id}?tab=compare` : `/reviews/${row.id}`);
  const mine = scope === 'mine';

  const summary = [
    { label: 'Total', value: counts.all, icon: FileSearch },
    { label: 'Needs changes', value: counts.needs_changes, icon: CircleAlert },
    { label: 'Pending sign-off', value: counts.pending, icon: Hourglass },
    { label: 'Approved', value: counts.approved, icon: BadgeCheck }
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={mine ? 'My Submissions & Drafts' : 'All Submissions'}
        subtitle={
          mine
            ? `${counts.needs_changes} assets need changes and ${counts.pending} are waiting on reviewer sign-off.`
            : 'Every asset sent through brand governance, across all isolated brand workspaces.'
        }
        actions={
          mine ? (
            <Button size="lg" onClick={() => navigate('/reviews/new')}>
              <CirclePlus className="size-5" {...ICON} /> New Content
            </Button>
          ) : (
            <Button size="lg" onClick={() => navigate(persona.role === 'reviewer' ? '/dashboard?role=reviewer' : '/dashboard/queue')}>
              <Inbox className="size-5" {...ICON} /> Open Approvals
            </Button>
          )
        }
      />

      {/* Card radius 24, padding 8 → tile radius 16. */}
      <Stagger index={1}>
        <Card className="grid grid-cols-2 gap-2 p-2 lg:grid-cols-4">
          {summary.map(item => (
            <div key={item.label} className="flex flex-col gap-2 rounded-item p-4 transition-colors hover:bg-silver/24">
              <p className="flex items-center gap-2 text-ui text-graphite">
                <item.icon className="size-4" {...ICON} /> {item.label}
              </p>
              <StatValue value={item.value} />
            </div>
          ))}
        </Card>
      </Stagger>

      <Stagger index={2}>
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 p-6">
            <Tabs
              label="Filter submissions"
              value={filter}
              onChange={id => {
                setFilter(id);
                setExpanded(false);
              }}
              items={[
                { id: 'all', label: 'All', count: counts.all },
                { id: 'needs_changes', label: 'Needs changes', count: counts.needs_changes },
                { id: 'pending', label: 'Pending', count: counts.pending },
                { id: 'approved', label: 'Approved', count: counts.approved }
              ]}
            />
            <label className="flex h-10 w-full items-center gap-2 rounded-full border border-silver px-4 transition-colors focus-within:border-ink sm:w-64">
              <Search className="size-4 shrink-0 text-graphite" {...ICON} />
              <span className="sr-only">Search submissions</span>
              <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search title or brand" className="min-w-0 flex-1 bg-transparent text-ui text-ink outline-none placeholder:text-mid" />
            </label>
          </div>

          {rows.length === 0 ? (
            <EmptyState icon={FileSearch} title="No submissions match">
              Try another filter or search term.
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left">
                <thead>
                  <tr>
                    <th className={cn(TH, 'pl-6')}>Title & channel</th>
                    <th className={TH}>Brand</th>
                    <th className={TH}>Version</th>
                    <th className={TH}>Compliance</th>
                    <th className={TH}>Reviewer decision</th>
                    <th className={TH}>Last modified</th>
                    <th className={cn(TH, 'pr-6 text-right')}>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(row => {
                    const status = STATUS[row.status];
                    return (
                      <tr key={row.id} className={TR}>
                        <td className={cn(TD, 'pl-6')}>
                          <p className="font-medium text-ink">{row.title}</p>
                          <p className="text-caption text-graphite">{row.channel}</p>
                        </td>
                        <td className={TD}>{row.brand}</td>
                        <td className={TD}>
                          <Pill variant="outline" caps={false}>
                            v{row.version}
                          </Pill>
                        </td>
                        <td className={TD}>
                          <ScoreBadge score={row.score} />
                        </td>
                        <td className={TD}>
                          <div className="flex items-center gap-2">
                            <StatusDot tone={status.tone}>{status.label}</StatusDot>
                            <MonoAvatar initials={initials(row.reviewer)} tone="silver" className="size-8" />
                            <span className="sr-only">Reviewer {row.reviewer}</span>
                          </div>
                        </td>
                        <td className={cn(TD, 'whitespace-nowrap')}>{row.modified}</td>
                        <td className={cn(TD, 'pr-6 text-right')}>
                          <Button variant={row.status === 'needs_changes' ? 'primary' : 'secondary'} size="sm" onClick={() => open(row)}>
                            {ACTION[row.status]} <ArrowRight className="size-4" {...ICON} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {rows.length > 8 && (
            <div className="flex items-center justify-between border-t border-silver px-6 py-3 text-caption text-graphite">
              <span>
                Showing {visible.length} of {rows.length}
              </span>
              <button type="button" onClick={() => setExpanded(value => !value)} className={cn('h-8 cursor-pointer rounded-full px-3 font-medium text-ink hover:bg-silver/24', focusRing)}>
                {expanded ? 'Show fewer' : `View all ${rows.length}`}
              </button>
            </div>
          )}
        </Card>
      </Stagger>
    </div>
  );
}
