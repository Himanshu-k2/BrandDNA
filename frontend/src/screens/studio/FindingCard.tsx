import { motion } from 'motion/react';
import { ArrowRight, BookMarked, CircleCheck, Zap } from 'lucide-react';
import { Button, ICON, Pill, Tooltip } from '@/components/mono/ui';
import { SeverityBadge } from '@/components/mono/status';
import { cn } from '@/lib/cn';
import { DURATION, EASE } from '@/lib/motion';
import type { BrandRule } from '@/lib/rules';

/** Card radius 24 · padding 16 → detected/expected panel radius 8. */
export function FindingCard({ rule, onApply, lockedReason }: { rule: BrandRule; onApply: () => void; lockedReason?: string }) {
  const missing = rule.id === 'disclaimer';
  const action = (
    <Button size="sm" onClick={onApply} disabled={Boolean(lockedReason)}>
      {rule.actionLabel} <ArrowRight className="size-4" {...ICON} />
    </Button>
  );
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 16, transition: { duration: DURATION.fast } }}
      transition={{ duration: DURATION.base, ease: EASE }}
      className="flex flex-col gap-3 rounded-panel border border-silver bg-paper p-4 shadow-soft"
    >
      <div className="flex flex-wrap items-center gap-2">
        <SeverityBadge severity={rule.severity} />
        <Pill variant="outline">{rule.tag}</Pill>
        <Pill variant="outline" icon={Zap} caps={false}>
          {rule.source}
        </Pill>
      </div>
      <p className="text-ui font-semibold text-ink">{rule.title}</p>

      <div className="grid grid-cols-2 overflow-hidden rounded-chip border border-silver">
        <div className="flex flex-col gap-1 p-3">
          <p className="text-caption text-mid">Detected</p>
          <p className={cn('text-ui text-graphite', missing ? 'italic' : 'line-through decoration-graphite')}>{rule.detectedLabel}</p>
        </div>
        <div className="flex flex-col gap-1 border-l border-silver bg-silver/24 p-3">
          <p className="text-caption text-mid">Approved / expected</p>
          <p className="text-ui font-semibold text-ink">{rule.expected}</p>
        </div>
      </div>

      <p className="text-body text-graphite">{rule.explanation}</p>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-silver pt-3">
        <p className="flex min-w-0 items-center gap-2 text-caption text-graphite">
          <BookMarked className="size-4 shrink-0" {...ICON} />
          <span>{rule.citation}</span>
        </p>
        {lockedReason ? <Tooltip content={lockedReason}>{action}</Tooltip> : action}
      </div>
    </motion.article>
  );
}

export function ResolvedRow({ rule }: { rule: BrandRule }) {
  return (
    <motion.p
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DURATION.fast, ease: EASE }}
      className="flex items-center gap-2 rounded-item border border-silver bg-paper px-4 py-2 text-caption font-medium text-ink"
    >
      <CircleCheck className="size-4 shrink-0" {...ICON} /> {rule.resolvedLabel}
    </motion.p>
  );
}
