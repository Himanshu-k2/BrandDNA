import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { focusRing } from '@/components/mono/ui';

/**
 * Light markdown for Brad replies: paragraphs, "- " and "1. " lists, **bold**,
 * _italic_, `code` and [label](/route) links. With `reveal`, every word fades and
 * rises in at `wordMs` intervals (CSS animation, same type size and line height).
 */

type Inline = { kind: 'text' | 'bold' | 'italic' | 'code'; value: string } | { kind: 'link'; value: string; href: string };

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|(?<![\w])_[^_]+_(?![\w]))/g;

function parseInline(source: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const match of source.matchAll(INLINE)) {
    const token = match[0];
    const index = match.index ?? 0;
    if (index > last) out.push({ kind: 'text', value: source.slice(last, index) });
    if (token.startsWith('**')) out.push({ kind: 'bold', value: token.slice(2, -2) });
    else if (token.startsWith('`')) out.push({ kind: 'code', value: token.slice(1, -1) });
    else if (token.startsWith('[')) {
      const [, label, href] = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token) ?? [];
      out.push({ kind: 'link', value: label, href });
    } else out.push({ kind: 'italic', value: token.slice(1, -1) });
    last = index + token.length;
  }
  if (last < source.length) out.push({ kind: 'text', value: source.slice(last) });
  return out;
}

type Block = { kind: 'p'; lines: string[] } | { kind: 'ul' | 'ol'; items: string[] };

function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of source.split(/\n{2,}/)) {
    const lines = chunk.split('\n').filter(Boolean);
    let current: Block | null = null;
    for (const line of lines) {
      const ul = /^\s*[-•]\s+(.*)$/.exec(line);
      const ol = /^\s*\d+[.)]\s+(.*)$/.exec(line);
      const kind = ul ? 'ul' : ol ? 'ol' : 'p';
      const content = (ul ?? ol)?.[1] ?? line;
      if (!current || current.kind !== kind) {
        current = kind === 'p' ? { kind, lines: [] } : { kind, items: [] };
        blocks.push(current);
      }
      if (current.kind === 'p') current.lines.push(content);
      else current.items.push(content);
    }
  }
  return blocks;
}

export const countWords = (source: string) => source.split(/\s+/).filter(Boolean).length;

export function Markdown({ text, reveal = false, wordMs = 35, tone = 'light' }: { text: string; reveal?: boolean; wordMs?: number; tone?: 'light' | 'dark' }) {
  let word = 0;
  const animated = (node: ReactNode, key: string | number) => {
    if (!reveal) return <Fragment key={key}>{node}</Fragment>;
    const style: CSSProperties = { animationDelay: `${word++ * wordMs}ms` };
    return (
      <span key={key} className="brad-word" style={style}>
        {node}
      </span>
    );
  };

  const words = (value: string, wrap: (piece: string) => ReactNode, key: string) =>
    value.split(/(\s+)/).map((piece, index) => (/^\s+$/.test(piece) || !piece ? piece : animated(wrap(piece), `${key}-${index}`)));

  const inline = (source: string, key: string) =>
    parseInline(source).flatMap((token, index) => {
      const k = `${key}-${index}`;
      switch (token.kind) {
        case 'bold':
          return words(token.value, piece => <strong className="font-semibold">{piece}</strong>, k);
        case 'italic':
          return words(token.value, piece => <em>{piece}</em>, k);
        case 'code':
          return [
            animated(
              <code className={cn('rounded-min px-1 text-[0.875em]', tone === 'dark' ? 'bg-graphite' : 'bg-paper')}>{token.value}</code>,
              k
            )
          ];
        case 'link': {
          const className = cn('rounded-min font-medium underline underline-offset-4', focusRing);
          const link = token.href.startsWith('/') ? (
            <Link to={token.href} className={className}>
              {token.value}
            </Link>
          ) : (
            <a href={token.href} target="_blank" rel="noreferrer" className={className}>
              {token.value}
            </a>
          );
          return [animated(link, k)];
        }
        default:
          return words(token.value, piece => piece, k);
      }
    });

  return (
    <div className="flex flex-col gap-2">
      {parseBlocks(text).map((block, index) => {
        if (block.kind === 'p')
          return (
            <p key={index}>
              {block.lines.map((line, i) => (
                <span key={i}>
                  {i > 0 && <br />}
                  {inline(line, `${index}-${i}`)}
                </span>
              ))}
            </p>
          );
        const List = block.kind;
        return (
          <List key={index} className={cn('flex flex-col gap-1 pl-6', List === 'ul' ? 'list-disc' : 'list-decimal')}>
            {block.items.map((item, i) => (
              <li key={i}>{inline(item, `${index}-${i}`)}</li>
            ))}
          </List>
        );
      })}
    </div>
  );
}
