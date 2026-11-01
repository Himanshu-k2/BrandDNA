import { motion } from 'motion/react';
import { Check, LoaderCircle } from 'lucide-react';
import { ICON } from '@/components/mono/ui';
import { cn } from '@/lib/cn';
import { DURATION, EASE } from '@/lib/motion';

export const AUDIT_STEPS = [
  { label: 'Scanning price & fact database', meta: '12ms' },
  { label: 'Validating prohibited terms lexicon', meta: '18ms' },
  { label: 'Checking mandatory disclaimers & claims', meta: '0.4s' },
  { label: 'Compiling compliance score & citations', meta: '' }
];

export function AuditTelemetry({ step }: { step: number }) {
  const progress = Math.min(100, (step / AUDIT_STEPS.length) * 100);
  return (
    <div className="flex flex-col gap-4 rounded-panel border border-silver bg-paper p-6 shadow-soft" role="status" aria-live="polite">
      <p className="flex items-center gap-2 text-ui font-semibold text-ink">
        <LoaderCircle className="size-5 animate-spin" {...ICON} /> Brand governance engine running…
      </p>
      <ol className="flex flex-col gap-3">
        {AUDIT_STEPS.map((item, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={item.label} className={cn('flex items-center gap-3 text-ui', done ? 'text-graphite' : active ? 'font-medium text-ink' : 'text-mid')}>
              <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-full', done ? 'bg-ink text-paper' : active ? 'border border-ink' : 'border border-silver')}>
                {done && <Check className="size-4" {...ICON} />}
              </span>
              <span className="flex-1">{item.label}</span>
              {done && item.meta && <span className="text-caption text-mid tabular-nums">{item.meta}</span>}
            </li>
          );
        })}
      </ol>
      <div className="h-1 overflow-hidden rounded-full bg-silver">
        <motion.div className="h-full rounded-full bg-ink" animate={{ width: `${progress}%` }} transition={{ duration: DURATION.base, ease: EASE }} />
      </div>
    </div>
  );
}
