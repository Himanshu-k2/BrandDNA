import { Sparkles } from 'lucide-react';
import { RevealText } from '@/components/mono/RevealText';
import { Stagger } from '@/components/mono/ui';
import { useSession } from '@/state/session';
import { NotificationBell } from '@/components/mono/NotificationBell';
import { OnlineTeamPresence } from '@/components/mono/OnlineTeamPresence';
import { AuditCard } from './dashboard/AuditCard';
import type { View } from './dashboard/data';
import { OverviewCard } from './dashboard/OverviewCard';
import { ActivityCard, AdvisorCard, ReviewsCard } from './dashboard/SideCards';

/** Dashboard for Creator, Reviewer, Admin, or Brand Manager — rendered inside the shared AppFrame. */
export function HomeDashboard({ view }: { view: View }) {
  const { persona } = useSession();
  const firstName = persona.name.split(' ')[0];

  return (
    <>
      <header className="flex items-center justify-between gap-4">
        <RevealText text={`Hello, ${firstName}!`} className="font-display text-display font-semibold tracking-tight text-ink" delay={0.2} />
        <div className="ml-auto flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('branddna:start_tour'));
            }}
            className="flex items-center gap-2 rounded-full border border-silver/80 bg-paper px-3 py-1.5 text-ui font-medium text-ink shadow-xs hover:border-brand-orange hover:text-brand-orange hover:bg-brand-orange/5 transition-all cursor-pointer"
            title="Start interactive workspace walkthrough with Brad"
          >
            <Sparkles className="size-4 text-brand-orange" />
            <span className="hidden sm:inline">Brad Walkthrough</span>
            <span className="sm:hidden">Tour</span>
          </button>
          <OnlineTeamPresence />
          <NotificationBell />
        </div>
      </header>

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
