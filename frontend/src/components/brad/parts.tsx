import { forwardRef, useId, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/cn';
import { DURATION, EASE } from '@/lib/motion';
import { focusRing, Tooltip } from '@/components/mono/ui';

/** Circular icon-only button with an aria-label and a visible tooltip (no native title). */
export const BradIconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tip?: ReactNode; side?: 'top' | 'bottom'; size?: 'sm' | 'md' }
>(function BradIconButton({ label, tip, side = 'top', size = 'sm', className, children, ...props }, ref) {
  return (
    <Tooltip content={tip ?? label} side={side}>
      <button
        ref={ref}
        type="button"
        aria-label={label}
        className={cn(
          'press flex shrink-0 cursor-pointer items-center justify-center rounded-full text-graphite transition-colors hover:bg-silver/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40',
          focusRing,
          size === 'sm' ? 'size-8' : 'size-10',
          className
        )}
        {...props}
      >
        {children}
      </button>
    </Tooltip>
  );
});

/** Three Middle Gray dots with a subtle staggered pulse (static under reduced motion). */
export function TypingDots() {
  const reduce = useReducedMotion();
  return (
    <span className="flex h-6 items-center gap-1" aria-hidden>
      {[0, 1, 2].map(index => (
        <span
          key={index}
          className="size-2 rounded-full bg-mid"
          style={reduce ? undefined : { animation: `brad-dot 1.2s var(--ease-refined) ${index * 160}ms infinite` }}
        />
      ))}
    </span>
  );
}

/** Grayscale listening bars for voice mode. */
export function ListeningBars({ active }: { active: boolean }) {
  const reduce = useReducedMotion();
  return (
    <span className="flex h-8 items-center gap-1" aria-hidden>
      {[0, 1, 2, 3, 4].map(index => (
        <span
          key={index}
          className={cn('h-8 w-1 origin-center rounded-full', active ? 'bg-ink' : 'bg-silver')}
          style={{
            transform: active ? undefined : 'scaleY(0.32)',
            animation: active && !reduce ? `brad-bar ${0.8 + (index % 3) * 0.16}s var(--ease-refined) ${index * 120}ms infinite` : undefined
          }}
        />
      ))}
    </span>
  );
}

export interface ModeItem<T extends string> {
  id: T;
  label: string;
  disabled?: boolean;
  tip?: string;
}

/** Same look as the shared Tabs (Day/Week/Month toggle): Pale Silver 40% track, Almost Black sliding pill. */
export function ModeSwitch<T extends string>({ items, value, onChange, label }: { items: ModeItem<T>[]; value: T; onChange: (id: T) => void; label: string }) {
  const layoutId = useId();
  const reduce = useReducedMotion();
  return (
    <div role="tablist" aria-label={label} className="flex w-max rounded-item bg-silver/40 p-1">
      {items.map(item => {
        const active = item.id === value;
        const button = (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-disabled={item.disabled || undefined}
            onClick={() => !item.disabled && onChange(item.id)}
            className={cn(
              'relative flex h-8 items-center rounded-inset px-4 text-caption font-medium whitespace-nowrap transition-colors',
              focusRing,
              item.disabled ? 'cursor-not-allowed text-mid' : active ? 'cursor-pointer text-paper' : 'cursor-pointer text-graphite hover:text-ink'
            )}
          >
            {active && (
              <motion.span layoutId={layoutId} className="absolute inset-0 rounded-inset bg-ink" transition={{ duration: reduce ? 0 : DURATION.base, ease: EASE }} />
            )}
            <span className="relative">{item.label}</span>
          </button>
        );
        return item.disabled && item.tip ? (
          <Tooltip key={item.id} content={item.tip}>
            {button}
          </Tooltip>
        ) : (
          button
        );
      })}
    </div>
  );
}
