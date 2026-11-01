import type { Transition, Variants } from 'motion/react';

/** Refined ease-out used across the mono surfaces. */
export const EASE = [0.22, 1, 0.36, 1] as const;

export const DURATION = { fast: 0.2, base: 0.4, slow: 0.6 } as const;

export const ease = (duration: number = DURATION.base, delay = 0): Transition => ({ duration, delay, ease: EASE });

/** Fade + rise for staggered cards and fields. `custom` is the stagger index. */
export const rise: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: (index: number = 0) => ({ opacity: 1, y: 0, transition: ease(DURATION.slow, 0.08 * index) })
};

export const riseReduced: Variants = {
  hidden: { opacity: 0 },
  show: (index: number = 0) => ({ opacity: 1, transition: ease(DURATION.fast, 0.04 * index) })
};
