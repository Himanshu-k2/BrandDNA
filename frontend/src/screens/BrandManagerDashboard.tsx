import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  FileCheck,
  FileText,
  FileUp,
  Layers,
  Palette,
  ShieldAlert,
  ShieldCheck,
  Type
} from 'lucide-react';
import { RevealText } from '@/components/mono/RevealText';
import { Button, Card, ICON, Pill } from '@/components/mono/ui';
import SpotlightCard from '@/components/react-bits/SpotlightCard';
import { BRANDS } from '@/data/demo';
import { BRAND_STATS } from '@/data/platform';
import { useSession } from '@/state/session';
import { brandsAPI } from '@/api/brands';

const BRAND_PALETTES: Record<string, {
  primary: { name: string; hex: string; note: string };
  secondary: { name: string; hex: string; note: string };
  prohibited: { name: string; hex: string; note: string };
  headingFont: string;
  bodyFont: string;
  logoClearance: string;
  priceFact: string;
}> = {
  novafit: {
    primary: { name: 'Electric Orange', hex: '#FF4500', note: 'Primary signature color (6.7:1 contrast)' },
    secondary: { name: 'Dark Slate & Paper', hex: '#1E1E1E', note: 'Secondary surface background' },
    prohibited: { name: 'Neon Green', hex: '#39FF14', note: 'Strictly prohibited from all marketing materials' },
    headingFont: 'Inter SemiBold (600)',
    bodyFont: 'Inter Regular (400)',
    logoClearance: '24px minimum clear space on all sides',
    priceFact: 'Approved subscription: ₹999/month (Quoting ₹799 is prohibited)'
  },
  omnicloud: {
    primary: { name: 'Cyan Tech', hex: '#00E5FF', note: 'Primary digital asset anchor' },
    secondary: { name: 'Obsidian Black', hex: '#0B0F19', note: 'Enterprise backdrop' },
    prohibited: { name: 'Crimson Red', hex: '#FF0033', note: 'Prohibited in product UI and ad banners' },
    headingFont: 'Space Grotesk Bold (700)',
    bodyFont: 'Roboto Mono (400)',
    logoClearance: '32px perimeter clearance required',
    priceFact: 'Starting tier: ₹24,99,000 enterprise annual SLA'
  },
  apex: {
    primary: { name: 'Apex Navy', hex: '#0A2540', note: 'Core institutional tone' },
    secondary: { name: 'Clean Platinum', hex: '#F4F5F7', note: 'Clean banking surface' },
    prohibited: { name: 'Hot Pink', hex: '#FF007F', note: 'Prohibited across regulatory disclosures' },
    headingFont: 'Inter Display Medium (500)',
    bodyFont: 'Inter Regular (400)',
    logoClearance: '28px boundary on marketing decks',
    priceFact: 'High-Yield Savings: 6.8% APY certified'
  }
};

export function BrandManagerDashboard() {
  const { persona } = useSession();
  const navigate = useNavigate();
  const [selectedBrand, setSelectedBrand] = useState<string>('novafit');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [activeBrandList, setActiveBrandList] = useState<any[]>([...BRANDS]);

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
  const stats = BRAND_STATS[selectedBrand as keyof typeof BRAND_STATS] || BRAND_STATS['novafit'];
  const palette = BRAND_PALETTES[selectedBrand] || BRAND_PALETTES['novafit'];

  const copyToClipboard = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedHex(hex);
      setTimeout(() => setCopiedHex(null), 2000);
    } catch {}
  };

  return (
    <div className="flex flex-col gap-8">
      {/* ── Page Header & Brand Workspace Selector ── */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-1">
          <RevealText
            text={`Brand Workspace: ${currentBrand.name}`}
            className="font-display text-display font-semibold tracking-tight text-ink"
            delay={0.08}
          />
          <p className="max-w-2xl text-body text-graphite">
            Welcome, {persona.name.split(' ')[0]}. Govern colors, typography standards, logo clearance, and ingest guideline documents into live asset rules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Active Brand Switcher */}
          <div className="relative">
            <select
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
              className="press flex h-11 cursor-pointer appearance-none items-center gap-2 rounded-full border border-silver bg-paper pr-10 pl-4 text-ui font-medium text-ink shadow-sm transition-colors hover:border-mid focus-visible:outline-2 focus-visible:outline-ink"
            >
              {activeBrandList.map(b => (
                <option key={b.id} value={b.id}>
                  Workspace: {b.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-graphite" />
          </div>

          <Button
            size="md"
            variant="secondary"
            onClick={() => navigate('/brand-manager/uploads')}
          >
            <FileUp className="size-4" {...ICON} /> Ingest Guideline PDF
          </Button>

          <Button
            size="md"
            onClick={() => navigate('/brand-manager/assets')}
          >
            <Palette className="size-4" {...ICON} /> Asset Library
          </Button>
        </div>
      </header>

      {/* ── Top Bento Metrics Grid (Spotlight Cards) ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SpotlightCard className="flex flex-col gap-2 rounded-panel border border-silver bg-paper p-5 shadow-soft">
          <div className="flex items-center justify-between text-caption text-graphite">
            <span>Approved Visual Assets</span>
            <Palette className="size-4 text-ink" {...ICON} />
          </div>
          <span className="font-display text-3xl font-semibold tracking-tight text-ink tabular-nums">
            {stats.assets.toLocaleString()}
          </span>
          <span className="text-caption text-graphite">Active swatches, type & logo specs</span>
        </SpotlightCard>

        <SpotlightCard className="flex flex-col gap-2 rounded-panel border border-silver bg-paper p-5 shadow-soft">
          <div className="flex items-center justify-between text-caption text-graphite">
            <span>Compliance Pass Rate</span>
            <ShieldCheck className="size-4 text-success" {...ICON} />
          </div>
          <span className="font-display text-3xl font-semibold tracking-tight text-ink tabular-nums">
            {stats.passRate}%
          </span>
          <span className="text-caption text-success font-medium">+2.1% this reporting cycle</span>
        </SpotlightCard>

        <SpotlightCard className="flex flex-col gap-2 rounded-panel border border-silver bg-paper p-5 shadow-soft">
          <div className="flex items-center justify-between text-caption text-graphite">
            <span>Active Guideline Rules</span>
            <BookOpen className="size-4 text-ink" {...ICON} />
          </div>
          <span className="font-display text-3xl font-semibold tracking-tight text-ink tabular-nums">
            {stats.rules}
          </span>
          <span className="text-caption text-graphite">Enforced across deterministic engine</span>
        </SpotlightCard>

        <SpotlightCard className="flex flex-col gap-2 rounded-panel border border-silver bg-paper p-5 shadow-soft">
          <div className="flex items-center justify-between text-caption text-graphite">
            <span>Review Turnaround</span>
            <FileCheck className="size-4 text-ink" {...ICON} />
          </div>
          <span className="font-display text-3xl font-semibold tracking-tight text-ink tabular-nums">
            1.8 hrs
          </span>
          <span className="text-caption text-graphite">Average sign-off velocity</span>
        </SpotlightCard>
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column (7 cols): Brand Visual Standards & Palette */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          <Card className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-item bg-ink text-paper">
                  <Palette className="size-5" {...ICON} />
                </span>
                <div>
                  <h2 className="font-display text-subheading font-semibold text-ink">Core Brand Colors & Palette</h2>
                  <p className="text-caption text-graphite">Verified hex values extracted from approved brand guidelines</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/brand-manager/assets')}>
                View full library <ArrowRight className="size-4" {...ICON} />
              </Button>
            </div>

            {/* Color Swatch Tiles */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Primary */}
              <div className="flex flex-col gap-2 rounded-item border border-silver p-3">
                <div
                  className="h-16 w-full rounded-min shadow-inner flex items-end justify-end p-2"
                  style={{ backgroundColor: palette.primary.hex }}
                >
                  <button
                    type="button"
                    onClick={() => copyToClipboard(palette.primary.hex)}
                    className="flex h-7 items-center gap-1 rounded bg-black/60 px-2 text-caption text-white backdrop-blur-sm transition-transform hover:scale-105"
                  >
                    {copiedHex === palette.primary.hex ? <Check className="size-3" /> : <Copy className="size-3" />}
                    <span>{palette.primary.hex}</span>
                  </button>
                </div>
                <div className="flex flex-col">
                  <span className="text-ui font-semibold text-ink">{palette.primary.name}</span>
                  <span className="text-caption text-graphite">Primary brand anchor</span>
                </div>
              </div>

              {/* Secondary */}
              <div className="flex flex-col gap-2 rounded-item border border-silver p-3">
                <div
                  className="h-16 w-full rounded-min shadow-inner flex items-end justify-end p-2"
                  style={{ backgroundColor: palette.secondary.hex }}
                >
                  <button
                    type="button"
                    onClick={() => copyToClipboard(palette.secondary.hex)}
                    className="flex h-7 items-center gap-1 rounded bg-black/60 px-2 text-caption text-white backdrop-blur-sm transition-transform hover:scale-105"
                  >
                    {copiedHex === palette.secondary.hex ? <Check className="size-3" /> : <Copy className="size-3" />}
                    <span>{palette.secondary.hex}</span>
                  </button>
                </div>
                <div className="flex flex-col">
                  <span className="text-ui font-semibold text-ink">{palette.secondary.name}</span>
                  <span className="text-caption text-graphite">Surface backdrop</span>
                </div>
              </div>

              {/* Prohibited */}
              <div className="flex flex-col gap-2 rounded-item border border-danger/40 bg-danger/5 p-3">
                <div
                  className="h-16 w-full rounded-min shadow-inner flex items-end justify-end p-2 border border-danger/30"
                  style={{ backgroundColor: palette.prohibited.hex }}
                >
                  <span className="flex h-7 items-center gap-1 rounded bg-danger px-2 text-caption text-white font-medium">
                    <ShieldAlert className="size-3" /> BANNED
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-ui font-semibold text-danger">{palette.prohibited.name}</span>
                  <span className="text-caption text-danger/80">Strictly prohibited</span>
                </div>
              </div>
            </div>

            {/* Typography & Logo Standards Summary */}
            <div className="grid grid-cols-1 gap-4 border-t border-silver pt-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-item bg-silver/20 p-3.5">
                <Type className="size-5 shrink-0 text-ink mt-0.5" {...ICON} />
                <div className="flex flex-col gap-0.5">
                  <span className="text-caption font-semibold text-ink">Typography Standard</span>
                  <span className="text-ui font-medium text-ink">{palette.headingFont}</span>
                  <span className="text-caption text-graphite">Body: {palette.bodyFont}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-item bg-silver/20 p-3.5">
                <Layers className="size-5 shrink-0 text-ink mt-0.5" {...ICON} />
                <div className="flex flex-col gap-0.5">
                  <span className="text-caption font-semibold text-ink">Logo Clear Space</span>
                  <span className="text-ui font-medium text-ink">{palette.logoClearance}</span>
                  <span className="text-caption text-graphite">Prohibited: No skewing or recoloring</span>
                </div>
              </div>
            </div>

            {/* Official Verified Fact Pill */}
            <div className="rounded-item border border-silver bg-silver/10 p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <ShieldCheck className="size-5 shrink-0 text-success" />
                <span className="truncate text-caption font-medium text-ink">{palette.priceFact}</span>
              </div>
              <Pill variant="solid" caps={false} className="shrink-0">
                Verified Fact
              </Pill>
            </div>
          </Card>
        </div>

        {/* Right Column (5 cols): Guideline PDF Ingestion Pipeline */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          <Card className="flex flex-col gap-5 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-item bg-ink text-paper">
                  <BookOpen className="size-5" {...ICON} />
                </span>
                <div>
                  <h2 className="font-display text-subheading font-semibold text-ink">Guideline Ingestion</h2>
                  <p className="text-caption text-graphite">Document intelligence extraction</p>
                </div>
              </div>
              <Pill variant="silver" caps={false}>
                AI Engine Active
              </Pill>
            </div>

            <p className="text-body text-graphite leading-relaxed">
              Upload PDF brand manuals to automatically parse color tokens, font hierarchy, logo clearance, and pricing rules into active governance rules.
            </p>

            {/* Pre-packaged Guideline Templates */}
            <div className="flex flex-col gap-2">
              <span className="text-caption font-semibold text-ink">Available Reference Guidelines:</span>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between rounded-item border border-silver p-3 transition-colors hover:bg-silver/20">
                  <div className="flex items-center gap-2.5">
                    <FileText className="size-5 text-ink" />
                    <div className="flex flex-col">
                      <span className="text-caption font-medium text-ink">NovaFit_Brand_Guidelines_2026.pdf</span>
                      <span className="text-caption text-graphite">Official palette, weights & ₹999 pricing</span>
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => navigate('/brand-manager/uploads')}>
                    Parse <ExternalLink className="size-3.5" />
                  </Button>
                </div>

                <div className="flex items-center justify-between rounded-item border border-silver p-3 transition-colors hover:bg-silver/20">
                  <div className="flex items-center gap-2.5">
                    <FileText className="size-5 text-ink" />
                    <div className="flex flex-col">
                      <span className="text-caption font-medium text-ink">VoltAuto_Brand_Guidelines_2026.pdf</span>
                      <span className="text-caption text-graphite">Cyan palette, typography & EV facts</span>
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => navigate('/brand-manager/uploads')}>
                    Parse <ExternalLink className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-2 flex flex-col gap-2">
              <Button size="lg" onClick={() => navigate('/brand-manager/uploads')}>
                <FileUp className="size-4" {...ICON} /> Upload & Extract PDF
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
