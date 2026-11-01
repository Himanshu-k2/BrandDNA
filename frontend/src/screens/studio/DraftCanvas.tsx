import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { BrandRule, Severity } from '@/lib/rules';

/** Severity marks in grayscale: weight + fill carry importance, the title attribute names it. */
const MARK: Record<Severity, string> = {
  critical: 'bg-ink text-paper',
  high: 'bg-graphite text-paper',
  medium: 'bg-silver text-ink',
  low: 'border border-silver text-ink'
};

function highlight(line: string, rules: BrandRule[]) {
  const ranges = rules
    .flatMap(rule => rule.ranges(line).map(([start, end]) => ({ start, end, rule })))
    .sort((a, b) => a.start - b.start)
    .filter((range, i, list) => i === 0 || range.start >= list[i - 1].end);
  const parts: ReactNode[] = [];
  let cursor = 0;
  ranges.forEach(({ start, end, rule }) => {
    if (start > cursor) parts.push(line.slice(cursor, start));
    parts.push(
      <mark key={`${rule.id}-${start}`} title={`${rule.title} · ${rule.severity}`} className={cn('rounded-min px-1 font-medium', MARK[rule.severity])}>
        {line.slice(start, end)}
        <span className="sr-only"> ({rule.severity} severity: {rule.title})</span>
      </mark>
    );
    cursor = end;
  });
  if (cursor < line.length) parts.push(line.slice(cursor));
  return parts;
}

/** Line-numbered draft inside a padded card: framed by dividers rather than a nested box. */
export function DraftCanvas({
  text,
  editing,
  onChange,
  openRules,
  placeholder
}: {
  text: string;
  editing: boolean;
  onChange: (value: string) => void;
  openRules: BrandRule[];
  placeholder: ReactNode;
}) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const lines = text.split('\n');

  useEffect(() => {
    if (editing) areaRef.current?.focus();
  }, [editing]);

  if (editing) {
    return (
      <textarea
        ref={areaRef}
        aria-label="Draft content"
        value={text}
        onChange={event => onChange(event.target.value)}
        placeholder="Paste or write your marketing copy…"
        className="block min-h-64 w-full resize-y rounded-min border-y-2 border-ink bg-paper px-4 py-4 text-body text-ink outline-none placeholder:text-mid"
      />
    );
  }

  if (!text.trim()) return <>{placeholder}</>;

  return (
    <ol className="min-h-64 border-y border-silver py-3 text-body text-ink">
      {lines.map((line, i) => (
        <li key={i} className="grid grid-cols-[48px_1fr] py-1 pr-4 transition-colors hover:bg-silver/24">
          <span className="pr-4 text-right text-caption leading-copy text-mid tabular-nums select-none">{i + 1}</span>
          <span className="min-w-0 break-words">{line ? highlight(line, openRules) : '\u00a0'}</span>
        </li>
      ))}
    </ol>
  );
}
