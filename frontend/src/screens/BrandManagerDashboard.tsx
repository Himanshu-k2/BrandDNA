import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Crown,
  ExternalLink,
  FileText,
  Layers,
  Palette,
  ShieldAlert,
  ShieldCheck,
  Type,
  X
} from 'lucide-react';
import { RevealText } from '@/components/mono/RevealText';
import { Card, Pill, SectionHeader, SeeAll, Stagger, ICON } from '@/components/mono/ui';
import { DURATION, EASE } from '@/lib/motion';
import { useSession } from '@/state/session';
import { NotificationBell } from '@/components/mono/NotificationBell';
import { BRANDS } from '@/data/demo';
import { brandsAPI } from '@/api/brands';
import { OverviewCard } from './dashboard/OverviewCard';
import { AuditCard } from './dashboard/AuditCard';
import { ActivityCard, AdvisorCard, ReviewsCard } from './dashboard/SideCards';

interface ViolationItem {
  id: string;
  category: 'color' | 'pricing' | 'logo' | 'typography';
  title: string;
  detail: string;
  severity: 'critical' | 'high' | 'medium';
  count: number;
  actionLabel: string;
  actionTo: string;
}

const BRAND_RISKS: Record<string, ViolationItem[]> = {
  novafit: [
    {
      id: 'v1',
      category: 'color',
      title: 'Prohibited Color Flagged: #39FF14 Neon Green',
      detail: '14 promotional creatives blocked across Instagram & Facebook ad campaigns. Neon green violates brand visual standards.',
      severity: 'critical',
      count: 14,
      actionLabel: 'Review Submissions',
      actionTo: '/submissions'
    },
    {
      id: 'v2',
      category: 'pricing',
      title: 'Unapproved Pricing Claim: ₹799 vs Certified ₹999',
      detail: '9 draft copies attempted to quote ₹799/month promotional pricing. Official certified subscription tier is ₹999/month.',
      severity: 'high',
      count: 9,
      actionLabel: 'Inspect Pricing Rule',
      actionTo: '/brand-manager/assets'
    },
    {
      id: 'v3',
      category: 'logo',
      title: 'Logo Clear-Space Perimeter Breach (< 24px)',
      detail: '6 hero banners exported with text and graphics encroaching within the 24px logo margin boundary.',
      severity: 'medium',
      count: 6,
      actionLabel: 'View Clear Space Specs',
      actionTo: '/brand-manager/assets'
    },
    {
      id: 'v4',
      category: 'typography',
      title: 'Disallowed Font Weight (Inter 800 ExtraBold)',
      detail: '4 landing page designs used ExtraBold weight. Approved standard is Inter SemiBold (600) for hero display copy.',
      severity: 'medium',
      count: 4,
      actionLabel: 'Inspect Typography',
      actionTo: '/brand-manager/assets'
    }
  ],
  omnicloud: [
    {
      id: 'o1',
      category: 'color',
      title: 'Prohibited Color Flagged: #FF0033 Crimson Red',
      detail: '8 enterprise slides blocked for using unauthorized crimson red in product terminal graphics.',
      severity: 'critical',
      count: 8,
      actionLabel: 'Review Submissions',
      actionTo: '/submissions'
    },
    {
      id: 'o2',
      category: 'pricing',
      title: 'Enterprise Tier SLA Discrepancy',
      detail: '5 contracts quoted outdated ₹19,99,000 baseline SLA. Official certified price is ₹24,99,000.',
      severity: 'high',
      count: 5,
      actionLabel: 'Inspect Pricing Rule',
      actionTo: '/brand-manager/assets'
    }
  ],
  apex: [
    {
      id: 'a1',
      category: 'color',
      title: 'Prohibited Accent: #FF007F Hot Pink',
      detail: '7 retail banking promo cards flagged for using hot pink in disclosure copy.',
      severity: 'critical',
      count: 7,
      actionLabel: 'Review Submissions',
      actionTo: '/submissions'
    },
    {
      id: 'a2',
      category: 'pricing',
      title: 'APY Yield Rate Disclosure Missing',
      detail: '6 investment banners omitted mandatory 6.8% APY regulatory certification disclaimer.',
      severity: 'high',
      count: 6,
      actionLabel: 'Inspect Pricing Rule',
      actionTo: '/brand-manager/assets'
    }
  ]
};

export function BrandManagerDashboard() {
  const { persona } = useSession();
  const navigate = useNavigate();
  const selectedBrand = 'novafit';
  const [activeBrandList, setActiveBrandList] = useState<any[]>([...BRANDS]);
  const [banner, setBanner] = useState<'offer' | 'sent' | 'hidden'>('offer');

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

  const currentBrand = activeBrandList.find(b => b.id === selectedBrand) || activeBrandList[0];
  const firstName = persona.name.split(' ')[0];
  const violations = BRAND_RISKS[selectedBrand] || BRAND_RISKS['novafit'];

  const categoryIcon = (category: ViolationItem['category']) => {
    switch (category) {
      case 'color':
        return <Palette className="size-4" strokeWidth={1.5} />;
      case 'pricing':
        return <ShieldCheck className="size-4" strokeWidth={1.5} />;
      case 'logo':
        return <Layers className="size-4" strokeWidth={1.5} />;
      case 'typography':
        return <Type className="size-4" strokeWidth={1.5} />;
    }
  };

  const severityBadge = (severity: ViolationItem['severity']) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="flex items-center gap-1 rounded-full bg-danger/10 px-2.5 py-0.5 text-caption font-semibold text-danger">
            <ShieldAlert className="size-3" strokeWidth={2} /> Critical
          </span>
        );
      case 'high':
        return (
          <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-caption font-semibold text-amber-700">
            <AlertTriangle className="size-3" strokeWidth={2} /> High Priority
          </span>
        );
      case 'medium':
        return (
          <span className="flex items-center gap-1 rounded-full bg-silver/60 px-2.5 py-0.5 text-caption font-medium text-graphite">
            Medium
          </span>
        );
    }
  };

  return (
    <>
      {/* ── Header ── */}
      <header className="flex items-center justify-between gap-4">
        <RevealText
          text={`Hello, ${firstName}!`}
          className="font-display text-display font-semibold tracking-tight text-ink"
          delay={0.2}
        />

        <div className="flex items-center gap-2.5">
          <NotificationBell />
        </div>
      </header>

      {/* ── Top Governance Banner ── */}
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
                {banner === 'offer'
                  ? `Active brand workspace: ${currentBrand.name}. 6 staged guideline rules awaiting production sign-off.`
                  : 'Staged guidelines confirmed. Production engine synchronized.'}
              </p>
              {banner === 'offer' && (
                <button
                  type="button"
                  onClick={() => navigate('/brand-manager/uploads')}
                  className="press flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-item bg-paper px-3 text-caption font-medium text-ink transition-colors hover:bg-silver/40 focus-visible:outline-2 focus-visible:outline-ink"
                >
                  Review Staging
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

      {/* ── Canonical Two-Column Persona Layout ── */}
      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Left 2/3 Column: Performance Metrics, Audit Volume, and Priority Action Items */}
        <div className="flex min-w-0 flex-col gap-8">
          <Stagger index={1}>
            <OverviewCard view="brand_manager" />
          </Stagger>

          <Stagger index={2}>
            <AuditCard />
          </Stagger>

          {/* High-Priority Compliance Violations & Required Brand Actions */}
          <Stagger index={3}>
            <section className="flex flex-col gap-4">
              <SectionHeader
                title="High-priority compliance risks & actions"
                action={<SeeAll to="/submissions" />}
              />
              <Card className="flex flex-col divide-y divide-silver overflow-hidden p-0">
                {violations.map(item => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-silver/10"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-chip bg-silver/30 text-ink mt-0.5">
                        {categoryIcon(item.category)}
                      </span>
                      <div className="flex min-w-0 flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-ui font-semibold text-ink">{item.title}</span>
                          {severityBadge(item.severity)}
                          <span className="rounded-full bg-silver/40 px-2 py-0.5 text-caption font-medium text-graphite">
                            {item.count} flagged
                          </span>
                        </div>
                        <p className="text-caption leading-copy text-graphite max-w-xl">
                          {item.detail}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 sm:self-center">
                      <button
                        type="button"
                        onClick={() => navigate(item.actionTo)}
                        className="press flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-silver bg-paper px-4 text-caption font-medium text-ink transition-colors hover:bg-silver/40 focus-visible:outline-2 focus-visible:outline-ink"
                      >
                        {item.actionLabel}
                        <ArrowRight className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Staged Guideline Documents awaiting production sign-off */}
                <div className="flex flex-col gap-3 bg-silver/15 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-chip bg-ink text-paper mt-0.5">
                      <FileText className="size-5" {...ICON} />
                    </span>
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-ui font-semibold text-ink">
                          {currentBrand.name}_Brand_Guidelines_2026.pdf
                        </span>
                        <Pill variant="solid" caps={false}>
                          Staged · 98% Confidence
                        </Pill>
                      </div>
                      <p className="text-caption leading-copy text-graphite">
                        Document Intelligence extracted 6 active rules: primary palette, prohibited colors, typography weights, logo clear space, and certified pricing facts.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 sm:self-center">
                    <button
                      type="button"
                      onClick={() => navigate('/brand-manager/uploads')}
                      className="press flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-ink px-4 text-caption font-medium text-paper transition-transform hover:scale-102 focus-visible:outline-2 focus-visible:outline-ink"
                    >
                      Open Ingestion Studio
                      <ExternalLink className="size-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            </section>
          </Stagger>
        </div>

        {/* Right 1/3 Column (320px): Brand Advisor, Reviews / Governance Counts, Recent Activity */}
        <div className="flex min-w-0 flex-col gap-8">
          <Stagger index={4}>
            <AdvisorCard view="brand_manager" />
          </Stagger>
          <Stagger index={5}>
            <ReviewsCard view="brand_manager" />
          </Stagger>
          <Stagger index={6}>
            <ActivityCard />
          </Stagger>
        </div>
      </div>
    </>
  );
}
