import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/cn';
import { DURATION, EASE } from '@/lib/motion';

/**
 * Word-by-word reveal: each word fades and slides up from a clipped line box.
 * Typography is inherited unchanged, so the type scale stays intact.
 */
export function RevealText({
  text,
  as: Tag = 'h1',
  className,
  delay = 0,
  stagger = 0.08
}: {
  text: string;
  as?: 'h1' | 'h2' | 'p' | 'span';
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  const reduce = useReducedMotion();
  const words = text.split(' ');
  const MotionTag = motion[Tag];
  return (
    <MotionTag className={cn(className)} aria-label={text} initial="hidden" animate="show">
      {words.map((word, index) => (
        <span key={`${word}-${index}`} aria-hidden className="inline-block overflow-hidden pb-1 align-bottom">
          <motion.span
            className="inline-block"
            variants={{
              hidden: reduce ? { opacity: 0 } : { opacity: 0, y: '100%' },
              show: {
                opacity: 1,
                y: '0%',
                transition: { duration: reduce ? DURATION.fast : DURATION.slow, delay: delay + index * stagger, ease: EASE }
              }
            }}
          >
            {word}
          </motion.span>
          {index < words.length - 1 && '\u00a0'}
        </span>
      ))}
    </MotionTag>
  );
}
