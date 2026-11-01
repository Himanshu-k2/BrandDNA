import type { ReactNode } from 'react';
import { Check, Info, X } from 'lucide-react';
import { Logo, LOGO_SIZE, MARK, useAptosAvailable, type LogoSize, type LogoTheme } from '@/components/mono/Logo';
import { Card, ICON, PageHeader, Pill, SectionHeader, Stagger } from '@/components/mono/ui';
import { cn } from '@/lib/cn';

/**
 * Dev reference at /brand (not in the main navigation).
 * Cards are radius 24 / padding 24, so every tile inside sits on the 4px floor.
 */

function Tile({ surface, label, children }: { surface: string; label: ReactNode; children: ReactNode }) {
  return (
    <figure className="flex flex-col gap-2">
      <div className={cn('flex min-h-40 items-center justify-center rounded-min p-8', surface)}>{children}</div>
      <figcaption className="text-caption text-graphite">{label}</figcaption>
    </figure>
  );
}

const THEMES: { theme: LogoTheme; surface: string; note: string }[] = [
  { theme: 'light', surface: 'border border-silver bg-paper', note: 'Almost Black + Blaze Orange on Clean White or Pale Silver' },
  { theme: 'dark', surface: 'bg-ink', note: 'Clean White + Blaze Orange on Almost Black or Soft Graphite' },
  { theme: 'mono-black', surface: 'bg-silver', note: 'Single colour for print, watermarks, mid-tone surfaces' },
  { theme: 'mono-white', surface: 'bg-graphite', note: 'Single colour on dark imagery' }
];

const SIZES: LogoSize[] = ['sm', 'md', 'lg', 'xl'];

export function LogoGuidelines() {
  const aptos = useAptosAvailable();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Logo guidelines"
        subtitle="A symbol and a wordmark. The burst is the brand; the orange corner bracket frames it the way a reviewer frames content. Orange lives only in that bracket."
        actions={<Pill variant="outline" caps={false}>Dev reference · /brand</Pill>}
      />

      <Stagger index={0}>
        <Card as="section" className="flex items-start gap-3 p-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-silver/40 text-ink">
            <Info className="size-5" {...ICON} aria-hidden />
          </span>
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-subheading font-semibold text-ink">Wordmark font: Aptos</h2>
            <p className="text-body text-graphite">
              The wordmark is live text in Aptos SemiBold through the shared display token (Aptos → Segoe UI → system sans). Aptos can’t be web-embedded, so devices without it show the fallback; cap height stays
              fixed either way. The favicon is symbol-only; the share image uses an Inter outline of the wordmark until an Aptos outline is supplied.
            </p>
            <Pill variant={aptos ? 'silver' : 'solid'} caps={false} className="self-start">
              {aptos === null ? 'Checking this browser…' : aptos ? 'Aptos installed in this browser' : 'Aptos not installed here · showing fallback'}
            </Pill>
          </div>
        </Card>
      </Stagger>

      <Stagger index={1}>
        <Card as="section" className="flex flex-col gap-6 p-6">
          <SectionHeader title="Variants" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Tile surface="border border-silver bg-paper" label="Horizontal · sidebar, drawer, login, loading screen, exports">
              <Logo variant="horizontal" size="lg" />
            </Tile>
            <Tile surface="border border-silver bg-paper" label="Mark only · favicon, collapsed sidebar, avatar, error pages">
              <Logo variant="mark" size="xl" />
            </Tile>
          </div>
          <p className="max-w-3xl text-body text-graphite">
            Built on a {MARK.grid} × {MARK.grid} grid with a {MARK.stroke}-unit stroke and square ends. The wordmark’s cap height is half the mark and centred on the burst; the gap between them is two strokes.
          </p>
        </Card>
      </Stagger>

      <Stagger index={2}>
        <Card as="section" className="flex flex-col gap-6 p-6">
          <SectionHeader title="Themes" />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {THEMES.map(({ theme, surface, note }) => (
              <Tile
                key={theme}
                surface={surface}
                label={
                  <>
                    <span className="font-semibold text-ink">{theme}</span> · {note}
                  </>
                }
              >
                <Logo variant="horizontal" theme={theme} size="sm" />
              </Tile>
            ))}
          </div>
          <dl className="grid gap-4 border-t border-silver pt-6 sm:grid-cols-3">
            {[
              ['Almost Black', '#070D0D', 'Burst and wordmark on light surfaces · 19.6:1 on white'],
              ['Blaze Orange', '#FF6700', 'Logo corner bracket (and the restrained accent layer) · 2.9:1 on white, 6.7:1 on Almost Black'],
              ['Clean White', '#FFFFFF', 'Burst and wordmark on dark surfaces · 19.6:1 on Almost Black']
            ].map(([name, hex, use]) => (
              <div key={name} className="flex flex-col gap-1">
                <dt className="text-ui font-medium text-ink">
                  {name} <span className="text-caption font-normal text-graphite tabular-nums">{hex}</span>
                </dt>
                <dd className="text-caption text-graphite">{use}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </Stagger>

      <div className="grid gap-6 xl:grid-cols-2">
        <Stagger index={3}>
          <Card as="section" className="flex h-full flex-col gap-6 p-6">
            <SectionHeader title="Sizes" />
            <div className="flex flex-col gap-4">
              {SIZES.map(size => (
                <div key={size} className="flex items-center gap-6">
                  <span className="w-24 shrink-0 text-caption text-graphite tabular-nums">
                    {size} · {LOGO_SIZE[size]}px
                  </span>
                  <Logo variant="horizontal" size={size} />
                </div>
              ))}
            </div>
            <div className="flex items-end gap-6 border-t border-silver pt-6">
              <svg width="16" height="16" viewBox={`0 0 ${MARK.grid} ${MARK.grid}`} role="img" aria-label="BrandDNA mark at 16px">
                <path d={MARK.burst} fill="none" stroke="var(--color-ink)" strokeWidth={MARK.stroke} />
                <path d={MARK.bracket} fill="none" stroke="var(--brand-orange)" strokeWidth={MARK.stroke} />
              </svg>
              <p className="text-caption leading-copy text-graphite">Minimums: mark 16px, horizontal lockup 96px wide (size sm).</p>
            </div>
          </Card>
        </Stagger>

        <Stagger index={4}>
          <Card as="section" className="flex h-full flex-col gap-6 p-6">
            <SectionHeader title="Clear space" />
            <div className="flex flex-1 items-center justify-center rounded-min bg-silver/24 p-8">
              {/* At lg (48px mark) the cap height is 24px, so the keep-out border sits 24px (p-6) away. */}
              <div className="relative border border-dashed border-mid p-6">
                <Logo variant="horizontal" size="lg" />
                <span className="absolute top-0 left-1/2 flex h-6 -translate-x-1/2 items-center text-caption text-graphite">x</span>
                <span className="absolute top-1/2 left-0 flex w-6 -translate-y-1/2 justify-center text-caption text-graphite">x</span>
              </div>
            </div>
            <p className="text-body text-graphite">Clear space on every side equals x, the cap height of the wordmark (half the mark height).</p>
          </Card>
        </Stagger>
      </div>

      <Stagger index={5}>
        <Card as="section" className="flex flex-col gap-6 p-6">
          <SectionHeader title="Do and don’t" />
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <Rule ok label="Light theme on Clean White">
              <Logo variant="horizontal" size="sm" />
            </Rule>
            <Rule ok label="Dark theme on Almost Black" surface="bg-ink">
              <Logo variant="horizontal" theme="dark" size="sm" />
            </Rule>
            <Rule ok label="Mono version on mid-tone surfaces" surface="bg-silver">
              <Logo variant="horizontal" theme="mono-black" size="sm" />
            </Rule>
            <Rule ok label="Mark only at 16px or larger">
              <Logo variant="mark" size="md" />
            </Rule>
            <Rule label="Don’t stretch or squash">
              <span className="inline-block [transform:scaleX(1.5)]">
                <Logo variant="mark" size="sm" decorative />
              </span>
            </Rule>
            <Rule label="Don’t rotate">
              <span className="inline-block -rotate-12">
                <Logo variant="horizontal" size="sm" decorative />
              </span>
            </Rule>
            <Rule label="Don’t recolour the bracket">
              <span className="inline-block [&_path:nth-of-type(2)]:stroke-mid">
                <Logo variant="horizontal" size="sm" decorative />
              </span>
            </Rule>
            <Rule label="Don’t place the colour logo on Middle Gray" surface="bg-mid">
              <Logo variant="horizontal" size="sm" decorative />
            </Rule>
          </div>
        </Card>
      </Stagger>
    </div>
  );
}

function Rule({ ok, label, surface = 'border border-silver bg-paper', children }: { ok?: boolean; label: string; surface?: string; children: ReactNode }) {
  const Icon = ok ? Check : X;
  return (
    <figure className="flex flex-col gap-2">
      <div className={cn('flex h-32 items-center justify-center overflow-hidden rounded-min p-6', surface)}>{children}</div>
      <figcaption className="flex items-center gap-2 text-caption text-ink">
        <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-full', ok ? 'bg-ink text-paper' : 'border border-ink text-ink')}>
          <Icon className="size-4" {...ICON} aria-hidden />
        </span>
        <span>
          <span className="font-semibold">{ok ? 'Do' : 'Don’t'}</span> · {label.replace(/^Don’t /, '')}
        </span>
      </figcaption>
    </figure>
  );
}
