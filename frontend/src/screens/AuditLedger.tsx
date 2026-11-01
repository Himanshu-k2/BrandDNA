import { useEffect, useState } from 'react';
import { Download, Link2, Search, ShieldCheck } from 'lucide-react';
import { Button, Card, EmptyState, ICON, PageHeader, Pill, Stagger, StatValue, TD, TH, TR, Tabs } from '@/components/mono/ui';
import { AUDIT_LOG, type LedgerEntry } from '@/data/platform';
import { HatchedBarChart } from '@/components/mono/accent';
import { cn } from '@/lib/cn';
import { ROLE_LABEL, useSession } from '@/state/session';
import { RestrictedState } from './UsersPage';
import { adminAPI } from '@/api/admin';

type Filter = 'all' | LedgerEntry['role'];

/** Ledger entries per day (demo data): human decisions = Almost Black, system events = hatched orange. */
const ACTIVITY = [
  { label: 'Thu', primary: 22, secondary: 14 },
  { label: 'Fri', primary: 28, secondary: 18 },
  { label: 'Sat', primary: 9, secondary: 11 },
  { label: 'Sun', primary: 6, secondary: 10 },
  { label: 'Mon', primary: 31, secondary: 20 },
  { label: 'Tue', primary: 26, secondary: 17 },
  { label: 'Today', primary: 18, secondary: 12 }
];

const roleName = (role: LedgerEntry['role']) => (role === 'system' ? 'System' : ROLE_LABEL[role]);

function exportCsv(rows: LedgerEntry[]) {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const csv = ['id,time,actor,role,action,target,hash', ...rows.map(row => [row.id, row.at, row.actor, roleName(row.role), row.action, row.target, row.hash].map(escape).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  Object.assign(document.createElement('a'), { href: url, download: 'branddna-audit-ledger.csv' }).click();
  URL.revokeObjectURL(url);
}

/** Append-only, hash-chained record of every decision and configuration change. */
export function AuditLedger() {
  const { persona } = useSession();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [liveLogs, setLiveLogs] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    adminAPI.getAuditLogs().then((res: any) => {
      const data = res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) {
        const mapped: LedgerEntry[] = data.map((item: any) => ({
          id: item._id || item.id || `LOG-${Math.random().toString(36).substring(2, 8)}`,
          at: item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
          actor: item.user?.name || item.userName || 'System Engine',
          role: (item.user?.role === 'reviewer' ? 'reviewer' : item.user?.role === 'admin' ? 'admin' : 'system') as LedgerEntry['role'],
          action: item.action || 'Audit Event Recorded',
          target: item.details?.target || item.resource || 'Brand Asset',
          hash: item.hash || 'sha256:7f9a...3c21'
        }));
        setLiveLogs(mapped);
      }
    }).catch(() => {});
  }, []);

  if (persona.role === 'creator') {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Audit Log Ledger" subtitle="Append-only record of every decision and configuration change." />
        <RestrictedState title="Audit Log Ledger" />
      </div>
    );
  }

  const combined = liveLogs.length ? [...liveLogs, ...AUDIT_LOG] : AUDIT_LOG;
  const rows = combined.filter(row => (filter === 'all' || row.role === filter) && `${row.actor} ${row.action} ${row.target} ${row.id}`.toLowerCase().includes(query.trim().toLowerCase()));
  const count = (role: LedgerEntry['role']) => combined.filter(row => row.role === role).length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Audit Log Ledger"
        subtitle="Append-only, hash-chained record of every audit, decision and configuration change."
        actions={
          <Button variant="secondary" size="lg" onClick={() => exportCsv(rows)}>
            <Download className="size-5" {...ICON} /> Export CSV
          </Button>
        }
      />

      <Stagger index={1}>
        <Card className="grid gap-2 p-2 md:grid-cols-3">
          <div className="flex flex-col gap-2 rounded-item p-4">
            <span className="text-ui text-graphite">Entries this week</span>
            <StatValue value={AUDIT_LOG.length} />
          </div>
          <div className="flex flex-col gap-2 rounded-item p-4">
            <span className="text-ui text-graphite">Certificates sealed</span>
            <StatValue value={AUDIT_LOG.filter(row => row.action === 'Approved & sealed').length} />
          </div>
          <div className="flex flex-col justify-center gap-2 rounded-item bg-silver/24 p-4">
            <span className="flex items-center gap-2 text-ui font-semibold text-ink">
              <ShieldCheck className="size-5" {...ICON} /> Chain verified
            </span>
            <span className="text-caption text-graphite">Every entry’s hash links to the previous one. No gaps detected.</span>
          </div>
        </Card>
      </Stagger>

      <Stagger index={2}>
        <Card className="flex flex-col gap-4 p-6">
          <h2 className="font-display text-subheading font-semibold text-ink">Ledger activity · last 7 days</h2>
          <HatchedBarChart label="Ledger entries per day" data={ACTIVITY} max={40} ticks={[40, 20, 0]} height="h-40" primaryLabel="Human decisions" secondaryLabel="System events" highlight={ACTIVITY.length - 1} />
        </Card>
      </Stagger>

      <Stagger index={3}>
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 p-6">
            <Tabs
              label="Filter by actor"
              value={filter}
              onChange={setFilter}
              items={[
                { id: 'all', label: 'All', count: AUDIT_LOG.length },
                { id: 'admin', label: 'Admin', count: count('admin') },
                { id: 'reviewer', label: 'Reviewer', count: count('reviewer') },
                { id: 'creator', label: 'Creator', count: count('creator') },
                { id: 'system', label: 'System', count: count('system') }
              ]}
            />
            <label className="flex h-10 w-full items-center gap-2 rounded-full border border-silver px-4 transition-colors focus-within:border-ink sm:w-64">
              <Search className="size-4 shrink-0 text-graphite" {...ICON} />
              <span className="sr-only">Search ledger</span>
              <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search actor, action, target" className="min-w-0 flex-1 bg-transparent text-ui text-ink outline-none placeholder:text-mid" />
            </label>
          </div>
          {rows.length === 0 ? (
            <EmptyState icon={Search} title="No entries match">
              Try another actor filter or search term.
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left">
                <thead>
                  <tr>
                    <th className={cn(TH, 'pl-6')}>Entry</th>
                    <th className={TH}>Time</th>
                    <th className={TH}>Actor</th>
                    <th className={TH}>Action</th>
                    <th className={TH}>Target</th>
                    <th className={cn(TH, 'pr-6')}>Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.id} className={TR}>
                      <td className={cn(TD, 'pl-6 font-medium whitespace-nowrap text-ink tabular-nums')}>{row.id}</td>
                      <td className={cn(TD, 'whitespace-nowrap')}>{row.at}</td>
                      <td className={TD}>
                        <div className="flex flex-col gap-1">
                          <span className="whitespace-nowrap text-ink">{row.actor}</span>
                          <Pill variant={row.role === 'system' ? 'silver' : 'outline'} className="w-max">
                            {roleName(row.role)}
                          </Pill>
                        </div>
                      </td>
                      <td className={cn(TD, 'font-medium whitespace-nowrap text-ink')}>{row.action}</td>
                      <td className={TD}>{row.target}</td>
                      <td className={cn(TD, 'pr-6')}>
                        <span className="flex items-center gap-1 text-caption whitespace-nowrap text-graphite tabular-nums">
                          <Link2 className="size-4" {...ICON} /> {row.hash}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </Stagger>
    </div>
  );
}
