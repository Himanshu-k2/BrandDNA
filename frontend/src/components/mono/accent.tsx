import { useId, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { DURATION, EASE } from '@/lib/motion';
import { focusRing, ICON } from './ui';

/*
 * Brand accent layer — Blaze Orange + Almost Black, used sparingly.
 * Contrast rules: Almost Black text on orange (6.7:1); never white on orange (2.9:1);
 * never orange text/thin icons on light surfaces; orange text is fine on Almost Black (6.7:1).
 * Orange is never a status colour.
 */

/* ── Hatch ───────────────────────────────────────────────────────── */

/** SVG <pattern> of 45° stripes: 2px Blaze Orange lines, 4px gap, transparent ground. */
export function HatchPattern({ id }: { id: string }) {
  return (
    <pattern id={id} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width={2} height={6} className="fill-brand-orange" />
    </pattern>
  );
}

/** Fills its box with the hatch, pixel-exact (no stretching), via an inline SVG pattern. */
export function HatchFill({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg aria-hidden className={cn('block size-full', className)}>
      <defs>
        <HatchPattern id={id} />
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/* ── Rolling (morphing) number ───────────────────────────────────── */

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/** One odometer wheel: a 0–9 column that rolls to `digit`. */
function Wheel({ digit, delay, reduce }: { digit: number; delay: number; reduce: boolean }) {
  return (
    <span className="relative inline-block h-[1lh] overflow-hidden">
      <motion.span
        className="flex flex-col"
        initial={reduce ? false : { y: '0%' }}
        animate={{ y: `${-digit * 10}%` }}
        transition={{ duration: reduce ? 0 : DURATION.slow, delay: reduce ? 0 : delay, ease: EASE }}
      >
        {DIGITS.map(n => (
          <span key={n} className="h-[1lh]">
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

/**
 * Morphing counter: each digit is a wheel that rolls to its new value (from 0 on mount),
 * staggered right-to-left. Wheels are keyed by place value, so 99 → 128 grows a new
 * hundreds wheel instead of re-rolling everything. Inherits font size and line height.
 */
export function RollingNumber({ value, suffix = '', delay = 0, className }: { value: number; suffix?: string; delay?: number; className?: string }) {
  const reduce = useReducedMotion() ?? false;
  const chars = Math.round(value).toLocaleString('en-US').split('');
  return (
    <span className={cn('inline-flex tabular-nums', className)} role="text" aria-label={`${Math.round(value).toLocaleString('en-US')}${suffix}`}>
      <span aria-hidden className="inline-flex">
        {chars.map((char, index) => {
          const place = chars.length - index;
          return /\d/.test(char) ? <Wheel key={`d${place}`} digit={Number(char)} delay={delay + place * 0.04} reduce={reduce} /> : <span key={`s${place}`}>{char}</span>;
        })}
        {suffix && <span>{suffix}</span>}
      </span>
    </span>
  );
}

/* ── Arrow link ──────────────────────────────────────────────────── */

/**
 * Circular "open" link with Lucide ArrowUpRight. On hover the arrow flies out to the
 * top-right while a second one slides in from the bottom-left (static under reduced motion).
 * `orange`: Blaze Orange + Almost Black arrow (white/dark cards). `ink`: Almost Black + orange arrow (orange card).
 */
export function ArrowLink({ to, label, tone = 'orange', className }: { to: string; label: string; tone?: 'orange' | 'ink'; className?: string }) {
  // Lucide draws the arrow in the middle ~40% of its box: a 36px icon gives a ~15px visible arrow.
  const icon = 'size-9 shrink-0 transition-transform duration-400 ease-(--ease-refined)';
  return (
    <Link
      to={to}
      aria-label={label}
      title={label}
      className={cn(
        'group/arrow relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full transition-[background-color,scale] duration-200 ease-(--ease-refined) active:scale-[0.96]',
        tone === 'orange' ? 'bg-brand-orange text-ink hover:bg-brand-orange-hover' : 'bg-ink text-brand-orange hover:bg-graphite',
        focusRing,
        className
      )}
    >
      <ArrowUpRight className={cn(icon, 'motion-safe:group-hover/arrow:translate-x-12 motion-safe:group-hover/arrow:-translate-y-12 motion-safe:group-focus-visible/arrow:translate-x-12 motion-safe:group-focus-visible/arrow:-translate-y-12')} {...ICON} aria-hidden />
      <ArrowUpRight className={cn(icon, 'absolute -translate-x-12 translate-y-12 group-hover/arrow:translate-0 group-focus-visible/arrow:translate-0 motion-reduce:hidden')} {...ICON} aria-hidden />
    </Link>
  );
}

/* ── Hero stat card ──────────────────────────────────────────────── */

/**
 * The one emphasised number on a screen (max ONE orange per screen).
 * `orange`: solid Blaze Orange, Almost Black text. `dark`: Almost Black, white text, orange number.
 * The count-up is slower and starts later, so it finishes after the surrounding cards settle.
 */
export function HeroStatCard({
  tone = 'orange',
  label,
  value,
  suffix,
  caption,
  icon: Icon,
  action,
  arrow,
  className
}: {
  tone?: 'orange' | 'dark';
  label: string;
  value: number;
  suffix?: string;
  caption?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  /** Top-right "open" link; takes the icon's place. */
  arrow?: { to: string; label: string };
  /** @deprecated kept for call sites; the rolling counter morphs on value changes. */
  countKey?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const orange = tone === 'orange';
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? DURATION.fast : DURATION.slow, ease: EASE }}
      className={cn('flex flex-col gap-2 rounded-panel p-6', orange ? 'bg-brand-orange text-ink' : 'bg-ink text-paper', className)}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-ui font-medium">{label}</p>
        {arrow ? (
          <ArrowLink to={arrow.to} label={arrow.label} tone={orange ? 'ink' : 'orange'} />
        ) : (
          Icon && <Icon className={cn('size-5', orange ? 'text-ink' : 'text-brand-orange')} {...ICON} aria-hidden />
        )}
      </div>
      <p className={cn('font-display text-display font-semibold tracking-tight', orange ? 'text-ink' : 'text-brand-orange')}>
        {/* Starts later than the other cards, so the hero number settles last. */}
        <RollingNumber value={value} suffix={suffix} delay={0.4} />
      </p>
      {caption && <p className={cn('text-caption', orange ? 'text-ink' : 'text-silver')}>{caption}</p>}
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  );
}

/* ── Progress bar ────────────────────────────────────────────────── */

/** Orange fill on a Pale Silver track (limits, quota, upload). Not a status: completion uses the success icon. */
export function ProgressBar({ value, max = 100, label, showValue, className }: { value: number; max?: number; label: string; showValue?: boolean; className?: string }) {
  const reduce = useReducedMotion();
  const ratio = Math.max(0, Math.min(1, value / max));
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {showValue && (
        <div className="flex items-center justify-between text-caption text-graphite">
          <span>{label}</span>
          <span className="font-medium text-ink tabular-nums">
            {value.toLocaleString('en-US')} / {max.toLocaleString('en-US')}
          </span>
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.round(value)}
        className="h-1 w-full overflow-hidden rounded-full bg-silver"
      >
        <motion.div
          className="h-full origin-left rounded-full bg-brand-orange"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: ratio }}
          transition={{ duration: reduce ? 0 : DURATION.base, ease: EASE }}
        />
      </div>
    </div>
  );
}

/* ── Hatched bar chart ───────────────────────────────────────────── */

export interface BarDatum {
  label: string;
  /** Axis text when it differs from the tooltip label ('' hides it on dense ranges). */
  axis?: string;
  primary: number;
  secondary?: number;
}

/**
 * Chart theme: Almost Black primary series, hatched orange secondary series, solid
 * orange for the single highlighted bar. Pale Silver grid, Middle Gray axis labels,
 * Almost Black tooltip with white text. Bars draw up from the baseline; the hatch never moves.
 */
export function HatchedBarChart({
  data,
  max,
  ticks,
  primaryLabel,
  secondaryLabel,
  highlight,
  onHighlight,
  format = (value: number) => value.toLocaleString('en-US'),
  tooltipExtra,
  height = 'h-48',
  label,
  animateKey,
  persistentTooltip = false
}: {
  data: BarDatum[];
  max: number;
  ticks: number[];
  primaryLabel: string;
  secondaryLabel?: string;
  highlight?: number;
  onHighlight?: (index: number) => void;
  format?: (value: number) => string;
  tooltipExtra?: (index: number) => ReactNode;
  height?: string;
  label: string;
  animateKey?: string;
  /** Keep the highlighted bar's tooltip visible without hover (Audit volume). */
  persistentTooltip?: boolean;
}) {
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? highlight ?? null;
  const set = (index: number | null) => {
    setHover(index);
    if (index !== null) onHighlight?.(index);
  };
  const step = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = active ?? 0;
    if (event.key === 'ArrowRight') set(Math.min(data.length - 1, current + 1));
    if (event.key === 'ArrowLeft') set(Math.max(0, current - 1));
  };
  const pct = (value: number) => `${Math.max(0, Math.min(1, value / max)) * 100}%`;
  const point = active !== null ? data[active] : null;
  const tipIndex = hover ?? (persistentTooltip ? (highlight ?? null) : null);
  const tipPoint = tipIndex !== null ? data[tipIndex] : null;
  const tipTop = tipPoint ? (1 - Math.min(1, Math.max(tipPoint.primary, tipPoint.secondary ?? 0) / max)) * 100 : 0;
  const hasSecondary = data.some(item => item.secondary !== undefined);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[40px_minmax(0,1fr)] gap-x-2">
        <div className={cn('flex flex-col justify-between text-caption text-mid tabular-nums', height)} aria-hidden>
          {ticks.map(tick => (
            <span key={tick} className="-translate-y-2 first:translate-y-0 last:translate-y-0">
              {tick >= 1000 ? `${tick / 1000}k` : tick}
            </span>
          ))}
        </div>

        <div
          role="img"
          tabIndex={0}
          aria-label={`${label}.${point ? ` ${point.label}: ${primaryLabel} ${format(point.primary)}${point.secondary !== undefined && secondaryLabel ? `, ${secondaryLabel} ${format(point.secondary)}` : ''}.` : ''} Use arrow keys to move.`}
          onKeyDown={step}
          onPointerLeave={() => set(null)}
          onBlur={() => set(null)}
          className={cn('relative rounded-min', height, focusRing, 'focus-visible:outline-offset-4')}
        >
          {/* Pale Silver grid */}
          <div className="absolute inset-0 flex flex-col justify-between" aria-hidden>
            {ticks.map(tick => (
              <span key={tick} className="h-px w-full bg-silver" />
            ))}
          </div>

          <div className="absolute inset-0 flex items-end gap-1" key={animateKey}>
            {data.map((item, index) => {
              const on = index === active;
              return (
                <div key={index} className="relative flex h-full flex-1 cursor-crosshair items-end justify-center gap-1" onPointerEnter={() => set(index)}>
                  <motion.span
                    className={cn('block w-full max-w-4 origin-bottom rounded-t-min', on ? 'bg-brand-orange' : 'bg-ink')}
                    style={{ height: pct(item.primary) }}
                    initial={reduce ? { opacity: 0 } : { scaleY: 0 }}
                    animate={reduce ? { opacity: 1 } : { scaleY: 1 }}
                    transition={{ duration: DURATION.slow, delay: reduce ? 0 : 0.2 + index * 0.03, ease: EASE }}
                  />
                  {item.secondary !== undefined && (
                    <motion.span
                      className="block w-full max-w-4 origin-bottom overflow-hidden rounded-t-min border border-brand-orange"
                      style={{ height: pct(item.secondary) }}
                      initial={reduce ? { opacity: 0 } : { scaleY: 0 }}
                      animate={reduce ? { opacity: 1 } : { scaleY: 1 }}
                      transition={{ duration: DURATION.slow, delay: reduce ? 0 : 0.26 + index * 0.03, ease: EASE }}
                    >
                      <HatchFill />
                    </motion.span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Almost Black tooltip, white text */}
          <AnimatePresence>
            {tipPoint && tipIndex !== null && (
              <motion.div
                key="tip"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0, left: `${((tipIndex + 0.5) / data.length) * 100}%`, top: `${tipTop}%` }}
                exit={{ opacity: 0, transition: { duration: DURATION.fast } }}
                transition={{ duration: DURATION.fast, ease: EASE }}
                className="pointer-events-none absolute z-10"
              >
                <div
                  className={cn(
                    'absolute bottom-2 flex w-max flex-col gap-1 rounded-item bg-ink p-2 pr-3 text-paper shadow-lift',
                    tipIndex / data.length > 0.7 ? 'right-0' : tipIndex / data.length < 0.2 ? 'left-0' : 'left-1/2 -translate-x-1/2'
                  )}
                >
                  <span className="px-1 text-caption text-silver">{tipPoint.label}</span>
                  <span className="flex items-center gap-2 px-1">
                    <span className="font-display text-subheading font-semibold tabular-nums">{format(tipPoint.primary)}</span>
                    {tooltipExtra?.(tipIndex)}
                  </span>
                  {tipPoint.secondary !== undefined && secondaryLabel && (
                    <span className="px-1 text-caption text-silver">
                      {secondaryLabel} · <span className="text-brand-orange">{format(tipPoint.secondary)}</span>
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <span />
        <div className="mt-2 flex text-caption text-mid" aria-hidden>
          {data.map((item, index) => (
            <span key={index} className={cn('flex-1 text-center whitespace-nowrap', index === active && 'font-semibold text-ink')}>
              {/* Hidden ticks on dense ranges reappear (short form) for the active bar. */}
              {item.axis === '' ? (index === active ? item.label.split(' ').pop() : '') : (item.axis ?? item.label)}
            </span>
          ))}
        </div>
      </div>

      <ChartLegend primaryLabel={primaryLabel} secondaryLabel={hasSecondary ? secondaryLabel : undefined} />
    </div>
  );
}

export function ChartLegend({ primaryLabel, secondaryLabel }: { primaryLabel: string; secondaryLabel?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-caption text-graphite">
      <span className="flex items-center gap-2">
        <span aria-hidden className="size-3 rounded-min bg-ink" />
        {primaryLabel}
      </span>
      {secondaryLabel && (
        <span className="flex items-center gap-2">
          <span aria-hidden className="hatch-orange size-3 rounded-min border border-brand-orange" />
          {secondaryLabel}
        </span>
      )}
    </div>
  );
}
