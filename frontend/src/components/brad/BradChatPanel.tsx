import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  CircleAlert,
  Clock,
  Compass,
  Copy,
  EllipsisVertical,
  FileText,
  Key,
  Link2,
  MessageSquareText,
  Mic,
  Paperclip,
  RotateCcw,
  Search,
  Smile,
  Sparkles,
  Square,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  WifiOff,
  X
} from 'lucide-react';
import { MonoAvatar } from '@/components/mono/Brand';
import { TONE_TEXT } from '@/components/mono/tone';
import { Button, focusRing, ICON, MenuRow } from '@/components/mono/ui';
import { BRANDS } from '@/data/demo';
import { useDismiss } from '@/hooks/useDismiss';
import { cn } from '@/lib/cn';
import { DURATION, EASE } from '@/lib/motion';
import { useSession } from '@/state/session';
import { useBrad, WORD_MS, type BradMessage } from './BradProvider';
import { BradFace } from './face/BradFace';
import { countWords, Markdown } from './Markdown';
import { BradIconButton, ListeningBars, ModeSwitch, TypingDots } from './parts';
import { useActiveWorkspace } from './workspace';
import { getStoredGeminiKey, setStoredGeminiKey, isGeminiDirectActive, getStoredGeminiModel } from './gemini';

/*
 * Radii: panel 24 − 16 padding → bubbles 8 (radius-chip), sender corner 4 (radius-min).
 * Input container 16 (radius-item) − 8 padding → inner controls 8 / fully round.
 */

const MAX_CHARS = 2000;
const COUNTER_FROM = 1800;
/** Grayscale text symbols only (no colour emoji). */
const SYMBOLS = ['✓', '✗', '→', '←', '↑', '↓', '•', '…', '—', '★', '☆', '§', '¶', '°', '±', '×', '÷', '≈', '≠', '≤', '≥', '∞', '#', '@'];

const time = (date: Date) => date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

type Variant = 'desktop' | 'tablet' | 'mobile';

/* ── Speech (Web Speech API, optional) ───────────────────────────── */

interface SpeechResultEvent {
  results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
}
interface SpeechRecognizer {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
type SpeechCtor = new () => SpeechRecognizer;
const Speech: SpeechCtor | undefined =
  typeof window !== 'undefined' ? ((window as unknown as { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: SpeechCtor }).webkitSpeechRecognition) : undefined;

/* ── Panel ───────────────────────────────────────────────────────── */

export function BradChatPanel({
  variant,
  onClose,
  inputRef,
  onDragHandle
}: {
  variant: Variant;
  onClose: () => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onDragHandle?: (event: ReactPointerEvent) => void;
}) {
  const brad = useBrad();
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [layer, setLayer] = useState(false);
  const [keyModal, setKeyModal] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState(getStoredGeminiKey());
  const [geminiActive, setGeminiActive] = useState(isGeminiDirectActive());
  const menuRef = useRef<HTMLDivElement>(null);
  useDismiss(menuRef, menu, useCallback(() => setMenu(false), []));

  // Esc closes the panel unless a menu/picker inside it or a modal elsewhere owns the key.
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (menu || layer) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      if (confirm) return setConfirm(false);
      onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menu, layer, confirm, onClose]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="relative flex shrink-0 flex-col border-b border-silver">
        {variant === 'mobile' && (
          <div className="flex cursor-grab touch-none justify-center pt-2 active:cursor-grabbing" onPointerDown={onDragHandle} aria-hidden>
            <span className="h-1 w-10 rounded-full bg-silver" />
          </div>
        )}
        <div className="flex items-center gap-3 p-4" onPointerDown={variant === 'mobile' ? onDragHandle : undefined}>
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-silver">
            <BradFace size="md" expression={brad.expression} scan={brad.scanning} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <h2 className="font-display text-subheading leading-tight-ui font-semibold text-ink">Brad</h2>
            <div className="flex items-center gap-2 text-caption">
              <span className={cn('size-2 rounded-full', geminiActive ? 'bg-brand-orange' : 'bg-success')} aria-hidden />
              {geminiActive ? (
                <button
                  type="button"
                  onClick={() => setKeyModal(true)}
                  className="flex items-center gap-1 font-medium text-ink hover:underline cursor-pointer"
                >
                  <Sparkles className="size-3 text-brand-orange" />
                  Gemini AI Active
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setKeyModal(true)}
                  className="text-mid hover:text-ink text-left cursor-pointer"
                >
                  BrandDNA assistant · <span className="underline text-graphite">Connect Gemini</span>
                </button>
              )}
            </div>
          </div>
          <div ref={menuRef} className="relative" onPointerDown={event => event.stopPropagation()}>
            <BradIconButton label="More options" side="bottom" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu(value => !value)}>
              <EllipsisVertical className="size-4" {...ICON} />
            </BradIconButton>
            <AnimatePresence>
              {menu && (
                <motion.div
                  role="menu"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: DURATION.fast, ease: EASE } }}
                  transition={{ duration: DURATION.fast, ease: EASE }}
                  className="absolute top-full right-0 z-30 mt-2 flex min-w-56 origin-top-right flex-col rounded-item border border-silver bg-paper p-2 shadow-lift"
                >
                  <MenuRow
                    onClick={() => {
                      setMenu(false);
                      onClose?.();
                      window.dispatchEvent(new CustomEvent('branddna:start_tour'));
                    }}
                  >
                    <Compass className="size-4" {...ICON} /> Take Platform Tour
                  </MenuRow>
                  <MenuRow
                    onClick={() => {
                      setMenu(false);
                      setKeyModal(true);
                    }}
                  >
                    <Key className="size-4" {...ICON} /> {geminiActive ? 'Manage Gemini AI Key' : 'Connect Gemini AI Key'}
                  </MenuRow>
                  <MenuRow
                    onClick={() => {
                      setMenu(false);
                      setConfirm(true);
                    }}
                  >
                    <Trash2 className="size-4" {...ICON} /> Clear conversation
                  </MenuRow>
                  <MenuRow
                    onClick={() => {
                      setMenu(false);
                      brad.askFeedback();
                    }}
                  >
                    <MessageSquareText className="size-4" {...ICON} /> Give feedback
                  </MenuRow>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <BradIconButton label="Close Brad" side="bottom" onClick={onClose} onPointerDown={event => event.stopPropagation()}>
            <X className="size-4" {...ICON} />
          </BradIconButton>
        </div>
        <AnimatePresence initial={false}>
          {keyModal && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0, transition: { duration: DURATION.fast, ease: EASE } }}
              transition={{ duration: DURATION.fast, ease: EASE }}
              className="overflow-hidden border-t border-silver bg-silver/15 p-4"
            >
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-ui font-semibold text-ink">
                    <Sparkles className="size-4 text-brand-orange" />
                    Connect Google Gemini AI
                  </div>
                  <button
                    type="button"
                    onClick={() => setKeyModal(false)}
                    className="cursor-pointer text-graphite hover:text-ink"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <p className="text-caption text-graphite leading-relaxed">
                  Connect your Google Gemini API key to enable live generative AI. Brad will answer any question, draft copy, or explain anything across BrandDNA!
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={geminiKeyInput}
                    onChange={e => setGeminiKeyInput(e.target.value)}
                    placeholder="Paste Gemini API Key (AIzaSy...)"
                    className="flex-1 rounded-chip border border-silver bg-paper px-3 py-1.5 text-caption font-mono text-ink placeholder:text-mid focus:border-ink focus:outline-none"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      setStoredGeminiKey(geminiKeyInput);
                      setGeminiActive(Boolean(geminiKeyInput.trim()));
                      setKeyModal(false);
                    }}
                  >
                    Save
                  </Button>
                  {geminiActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setStoredGeminiKey('');
                        setGeminiKeyInput('');
                        setGeminiActive(false);
                        setKeyModal(false);
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <div className="flex items-center justify-between text-caption text-graphite pt-0.5">
                  <span className="text-caption">
                    {geminiActive ? `✅ ${getStoredGeminiModel() === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash' : getStoredGeminiModel()} active` : 'Using built-in knowledge'}
                  </span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-brand-orange hover:underline inline-flex items-center gap-1"
                  >
                    Get free Gemini key ↗
                  </a>
                </div>
              </div>
            </motion.div>
          )}
          {confirm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0, transition: { duration: DURATION.fast, ease: EASE } }}
              transition={{ duration: DURATION.fast, ease: EASE }}
              className="overflow-hidden"
            >
              <div role="alertdialog" aria-label="Clear conversation" className="flex flex-wrap items-center gap-2 border-t border-silver px-4 py-3">
                <p className="min-w-0 flex-1 text-ui text-ink">Clear this conversation?</p>
                <Button variant="ghost" size="sm" onClick={() => setConfirm(false)} autoFocus>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setConfirm(false);
                    brad.clear();
                    inputRef.current?.focus();
                  }}
                >
                  Clear
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <MessageLog onNavigate={variant === 'mobile' ? onClose : undefined} />

      <Composer variant={variant} inputRef={inputRef} onLayer={setLayer} />
    </div>
  );
}

/* ── Messages ────────────────────────────────────────────────────── */

function MessageLog({ onNavigate }: { onNavigate?: () => void }) {
  const brad = useBrad();
  const workspaceId = useActiveWorkspace();
  const workspace = BRANDS.find(brand => brand.id === workspaceId) ?? BRANDS[0];
  const reduce = useReducedMotion() ?? false;
  const listRef = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);
  const [unseen, setUnseen] = useState(false);
  const count = useRef(brad.messages.length);

  const toBottom = (smooth: boolean) => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth && !reduce ? 'smooth' : 'auto' });
  };

  useLayoutEffect(() => toBottom(false), []);

  // Auto-scroll only while the reader is at the bottom; otherwise offer a "New message" pill.
  useLayoutEffect(() => {
    const added = brad.messages.length > count.current;
    count.current = brad.messages.length;
    if (pinned.current) toBottom(true);
    else if (added) setUnseen(true);
  }, [brad.messages, brad.thinking]);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 32;
    if (pinned.current) setUnseen(false);
  };

  const lastBrad = [...brad.messages].reverse().find(message => message.from === 'brad')?.id;
  const lastUserIndex = brad.messages.map(message => message.from).lastIndexOf('user');

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={listRef}
        onScroll={onScroll}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Conversation with Brad"
        className="flex h-full flex-col gap-4 overflow-y-auto overscroll-contain p-4"
      >
        <div className="flex flex-col items-center gap-2 pt-4 pb-2 text-center" aria-hidden>
          <BradFace size="lg" expression={brad.expression} scan={brad.scanning} />
          <p className="max-w-64 text-caption text-mid">Ask about {workspace.name} guidelines, submissions, findings, or where to find something.</p>
        </div>

        {brad.messages.map((message, index) =>
          message.from === 'user' ? (
            <UserRow key={message.id} message={message} />
          ) : (
            <BradRow
              key={`${message.id}-${message.reveal && !reduce ? 'r' : 'd'}`}
              message={message}
              live={message.id === lastBrad && !brad.thinking}
              revealing={Boolean(message.reveal) && !reduce}
              showChips={index > lastUserIndex}
              onNavigate={onNavigate}
            />
          )
        )}

        {brad.thinking && (
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.fast, ease: EASE }}
            className="flex items-start gap-2"
          >
            <BradFace size="sm" expression={brad.expression} scan={brad.scanning} className="mt-5" />
            <div className="flex flex-col gap-1">
              <p className="text-caption text-mid">
                <span className="font-medium text-graphite">Brad</span> is typing
              </p>
              <div className="w-max rounded-chip rounded-tl-min bg-silver/40 px-4 py-2">
                <TypingDots />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {unseen && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: reduce ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: DURATION.fast } }}
            transition={{ duration: DURATION.fast, ease: EASE }}
            onClick={() => {
              toBottom(true);
              setUnseen(false);
            }}
            className={cn('press absolute bottom-4 left-1/2 flex h-8 -translate-x-1/2 cursor-pointer items-center gap-1 rounded-full bg-ink px-3 text-caption font-medium text-paper shadow-lift', focusRing)}
          >
            New message <ChevronDown className="size-4" {...ICON} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function UserRow({ message }: { message: BradMessage }) {
  const { persona } = useSession();
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.fast, ease: EASE }}
      className="flex items-start justify-end gap-2 pl-8"
    >
      <div className="flex min-w-0 flex-col items-end gap-1">
        <p className="text-caption text-mid">
          <span className="sr-only">You, </span>
          {time(message.at)}
        </p>
        {message.text && <p className="rounded-chip rounded-tr-min bg-ink px-3 py-2 text-body leading-copy whitespace-pre-wrap text-paper [overflow-wrap:anywhere]">{message.text}</p>}
        {message.attachments?.map(name => (
          <span key={name} className="flex max-w-full items-center gap-1 rounded-full border border-silver px-2 py-1 text-caption text-graphite">
            <Paperclip className="size-4 shrink-0" {...ICON} aria-hidden />
            <span className="truncate">{name}</span>
          </span>
        ))}
      </div>
      <MonoAvatar initials={persona.initials} tone="graphite" className="mt-5 size-6" />
    </motion.div>
  );
}

const ERROR_ICON = { offline: WifiOff, rate_limited: Clock, failed: CircleAlert } as const;
const ERROR_TONE = { offline: 'warning', rate_limited: 'warning', failed: 'danger' } as const;
const ERROR_LABEL = { offline: 'Offline', rate_limited: 'Rate limited', failed: 'Request failed' } as const;

function BradRow({ message, live, revealing, showChips, onNavigate }: { message: BradMessage; live: boolean; revealing: boolean; showChips: boolean; onNavigate?: () => void }) {
  const brad = useBrad();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const done = useCallback(() => brad.markRevealed(message.id), [brad.markRevealed, message.id]);

  useEffect(() => {
    if (!revealing) return;
    const timer = window.setTimeout(done, countWords(message.text) * WORD_MS + 200);
    return () => window.clearTimeout(timer);
  }, [revealing, done, message.text]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable: nothing to do */
    }
  };

  const ErrorIcon = message.error ? ERROR_ICON[message.error] : null;

  return (
    <motion.div
      initial={revealing ? { opacity: 0, y: reduce ? 0 : 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.fast, ease: EASE }}
      className="group/msg flex items-start gap-2 pr-8"
      aria-hidden={revealing || undefined}
    >
      <BradFace size="sm" expression={live ? brad.expression : 'neutral'} still={!live} className="mt-5" />
      <div className="flex min-w-0 flex-col gap-1">
        <p className="flex items-center gap-1 text-caption text-mid">
          <span className="font-medium text-graphite">Brad</span>
          <span aria-hidden>·</span>
          {time(message.at)}
          {ErrorIcon && message.error && (
            <span className={cn('ml-1 flex items-center gap-1', TONE_TEXT[ERROR_TONE[message.error]])}>
              <ErrorIcon className="size-4" {...ICON} aria-hidden />
              {ERROR_LABEL[message.error]}
            </span>
          )}
        </p>
        <div
          onClick={revealing ? done : undefined}
          title={revealing ? 'Click to show the full reply' : undefined}
          className={cn('rounded-chip rounded-tl-min bg-silver/40 px-3 py-2 text-body leading-copy text-ink [overflow-wrap:anywhere]', revealing && 'cursor-pointer')}
        >
          <Markdown text={message.text} reveal={revealing} wordMs={WORD_MS} />
        </div>

        {!revealing && (message.sources?.length || message.actions?.length || message.retry) ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: DURATION.fast, ease: EASE }} className="flex flex-wrap items-center gap-2 pt-1">
            {message.sources?.map(source => (
              <Link
                key={source.to + source.label}
                to={source.to}
                onClick={onNavigate}
                className={cn('flex h-8 max-w-full items-center gap-1 rounded-full border border-silver bg-paper px-3 text-caption text-ink transition-colors hover:bg-silver/40', focusRing)}
              >
                {source.kind === 'guideline' ? <FileText className="size-4 shrink-0" {...ICON} aria-hidden /> : <Link2 className="size-4 shrink-0" {...ICON} aria-hidden />}
                <span className="shrink-0 text-mid">Source</span>
                <span className="truncate">{source.label}</span>
              </Link>
            ))}
            {message.actions?.map(action => (
              <Button
                key={action.to}
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (action.to !== pathname) navigate(action.to);
                  onNavigate?.();
                }}
              >
                {action.label} <ArrowRight className="size-4" {...ICON} />
              </Button>
            ))}
            {message.retry && (
              <Button variant="secondary" size="sm" onClick={() => brad.send(message.retry!, { pathname, deepSearch: false })}>
                <RotateCcw className="size-4" {...ICON} /> Try again
              </Button>
            )}
          </motion.div>
        ) : null}

        {!revealing && showChips && message.chips && (
          <div className="flex flex-col items-start gap-2 pt-1">
            {message.chips.map((chip, index) => (
              <motion.button
                key={chip}
                type="button"
                initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: DURATION.fast, ease: EASE, delay: reduce ? 0 : index * 0.06 }}
                onClick={() => brad.send(chip, { pathname, deepSearch: false })}
                disabled={brad.thinking}
                className={cn(
                  'press min-h-10 cursor-pointer rounded-full border border-silver bg-paper px-4 py-2 text-left text-ui text-ink transition-colors hover:bg-silver/40 disabled:cursor-not-allowed disabled:opacity-40',
                  focusRing
                )}
              >
                {chip}
              </motion.button>
            ))}
          </div>
        )}

        {!revealing && !message.error && (
          <div className="flex items-center gap-1 transition-opacity duration-200 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within/msg:opacity-100 [@media(hover:hover)]:group-hover/msg:opacity-100">
            <BradIconButton label={copied ? 'Copied' : 'Copy reply'} onClick={copy}>
              {copied ? <Check className="size-4" {...ICON} /> : <Copy className="size-4" {...ICON} />}
            </BradIconButton>
            <BradIconButton label="Good reply" aria-pressed={message.feedback === 'up'} onClick={() => brad.rate(message.id, 'up')} className={cn(message.feedback === 'up' && 'bg-silver/40 text-ink')}>
              <ThumbsUp className="size-4" {...ICON} />
            </BradIconButton>
            <BradIconButton label="Bad reply" aria-pressed={message.feedback === 'down'} onClick={() => brad.rate(message.id, 'down')} className={cn(message.feedback === 'down' && 'bg-silver/40 text-ink')}>
              <ThumbsDown className="size-4" {...ICON} />
            </BradIconButton>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Composer ────────────────────────────────────────────────────── */

function Composer({ variant, inputRef, onLayer }: { variant: Variant; inputRef: RefObject<HTMLTextAreaElement | null>; onLayer: (open: boolean) => void }) {
  const brad = useBrad();
  const { pathname } = useLocation();
  const [mode, setMode] = useState<'chat' | 'voice'>('chat');
  const [text, setText] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const [deep, setDeep] = useState(false);
  const [picker, setPicker] = useState(false);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const recognizer = useRef<SpeechRecognizer | null>(null);
  const typingTimer = useRef(0);
  const closePicker = useCallback(() => setPicker(false), []);
  useDismiss(pickerRef, picker, closePicker);
  useEffect(() => onLayer(picker), [picker, onLayer]);

  // Auto-grow up to 4 lines (line height 1.6 × 16px).
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [text, mode, inputRef]);

  useEffect(
    () => () => {
      window.clearTimeout(typingTimer.current);
      recognizer.current?.stop();
      brad.setUserTyping(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const onType = (value: string) => {
    setText(value.slice(0, MAX_CHARS));
    brad.setUserTyping(value.trim().length > 0);
    window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => brad.setUserTyping(false), 1500);
  };

  const canSend = (text.trim().length > 0 || files.length > 0) && !brad.thinking;
  const submit = () => {
    if (!canSend) return;
    brad.send(text, { pathname, deepSearch: deep, attachments: files });
    setText('');
    setFiles([]);
    inputRef.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  const insert = (symbol: string) => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    onType(text.slice(0, start) + symbol + text.slice(end));
    setPicker(false);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + symbol.length, start + symbol.length);
    });
  };

  const toggleListening = () => {
    if (!Speech) return;
    if (listening) {
      recognizer.current?.stop();
      return;
    }
    const rec = new Speech();
    rec.lang = navigator.language || 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    let final = '';
    rec.onresult = event => {
      const results = Array.from(event.results);
      final = results.filter(result => result.isFinal).map(result => result[0].transcript).join(' ');
      setHeard(results.map(result => result[0].transcript).join(' '));
    };
    rec.onerror = () => setHeard('I didn’t catch that. Try again.');
    rec.onend = () => {
      setListening(false);
      if (final.trim()) {
        brad.send(final, { pathname, deepSearch: deep });
        setHeard('');
      }
    };
    recognizer.current = rec;
    setHeard('');
    setListening(true);
    rec.start();
  };

  const remaining = MAX_CHARS - text.length;

  return (
    <div className={cn('shrink-0 border-t border-silver p-4', variant === 'mobile' && 'pb-[calc(16px+env(safe-area-inset-bottom))]')}>
      <div className="mb-3 flex justify-center">
        <ModeSwitch
          label="Input mode"
          value={mode}
          onChange={next => {
            if (next === 'chat') recognizer.current?.stop();
            setMode(next);
          }}
          items={[
            { id: 'chat', label: 'Chat' },
            { id: 'voice', label: 'Voice', disabled: !Speech, tip: 'Voice isn’t available in this browser.' }
          ]}
        />
      </div>

      <div className="rounded-item border border-silver bg-paper p-2 transition-colors focus-within:border-ink">
        {mode === 'chat' ? (
          <>
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 px-2 pt-1 pb-2">
                {files.map(name => (
                  <span key={name} className="flex max-w-full items-center gap-1 rounded-full border border-silver py-1 pr-1 pl-2 text-caption text-graphite">
                    <Paperclip className="size-4 shrink-0" {...ICON} aria-hidden />
                    <span className="truncate">{name}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${name}`}
                      onClick={() => setFiles(list => list.filter(item => item !== name))}
                      className={cn('flex size-6 cursor-pointer items-center justify-center rounded-full hover:bg-silver/40', focusRing)}
                    >
                      <X className="size-4" {...ICON} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <label htmlFor="brad-input" className="sr-only">
              Message Brad
            </label>
            <textarea
              id="brad-input"
              ref={inputRef}
              rows={1}
              value={text}
              maxLength={MAX_CHARS}
              onChange={event => onType(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Message Brad..."
              aria-describedby="brad-hint"
              className="block max-h-[6.4em] w-full resize-none bg-transparent px-2 pt-1 text-body leading-copy text-ink outline-none placeholder:text-mid"
            />
            <span id="brad-hint" className="sr-only">
              Enter sends, Shift and Enter adds a new line.
            </span>
          </>
        ) : (
          <div className="flex items-center gap-3 px-2 py-1">
            <button
              type="button"
              onClick={toggleListening}
              aria-pressed={listening}
              aria-label={listening ? 'Stop listening' : 'Start voice input'}
              className={cn('press flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full text-paper transition-colors', listening ? 'bg-graphite' : 'bg-ink hover:bg-graphite', focusRing)}
            >
              {listening ? <Square className="size-4" {...ICON} /> : <Mic className="size-5" {...ICON} />}
            </button>
            <ListeningBars active={listening} />
            <p className="min-w-0 flex-1 text-ui text-graphite" aria-live="polite">
              {heard || (listening ? 'Listening…' : 'Tap the mic and ask your question.')}
            </p>
          </div>
        )}

        <div className="mt-2 flex items-center gap-1">
          <input
            ref={fileRef}
            type="file"
            multiple
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={event => {
              const names = Array.from(event.target.files ?? []).map(file => file.name);
              setFiles(list => Array.from(new Set([...list, ...names])).slice(0, 4));
              event.target.value = '';
            }}
          />
          <BradIconButton label="Attach file" onClick={() => fileRef.current?.click()} disabled={mode === 'voice'}>
            <Paperclip className="size-4" {...ICON} />
          </BradIconButton>
          <div ref={pickerRef} className="relative">
            <BradIconButton label="Insert symbol" aria-haspopup="dialog" aria-expanded={picker} onClick={() => setPicker(value => !value)} disabled={mode === 'voice'}>
              <Smile className="size-4" {...ICON} />
            </BradIconButton>
            <AnimatePresence>
              {picker && (
                <motion.div
                  role="dialog"
                  aria-label="Insert symbol"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: DURATION.fast, ease: EASE } }}
                  transition={{ duration: DURATION.fast, ease: EASE }}
                  className="absolute bottom-full left-0 z-30 mb-2 grid origin-bottom-left grid-cols-6 gap-1 rounded-item border border-silver bg-paper p-2 shadow-lift"
                >
                  {SYMBOLS.map(symbol => (
                    <button
                      key={symbol}
                      type="button"
                      aria-label={`Insert ${symbol}`}
                      onClick={() => insert(symbol)}
                      className={cn('flex size-8 cursor-pointer items-center justify-center rounded-chip font-body text-ui text-ink hover:bg-silver/40', focusRing)}
                    >
                      {symbol}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            type="button"
            aria-pressed={deep}
            onClick={() => setDeep(value => !value)}
            className={cn(
              'press ml-1 flex h-8 cursor-pointer items-center gap-1 rounded-full border px-3 text-caption font-medium transition-colors',
              focusRing,
              deep ? 'border-ink bg-ink text-paper' : 'border-silver bg-paper text-ink hover:bg-silver/40'
            )}
          >
            <Search className="size-4" {...ICON} /> Deep search
          </button>
          <span className="ml-auto flex items-center gap-2">
            {mode === 'chat' && remaining <= MAX_CHARS - COUNTER_FROM && (
              <span className={cn('text-caption tabular-nums', remaining === 0 ? 'text-danger' : 'text-mid')} aria-live="polite">
                {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
              </span>
            )}
            {mode === 'chat' && (
              <BradIconButton
                label={brad.thinking ? 'Brad is replying' : 'Send message'}
                onClick={submit}
                disabled={!canSend}
                className="bg-ink text-paper hover:bg-graphite hover:text-paper disabled:bg-silver disabled:text-paper disabled:opacity-100"
              >
                <ArrowUp className="size-4" {...ICON} />
              </BradIconButton>
            )}
          </span>
        </div>
      </div>
      <p className="mt-2 text-center text-caption text-mid">Brad can make mistakes. Check important details.</p>
    </div>
  );
}
