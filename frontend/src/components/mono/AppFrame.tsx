import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { Menu } from 'lucide-react';
import { DURATION, EASE } from '@/lib/motion';
import { pageTitle } from '@/lib/pageTitle';
import { useSession } from '@/state/session';
import { BradDock } from '@/components/brad/BradDock';
import { Logo } from './Logo';
import { CommandPalette } from './CommandPalette';
import { Sidebar } from './Sidebar';
import { NotificationBell } from './NotificationBell';
import { OnlineTeamPresence } from './OnlineTeamPresence';
import { TONE_ICON, TONE_SUBTLE, type Tone } from './tone';
import { focusRing, ICON } from './ui';

interface FrameValue {
  notify: (message: string, tone?: Tone) => void;
  openSearch: () => void;
}

const FrameContext = createContext<FrameValue>({ notify: () => undefined, openSearch: () => undefined });
export const useFrame = () => useContext(FrameContext);

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

interface ToastMessage {
  text: string;
  tone: Tone;
  id: number;
}

/** Neutral toasts stay Almost Black; toned toasts use the muted status layer with an icon. */
function Toast({ message }: { message: ToastMessage | null }) {
  const Icon = message && message.tone !== 'neutral' ? TONE_ICON[message.tone] : null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[88px] z-50 flex justify-center md:bottom-8" aria-live="polite">
      <AnimatePresence>
        {message && (
          <motion.p
            key={message.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8, transition: { duration: DURATION.fast, ease: EASE } }}
            transition={{ duration: DURATION.fast, ease: EASE }}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-caption font-medium shadow-lift ${
              message.tone === 'neutral' ? 'bg-ink text-paper' : TONE_SUBTLE[message.tone]
            }`}
          >
            {Icon && <Icon className="size-4 shrink-0" {...ICON} aria-hidden />}
            {message.text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Shared shell for every signed-in page: floating white container (radius 32),
 * persona sidebar (280px desktop · icon rail on tablet · drawer on mobile) and
 * a fading page outlet. The sidebar persists across routes so its active pill slides.
 */
export function AppFrame() {
  const outlet = useOutlet();
  const { pathname, search } = useLocation();
  const { persona } = useSession();

  const isAuth =
    typeof window !== 'undefined'
      ? Boolean(
          localStorage.getItem('branddna_authenticated') ||
          localStorage.getItem('branddna_token') ||
          localStorage.getItem('branddna.role')
        )
      : true;

  if (!isAuth) {
    return <Navigate to="/login" replace state={{ from: pathname }} />;
  }

  useEffect(() => {
    document.title = pageTitle(pathname, search, persona.role);
  }, [pathname, search, persona.role]);
  const reduce = useReducedMotion();
  const desktop = useMedia('(min-width: 1024px)');
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);
  const [message, setMessage] = useState<ToastMessage | null>(null);
  const notify = (text: string, tone: Tone = 'neutral') => setMessage({ text, tone, id: Date.now() });

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), message.tone === 'danger' ? 4000 : 2400);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPalette(value => !value);
      }
      if (event.key === 'Escape') setDrawer(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const value: FrameValue = { notify, openSearch: () => setPalette(true) };
  const sidebarProps = {
    onSearch: () => {
      setDrawer(false);
      setPalette(true);
    },
    onNotice: (text: string) => notify(text)
  };

  return (
    <FrameContext.Provider value={value}>
      <motion.div
        className="mono mono-wash min-h-dvh p-0 md:p-6"
        initial={{ opacity: 0, scale: reduce ? 1 : 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: DURATION.slow, ease: EASE }}
      >
        <div className="flex min-h-dvh overflow-clip bg-paper shadow-float md:min-h-[calc(100dvh-48px)] md:rounded-shell">
          <aside className="hidden shrink-0 bg-silver/24 md:block">
            <div className="sticky top-6 h-[calc(100dvh-48px)]">
              <LayoutGroup id="sidebar-desktop">
                <Sidebar {...sidebarProps} compact={!desktop || collapsed} canCollapse={desktop} onToggleCompact={() => setCollapsed(value => !value)} />
              </LayoutGroup>
            </div>
          </aside>

          {/* pb-32 keeps the last card, rows and buttons clear of the fixed Ask Brad pill (24px + 48px). */}
          <main className="min-w-0 flex-1 px-4 pt-4 pb-32 md:px-8 md:pt-8">
            <div className="mb-6 flex h-12 items-center justify-between md:hidden">
              <Logo variant="horizontal" size="md" />
              <div className="flex items-center gap-2">
                <OnlineTeamPresence compact />
                <NotificationBell className="size-10" />
                <button
                  type="button"
                  aria-label="Open menu"
                  onClick={() => setDrawer(true)}
                  className={`press flex size-10 cursor-pointer items-center justify-center rounded-full border border-silver text-ink ${focusRing}`}
                >
                  <Menu className="size-5" {...ICON} />
                </button>
              </div>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: DURATION.fast, ease: EASE } }}
                transition={{ duration: DURATION.base, ease: EASE }}
              >
                {outlet}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        <AnimatePresence>
          {drawer && (
            <div className="fixed inset-0 z-40 md:hidden">
              <motion.button
                type="button"
                aria-label="Close menu"
                className="absolute inset-0 bg-ink/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DURATION.fast }}
                onClick={() => setDrawer(false)}
              />
              <motion.div
                className="absolute inset-y-0 left-0 rounded-r-shell bg-paper shadow-float"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%', transition: { duration: DURATION.fast, ease: EASE } }}
                transition={{ duration: DURATION.base, ease: EASE }}
              >
                <LayoutGroup id="sidebar-drawer">
                  <Sidebar {...sidebarProps} compact={false} canCollapse={false} onToggleCompact={() => undefined} onNavigate={() => setDrawer(false)} />
                </LayoutGroup>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <CommandPalette open={palette} onClose={() => setPalette(false)} />
        <BradDock />
        <Toast message={message} />
      </motion.div>
    </FrameContext.Provider>
  );
}

/** Small helper for pages that need a section spacer stack. */
export function PageStack({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-8">{children}</div>;
}
