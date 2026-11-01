import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { AlarmClock, ArrowRight, BadgeCheck, CheckCheck, Gauge, Inbox, MessageSquareWarning, ShieldCheck, Timer } from 'lucide-react';
import { HatchedBarChart, HeroStatCard } from '@/components/mono/accent';
import { MonoAvatar } from '@/components/mono/Brand';
import { FloatingTextArea } from '@/components/mono/FloatingField';
import { Button, Card, EmptyState, ICON, Modal, PageHeader, Pill, ScoreBadge, SectionHeader, Stagger, StatValue, Tabs, Tooltip, focusRing } from '@/components/mono/ui';
import { Banner, SeverityBadge, StatusBadge } from '@/components/mono/status';
import { QUEUE, type QueueItem, type QueueLane } from '@/data/demo';
import { cn } from '@/lib/cn';
import { DURATION, EASE } from '@/lib/motion';
import { canApprove, useSession } from '@/state/session';

/** Reviewer decisions per day (demo data): Approved = Almost Black, Changes requested = hatched orange. */
const WEEK = [
  { label: 'M', primary: 12, secondary: 4 },
  { label: 'T', primary: 15, secondary: 3 },
  { label: 'W', primary: 9, secondary: 5 },
  { label: 'T', primary: 14, secondary: 2 },
  { label: 'F', primary: 16, secondary: 4 }
];

const SELF_APPROVAL =
  'To prevent compliance leakage, content authors cannot approve their own submissions. Another authorized reviewer must sign off.';

const PRESETS = ['Adjust tone of voice', 'Verify pricing accuracy', 'Remove unbacked claims', 'Add required disclaimer'];

function Snippet({ text, flags }: { text: string; flags: string[] }) {
  if (!flags.length) return <>{text}</>;
  const pattern = new RegExp(`(${flags.map(flag => flag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  return (
    <>
      {text.split(pattern).map((part, i) =>
        flags.includes(part) ? (
          <mark key={i} className="rounded-min bg-silver px-1 font-medium text-ink">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

/** Severity counts in the muted status layer (always with text). */
function SeverityPills({ counts }: { counts: QueueItem['counts'] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {counts.critical > 0 && <SeverityBadge severity="critical" count={counts.critical} />}
      {counts.high > 0 && <SeverityBadge severity="high" count={counts.high} />}
      {counts.medium > 0 && <SeverityBadge severity="medium" count={counts.medium} />}
    </div>
  );
}

/** Card radius 24 · padding 24 → inner panels use the 4px floor. */
function QueueCard({ item, onApprove, onRequest }: { item: QueueItem; onApprove: () => void; onRequest: () => void }) {
  const navigate = useNavigate();
  const { persona } = useSession();
  const selfAuthored = item.author === persona.name;
  const approveBlocked = selfAuthored || !canApprove(persona.role);

  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: DURATION.base, ease: EASE }}>
      <Card as="article" className="flex h-full flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-caption text-graphite">
              <span className="font-medium text-ink">{item.brand}</span> · {item.channel}
            </p>
            <h3 className="font-display text-subheading font-semibold text-ink">{item.title}</h3>
          </div>
          <ScoreBadge score={item.score} />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-caption text-graphite">
          <MonoAvatar initials={item.authorInitials} className="size-8" />
          <span className="font-medium text-ink">{item.author}</span>
          {selfAuthored && <Pill variant="outline">You</Pill>}
          <span>· {item.submitted}</span>
          {item.due && (
            <StatusBadge tone="warning" icon={AlarmClock} caps={false} className="ml-auto">
              {item.due}
            </StatusBadge>
          )}
        </div>

        {item.lane !== 'approved' && (
          <>
            <SeverityPills counts={item.counts} />
            <p className="rounded-min border border-silver bg-silver/24 p-4 text-body text-graphite">
              <Snippet text={item.snippet} flags={item.flags} />
            </p>
          </>
        )}

        {item.note && (
          <p className="flex gap-2 rounded-min border-l-2 border-graphite bg-silver/24 p-4 text-caption leading-copy text-graphite">
            <MessageSquareWarning className="size-4 shrink-0 text-ink" {...ICON} />
            <span>
              <span className="font-semibold text-ink">Revision requested:</span> {item.note}
            </span>
          </p>
        )}

        {item.lane === 'approved' ? (
          <div className="mt-auto flex items-center justify-between gap-4 rounded-min bg-silver/40 p-3 pl-4">
            <span className="flex items-center gap-2 text-caption font-medium text-ink">
              <BadgeCheck className="size-4" {...ICON} /> Sealed · {item.certificate}
            </span>
            <Button variant="ghost" size="sm" onClick={() => navigate('/reviews/rev-1049?tab=compare')}>
              View audit
            </Button>
          </div>
        ) : (
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
            <Button size="sm" onClick={() => navigate('/reviews/rev-1049?tab=compare')}>
              Review & Diff <ArrowRight className="size-4" {...ICON} />
            </Button>
            {item.lane === 'urgent' &&
              (approveBlocked ? (
                <Tooltip content={selfAuthored ? SELF_APPROVAL : 'Only reviewers and admins can approve submissions.'}>
                  <Button variant="secondary" size="sm" disabled>
                    <ShieldCheck className="size-4" {...ICON} /> Quick Approve
                  </Button>
                </Tooltip>
              ) : (
                <Button variant="secondary" size="sm" onClick={onApprove}>
                  <ShieldCheck className="size-4" {...ICON} /> Quick Approve
                </Button>
              ))}
            {item.lane === 'urgent' && (
              <Button variant="ghost" size="sm" onClick={onRequest} disabled={!canApprove(persona.role)}>
                Request Revisions
              </Button>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
}

export function ReviewerQueue() {
  const { persona } = useSession();
  const [items, setItems] = useState(QUEUE);
  const [lane, setLane] = useState<QueueLane>('urgent');
  const [requesting, setRequesting] = useState<QueueItem | null>(null);
  const [note, setNote] = useState('');
  const [presets, setPresets] = useState<string[]>([]);

  const inLane = (value: QueueLane) => items.filter(item => item.lane === value);
  const urgentCount = inLane('urgent').length;
  const move = (id: string, patch: Partial<QueueItem>) => setItems(list => list.map(item => (item.id === id ? { ...item, ...patch } : item)));

  const approve = (item: QueueItem) =>
    move(item.id, { lane: 'approved', submitted: 'Approved just now', certificate: `CERT-${8842 + items.filter(i => i.lane === 'approved').length}`, note: undefined, due: undefined });

  const sendRequest = () => {
    if (!requesting) return;
    const prefix = presets.length ? `${presets.join(' · ')}. ` : '';
    move(requesting.id, { lane: 'changes', note: `${prefix}${note.trim()}`, due: undefined });
    setRequesting(null);
    setNote('');
    setPresets([]);
  };

  const laneItems = inLane(lane);
  const title = persona.role === 'reviewer' ? 'Approvals' : 'Approval Queue';

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={title}
        subtitle="Deterministic checks are already cleared. Verify the diff, then sign off."
        actions={
          <Tabs
            label="Queue lanes"
            value={lane}
            onChange={setLane}
            items={[
              { id: 'urgent', label: 'Urgent sign-off', count: urgentCount },
              { id: 'changes', label: 'Needs changes', count: inLane('changes').length },
              { id: 'approved', label: 'Approved today', count: inLane('approved').length }
            ]}
          />
        }
      />

      {urgentCount > 0 && (
        <Banner
          tone="warning"
          className="-mt-2"
          title={`${urgentCount} urgent campaign ${urgentCount === 1 ? 'asset requires' : 'assets require'} sign-off before Friday 5:00 PM EST launch.`}
          action={
            lane !== 'urgent' && (
              <Button variant="secondary" size="sm" onClick={() => setLane('urgent')}>
                View urgent
              </Button>
            )
          }
        />
      )}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          {laneItems.length === 0 ? (
            <Card>
              <EmptyState icon={CheckCheck} title="All caught up!">
                No campaign assets pending review.
              </EmptyState>
            </Card>
          ) : (
            <motion.div layout className="grid gap-6 lg:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {laneItems.map(item => (
                  <QueueCard key={item.id} item={item} onApprove={() => approve(item)} onRequest={() => setRequesting(item)} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        <aside className="flex flex-col gap-8">
          {/* The screen's single orange hero: what still needs sign-off. */}
          <HeroStatCard
            label="Needs sign-off"
            value={urgentCount}
            countKey={String(urgentCount)}
            icon={Inbox}
            caption={`${inLane('changes').length} more waiting on author changes`}
          />
          <Stagger index={1}>
            <SectionHeader title="Throughput" />
            <Card className="mt-4 flex flex-col gap-4 p-6">
              <div className="flex flex-col gap-1">
                <p className="text-ui text-graphite">Approved today</p>
                <StatValue key={inLane('approved').length} value={inLane('approved').length} />
              </div>
              <div className="flex flex-col gap-3 border-t border-silver pt-4 text-ui text-graphite">
                <p className="flex items-center gap-3">
                  <Timer className="size-5 text-ink" {...ICON} /> Avg. sign-off <span className="ml-auto font-semibold text-ink tabular-nums">4m 12s</span>
                </p>
                <p className="flex items-center gap-3">
                  <Gauge className="size-5 text-ink" {...ICON} /> Avg. score <span className="ml-auto font-semibold text-ink tabular-nums">95.1</span>
                </p>
              </div>
            </Card>
          </Stagger>
          <Stagger index={2}>
            <SectionHeader title="This week" />
            <Card className="mt-4 p-6">
              <HatchedBarChart
                label="Decisions this week"
                data={WEEK}
                max={20}
                ticks={[20, 10, 0]}
                height="h-32"
                primaryLabel="Approved"
                secondaryLabel="Changes requested"
                highlight={WEEK.length - 1}
              />
            </Card>
          </Stagger>
          <Stagger index={3}>
            <SectionHeader title="Triage tip" />
            <Card className="mt-4 p-6">
              <p className="text-body text-graphite">
                Assets scoring 90+ have passed every deterministic pricing and terminology rule. Fast-track them, then spend time on tone and claims.
              </p>
            </Card>
          </Stagger>
        </aside>
      </div>

      <Modal
        open={requesting !== null}
        onClose={() => setRequesting(null)}
        title={`Request revisions from ${requesting?.author ?? ''}`}
        description="Specify exact feedback so the author can resolve brand or factual issues."
        footer={
          <>
            <Button variant="secondary" onClick={() => setRequesting(null)}>
              Cancel
            </Button>
            <Button disabled={!note.trim()} onClick={sendRequest}>
              Send Revision Request <ArrowRight className="size-4" {...ICON} />
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(preset => {
              const pressed = presets.includes(preset);
              return (
                <button
                  key={preset}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => setPresets(list => (list.includes(preset) ? list.filter(item => item !== preset) : [...list, preset]))}
                  className={cn(
                    'press h-8 cursor-pointer rounded-full border px-3 text-caption font-medium transition-colors',
                    focusRing,
                    pressed ? 'border-ink bg-ink text-paper' : 'border-silver bg-paper text-graphite hover:border-mid hover:text-ink'
                  )}
                >
                  {preset}
                </button>
              );
            })}
          </div>
          <FloatingTextArea label="Revision notes (required)" value={note} onChange={event => setNote(event.target.value)} hint="e.g. Tone is still promotional in line 3; reframe around member benefits." />
        </div>
      </Modal>
    </div>
  );
}
