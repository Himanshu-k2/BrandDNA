import { useState, useRef, useEffect, useMemo } from 'react';
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
  Volume2,
  X
} from 'lucide-react';
import { useFrame } from '@/components/mono/AppFrame';
import { ICON, PageHeader, Pill, focusRing } from '@/components/mono/ui';
import { RollingNumber } from '@/components/mono/accent';
import { BRAND_GUIDELINES, type GuidelineSection } from '@/data/platform';
import { BRANDS } from '@/data/demo';
import { useSession } from '@/state/session';
import { useDismiss } from '@/hooks/useDismiss';
import { cn } from '@/lib/cn';

type Filter = 'all' | GuidelineSection['id'];

const CATEGORY_NAMES: Record<GuidelineSection['id'], string> = {
  facts: 'Approved facts',
  terms: 'Terminology',
  disclaimers: 'Mandatory disclaimers',
  tone: 'Tone of voice',
};

export function GuidelinesHub() {
  const { persona } = useSession();
  const { notify } = useFrame();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active brand workspace from URL (default novafit)
  const brandKey = searchParams.get('brand') || 'novafit';
  const brandConfig = BRAND_GUIDELINES[brandKey] || BRAND_GUIDELINES.novafit;

  // Active category from URL parameter
  const categoryParam = searchParams.get('category') as Filter | null;
  const initialFilter: Filter =
    categoryParam && ['facts', 'terms', 'disclaimers', 'tone'].includes(categoryParam)
      ? categoryParam
      : 'all';

  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [inCategorySearch, setInCategorySearch] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const brandDropdownRef = useRef<HTMLDivElement>(null);
  const inspectedViewRef = useRef<HTMLDivElement>(null);
  useDismiss(brandDropdownRef, brandDropdownOpen, () => setBrandDropdownOpen(false));

  // Sync state if category param in URL changes
  useEffect(() => {
    if (categoryParam && ['facts', 'terms', 'disclaimers', 'tone'].includes(categoryParam)) {
      setFilter(categoryParam);
    } else if (!categoryParam) {
      setFilter('all');
    }
  }, [categoryParam]);

  // Smooth scroll to the dedicated category view when a card is selected
  useEffect(() => {
    if (filter !== 'all' && inspectedViewRef.current) {
      inspectedViewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [filter]);

  const handleSelectBrand = (id: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('brand', id);
      return next;
    });
  };

  const handleSelectCategory = (cat: Filter) => {
    setFilter(cat);
    setInCategorySearch('');
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

  const activeSection = brandConfig.sections.find(s => s.id === filter);
  const isCardOpen = filter !== 'all' && Boolean(activeSection);

  // Filter rows within active category if search query typed
  const filteredRows = useMemo(() => {
    if (!activeSection) return [];
    if (!inCategorySearch.trim()) return activeSection.rows;
    const query = inCategorySearch.toLowerCase().trim();
    return activeSection.rows.filter(
      r =>
        r.label.toLowerCase().includes(query) ||
        r.value.toLowerCase().includes(query) ||
        (r.note && r.note.toLowerCase().includes(query)) ||
        (r.source && r.source.toLowerCase().includes(query))
    );
  }, [activeSection, inCategorySearch]);

  return (
    <div className="flex flex-col gap-8">
      {/* ── Page Header (Avatars & Bell ALWAYS Top-Right) ── */}
      <PageHeader
        title="Brand Guidelines Hub"
        subtitle={`${brandConfig.brandName} · Verified facts, terminology rules, disclaimers, and voice directives.`}
        onBack={() => navigate(-1)}
        backAriaLabel="Back to previous page"
        eyebrow={
          <Pill variant="outline" icon={Lock} caps={false}>
            {persona.role === 'admin'
              ? 'Platform admin access'
              : 'Audit-enforced rules'}
          </Pill>
        }
      />

      {/* ── Active Brand Workspace Dropdown (Compact Pill Selector) ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-caption font-semibold tracking-wider text-graphite uppercase">
            Active workspace
          </span>
          <span className="text-caption text-mid font-medium">
            {totalRules} active rules
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
              <span
                style={{ color: '#ffffff' }}
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-caption font-bold !text-white text-white select-none"
              >
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
                        style={isSelected ? { color: '#ffffff' } : undefined}
                        className={cn(
                          'flex size-7 shrink-0 items-center justify-center rounded-full text-caption font-bold select-none',
                          isSelected ? 'bg-ink !text-white text-white' : 'bg-silver/50 text-ink'
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

      {/* ── 4 Guideline Category Cards (Bento Grid Layout) ── */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-caption font-semibold tracking-wider text-graphite uppercase">
            Rule categories · Select a card to inspect
          </span>
          {isCardOpen && (
            <button
              type="button"
              onClick={() => handleSelectCategory('all')}
              className="press flex items-center gap-1.5 text-caption font-semibold text-brand-orange hover:underline cursor-pointer"
            >
              <ArrowLeft className="size-3.5" {...ICON} /> Close card view
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Approved Facts (Hero Orange) */}
          <button
            type="button"
            onClick={() => handleSelectCategory('facts')}
            className={cn(
              'group/card relative flex min-h-36 flex-col justify-between rounded-panel p-6 text-left transition-all duration-200 cursor-pointer',
              focusRing,
              'bg-brand-orange text-ink hover:scale-[1.01] hover:shadow-soft',
              filter === 'facts'
                ? 'ring-4 ring-ink/30 border-2 border-ink shadow-lift'
                : 'opacity-95 hover:opacity-100'
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-ui font-bold text-ink">Approved facts</p>
              <span className="flex size-11 items-center justify-center rounded-full bg-ink text-brand-orange transition-transform duration-200 group-hover/card:scale-110 shadow-sm">
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
              Verified pricing, rates, and certified metrics
            </p>
          </button>

          {/* Card 2: Terminology (Hero Black) */}
          <button
            type="button"
            onClick={() => handleSelectCategory('terms')}
            className={cn(
              'group/card relative flex min-h-36 flex-col justify-between rounded-panel p-6 text-left transition-all duration-200 cursor-pointer',
              focusRing,
              'bg-ink text-paper hover:scale-[1.01] hover:shadow-soft',
              filter === 'terms'
                ? 'ring-4 ring-brand-orange/50 border-2 border-brand-orange shadow-lift'
                : 'opacity-95 hover:opacity-100'
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-ui font-bold text-paper">Terminology</p>
              <span className="flex size-11 items-center justify-center rounded-full bg-brand-orange text-ink transition-transform duration-200 group-hover/card:scale-110 shadow-sm">
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
              Approved terms and prohibited phrasing
            </p>
          </button>

          {/* Card 3: Mandatory Disclaimers (White / Paper) */}
          <button
            type="button"
            onClick={() => handleSelectCategory('disclaimers')}
            className={cn(
              'group/card relative flex min-h-36 flex-col justify-between rounded-panel border border-silver bg-paper p-6 text-left shadow-soft transition-all duration-200 cursor-pointer hover:border-graphite/40 hover:scale-[1.01]',
              focusRing,
              filter === 'disclaimers'
                ? 'ring-4 ring-brand-orange/40 border-2 border-brand-orange shadow-lift'
                : ''
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-ui font-bold text-graphite">Mandatory disclaimers</p>
              <span className="flex size-11 items-center justify-center rounded-full bg-brand-orange text-paper transition-transform duration-200 group-hover/card:scale-110 shadow-sm">
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
              Required legal notices and disclaimers
            </p>
          </button>

          {/* Card 4: Tone of Voice (White / Paper) */}
          <button
            type="button"
            onClick={() => handleSelectCategory('tone')}
            className={cn(
              'group/card relative flex min-h-36 flex-col justify-between rounded-panel border border-silver bg-paper p-6 text-left shadow-soft transition-all duration-200 cursor-pointer hover:border-graphite/40 hover:scale-[1.01]',
              focusRing,
              filter === 'tone'
                ? 'ring-4 ring-brand-orange/40 border-2 border-brand-orange shadow-lift'
                : ''
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-ui font-bold text-graphite">Tone of voice</p>
              <span className="flex size-11 items-center justify-center rounded-full bg-brand-orange text-paper transition-transform duration-200 group-hover/card:scale-110 shadow-sm">
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
              Brand voice and persona directives
            </p>
          </button>
        </div>
      </section>

      {/* ── Dedicated Full Page Section Below the Cards ── */}
      {isCardOpen && activeSection ? (
        <section
          ref={inspectedViewRef}
          className="flex flex-col gap-6 pt-4 border-t border-silver/60 scroll-mt-6 animate-in fade-in duration-200"
        >
          {/* Section Subheader & Controls */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span
                style={{ color: '#ffffff' }}
                className="flex size-9 items-center justify-center rounded-xl bg-ink !text-white text-white shadow-sm"
              >
                {activeSection.id === 'facts' && <ShieldCheck className="size-5" strokeWidth={2.5} />}
                {activeSection.id === 'terms' && <BookMarked className="size-5" strokeWidth={2.5} />}
                {activeSection.id === 'disclaimers' && <FileCheck className="size-5" strokeWidth={2.5} />}
                {activeSection.id === 'tone' && <Volume2 className="size-5" strokeWidth={2.5} />}
              </span>
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
                  {CATEGORY_NAMES[activeSection.id] || activeSection.title}
                </h2>
                <p className="text-caption text-graphite">
                  {brandConfig.brandName} · Certified compliance specifications
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* In-category Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-mid" {...ICON} />
                <input
                  type="text"
                  value={inCategorySearch}
                  onChange={e => setInCategorySearch(e.target.value)}
                  placeholder={`Search ${activeSection.title.toLowerCase()}...`}
                  className={cn(
                    'h-10 w-full rounded-full border border-silver/90 bg-paper pl-9 pr-8 text-caption text-ink placeholder:text-mid transition-all hover:border-graphite/40',
                    focusRing
                  )}
                />
                {inCategorySearch && (
                  <button
                    type="button"
                    onClick={() => setInCategorySearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mid hover:text-ink cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Rules Count Badge */}
              <span className="shrink-0 rounded-full border border-silver/80 bg-paper px-3 py-1.5 text-caption font-bold text-graphite shadow-2xs">
                {filteredRows.length} {filteredRows.length === 1 ? 'rule' : 'rules'}
              </span>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* ── Category 1: Approved Facts (Exact match to Image 2) ── */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeSection.id === 'facts' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRows.map(row => {
                const rowKey = `fact-${row.label}`;
                const isCopied = copiedKey === rowKey;

                return (
                  <div
                    key={row.label}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-silver/80 bg-paper p-6 shadow-xs transition-all duration-200 hover:border-graphite/40 hover:shadow-soft"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold tracking-wider text-graphite uppercase">
                        {row.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink">
                          <ShieldCheck className="size-3.5 text-ink" strokeWidth={2.5} /> Certified Fact
                        </span>
                        <button
                          type="button"
                          onClick={() => copy(rowKey, row.value)}
                          title="Copy certified fact"
                          className={cn(
                            'flex size-7 items-center justify-center rounded-full border transition-colors cursor-pointer',
                            isCopied
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-silver/80 bg-paper text-graphite hover:border-ink hover:text-ink'
                          )}
                        >
                          {isCopied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                        </button>
                      </div>
                    </div>

                    <p className="font-display text-subheading font-bold tracking-tight text-ink">
                      {row.value}
                    </p>

                    <div className="flex flex-col gap-2 pt-1 border-t border-silver/40">
                      <p className="text-caption leading-relaxed text-graphite">
                        {row.note}
                      </p>
                      {row.source && (
                        <div className="flex items-center gap-1.5 text-[11px] text-mid">
                          <FileText className="size-3 shrink-0" {...ICON} />
                          <span className="truncate">{row.source}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* ── Category 2: Terminology / Lexicon (Matches Attachment 8) ── */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeSection.id === 'terms' && (
            <div className="flex flex-col gap-4">
              {filteredRows.map(row => {
                const rowKey = `term-${row.label}`;
                const isCopied = copiedKey === rowKey;

                return (
                  <div
                    key={row.label}
                    className="flex flex-col gap-4 rounded-2xl border border-silver/80 bg-paper p-5 sm:p-6 shadow-xs transition-all duration-200 hover:border-graphite/40 hover:shadow-soft"
                  >
                    {/* Comparison Block: DO NOT USE -> APPROVED STANDARD */}
                    <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center gap-3">
                      {/* Prohibited Term Box */}
                      <div className="flex flex-col justify-center rounded-xl border border-silver/80 bg-silver/15 p-4 min-h-[76px]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-mid">
                          DO NOT USE
                        </span>
                        <p className="mt-1 font-sans text-base font-semibold text-graphite line-through decoration-graphite/80">
                          {row.label}
                        </p>
                      </div>

                      {/* Directional Transition Arrow */}
                      <div className="flex items-center justify-center py-1 md:py-0">
                        <span className="flex size-8 items-center justify-center rounded-full bg-brand-orange/15 text-brand-orange border border-brand-orange/30">
                          <ArrowRight className="size-4 shrink-0" {...ICON} />
                        </span>
                      </div>

                      {/* Approved Standard Term Box */}
                      <div className="flex flex-col justify-center rounded-xl border border-brand-orange/40 bg-brand-orange/5 p-4 min-h-[76px]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-orange">
                          APPROVED STANDARD
                        </span>
                        <p className="mt-1 font-sans text-base font-bold text-ink">
                          {row.value}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Metadata & Copy */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-silver/40">
                      <p className="text-caption text-graphite leading-relaxed">
                        <strong className="text-ink font-semibold">Rationale: </strong>
                        {row.note}
                      </p>

                      <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                        {row.source && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-silver/80 bg-silver/20 px-2 py-0.5 text-[11px] font-medium text-graphite">
                            <BookMarked className="size-3 text-mid" {...ICON} />
                            {row.source}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => copy(rowKey, row.value)}
                          className={cn(
                            'press flex items-center gap-1.5 rounded-full border px-3 py-1 text-caption font-semibold transition-colors cursor-pointer',
                            isCopied
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-silver bg-paper text-ink hover:border-ink hover:bg-silver/20'
                          )}
                        >
                          {isCopied ? (
                            <>
                              <Check className="size-3.5 text-emerald-600" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="size-3.5" /> Copy Term
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* ── Category 3: Mandatory Disclaimers ── */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeSection.id === 'disclaimers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRows.map(row => {
                const rowKey = `disclaimer-${row.label}`;
                const isCopied = copiedKey === rowKey;

                return (
                  <div
                    key={row.label}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-silver/80 border-l-4 border-l-brand-orange bg-paper p-6 shadow-xs transition-all duration-200 hover:border-graphite/40 hover:shadow-soft"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold tracking-wider text-graphite uppercase">
                        {row.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange/10 px-2.5 py-0.5 text-[11px] font-bold text-brand-orange">
                          <FileCheck className="size-3.5 text-brand-orange" strokeWidth={2.5} /> Mandatory
                        </span>
                        <button
                          type="button"
                          onClick={() => copy(rowKey, row.value)}
                          title="Copy verbatim disclaimer"
                          className={cn(
                            'flex size-7 items-center justify-center rounded-full border transition-colors cursor-pointer',
                            isCopied
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-silver/80 bg-paper text-graphite hover:border-ink hover:text-ink'
                          )}
                        >
                          {isCopied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-silver/80 bg-silver/15 p-4 font-sans text-body font-medium leading-relaxed text-ink">
                      &ldquo;{row.value}&rdquo;
                    </div>

                    <div className="flex flex-col gap-2 pt-1 border-t border-silver/40">
                      <p className="text-caption leading-relaxed text-graphite">
                        {row.note}
                      </p>
                      {row.source && (
                        <div className="flex items-center gap-1.5 text-[11px] text-mid">
                          <FileText className="size-3 shrink-0" {...ICON} />
                          <span className="truncate">{row.source}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* ── Category 4: Tone of Voice Directives ── */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeSection.id === 'tone' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRows.map(row => {
                const rowKey = `tone-${row.label}`;
                const isCopied = copiedKey === rowKey;

                return (
                  <div
                    key={row.label}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-silver/80 bg-paper p-6 shadow-xs transition-all duration-200 hover:border-graphite/40 hover:shadow-soft"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold tracking-wider text-graphite uppercase">
                        {row.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-silver/40 px-2.5 py-0.5 text-[11px] font-semibold text-ink">
                          <Sparkles className="size-3.5 text-brand-orange" strokeWidth={2.5} /> Brand Persona
                        </span>
                        <button
                          type="button"
                          onClick={() => copy(rowKey, row.value)}
                          title="Copy voice directive"
                          className={cn(
                            'flex size-7 items-center justify-center rounded-full border transition-colors cursor-pointer',
                            isCopied
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-silver/80 bg-paper text-graphite hover:border-ink hover:text-ink'
                          )}
                        >
                          {isCopied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                        </button>
                      </div>
                    </div>

                    <p className="font-display text-subheading font-bold tracking-tight text-ink">
                      {row.value}
                    </p>

                    <div className="flex flex-col gap-2 pt-1 border-t border-silver/40">
                      <p className="text-caption leading-relaxed text-graphite">
                        {row.note}
                      </p>
                      {row.source && (
                        <div className="flex items-center gap-1.5 text-[11px] text-mid">
                          <FileText className="size-3 shrink-0" {...ICON} />
                          <span className="truncate">{row.source}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty Search Result Fallback */}
          {filteredRows.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-silver/80 bg-paper p-12 text-center shadow-xs">
              <Search className="size-8 text-mid mb-2" {...ICON} />
              <p className="text-ui font-semibold text-ink">No matching rules found</p>
              <p className="text-caption text-graphite mt-1">
                No rules in {CATEGORY_NAMES[activeSection.id]} match &ldquo;{inCategorySearch}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => setInCategorySearch('')}
                className="mt-4 rounded-full border border-silver bg-silver/20 px-4 py-1.5 text-caption font-semibold text-ink hover:bg-silver/40 cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          )}
        </section>
      ) : (
        /* Prompt when no card is clicked yet */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-silver/90 bg-silver/10 p-10 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-paper border border-silver/80 shadow-xs mb-3">
            <Sparkles className="size-5 text-brand-orange" {...ICON} />
          </div>
          <h3 className="font-display text-lg font-bold text-ink">Select a Card Above</h3>
          <p className="max-w-md text-caption text-graphite mt-1">
            Click on Approved facts, Terminology, Mandatory disclaimers, or Tone of voice to open its dedicated page below.
          </p>
        </div>
      )}
    </div>
  );
}
