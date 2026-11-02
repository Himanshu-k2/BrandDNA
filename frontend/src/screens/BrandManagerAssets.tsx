import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  ChevronDown,
  CircleAlert,
  Copy,
  Layers,
  Palette,
  ShieldAlert,
  ShieldCheck,
  Type
} from 'lucide-react';
import { Card, ICON, PageHeader, Pill } from '@/components/mono/ui';
import { useFrame } from '@/components/mono/AppFrame';

interface AssetPalette {
  name: string;
  hex: string;
  role: 'primary' | 'secondary' | 'accent' | 'prohibited';
  contrast: string;
  notes: string;
}

const BRAND_DATA: Record<string, {
  name: string;
  sector: string;
  colors: AssetPalette[];
  typography: Array<{ role: string; family: string; weight: string; sample: string }>;
  logoRules: { minClearSpace: string; allowedPlacement: string; prohibited: string[] };
  pricingFacts: Array<{ label: string; value: string; rule: string }>;
}> = {
  novafit: {
    name: 'NovaFit Health',
    sector: 'Fitness & Wellness',
    colors: [
      { name: 'Electric Orange', hex: '#FF4500', role: 'primary', contrast: '6.7:1 (AAA on White)', notes: 'Signature brand color. Use on primary CTAs and hero accents.' },
      { name: 'Dark Slate', hex: '#1E1E1E', role: 'secondary', contrast: '14.2:1 (AAA)', notes: 'Primary background and dark card container surface.' },
      { name: 'Crisp White', hex: '#FFFFFF', role: 'accent', contrast: '21:1 (AAA)', notes: 'Main content paper canvas.' },
      { name: 'Neon Green', hex: '#39FF14', role: 'prohibited', contrast: 'Fails brand identity', notes: 'Strictly prohibited from all digital and print marketing assets.' }
    ],
    typography: [
      { role: 'Headings & Hero Titles', family: 'Inter', weight: '600 (SemiBold)', sample: 'Transform Your Everyday Fitness' },
      { role: 'Body Copy & Paragraphs', family: 'Inter', weight: '400 (Regular)', sample: 'Join thousands of members reaching their wellness goals with guided routines.' },
      { role: 'Accent Callouts & Badges', family: 'Montserrat', weight: '700 (Bold)', sample: 'LIMITED SUMMER PASS' }
    ],
    logoRules: {
      minClearSpace: '24px on all sides of the mark',
      allowedPlacement: 'Top left header or centered hero placement',
      prohibited: ['Do not rotate or distort logo mark', 'Do not alter the orange gradient', 'Do not place on neon backgrounds']
    },
    pricingFacts: [
      { label: 'Premium Monthly Membership', value: '₹999 / month', rule: 'Quoting ₹799 or "cheapest gym" is strictly prohibited' },
      { label: 'Annual Unlimited Pass', value: '₹9,999 / year', rule: 'Must include physician disclaimer' }
    ]
  },
  omnicloud: {
    name: 'OmniCloud',
    sector: 'B2B Cloud Software',
    colors: [
      { name: 'Cyan Tech', hex: '#00E5FF', role: 'primary', contrast: '5.2:1 (AA)', notes: 'Primary digital asset and terminal accent anchor.' },
      { name: 'Obsidian Black', hex: '#0B0F19', role: 'secondary', contrast: '18.1:1 (AAA)', notes: 'Enterprise console dark backdrop.' },
      { name: 'Cool Slate', hex: '#E2E8F0', role: 'accent', contrast: '12.4:1 (AAA)', notes: 'Technical specification borders and pill lines.' },
      { name: 'Crimson Red', hex: '#FF0033', role: 'prohibited', contrast: 'Fails brand identity', notes: 'Strictly prohibited in product UI and campaign banners.' }
    ],
    typography: [
      { role: 'Headings & Hero Titles', family: 'Space Grotesk', weight: '700 (Bold)', sample: 'Zero-Downtime Multi-Region Cloud' },
      { role: 'Body Copy & Documentation', family: 'Roboto Mono', weight: '400 (Regular)', sample: 'Deploy deterministic serverless clusters in 15 milliseconds.' },
      { role: 'Technical Metrics', family: 'JetBrains Mono', weight: '500 (Medium)', sample: '99.999% SLA UPTIME' }
    ],
    logoRules: {
      minClearSpace: '32px perimeter clearance required',
      allowedPlacement: 'Top left navigation bar with dark contrast mode',
      prohibited: ['Do not display without cloud glyph', 'Do not invert cyber cyan gradient']
    },
    pricingFacts: [
      { label: 'Enterprise Platform SLA', value: '₹24,99,000 / year', rule: 'Official certified tier pricing' },
      { label: 'Developer Cluster Tier', value: '₹4,999 / month', rule: 'Standard self-serve pricing' }
    ]
  },
  apex: {
    name: 'Apex FinTech',
    sector: 'Regulated Finance',
    colors: [
      { name: 'Apex Navy', hex: '#0A2540', role: 'primary', contrast: '11.8:1 (AAA)', notes: 'Core institutional tone and executive headers.' },
      { name: 'Clean Platinum', hex: '#F4F5F7', role: 'secondary', contrast: '15.6:1 (AAA)', notes: 'Clean banking statement canvas.' },
      { name: 'Emerald Trust', hex: '#00D09C', role: 'accent', contrast: '4.8:1 (AA)', notes: 'Yield returns and positive balance indicator.' },
      { name: 'Hot Pink', hex: '#FF007F', role: 'prohibited', contrast: 'Fails regulatory standards', notes: 'Prohibited across all financial disclosures and ads.' }
    ],
    typography: [
      { role: 'Headings & Statements', family: 'Inter Display', weight: '500 (Medium)', sample: 'Institutional Asset Custody & Settlement' },
      { role: 'Body Copy & Disclosures', family: 'Inter', weight: '400 (Regular)', sample: 'Regulated custody with continuous cryptographic verification.' },
      { role: 'Rates & APY Metrics', family: 'Inter SemiBold', weight: '600 (SemiBold)', sample: '6.8% ANNUAL YIELD' }
    ],
    logoRules: {
      minClearSpace: '28px boundary on marketing collateral',
      allowedPlacement: 'Prominent header placement with regulatory disclaimer footer',
      prohibited: ['Do not modify navy crest', 'Do not place over unvetted stock photography']
    },
    pricingFacts: [
      { label: 'High-Yield Savings Certified APY', value: '6.8% APY', rule: 'Must include RBI / SEBI regulated footnote' },
      { label: 'Institutional Desk Custody Fee', value: '0.15% bps', rule: 'Certified baseline schedule' }
    ]
  }
};

export function BrandManagerAssets() {
  const navigate = useNavigate();
  const { notify } = useFrame();
  const [selectedBrand, setSelectedBrand] = useState<string>('novafit');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const brand = BRAND_DATA[selectedBrand] || BRAND_DATA['novafit'];

  const copyHex = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedHex(hex);
      notify(`Copied ${hex} to clipboard`, 'success');
      setTimeout(() => setCopiedHex(null), 2000);
    } catch {
      notify('Clipboard unavailable', 'danger');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* ── Page Header (Avatars & Bell ALWAYS Top-Right) ── */}
      <PageHeader
        title={`Asset Library: ${brand.name}`}
        subtitle="Approved colors, typography, logo clear space, and pricing facts."
        onBack={() => navigate('/dashboard?role=brand_manager')}
        backAriaLabel="Back to dashboard"
      />

      {/* ── Brand Selection Filter Bar ── */}
      <div className="-mt-4 flex items-center justify-between">
        <div className="relative">
          <select
            value={selectedBrand}
            onChange={e => setSelectedBrand(e.target.value)}
            className="press flex h-11 cursor-pointer appearance-none items-center gap-2 rounded-full border border-silver bg-paper pr-10 pl-4 text-ui font-medium text-ink shadow-sm transition-colors hover:border-mid focus-visible:outline-ink"
          >
            <option value="novafit">Brand: NovaFit Health</option>
            <option value="omnicloud">Brand: OmniCloud</option>
            <option value="apex">Brand: Apex FinTech</option>
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-graphite" />
        </div>
      </div>

      {/* ── Section 1: Color Palette System ── */}
      <Card className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-item bg-ink text-paper">
              <Palette className="size-5" {...ICON} />
            </span>
            <div>
              <h2 className="font-display text-subheading font-semibold text-ink">Color Palette Standards</h2>
              <p className="text-caption text-graphite">Official digital and print hex tokens with WCAG contrast certification</p>
            </div>
          </div>
          <Pill variant="solid" caps={false}>
            {brand.colors.length} Swatches Configured
          </Pill>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {brand.colors.map(color => {
            const isBanned = color.role === 'prohibited';
            return (
              <div
                key={color.hex}
                className={`flex flex-col gap-3 rounded-panel border p-4 transition-all ${
                  isBanned ? 'border-danger/40 bg-danger/5' : 'border-silver bg-paper shadow-sm'
                }`}
              >
                <div
                  className="h-24 w-full rounded-item shadow-inner flex items-end justify-end p-2.5 border border-black/5"
                  style={{ backgroundColor: color.hex }}
                >
                  <button
                    type="button"
                    onClick={() => copyHex(color.hex)}
                    className="flex h-7 items-center gap-1.5 rounded-full bg-black/70 px-2.5 text-caption font-medium text-white backdrop-blur-sm transition-transform hover:scale-105"
                  >
                    {copiedHex === color.hex ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
                    <span>{color.hex}</span>
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-ui font-semibold text-ink">{color.name}</span>
                    <Pill variant={isBanned ? 'solid' : 'silver'} caps={false}>
                      {color.role.toUpperCase()}
                    </Pill>
                  </div>
                  <span className="text-caption text-graphite">{color.contrast}</span>
                  <p className="text-caption text-mid line-clamp-2 mt-1">{color.notes}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── Section 2: Typography Standards ── */}
      <Card className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-item bg-ink text-paper">
              <Type className="size-5" {...ICON} />
            </span>
            <div>
              <h2 className="font-display text-subheading font-semibold text-ink">Typography & Hierarchy Standards</h2>
              <p className="text-caption text-graphite">Approved typefaces, weights, and specimen hierarchies</p>
            </div>
          </div>
          <Pill variant="outline" caps={false}>
            3 Font Hierarchy Tiers
          </Pill>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {brand.typography.map(tier => (
            <div key={tier.role} className="flex flex-col justify-between gap-4 rounded-panel border border-silver bg-paper p-5 shadow-sm">
              <div className="flex flex-col gap-1">
                <span className="text-caption font-semibold text-graphite uppercase tracking-wider">{tier.role}</span>
                <span className="text-ui font-bold text-ink">{tier.family}</span>
                <span className="text-caption text-mid">Weight: {tier.weight}</span>
              </div>
              <div className="rounded-item border border-silver/60 bg-silver/15 p-4">
                <p className="text-body font-medium text-ink leading-snug">"{tier.sample}"</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Section 3: Logo & Pricing Governance ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Logo Clearance Rules */}
        <Card className="flex flex-col gap-4 p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-item bg-ink text-paper">
              <Layers className="size-5" {...ICON} />
            </span>
            <div>
              <h2 className="font-display text-subheading font-semibold text-ink">Logo Clear Space & Usage</h2>
              <p className="text-caption text-graphite">Boundary clearance and prohibited visual alterations</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <div className="flex flex-col gap-1 rounded-item bg-silver/20 p-3.5">
              <span className="text-caption font-semibold text-ink">Minimum Clear Space</span>
              <span className="text-ui font-medium text-ink">{brand.logoRules.minClearSpace}</span>
            </div>

            <div className="flex flex-col gap-1 rounded-item bg-silver/20 p-3.5">
              <span className="text-caption font-semibold text-ink">Permitted Header Placement</span>
              <span className="text-ui font-medium text-ink">{brand.logoRules.allowedPlacement}</span>
            </div>

            <div className="flex flex-col gap-2 rounded-item border border-danger/30 bg-danger/5 p-3.5">
              <span className="text-caption font-semibold text-danger">Strictly Prohibited Modifications:</span>
              <ul className="flex flex-col gap-1 text-caption text-danger/90">
                {brand.logoRules.prohibited.map((item, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <ShieldAlert className="size-3.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        {/* Verified Pricing & Subscription Facts */}
        <Card className="flex flex-col gap-4 p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-item bg-ink text-paper">
              <ShieldCheck className="size-5 text-success" {...ICON} />
            </span>
            <div>
              <h2 className="font-display text-subheading font-semibold text-ink">Verified Pricing & Facts</h2>
              <p className="text-caption text-graphite">Ground-truth facts checked by the deterministic engine</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            {brand.pricingFacts.map(fact => (
              <div key={fact.label} className="flex flex-col gap-1.5 rounded-item border border-silver bg-paper p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-caption font-semibold text-graphite">{fact.label}</span>
                  <Pill variant="solid" caps={false}>
                    Verified Fact
                  </Pill>
                </div>
                <span className="font-display text-2xl font-bold text-ink tabular-nums">{fact.value}</span>
                <span className="text-caption text-mid flex items-center gap-1.5">
                  <CircleAlert className="size-3.5 text-warning" />
                  {fact.rule}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
