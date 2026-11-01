import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, CirclePlus, Crown, Globe, X } from 'lucide-react';
import { RevealText } from '@/components/mono/RevealText';
import { Stagger } from '@/components/mono/ui';
import { DURATION, EASE } from '@/lib/motion';
import { useSession } from '@/state/session';
import { AuditCard } from './dashboard/AuditCard';
import type { View } from './dashboard/data';
import { OverviewCard } from './dashboard/OverviewCard';
import { ActivityCard, AdvisorCard, ReviewsCard } from './dashboard/SideCards';

/** Dashboard for Creator, Reviewer, Admin, or Brand Manager — rendered inside the shared AppFrame. */
export function HomeDashboard({ view }: { view: View }) {
  const { persona } = useSession();
  const navigate = useNavigate();
  const [banner, setBanner] = useState<'offer' | 'sent' | 'hidden'>('offer');
  const firstName = persona.name.split(' ')[0];

  const getAction = () => {
    if (view === 'creator') return { label: 'New Content', icon: CirclePlus, to: '/reviews/new' };
    if (view === 'brand_manager') return { label: 'Asset Library', icon: Globe, to: '/brand-manager/assets' };
    return { label: 'Open Queue', icon: Globe, to: '/dashboard/queue' };
  };

  const action = getAction();
  const ActionIcon = action.icon;

  return (
    <>
      <header className="flex items-center justify-between gap-4">
        <RevealText text={`Hello, ${firstName}!`} className="font-display text-display font-semibold tracking-tight text-ink" delay={0.2} />
        <button
          type="button"
          onClick={() => navigate(action.to)}
          className="press flex h-12 shrink-0 cursor-pointer items-center gap-2 rounded-full bg-ink px-6 text-ui font-medium text-paper transition-[background-color,transform] duration-200 ease-(--ease-refined) hover:scale-[1.02] hover:bg-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <ActionIcon className="size-5" strokeWidth={1.5} />
          {action.label}
        </button>
      </header>

      {/* Upgrade banner: radius 24, padding 8 → 16 inner (32px controls read as pills). */}
      <AnimatePresence initial={false}>
        {banner !== 'hidden' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: DURATION.base, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="mt-6 flex items-center gap-3 rounded-panel bg-silver/48 p-2 pl-4" role="status">
              <Crown className="size-5 shrink-0 text-ink" strokeWidth={1.5} />
              <p className="min-w-0 flex-1 truncate text-ui text-ink">
                {banner === 'offer' ? 'Upgrade your plan to unlock advanced features' : 'Thanks! Your workspace admin will share plan options.'}
              </p>
              {banner === 'offer' && (
                <button
                  type="button"
                  onClick={() => setBanner('sent')}
                  className="press flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-item bg-paper px-3 text-caption font-medium text-ink transition-colors hover:bg-silver/40 focus-visible:outline-2 focus-visible:outline-ink"
                >
                  Select Plan
                  <ArrowUpRight className="size-4" strokeWidth={1.5} />
                </button>
              )}
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => setBanner('hidden')}
                className="press flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-item text-graphite transition-colors hover:bg-paper hover:text-ink focus-visible:outline-2 focus-visible:outline-ink"
              >
                <X className="size-5" strokeWidth={1.5} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-8">
          <Stagger index={1}>
            <OverviewCard view={view} />
          </Stagger>
          <Stagger index={2}>
            <AuditCard />
          </Stagger>
        </div>
        <div className="flex min-w-0 flex-col gap-8">
          <Stagger index={3}>
            <AdvisorCard view={view} />
          </Stagger>
          <Stagger index={4}>
            <ReviewsCard view={view} />
          </Stagger>
          <Stagger index={5}>
            <ActivityCard />
          </Stagger>
        </div>
      </div>
    </>
  );
}
