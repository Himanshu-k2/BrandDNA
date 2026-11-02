import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight, CircleCheck, FileSearch, GitCompare, Lock, MessagesSquare, PenLine, Send, Sparkles, Trash2, WandSparkles, Zap } from 'lucide-react';
import { RevealText } from '@/components/mono/RevealText';
import { Button, Card, EmptyState, ICON, NotificationBell, Pill, ScoreRing, Tabs, TextLink, Tooltip } from '@/components/mono/ui';
import { SeverityBadge, StatusBadge, type Tone } from '@/components/mono/status';
import { COMMENTS, REVIEW, type Comment } from '@/data/demo';
import { DURATION, EASE } from '@/lib/motion';
import { auditDraft, SUBMIT_THRESHOLD } from '@/lib/rules';
import { canApprove, useSession } from '@/state/session';
import { AUDIT_STEPS, AuditTelemetry } from './studio/AuditTelemetry';
import { CompareVersions, SELF_APPROVAL_COPY, type Decision } from './studio/CompareVersions';
import { DraftCanvas } from './studio/DraftCanvas';
import { Discussion } from './studio/Discussion';
import { NewContentForm, type NewContentSubmission } from './NewContentForm';
import { FindingCard, ResolvedRow } from './studio/FindingCard';
import { reviewsAPI } from '@/api/reviews';
import { commentsAPI } from '@/api/comments';

type Tab = 'diagnostics' | 'compare' | 'discussion';
type Status = 'draft' | 'needs_changes' | 'in_review' | 'approved' | 'changes_requested' | 'rejected';

async function sha256(text: string) {
  try {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return `sha256:${Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')}`;
  } catch {
    return 'sha256:unavailable-in-insecure-context';
  }
}

export function ReviewStudio() {
  const { id = REVIEW.id } = useParams();
  const isNew = id === 'new';
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { persona } = useSession();

  const [draft, setDraft] = useState(isNew ? '' : REVIEW.v1);
  const [audited, setAudited] = useState(!isNew);
  const [scanStep, setScanStep] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<Status>(isNew ? 'draft' : 'needs_changes');
  const [comments, setComments] = useState<Comment[]>(COMMENTS);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [intake, setIntake] = useState<NewContentSubmission | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    setDraft(isNew ? '' : REVIEW.v1);
    setAudited(!isNew);
    setStatus(isNew ? 'draft' : 'needs_changes');
    setDecision(null);
    setEditing(false);
    setIntake(null);

    if (!isNew && id && id !== 'rev-1049') {
      reviewsAPI.getById(id).then(res => {
        const data = res.data?.data || res.data;
        if (data) {
          if (data.content) setDraft(data.content);
          if (data.status) {
            const mapped: Status = data.status === 'pending_review' ? 'in_review' : data.status;
            setStatus(mapped);
          }
          setAudited(true);
        }
      }).catch(err => {
        console.warn('Failed to load review from backend, falling back to demo state:', err);
      });
    }
  }, [id, isNew]);
  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  const tab = (params.get('tab') as Tab | null) ?? 'diagnostics';
  const setTab = (next: Tab) => setParams(next === 'diagnostics' ? {} : { tab: next }, { replace: true });

  const audit = useMemo(() => auditDraft(draft), [draft]);
  const isAuthor = persona.role === 'creator';
  const editable = persona.role === 'creator' && ['draft', 'needs_changes', 'changes_requested'].includes(status);
  const lockedReason =
    persona.role !== 'creator'
      ? 'Brand Managers and Admins inspect and sign off; only the content author can revise this draft.'
      : !editable
        ? 'This revision is locked while it is in review.'
        : undefined;

  const runAudit = (text: string = draft) => {
    if (!text.trim()) return;
    setEditing(false);
    setScanStep(0);
    [350, 750, 1250, 1650].forEach((delay, i) => {
      timers.current.push(
        window.setTimeout(() => {
          if (i === AUDIT_STEPS.length - 1) {
            setScanStep(null);
            setAudited(true);
            setStatus('needs_changes');
          } else {
            setScanStep(i + 1);
          }
        }, delay)
      );
    });
  };

  const applyAll = () => setDraft(text => audit.open.reduce((acc, rule) => rule.apply(acc), text));
  const submit = async () => {
    setStatus('in_review');
    setEditing(false);
    if (id && id !== 'rev-1049' && id !== 'new') {
      try {
        await reviewsAPI.createRevision(id, { content: draft });
        await reviewsAPI.submit(id);
      } catch (err) {
        console.warn('Backend revision submission fallback:', err);
      }
    }
    setComments(list => [
      ...list,
      { id: `c${Date.now()}`, author: persona.name, initials: persona.initials, role: persona.title, time: 'Just now', body: `Submitted v2 for brand sign-off at ${audit.score}/100.` }
    ]);
  };

  const decide = async (kind: Decision['kind'], note: string) => {
    const at = `${new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'UTC' })} UTC`;
    const comparison = draft !== REVIEW.v1 && draft.trim() ? draft : REVIEW.v2;
    const next: Decision = { kind, by: persona.name, at, note };
    if (kind === 'approved') {
      next.certificate = 'CERT-8841';
      next.hash = await sha256(comparison);
    }
    setDecision(next);
    setStatus(kind === 'approved' ? 'approved' : kind === 'changes' ? 'changes_requested' : 'rejected');

    if (id && id !== 'rev-1049' && id !== 'new') {
      try {
        if (kind === 'approved') await reviewsAPI.approve(id, { comments: note });
        else if (kind === 'changes') await reviewsAPI.requestChanges(id, { comments: note });
        else if (kind === 'rejected') await reviewsAPI.reject(id, { comments: note });
      } catch (err) {
        console.warn('Backend decision fallback:', err);
      }
    }

    if (note) {
      setComments(list => [...list, { id: `c${Date.now()}`, author: persona.name, initials: persona.initials, role: persona.title, time: 'Just now', body: note }]);
      if (id && id !== 'rev-1049' && id !== 'new') {
        try {
          await commentsAPI.create(id, { text: note });
        } catch (cErr) {
          console.warn('Backend comment notice:', cErr);
        }
      }
    }
  };

  const statusMeta: Record<Status, { label: string; tone: Tone }> = {
    draft: { label: 'Draft · Not yet audited', tone: 'neutral' },
    needs_changes: audit.canSubmit
      ? { label: `${audit.score}% Compliant · Ready for Sign-Off`, tone: 'success' }
      : { label: `Needs Changes · Score ${audit.score}/100`, tone: 'danger' },
    in_review: { label: `In Review · Awaiting Sign-off`, tone: 'warning' },
    approved: { label: 'Approved & Sealed', tone: 'success' },
    changes_requested: { label: 'Changes Requested', tone: 'danger' },
    rejected: { label: 'Rejected', tone: 'danger' }
  };

  const comparison = draft !== REVIEW.v1 && draft.trim() ? draft : REVIEW.v2;
  const comparisonLabel = draft !== REVIEW.v1 && draft.trim() ? 'v2 · Working Revision' : 'v2 · Current Revision';
  const versionLabel = isNew ? 'New draft · Version 1' : draft === REVIEW.v1 ? 'Viewing Version 1 of 2' : 'Editing Version 2';
  const severityCount = (severity: 'high' | 'medium' | 'low') => audit.open.filter(rule => rule.severity === severity).length;
  const homePath = isAuthor ? '/dashboard/content' : '/dashboard/queue';
  const decisionBlocked = !canApprove(persona.role) ? SELF_APPROVAL_COPY : status === 'approved' || status === 'rejected' ? 'A decision has already been recorded.' : undefined;

  const emptyCanvas = (
    <div className="rounded-min border border-dashed border-silver">
      <EmptyState
        icon={FileSearch}
        title="Paste copy to run your first brand audit"
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => setDraft(REVIEW.v1)}>
              <Sparkles className="size-4" {...ICON} /> Load NovaFit test case
            </Button>
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <PenLine className="size-4" {...ICON} /> Write copy
            </Button>
          </div>
        }
      >
        Or load the NovaFit test case: real copy with pricing, terminology, and disclaimer violations.
      </EmptyState>
    </div>
  );

  // New content starts with the intake form; submitting hands the draft to the audit below.
  if (isNew && !intake) {
    return (
      <NewContentForm
        onSubmit={async data => {
          setIntake(data);
          setDraft(data.text);
          runAudit(data.text);
          try {
            await reviewsAPI.create({
              title: data.title || 'Marketing Copy Review',
              contentType: data.contentType,
              brandId: data.brandId === 'novafit' ? undefined : data.brandId,
              content: data.text
            });
          } catch (e) {
            console.warn('Backend draft creation notice:', e);
          }
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-caption text-graphite">
        <TextLink to={homePath}>Reviews</TextLink>
        <ChevronRight className="size-4 text-mid" {...ICON} />
        <span>{intake?.brandName || REVIEW.brand}</span>
        <ChevronRight className="size-4 text-mid" {...ICON} />
        <span className="font-medium text-ink">{isNew ? 'New content' : REVIEW.breadcrumb}</span>
      </nav>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-3">
            <RevealText key={isNew ? 'new' : 'existing'} text={isNew ? intake?.title || 'New content' : REVIEW.title} className="font-display text-display font-semibold tracking-tight text-ink" delay={0.08} />
            {!isNew && <span className="text-caption text-mid tabular-nums">#{REVIEW.code}</span>}
          </div>
          <NotificationBell />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={statusMeta[status].tone} caps={false}>
            {statusMeta[status].label}
          </StatusBadge>
          <Pill variant="outline" caps={false}>
            {versionLabel}
          </Pill>
          {intake && intake.files.length > 0 && (
            <Pill variant="outline" caps={false}>
              {intake.files.length} {intake.files.length === 1 ? 'attachment' : 'attachments'}
            </Pill>
          )}
          {isAuthor && (
            <Tooltip content={SELF_APPROVAL_COPY} side="bottom">
              <span tabIndex={0} className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
                <Pill variant="outline" icon={Lock} caps={false}>
                  Self-approval restricted
                </Pill>
              </span>
            </Tooltip>
          )}
          <span className="ml-auto text-caption text-graphite">
            Author <span className="font-medium text-ink">{REVIEW.author}</span> · Approver <span className="font-medium text-ink">Brand Manager / Admin</span>
          </span>
        </div>
      </header>

      <Tabs
        label="Review sections"
        value={tab}
        onChange={setTab}
        items={[
          { id: 'diagnostics', label: 'Findings diagnostics', icon: FileSearch, count: audited ? audit.open.length : undefined },
          { id: 'compare', label: 'Compare versions', icon: GitCompare },
          { id: 'discussion', label: 'Discussion', icon: MessagesSquare, count: comments.length }
        ]}
      />

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: DURATION.fast, ease: EASE } }} transition={{ duration: DURATION.base, ease: EASE }}>
          {tab === 'diagnostics' && (
            <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
              {/* Draft workspace · card radius 24, padding 24 */}
              <Card className="flex flex-col gap-4 self-start p-6 lg:sticky lg:top-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <h2 className="font-display text-subheading font-semibold text-ink">{isNew ? intake?.title || 'Untitled campaign' : 'Summer Campaign Copy'}</h2>
                    <p className="text-caption text-graphite">{intake?.contentType ?? REVIEW.channel}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill variant="outline" caps={false}>
                      {intake?.contentType ?? REVIEW.format}
                    </Pill>
                    <span className="text-caption text-mid tabular-nums">{draft.length} chars</span>
                  </div>
                </div>

                <DraftCanvas text={draft} editing={editing} onChange={setDraft} openRules={audited ? audit.open : []} placeholder={emptyCanvas} />

                {status === 'in_review' && (
                  <div className="flex flex-wrap items-center gap-2 rounded-min bg-silver/40 p-2 pl-4 text-ui text-ink">
                    <CircleCheck className="size-5" {...ICON} />
                    <span className="flex-1">Submitted for sign-off. Editing is locked while Brand Manager reviews v2.</span>
                    <Button variant="secondary" size="sm" onClick={() => setTab('compare')}>
                      View diff
                    </Button>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {!audited ? (
                    <>
                      <Button size="lg" onClick={() => runAudit()} disabled={!draft.trim() || scanStep !== null}>
                        <Zap className="size-5" {...ICON} /> Run brand & fact audit
                      </Button>
                      {draft.trim() && (
                        <Button variant="ghost" onClick={() => setDraft('')}>
                          <Trash2 className="size-4" {...ICON} /> Clear canvas
                        </Button>
                      )}
                      {!editing && draft.trim() && (
                        <Button variant="secondary" onClick={() => setEditing(true)}>
                          <PenLine className="size-4" {...ICON} /> Edit copy
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Tooltip content={lockedReason ?? 'Applies every deterministic fix in one pass.'}>
                        <Button variant="secondary" onClick={applyAll} disabled={!editable || audit.open.length === 0}>
                          <WandSparkles className="size-4" {...ICON} /> Apply all fixes
                        </Button>
                      </Tooltip>
                      <Button variant="ghost" onClick={() => setEditing(value => !value)} disabled={!editable}>
                        <PenLine className="size-4" {...ICON} /> {editing ? 'Done editing' : 'Edit & revise (v2)'}
                      </Button>
                      <div className="ml-auto">
                        {canApprove(persona.role) ? (
                          <Button onClick={() => setTab('compare')}>
                            Go to compare & sign-off <ChevronRight className="size-4" {...ICON} />
                          </Button>
                        ) : (
                          <Tooltip content={audit.canSubmit ? 'Sends v2 to Brand Manager / Admin for formal sign-off.' : `Resolve high-severity issues and reach ${SUBMIT_THRESHOLD}+ to unlock submission.`}>
                            <Button size="lg" onClick={submit} disabled={!audit.canSubmit || !editable}>
                              <Send className="size-5" {...ICON} /> Submit for sign-off
                            </Button>
                          </Tooltip>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {/* Diagnostics feed */}
              <div className="flex flex-col gap-4">
                {scanStep !== null ? (
                  <AuditTelemetry step={scanStep} />
                ) : !audited ? (
                  <Card>
                    <EmptyState icon={Zap} title="Diagnostics appear here">
                      Deterministic pricing, lexicon, and disclaimer checks run first, each with a cited source.
                    </EmptyState>
                  </Card>
                ) : (
                  <>
                    {/* Score card · radius 24, padding 24 → inner strip 4 */}
                    <Card className="flex flex-col gap-4 p-6">
                      <div className="flex items-center gap-6">
                        <ScoreRing score={audit.score} />
                        <div className="flex min-w-0 flex-col gap-1">
                          <p className="text-caption font-medium text-mid">Compliance score</p>
                          <p className="font-display text-subheading font-semibold text-ink">
                            {audit.open.length === 0 ? 'Zero violations detected' : audit.canSubmit ? 'Ready for sign-off' : 'High-risk discrepancies'}
                          </p>
                          <p className="text-caption text-graphite">Must reach {SUBMIT_THRESHOLD} with no high-severity issues to submit.</p>
                        </div>
                      </div>
                      <p className="flex items-center gap-2 rounded-min bg-silver/40 px-3 py-2 text-caption font-medium text-ink">
                        <Zap className="size-4" {...ICON} /> Deterministic rules active · verified against approved brand data
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <SeverityBadge severity="high" count={severityCount('high')} />
                        <SeverityBadge severity="medium" count={severityCount('medium')} />
                        <SeverityBadge severity="low" count={severityCount('low')} />
                      </div>
                    </Card>

                    {audit.open.length === 0 ? (
                      <Card className="flex gap-3 bg-silver/24 p-4">
                        <CircleCheck className="size-5 shrink-0 text-ink" {...ICON} />
                        <p className="text-body text-ink">Zero violations detected. Copy fully adheres to NovaFit guidelines, pricing rules, and tone standards.</p>
                      </Card>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <AnimatePresence mode="popLayout">
                          {audit.open.map(rule => (
                            <FindingCard key={rule.id} rule={rule} lockedReason={lockedReason} onApply={() => setDraft(text => rule.apply(text))} />
                          ))}
                        </AnimatePresence>
                      </div>
                    )}

                    {audit.resolved.length > 0 && draft.trim() && (
                      <div className="flex flex-col gap-2">
                        <p className="text-caption font-medium text-mid">Resolved in this revision</p>
                        {audit.resolved.map(rule => (
                          <ResolvedRow key={rule.id} rule={rule} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {tab === 'compare' &&
            (isNew && !audited ? (
              <Card>
                <EmptyState
                  icon={GitCompare}
                  title="No revisions to compare yet"
                  action={
                    <Button variant="secondary" onClick={() => setTab('diagnostics')}>
                      Back to diagnostics
                    </Button>
                  }
                >
                  Run an audit and revise the draft to see a v1 → v2 diff.
                </EmptyState>
              </Card>
            ) : (
              <CompareVersions
                base={REVIEW.v1}
                next={comparison}
                nextLabel={comparisonLabel}
                canDecide={!decisionBlocked}
                blockedReason={decisionBlocked}
                decision={decision}
                onDecide={decide}
              />
            ))}

          {tab === 'discussion' && (
            <Discussion
              comments={comments}
              onPost={body =>
                setComments(list => [...list, { id: `c${Date.now()}`, author: persona.name, initials: persona.initials, role: persona.title, time: 'Just now', body }])
              }
            />
          )}
        </motion.div>
      </AnimatePresence>

      {isNew && audited && status === 'in_review' && (
        <div className="flex justify-center">
          <Button variant="ghost" onClick={() => navigate('/dashboard/content')}>
            Back to my submissions
          </Button>
        </div>
      )}
    </div>
  );
}
