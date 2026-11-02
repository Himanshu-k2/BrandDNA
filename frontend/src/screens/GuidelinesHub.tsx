import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  BookMarked,
  Check,
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
import { Card, EmptyState, ICON, IconButton, PageHeader, Pill, SectionHeader, Stagger, Tabs, focusRing } from '@/components/mono/ui';
import { BRAND_GUIDELINES, type GuidelineSection } from '@/data/platform';
import { BRANDS } from '@/data/demo';
import { useSession } from '@/state/session';
import { cn } from '@/lib/cn';

type Filter = 'all' | GuidelineSection['id'];

export function GuidelinesHub() {
  const { persona } = useSession();
  const { notify } = useFrame();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<Filter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Active brand from URL search query (e.g. /guidelines?brand=omnicloud)
  const brandKey = searchParams.get('brand') || 'novafit';
  const brandConfig = BRAND_GUIDELINES[brandKey] || BRAND_GUIDELINES.novafit;

  const handleSelectBrand = (id: string) => {
    setSearchParams({ brand: id });
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

  // Filter sections by tab and query
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

  const totalRules = brandConfig.sections.reduce((acc, s) => acc + s.rows.length, 0);

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

      {/* ── Segmented Brand Selector (Neo Kinpaku Craft) ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-caption font-semibold tracking-wider text-graphite uppercase">
            Active Brand Workspace
          </span>
          <span className="text-caption text-mid">
            {totalRules} live enforcement rules active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {BRANDS.map(b => {
            const active = (b.id === brandKey);

            return (
              <button
                key={b.id}
                type="button"
                onClick={() => handleSelectBrand(b.id)}
                className={cn(
                  'group flex items-center justify-between rounded-panel border p-4 text-left transition-all duration-200 cursor-pointer',
                  focusRing,
                  active
                    ? 'border-brand-orange bg-brand-orange/[0.05] shadow-sm ring-1 ring-brand-orange/30'
                    : 'border-silver/80 bg-paper hover:border-graphite/40 hover:bg-silver/10'
                )}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-item font-display font-bold text-caption tracking-wider transition-transform group-hover:scale-105',
                      active ? 'bg-ink text-paper' : 'bg-silver/40 text-ink'
                    )}
                  >
                    {b.initials}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-ui font-semibold text-ink leading-tight">
                      {b.name}
                    </p>
                    <p className="truncate text-caption text-graphite mt-0.5">
                      {b.sector}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 pl-2">
                  {active ? (
                    <span className="flex size-2 rounded-full bg-brand-orange ring-4 ring-brand-orange/20" />
                  ) : (
                    <span className="flex size-2 rounded-full bg-silver/60 group-hover:bg-mid" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Toolbar: Category Filter Tabs + Real-Time Search ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          label="Guideline categories"
          value={filter}
          onChange={setFilter}
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
            placeholder={`Search ${brandConfig.brandName} rules...`}
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

      {/* ── Guideline Sections Display ── */}
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

              {/* ── Category 1: Approved Facts (Tactile Bento Grid) ── */}
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
                            <span className="text-caption font-semibold text-graphite uppercase tracking-wider">
                              {row.label}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                              <ShieldCheck className="size-3" strokeWidth={2.5} /> Certified Fact
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

              {/* ── Category 2: Terminology / Lexicon (Before / After Comparison) ── */}
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

                          <div className="flex items-center gap-2 shrink-0">
                            <Pill variant="outline" icon={BookMarked} caps={false}>
                              {row.source}
                            </Pill>

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

              {/* ── Category 3: Mandatory Disclaimers (Legal Vault Containers) ── */}
              {section.id === 'disclaimers' && (
                <div className="grid grid-cols-1 gap-4">
                  {section.rows.map(row => {
                    const rowKey = `disc-${row.label}`;
                    const isCopied = copiedKey === rowKey;

                    return (
                      <Card
                        key={row.label}
                        className="group flex flex-col gap-4 border-l-4 border-l-brand-orange p-5 transition-all duration-200 hover:shadow-soft"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className="text-ui font-semibold text-ink">
                              {row.label}
                            </span>
                            <p className="text-caption text-graphite mt-0.5">
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
                            <BookMarked className="size-3.5 text-ink shrink-0" {...ICON} />
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

              {/* ── Category 4: Tone of Voice Directives ── */}
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
                            <span className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2 py-0.5 text-caption font-semibold text-ink">
                              <Sparkles className="size-3 text-brand-orange" {...ICON} /> Brand Persona
                            </span>
                          </div>

                          <p className="text-ui font-semibold text-ink">
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

                          <IconButton
                            label={`Copy "${row.value}"`}
                            size="sm"
                            onClick={() => copy(rowKey, row.value)}
                          >
                            {isCopied ? (
                              <Check className="size-4 text-emerald-600" {...ICON} />
                            ) : (
                              <Copy className="size-4 text-graphite" {...ICON} />
                            )}
                          </IconButton>
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
