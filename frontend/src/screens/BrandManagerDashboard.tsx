import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { RevealText } from '@/components/mono/RevealText';
import { Stagger } from '@/components/mono/ui';
import { useSession } from '@/state/session';
import { NotificationBell } from '@/components/mono/NotificationBell';
import { OnlineTeamPresence } from '@/components/mono/OnlineTeamPresence';
import { BRANDS } from '@/data/demo';
import { brandsAPI } from '@/api/brands';
import { OverviewCard } from './dashboard/OverviewCard';
import { AuditCard } from './dashboard/AuditCard';
import { ActivityCard, AdvisorCard, ReviewsCard } from './dashboard/SideCards';

export function BrandManagerDashboard() {
  const { persona } = useSession();
  const [, setActiveBrandList] = useState<any[]>([...BRANDS]);

  useEffect(() => {
    brandsAPI.getAll().then(res => {
      const data = res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((b: any) => ({
          id: b._id || b.id || b.name?.toLowerCase().replace(/\s+/g, ''),
          name: b.name,
          sector: b.industry || 'Enterprise Brand',
          initials: b.name.slice(0, 2).toUpperCase()
        }));
        const existingIds = new Set(mapped.map((b: any) => b.id));
        setActiveBrandList([...mapped, ...BRANDS.filter(b => !existingIds.has(b.id))]);
      }
    }).catch(() => {});
  }, []);

  const firstName = persona.name.split(' ')[0];

  return (
    <>
      {/* ── Header ── */}
      <header className="flex items-center justify-between gap-4">
        <RevealText
          text={`Hello, ${firstName}!`}
          className="font-display text-display font-semibold tracking-tight text-ink"
          delay={0.2}
        />

        <div className="ml-auto flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('branddna:start_tour'));
            }}
            className="flex items-center gap-2 rounded-full border border-silver/80 bg-paper px-3.5 py-1.5 text-ui font-medium text-ink shadow-xs hover:border-brand-orange hover:text-brand-orange hover:bg-brand-orange/5 transition-all cursor-pointer"
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

      {/* ── Canonical Two-Column Persona Layout ── */}
      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Left 2/3 Column: Performance Metrics and Audit Volume */}
        <div className="flex min-w-0 flex-col gap-8">
          <Stagger index={1}>
            <OverviewCard view="brand_manager" />
          </Stagger>

          <Stagger index={2}>
            <AuditCard />
          </Stagger>
        </div>

        {/* Right 1/3 Column (320px): Brand Advisor, Reviews / Governance Counts, Recent Activity */}
        <div className="flex min-w-0 flex-col gap-8">
          <Stagger index={3}>
            <AdvisorCard view="brand_manager" />
          </Stagger>
          <Stagger index={4}>
            <ReviewsCard view="brand_manager" />
          </Stagger>
          <Stagger index={5}>
            <ActivityCard />
          </Stagger>
        </div>
      </div>
    </>
  );
}
