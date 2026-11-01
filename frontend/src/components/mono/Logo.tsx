import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

/*
 * BrandDNA logo: symbol + wordmark, no tagline.
 *
 * Mark (28 × 28 grid, stroke 4, butt ends): an eight-arm burst in Almost Black —
 * the brand — framed at its north-east arm by a Blaze Orange corner bracket, the
 * reviewer's viewfinder. Orange appears only in the bracket.
 * Wordmark: "BrandDNA" in Aptos SemiBold via the shared --font-display token
 * ('Aptos', 'Segoe UI', system-ui). Aptos can't be web-embedded, so the text stays
 * live: it renders in Aptos wherever it's installed and in the token's fallbacks
 * elsewhere. `font-size-adjust: cap-height` pins the cap height whichever face renders.
 */

export type LogoVariant = 'horizontal' | 'mark';
export type LogoTheme = 'light' | 'dark' | 'mono-black' | 'mono-white';
export type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

/** Mark height in px. */
export const LOGO_SIZE: Record<LogoSize, number> = { sm: 24, md: 32, lg: 48, xl: 64 };

export const MARK = {
  grid: 28,
  stroke: 4,
  burst: 'M10 8V28M0 18H20M2.93 10.93L17.07 25.07M2.93 25.07L17.07 10.93',
  bracket: 'M15 2H26V13',
  /** Burst centre — the wordmark's cap height is centred on this line. */
  centerY: 18
} as const;

const CAP = 14; // wordmark cap height in grid units (½ the mark)
const GAP = 8; // mark → wordmark, 2 × stroke
const CAP_RATIO = 0.7;

const THEME: Record<LogoTheme, { ink: string; accent: string }> = {
  light: { ink: 'var(--color-ink)', accent: 'var(--brand-orange)' },
  dark: { ink: 'var(--color-paper)', accent: 'var(--brand-orange)' },
  'mono-black': { ink: 'var(--color-ink)', accent: 'var(--color-ink)' },
  'mono-white': { ink: 'var(--color-paper)', accent: 'var(--color-paper)' }
};

function useFontsVersion() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const fonts = typeof document !== 'undefined' ? document.fonts : undefined;
    if (!fonts) return;
    const bump = () => setVersion(value => value + 1);
    void fonts.ready.then(bump);
    fonts.addEventListener('loadingdone', bump);
    return () => fonts.removeEventListener('loadingdone', bump);
  }, []);
  return version;
}

export function Logo({
  variant = 'horizontal',
  theme = 'light',
  size = 'md',
  reveal = false,
  decorative = false,
  className
}: {
  variant?: LogoVariant;
  theme?: LogoTheme;
  size?: LogoSize;
  /** Splash only: the mark fades in, the wordmark follows 120ms later. */
  reveal?: boolean;
  decorative?: boolean;
  className?: string;
}) {
  const { ink, accent } = THEME[theme];
  const scale = LOGO_SIZE[size] / MARK.grid;
  const svgRef = useRef<SVGSVGElement>(null);
  const textRef = useRef<SVGTextElement>(null);
  const fontsVersion = useFontsVersion();
  const [textWidth, setTextWidth] = useState(CAP * 6.4);
  const [shown, setShown] = useState(!reveal);

  // Live text: measure after fonts settle; hidden logos (0 width) re-measure via ResizeObserver.
  useLayoutEffect(() => {
    if (variant === 'mark') return;
    const measure = () => {
      const box = textRef.current?.getBBox();
      if (box && box.width > 0) setTextWidth(box.x + box.width);
    };
    measure();
    const svg = svgRef.current;
    if (!svg || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(svg);
    return () => observer.disconnect();
  }, [variant, size, fontsVersion]);

  useEffect(() => {
    if (!reveal) return;
    const frame = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(frame);
  }, [reveal]);

  const fade = (delay: number) =>
    reveal ? { opacity: shown ? 1 : 0, transition: `opacity var(--duration-base) var(--ease-refined) ${delay}ms` } : undefined;

  const width = variant === 'mark' ? MARK.grid : Math.ceil(MARK.grid + GAP + textWidth);
  const height = MARK.grid;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      width={+(width * scale).toFixed(2)}
      height={+(height * scale).toFixed(2)}
      overflow="visible"
      className={cn('block shrink-0 select-none', className)}
      {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': 'BrandDNA' })}
      focusable="false"
    >
      <g style={fade(0)}>
        <path d={MARK.burst} fill="none" stroke={ink} strokeWidth={MARK.stroke} />
        <path d={MARK.bracket} fill="none" stroke={accent} strokeWidth={MARK.stroke} strokeLinejoin="miter" />
      </g>
      {variant === 'horizontal' && (
        <text
          ref={textRef}
          x={MARK.grid + GAP}
          y={MARK.centerY + CAP / 2}
          fill={ink}
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: CAP / CAP_RATIO,
            fontSizeAdjust: `cap-height ${CAP_RATIO}`,
            letterSpacing: '-0.01em',
            ...fade(120)
          }}
        >
          BrandDNA
        </text>
      )}
    </svg>
  );
}

/** Dev helper for /brand: is Aptos actually installed in this browser? */
export function useAptosAvailable() {
  const [available, setAvailable] = useState<boolean | null>(null);
  useEffect(() => {
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return;
    const width = (family: string) => {
      ctx.font = `600 32px ${family}`;
      return ctx.measureText('BrandDNA wmli').width;
    };
    setAvailable(width('Aptos, monospace') !== width('monospace'));
  }, []);
  return available;
}
