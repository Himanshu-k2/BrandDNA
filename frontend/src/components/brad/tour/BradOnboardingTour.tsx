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

const ROLE_STEPS: Record<Role, TourStep[]> = {
  creator: [
    {
      targetId: 'creator-dashboard',
      title: 'Creator Dashboard',
      description: 'This is your mission control. Monitor your brand compliance score, turnaround times, and latest submission approval statuses at a glance.',
      expression: 'happy',
    },
    {
      targetId: 'new-content',
      title: 'Create New Content',
      description: 'Drafting a campaign, ad copy, or social post? Start here! Upload assets or paste text, and I’ll run instant pre-flight checks against approved brand colors, fonts, and certified claims.',
      expression: 'attentive',
    },
    {
      targetId: 'my-submissions-drafts',
      title: 'My Submissions & Drafts',
      description: 'Track all your active drafts and reviewer feedback in real-time. Review change requests with side-by-side diffs and apply 1-click guideline fixes.',
      expression: 'excited',
    },
    {
      targetId: 'brand-guidelines',
      title: 'Brand Guidelines Hub',
      description: 'Explore verified brand rules, certified pricing, and official hex swatches (like NovaFit Electric Orange) so your creative assets always pass audit.',
      expression: 'curious',
    },
    {
      targetId: 'ask-brad-capsule',
      title: 'All caught up!',
      description: 'Whenever you have questions, need copywriting inspiration, or want to check a guideline rule, just click my capsule down here anytime to chat with me!',
      expression: 'proud',
    },
  ],
  reviewer: [
    {
      targetId: 'reviewer-dashboard',
      title: 'Reviewer Dashboard',
      description: 'Your reviewer cockpit: inspect open approvals, average turnaround speed, and compliance pass rates across teams.',
      expression: 'happy',
    },
    {
      targetId: 'approval-queue',
      title: 'Approval Queue',
      description: 'High-priority drafts arrive here first. Inspect diffs, verify brand claims, request revisions with required notes, or approve and seal certificates.',
      expression: 'attentive',
    },
    {
      targetId: 'all-submissions',
      title: 'All Submissions',
      description: 'Browse the full archive of historical submissions, active reviews, and signed certificates across all brands.',
      expression: 'curious',
    },
    {
      targetId: 'brand-workspaces',
      title: 'Brand Workspaces',
      description: 'Switch between enterprise brands like NovaFit, OmniCloud, and Apex FinTech. Each workspace keeps strict guideline isolation.',
      expression: 'excited',
    },
    {
      targetId: 'ask-brad-capsule',
      title: 'All caught up!',
      description: 'I’m always here to check guidelines, verify terminology, or help review drafts. Tap my capsule anytime to chat!',
      expression: 'proud',
    },
  ],
  brand_manager: [
    {
      targetId: 'brand-dashboard',
      title: 'Brand Manager Dashboard',
      description: 'Govern the brand identity across all workspaces. Track overall brand integrity, high-priority violations, and asset compliance.',
      expression: 'happy',
    },
    {
      targetId: 'brand-asset-library',
      title: 'Brand Asset Library',
      description: 'Inspect official verified hex colors, typography scales, contrast ratings, and clear-space logo requirements.',
      expression: 'curious',
    },
    {
      targetId: 'guideline-ingestion',
      title: 'Guideline Ingestion Studio',
      description: 'Ingest PDF brand guidelines. Brad extracts colors, fonts, and pricing rules into live automated enforcement rules.',
      expression: 'excited',
    },
    {
      targetId: 'audit-log-ledger',
      title: 'Audit Log Ledger',
      description: 'Review tamper-proof, cryptographic audit certificates tracking every approved creative asset.',
      expression: 'attentive',
    },
    {
      targetId: 'ask-brad-capsule',
      title: 'All caught up!',
      description: 'I’m your dedicated Brand Guardian. Click my capsule anytime to inspect guidelines or run compliance checks!',
      expression: 'proud',
    },
  ],
  admin: [
    {
      targetId: 'platform-dashboard',
      title: 'Platform Dashboard',
      description: 'Enterprise overview: active creators, global review pass rates, and system-wide audit activity.',
      expression: 'happy',
    },
    {
      targetId: 'user-role-mgmt',
      title: 'User & Role Management',
      description: 'Manage platform access, configure user roles, and assign team members to brand workspaces.',
      expression: 'attentive',
    },
    {
      targetId: 'brand-workspaces',
      title: 'Brand Workspaces',
      description: 'Create and govern multi-tenant workspaces with isolated guideline sheets and assigned reviewers.',
      expression: 'excited',
    },
    {
      targetId: 'audit-log-ledger',
      title: 'Audit Log Ledger',
      description: 'Cryptographic ledger maintaining permanent proof of compliance for all published creative work.',
      expression: 'curious',
    },
    {
      targetId: 'ask-brad-capsule',
      title: 'All caught up!',
      description: 'Need assistance managing the platform? I’m ready in the bottom capsule whenever you need me!',
      expression: 'proud',
    },
  ],
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
  const [phase, setPhase] = useState<TourPhase>('idle');
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [splashActive, setSplashActive] = useState(false);
  const [declinedMessage, setDeclinedMessage] = useState('');
  const [bradPos, setBradPos] = useState({ x: 0, y: 0 });
  const [capsulePos, setCapsulePos] = useState({ x: 0, y: 0 });

  const steps = ROLE_STEPS[persona.role] || ROLE_STEPS.creator;
  const currentStep = steps[stepIndex] || steps[0];

  // Storage key per persona to identify new users
  const storageKey = `branddna_tour_seen_${persona.role}_${persona.email}`;

  // Get current capsule position in bottom right
  const updateCapsulePos = useCallback(() => {
    const capsuleEl = document.querySelector('[data-tour-target="ask-brad-capsule"]');
    if (capsuleEl) {
      const rect = capsuleEl.getBoundingClientRect();
      setCapsulePos({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
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
      setBradPos({ x: cap.x - 56, y: cap.y - 68 });
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
      // Position Brad next to the sidebar element
      setBradPos({
        x: rect.right + 36,
        y: rect.top + rect.height / 2,
      });
    } else {
      // Fallback center left
      setBradPos({ x: 300, y: 220 + stepIndex * 48 });
      setTargetRect(null);
    }
  }, [phase, currentStep, stepIndex, updateCapsulePos]);

  // Recalculate on window resize
  useEffect(() => {
    const handleResize = () => {
      updateCapsulePos();
      updateTargetPos();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateCapsulePos, updateTargetPos]);

  // Start the onboarding sequence after 10-second delay for new accounts
  useEffect(() => {
    const hasSeenTour = localStorage.getItem(storageKey);
    if (hasSeenTour) return;

    const timer = window.setTimeout(() => {
      startOnboarding();
    }, 10_000); // 10-second onboarding delay as requested

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
    const topCenterY = Math.max(120, window.innerHeight * 0.18);

    window.setTimeout(() => {
      setBradPos({ x: topCenterX, y: topCenterY });
    }, 50);

    window.setTimeout(() => {
      setPhase('greeting');
    }, 950);
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
      `No problem at all, ${persona.name.split(' ')[0]}! If you ever run into any questions or need a hand, just tap my capsule down here anytime.`
    );

    // After message display, return Brad back into the capsule
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
    }, 750);

    window.setTimeout(() => {
      setPhase('finished');
      localStorage.setItem(storageKey, 'true');
    }, 1600);
  };

  if (phase === 'idle' || phase === 'finished') {
    return (
      <div className="fixed right-6 bottom-6 z-50 pointer-events-none">
        <LiquidSplash active={splashActive} onComplete={() => setSplashActive(false)} />
      </div>
    );
  }

  const firstName = persona.name.split(' ')[0];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-auto">
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

      {/* Dimmed backdrop scrim with spotlight cutout during tour */}
      <AnimatePresence>
        {(phase === 'greeting' || phase === 'declined' || phase === 'tour') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 bg-ink/35 backdrop-blur-[1.5px]"
            onClick={phase === 'greeting' ? handleDeclineTour : finishTour}
          />
        )}
      </AnimatePresence>

      {/* Spotlight pulse ring on targeted sidebar element */}
      {phase === 'tour' && targetRect && (
        <motion.div
          key={`spotlight-${stepIndex}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
          className="pointer-events-none z-50 rounded-xl ring-2 ring-brand-orange ring-offset-2 ring-offset-paper shadow-[0_0_24px_rgba(255,69,0,0.35)]"
        />
      )}

      {/* Floating Brad Avatar */}
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
          {/* Subtle magical aura around Brad */}
          <motion.div
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.35, 0.65, 0.35],
            }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: 'easeInOut',
            }}
            className="absolute -inset-3 rounded-full bg-gradient-to-r from-brand-orange/30 via-white/50 to-brand-orange/20 blur-md"
          />

          {/* Brad's actual interactive face */}
          <div className="relative size-14 rounded-full bg-ink p-1 ring-2 ring-white/90 shadow-[0_12px_32px_rgba(0,0,0,0.35)]">
            <BradFace
              size="lg"
              expression={
                phase === 'greeting'
                  ? 'excited'
                  : phase === 'declined'
                  ? 'attentive'
                  : phase === 'returning'
                  ? 'proud'
                  : currentStep.expression
              }
              follow={true}
              still={false}
            />
          </div>
        </div>
      </motion.div>

      {/* Greeting Speech Bubble at Top-Center (Sketch 2) */}
      <AnimatePresence>
        {phase === 'greeting' && (
          <motion.div
            key="greeting-bubble"
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.94 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              left: '50%',
              top: Math.max(190, window.innerHeight * 0.26),
              transform: 'translateX(-50%)',
            }}
            className="z-50 w-[min(92vw,480px)] rounded-2xl border border-silver/80 bg-paper p-6 shadow-float"
          >
            {/* Triangular pointer pointing up towards Brad */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 size-4 rotate-45 border-t border-l border-silver/80 bg-paper" />

            <div className="relative flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-brand-orange/10 text-brand-orange">
                  <Sparkles className="size-4" />
                </span>
                <h3 className="font-display text-subheading font-bold text-ink tracking-tight">
                  Hello, {firstName}!
                </h3>
              </div>

              <p className="text-ui text-graphite leading-relaxed">
                I'm <strong className="text-ink font-semibold">Brad</strong>, your AI Brand Guardian.
                Welcome to <span className="text-ink font-semibold">BrandDNA</span>!
                Would you like a quick walkthrough of your workspace to see how everything works?
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

                <button
                  type="button"
                  onClick={handleAcceptTour}
                  className={cn(
                    'flex items-center gap-2 rounded-full bg-ink hover:bg-graphite px-5 py-2.5 text-ui font-semibold text-white shadow-lift transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer',
                    focusRing
                  )}
                >
                  <span>Let's go</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Declined Reassurance Bubble */}
      <AnimatePresence>
        {phase === 'declined' && (
          <motion.div
            key="declined-bubble"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              left: '50%',
              top: Math.max(190, window.innerHeight * 0.26),
              transform: 'translateX(-50%)',
            }}
            className="z-50 w-[min(90vw,440px)] rounded-2xl border border-silver/80 bg-paper p-5 shadow-float text-center"
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 size-4 rotate-45 border-t border-l border-silver/80 bg-paper" />
            <p className="text-ui text-ink leading-relaxed font-medium">
              {declinedMessage}
            </p>
            <p className="mt-2 text-caption text-mid">
              Diving back into my capsule...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guided Tour Callout Card (Sketch 1) */}
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
              left: Math.min(
                window.innerWidth - 380,
                Math.max(20, bradPos.x + 36)
              ),
              top: Math.min(
                window.innerHeight - 260,
                Math.max(60, bradPos.y - 70)
              ),
            }}
            className="z-50 w-[340px] rounded-2xl border border-silver/90 bg-paper p-5 shadow-float"
          >
            {/* Close button */}
            <button
              type="button"
              aria-label="Skip tour"
              onClick={finishTour}
              className="absolute top-3 right-3 flex size-7 items-center justify-center rounded-full text-graphite hover:bg-silver/40 hover:text-ink transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>

            <div className="flex flex-col gap-2.5">
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
                    className="flex items-center gap-1.5 rounded-full bg-brand-orange hover:bg-brand-orange/90 px-4 py-1.5 text-caption font-semibold text-white shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Check className="size-3.5" />
                    <span>Finish Tour</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex items-center gap-1 rounded-full bg-ink hover:bg-graphite px-3.5 py-1.5 text-caption font-semibold text-white shadow-sm transition-all hover:scale-105 cursor-pointer"
                  >
                    <span>Next</span>
                    <ArrowRight className="size-3" />
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
