import { useEffect, useRef, type ReactNode } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from 'motion/react';
import { cn } from '@/lib/cn';

type Gaze = { x: MotionValue<number>; y: MotionValue<number> };

/** An eye whose pupil drifts toward the cursor, `travel` px at most. */
function Eye({ gaze, sclera = true, travel = 4 }: { gaze: Gaze; sclera?: boolean; travel?: number }) {
  const x = useTransform(gaze.x, value => value * travel);
  const y = useTransform(gaze.y, value => value * travel);
  if (!sclera) {
    return <motion.span style={{ x, y }} className="block size-3 rounded-full bg-ink" />;
  }
  return (
    <span className="flex size-6 items-center justify-center rounded-full bg-paper">
      <motion.span style={{ x, y }} className="block size-3 rounded-full bg-ink" />
    </span>
  );
}

function Mouth({ d, className }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 12" className={cn('h-3 w-6 overflow-visible', className)} aria-hidden>
      <path d={d} fill="none" strokeWidth="2" strokeLinecap="round" className="stroke-ink" />
    </svg>
  );
}

/** Gentle ambient bob; each character gets its own period so the group never moves in lockstep. */
function Float({ children, className, period, delay }: { children: ReactNode; className: string; period: number; delay: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={cn('absolute', className)}
      animate={reduce ? undefined : { y: [0, -8, 0] }}
      transition={{ duration: period, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
}

const FROWN = 'M4 10c3-5 13-5 16 0';
const WOBBLE = 'M2 6c3-4 6 4 10 0s7-4 10 0';

export function Characters() {
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const gaze: Gaze = {
    x: useSpring(rawX, { stiffness: 120, damping: 18 }),
    y: useSpring(rawY, { stiffness: 120, damping: 18 })
  };

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const box = ref.current?.getBoundingClientRect();
      if (!box) return;
      const clamp = (value: number) => Math.max(-1, Math.min(1, value));
      rawX.set(clamp((event.clientX - (box.left + box.width / 2)) / 400));
      rawY.set(clamp((event.clientY - (box.top + box.height / 2)) / 400));
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [rawX, rawY]);

  return (
    <div ref={ref} className="relative h-96 w-[448px]" aria-hidden>
      {/* Tall tilted rectangle */}
      <Float className="bottom-24 left-24 z-0" period={5.2} delay={0}>
        {/* The one Blaze Orange character; the small rectangle is Almost Black, the rest stay gray. */}
        <div className="relative h-72 w-40 -rotate-12 rounded-min bg-brand-orange">
          <div className="absolute top-12 right-8 flex flex-col items-center gap-2">
            <div className="flex gap-2">
              <Eye gaze={gaze} />
              <Eye gaze={gaze} />
            </div>
            <Mouth d={FROWN} />
          </div>
        </div>
      </Float>

      {/* Semicircle */}
      <Float className="bottom-0 left-0 z-20" period={6} delay={0.4}>
        <div className="relative h-32 w-64 rounded-t-full bg-mid">
          <div className="absolute top-16 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
            <div className="flex gap-12">
              <Eye gaze={gaze} sclera={false} travel={3} />
              <Eye gaze={gaze} sclera={false} travel={3} />
            </div>
            <Mouth d={FROWN} />
          </div>
        </div>
      </Float>

      {/* Small rectangle */}
      <Float className="bottom-0 left-56 z-10" period={4.6} delay={0.8}>
        <div className="relative h-44 w-20 rounded-min bg-ink">
          <div className="absolute top-6 left-1/2 flex -translate-x-1/2 gap-1">
            <Eye gaze={gaze} />
            <Eye gaze={gaze} />
          </div>
        </div>
      </Float>

      {/* Rounded pill */}
      <Float className="bottom-0 left-[296px] z-10" period={5.6} delay={1.2}>
        <div className="relative h-48 w-24 rounded-t-full border border-silver bg-paper">
          <div className="absolute top-16 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
            <div className="flex gap-6">
              <Eye gaze={gaze} sclera={false} travel={3} />
              <Eye gaze={gaze} sclera={false} travel={3} />
            </div>
            <Mouth d={WOBBLE} />
          </div>
        </div>
      </Float>
    </div>
  );
}
