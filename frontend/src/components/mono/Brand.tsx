import { cn } from '@/lib/cn';

/** Simple grayscale Google "G" — the one non-Lucide glyph allowed. */
export function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('size-5', className)} aria-hidden>
      <path
        d="M21.6 12.23c0-.68-.06-1.36-.18-2.02H12v3.83h5.4a4.62 4.62 0 0 1-2 3.03v2.5h3.24c1.9-1.75 2.96-4.33 2.96-7.34Z"
        className="fill-ink"
      />
      <path d="M12 22c2.7 0 4.97-.9 6.63-2.43l-3.24-2.5c-.9.6-2.05.95-3.39.95-2.6 0-4.81-1.76-5.6-4.12H3.06v2.58A10 10 0 0 0 12 22Z" className="fill-graphite" />
      <path d="M6.4 13.9a6 6 0 0 1 0-3.8V7.52H3.06a10 10 0 0 0 0 8.96L6.4 13.9Z" className="fill-mid" />
      <path d="M12 5.98c1.47-.02 2.88.53 3.95 1.54l2.87-2.87A9.66 9.66 0 0 0 12 2a10 10 0 0 0-8.94 5.52L6.4 10.1C7.18 7.74 9.4 5.98 12 5.98Z" className="fill-graphite" />
    </svg>
  );
}

/** Initials avatar in palette tones. */
export function MonoAvatar({ initials, className, tone = 'graphite' }: { initials: string; className?: string; tone?: 'graphite' | 'silver' | 'ink' }) {
  return (
    <span
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-full text-caption font-semibold',
        tone === 'graphite' && 'bg-graphite text-paper',
        tone === 'ink' && 'bg-ink text-paper',
        tone === 'silver' && 'bg-silver text-ink',
        className
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}
