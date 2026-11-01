import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { CornerDownLeft, FileSearch, GitCompare, Search, Settings, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { DURATION, EASE } from '@/lib/motion';
import { useSession } from '@/state/session';
import { NAV } from './nav';
import { ICON, Kbd } from './ui';

interface Action {
  label: string;
  hint: string;
  to: string;
  icon: LucideIcon;
}

const SHARED: Action[] = [
  { label: 'Open REV-1049 diagnostics', hint: 'Summer Campaign Copy', to: '/reviews/rev-1049', icon: FileSearch },
  { label: 'Compare REV-1049 versions', hint: 'v1 → v2 diff', to: '/reviews/rev-1049?tab=compare', icon: GitCompare },
  { label: 'Settings', hint: 'Profile & preferences', to: '/settings', icon: Settings }
];

/** Panel radius 24 with 8px padding → result rows radius 16. */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { persona } = useSession();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);

  const actions = useMemo<Action[]>(
    () => [...NAV[persona.role].map(item => ({ label: item.label, hint: 'Go to page', to: item.to, icon: item.icon })), ...SHARED],
    [persona.role]
  );
  const results = actions.filter(action => `${action.label} ${action.hint}`.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setIndex(0);
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const run = (to: string) => {
    navigate(to);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="mono fixed inset-0 z-50 flex items-start justify-center p-4 pt-24">
          <motion.button
            type="button"
            aria-label="Close search"
            tabIndex={-1}
            className="absolute inset-0 cursor-default bg-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.fast }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98, transition: { duration: DURATION.fast, ease: EASE } }}
            transition={{ duration: DURATION.fast, ease: EASE }}
            className="relative w-full max-w-xl overflow-hidden rounded-panel border border-silver bg-paper shadow-float"
          >
            <div className="flex h-16 items-center gap-3 border-b border-silver px-6">
              <Search className="size-5 text-graphite" {...ICON} />
              <input
                ref={inputRef}
                value={query}
                onChange={event => {
                  setQuery(event.target.value);
                  setIndex(0);
                }}
                onKeyDown={event => {
                  if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    setIndex(value => Math.min(results.length - 1, value + 1));
                  } else if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    setIndex(value => Math.max(0, value - 1));
                  } else if (event.key === 'Enter' && results[index]) {
                    run(results[index].to);
                  } else if (event.key === 'Escape') {
                    onClose();
                  }
                }}
                placeholder="Search pages and reviews…"
                aria-label="Search pages and reviews"
                className="h-full flex-1 bg-transparent text-ui text-ink outline-none placeholder:text-mid"
              />
              <Kbd>Esc</Kbd>
            </div>
            <ul className="flex max-h-96 flex-col overflow-y-auto p-2" role="listbox" aria-label="Results">
              {results.length === 0 && <li className="px-4 py-8 text-center text-body text-graphite">No matches for “{query}”.</li>}
              {results.map((action, i) => (
                <li key={action.to + action.label} role="option" aria-selected={i === index}>
                  <button
                    type="button"
                    onMouseEnter={() => setIndex(i)}
                    onClick={() => run(action.to)}
                    className={cn('flex h-12 w-full cursor-pointer items-center gap-3 rounded-item px-3 text-left transition-colors', i === index ? 'bg-silver/40 text-ink' : 'text-graphite')}
                  >
                    <action.icon className="size-5 shrink-0" {...ICON} />
                    <span className="flex-1 text-ui font-medium whitespace-nowrap">{action.label}</span>
                    <span className="text-caption text-mid">{action.hint}</span>
                    {i === index && <CornerDownLeft className="size-4 text-graphite" {...ICON} />}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
