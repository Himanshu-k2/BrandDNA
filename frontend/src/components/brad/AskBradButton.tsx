import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { DURATION, EASE } from '@/lib/motion';
import { focusRing, ICON } from '@/components/mono/ui';
import { BradFace, type ExpressionId } from './face/BradFace';

/**
 * "Ask Brad" entry point: Brand white liquid glass capsule with "Ask Brad" label
 * on the left and Brad's face on the right. Morphs into a circular close button
 * while the panel is open, and collapses to a face-only circle on mobile.
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
  const [splashing, setSplashing] = useState(false);
  const measure = useRef<HTMLSpanElement>(null);
  const [pillWidth, setPillWidth] = useState(136);

  useEffect(() => {
    const onSplash = () => {
      setSplashing(true);
      setTimeout(() => setSplashing(false), 900);
    };
    window.addEventListener('branddna:capsule_splash', onSplash);
    return () => window.removeEventListener('branddna:capsule_splash', onSplash);
  }, []);

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
      {!compact && (
        <span className="text-ui leading-tight-ui font-semibold tracking-tight whitespace-nowrap text-ink">
          Ask Brad
        </span>
      )}
      <BradFace size="sm" expression={hovered ? 'attentive' : expression} scan={scan} />
    </>
  );

  return (
    <span className="relative inline-flex">
      <motion.button
        ref={ref}
        type="button"
        data-tour-target="ask-brad-capsule"
        onClick={onClick}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        aria-label={open ? 'Close Brad' : badge ? 'Ask Brad, new message' : 'Ask Brad'}
        aria-expanded={open}
        aria-haspopup="dialog"
        initial={false}
        animate={
          splashing
            ? {
                width: round ? 48 : pillWidth,
                scaleX: [1, 1.25, 0.88, 1.06, 1],
                scaleY: [1, 0.74, 1.16, 0.94, 1],
              }
            : {
                width: round ? 48 : pillWidth,
                scaleX: 1,
                scaleY: 1,
              }
        }
        transition={{ duration: reduce ? 0 : splashing ? 0.65 : DURATION.base, ease: EASE }}
        className={cn(
          'relative flex h-12 cursor-pointer items-center justify-center overflow-hidden rounded-full',
          'bg-white/80 backdrop-blur-xl backdrop-saturate-150',
          'border border-white/90 ring-1 ring-black/5',
          'shadow-[0_8px_30px_rgb(0,0,0,0.10),0_2px_8px_rgb(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,1),inset_0_-1px_2px_rgba(0,0,0,0.03)]',
          'before:pointer-events-none before:absolute before:inset-x-3 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white before:to-transparent',
          'transition-[background-color,border-color,box-shadow,transform] duration-200 ease-(--ease-refined)',
          'hover:scale-[1.03] hover:bg-white/95 hover:border-white hover:shadow-[0_12px_36px_rgb(0,0,0,0.14),0_4px_12px_rgb(0,0,0,0.08),inset_0_1px_2px_rgba(255,255,255,1)]',
          'active:scale-[0.97]',
          forceHover && 'scale-[1.03] bg-white/95 border-white shadow-[0_12px_36px_rgb(0,0,0,0.14),0_4px_12px_rgb(0,0,0,0.08),inset_0_1px_2px_rgba(255,255,255,1)]',
          focusRing,
          className
        )}
      >
        {/* invisible copy used to measure the natural pill width */}
        <span ref={measure} aria-hidden className="pointer-events-none invisible absolute flex w-max items-center gap-2.5 px-4 py-3">
          <span className="text-ui leading-tight-ui font-semibold tracking-tight whitespace-nowrap">Ask Brad</span>
          <span className="size-6" />
        </span>
        <AnimatePresence initial={false} mode="popLayout">
          {open ? (
            <motion.span
              key="close"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: DURATION.fast } }}
              transition={{ duration: DURATION.fast, ease: EASE }}
              className="flex items-center justify-center text-ink"
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
              className={cn('flex items-center gap-2.5', !compact && 'px-4 py-3')}
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
            className="pointer-events-none absolute top-0 right-1 size-2.5 rounded-full bg-brand-orange ring-2 ring-paper shadow-sm"
          />
        )}
      </AnimatePresence>
    </span>
  );
});
