import { forwardRef, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { DURATION, EASE } from '@/lib/motion';
import { focusRing, ICON } from '@/components/mono/ui';
import { BradFace, type ExpressionId } from './face/BradFace';

/**
 * "Ask Brad" entry point: Almost Black pill (48px, 12×16 padding, 8px gap) with Brad's
 * face and label. Morphs into a 48px circular close button while the panel is open,
 * and collapses to a face-only circle on mobile.
 */
export const AskBradButton = forwardRef<
  HTMLButtonElement,
  {
    open: boolean;
    compact?: boolean;
    expression?: ExpressionId;
    scan?: boolean;
    onClick?: () => void;
    onHoverChange?: (hover: boolean) => void;
    /** Design-system preview: render the hover state without a pointer. */
    forceHover?: boolean;
    /** Unread / new: an 8px Blaze Orange dot on the top-right corner. */
    badge?: boolean;
    className?: string;
  }
>(function AskBradButton({ open, compact = false, expression = 'neutral', scan, onClick, onHoverChange, forceHover, badge = false, className }, ref) {
  const reduce = useReducedMotion();
  const [hover, setHover] = useState(false);
  const measure = useRef<HTMLSpanElement>(null);
  const [pillWidth, setPillWidth] = useState(136);
  useLayoutEffect(() => {
    if (measure.current) setPillWidth(Math.ceil(measure.current.getBoundingClientRect().width));
  }, []);

  const hovered = forceHover || hover;
  const round = open || compact;
  const setHovered = (value: boolean) => {
    setHover(value);
    onHoverChange?.(value);
  };

  const pillContent = (
    <>
      <BradFace size="sm" expression={hovered ? 'attentive' : expression} scan={scan} />
      {!compact && <span className="text-ui leading-tight-ui font-medium whitespace-nowrap text-paper">Ask Brad</span>}
    </>
  );

  return (
    <span className="relative inline-flex">
    <motion.button
      ref={ref}
      type="button"
      onClick={onClick}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      aria-label={open ? 'Close Brad' : badge ? 'Ask Brad, new message' : 'Ask Brad'}
      aria-expanded={open}
      aria-haspopup="dialog"
      initial={false}
      animate={{ width: round ? 48 : pillWidth }}
      transition={{ duration: reduce ? 0 : DURATION.base, ease: EASE }}
      className={cn(
        'relative flex h-12 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-ink shadow-lift transition-[background-color,scale] duration-200 ease-(--ease-refined) hover:scale-[1.02] hover:bg-graphite active:scale-[0.97]',
        forceHover && 'scale-[1.02] bg-graphite',
        focusRing,
        className
      )}
    >
      {/* invisible copy used to measure the natural pill width */}
      <span ref={measure} aria-hidden className="pointer-events-none invisible absolute flex w-max items-center gap-2 px-4 py-3">
        <span className="size-6" />
        <span className="text-ui leading-tight-ui font-medium whitespace-nowrap">Ask Brad</span>
      </span>
      <AnimatePresence initial={false} mode="popLayout">
        {open ? (
          <motion.span
            key="close"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: DURATION.fast } }}
            transition={{ duration: DURATION.fast, ease: EASE }}
            className="flex items-center justify-center text-paper"
          >
            <X className="size-5" {...ICON} />
          </motion.span>
        ) : (
          <motion.span
            key="pill"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: DURATION.fast } }}
            transition={{ duration: DURATION.fast, ease: EASE }}
            className={cn('flex items-center gap-2', !compact && 'px-4 py-3')}
          >
            {pillContent}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
      <AnimatePresence>
        {badge && !open && (
          <motion.span
            aria-hidden
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: DURATION.fast } }}
            transition={{ duration: DURATION.fast, ease: EASE }}
            className="pointer-events-none absolute top-0 right-1 size-2 rounded-full bg-brand-orange ring-2 ring-paper"
          />
        )}
      </AnimatePresence>
    </span>
  );
});
