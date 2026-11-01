import { Check, Inbox, X } from 'lucide-react';
import { ChartLegend, HatchedBarChart, HeroStatCard, ProgressBar } from '@/components/mono/accent';
import { Card, ICON, SectionHeader, Stagger } from '@/components/mono/ui';
import { cn } from '@/lib/cn';

const TOKENS = [
  { token: '--color-brand-orange', hex: '#FF6700', use: 'Hero card, highlighted bar, progress fill, nav indicator, one CTA', swatch: 'bg-brand-orange' },
  { token: '--color-brand-orange-hover', hex: '#E65C00', use: 'Hover on the orange highlight CTA', swatch: 'bg-brand-orange-hover' },
  { token: '--color-brand-orange-tint', hex: '#FFF1E8', use: 'Very light backgrounds only', swatch: 'bg-brand-orange-tint border border-silver' },
  { token: '--color-brand-orange-border', hex: '#FFD2B3', use: 'Borders on tinted surfaces', swatch: 'bg-brand-orange-border' },
  { token: '--color-ink', hex: '#070D0D', use: 'Almost Black: text, primary buttons, dark cards, primary chart series', swatch: 'bg-ink' },
  { token: '--hatch-orange', hex: '45° · 2px / 4px', use: 'Secondary chart series (SVG pattern, never animated)', swatch: 'hatch-orange border border-brand-orange' }
];

const CONTRAST = [
  { pair: 'Almost Black on Blaze Orange', ratio: '6.71:1', pass: true, fg: 'text-ink', bg: 'bg-brand-orange' },
  { pair: 'Blaze Orange on Almost Black', ratio: '6.71:1', pass: true, fg: 'text-brand-orange', bg: 'bg-ink' },
  { pair: 'White on Almost Black', ratio: '19.58:1', pass: true, fg: 'text-paper', bg: 'bg-ink' },
  { pair: 'Almost Black on orange hover', ratio: '5.50:1', pass: true, fg: 'text-ink', bg: 'bg-brand-orange-hover' },
  { pair: 'White on Blaze Orange', ratio: '2.92:1', pass: false, fg: 'text-paper', bg: 'bg-brand-orange' },
  { pair: 'Blaze Orange on White', ratio: '2.92:1', pass: false, fg: 'text-brand-orange', bg: 'bg-paper border border-silver' },
  { pair: 'Blaze Orange on Pale Silver', ratio: '2.01:1', pass: false, fg: 'text-brand-orange', bg: 'bg-silver' }
];

const DO = [
  'One solid orange hero stat card per screen, with Almost Black text.',
  'Almost Black primary series + hatched orange secondary; solid orange for the one highlighted bar.',
  'Orange progress fill on a Pale Silver track.',
  'Orange text or icons only on Almost Black surfaces.',
  'One orange highlight CTA per page at most (Almost Black text).'
];
const DONT = [
  'Orange body text, links, headings or thin icons on light surfaces.',
  'Orange for any status, badge, delta pill, toast, banner or validation.',
  'White text on orange, or small gray text on orange.',
  'Orange page, sidebar or header backgrounds; gradients, glows, shadows or blur.',
  'Orange next to the ochre warning tone inside one component.'
];

const SAMPLE = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((label, index) => ({ label, primary: [12, 16, 14, 19, 17, 21][index], secondary: [6, 9, 7, 10, 8, 11][index] }));

/** /design-system: the Blaze Orange + Almost Black accent layer. */
export function AccentSection({ index }: { index: number }) {
  return (
    <Stagger index={index}>
      <Card as="section" className="flex flex-col gap-8 p-6">
        <div className="flex flex-col gap-2">
          <SectionHeader title="Accent colors" />
          <p className="text-body text-graphite">
            Blaze Orange and Almost Black form a restrained accent layer on top of the grayscale system. Orange covers well under 10% of any screen and is never a status colour. This
            reference page intentionally shows more orange than a product screen would.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {TOKENS.map(item => (
            <div key={item.token} className="flex gap-3 rounded-item border border-silver p-4">
              <span className={cn('size-12 shrink-0 rounded-chip', item.swatch)} aria-hidden />
              <div className="flex min-w-0 flex-col gap-1">
                <code className="text-caption font-medium text-ink">{item.token}</code>
                <span className="text-caption text-graphite tabular-nums">{item.hex}</span>
                <span className="text-caption text-graphite">{item.use}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <HeroStatCard label="Needs sign-off" value={2} icon={Inbox} caption="3 more waiting on author changes" />
          <HeroStatCard tone="dark" label="Approved & sealed" value={74} caption="+9 · From 65 (last 7 days)" />
          <div className="flex flex-col gap-4 rounded-panel border border-silver p-6">
            <p className="text-ui font-medium text-ink">Progress</p>
            <ProgressBar value={128} max={500} label="Monthly audits" showValue />
            <ProgressBar value={64} label="Uploading brochure.pdf" />
            <p className="text-caption text-graphite">Completion still shows the semantic success icon.</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            <h3 className="text-ui font-semibold text-ink">Chart theme</h3>
            <div className="rounded-panel border border-silver p-6">
              <HatchedBarChart label="Sample series" data={SAMPLE} max={24} ticks={[24, 12, 0]} primaryLabel="Approved" secondaryLabel="Changes requested" highlight={5} height="h-40" />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h3 className="text-ui font-semibold text-ink">Hatch pattern</h3>
            <div className="flex flex-col gap-3 rounded-panel border border-silver p-6">
              <div className="hatch-orange h-24 rounded-chip border border-brand-orange" aria-hidden />
              <div className="h-24 overflow-hidden rounded-chip border border-brand-orange-border bg-brand-orange-tint">
                <div className="hatch-orange size-full" aria-hidden />
              </div>
              <p className="text-caption text-graphite">SVG &lt;pattern&gt;, 45°, 2px orange lines with a 4px gap, on transparent or orange tint. Static.</p>
              <ChartLegend primaryLabel="Primary · Almost Black" secondaryLabel="Secondary · hatched orange" />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            { title: 'Do', items: DO, Icon: Check },
            { title: 'Don’t', items: DONT, Icon: X }
          ].map(list => (
            <div key={list.title} className="flex flex-col gap-3 rounded-panel border border-silver p-6">
              <h3 className="text-ui font-semibold text-ink">{list.title}</h3>
              <ul className="flex flex-col gap-2">
                {list.items.map(item => (
                  <li key={item} className="flex gap-2 text-body text-graphite">
                    <list.Icon className="mt-1 size-4 shrink-0 text-ink" {...ICON} aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-ui font-semibold text-ink">Contrast</h3>
          <div className="overflow-x-auto rounded-panel border border-silver">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="h-10 px-4 text-caption font-medium text-mid">Pair</th>
                  <th className="h-10 px-4 text-caption font-medium text-mid">Sample</th>
                  <th className="h-10 px-4 text-caption font-medium text-mid">Ratio</th>
                  <th className="h-10 px-4 text-caption font-medium text-mid">WCAG AA (text)</th>
                </tr>
              </thead>
              <tbody>
                {CONTRAST.map(row => (
                  <tr key={row.pair} className="border-t border-silver">
                    <td className="px-4 py-3 text-ui text-graphite">{row.pair}</td>
                    <td className="px-4 py-3">
                      {/* Failing samples are shown on purpose, as the "don't" reference. */}
                      <span className={cn('inline-flex h-8 items-center rounded-chip px-3 text-ui font-medium', row.fg, row.bg)}>Aa 16px</span>
                    </td>
                    <td className="px-4 py-3 text-ui font-medium text-ink tabular-nums">{row.ratio}</td>
                    <td className="px-4 py-3 text-ui text-ink">
                      <span className="inline-flex items-center gap-2">
                        {row.pass ? <Check className="size-4" {...ICON} aria-hidden /> : <X className="size-4" {...ICON} aria-hidden />}
                        {row.pass ? 'Pass' : 'Fail · fills and shapes only'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </Stagger>
  );
}
