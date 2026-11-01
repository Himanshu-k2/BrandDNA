import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { DURATION, EASE } from '@/lib/motion';
import { focusRing, ICON } from './ui';

export interface SelectOption {
  value: string;
  label: string;
  leading?: ReactNode;
}

/**
 * Custom listbox select. Trigger: 48px, 1px Pale Silver border, Almost Black when
 * open or focused. Menu: radius-item (16) with 8px padding → radius-chip (8) rows.
 * Keyboard: ↑/↓/Home/End move, Enter/Space select, Esc/Tab close, type-ahead.
 */
export function Select({
  id,
  value,
  onChange,
  options,
  placeholder,
  invalid,
  describedBy,
  disabled,
  onClose
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  invalid?: boolean;
  describedBy?: string;
  disabled?: boolean;
  /** Fires whenever the menu closes (used to mark the field as touched). */
  onClose?: () => void;
}) {
  const reduce = useReducedMotion();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const selected = options.find(option => option.value === value);

  const close = useCallback(
    (refocus = true) => {
      setOpen(false);
      onClose?.();
      if (refocus) triggerRef.current?.focus();
    },
    [onClose]
  );

  const openMenu = (index?: number) => {
    if (disabled) return;
    setActive(index ?? Math.max(0, options.findIndex(option => option.value === value)));
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
    const onDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open, close]);

  useEffect(() => {
    if (open) listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const choose = (index: number) => {
    onChange(options[index].value);
    close();
  };

  const onTriggerKey = (event: KeyboardEvent) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      openMenu(event.key === 'ArrowUp' ? options.length - 1 : undefined);
    }
  };

  const onListKey = (event: KeyboardEvent) => {
    const last = options.length - 1;
    if (event.key === 'ArrowDown') setActive(index => Math.min(last, index + 1));
    else if (event.key === 'ArrowUp') setActive(index => Math.max(0, index - 1));
    else if (event.key === 'Home') setActive(0);
    else if (event.key === 'End') setActive(last);
    else if (event.key === 'Enter' || event.key === ' ') choose(active);
    else if (event.key === 'Escape') close();
    else if (event.key === 'Tab') return close(false);
    else if (event.key.length === 1) {
      const match = options.findIndex(option => option.label.toLowerCase().startsWith(event.key.toLowerCase()));
      if (match >= 0) setActive(match);
      return;
    } else return;
    event.preventDefault();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onTriggerKey}
        className={cn(
          'flex h-12 w-full cursor-pointer items-center gap-3 rounded-min border bg-paper px-4 text-left text-ui transition-colors duration-200 ease-(--ease-refined) disabled:cursor-not-allowed disabled:opacity-40',
          focusRing,
          open ? 'border-ink' : invalid ? 'border-graphite' : 'border-silver hover:border-mid focus-visible:border-ink'
        )}
      >
        {selected?.leading}
        <span className={cn('min-w-0 flex-1 truncate', selected ? 'text-ink' : 'text-mid')}>{selected?.label ?? placeholder}</span>
        <ChevronDown className={cn('size-5 shrink-0 text-graphite transition-transform duration-200 ease-(--ease-refined)', open && 'rotate-180')} {...ICON} aria-hidden />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={`${id}-label`}
            aria-activedescendant={`${listId}-${active}`}
            onKeyDown={onListKey}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: DURATION.fast, ease: EASE } }}
            transition={{ duration: DURATION.fast, ease: EASE }}
            className="absolute top-full right-0 left-0 z-30 mt-2 flex max-h-72 origin-top flex-col overflow-y-auto rounded-item border border-silver bg-paper p-2 shadow-lift outline-none"
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <li
                  key={option.value}
                  id={`${listId}-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  onPointerMove={() => setActive(index)}
                  onClick={() => choose(index)}
                  className={cn(
                    'flex h-10 shrink-0 cursor-pointer items-center gap-3 rounded-chip px-2 text-ui transition-colors duration-200',
                    index === active ? 'bg-silver/40 text-ink' : 'text-graphite',
                    isSelected && 'font-medium text-ink'
                  )}
                >
                  {option.leading}
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {isSelected && <Check className="size-4 shrink-0 text-ink" {...ICON} aria-hidden />}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
