import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from 'motion/react';
import { cn } from '@/lib/cn';

type Gaze = { x: MotionValue<number>; y: MotionValue<number> };
type Reaction = 'smile' | 'laugh' | 'surprised' | 'scared' | 'shy';

interface CharactersProps {
  isPasswordFocused?: boolean;
  isEmailFocused?: boolean;
  isError?: boolean;
  isSuccess?: boolean;
}

/** Eye with pupil that follows cursor or looks away when typing password. */
function Eye({
  gaze,
  sclera = true,
  travel = 5,
  isScared = false,
  isPasswordFocused = false,
  isLaughing = false
}: {
  gaze: Gaze;
  sclera?: boolean;
  travel?: number;
  isScared?: boolean;
  isPasswordFocused?: boolean;
  isLaughing?: boolean;
}) {
  const pupilX = useTransform(gaze.x, value => (isPasswordFocused ? -travel * 1.5 : value * travel));
  const pupilY = useTransform(gaze.y, value => (isPasswordFocused ? 0 : value * travel));

  // Happy squinting eye when laughing
  if (isLaughing) {
    return (
      <svg viewBox="0 0 24 16" className="size-5 overflow-visible" aria-hidden>
        <path d="M4 12c3-8 13-8 16 0" fill="none" strokeWidth="3" strokeLinecap="round" className="stroke-ink" />
      </svg>
    );
  }

  if (!sclera) {
    return (
      <motion.span
        animate={isScared ? { scale: [1, 1.4, 1.1], x: [-1, 1, -1] } : isPasswordFocused ? { x: -travel * 1.4 } : { scale: 1 }}
        transition={isScared ? { repeat: Infinity, duration: 0.15 } : { duration: 0.2 }}
        className="block"
      >
        <motion.span style={{ x: pupilX, y: pupilY }} className="block size-3 rounded-full bg-ink" />
      </motion.span>
    );
  }

  return (
    <motion.span
      animate={isScared ? { scale: [1, 1.25, 1.1] } : { scale: 1 }}
      transition={isScared ? { repeat: Infinity, duration: 0.2 } : { duration: 0.2 }}
      className="flex size-7 items-center justify-center rounded-full bg-paper shadow-xs"
    >
      <motion.span
        style={{ x: pupilX, y: pupilY }}
        animate={isScared ? { scale: [1, 0.75, 0.9] } : { scale: 1 }}
        transition={isScared ? { repeat: Infinity, duration: 0.15 } : { duration: 0.2 }}
        className="block size-3 rounded-full bg-ink"
      />
    </motion.span>
  );
}

/** Animated expressive mouth supporting smile, laugh, surprised, scared, and shy reactions. */
function Mouth({
  reaction,
  className
}: {
  reaction: Reaction;
  className?: string;
}) {
  // SVG paths for each expressive reaction
  let d = 'M4 5c3 4 13 4 16 0'; // smile
  let fill = 'none';

  if (reaction === 'laugh') {
    d = 'M4 4c3 8 13 8 16 0Z'; // open laughing smile
    fill = 'currentColor';
  } else if (reaction === 'surprised') {
    d = 'M8 6a4 5 0 1 0 8 0a4 5 0 1 0 -8 0'; // round 'O' mouth
    fill = 'currentColor';
  } else if (reaction === 'scared') {
    d = 'M4 8c2-4 5 4 8 0s5 4 8 0'; // trembling wobbly scared mouth
    fill = 'none';
  } else if (reaction === 'shy') {
    d = 'M6 7c3 1 9 1 12 0'; // discreet innocent mouth (not peeking!)
    fill = 'none';
  }

  return (
    <svg viewBox="0 0 24 14" className={cn('h-3.5 w-6 overflow-visible text-ink', className)} aria-hidden>
      <path d={d} fill={fill} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="stroke-ink" />
    </svg>
  );
}

/** Float bob with spring physics and throwable mouse interaction. */
function DraggableCharacter({
  children,
  className,
  isDragged,
  onDragStart,
  onDragEnd,
  onClick,
  period = 5,
  delay = 0
}: {
  children: ReactNode;
  className: string;
  isDragged: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClick: () => void;
  period?: number;
  delay?: number;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      drag
      dragSnapToOrigin
      dragElastic={0.65}
      dragTransition={{ bounceStiffness: 450, bounceDamping: 22 }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileDrag={{ scale: 1.15, cursor: 'grabbing', zIndex: 50 }}
      animate={
        isDragged
          ? {
              rotate: [-6, 6, -6],
              y: [-2, 2, -2],
              transition: { repeat: Infinity, duration: 0.12 }
            }
          : reduce
            ? undefined
            : {
                y: [0, -8, 0],
                transition: { duration: period, delay, repeat: Infinity, ease: 'easeInOut' }
              }
      }
      className={cn('absolute cursor-grab select-none touch-none', className)}
    >
      {children}
    </motion.div>
  );
}

export function Characters({
  isPasswordFocused = false,
  isEmailFocused = false,
  isError = false,
  isSuccess = false
}: CharactersProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const gaze: Gaze = {
    x: useSpring(rawX, { stiffness: 140, damping: 18 }),
    y: useSpring(rawY, { stiffness: 140, damping: 18 })
  };

  // Dragging state tracking per character
  const [draggedChar, setDraggedChar] = useState<string | null>(null);

  // Reaction state per character (defaults to happy smile)
  const [reactions, setReactions] = useState<{
    orange: Reaction;
    grey: Reaction;
    black: Reaction;
    white: Reaction;
  }>({
    orange: 'smile',
    grey: 'smile',
    black: 'smile',
    white: 'smile'
  });

  // Cycle reaction when user clicks a character
  const cycleReaction = (char: 'orange' | 'grey' | 'black' | 'white') => {
    setReactions(prev => {
      const next: Record<Reaction, Reaction> = {
        smile: 'laugh',
        laugh: 'surprised',
        surprised: 'smile',
        scared: 'smile',
        shy: 'smile'
      };
      return { ...prev, [char]: next[prev[char]] || 'smile' };
    });
  };

  // Cursor following with eyes across viewport
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (isPasswordFocused) {
        // Look away to the left (avoid seeing password!)
        rawX.set(-1);
        rawY.set(0);
        return;
      }
      const box = ref.current?.getBoundingClientRect();
      if (!box) return;
      const clamp = (value: number) => Math.max(-1, Math.min(1, value));
      rawX.set(clamp((event.clientX - (box.left + box.width / 2)) / 380));
      rawY.set(clamp((event.clientY - (box.top + box.height / 2)) / 380));
    };

    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [rawX, rawY, isPasswordFocused]);

  // Compute active reaction based on state
  const getReaction = (char: 'orange' | 'grey' | 'black' | 'white'): Reaction => {
    if (draggedChar === char) return 'scared';
    if (draggedChar) return 'surprised'; // other characters look surprised when one is grabbed!
    if (isPasswordFocused) return 'shy'; // looking away innocently
    if (isSuccess) return 'laugh'; // celebrating
    if (isError) return 'surprised'; // shocked
    if (isEmailFocused) return 'smile';
    return reactions[char];
  };

  return (
    <div ref={ref} className="relative h-96 w-[448px]" aria-hidden>
      {/* ── 1. Tall Tilted Orange Rectangle ── */}
      <DraggableCharacter
        className="bottom-24 left-24 z-0"
        period={5.2}
        delay={0}
        isDragged={draggedChar === 'orange'}
        onDragStart={() => setDraggedChar('orange')}
        onDragEnd={() => setDraggedChar(null)}
        onClick={() => cycleReaction('orange')}
      >
        <motion.div
          animate={isPasswordFocused ? { rotate: -18 } : { rotate: -12 }}
          transition={{ duration: 0.3 }}
          className="relative h-72 w-40 rounded-min bg-brand-orange shadow-soft"
        >
          <div className="absolute top-12 right-8 flex flex-col items-center gap-2">
            <div className="flex gap-2">
              <Eye
                gaze={gaze}
                isScared={draggedChar === 'orange'}
                isPasswordFocused={isPasswordFocused}
                isLaughing={getReaction('orange') === 'laugh'}
              />
              <Eye
                gaze={gaze}
                isScared={draggedChar === 'orange'}
                isPasswordFocused={isPasswordFocused}
                isLaughing={getReaction('orange') === 'laugh'}
              />
            </div>
            <Mouth reaction={getReaction('orange')} />
          </div>
        </motion.div>
      </DraggableCharacter>

      {/* ── 2. Grey Semicircle ── */}
      <DraggableCharacter
        className="bottom-0 left-0 z-20"
        period={6}
        delay={0.4}
        isDragged={draggedChar === 'grey'}
        onDragStart={() => setDraggedChar('grey')}
        onDragEnd={() => setDraggedChar(null)}
        onClick={() => cycleReaction('grey')}
      >
        <div className="relative h-32 w-64 rounded-t-full bg-mid shadow-soft">
          <div className="absolute top-14 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
            <div className="flex gap-12">
              <Eye
                gaze={gaze}
                sclera={false}
                travel={3.5}
                isScared={draggedChar === 'grey'}
                isPasswordFocused={isPasswordFocused}
                isLaughing={getReaction('grey') === 'laugh'}
              />
              <Eye
                gaze={gaze}
                sclera={false}
                travel={3.5}
                isScared={draggedChar === 'grey'}
                isPasswordFocused={isPasswordFocused}
                isLaughing={getReaction('grey') === 'laugh'}
              />
            </div>
            <Mouth reaction={getReaction('grey')} />
          </div>
        </div>
      </DraggableCharacter>

      {/* ── 3. Small Black Rectangle ── */}
      <DraggableCharacter
        className="bottom-0 left-56 z-10"
        period={4.6}
        delay={0.8}
        isDragged={draggedChar === 'black'}
        onDragStart={() => setDraggedChar('black')}
        onDragEnd={() => setDraggedChar(null)}
        onClick={() => cycleReaction('black')}
      >
        <motion.div
          animate={isPasswordFocused ? { rotate: -6, x: -4 } : { rotate: 0, x: 0 }}
          className="relative h-44 w-20 rounded-min bg-ink shadow-soft"
        >
          <div className="absolute top-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
            <div className="flex gap-1">
              <Eye
                gaze={gaze}
                isScared={draggedChar === 'black'}
                isPasswordFocused={isPasswordFocused}
                isLaughing={getReaction('black') === 'laugh'}
              />
              <Eye
                gaze={gaze}
                isScared={draggedChar === 'black'}
                isPasswordFocused={isPasswordFocused}
                isLaughing={getReaction('black') === 'laugh'}
              />
            </div>
            <Mouth reaction={getReaction('black')} className="text-paper [&_path]:stroke-paper" />
          </div>
        </motion.div>
      </DraggableCharacter>

      {/* ── 4. Rounded White Ghost Pill ── */}
      <DraggableCharacter
        className="bottom-0 left-[296px] z-10"
        period={5.6}
        delay={1.2}
        isDragged={draggedChar === 'white'}
        onDragStart={() => setDraggedChar('white')}
        onDragEnd={() => setDraggedChar(null)}
        onClick={() => cycleReaction('white')}
      >
        <div className="relative h-48 w-24 rounded-t-full border border-silver bg-paper shadow-soft">
          <div className="absolute top-16 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
            <div className="flex gap-6">
              <Eye
                gaze={gaze}
                sclera={false}
                travel={3.5}
                isScared={draggedChar === 'white'}
                isPasswordFocused={isPasswordFocused}
                isLaughing={getReaction('white') === 'laugh'}
              />
              <Eye
                gaze={gaze}
                sclera={false}
                travel={3.5}
                isScared={draggedChar === 'white'}
                isPasswordFocused={isPasswordFocused}
                isLaughing={getReaction('white') === 'laugh'}
              />
            </div>
            <Mouth reaction={getReaction('white')} />
          </div>
        </div>
      </DraggableCharacter>
    </div>
  );
}
