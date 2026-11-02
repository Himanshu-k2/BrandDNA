import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, Sparkles, X } from 'lucide-react';
import { BradFace, type ExpressionId } from '../face/BradFace';
import { LiquidSplash } from './LiquidSplash';
import { useSession, type Role } from '@/state/session';
import { cn } from '@/lib/cn';
import { focusRing } from '@/components/mono/ui';

export interface TourStep {
  targetId: string;
  title: string;
  description: string;
  expression: ExpressionId;
}

const getRoleSteps = (role: Role, firstName: string): TourStep[] => {
  const stepsByRole: Record<Role, TourStep[]> = {
    creator: [
      {
        targetId: 'creator-dashboard',
        title: 'Your Mission Control',
        description: `Hey ${firstName}! Think of this as your creative home base. Here you can check your live compliance score, see what’s in flight, and keep an eye on review turnaround times so you never miss a launch.`,
        expression: 'happy',
      },
      {
        targetId: 'new-content',
        title: 'Where New Ideas Take Flight',
        description: `Got a fresh social drop, email, or ad campaign? Jump in here! Paste your draft or upload assets, and I'll pre-flight check your copy against approved brand colors, fonts, and pricing claims before you hit submit.`,
        expression: 'attentive',
      },
      {
        targetId: 'my-submissions-drafts',
        title: 'Your Creative Workshop',
        description: `Everything you've created lives right here. Track reviews in real-time, see helpful feedback notes from Priya and Sarah side-by-side, and apply 1-click guideline fixes without breaking a sweat.`,
        expression: 'excited',
      },
      {
        targetId: 'brand-guidelines',
        title: 'Your Brand Cheat Sheet',
        description: `No more guessing if that orange is on-brand! Browse official hex codes, certified pricing figures, and tone rules for every brand so your drafts sail through approval on the first try.`,
        expression: 'curious',
      },
      {
        targetId: 'ask-brad-capsule',
        title: "I've Always Got Your Back!",
        description: `You're all set to create! If you ever get stuck, need copywriting ideas, or want me to double-check a guideline rule, just tap my capsule down here anytime. Let’s make something amazing!`,
        expression: 'proud',
      },
    ],
    brand_manager: [
      {
        targetId: 'brand-dashboard',
        title: 'Brand Health HQ',
        description: `Welcome, ${firstName}! Keep a close eye on your brand's vital signs: track compliance pass rates, catch rule violations early, and protect brand integrity across all channels.`,
        expression: 'happy',
      },
      {
        targetId: 'brand-asset-library',
        title: 'The Source of Truth',
        description: `Your official brand repository. Inspect verified hex palettes, typography hierarchies, and clear-space logo rules that keep your brand looking pristine.`,
        expression: 'curious',
      },
      {
        targetId: 'guideline-ingestion',
        title: 'AI Guideline Ingestion',
        description: `Drop in your raw brand PDF manuals! I automatically parse them, extracting official colors, font weights, and pricing rules into live enforcement engines.`,
        expression: 'excited',
      },
      {
        targetId: 'audit-log-ledger',
        title: 'Cryptographic Audit Ledger',
        description: `Tamper-proof accountability. Review cryptographic audit records verifying every single creative asset published by your teams.`,
        expression: 'attentive',
      },
      {
        targetId: 'ask-brad-capsule',
        title: 'At Your Service!',
        description: `You’re all set! Whenever you want to tweak guidelines, run rule simulations, or chat brand strategy, tap my capsule down here!`,
        expression: 'proud',
      },
    ],
    admin: [
      {
        targetId: 'platform-dashboard',
        title: 'Your High-Altitude Cockpit',
        description: `Welcome, ${firstName}! This is your 30,000-foot view. Monitor real-time platform compliance, track creator activity, and watch live audit velocities across all organizations at a glance.`,
        expression: 'happy',
      },
      {
        targetId: 'user-role-mgmt',
        title: 'Team & Access Control',
        description: `Easily invite collaborators, set permissions, and assign team members to specific roles—Admin, Brand Manager, Reviewer, or Creator—with enterprise security.`,
        expression: 'attentive',
      },
      {
        targetId: 'brand-workspaces',
        title: 'Isolated Brand Universes',
        description: `Govern multi-brand organizations (like NovaFit, OmniCloud, and Apex FinTech). Every workspace gets strictly isolated guideline sheets, approved facts, and dedicated reviewers.`,
        expression: 'excited',
      },
      {
        targetId: 'approval-queue',
        title: 'Review & Sign-Off Hub',
        description: `Keep work flowing smoothly. Track drafts requiring urgent sign-offs, inspect tamper-proof cryptographic certificates, and oversee turnaround times.`,
        expression: 'curious',
      },
      {
        targetId: 'ask-brad-capsule',
        title: 'Ready When You Are!',
        description: `You’re all caught up! Whenever you need platform help, audit checks, or system configurations, just tap my capsule down here to chat. Have a great day!`,
        expression: 'proud',
      },
    ],
  };

  return stepsByRole[role] || stepsByRole.creator;
};

type TourPhase = 'idle' | 'emerging' | 'greeting' | 'declined' | 'tour' | 'returning' | 'finished';

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

export function BradOnboardingTour() {
  const { persona } = useSession();
  const firstName = persona.name.split(' ')[0];
  const [phase, setPhase] = useState<TourPhase>('idle');
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [clonedHtml, setClonedHtml] = useState<string>('');
  const [splashActive, setSplashActive] = useState(false);
  const [declinedMessage, setDeclinedMessage] = useState('');
  const [bradPos, setBradPos] = useState({ x: 0, y: 0 });
  const [capsulePos, setCapsulePos] = useState({ x: 0, y: 0 });
  const [interactiveMood, setInteractiveMood] = useState<ExpressionId | null>(null);

  const steps = getRoleSteps(persona.role, firstName);
  const currentStep = steps[stepIndex] || steps[0];
  const isFinalStep = currentStep.targetId === 'ask-brad-capsule';

  // Storage key per persona to identify new users
  const storageKey = `branddna_tour_seen_${persona.role}_${persona.email}`;

  // Listen to interactive clicks on any Brad avatar across the app
  useEffect(() => {
    const onBradClick = (e: Event) => {
      const custom = e as CustomEvent<{ mood?: ExpressionId }>;
      const mood = custom.detail?.mood || 'excited';
      setInteractiveMood(mood);
      const timer = setTimeout(() => setInteractiveMood(null), 2500);
      return () => clearTimeout(timer);
    };
    window.addEventListener('branddna:brad_clicked', onBradClick);
    return () => window.removeEventListener('branddna:brad_clicked', onBradClick);
  }, []);

  // Get current capsule position in bottom right
  const updateCapsulePos = useCallback(() => {
    const capsuleEl = document.querySelector('[data-tour-target="ask-brad-capsule"]');
    if (capsuleEl) {
      const rect = capsuleEl.getBoundingClientRect();
      const pos = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      setCapsulePos(pos);
      return pos;
    }
    const fallback = { x: window.innerWidth - 88, y: window.innerHeight - 48 };
    setCapsulePos(fallback);
    return fallback;
  }, []);

  // Update position relative to active target
  const updateTargetPos = useCallback(() => {
    if (phase !== 'tour') return;

    if (currentStep.targetId === 'ask-brad-capsule') {
      const cap = updateCapsulePos();
      setTargetRect({
        left: cap.x - 70,
        top: cap.y - 24,
        width: 140,
        height: 48,
        right: cap.x + 70,
        bottom: cap.y + 24,
      });
      return;
    }

    const el = document.querySelector(`[data-tour-target="${currentStep.targetId}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom,
      });
    } else {
      setTargetRect(null);
    }
  }, [phase, currentStep, updateCapsulePos]);

  // Clone active target element's HTML to elevate it above the backdrop blur
  useEffect(() => {
    if (phase !== 'tour' || isFinalStep) {
      setClonedHtml('');
      return;
    }

    const updateClone = () => {
      const el = document.querySelector(`[data-tour-target="${currentStep.targetId}"]`);
      if (el) {
        setClonedHtml(el.outerHTML);
      } else {
        setClonedHtml('');
      }
    };

    updateClone();
    const timer = setTimeout(updateClone, 60);
    return () => clearTimeout(timer);
  }, [phase, currentStep, stepIndex, isFinalStep]);

  // Recalculate on window resize
  useEffect(() => {
    const handleResize = () => {
      updateCapsulePos();
      updateTargetPos();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateCapsulePos, updateTargetPos]);

  // Start the onboarding sequence after 6-second delay for new accounts
  useEffect(() => {
    const hasSeenTour = localStorage.getItem(storageKey);
    if (hasSeenTour) return;

    const timer = window.setTimeout(() => {
      startOnboarding();
    }, 6_000); // 6-second delay as requested

    return () => window.clearTimeout(timer);
  }, [storageKey]);

  // Allow manual trigger via global event and window helper
  useEffect(() => {
    const onStartEvent = () => startOnboarding();
    (window as any).startBradTour = startOnboarding;
    window.addEventListener('branddna:start_tour', onStartEvent);
    return () => {
      window.removeEventListener('branddna:start_tour', onStartEvent);
      delete (window as any).startBradTour;
    };
  }, []);

  const startOnboarding = () => {
    const cap = updateCapsulePos();
    setBradPos(cap);
    setPhase('emerging');

    // Float from capsule to top-center of dashboard
    const topCenterX = window.innerWidth / 2;
    const topCenterY = Math.max(105, window.innerHeight * 0.16);

    window.setTimeout(() => {
      setBradPos({ x: topCenterX, y: topCenterY });
    }, 50);

    window.setTimeout(() => {
      setPhase('greeting');
    }, 900);
  };

  const handleAcceptTour = () => {
    setStepIndex(0);
    setPhase('tour');
  };

  useEffect(() => {
    if (phase === 'tour') {
      updateTargetPos();
    }
  }, [phase, stepIndex, updateTargetPos]);

  const handleDeclineTour = () => {
    setPhase('declined');
    setDeclinedMessage(
      `No problem at all, ${firstName}! If you ever run into any questions or need a hand with compliance, just tap my capsule down here anytime.`
    );

    window.setTimeout(() => {
      returnToCapsule();
    }, 2800);
  };

  const handleNextStep = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(i => i + 1);
    } else {
      finishTour();
    }
  };

  const handlePrevStep = () => {
    if (stepIndex > 0) {
      setStepIndex(i => i - 1);
    }
  };

  const finishTour = () => {
    localStorage.setItem(storageKey, 'true');
    returnToCapsule();
  };

  const returnToCapsule = () => {
    setPhase('returning');
    const cap = updateCapsulePos();
    setBradPos(cap);

    // Exact moment Brad dives into capsule: trigger liquid splash!
    window.setTimeout(() => {
      setSplashActive(true);
      window.dispatchEvent(new CustomEvent('branddna:capsule_splash'));
    }, 700);

    window.setTimeout(() => {
      setPhase('finished');
      localStorage.setItem(storageKey, 'true');
    }, 1500);
  };

  if (phase === 'idle' || phase === 'finished') {
    return (
      <div className="fixed right-6 bottom-6 z-50 pointer-events-none">
        <LiquidSplash active={splashActive} onComplete={() => setSplashActive(false)} />
      </div>
    );
  }

  // Calculate Tour Card Position (always positioning beside the highlighted element)
  const cardWidth = 360;

  let cardPos = {
    left: Math.max(20, (window.innerWidth - cardWidth) / 2),
    top: Math.max(100, window.innerHeight * 0.25),
  };

  if (phase === 'tour') {
    if (isFinalStep) {
      // Anchored near the bottom-right capsule for the finish step
      cardPos = {
        left: Math.max(20, window.innerWidth - cardWidth - 48),
        top: Math.max(40, window.innerHeight - 340),
      };
    } else if (targetRect) {
      // Positioned to the right of the highlighted sidebar element
      cardPos = {
        left: Math.min(window.innerWidth - cardWidth - 24, targetRect.right + 28),
        top: Math.max(20, Math.min(window.innerHeight - 280, targetRect.top - 16)),
      };
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-auto">
      {/* SVG Mask Definition for Spotlight Cutout (Hole is 100% unblurred and untinted!) */}
      <svg
        className="fixed inset-0 pointer-events-none z-0"
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%' }}
        aria-hidden="true"
      >
        <defs>
          <mask id="tour-spotlight-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
            {/* White: backdrop blur and dimming visible */}
            <rect x="0" y="0" width="100%" height="100%" fill="#ffffff" />
            {/* Black: completely transparent cutout hole (NO blur, NO tint!) */}
            {phase === 'tour' && targetRect && !isFinalStep && (
              <rect
                x={targetRect.left - 4}
                y={targetRect.top - 4}
                width={targetRect.width + 8}
                height={targetRect.height + 8}
                rx="16"
                ry="16"
                fill="#000000"
              />
            )}
          </mask>
        </defs>
      </svg>

      {/* Dimmed backdrop scrim during tour with cutout mask */}
      <AnimatePresence>
        {(phase === 'greeting' || phase === 'declined' || phase === 'tour') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 40,
              backgroundColor: 'rgba(7, 13, 13, 0.45)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
              mask: phase === 'tour' && targetRect && !isFinalStep ? 'url(#tour-spotlight-mask)' : undefined,
              WebkitMask: phase === 'tour' && targetRect && !isFinalStep ? 'url(#tour-spotlight-mask)' : undefined,
            }}
            onClick={phase === 'greeting' ? handleDeclineTour : finishTour}
          />
        )}
      </AnimatePresence>

      {/* Elevated Spotlight Target Element - Rendered at z-45 in front of the blur layer */}
      {phase === 'tour' && targetRect && !isFinalStep && clonedHtml && (
        <motion.div
          key={`spotlight-clone-${stepIndex}`}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            top: targetRect.top - 2,
            left: targetRect.left - 2,
            width: targetRect.width + 4,
            height: targetRect.height + 4,
            zIndex: 45,
            pointerEvents: 'none',
          }}
          className="rounded-nav border-2 border-brand-orange bg-paper shadow-[0_0_28px_rgba(255,103,0,0.55),0_8px_20px_rgba(0,0,0,0.14)] p-0.5 overflow-hidden flex items-center [&>button]:!w-full [&>button]:!h-full [&>button]:!bg-paper [&>button]:!text-ink [&>button]:!opacity-100 [&>button]:!font-semibold [&>button]:!shadow-none"
          dangerouslySetInnerHTML={{ __html: clonedHtml }}
        />
      )}

      {/* Liquid Splash Portal over capsule */}
      <div
        style={{
          position: 'fixed',
          left: capsulePos.x - 24,
          top: capsulePos.y - 24,
          width: 48,
          height: 48,
        }}
        className="pointer-events-none z-50"
      >
        <LiquidSplash active={splashActive} onComplete={() => setSplashActive(false)} />
      </div>

      {/* Free-floating Brad Avatar for Emerging and Returning animations */}
      {(phase === 'emerging' || phase === 'returning') && (
        <motion.div
          animate={{
            x: bradPos.x,
            y: bradPos.y,
            scale: phase === 'returning' ? [1, 1.15, 0.2] : 1,
            opacity: phase === 'returning' ? [1, 1, 0] : 1,
          }}
          transition={{
            type: 'spring',
            damping: 24,
            stiffness: 180,
            mass: 0.85,
          }}
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            transform: 'translate(-50%, -50%)',
          }}
          className="pointer-events-none z-50 flex items-center justify-center"
        >
          <div className="relative flex items-center justify-center">
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.35, 0.7, 0.35],
              }}
              transition={{
                repeat: Infinity,
                duration: 2.5,
                ease: 'easeInOut',
              }}
              className="absolute -inset-3 rounded-full bg-gradient-to-r from-brand-orange/40 via-white/60 to-brand-orange/30 blur-md"
            />
            <div className="relative size-14 rounded-full bg-ink p-1 ring-4 ring-paper shadow-float">
              <BradFace
                size="lg"
                expression={interactiveMood || (phase === 'returning' ? 'proud' : 'excited')}
                follow={true}
                still={false}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Greeting Speech Bubble at Top-Center (Sketch 2) */}
      <AnimatePresence>
        {phase === 'greeting' && (
          <div
            style={{
              position: 'fixed',
              left: '50%',
              top: Math.max(100, window.innerHeight * 0.16),
              transform: 'translateX(-50%)',
            }}
            className="z-50 flex flex-col items-center"
          >
            {/* Top-Center Brad Avatar (Clickable to trigger happy & excited animation!) */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              title="Click Brad to make him happy!"
              className="relative -mb-3 z-20 flex items-center justify-center cursor-pointer"
            >
              <div className="size-14 rounded-full bg-ink p-1 ring-4 ring-paper shadow-float">
                <BradFace
                  size="lg"
                  expression={interactiveMood || 'excited'}
                  follow={true}
                  still={false}
                />
              </div>
            </motion.div>

            {/* Greeting Card */}
            <motion.div
              key="greeting-bubble"
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="w-[min(92vw,480px)] rounded-3xl border border-silver/80 bg-paper p-6 shadow-float"
            >
              <div className="relative flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-full bg-brand-orange/10 text-brand-orange">
                    <Sparkles className="size-4" />
                  </span>
                  <h3 className="font-display text-subheading font-bold text-ink tracking-tight">
                    Hey there, {firstName}! 👋
                  </h3>
                </div>

                <p className="text-ui text-graphite leading-relaxed">
                  I'm <strong className="text-ink font-semibold">Brad</strong>, your AI Brand Guardian.
                  Welcome to <span className="text-ink font-semibold">BrandDNA</span>!
                  Would you like a quick, friendly walkthrough of your workspace to see how everything fits together?
                </p>

                <div className="mt-2 flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleDeclineTour}
                    className={cn(
                      'rounded-full px-4 py-2 text-ui font-medium text-graphite hover:text-ink hover:bg-silver/40 transition-colors cursor-pointer',
                      focusRing
                    )}
                  >
                    No thanks
                  </button>

                  {/* Let's go button with crisp, high-contrast white text */}
                  <button
                    type="button"
                    onClick={handleAcceptTour}
                    style={{ color: '#ffffff' }}
                    className={cn(
                      'flex items-center gap-2 rounded-full bg-ink hover:bg-graphite px-5 py-2.5 text-ui font-semibold shadow-lift transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer',
                      focusRing
                    )}
                  >
                    <span style={{ color: '#ffffff' }} className="font-semibold">
                      Let's go
                    </span>
                    <ArrowRight className="size-4" style={{ color: '#ffffff' }} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Declined Reassurance Bubble */}
      <AnimatePresence>
        {phase === 'declined' && (
          <div
            style={{
              position: 'fixed',
              left: '50%',
              top: Math.max(110, window.innerHeight * 0.18),
              transform: 'translateX(-50%)',
            }}
            className="z-50 flex flex-col items-center"
          >
            <div className="size-14 -mb-3 z-20 rounded-full bg-ink p-1 ring-4 ring-paper shadow-float">
              <BradFace
                size="lg"
                expression={interactiveMood || 'attentive'}
                follow={true}
                still={false}
              />
            </div>
            <motion.div
              key="declined-bubble"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="w-[min(90vw,440px)] rounded-3xl border border-silver/80 bg-paper p-6 shadow-float text-center"
            >
              <p className="text-ui text-ink leading-relaxed font-medium">
                {declinedMessage}
              </p>
              <p className="mt-2 text-caption text-mid">
                Diving back into my capsule...
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Guided Tour Callout Card (Sketches 1 & 3: Bot perched on top-left corner) */}
      <AnimatePresence>
        {phase === 'tour' && (
          <motion.div
            key={`tour-card-${stepIndex}`}
            initial={{ opacity: 0, x: 12, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.95 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              left: cardPos.left,
              top: cardPos.top,
              width: cardWidth,
            }}
            className="z-50 relative rounded-3xl border border-silver/90 bg-paper p-6 shadow-float"
          >
            {/* Bot face perched prominently on the LEFT TOP CORNER of the message box on ALL steps (Clickable!) */}
            <div
              title="Click Brad to make him happy!"
              className="absolute -top-7 -left-5 z-20 flex items-center justify-center cursor-pointer"
            >
              <motion.div
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.92 }}
                animate={{
                  y: [0, -3, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.8,
                  ease: 'easeInOut',
                }}
                className="relative flex items-center justify-center"
              >
                {/* Glow ring */}
                <div className="absolute -inset-1.5 rounded-full bg-brand-orange/30 blur-sm" />
                {/* Bot Face Circle */}
                <div className="relative size-14 rounded-full bg-ink p-1 ring-4 ring-paper shadow-lift">
                  <BradFace
                    size="md"
                    expression={interactiveMood || currentStep.expression}
                    follow={true}
                    still={false}
                  />
                </div>
              </motion.div>
            </div>

            {/* Speech bubble pointer arrow pointing back to the highlighted sidebar element */}
            {!isFinalStep && (
              <div className="absolute top-6 -left-2 size-4 rotate-45 border-b border-l border-silver/80 bg-paper" />
            )}

            {/* Close / Skip button */}
            <button
              type="button"
              aria-label="Skip tour"
              onClick={finishTour}
              className="absolute top-4 right-4 flex size-7 items-center justify-center rounded-full text-graphite hover:bg-silver/40 hover:text-ink transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>

            <div className="flex flex-col gap-2.5 pt-1 pl-6">
              {/* Step indicator badge */}
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-brand-orange/10 px-2.5 py-0.5 text-caption font-bold text-brand-orange">
                  Step {stepIndex + 1} of {steps.length}
                </span>
                <span className="text-caption text-graphite font-medium">
                  Workspace Tour
                </span>
              </div>

              {/* Step Title */}
              <h4 className="font-display text-ui font-bold text-ink">
                {currentStep.title}
              </h4>

              {/* Step Description */}
              <p className="text-caption text-graphite leading-relaxed">
                {currentStep.description}
              </p>

              {/* Navigation Controls (matching Sketch 1: [<-] [X/Y] [->]) */}
              <div className="mt-3 flex items-center justify-between border-t border-silver/50 pt-3">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={stepIndex === 0}
                    onClick={handlePrevStep}
                    className={cn(
                      'flex size-8 items-center justify-center rounded-full border border-silver transition-colors',
                      stepIndex === 0
                        ? 'opacity-30 cursor-not-allowed'
                        : 'hover:bg-silver/40 cursor-pointer text-ink'
                    )}
                    aria-label="Previous step"
                  >
                    <ArrowLeft className="size-4" />
                  </button>

                  <span className="px-2 text-caption font-semibold text-ink tabular-nums">
                    {stepIndex + 1} / {steps.length}
                  </span>

                  {stepIndex < steps.length - 1 && (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="flex size-8 items-center justify-center rounded-full border border-silver hover:bg-silver/40 transition-colors cursor-pointer text-ink"
                      aria-label="Next step"
                    >
                      <ArrowRight className="size-4" />
                    </button>
                  )}
                </div>

                {stepIndex === steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={finishTour}
                    style={{ color: '#ffffff' }}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full bg-brand-orange hover:bg-brand-orange/90 px-4 py-1.5 text-caption font-semibold shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer',
                      focusRing
                    )}
                  >
                    <Check className="size-3.5" style={{ color: '#ffffff' }} />
                    <span style={{ color: '#ffffff' }}>Finish Tour</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    style={{ color: '#ffffff' }}
                    className={cn(
                      'flex items-center gap-1 rounded-full bg-ink hover:bg-graphite px-4 py-1.5 text-caption font-semibold shadow-sm transition-all hover:scale-105 cursor-pointer',
                      focusRing
                    )}
                  >
                    <span style={{ color: '#ffffff' }}>Next</span>
                    <ArrowRight className="size-3" style={{ color: '#ffffff' }} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
