import { useEffect, useId, useRef, useSyncExternalStore } from 'react';
import { useReducedMotion } from 'motion/react';
import { cn } from '@/lib/cn';
import { BradEngine, FOLLOW_PITCH, NO_LOOK, PITCH_MAX, R, YAW_MAX, clamp, type ExpressionId, type Look, type RenderedEye } from './engine';
import { getIdle, pointer, subscribeIdle, subscribeTick, retainPointer } from './runtime';

export type { ExpressionId } from './engine';
export { EXPRESSIONS } from './engine';

export type BradSize = 'sm' | 'md' | 'lg' | 'xl';
export const BRAD_SIZE: Record<BradSize, number> = { sm: 24, md: 40, lg: 64, xl: 96 };

/** How much the pointer takes over the expression's own gaze (the rest keeps its character). */
const FOLLOW_MIX = 0.7;
/** Idle float: 2px, very slow. */
const FLOAT_PX = 2;
const FLOAT_PERIOD = 6;
/** Thinking: a slow left-right scan. */
const SCAN_PERIOD = 2.8;

const noIdle = () => () => undefined;

/**
 * Brad — a Almost Black circle with two Clean White capsule eyes (no mouth).
 * Decorative: always aria-hidden; meaning is carried by surrounding text.
 */
export function BradFace({
  expression = 'neutral',
  size = 'md',
  follow = true,
  autoSleep = true,
  scan = false,
  still = false,
  className
}: {
  expression?: ExpressionId;
  size?: BradSize;
  /** Eyes follow the cursor within a limited range. */
  follow?: boolean;
  /** Switch to Sleepy after 60 s of inactivity; any interaction wakes it up. */
  autoSleep?: boolean;
  /** Slow eye scan (Brad is thinking). */
  scan?: boolean;
  /** Render one frame, no animation loop (history avatars, static references). */
  still?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion() ?? false;
  const clipId = useId();
  const wrapRef = useRef<HTMLSpanElement>(null);
  const eyeRefs = useRef<(SVGPathElement | null)[]>([]);
  const engineRef = useRef<BradEngine | null>(null);
  if (!engineRef.current) engineRef.current = new BradEngine(expression);
  const phase = useRef(Math.random() * 120);
  const live = !still;

  const idle = useSyncExternalStore(autoSleep && live ? subscribeIdle : noIdle, autoSleep && live ? getIdle : () => false);
  const shown: ExpressionId = idle ? 'sleepy' : expression;

  const paint = (eyes: RenderedEye[]) => {
    for (let i = 0; i < 2; i++) {
      const node = eyeRefs.current[i];
      if (!node) continue;
      const eye = eyes[i];
      if (!eye) {
        node.setAttribute('opacity', '0');
        continue;
      }
      node.setAttribute('d', eye.d);
      node.setAttribute('transform', eye.transform);
      node.setAttribute('opacity', String(eye.opacity));
    }
  };

  // Expression changes morph (0.4 s ease-out); instant under reduced motion.
  useEffect(() => {
    const engine = engineRef.current!;
    const now = performance.now() / 1000;
    engine.setExpression(shown, now, reduce || still ? 0 : undefined);
    if (still) paint(engine.sample(now, phase.current, { blink: false, wander: false }));
  }, [shown, reduce, still]);

  useEffect(() => {
    if (still) return;
    const engine = engineRef.current!;
    const releasePointer = follow && !reduce ? retainPointer() : () => undefined;
    const sameLook = (a: Look, b: Look) =>
      Math.abs(a.yaw - b.yaw) < 0.05 && Math.abs(a.pitch - b.pitch) < 0.05 && Math.abs(a.mix - b.mix) < 0.01 && a.wander === b.wander;

    const unsubscribe = subscribeTick(now => {
      const wrap = wrapRef.current;
      let look: Look = reduce ? { ...NO_LOOK, wander: 0 } : NO_LOOK;
      if (!reduce && scan) {
        look = { yaw: Math.sin((now / SCAN_PERIOD) * Math.PI * 2) * YAW_MAX, pitch: 4, mix: 1, wander: 0 };
      } else if (!reduce && follow && pointer.current && wrap) {
        const box = wrap.getBoundingClientRect();
        if (box.width > 0) {
          const nx = clamp((pointer.current.x - (box.left + box.width / 2)) / Math.max(1, window.innerWidth / 2), -1, 1);
          const ny = clamp((pointer.current.y - (box.top + box.height / 2)) / Math.max(1, window.innerHeight / 2), -1, 1);
          // positive pitch looks up while screen y goes down
          look = { yaw: nx * YAW_MAX, pitch: FOLLOW_PITCH - ny * PITCH_MAX, mix: FOLLOW_MIX, wander: 0 };
        }
      }
      if (!sameLook(look, engine.lookTarget)) engine.setLook(look, now);
      paint(engine.sample(now, now + phase.current, { blink: true, wander: !reduce }));
      if (wrap) wrap.style.transform = reduce ? '' : `translateY(${(Math.sin(((now + phase.current) / FLOAT_PERIOD) * Math.PI * 2) * FLOAT_PX).toFixed(2)}px)`;
    });
    return () => {
      unsubscribe();
      releasePointer();
    };
  }, [follow, scan, reduce, still]);

  const px = BRAD_SIZE[size];
  return (
    <span ref={wrapRef} aria-hidden className={cn('inline-flex shrink-0 will-change-transform', className)} style={{ width: px, height: px }}>
      <svg viewBox={`${-R} ${-R} ${R * 2} ${R * 2}`} width={px} height={px} focusable="false" className="block overflow-visible">
        <defs>
          <clipPath id={clipId}>
            <circle r={R} />
          </clipPath>
        </defs>
        <circle r={R} className="fill-ink" />
        {/* Eyes are clipped by the ball, so they tuck behind the edge instead of overflowing. */}
        <g clipPath={`url(#${clipId})`} className="fill-paper">
          <path ref={node => void (eyeRefs.current[0] = node)} />
          <path ref={node => void (eyeRefs.current[1] = node)} />
        </g>
      </svg>
    </span>
  );
}
