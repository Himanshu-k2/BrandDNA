import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/cn';
import { DURATION, EASE } from '@/lib/motion';
import { PERIODS, STATS, scaleStat, type Period, type Stat, type View } from './data';
import { ArrowLink, HeroStatCard, RollingNumber } from '@/components/mono/accent';
import { DeltaPill, SectionHeader } from '@/components/mono/ui';

/** Segmented control: Pale Silver 40% track, 4px padding → radius-inset Almost Black selected pill. */
function PeriodToggle({ value, onChange }: { value: Period; onChange: (period: Period) => void }) {
  return (
    <div role="tablist" aria-label="Period" className="flex rounded-item bg-silver/40 p-1">
      {PERIODS.map(period => {
        const active = period.id === value;
        return (
          <button
            key={period.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(period.id)}
            className={cn(
              'relative h-8 cursor-pointer rounded-inset px-3 text-caption font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
              active ? 'text-paper' : 'text-graphite hover:text-ink'
            )}
          >
            {active && (
              <motion.span layoutId="period-pill" className="absolute inset-0 rounded-inset bg-ink" transition={{ duration: DURATION.base, ease: EASE }} />
            )}
            <span className="relative">{period.label}</span>
          </button>
        );
      })}
    </div>
  );
}

const signed = (value: number, percent?: boolean) => `${value < 0 ? '−' : '+'}${Math.abs(value)}${percent ? ' pts' : ''}`;

export function OverviewCard({ view }: { view: View }) {
  const reduce = useReducedMotion();
  const [period, setPeriod] = useState<Period>('week');
  const window = PERIODS.find(item => item.id === period)!.window;
  // Orange hero first, dark card second, then the white cards.
  const rank = (stat: Stat) => (stat.accent === 'orange' ? 0 : stat.accent === 'dark' ? 1 : 2);
  const stats = [...STATS[view]].sort((a, b) => rank(a) - rank(b));
  const listPath = view === 'creator' ? '/dashboard/content' : view === 'admin' ? '/dashboard/queue' : '/submissions';
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title="Overview performance" action={<PeriodToggle value={period} onChange={setPeriod} />} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {stats.map((stat, index) => {
          const { value, previous } = scaleStat(stat, period);
          const delta = value - previous;
          const from = `From ${previous.toLocaleString('en-US')}${stat.percent ? '%' : ''} (${window})`;
          if (stat.accent)
            return (
              <HeroStatCard
                key={stat.label}
                tone={stat.accent}
                label={stat.label}
                value={value}
                suffix={stat.percent ? '%' : ''}
                arrow={{ to: listPath, label: `Open ${stat.label.toLowerCase()}` }}
                caption={`${signed(delta, stat.percent)} · ${from}`}
                className="min-h-36"
              />
            );
          // White cards stagger in after the hero.
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: reduce ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? DURATION.fast : DURATION.slow, delay: reduce ? 0 : 0.12 + index * 0.08, ease: EASE }}
              className="flex min-h-36 flex-col gap-2 rounded-panel border border-silver bg-paper p-6 shadow-soft"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-ui text-graphite">{stat.label}</p>
                <ArrowLink to={listPath} label={`Open ${stat.label.toLowerCase()}`} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <p className="font-display text-display font-semibold tracking-tight text-ink">
                  <RollingNumber value={value} suffix={stat.percent ? '%' : ''} delay={0.12 + index * 0.08} />
                </p>
                <DeltaPill value={delta} percent={stat.percent} />
              </div>
              <p className="text-caption text-graphite">{from}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
