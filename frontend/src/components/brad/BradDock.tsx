import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useDragControls, useReducedMotion } from 'motion/react';
import { MessageSquare, X } from 'lucide-react';
import { DURATION, EASE } from '@/lib/motion';
import { cn } from '@/lib/cn';
import { focusRing, ICON } from '@/components/mono/ui';
import { useSession, ROLE_LABEL } from '@/state/session';
import { getUnreadMessagesForRole, markMessageAsRead, type PersonaDispatchMessage } from '@/lib/personaMessages';
import { AskBradButton } from './AskBradButton';
import { BradChatPanel } from './BradChatPanel';
import { useBrad } from './BradProvider';

function useMedia(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, [query]);
  return matches;
}

const NUDGE_DELAY = 8000;
const NUDGE_FOR = 4000;

/**
 * Brad's dock for every signed-in screen (mounted by AppFrame, so never on login):
 * the Ask Brad pill at 24px from the bottom-right, the non-modal chat panel above it
 * (400px desktop · 360px tablet · full-height bottom sheet on mobile) and the
 * once-per-session "Need a hand?" nudge on the dashboard.
 */
export function BradDock() {
  const brad = useBrad();
  const { persona } = useSession();
  const { pathname } = useLocation();
  const reduce = useReducedMotion() ?? false;
  const mobile = useMedia('(max-width: 767px)');
  const desktop = useMedia('(min-width: 1024px)');
  const variant = mobile ? 'mobile' : desktop ? 'desktop' : 'tablet';
  const pillRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const wasOpen = useRef(brad.open);
  const drag = useDragControls();
  const [nudge, setNudge] = useState(false);
  const [incomingMsg, setIncomingMsg] = useState<PersonaDispatchMessage | null>(null);

  // Monitor unread messages directed to the current logged-in persona
  useEffect(() => {
    const checkMessages = () => {
      const unreads = getUnreadMessagesForRole(persona.role);
      setIncomingMsg(unreads.length > 0 ? unreads[unreads.length - 1] : null);
    };
    checkMessages();
    window.addEventListener('branddna:persona_message', checkMessages);
    return () => window.removeEventListener('branddna:persona_message', checkMessages);
  }, [persona.role]);

  const close = useCallback(() => brad.setOpen(false), [brad.setOpen]);

  // Focus moves to the textarea on open and back to the pill on close. First open plays the intro.
  useEffect(() => {
    if (brad.open && !wasOpen.current) {
      if (!brad.introPlayed) brad.playIntro();
      const timer = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 60);
      wasOpen.current = true;
      return () => window.clearTimeout(timer);
    }
    if (!brad.open && wasOpen.current) {
      wasOpen.current = false;
      pillRef.current?.focus({ preventScroll: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brad.open]);

  // "Need a hand?" — once per session, 8 s into the dashboard, visible for 4 s.
  useEffect(() => {
    if (pathname !== '/dashboard' || brad.nudgeDone || brad.open) return;
    const timer = window.setTimeout(() => {
      setNudge(true);
      brad.setNudgeDone();
    }, NUDGE_DELAY);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, brad.nudgeDone, brad.open]);
  useEffect(() => {
    if (!nudge) return;
    const timer = window.setTimeout(() => setNudge(false), NUDGE_FOR);
    return () => window.clearTimeout(timer);
  }, [nudge]);

  const showPill = !(mobile && brad.open);

  return (
    <>
      <AnimatePresence>
        {brad.open &&
          (variant === 'mobile' ? (
            <div key="sheet" className="fixed inset-0 z-50">
              <motion.div
                aria-hidden
                className="absolute inset-0 bg-ink/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: DURATION.fast } }}
                transition={{ duration: DURATION.fast }}
                onClick={close}
              />
              <motion.div
                role="dialog"
                aria-label="Chat with Brad"
                drag={reduce ? false : 'y'}
                dragControls={drag}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.6 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 120 || info.velocity.y > 600) close();
                }}
                initial={reduce ? { opacity: 0 } : { y: '100%' }}
                animate={reduce ? { opacity: 1 } : { y: 0 }}
                exit={reduce ? { opacity: 0, transition: { duration: DURATION.fast } } : { y: '100%', transition: { duration: 0.24, ease: EASE } }}
                transition={{ duration: 0.36, ease: EASE }}
                className="absolute inset-x-0 bottom-0 top-[calc(env(safe-area-inset-top)+8px)] overflow-hidden rounded-t-panel bg-paper shadow-float"
              >
                <BradChatPanel variant="mobile" onClose={close} inputRef={inputRef} onDragHandle={event => drag.start(event)} />
              </motion.div>
            </div>
          ) : (
            <motion.div
              key="panel"
              role="dialog"
              aria-label="Chat with Brad"
              initial={{ opacity: 0, scale: reduce ? 1 : 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: reduce ? 1 : 0.96, transition: { duration: DURATION.fast, ease: EASE } }}
              transition={{ duration: reduce ? DURATION.fast : 0.32, ease: EASE }}
              style={{ transformOrigin: 'bottom right' }}
              className={cn(
                'fixed right-6 bottom-[88px] z-40 h-[min(640px,calc(100dvh-112px))] min-h-[min(480px,calc(100dvh-112px))] overflow-hidden rounded-panel border border-silver bg-paper shadow-float',
                variant === 'desktop' ? 'w-[400px]' : 'w-[360px]'
              )}
            >
              <BradChatPanel variant={variant} onClose={close} inputRef={inputRef} />
            </motion.div>
          ))}
      </AnimatePresence>

      <AnimatePresence>
        {showPill && (
          <motion.div
            key="pill"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: DURATION.fast } }}
            className="fixed right-6 bottom-6 z-40 flex flex-col items-end gap-3"
          >
            <AnimatePresence>
              {/* Persona Dispatch Pop-up Alert emerging from Brad Bot capsule */}
              {incomingMsg && !brad.open && (
                <motion.div
                  key={`incoming-${incomingMsg.id}`}
                  role="alert"
                  aria-live="polite"
                  initial={{ opacity: 0, y: reduce ? 0 : 12, scale: reduce ? 1 : 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: reduce ? 0 : 8, scale: reduce ? 1 : 0.94, transition: { duration: DURATION.fast } }}
                  transition={{ duration: 0.28, ease: EASE }}
                  style={{ transformOrigin: 'bottom right' }}
                  className="relative w-80 sm:w-96 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/80 shadow-[0_16px_40px_rgba(0,0,0,0.14),0_2px_10px_rgba(0,0,0,0.06)] p-4 text-ink ring-1 ring-black/5"
                >
                  {/* Pointing arrow downward pointing to Ask Brad capsule */}
                  <span
                    aria-hidden
                    className="absolute -bottom-2 right-8 size-3.5 rotate-45 bg-white/95 border-r border-b border-black/10 shadow-sm"
                  />

                  {/* Header with Sender Avatar & Role */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-orange text-white text-xs font-bold shadow-sm ring-2 ring-brand-orange/20">
                        {incomingMsg.fromInitials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-semibold text-ink truncate leading-tight">
                            {incomingMsg.fromName}
                          </span>
                          <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded bg-sand border border-silver/50 text-graphite">
                            {ROLE_LABEL[incomingMsg.fromRole]}
                          </span>
                        </div>
                        <p className="text-[11px] text-graphite flex items-center gap-1.5 mt-0.5">
                          <span className="size-1.5 rounded-full bg-brand-orange animate-pulse" />
                          <span>Sent you a message via Brad Bot</span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label="Dismiss message notification"
                      onClick={() => {
                        markMessageAsRead(incomingMsg.id);
                        setIncomingMsg(null);
                      }}
                      className={cn(
                        'flex size-6 cursor-pointer items-center justify-center rounded-full text-graphite hover:text-ink hover:bg-sand transition-colors',
                        focusRing
                      )}
                    >
                      <X className="size-3.5" {...ICON} />
                    </button>
                  </div>

                  {/* Message body preview */}
                  <div className="mt-2.5 rounded-xl bg-sand/60 border border-silver/50 px-3 py-2.5 text-xs text-ink/90 leading-relaxed shadow-inner">
                    <p className="italic">“{incomingMsg.content}”</p>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        markMessageAsRead(incomingMsg.id);
                        setIncomingMsg(null);
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-graphite hover:text-ink transition-colors cursor-pointer"
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        brad.openWithPersonaMessage(incomingMsg);
                        setIncomingMsg(null);
                      }}
                      className="flex items-center gap-1.5 rounded-full bg-brand-orange hover:bg-brand-orange/90 active:scale-95 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all cursor-pointer"
                    >
                      <MessageSquare className="size-3.5" />
                      <span>Open &amp; Reply</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* General nudge (only if no persona message pop-up is active) */}
              {nudge && !incomingMsg && !brad.open && (
                <motion.div
                  role="status"
                  initial={{ opacity: 0, y: reduce ? 0 : 8, scale: reduce ? 1 : 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, transition: { duration: DURATION.fast } }}
                  transition={{ duration: DURATION.base, ease: EASE }}
                  style={{ transformOrigin: 'bottom right' }}
                  className="relative flex items-center gap-1 rounded-item bg-ink py-1 pr-1 pl-4 text-ui text-paper shadow-lift"
                >
                  Need a hand?
                  <button
                    type="button"
                    aria-label="Dismiss"
                    onClick={() => setNudge(false)}
                    className={cn('flex size-8 cursor-pointer items-center justify-center rounded-full text-paper hover:bg-graphite', focusRing, 'focus-visible:outline-paper')}
                  >
                    <X className="size-4" {...ICON} />
                  </button>
                  <span aria-hidden className="absolute -bottom-1 right-5 size-2 rotate-45 bg-ink" />
                </motion.div>
              )}
            </AnimatePresence>
            <AskBradButton
              ref={pillRef}
              open={brad.open}
              badge={brad.unread || Boolean(incomingMsg)}
              compact={mobile}
              expression={brad.expression}
              scan={brad.scanning}
              onHoverChange={brad.setHover}
              onClick={() => {
                setNudge(false);
                if (incomingMsg) {
                  brad.openWithPersonaMessage(incomingMsg);
                  setIncomingMsg(null);
                } else {
                  brad.setOpen(!brad.open);
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
