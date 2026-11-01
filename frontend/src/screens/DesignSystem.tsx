import { useState } from 'react';
import { AlarmClock, BadgeCheck, Hourglass, Mail, PenLine } from 'lucide-react';
import { useFrame } from '@/components/mono/AppFrame';
import { FloatingField } from '@/components/mono/FloatingField';
import { Banner, FieldMessage, SeverityBadge, StatusBadge, type Tone } from '@/components/mono/status';
import { Button, Card, PageHeader, Pill, ScoreBadge, SectionHeader, Stagger } from '@/components/mono/ui';
import { BradSection } from './designSystem/BradSection';
import { AccentSection } from './designSystem/AccentSection';

const GRAYS = [
  { name: 'ink', label: 'Almost Black', hex: '#070D0D', swatch: 'bg-ink' },
  { name: 'graphite', label: 'Soft Graphite', hex: '#343434', swatch: 'bg-graphite' },
  { name: 'mid', label: 'Middle Gray', hex: '#777777', swatch: 'bg-mid' },
  { name: 'silver', label: 'Pale Silver', hex: '#D6D6D6', swatch: 'bg-silver' },
  { name: 'paper', label: 'Clean White', hex: '#FFFFFF', swatch: 'bg-paper border border-silver' }
];

/* Contrast ratios are ink-on-tint (WCAG 2.x), computed once from the token hexes. */
const TONES: { tone: Exclude<Tone, 'neutral'>; label: string; use: string; ink: string; tint: string; line: string; ratio: string; classes: [string, string, string] }[] = [
  { tone: 'success', label: 'Sage', use: 'Approved · compliant · ready for sign-off', ink: '#3F6B4E', tint: '#EEF3EF', line: '#C9D9CD', ratio: '5.5:1', classes: ['bg-success', 'bg-success-tint', 'bg-success-line'] },
  { tone: 'warning', label: 'Ochre', use: 'Pending · in review · medium severity · deadlines', ink: '#7A5A1E', tint: '#F7F2E7', line: '#E3D5B5', ratio: '5.7:1', classes: ['bg-warning', 'bg-warning-tint', 'bg-warning-line'] },
  { tone: 'danger', label: 'Brick', use: 'Needs changes · critical/high · errors', ink: '#8A3B36', tint: '#F6ECEB', line: '#E2C4C1', ratio: '6.6:1', classes: ['bg-danger', 'bg-danger-tint', 'bg-danger-line'] },
  { tone: 'info', label: 'Slate', use: 'Informational · invited · system notes', ink: '#3C5A78', tint: '#EDF1F5', line: '#C6D2DE', ratio: '6.3:1', classes: ['bg-info', 'bg-info-tint', 'bg-info-line'] }
];

const RULES = [
  'Status colour is never the only signal: every tone ships with an icon and a text label.',
  'Only status components may use status tokens. Layout, type, buttons and navigation stay grayscale.',
  'Subtle (tint) is the default. Strong fills are reserved for critical severity.',
  'One toned banner per view. Stack severity inside it rather than stacking banners.'
];

function Mono({ children }: { children: string }) {
  return <code className="rounded-min bg-silver/40 px-1 text-caption text-graphite">{children}</code>;
}

export function DesignSystem() {
  const { notify } = useFrame();
  const [email, setEmail] = useState('alex@novafit');
  const [dismissed, setDismissed] = useState(false);
  const emailError = email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Enter a full work email, e.g. alex@novafit.com' : undefined;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Design system"
        subtitle="Grayscale foundations plus a muted status layer for compliance states. Reference only."
        actions={
          <Pill variant="outline" caps={false}>
            Dev reference · /design-system
          </Pill>
        }
      />

      <Stagger index={0}>
        <Card as="section" className="flex flex-col gap-6 p-6">
          <SectionHeader title="Foundations · grayscale" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {GRAYS.map(gray => (
              <div key={gray.name} className="flex flex-col gap-2">
                <span className={`h-16 rounded-item ${gray.swatch}`} />
                <span className="text-ui font-medium text-ink">{gray.label}</span>
                <span className="text-caption text-graphite tabular-nums">
                  {gray.hex} · <Mono>{gray.name}</Mono>
                </span>
              </div>
            ))}
          </div>
        </Card>
      </Stagger>

      <Stagger index={1}>
        <Card as="section" className="flex flex-col gap-6 p-6">
          <SectionHeader title="Status layer · tokens" />
          <div className="grid gap-4 md:grid-cols-2">
            {TONES.map(item => (
              <div key={item.tone} className="flex flex-col gap-3 rounded-item border border-silver p-4">
                <div className="grid h-14 grid-cols-[2fr_3fr_1fr] overflow-hidden rounded-chip">
                  {item.classes.map(cls => (
                    <span key={cls} className={cls} />
                  ))}
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-ui font-semibold text-ink">
                    {item.label} · <Mono>{item.tone}</Mono>
                  </span>
                  <StatusBadge tone={item.tone} caps={false}>
                    {item.ratio} on tint
                  </StatusBadge>
                </div>
                <p className="text-caption text-graphite tabular-nums">
                  ink {item.ink} · tint {item.tint} · line {item.line}
                </p>
                <p className="text-body text-graphite">{item.use}</p>
              </div>
            ))}
          </div>
        </Card>
      </Stagger>

      <Stagger index={2}>
        <Card as="section" className="flex flex-col gap-6 p-6">
          <SectionHeader title="StatusBadge & SeverityBadge" />
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-28 text-caption text-mid">Submission</span>
              <StatusBadge tone="danger">Needs changes</StatusBadge>
              <StatusBadge tone="warning" icon={Hourglass}>
                Pending
              </StatusBadge>
              <StatusBadge tone="success" icon={BadgeCheck}>
                Approved
              </StatusBadge>
              <StatusBadge tone="neutral" icon={PenLine}>
                Draft
              </StatusBadge>
              <StatusBadge tone="info" icon={Mail}>
                Invited
              </StatusBadge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-28 text-caption text-mid">Sentence case</span>
              <StatusBadge tone="success" caps={false}>
                98% Compliant · Ready for Sign-Off
              </StatusBadge>
              <StatusBadge tone="danger" caps={false}>
                42% Needs Changes · 3 Violations
              </StatusBadge>
              <StatusBadge tone="warning" caps={false}>
                In Review · Assigned to Sarah Chen
              </StatusBadge>
              <StatusBadge tone="warning" icon={AlarmClock} caps={false}>
                Due Fri 5:00 PM
              </StatusBadge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-28 text-caption text-mid">Severity</span>
              <SeverityBadge severity="critical" />
              <SeverityBadge severity="high" />
              <SeverityBadge severity="medium" />
              <SeverityBadge severity="low" />
              <span className="mx-2 h-4 w-px bg-silver" aria-hidden />
              <SeverityBadge severity="high" count={1} />
              <SeverityBadge severity="medium" count={2} />
              <SeverityBadge severity="low" count={0} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-28 text-caption text-mid">Score</span>
              <ScoreBadge score={98} />
              <ScoreBadge score={42} />
            </div>
          </div>
        </Card>
      </Stagger>

      <Stagger index={3}>
        <Card as="section" className="flex flex-col gap-6 p-6">
          <SectionHeader title="Banner" />
          <div className="flex flex-col gap-3">
            <Banner
              tone="warning"
              title="2 urgent campaign assets require sign-off before Friday 5:00 PM EST launch."
              action={
                <Button variant="secondary" size="sm">
                  View urgent
                </Button>
              }
            />
            <Banner tone="danger" title="Submission blocked · 1 high-severity violation">
              Pricing must match the approved rate card. Apply the suggested fix, then re-run the audit.
            </Banner>
            <Banner tone="success" title="Zero violations detected.">
              Copy fully adheres to NovaFit guidelines, pricing rules, and tone standards.
            </Banner>
            {!dismissed ? (
              <Banner tone="info" title="Guidelines updated 2 hours ago" onDismiss={() => setDismissed(true)}>
                NovaFit added a new required disclaimer for nutrition claims.
              </Banner>
            ) : (
              <Button variant="ghost" size="sm" className="self-start" onClick={() => setDismissed(false)}>
                Restore dismissed banner
              </Button>
            )}
          </div>
        </Card>
      </Stagger>

      <div className="grid gap-8 lg:grid-cols-2">
        <Stagger index={4}>
          <Card as="section" className="flex h-full flex-col gap-6 p-6">
            <SectionHeader title="FieldMessage" />
            <FloatingField label="Work email" value={email} onChange={event => setEmail(event.target.value)} error={emailError} />
            <div className="flex flex-col gap-1">
              <FieldMessage id="ds-hint" tone="neutral" animate={false}>
                Hint · Must reach 85 with no high-severity issues to submit.
              </FieldMessage>
              <FieldMessage id="ds-success" tone="success" animate={false}>
                Disclaimer added · requirement satisfied
              </FieldMessage>
              <FieldMessage id="ds-warning" tone="warning" animate={false}>
                Large file · audit may take up to 30 seconds
              </FieldMessage>
              <FieldMessage id="ds-error" tone="danger" animate={false}>
                PNG, JPG, PDF or DOCX only
              </FieldMessage>
            </div>
          </Card>
        </Stagger>

        <Stagger index={5}>
          <Card as="section" className="flex h-full flex-col gap-6 p-6">
            <SectionHeader title="Toast" />
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => notify('Switched to NovaFit')}>
                Neutral
              </Button>
              <Button variant="secondary" size="sm" onClick={() => notify('Settings saved', 'success')}>
                Success
              </Button>
              <Button variant="secondary" size="sm" onClick={() => notify('Hannah Moore suspended', 'warning')}>
                Warning
              </Button>
              <Button variant="secondary" size="sm" onClick={() => notify('Copy unavailable in this browser', 'danger')}>
                Danger
              </Button>
              <Button variant="secondary" size="sm" onClick={() => notify('Guidelines synced', 'info')}>
                Info
              </Button>
            </div>
            <SectionHeader title="Usage rules" as="h3" />
            <ul className="flex flex-col gap-2">
              {RULES.map(rule => (
                <li key={rule} className="flex gap-2 text-body text-graphite">
                  <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-mid" aria-hidden />
                  {rule}
                </li>
              ))}
            </ul>
          </Card>
        </Stagger>
      </div>

      <AccentSection index={6} />

      <BradSection index={7} />
    </div>
  );
}
