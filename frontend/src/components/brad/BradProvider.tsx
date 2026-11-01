import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useSession, type Role, ROLE_LABEL } from '@/state/session';
import type { ExpressionId } from './face/BradFace';
import { BradError, sendMessageToBrad, type BradErrorKind, type BradReply } from './service';
import { useActiveWorkspace } from './workspace';
import { getUnreadMessagesForRole, markMessageAsRead, type PersonaDispatchMessage } from '@/lib/personaMessages';

export interface BradMessage {
  id: string;
  from: 'brad' | 'user';
  text: string;
  at: Date;
  /** Brad replies reveal word by word once; restored conversations render instantly. */
  reveal?: boolean;
  sources?: BradReply['sources'];
  actions?: BradReply['actions'];
  chips?: string[];
  error?: BradErrorKind;
  /** User text to resend from the inline retry button. */
  retry?: string;
  feedback?: 'up' | 'down';
  attachments?: string[];
}

export const SUGGESTIONS: Record<Role, string[]> = {
  creator: ['Check my content against brand rules', 'Explain a rejected submission', 'Find a brand guideline'],
  reviewer: ['Summarize what needs sign-off', 'Explain a compliance finding', 'Show urgent reviews'],
  brand_manager: ['Show approved brand colors and hex values', 'Review ingested guidelines', 'Audit logo clear-space rules'],
  admin: ['Show system alerts', 'Explain a recent audit event', 'Help with roles and permissions']
};

const ERROR_COPY: Record<BradErrorKind, string> = {
  offline: 'You seem to be offline, so I can’t reach the BrandDNA service. Check your connection and try again.',
  rate_limited: 'You’re sending messages faster than I can keep up. Give me a few seconds, then retry.',
  failed: 'Something went wrong on my side and I couldn’t answer that. Want to try again?'
};

/** ms per word for the reveal; the intro waits for it before the follow-up message. */
export const WORD_MS = 35;
const revealMs = (text: string) => text.split(/\s+/).length * WORD_MS;

interface BradValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  messages: BradMessage[];
  /** Brad is composing a reply (typing indicator + attentive scan). */
  thinking: boolean;
  expression: ExpressionId;
  scanning: boolean;
  setHover: (value: boolean) => void;
  setUserTyping: (value: boolean) => void;
  flash: (expression: ExpressionId, ms?: number) => void;
  send: (text: string, context: { pathname: string; deepSearch: boolean; attachments?: string[] }) => void;
  markRevealed: (id: string) => void;
  rate: (id: string, value: 'up' | 'down') => void;
  clear: () => void;
  askFeedback: () => void;
  playIntro: () => void;
  introPlayed: boolean;
  nudgeDone: boolean;
  setNudgeDone: () => void;
  /** Brad has something new: never opened this session, or replies arrived while closed. */
  unread: boolean;
  openWithPersonaMessage: (msg: PersonaDispatchMessage) => void;
}

const BradContext = createContext<BradValue | null>(null);

let seq = 0;
const uid = () => `m${Date.now().toString(36)}${(seq++).toString(36)}`;

/**
 * Session-only conversation state (in memory, never localStorage). Lives above the
 * router so it survives navigation; resets when the persona changes, because answers
 * are scoped to the current role.
 */
export function BradProvider({ children }: { children: ReactNode }) {
  const { persona } = useSession();
  const workspaceId = useActiveWorkspace();
  const [open, setOpenState] = useState(false);
  const [messages, setMessages] = useState<BradMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const [introPlayed, setIntroPlayed] = useState(false);
  const [nudgeDone, setNudge] = useState(false);
  const [hover, setHover] = useState(false);
  const [userTyping, setUserTyping] = useState(false);
  const [mood, setMood] = useState<ExpressionId | null>(null);
  const moodTimer = useRef(0);
  const timers = useRef<number[]>([]);
  const feedbackPending = useRef(false);
  const abort = useRef<AbortController | null>(null);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const flash = useCallback((expression: ExpressionId, ms = 1600) => {
    window.clearTimeout(moodTimer.current);
    setMood(expression);
    moodTimer.current = window.setTimeout(() => setMood(null), ms);
  }, []);

  const push = (message: Omit<BradMessage, 'id' | 'at'>) => setMessages(list => [...list, { ...message, id: uid(), at: new Date() }]);

  const playIntro = useCallback(() => {
    setIntroPlayed(true);
    flash('happy', 2400);
    setThinking(true);
    const first = 'Hi, I’m Brad. Need any help?';
    later(() => {
      setThinking(false);
      push({ from: 'brad', text: first, reveal: true });
      later(() => push({ from: 'brad', text: 'Here are a few things I can help with right now.', reveal: true, chips: SUGGESTIONS[persona.role] }), revealMs(first) + 400);
    }, 600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona.role, flash]);

  const reset = useCallback(() => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    abort.current?.abort();
    feedbackPending.current = false;
    setThinking(false);
    setMessages([]);
  }, []);

  // New persona → new conversation (answers are role-scoped).
  const firstRole = useRef(persona.role);
  useEffect(() => {
    if (firstRole.current === persona.role) return;
    firstRole.current = persona.role;
    reset();
    setIntroPlayed(false);
  }, [persona.role, reset]);

  useEffect(
    () => () => {
      timers.current.forEach(window.clearTimeout);
      window.clearTimeout(moodTimer.current);
    },
    []
  );

  const send: BradValue['send'] = (raw, { pathname, deepSearch, attachments }) => {
    const text = raw.trim();
    if (!text && !attachments?.length) return;
    // drop the retry affordance from earlier failures once a new message goes out
    setMessages(list => list.map(message => (message.retry ? { ...message, retry: undefined } : message)));
    push({ from: 'user', text, attachments });
    setUserTyping(false);

    if (feedbackPending.current) {
      feedbackPending.current = false;
      later(() => {
        push({ from: 'brad', text: 'Thank you. I’ve passed that on to the BrandDNA team.', reveal: true });
        flash('proud', 1400);
      }, 500);
      return;
    }

    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setThinking(true);
    const message = attachments?.length ? `${text} (attached: ${attachments.join(', ')})` : text;
    sendMessageToBrad(message, { role: persona.role, personaName: persona.name, personaEmail: persona.email, pathname, workspaceId, deepSearch }, { signal: controller.signal })
      .then(reply => {
        push({ from: 'brad', text: reply.text, reveal: true, sources: reply.sources, actions: reply.actions });
        if (reply.outcome === 'unknown') flash('confused', 2600);
        else flash(reply.outcome === 'done' ? 'excited' : 'proud', 1400);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        const kind: BradErrorKind = error instanceof BradError ? error.kind : 'failed';
        push({ from: 'brad', text: ERROR_COPY[kind], reveal: true, error: kind, retry: text });
        flash(kind === 'rate_limited' ? 'confused' : 'sad', 2600);
      })
      .finally(() => {
        if (abort.current === controller) {
          abort.current = null;
          setThinking(false);
        }
      });
  };

  const markRevealed = useCallback((id: string) => setMessages(list => list.map(message => (message.id === id ? { ...message, reveal: false } : message))), []);

  const rate = (id: string, value: 'up' | 'down') => {
    setMessages(list => list.map(message => (message.id === id ? { ...message, feedback: message.feedback === value ? undefined : value } : message)));
    if (value === 'down') flash('unimpressed', 1600);
  };

  const clear = () => {
    reset();
    playIntro();
  };

  const askFeedback = () => {
    feedbackPending.current = true;
    push({ from: 'brad', text: 'What could I do better? Your next message goes to the BrandDNA team as feedback.', reveal: true });
    flash('attentive', 1400);
  };

  const [hasUnreadPersonaMsg, setHasUnreadPersonaMsg] = useState(false);

  useEffect(() => {
    const check = () => {
      setHasUnreadPersonaMsg(getUnreadMessagesForRole(persona.role).length > 0);
    };
    check();
    window.addEventListener('branddna:persona_message', check);
    return () => window.removeEventListener('branddna:persona_message', check);
  }, [persona.role]);

  const openWithPersonaMessage = useCallback(
    (msg: PersonaDispatchMessage) => {
      markMessageAsRead(msg.id);
      setHasUnreadPersonaMsg(getUnreadMessagesForRole(persona.role).length > 0);
      setOpenState(true);
      setIntroPlayed(true);
      push({
        from: 'brad',
        text: `📬 **Message from ${msg.fromName} (${ROLE_LABEL[msg.fromRole]})**:\n\n> "${msg.content}"\n\nWould you like me to send a reply back to ${msg.fromName.split(' ')[0]}? Click a suggested response below or type your reply.`,
        chips: [
          `Reply to ${msg.fromName.split(' ')[0]}: "Got it, reviewing now!"`,
          `Reply to ${msg.fromName.split(' ')[0]}: "Approved! Looks ready to publish."`,
          `Reply to ${msg.fromName.split(' ')[0]}: "Please check the latest revision."`,
        ],
        reveal: true,
      });
      flash('excited', 1800);
    },
    [persona.role, flash]
  );

  // If chat opens normally while unread persona messages exist, deliver them into the conversation
  useEffect(() => {
    if (open) {
      const unreadList = getUnreadMessagesForRole(persona.role);
      if (unreadList.length > 0) {
        setIntroPlayed(true);
        unreadList.forEach(msg => {
          push({
            from: 'brad',
            text: `📬 **Message from ${msg.fromName} (${ROLE_LABEL[msg.fromRole]})**:\n\n> "${msg.content}"\n\nWould you like me to send a reply back to ${msg.fromName.split(' ')[0]}? Click a suggested response below or type your reply.`,
            chips: [
              `Reply to ${msg.fromName.split(' ')[0]}: "Got it, reviewing now!"`,
              `Reply to ${msg.fromName.split(' ')[0]}: "Approved! Looks ready to publish."`,
              `Reply to ${msg.fromName.split(' ')[0]}: "Please check the latest revision."`,
            ],
            reveal: true,
          });
          markMessageAsRead(msg.id);
        });
        setHasUnreadPersonaMsg(false);
        flash('excited', 1800);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, persona.role, flash]);

  const bradCount = messages.filter(message => message.from === 'brad').length;
  const [seen, setSeen] = useState(0);
  useEffect(() => {
    if (open) setSeen(bradCount);
  }, [open, bradCount]);
  const unread = !open && (!introPlayed || bradCount > seen || hasUnreadPersonaMsg);

  const expression: ExpressionId = mood ?? (thinking ? 'attentive' : userTyping ? 'curious' : hover ? 'attentive' : 'neutral');

  const value: BradValue = {
    open,
    setOpen: (next: boolean) => {
      setOpenState(next);
      if (next) setNudge(true);
    },
    messages,
    thinking,
    expression,
    scanning: thinking && !mood,
    setHover,
    setUserTyping,
    flash,
    send,
    markRevealed,
    rate,
    clear,
    askFeedback,
    playIntro,
    introPlayed,
    nudgeDone,
    setNudgeDone: () => setNudge(true),
    unread,
    openWithPersonaMessage,
  };

  return <BradContext.Provider value={value}>{children}</BradContext.Provider>;
}

export function useBrad() {
  const value = useContext(BradContext);
  if (!value) throw new Error('useBrad must be used inside BradProvider');
  return value;
}
