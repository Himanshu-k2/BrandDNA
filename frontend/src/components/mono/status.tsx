import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CircleAlert, X, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { DURATION, EASE } from '@/lib/motion';
import type { Severity } from '@/lib/rules';
import { TONE_ICON, TONE_STRONG, TONE_SUBTLE, TONE_TEXT, type Tone } from './tone';
import { ICON, IconButton } from './ui';

export type { Tone } from './tone';

/**
 * Status chip in the muted status layer. Tone is always doubled with an icon
 * and a text label, so meaning never depends on colour alone.
 */
export function StatusBadge({
  tone = 'neutral',
  icon,
  strong,
  caps = true,
  className,
  children
}: {
  tone?: Tone;
  /** Override the tone's default icon; pass `null` to hide it. */
  icon?: LucideIcon | null;
  strong?: boolean;
  caps?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const Icon = icon === undefined ? (tone === 'neutral' ? null : TONE_ICON[tone]) : icon;
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-caption font-semibold whitespace-nowrap tabular-nums',
        caps && 'tracking-[0.04em] uppercase',
        strong ? TONE_STRONG[tone] : TONE_SUBTLE[tone],
        className
      )}
    >
      {Icon && <Icon className="size-4 shrink-0" {...ICON} aria-hidden />}
      {children}
    </span>
  );
}

const DOT: Record<Tone, string> = {
  neutral: 'bg-mid',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info'
};

/** Table status: a small muted dot plus a text label (meaning never relies on the dot's colour). */
export function StatusDot({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-2 text-ui whitespace-nowrap text-ink', className)}>
      <span aria-hidden className={cn('size-2 shrink-0 rounded-full', DOT[tone])} />
      {children}
    </span>
  );
}

export const SEVERITY: Record<Severity, { label: string; tone: Tone; strong?: boolean }> = {
  critical: { label: 'Critical', tone: 'danger', strong: true },
  high: { label: 'High', tone: 'danger' },
  medium: { label: 'Medium', tone: 'warning' },
  low: { label: 'Low', tone: 'neutral' }
};

/** Severity ladder: critical solid brick → high brick tint → medium ochre tint → low outline. Zero counts fall back to neutral. */
export function SeverityBadge({ severity, count, className }: { severity: Severity; count?: number; className?: string }) {
  const meta = SEVERITY[severity];
  const empty = count === 0;
  return (
    <StatusBadge
      tone={empty ? 'neutral' : meta.tone}
      strong={!empty && meta.strong}
      icon={!empty && (severity === 'critical' || severity === 'high') ? CircleAlert : null}
      className={className}
    >
      {count === undefined ? meta.label : `${count} ${meta.label.toLowerCase()}`}
    </StatusBadge>
  );
}

/** Inline page/section banner. Danger is announced assertively, everything else politely. */
export function Banner({
  tone = 'info',
  title,
  children,
  action,
  onDismiss,
  className
}: {
  tone?: Tone;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const Icon = TONE_ICON[tone];
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex flex-wrap items-start gap-3 rounded-item px-4 py-3', TONE_SUBTLE[tone], className)}
    >
      <Icon className="mt-0.5 size-5 shrink-0" {...ICON} aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-ui font-semibold">{title}</p>
        {children && <p className="text-body text-graphite">{children}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2 self-center">{action}</div>}
      {onDismiss && (
        <IconButton label="Dismiss" size="sm" onClick={onDismiss} className="-my-1 -mr-2 text-current hover:bg-paper/60">
          <X className="size-4" {...ICON} />
        </IconButton>
      )}
    </div>
  );
}

/** Helper/validation line under a field. Pass the same `id` to the control's aria-describedby. */
export function FieldMessage({ id, tone = 'danger', children, animate = true }: { id: string; tone?: Tone; children?: ReactNode; animate?: boolean }) {
  const reduce = useReducedMotion();
  const Icon = tone === 'neutral' ? null : TONE_ICON[tone];
  const line = (
    <span className={cn('flex items-center gap-1 pt-1 text-caption font-medium', tone === 'neutral' ? 'text-mid' : TONE_TEXT[tone])}>
      {Icon && <Icon className="size-4 shrink-0" {...ICON} aria-hidden />}
      {children}
    </span>
  );
  if (!animate) return <p id={id}>{children ? line : null}</p>;
  return (
    <div id={id} aria-live="polite">
      <AnimatePresence initial={false}>
        {children && (
          <motion.p
            key={String(children)}
            initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: DURATION.fast, ease: EASE }}
            className="overflow-hidden"
          >
            {line}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
