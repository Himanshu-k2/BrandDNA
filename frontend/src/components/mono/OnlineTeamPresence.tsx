import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Sparkles, Users } from 'lucide-react';
import { PERSONAS, useSession, type Role } from '@/state/session';
import { cn } from '@/lib/cn';
import { DURATION, EASE } from '@/lib/motion';
import { focusRing, ICON } from './ui';
import { useDismiss } from '@/hooks/useDismiss';

interface OnlineTeamPresenceProps {
  className?: string;
  compact?: boolean;
}

interface PersonaPresenceInfo {
  role: Role;
  initials: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  activity: string;
}

const PRESENCE_DATA: PersonaPresenceInfo[] = [
  {
    role: 'brand_manager',
    initials: 'PK',
    bgColor: 'bg-[#FF5500]', // Electric Brand Orange
    textColor: '!text-white text-white',
    borderColor: 'border-[#FF5500]',
    activity: 'Reviewing assets & approval queue'
  },
  {
    role: 'creator',
    initials: 'AR',
    bgColor: 'bg-[#141416]', // Obsidian Jet Black
    textColor: '!text-white text-white',
    borderColor: 'border-[#141416]',
    activity: 'Drafting new campaigns'
  },
  {
    role: 'admin',
    initials: 'JB',
    bgColor: 'bg-[#374151]', // Slate Charcoal
    textColor: '!text-white text-white',
    borderColor: 'border-[#374151]',
    activity: 'Managing enterprise workspaces'
  }
];

export function OnlineTeamPresence({ className, compact = false }: OnlineTeamPresenceProps) {
  const { persona } = useSession();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useDismiss(containerRef, open, () => setOpen(false));

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center', className)}>
      {/* Pill trigger */}
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={cn(
          'group relative flex items-center gap-2 rounded-full border border-silver/80 bg-paper/95 p-1 pr-2.5 shadow-sm backdrop-blur-md transition-all duration-200 hover:border-graphite/40 hover:bg-paper hover:shadow-md cursor-pointer',
          focusRing,
          open && 'border-ink/80 bg-paper shadow-md ring-2 ring-ink/10'
        )}
        aria-label="Active team presence (3 online)"
        aria-expanded={open}
      >
        {/* Avatars Cluster matching the user sketch */}
        <div className="flex items-center -space-x-2">
          {PRESENCE_DATA.map((item, idx) => {
            const isSelf = persona.role === item.role;
            return (
              <div
                key={item.role}
                style={{ zIndex: 10 + idx, color: '#ffffff' }}
                className={cn(
                  'relative flex size-7 sm:size-8 items-center justify-center rounded-full font-bold text-caption tracking-wider ring-2 ring-paper shadow-sm transition-transform duration-200 group-hover:scale-105 !text-white text-white',
                  item.bgColor
                )}
                title={`${PERSONAS[item.role].name} (${PERSONAS[item.role].title}) · Online`}
              >
                <span className="!text-white text-white font-bold select-none" style={{ color: '#ffffff' }}>
                  {item.initials}
                </span>

                {/* Vivid Green Online Indicator Dot at Top Right */}
                <span className="absolute -top-0.5 -right-0.5 flex size-2.5 sm:size-3">
                  {isSelf && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span className="relative inline-flex size-2.5 sm:size-3 rounded-full bg-[#10B981] ring-2 ring-paper shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
                </span>
              </div>
            );
          })}
        </div>

        {/* Live Status Label */}
        {!compact && (
          <div className="hidden sm:flex items-center gap-1.5 pl-0.5 text-caption font-semibold">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[12px] font-bold tracking-tight text-ink">3 Online</span>
          </div>
        )}
      </button>

      {/* Popover Card */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: DURATION.fast, ease: EASE }}
            className="absolute top-full right-0 z-50 mt-2.5 w-80 rounded-2xl border border-silver/70 bg-paper/98 p-3 shadow-[0_12px_36px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06)] backdrop-blur-xl"
            role="dialog"
            aria-label="Active team members"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-silver/50 pb-2.5 px-1">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-brand-orange" {...ICON} />
                <span className="text-ui font-semibold text-ink">Team Presence</span>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                3 Active Now
              </span>
            </div>

            {/* Persona List (Pure presence status - no switch role action) */}
            <div className="mt-2 flex flex-col gap-1.5">
              {PRESENCE_DATA.map(item => {
                const target = PERSONAS[item.role];
                const isCurrent = persona.role === item.role;

                return (
                  <div
                    key={item.role}
                    className={cn(
                      'flex items-center justify-between rounded-xl p-2.5 transition-colors',
                      isCurrent
                        ? 'bg-silver/35 border border-silver/60'
                        : 'border border-transparent hover:bg-silver/15'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div
                          style={{ color: '#ffffff' }}
                          className={cn(
                            'flex size-8 items-center justify-center rounded-full font-bold text-caption ring-1 ring-black/10 !text-white text-white',
                            item.bgColor
                          )}
                        >
                          <span style={{ color: '#ffffff' }} className="!text-white text-white font-bold select-none">
                            {item.initials}
                          </span>
                        </div>
                        <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-[#10B981] ring-2 ring-paper" />
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-ui font-semibold text-ink">{target.name}</span>
                          {isCurrent && (
                            <span className="rounded-full bg-ink px-1.5 py-0.2 text-[10px] font-bold text-paper">
                              You
                            </span>
                          )}
                        </div>
                        <p className="truncate text-caption text-graphite">{target.title}</p>
                        <p className="truncate text-[11px] text-mid">{item.activity}</p>
                      </div>
                    </div>

                    {/* Status indicator (pure presence, no switch option) */}
                    <div className="shrink-0 pl-2">
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                          <Check className="size-3.5" {...ICON} /> Current
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-graphite">
                          <span className="size-1.5 rounded-full bg-emerald-500" /> Active
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Governance Hint Footer */}
            <div className="mt-2.5 border-t border-silver/50 pt-2 px-1 text-center">
              <p className="text-[11px] text-graphite flex items-center justify-center gap-1">
                <Sparkles className="size-3 text-brand-orange shrink-0" {...ICON} />
                <span>Brand Managers & Admins have review sign-off</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
