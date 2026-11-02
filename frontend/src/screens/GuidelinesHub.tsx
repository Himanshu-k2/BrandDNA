import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookMarked,
  Check,
  ChevronsUpDown,
  Copy,
  FileCheck,
  FileText,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  Volume2
} from 'lucide-react';
import { useFrame } from '@/components/mono/AppFrame';
import { Card, EmptyState, ICON, PageHeader, Pill, SectionHeader, Stagger, Tabs, focusRing } from '@/components/mono/ui';
import { RollingNumber } from '@/components/mono/accent';
import { BRAND_GUIDELINES, type GuidelineSection } from '@/data/platform';
import { BRANDS } from '@/data/demo';
import { useSession } from '@/state/session';
import { useDismiss } from '@/hooks/useDismiss';
import { cn } from '@/lib/cn';

type Filter = 'all' | GuidelineSection['id'];

const CATEGORY_TITLES: Record<string, string> = {
  facts: 'Approved facts',
  terms: 'Terminology',
  disclaimers: 'Mandatory disclaimers',
  tone: 'Tone of voice'
};

export function GuidelinesHub() {
  const { persona } = useSession();
  const { notify } = useFrame();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active brand & category from URL query parameter (e.g. /guidelines?brand=apex&category=facts)
  const brandKey = searchParams.get('brand') || 'novafit';
  const brandConfig = BRAND_GUIDELINES[brandKey] || BRAND_GUIDELINES.novafit;

  const categoryParam = searchParams.get('category') as Filter | null;
  const initialFilter: Filter =
    categoryParam && ['facts', 'terms', 'disclaimers', 'tone'].includes(categoryParam)
      ? categoryParam
      : 'all';

  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const brandDropdownRef = useRef<HTMLDivElement>(null);
  useDismiss(brandDropdownRef, brandDropdownOpen, () => setBrandDropdownOpen(false));

  // Sync state if category param in URL changes
  useEffect(() => {
    if (categoryParam && ['facts', 'terms', 'disclaimers', 'tone'].includes(categoryParam)) {
      setFilter(categoryParam);
    } else if (!categoryParam) {
      setFilter('all');
    }
  }, [categoryParam]);

  const handleSelectBrand = (id: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('brand', id);
      return next;
    });
  };

  const handleSelectCategory = (cat: Filter) => {
    setFilter(cat);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (cat === 'all') {
        next.delete('category');
      } else {
        next.set('category', cat);
      }
      return next;
    });
  };

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      notify('Copied to clipboard', 'success');
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      notify('Copy unavailable in this browser', 'danger');
    }
  };

  // Pre-calculate counts for the 4 overview cards
  const factsCount = brandConfig.sections.find(s => s.id === 'facts')?.rows.length || 0;
  const termsCount = brandConfig.sections.find(s => s.id === 'terms')?.rows.length || 0;
  const disclaimersCount = brandConfig.sections.find(s => s.id === 'disclaimers')?.rows.length || 0;
  const toneCount = brandConfig.sections.find(s => s.id === 'tone')?.rows.length || 0;
  const totalRules = brandConfig.sections.reduce((acc, s) => acc + s.rows.length, 0);

  // Filter sections by tab and query. When filter !== 'all', it shows ONLY that card's guidelines!
  const filteredSections = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return brandConfig.sections
      .filter(section => filter === 'all' || section.id === filter)
      .map(section => {
        if (!q) return section;
        const matchingRows = section.rows.filter(
          row =>
            row.label.toLowerCase().includes(q) ||
            row.value.toLowerCase().includes(q) ||
            row.note.toLowerCase().includes(q) ||
            row.source.toLowerCase().includes(q)
        );
        return { ...section, rows: matchingRows };
      })
      .filter(section => section.rows.length > 0);
  }, [brandConfig, filter, searchQuery]);

  return (
    <div className="flex flex-col gap-8">
      {/* ── Page Header (Avatars & Bell ALWAYS Top-Right) ── */}
      <PageHeader
        title="Brand Guidelines Hub"
        subtitle={`${brandConfig.brandName} · official approved facts, lexicon terminology, mandatory disclaimers, and voice rules enforced by the audit engine.`}
        onBack={() => navigate(-1)}
        backAriaLabel="Back to previous page"
        eyebrow={
          <Pill variant="outline" icon={Lock} caps={false}>
            {persona.role === 'admin'
              ? 'Managed by you · Platform Admin'
              : 'Verified Brand Guidelines · Audit Enforced'}
          </Pill>
        }
      />

      {/* ── Active Brand Workspace Dropdown (Compact Pill Selector) ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-caption font-semibold tracking-wider text-graphite uppercase">
            Active Brand Workspace
          </span>
          <span className="text-caption text-mid">
            {totalRules} live enforcement rules active
          </span>
        </div>

        <div ref={brandDropdownRef} className="relative inline-block w-full max-w-xs">
          <button
            type="button"
            onClick={() => setBrandDropdownOpen(prev => !prev)}
            aria-expanded={brandDropdownOpen}
            aria-haspopup="listbox"
            className={cn(
              'group flex h-12 w-full items-center justify-between rounded-full border border-silver/90 bg-paper px-3 pr-4 text-left shadow-xs transition-all duration-200 hover:border-graphite/40 hover:bg-silver/10 cursor-pointer',
              focusRing,
              brandDropdownOpen && 'border-ink/80 ring-2 ring-ink/10'
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-caption font-bold text-paper">
                {brandConfig.brandInitials}
              </span>
              <span className="truncate text-ui font-semibold text-ink">
                {brandConfig.brandName}
              </span>
            </div>
            <ChevronsUpDown className="size-4 shrink-0 text-graphite ml-2 transition-transform duration-200" {...ICON} />
          </button>

          {/* Dropdown Menu */}
          {brandDropdownOpen && (
            <div
              role="listbox"
              className="absolute top-full left-0 z-50 mt-2 w-full min-w-72 rounded-2xl border border-silver/80 bg-paper p-1.5 shadow-float backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
            >
              {BRANDS.map(b => {
                const isSelected = b.id === brandKey;

                return (
                  <button
                    key={b.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      handleSelectBrand(b.id);
                      setBrandDropdownOpen(false);
                    }}
                    className={cn(
                      'group/opt flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors cursor-pointer',
                      isSelected ? 'bg-silver/40 font-semibold text-ink' : 'text-graphite hover:bg-silver/20 hover:text-ink'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={cn(
                          'flex size-7 shrink-0 items-center justify-center rounded-full text-caption font-bold',
                          isSelected ? 'bg-ink text-paper' : 'bg-silver/50 text-ink'
                        )}
                      >
                        {b.initials}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="truncate text-ui leading-tight">{b.name}</span>
                        <span className="truncate text-caption text-mid">{b.sector}</span>
                      </div>
                    </div>

                    <div className="shrink-0 pl-2">
                      {isSelected ? (
                        <Check className="size-4 text-brand-orange" {...ICON} />
                      ) : (
                        <span className="size-1.5 rounded-full bg-silver/80 group-hover/opt:bg-graphite" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── 4 Guideline Category Cards (Image 5 Bento Grid Layout) ── */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-caption font-semibold tracking-wider text-graphite uppercase">
            Guideline Categories · Select a card to inspect rules
          </span>
          {filter !== 'all' && (
            <button
              type="button"
              onClick={() => handleSelectCategory('all')}
              className="press flex items-center gap-1.5 text-caption font-semibold text-brand-orange hover:underline cursor-pointer"
            >
              <ArrowLeft className="size-3.5" {...ICON} /> View all categories
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Approved Facts (Hero Orange) */}
          <button
            type="button"
            onClick={() => handleSelectCategory(filter === 'facts' ? 'all' : 'facts')}
            className={cn(
              'group/card relative flex min-h-36 flex-col justify-between rounded-panel p-6 text-left transition-all duration-200 cursor-pointer',
              focusRing,
              'bg-brand-orange text-ink hover:scale-[1.01] hover:shadow-soft',
              filter === 'facts' ? 'ring-4 ring-ink/30 shadow-lift' : 'opacity-95 hover:opacity-100'
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-ui font-medium text-ink">Approved facts</p>
              <span className="flex size-11 items-center justify-center rounded-full bg-ink text-brand-orange transition-transform duration-200 group-hover/card:scale-110">
                <ArrowUpRight className="size-6 shrink-0" {...ICON} />
              </span>
            </div>
            <div className="my-1 flex items-baseline gap-2">
              <span className="font-display text-display font-semibold tracking-tight text-ink tabular-nums">
                <RollingNumber value={factsCount} />
              </span>
              <span className="text-ui font-medium text-ink/80">rules active</span>
            </div>
            <p className="text-caption text-ink/90 font-medium">
              Audit-enforced pricing, APY yields, and certified metrics
            </p>
          </button>

          {/* Card 2: Terminology (Hero Black) */}
          <button
            type="button"
            onClick={() => handleSelectCategory(filter === 'terms' ? 'all' : 'terms')}
            className={cn(
              'group/card relative flex min-h-36 flex-col justify-between rounded-panel p-6 text-left transition-all duration-200 cursor-pointer',
              focusRing,
              'bg-ink text-paper hover:scale-[1.01] hover:shadow-soft',
              filter === 'terms' ? 'ring-4 ring-brand-orange/40 shadow-lift' : 'opacity-95 hover:opacity-100'
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-ui font-medium text-paper">Terminology</p>
              <span className="flex size-11 items-center justify-center rounded-full bg-brand-orange text-ink transition-transform duration-200 group-hover/card:scale-110">
                <ArrowUpRight className="size-6 shrink-0" {...ICON} />
              </span>
            </div>
            <div className="my-1 flex items-baseline gap-2">
              <span className="font-display text-display font-semibold tracking-tight text-brand-orange tabular-nums">
                <RollingNumber value={termsCount} />
              </span>
              <span className="text-ui font-medium text-silver/80">rules active</span>
            </div>
            <p className="text-caption text-silver">
              Approved phrasing, prohibited buzzwords & standard lexicon
            </p>
          </button>

          {/* Card 3: Mandatory Disclaimers (White / Paper) */}
          <button
            type="button"
            onClick={() => handleSelectCategory(filter === 'disclaimers' ? 'all' : 'disclaimers')}
            className={cn(
              'group/card relative flex min-h-36 flex-col justify-between rounded-panel border border-silver bg-paper p-6 text-left shadow-soft transition-all duration-200 cursor-pointer hover:border-graphite/40 hover:scale-[1.01]',
              focusRing,
              filter === 'disclaimers' ? 'ring-4 ring-brand-orange/30 border-brand-orange shadow-lift' : ''
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-ui font-medium text-graphite">Mandatory disclaimers</p>
              <span className="flex size-11 items-center justify-center rounded-full bg-brand-orange text-paper transition-transform duration-200 group-hover/card:scale-110">
                <ArrowUpRight className="size-6 shrink-0" {...ICON} />
              </span>
            </div>
            <div className="my-1 flex items-center justify-between gap-4">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-display font-semibold tracking-tight text-ink tabular-nums">
                  <RollingNumber value={disclaimersCount} />
                </span>
                <span className="text-ui font-medium text-graphite">rules active</span>
              </div>
              <span className="rounded-chip bg-brand-orange/10 px-2.5 py-1 text-caption font-bold text-brand-orange">
                Mandatory
              </span>
            </div>
            <p className="text-caption text-graphite">
              Statutory regulatory disclosures & verbatim legal notices
            </p>
          </button>

          {/* Card 4: Tone of Voice (White / Paper) */}
          <button
            type="button"
            onClick={() => handleSelectCategory(filter === 'tone' ? 'all' : 'tone')}
            className={cn(
              'group/card relative flex min-h-36 flex-col justify-between rounded-panel border border-silver bg-paper p-6 text-left shadow-soft transition-all duration-200 cursor-pointer hover:border-graphite/40 hover:scale-[1.01]',
              focusRing,
              filter === 'tone' ? 'ring-4 ring-brand-orange/30 border-brand-orange shadow-lift' : ''
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-ui font-medium text-graphite">Tone of voice</p>
              <span className="flex size-11 items-center justify-center rounded-full bg-brand-orange text-paper transition-transform duration-200 group-hover/card:scale-110">
                <ArrowUpRight className="size-6 shrink-0" {...ICON} />
              </span>
            </div>
            <div className="my-1 flex items-center justify-between gap-4">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-display font-semibold tracking-tight text-ink tabular-nums">
                  <RollingNumber value={toneCount} />
                </span>
                <span className="text-ui font-medium text-graphite">rules active</span>
              </div>
              <span className="rounded-chip bg-silver/40 px-2.5 py-1 text-caption font-bold text-ink">
                Brand Persona
              </span>
            </div>
            <p className="text-caption text-graphite">
              Institutional persona, voice posture & directives
            </p>
          </button>
        </div>
      </section>

      {/* ── Single Card Active Banner (When one card is open) ── */}
      {filter !== 'all' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-silver/90 bg-silver/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSelectCategory('all')}
              className="press flex items-center gap-1.5 rounded-full border border-silver bg-paper px-3 py-1.5 text-caption font-semibold text-ink shadow-xs transition-colors hover:border-mid hover:bg-silver/20 cursor-pointer"
            >
              <ArrowLeft className="size-4" {...ICON} /> All Categories
            </button>
            <span className="text-caption text-graphite">
              Showing only <span className="font-semibold text-ink">{CATEGORY_TITLES[filter]}</span> for {brandConfig.brandName}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleSelectCategory('all')}
            className="text-caption font-medium text-brand-orange hover:underline cursor-pointer"
          >
            Close single-card view
          </button>
        </div>
      )}

      {/* ── Toolbar: Category Filter Tabs + Real-Time Search ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          label="Guideline categories"
          value={filter}
          onChange={handleSelectCategory}
          items={[
            { id: 'all' as Filter, label: 'All Rules' },
            ...brandConfig.sections.map(section => ({
              id: section.id as Filter,
              label: section.title,
              count: section.rows.length
            }))
          ]}
        />

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-graphite" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={
              filter === 'all'
                ? `Search ${brandConfig.brandName} rules...`
                : `Search ${brandConfig.brandName} ${CATEGORY_TITLES[filter] || 'rules'}...`
            }
            className={cn(
              'h-10 w-full rounded-full border border-silver bg-paper pr-4 pl-10 text-caption text-ink placeholder:text-mid shadow-xs transition-colors hover:border-mid focus:border-ink focus:outline-none',
              focusRing
            )}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-caption text-graphite hover:text-ink cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Guideline Sections Display (Shows ONLY that card's guidelines when a card is selected) ── */}
      {filteredSections.length === 0 ? (
        <Card className="p-8">
          <EmptyState icon={Search} title="No matching guideline rules found">
            No rules in {brandConfig.brandName} match &ldquo;{searchQuery}&rdquo;. Try clearing your search or switching categories.
          </EmptyState>
        </Card>
      ) : (
        <div className="flex flex-col gap-10">
          {filteredSections.map((section, sIdx) => (
            <Stagger key={section.id} index={sIdx + 1} className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-chip bg-ink text-paper">
                    {section.id === 'facts' && <ShieldCheck className="size-4" {...ICON} />}
                    {section.id === 'terms' && <BookMarked className="size-4" {...ICON} />}
                    {section.id === 'disclaimers' && <FileCheck className="size-4" {...ICON} />}
                    {section.id === 'tone' && <Volume2 className="size-4" {...ICON} />}
                  </span>
                  <SectionHeader title={section.title} />
                </div>
                <span className="rounded-full border border-silver bg-silver/20 px-2.5 py-0.5 text-caption font-semibold text-graphite">
                  {section.rows.length} {section.rows.length === 1 ? 'rule' : 'rules'}
                </span>
              </div>

              {/* ── Category 1: Approved Facts (Matching Image 1: 2-Column Grid) ── */}
              {section.id === 'facts' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.rows.map(row => {
                    const rowKey = `fact-${row.label}`;
                    const isCopied = copiedKey === rowKey;

                    return (
                      <Card
                        key={row.label}
                        className="group flex flex-col justify-between gap-4 p-5 transition-all duration-200 hover:border-graphite/40 hover:shadow-soft"
                      >
                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-[11px] font-semibold text-graphite uppercase tracking-wider">
                              {row.label}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full text-[11px] font-bold text-ink">
                              <ShieldCheck className="size-3.5 text-ink" strokeWidth={2.5} /> Certified Fact
                            </span>
                          </div>

                          <p className="font-display text-subheading font-bold text-ink tracking-tight">
                            {row.value}
                          </p>

                          <p className="text-caption text-graphite leading-relaxed">
                            {row.note}
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-silver/60 pt-3 mt-1">
                          <span className="inline-flex items-center gap-1.5 text-caption text-mid">
                            <FileText className="size-3.5 text-graphite shrink-0" {...ICON} />
                            <span className="truncate max-w-[200px]">{row.source}</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => copy(rowKey, row.value)}
                            className={cn(
                              'press flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-caption font-medium transition-all duration-150',
                              focusRing,
                              isCopied
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                : 'border-silver bg-paper text-ink hover:border-mid hover:bg-silver/20'
                            )}
                          >
                            {isCopied ? (
                              <>
                                <Check className="size-3.5 text-emerald-600" {...ICON} /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="size-3.5 text-graphite" {...ICON} /> Copy Fact
                              </>
                            )}
                          </button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* ── Category 2: Terminology / Lexicon (Matching Image 2: Strikethrough -> Approved) ── */}
              {section.id === 'terms' && (
                <div className="grid grid-cols-1 gap-4">
                  {section.rows.map(row => {
                    const rowKey = `term-${row.label}`;
                    const isCopied = copiedKey === rowKey;

                    return (
                      <Card
                        key={row.label}
                        className="group flex flex-col gap-4 p-5 transition-all duration-200 hover:border-graphite/40"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1.4fr] items-center gap-3">
                          {/* Do not use */}
                          <div className="rounded-item border border-silver/80 bg-silver/20 p-3.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-mid block mb-1">
                              Do Not Use
                            </span>
                            <span className="text-ui font-medium text-graphite line-through decoration-graphite">
                              {row.label}
                            </span>
                          </div>

                          {/* Transition arrow badge */}
                          <div className="flex justify-center py-1 md:py-0">
                            <span className="flex size-7 items-center justify-center rounded-full bg-brand-orange/15 text-brand-orange">
                              <ArrowRight className="size-3.5" strokeWidth={2.5} />
                            </span>
                          </div>

                          {/* Approved replacement */}
                          <div className="rounded-item border border-ink/20 bg-ink/[0.04] p-3.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-orange block mb-1">
                              Approved Standard
                            </span>
                            <span className="text-ui font-bold text-ink">
                              {row.value}
                            </span>
                          </div>
                        </div>

                        {/* Rationale & Source */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-silver/60 pt-3">
                          <p className="text-caption text-graphite min-w-0 flex-1">
                            <span className="font-semibold text-ink">Rationale:</span> {row.note}
                          </p>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="inline-flex items-center gap-1.5 text-caption text-mid">
                              <BookMarked className="size-3.5 text-graphite" {...ICON} />
                              <span>{row.source}</span>
                            </span>

                            <button
                              type="button"
                              onClick={() => copy(rowKey, row.value)}
                              className={cn(
                                'press flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-caption font-medium transition-all duration-150',
                                focusRing,
                                isCopied
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                  : 'border-silver bg-paper text-ink hover:border-mid hover:bg-silver/20'
                              )}
                            >
                              {isCopied ? (
                                <>
                                  <Check className="size-3.5 text-emerald-600" {...ICON} /> Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="size-3.5 text-graphite" {...ICON} /> Copy Term
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* ── Category 3: Mandatory Disclaimers (Matching Image 3: Orange Accent & Quote Box) ── */}
              {section.id === 'disclaimers' && (
                <div className="grid grid-cols-1 gap-4">
                  {section.rows.map(row => {
                    const rowKey = `disclaimer-${row.label}`;
                    const isCopied = copiedKey === rowKey;

                    return (
                      <Card
                        key={row.label}
                        className="group flex flex-col gap-3.5 border-l-4 border-l-brand-orange p-5 transition-all duration-200 hover:border-graphite/40"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-col gap-1 min-w-0 flex-1">
                            <h3 className="font-display text-subheading font-bold text-ink">
                              {row.label}
                            </h3>
                            <p className="text-caption text-graphite">
                              {row.note}
                            </p>
                          </div>

                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-orange/10 px-2.5 py-0.5 text-[11px] font-bold text-brand-orange shrink-0">
                            Mandatory Legal Text
                          </span>
                        </div>

                        {/* Verbatim quote block */}
                        <div className="rounded-item border border-silver/80 bg-silver/15 p-4 font-sans text-body font-medium text-ink leading-relaxed">
                          &ldquo;{row.value}&rdquo;
                        </div>

                        <div className="flex items-center justify-between border-t border-silver/60 pt-3">
                          <span className="inline-flex items-center gap-1.5 text-caption text-graphite">
                            <FileText className="size-3.5 text-ink shrink-0" {...ICON} />
                            {row.source}
                          </span>

                          <button
                            type="button"
                            onClick={() => copy(rowKey, row.value)}
                            className={cn(
                              'press flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-caption font-medium transition-colors',
                              focusRing,
                              isCopied
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                : 'border-silver bg-paper text-ink hover:border-mid hover:bg-silver/20'
                            )}
                          >
                            {isCopied ? (
                              <>
                                <Check className="size-3.5 text-emerald-600" {...ICON} /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="size-3.5 text-graphite" {...ICON} /> Copy Verbatim Disclaimer
                              </>
                            )}
                          </button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* ── Category 4: Tone of Voice Directives (Matching Image 4: 2-Column Persona Cards) ── */}
              {section.id === 'tone' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.rows.map(row => {
                    const rowKey = `tone-${row.label}`;
                    const isCopied = copiedKey === rowKey;

                    return (
                      <Card
                        key={row.label}
                        className="flex flex-col justify-between gap-4 p-5 hover:border-graphite/40 transition-colors"
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-caption font-semibold uppercase tracking-wider text-graphite">
                              {row.label}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2.5 py-0.5 text-caption font-semibold text-ink">
                              <Sparkles className="size-3 text-brand-orange" {...ICON} /> Brand Persona
                            </span>
                          </div>

                          <p className="font-display text-subheading font-bold text-ink">
                            {row.value}
                          </p>

                          <p className="text-caption text-graphite leading-relaxed">
                            {row.note}
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-silver/60 pt-3">
                          <span className="text-caption text-mid">
                            {row.source}
                          </span>

                          <button
                            type="button"
                            onClick={() => copy(rowKey, row.value)}
                            className={cn(
                              'press flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-caption font-medium transition-all duration-150',
                              focusRing,
                              isCopied
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                : 'border-silver bg-paper text-ink hover:border-mid hover:bg-silver/20'
                            )}
                          >
                            {isCopied ? (
                              <>
                                <Check className="size-3.5 text-emerald-600" {...ICON} /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="size-3.5 text-graphite" {...ICON} /> Copy Directive
                              </>
                            )}
                          </button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </Stagger>
          ))}
        </div>
      )}
    </div>
  );
}
