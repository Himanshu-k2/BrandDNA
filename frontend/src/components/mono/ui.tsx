import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode
} from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, CircleAlert, CircleCheck, X, type LucideIcon } from 'lucide-react';
import CountUp from '@/components/react-bits/CountUp';
import { useDismiss } from '@/hooks/useDismiss';
import { cn } from '@/lib/cn';
import { DURATION, EASE, rise, riseReduced } from '@/lib/motion';
import { RevealText } from './RevealText';
import { TONE_SUBTLE } from './tone';
import { NotificationBell } from './NotificationBell';
import { OnlineTeamPresence } from './OnlineTeamPresence';

export { NotificationBell, OnlineTeamPresence };

/** 2px Almost Black focus outline with 2px offset — every interactive element. */
export const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';
export const ICON = { strokeWidth: 1.5 } as const;

/* ── Buttons ─────────────────────────────────────────────────────── */

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-caption',
  md: 'h-10 px-4 text-ui',
  lg: 'h-12 px-6 text-ui'
};
const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-paper hover:bg-graphite',
  secondary: 'border border-silver bg-paper text-ink hover:border-mid hover:bg-silver/24',
  ghost: 'text-graphite hover:bg-silver/24 hover:text-ink'
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      type="button"
      className={cn(
        'press inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-[background-color,border-color,color,transform] duration-200 ease-(--ease-refined) disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100',
        focusRing,
        BUTTON_SIZE[size],
        BUTTON_VARIANT[variant],
        className
      )}
      {...props}
    />
  );
}

/** Circular icon button. */
export function IconButton({
  label,
  size = 'md',
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; size?: 'sm' | 'md' }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'press flex shrink-0 cursor-pointer items-center justify-center rounded-full text-graphite transition-colors hover:bg-silver/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40',
        focusRing,
        size === 'md' ? 'size-10' : 'size-8',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className={cn('rounded-min text-ui font-medium text-ink underline-offset-4 hover:underline', focusRing)}>
      {children}
    </Link>
  );
}

/* ── Pills & badges ──────────────────────────────────────────────── */

export type PillVariant = 'solid' | 'silver' | 'outline';

const PILL: Record<PillVariant, string> = {
  solid: 'bg-graphite text-paper',
  silver: 'bg-silver text-ink',
  outline: 'border border-silver bg-paper text-ink'
};

/**
 * Grayscale status chip. Importance is carried by fill (solid > silver > outline)
 * plus text and an optional icon — never colour alone.
 */
export function Pill({
  variant = 'silver',
  icon: Icon,
  caps = true,
  className,
  children
}: {
  variant?: PillVariant;
  icon?: LucideIcon;
  caps?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-caption font-semibold whitespace-nowrap tabular-nums',
        caps && 'tracking-[0.04em] uppercase',
        PILL[variant],
        className
      )}
    >
      {Icon && <Icon className="size-4 shrink-0" {...ICON} aria-hidden />}
      {children}
    </span>
  );
}

export const SUBMIT_SCORE = 85;

/** Compliance score: passing scores use the sage status tone, failing scores brick. */
export function ScoreBadge({ score, label }: { score: number; label?: string }) {
  const pass = score >= SUBMIT_SCORE;
  const Icon = pass ? CircleCheck : CircleAlert;
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-caption font-semibold whitespace-nowrap tabular-nums',
        TONE_SUBTLE[pass ? 'success' : 'danger']
      )}
    >
      <Icon className="size-4 shrink-0" {...ICON} aria-hidden />
      {label ? `${label} · ` : ''}
      {score}/100
    </span>
  );
}

/** Grayscale delta pill: Pale Silver for gains, Soft Graphite for declines. */
export function DeltaPill({ value, percent, shape = 'pill' }: { value: number; percent?: boolean; shape?: 'pill' | 'chip' }) {
  const down = value < 0;
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center px-2 text-caption font-medium tabular-nums',
        shape === 'pill' ? 'rounded-full' : 'rounded-chip',
        down ? 'bg-graphite text-paper' : 'bg-silver text-ink'
      )}
    >
      {`${down ? '−' : '+'}${Math.abs(value)}${percent ? '%' : ''}`}
    </span>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded-chip bg-silver/48 px-2 font-body text-caption font-medium text-ink">{children}</kbd>;
}

/* ── Surfaces ────────────────────────────────────────────────────── */

/** Clean White card · 1px Pale Silver border · 24px radius · soft shadow. */
export function Card({
  className,
  children,
  as: Tag = 'div',
  onClick,
  role
}: {
  className?: string;
  children: ReactNode;
  as?: 'div' | 'section' | 'article' | 'aside';
  onClick?: () => void;
  role?: string;
}) {
  return (
    <Tag
      onClick={onClick}
      role={role}
      className={cn('rounded-panel border border-silver bg-paper shadow-soft', className)}
    >
      {children}
    </Tag>
  );
}

export function SectionHeader({ title, action, as: Tag = 'h2' }: { title: string; action?: ReactNode; as?: 'h2' | 'h3' }) {
  return (
    <div className="flex min-h-10 flex-wrap items-center justify-between gap-4">
      <Tag className="font-display text-subheading font-semibold text-ink">{title}</Tag>
      {action}
    </div>
  );
}

export function SeeAll({ to, label = 'See All' }: { to: string; label?: string }) {
  return (
    <Link to={to} className={cn('group flex items-center gap-1 rounded-full text-caption font-medium text-ink', focusRing)}>
      {label}
      <ArrowRight className="size-4 transition-transform duration-200 ease-(--ease-refined) group-hover:translate-x-1" {...ICON} />
    </Link>
  );
}

/** Page title (animated reveal) + subtitle + primary actions on the right. Supports optional onBack with pixel-perfect alignment. */
export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
  onBack,
  backAriaLabel = 'Go back',
  showNotification = true
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
  onBack?: () => void;
  backAriaLabel?: string;
  showNotification?: boolean;
}) {
  return (
    <header className="flex flex-col gap-4">
      {/* Top row: Title + onBack on left, Presence & Notification ALWAYS on top right */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex min-w-0 flex-1 items-start gap-3.5">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label={backAriaLabel}
              className="press mt-0.5 flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-silver bg-paper text-ink shadow-sm transition-[background-color,transform] duration-200 hover:bg-silver/24 active:scale-95 focus-visible:outline-2 focus-visible:outline-ink"
            >
              <ArrowLeft className="size-5" {...ICON} />
            </button>
          )}

          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            {eyebrow && <div className="flex flex-wrap items-center gap-2 text-caption text-graphite">{eyebrow}</div>}
            <RevealText key={title} text={title} className="font-display text-display font-semibold tracking-tight text-ink leading-tight" delay={0.08} />
            {subtitle && (
              <p className="max-w-2xl text-body text-graphite leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* ALWAYS RIGHT-ALIGNED on top: Online Presence & Notification Bell */}
        {showNotification && (
          <div className="ml-auto flex shrink-0 items-center gap-3 self-start pt-0.5">
            <OnlineTeamPresence />
            <NotificationBell />
          </div>
        )}
      </div>

      {/* Actions / Subheader Toolbar */}
      {actions && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
          {actions}
        </div>
      )}
    </header>
  );
}

/** Staggered fade-and-rise used for cards on every page. */
export function Stagger({ index = 0, className, children }: { index?: number; className?: string; children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} variants={reduce ? riseReduced : rise} custom={index} initial="hidden" animate="show">
      {children}
    </motion.div>
  );
}

export function EmptyState({ icon: Icon, title, children, action }: { icon: LucideIcon; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <span className="relative flex size-12 items-center justify-center rounded-full bg-silver/40 text-ink">
        <Icon className="size-6" {...ICON} />
        {/* The screen's single decorative Blaze Orange shape (not a status). */}
        <span aria-hidden className="absolute -top-1 -right-1 size-3 rotate-12 rounded-min bg-brand-orange" />
      </span>
      <p className="mt-2 font-display text-subheading font-semibold text-ink">{title}</p>
      {children && <p className="max-w-sm text-body text-graphite">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Stat value rendered in Aptos at display size, counting up from 0. */
export function StatValue({ value, suffix, decimals, separator = ',' }: { value: number; suffix?: string; decimals?: number; separator?: string }) {
  return (
    <span className="font-display text-display font-semibold tracking-tight text-ink tabular-nums">
      <CountUp to={value} from={0} separator={separator} duration={0.6} easing="expo" trigger="load" suffix={suffix} decimals={decimals} />
    </span>
  );
}

/* ── Tabs / segmented control ────────────────────────────────────── */

export interface TabItem<T extends string> {
  id: T;
  label: string;
  count?: number;
  icon?: LucideIcon;
}

/** Pale Silver 40% track with 4px padding → radius-inset Almost Black sliding pill, white label. */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  className
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  className?: string;
}) {
  const layoutId = useId();
  return (
    <div role="tablist" aria-label={label} className={cn('flex w-max max-w-full overflow-x-auto rounded-item bg-silver/40 p-1', className)}>
      {items.map(item => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              'relative flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-inset px-3 text-caption font-medium whitespace-nowrap transition-colors',
              focusRing,
              active ? 'text-paper' : 'text-graphite hover:text-ink'
            )}
          >
            {active && <motion.span layoutId={layoutId} className="absolute inset-0 rounded-inset bg-ink" transition={{ duration: DURATION.base, ease: EASE }} />}
            {item.icon && <item.icon className="relative size-4" {...ICON} />}
            <span className="relative">{item.label}</span>
            {item.count !== undefined && (
              <span className={cn('relative rounded-full px-2 tabular-nums', active ? 'bg-paper text-ink' : 'bg-silver text-ink')}>{item.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Tooltip ─────────────────────────────────────────────────────── */

export function Tooltip({ content, side = 'top', children, className }: { content: ReactNode; side?: 'top' | 'bottom'; children: ReactNode; className?: string }) {
  return (
    <span className={cn('group/tip relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 z-50 w-max max-w-64 -translate-x-1/2 rounded-chip bg-ink px-3 py-2 text-caption leading-copy font-normal text-paper normal-case opacity-0 shadow-lift transition-[opacity,translate] duration-200 ease-(--ease-refined) group-focus-within/tip:opacity-100 group-hover/tip:opacity-100',
          side === 'top'
            ? 'bottom-full mb-2 translate-y-1 group-focus-within/tip:translate-y-0 group-hover/tip:translate-y-0'
            : 'top-full mt-2 -translate-y-1 group-focus-within/tip:translate-y-0 group-hover/tip:translate-y-0'
        )}
      >
        {content}
      </span>
    </span>
  );
}

/* ── Modal ───────────────────────────────────────────────────────── */

/** Panel radius 24 with 24px padding → inner controls are pills / underline fields. */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const frame = requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>('textarea, input, button:not([aria-label="Close"])')?.focus());
    return () => {
      window.removeEventListener('keydown', onKey);
      cancelAnimationFrame(frame);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="mono fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close dialog"
            tabIndex={-1}
            className="absolute inset-0 cursor-default bg-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.fast }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98, transition: { duration: DURATION.fast, ease: EASE } }}
            transition={{ duration: DURATION.base, ease: EASE }}
            className="relative flex w-full max-w-xl flex-col gap-6 rounded-panel border border-silver bg-paper p-6 shadow-float"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h2 id={titleId} className="font-display text-subheading font-semibold text-ink">
                  {title}
                </h2>
                {description && <p className="text-body text-graphite">{description}</p>}
              </div>
              <IconButton label="Close" size="sm" onClick={onClose}>
                <X className="size-5" {...ICON} />
              </IconButton>
            </div>
            <div>{children}</div>
            <div className="flex flex-wrap justify-end gap-2">{footer}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ── Score ring ──────────────────────────────────────────────────── */

export function ScoreRing({ score }: { score: number }) {
  const reduce = useReducedMotion();
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative size-24 shrink-0">
      <svg viewBox="0 0 96 96" className="size-full -rotate-90" aria-hidden>
        <circle cx="48" cy="48" r={radius} fill="none" strokeWidth="8" className="stroke-silver" />
        <motion.circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className={score >= SUBMIT_SCORE ? 'stroke-ink' : 'stroke-graphite'}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - score / 100) }}
          transition={{ duration: reduce ? 0 : DURATION.slow, ease: EASE }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-heading font-semibold text-ink tabular-nums" aria-label={`Score ${score} of 100`}>
        <CountUp key={score} to={score} from={0} duration={0.6} easing="expo" trigger="load" />
      </span>
    </div>
  );
}

/* ── Popover menu ────────────────────────────────────────────────── */

/** Radius-item container with 8px padding → radius-chip rows. */
export function Popover({
  trigger,
  children,
  align = 'right',
  className
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: 'left' | 'right';
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);
  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen(value => !value) })}
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: DURATION.fast, ease: EASE } }}
            transition={{ duration: DURATION.fast, ease: EASE }}
            className={cn(
              'absolute top-full z-40 mt-2 flex min-w-48 flex-col rounded-item border border-silver bg-paper p-2 shadow-lift',
              align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
              className
            )}
          >
            {children(close)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MenuRow({ children, onClick, active, disabled }: { children: ReactNode; onClick: () => void; active?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-10 w-full cursor-pointer items-center gap-2 rounded-chip px-2 text-left text-ui whitespace-nowrap text-graphite transition-colors hover:bg-silver/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40',
        focusRing,
        active && 'bg-silver/40 font-medium text-ink'
      )}
    >
      {children}
    </button>
  );
}

/* ── Switch ──────────────────────────────────────────────────────── */

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (value: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40',
        focusRing,
        checked ? 'bg-ink' : 'bg-silver'
      )}
    >
      <motion.span
        className="size-4 rounded-full bg-paper shadow-lift"
        animate={{ x: checked ? 16 : 0 }}
        transition={{ duration: DURATION.fast, ease: EASE }}
      />
    </button>
  );
}

/* ── Tables ──────────────────────────────────────────────────────── */

export const TH = 'h-10 px-4 text-left text-caption font-medium whitespace-nowrap text-mid';
export const TD = 'px-4 py-3 text-ui text-graphite';
export const TR = 'border-t border-silver transition-colors hover:bg-silver/24';
