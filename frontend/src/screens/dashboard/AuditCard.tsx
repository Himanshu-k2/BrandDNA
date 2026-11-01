import { useState } from 'react';
import { ChevronDown, Download, Ellipsis, RotateCcw } from 'lucide-react';
import CountUp from '@/components/react-bits/CountUp';
import { cn } from '@/lib/cn';
import { AUDIT_RANGES, type AuditRangeKey } from './data';
import { DeltaPill, MenuRow, Popover, SectionHeader } from '@/components/mono/ui';
import { HatchedBarChart } from '@/components/mono/accent';

function downloadCsv(key: AuditRangeKey) {
  const range = AUDIT_RANGES[key];
  const rows = [`${range.csvHeader},audits`, ...range.values.map((value, index) => `${range.labels[index]},${value}`)].join('\n');
  const url = URL.createObjectURL(new Blob([rows], { type: 'text/csv' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: `branddna-audits-${key.toLowerCase().replace(' ', '-')}.csv` });
  link.click();
  URL.revokeObjectURL(url);
}

export function AuditCard() {
  const [series, setSeries] = useState<AuditRangeKey>('Last Year');
  const range = AUDIT_RANGES[series];
  const [active, setActive] = useState(range.defaultIndex);
  const { values } = range;
  const total = values.reduce((sum, value) => sum + value, 0);
  const gained = range.gained.value;

  // The previous period is the hatched comparison series.
  const changeAt = (index: number) => (index === 0 ? 0 : Math.round(((values[index] - values[index - 1]) / values[index - 1]) * 1000) / 10);

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="Audit volume"
        action={
          <div className="flex items-center gap-2">
            <Popover
              trigger={({ open, toggle }) => (
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={open}
                  onClick={toggle}
                  className="press flex h-8 cursor-pointer items-center gap-1 rounded-full border border-silver bg-paper px-3 text-caption font-medium text-ink transition-colors hover:bg-silver/40 focus-visible:outline-2 focus-visible:outline-ink"
                >
                  {series}
                  <ChevronDown className={cn('size-4 transition-transform duration-200', open && 'rotate-180')} strokeWidth={1.5} />
                </button>
              )}
            >
              {close =>
                (Object.keys(AUDIT_RANGES) as AuditRangeKey[]).map(key => (
                  <MenuRow
                    key={key}
                    active={key === series}
                    onClick={() => {
                      setSeries(key);
                      setActive(AUDIT_RANGES[key].defaultIndex);
                      close();
                    }}
                  >
                    {key}
                  </MenuRow>
                ))
              }
            </Popover>
            <Popover
              trigger={({ open, toggle }) => (
                <button
                  type="button"
                  aria-label="Chart options"
                  aria-haspopup="menu"
                  aria-expanded={open}
                  onClick={toggle}
                  className="press flex size-8 cursor-pointer items-center justify-center rounded-full text-graphite transition-colors hover:bg-silver/40 hover:text-ink focus-visible:outline-2 focus-visible:outline-ink"
                >
                  <Ellipsis className="size-5" strokeWidth={1.5} />
                </button>
              )}
            >
              {close => (
                <>
                  <MenuRow
                    onClick={() => {
                      downloadCsv(series);
                      close();
                    }}
                  >
                    <Download className="size-4" strokeWidth={1.5} /> Download CSV
                  </MenuRow>
                  <MenuRow
                    onClick={() => {
                      setActive(range.defaultIndex);
                      close();
                    }}
                  >
                    <RotateCcw className="size-4" strokeWidth={1.5} /> Reset highlight
                  </MenuRow>
                </>
              )}
            </Popover>
          </div>
        }
      />

      <div className="flex flex-col gap-6 rounded-panel border border-silver bg-paper shadow-soft p-6">
        <div className="flex flex-col gap-1">
          <p className="text-ui text-graphite">Total audits</p>
          <p className="font-display text-display font-semibold tracking-tight text-ink tabular-nums">
            <CountUp key={series} to={total} from={0} separator="," duration={0.6} easing="expo" trigger="load" />
          </p>
          <p className="text-caption text-graphite">
            You gained <span className="font-semibold text-ink">+{gained.toLocaleString('en-US')} audits</span> {range.gained.suffix}
          </p>
        </div>

        <HatchedBarChart
          label={`Audit volume, ${range.primaryLabel} vs ${range.secondaryLabel}`}
          animateKey={series}
          data={range.labels.map((label, index) => ({ label, axis: range.axis[index], primary: values[index], secondary: range.compare[index] }))}
          max={range.max}
          ticks={range.ticks}
          primaryLabel={range.primaryLabel}
          secondaryLabel={range.secondaryLabel}
          highlight={active}
          persistentTooltip
          tooltipExtra={index => <DeltaPill value={changeAt(index)} percent shape="chip" />}
        />
      </div>
    </section>
  );
}
