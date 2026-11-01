import { useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck, CircleAlert, CircleCheck, Download, Minus, Plus, ShieldCheck, TrendingUp, X } from 'lucide-react';
import { FloatingTextArea } from '@/components/mono/FloatingField';
import { Button, Card, ICON, Pill, ScoreBadge, Tabs, Tooltip } from '@/components/mono/ui';
import { cn } from '@/lib/cn';
import { diffStats, diffWords, toLines, type DiffOp } from '@/lib/diff';
import { auditDraft, NOVAFIT_RULES } from '@/lib/rules';

export const SELF_APPROVAL_COPY =
  'To prevent compliance leakage, content authors cannot approve their own submissions. Another authorized reviewer must sign off.';

export interface Decision {
  kind: 'approved' | 'changes' | 'rejected';
  by: string;
  at: string;
  note: string;
  certificate?: string;
  hash?: string;
}

/** Insertions: silver fill + underline. Deletions: struck through in graphite. Never colour alone. */
const SEGMENT: Record<DiffOp['type'], string> = {
  eq: 'text-graphite',
  del: 'rounded-min px-1 text-graphite line-through decoration-graphite',
  ins: 'rounded-min bg-silver px-1 font-medium text-ink underline decoration-ink underline-offset-4'
};

function DiffLines({ lines }: { lines: DiffOp[][] }) {
  return (
    <ol className="py-2 text-body">
      {lines.map((line, i) => {
        const changed = line.some(op => op.type !== 'eq');
        const onlyIns = line.length > 0 && line.every(op => op.type === 'ins');
        const onlyDel = line.length > 0 && line.every(op => op.type === 'del');
        const marker = onlyIns ? '+' : onlyDel ? '−' : changed ? '~' : '';
        return (
          <li key={i} className={cn('grid grid-cols-[40px_24px_1fr] py-1 pr-4', changed && 'bg-silver/24')}>
            <span className="pr-2 text-right text-caption leading-copy text-mid tabular-nums select-none">{i + 1}</span>
            <span className="text-caption leading-copy font-semibold text-ink select-none" aria-label={onlyIns ? 'added line' : onlyDel ? 'removed line' : changed ? 'changed line' : undefined}>
              {marker}
            </span>
            <span className="min-w-0 break-words">
              {line.length === 0 ? '\u00a0' : line.map((op, j) => <span key={j} className={SEGMENT[op.type]}>{op.text}</span>)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function downloadCertificate(decision: Decision, text: string, score: number) {
  const body = [
    'BRANDDNA BRAND GOVERNANCE CERTIFICATE',
    `Certificate: ${decision.certificate}`,
    'Organization: NovaFit Health Systems',
    'Campaign: Summer Campaign Copy (REV-1049)',
    `Compliance score: ${score}/100`,
    `Authorized reviewer: ${decision.by}`,
    `Sealed at: ${decision.at}`,
    `Content hash: ${decision.hash}`,
    decision.note ? `Reviewer note: ${decision.note}` : '',
    '',
    '--- Approved copy ---',
    text
  ].join('\n');
  const url = URL.createObjectURL(new Blob([body], { type: 'text/plain' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${decision.certificate}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

export function CompareVersions({
  base,
  next,
  nextLabel,
  canDecide,
  blockedReason,
  decision,
  onDecide
}: {
  base: string;
  next: string;
  nextLabel: string;
  canDecide: boolean;
  blockedReason?: string;
  decision: Decision | null;
  onDecide: (kind: Decision['kind'], note: string) => void;
}) {
  const [view, setView] = useState<'unified' | 'split'>('unified');
  const [note, setNote] = useState('');
  const [needsNote, setNeedsNote] = useState(false);
  const ops = useMemo(() => diffWords(base, next), [base, next]);
  const stats = diffStats(ops);
  const baseAudit = auditDraft(base);
  const nextAudit = auditDraft(next);
  const delta = nextAudit.score - baseAudit.score;
  const baseViolations = NOVAFIT_RULES.filter(rule => rule.violated(base));
  const resolved = baseViolations.filter(rule => !rule.violated(next));
  const remaining = NOVAFIT_RULES.filter(rule => rule.violated(next));

  const decide = (kind: Decision['kind']) => {
    if (kind !== 'approved' && !note.trim()) {
      setNeedsNote(true);
      return;
    }
    setNeedsNote(false);
    onDecide(kind, note.trim());
  };

  const approveButton = (
    <Button size="lg" disabled={!canDecide || !nextAudit.canSubmit} onClick={() => decide('approved')}>
      <ShieldCheck className="size-5" {...ICON} /> Approve & Seal Certificate
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Version selector + metrics · card 24 / padding 16 → version chips radius 8 */}
      <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col rounded-chip border border-silver px-4 py-2">
            <span className="text-caption text-mid">Base version</span>
            <span className="text-ui font-semibold text-ink">
              v1 · Initial draft <span className="font-normal text-graphite tabular-nums">· {baseAudit.score}%</span>
            </span>
          </div>
          <ArrowRight className="size-5 text-graphite" {...ICON} />
          <div className="flex flex-col rounded-chip bg-silver/48 px-4 py-2">
            <span className="text-caption text-graphite">Comparison</span>
            <span className="text-ui font-semibold text-ink">
              {nextLabel} <span className="font-normal text-graphite tabular-nums">· {nextAudit.score}%</span>
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Pill variant="silver" icon={Plus} caps={false}>
            {stats.added} chars added
          </Pill>
          <Pill variant="outline" icon={Minus} caps={false}>
            {stats.removed} chars removed
          </Pill>
          <Pill variant={delta >= 0 ? 'silver' : 'solid'} icon={TrendingUp} caps={false}>
            Score {delta >= 0 ? '+' : ''}
            {delta} pts
          </Pill>
          <Pill variant={resolved.length === baseViolations.length ? 'silver' : 'solid'} icon={resolved.length === baseViolations.length ? CircleCheck : CircleAlert} caps={false}>
            {resolved.length} of {baseViolations.length} resolved
          </Pill>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_352px]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-silver px-6 py-4">
            <h3 className="font-display text-subheading font-semibold text-ink">Revision diff</h3>
            <Tabs
              label="Diff layout"
              value={view}
              onChange={setView}
              items={[
                { id: 'unified', label: 'Unified' },
                { id: 'split', label: 'Side-by-side' }
              ]}
            />
          </div>
          {view === 'unified' ? (
            <DiffLines lines={toLines(ops)} />
          ) : (
            <div className="grid md:grid-cols-2">
              <div className="border-silver md:border-r">
                <p className="border-b border-silver px-4 py-2 text-caption font-medium text-mid">v1 · Initial draft</p>
                <DiffLines lines={toLines(ops.filter(op => op.type !== 'ins'))} />
              </div>
              <div>
                <p className="border-b border-silver px-4 py-2 text-caption font-medium text-mid">{nextLabel}</p>
                <DiffLines lines={toLines(ops.filter(op => op.type !== 'del'))} />
              </div>
            </div>
          )}
        </Card>

        <Card className="flex flex-col gap-4 p-6">
          <h3 className="font-display text-subheading font-semibold text-ink">Resolved violations</h3>
          <ul className="flex flex-col gap-3">
            {resolved.map(rule => (
              <li key={rule.id} className="flex gap-2 text-body text-graphite">
                <CircleCheck className="mt-1 size-4 shrink-0 text-ink" {...ICON} />
                <span>
                  <span className="font-semibold text-ink">Resolved:</span> {rule.resolvedLabel}
                </span>
              </li>
            ))}
            {remaining.map(rule => (
              <li key={rule.id} className="flex gap-2 text-body text-graphite">
                <CircleAlert className="mt-1 size-4 shrink-0 text-ink" {...ICON} />
                <span>
                  <span className="font-semibold text-ink">Open:</span> {rule.title}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-col gap-3 border-t border-silver pt-4 text-caption text-graphite">
            <p className="flex items-center justify-between gap-2">
              Deterministic fact engine <ScoreBadge score={nextAudit.score} label={nextAudit.open.length ? 'Open' : 'Passed'} />
            </p>
            <p className="flex items-center justify-between gap-2">
              Sign-off threshold <span className="font-semibold text-ink tabular-nums">≥ 85</span>
            </p>
          </div>
        </Card>
      </div>

      {decision ? (
        <Card className={cn('flex flex-wrap items-center gap-4 p-6', decision.kind === 'approved' ? 'bg-silver/24' : '')}>
          <span className={cn('flex size-12 shrink-0 items-center justify-center rounded-full', decision.kind === 'approved' ? 'bg-ink text-paper' : 'border-2 border-ink text-ink')}>
            {decision.kind === 'approved' ? <BadgeCheck className="size-6" {...ICON} /> : <X className="size-6" {...ICON} />}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h2 className="font-display text-subheading font-semibold text-ink">
              {decision.kind === 'approved' ? `Approved & sealed · ${decision.certificate}` : decision.kind === 'changes' ? 'Changes requested' : 'Submission rejected'}
            </h2>
            <p className="text-body text-graphite">
              {decision.by} · {decision.at}
              {decision.note && <> · “{decision.note}”</>}
            </p>
            {decision.hash && <p className="truncate text-caption text-mid tabular-nums">{decision.hash}</p>}
          </div>
          {decision.kind === 'approved' && (
            <Button variant="secondary" onClick={() => downloadCertificate(decision, next, nextAudit.score)}>
              <Download className="size-4" {...ICON} /> Download certificate
            </Button>
          )}
        </Card>
      ) : (
        <Card className="sticky bottom-[88px] z-10 p-6 shadow-float">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <FloatingTextArea
              label="Reviewer note"
              rows={2}
              value={note}
              onChange={event => {
                setNote(event.target.value);
                setNeedsNote(false);
              }}
              disabled={!canDecide}
              error={needsNote ? 'Add specific feedback so the author knows exactly what to change.' : undefined}
              hint={needsNote ? undefined : 'Required for Request Changes and Reject.'}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="lg" disabled={!canDecide} onClick={() => decide('changes')}>
                Request changes
              </Button>
              <Button variant="secondary" size="lg" disabled={!canDecide} onClick={() => decide('rejected')}>
                <X className="size-5" {...ICON} /> Reject
              </Button>
              {canDecide ? approveButton : <Tooltip content={blockedReason ?? SELF_APPROVAL_COPY}>{approveButton}</Tooltip>}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
