import { useEffect, useLayoutEffect, useRef, useState, type FocusEvent, type MouseEvent, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, ChevronsLeft, ChevronsUpDown, LogOut, Search, Settings, type LucideIcon } from 'lucide-react';
import { BRANDS } from '@/data/demo';
import { setActiveWorkspace } from '@/components/brad/workspace';
import { cn } from '@/lib/cn';
import { DURATION, EASE } from '@/lib/motion';
import { dashboardPath, PERSONAS, ROLE_LABEL, useSession, type Role } from '@/state/session';
import { MonoAvatar } from './Brand';
import { Logo } from './Logo';
import { NAV, type NavItem } from './nav';
import { focusRing, ICON, Kbd, MenuRow, Popover } from './ui';

/*
 * Radii: shell 32 − sidebar padding 12 → nav rows, switcher, search, user card = 20 (radius-nav).
 * User card 20 − 8 padding → its rows = 12 (radius-inset).
 */

type Tip = { label: string; top: number; left: number } | null;

interface SidebarProps {
  compact: boolean;
  canCollapse: boolean;
  onToggleCompact: () => void;
  onNavigate?: () => void;
  onSearch: () => void;
  onNotice: (message: string) => void;
}

export function Sidebar({ compact, canCollapse, onToggleCompact, onNavigate, onSearch, onNotice }: SidebarProps) {
  const { persona, setRole } = useSession();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [brand, setBrand] = useState<(typeof BRANDS)[number]>(BRANDS[0]);
  const [userOpen, setUserOpen] = useState(false);
  const [tip, setTip] = useState<Tip>(null);

  const go = (to: string) => {
    navigate(to);
    setTip(null);
    onNavigate?.();
  };

  // Collapsed mode: fixed-position tooltip so it is never clipped by the scrolling nav.
  const tipHandlers = (label: string) =>
    compact
      ? {
          onMouseEnter: (event: MouseEvent<HTMLElement>) => showTip(label, event.currentTarget),
          onFocus: (event: FocusEvent<HTMLElement>) => showTip(label, event.currentTarget),
          onMouseLeave: () => setTip(null),
          onBlur: () => setTip(null)
        }
      : {};
  const showTip = (label: string, element: HTMLElement) => {
    const box = element.getBoundingClientRect();
    setTip({ label, top: box.top + box.height / 2, left: box.right + 12 });
  };

  useEffect(() => setTip(null), [compact, pathname]);

  const switchRole = (role: Role) => {
    setRole(role);
    setUserOpen(false);
    // Same behaviour as before: on the dashboard, jump to the new persona's landing view.
    if (pathname === '/dashboard') go(dashboardPath(role));
    else navigate(`${pathname}${search}`, { replace: true });
  };

  const items = NAV[persona.role];

  return (
    <nav aria-label="Main" className={cn('flex h-full flex-col gap-2 overflow-x-hidden overflow-y-auto px-3 py-4', compact ? 'w-20' : 'w-70')}>
      {/* 1 · Logo + collapse */}
      <div className={cn('mb-2 flex h-10 shrink-0 items-center', compact ? 'justify-center' : 'justify-between pl-3')}>
        {compact ? (
          <span className="flex size-10 items-center justify-center" {...tipHandlers('BrandDNA')}>
            <Logo variant="mark" size="md" />
          </span>
        ) : (
          <Logo variant="horizontal" size="md" />
        )}
        {canCollapse && !compact && (
          <IconAction label="Collapse sidebar" onClick={onToggleCompact}>
            <ChevronsLeft className="size-5" {...ICON} />
          </IconAction>
        )}
      </div>
      {canCollapse && compact && (
        <IconAction label="Expand sidebar" onClick={onToggleCompact} className="mx-auto" {...tipHandlers('Expand sidebar')}>
          <ChevronsLeft className="size-5 rotate-180" {...ICON} />
        </IconAction>
      )}

      {/* 2 · Workspace switcher */}
      <Popover
        align="left"
        className="w-64"
        trigger={({ open, toggle }) => (
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={`Workspace: ${brand.name}`}
            onClick={toggle}
            {...tipHandlers(brand.name)}
            className={cn(
              'press flex h-12 w-full shrink-0 cursor-pointer items-center gap-3 rounded-nav border border-silver bg-paper px-2 text-left transition-colors hover:border-mid',
              focusRing,
              compact && 'justify-center px-0'
            )}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-inset bg-ink text-caption font-semibold text-paper">{brand.initials}</span>
            {!compact && (
              <>
                <span className="min-w-0 flex-1 text-ui font-medium whitespace-nowrap text-ink">{brand.name}</span>
                <ChevronsUpDown className="size-4 shrink-0 text-graphite" {...ICON} />
              </>
            )}
          </button>
        )}
      >
        {close =>
          BRANDS.map(item => (
            <MenuRow
              key={item.id}
              active={item.id === brand.id}
              onClick={() => {
                setBrand(item);
                setActiveWorkspace(item.id);
                close();
                onNotice(`Switched to ${item.name}`);
              }}
            >
              <span className="flex size-6 items-center justify-center rounded-min bg-ink text-caption font-semibold text-paper">{item.initials}</span>
              {item.name}
            </MenuRow>
          ))
        }
      </Popover>

      {/* 3 · Search */}
      <button
        type="button"
        onClick={onSearch}
        aria-label="Search (Command K)"
        {...tipHandlers('Search  ⌘K')}
        className={cn(
          'flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-nav border border-silver bg-paper px-3 text-ui text-mid transition-colors hover:border-mid',
          focusRing,
          compact && 'justify-center px-0'
        )}
      >
        <Search className="size-4 shrink-0 text-graphite" {...ICON} />
        {!compact && (
          <>
            <span className="flex-1 text-left">Search</span>
            <Kbd>⌘K</Kbd>
          </>
        )}
      </button>

      {/* 4 · Role indicator */}
      {!compact && (
        <div className="mt-2 flex px-3">
          <span className="rounded-full border border-silver bg-paper px-3 py-1 text-caption font-medium text-ink">{ROLE_LABEL[persona.role]}</span>
        </div>
      )}

      {/* 5 · Menu */}
      <div className={cn('flex flex-col', compact && 'mt-2 border-t border-silver pt-2')}>
        {!compact && <p className="flex h-8 items-center px-3 text-caption font-medium text-mid">Menu</p>}
        <ul className="flex flex-col gap-1">
          {items.map(item => (
            <li key={item.label}>
              <NavRow item={item} compact={compact} active={item.match(pathname)} onClick={() => go(item.to)} tipHandlers={tipHandlers(item.label)} />
            </li>
          ))}
        </ul>
      </div>

      {/* 6 · User card */}
      <div className="mt-auto flex shrink-0 flex-col rounded-nav border border-silver bg-paper p-2">
        <button
          type="button"
          aria-expanded={compact ? undefined : userOpen}
          aria-label={`${persona.name}, switch persona`}
          onClick={() => (compact ? onToggleCompact() : setUserOpen(value => !value))}
          {...tipHandlers(`${persona.name} · ${persona.email}`)}
          className={cn('flex cursor-pointer items-center gap-2 rounded-inset p-1 text-left transition-colors hover:bg-silver/24', focusRing, compact && 'justify-center')}
        >
          {/* Current user: the single 2px orange avatar ring in the app. */}
          <MonoAvatar initials={persona.initials} className="size-8 ring-2 ring-brand-orange ring-offset-2 ring-offset-paper" />
          {!compact && (
            <>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-ui font-medium text-ink">{persona.name}</span>
                <span className="truncate text-caption text-graphite">{persona.email}</span>
              </span>
              <ChevronDown className={cn('size-4 shrink-0 text-graphite transition-transform duration-200 ease-(--ease-refined)', userOpen && 'rotate-180')} {...ICON} />
            </>
          )}
        </button>
        <AnimatePresence initial={false}>
          {userOpen && !compact && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: DURATION.fast, ease: EASE }}
              className="overflow-hidden"
            >
              <p className="px-2 pt-2 pb-1 text-caption text-mid">Switch demo persona</p>
              {(Object.keys(PERSONAS) as Role[]).map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => switchRole(role)}
                  aria-pressed={persona.role === role}
                  className={cn(
                    'flex h-10 w-full cursor-pointer items-center rounded-inset px-2 text-left text-ui transition-colors hover:bg-silver/24',
                    focusRing,
                    persona.role === role ? 'bg-silver/40 font-medium text-ink' : 'text-graphite hover:text-ink'
                  )}
                >
                  {ROLE_LABEL[role]}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <span className="my-2 h-px bg-silver" />
        <UserRow icon={Settings} label="Settings" compact={compact} active={pathname === '/settings'} onClick={() => go('/settings')} tipHandlers={tipHandlers('Settings')} />
        <UserRow icon={LogOut} label="Log out" compact={compact} onClick={() => go('/login')} tipHandlers={tipHandlers('Log out')} />
      </div>

      <AnimatePresence>
        {tip && (
          <motion.span
            role="tooltip"
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, transition: { duration: DURATION.fast, ease: EASE } }}
            transition={{ duration: DURATION.fast, ease: EASE }}
            style={{ top: tip.top, left: tip.left }}
            className="pointer-events-none fixed z-50 -translate-y-1/2 rounded-chip bg-ink px-3 py-2 text-caption font-medium whitespace-nowrap text-paper shadow-lift"
          >
            {tip.label}
          </motion.span>
        )}
      </AnimatePresence>
    </nav>
  );
}

type TipHandlers = Partial<{
  onMouseEnter: (event: MouseEvent<HTMLElement>) => void;
  onFocus: (event: FocusEvent<HTMLElement>) => void;
  onMouseLeave: () => void;
  onBlur: () => void;
}>;

function IconAction({ label, onClick, children, className, ...rest }: { label: string; onClick: () => void; children: ReactNode; className?: string } & TipHandlers) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      {...rest}
      className={cn('press flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-graphite transition-colors hover:bg-paper hover:text-ink', focusRing, className)}
    >
      {children}
    </button>
  );
}

/**
 * Nav row. The label never truncates: if label + badge overflow, the badge
 * steps down from full text → short text → a dot (text kept for screen readers).
 */
function NavRow({ item, compact, active, onClick, tipHandlers }: { item: NavItem; compact: boolean; active: boolean; onClick: () => void; tipHandlers: TipHandlers }) {
  const rowRef = useRef<HTMLSpanElement>(null);
  const [level, setLevel] = useState(0);
  const Icon = item.icon;

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row || compact || !item.badge) return;
    if (row.scrollWidth > row.clientWidth + 1 && level < 2) setLevel(value => value + 1);
  }, [level, compact, item.badge]);

  useEffect(() => {
    // Web fonts change metrics: re-measure once they are ready.
    document.fonts?.ready.then(() => setLevel(0));
  }, []);

  const badgeText = item.badge ? (level === 0 ? item.badge.full : item.badge.short) : null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      aria-label={compact ? item.label : undefined}
      {...tipHandlers}
      className={cn(
        'group relative flex h-10 w-full cursor-pointer items-center rounded-nav px-3 text-left text-ui transition-colors duration-200',
        focusRing,
        compact && 'justify-center px-0',
        active ? 'text-ink' : 'text-graphite hover:bg-silver/24 hover:text-ink'
      )}
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-0 rounded-nav border border-silver bg-paper shadow-soft"
          transition={{ duration: DURATION.base, ease: EASE }}
        >
          {/* 4×16 Blaze Orange indicator; slides with the active pill. */}
          <span aria-hidden className="absolute top-1/2 left-0 h-4 w-1 -translate-y-1/2 rounded-r-full bg-brand-orange" />
        </motion.span>
      )}
      <span
        ref={rowRef}
        className={cn(
          'relative flex min-w-0 flex-1 items-center gap-3 transition-transform duration-200 ease-(--ease-refined)',
          compact ? 'justify-center' : 'group-hover:translate-x-0.5',
          active && 'font-medium'
        )}
      >
        <Icon className="size-5 shrink-0" {...ICON} />
        {!compact && <span className="shrink-0 whitespace-nowrap">{item.label}</span>}
        {!compact && badgeText && level < 2 && (
          <span className="ml-auto shrink-0 rounded-full bg-silver px-2 py-1 text-caption font-semibold tracking-[0.04em] whitespace-nowrap text-ink uppercase">{badgeText}</span>
        )}
        {!compact && item.badge && level === 2 && (
          <span className="ml-auto size-2 shrink-0 rounded-full bg-ink" title={item.badge.full}>
            <span className="sr-only">{item.badge.full}</span>
          </span>
        )}
        {!compact && item.count && (
          <span
            className={cn(
              'ml-auto flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-2 text-caption font-medium tabular-nums',
              item.count.urgent ? 'bg-graphite text-paper' : 'bg-silver text-ink'
            )}
            aria-label={`${item.count.value} ${item.count.urgent ? 'including urgent' : 'unread'}`}
          >
            {item.count.value}
          </span>
        )}
      </span>
      {compact && (item.badge || item.count) && (
        <span aria-hidden className={cn('absolute top-2 right-2 size-2 rounded-full', item.count && !item.count.urgent ? 'bg-mid' : 'bg-ink')} />
      )}
    </button>
  );
}

function UserRow({ icon: Icon, label, compact, active, onClick, tipHandlers }: { icon: LucideIcon; label: string; compact: boolean; active?: boolean; onClick: () => void; tipHandlers: TipHandlers }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={compact ? label : undefined}
      aria-current={active ? 'page' : undefined}
      {...tipHandlers}
      className={cn(
        'group flex h-10 cursor-pointer items-center gap-3 rounded-inset px-2 text-ui transition-colors hover:bg-silver/24 hover:text-ink',
        focusRing,
        compact && 'justify-center px-0',
        active ? 'bg-silver/40 font-medium text-ink' : 'text-graphite'
      )}
    >
      <span className={cn('flex items-center gap-3 transition-transform duration-200 ease-(--ease-refined)', !compact && 'group-hover:translate-x-0.5')}>
        <Icon className="size-5 shrink-0" {...ICON} />
        {!compact && label}
      </span>
    </button>
  );
}
