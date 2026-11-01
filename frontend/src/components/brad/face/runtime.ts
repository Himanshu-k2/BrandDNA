/**
 * Shared runtime for every BradFace on the page: one rAF ticker, one pointer
 * listener and one inactivity timer, instead of one per face.
 */

type Tick = (now: number) => void;

const ticks = new Set<Tick>();
let frame = 0;

function loop(time: number) {
  const now = time / 1000;
  ticks.forEach(tick => tick(now));
  frame = ticks.size ? requestAnimationFrame(loop) : 0;
}

export function subscribeTick(tick: Tick) {
  ticks.add(tick);
  if (!frame) frame = requestAnimationFrame(loop);
  return () => {
    ticks.delete(tick);
  };
}

/* ── pointer ──────────────────────────────────────────────────────── */

/** Last known mouse/pen position; null for touch or when the pointer left the window. */
export const pointer: { current: { x: number; y: number } | null } = { current: null };
let pointerUsers = 0;

const onMove = (event: PointerEvent) => {
  if (event.pointerType === 'touch') return;
  pointer.current = { x: event.clientX, y: event.clientY };
};
const onLeave = () => {
  pointer.current = null;
};

export function retainPointer() {
  pointerUsers++;
  if (pointerUsers === 1) {
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
  }
  return () => {
    pointerUsers--;
    if (pointerUsers === 0) {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
    }
  };
}

/* ── inactivity → Sleepy ──────────────────────────────────────────── */

export const SLEEP_AFTER_MS = 60_000;
const ACTIVITY = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;

let asleep = false;
let timer = 0;
let idleUsers = 0;
const idleListeners = new Set<() => void>();

const setAsleep = (value: boolean) => {
  if (asleep === value) return;
  asleep = value;
  idleListeners.forEach(listener => listener());
};
const arm = () => {
  window.clearTimeout(timer);
  timer = window.setTimeout(() => setAsleep(true), SLEEP_AFTER_MS);
};
const onActivity = () => {
  setAsleep(false);
  arm();
};

export function subscribeIdle(listener: () => void) {
  idleListeners.add(listener);
  idleUsers++;
  if (idleUsers === 1) {
    ACTIVITY.forEach(type => window.addEventListener(type, onActivity, { passive: true, capture: true }));
    arm();
  }
  return () => {
    idleListeners.delete(listener);
    idleUsers--;
    if (idleUsers === 0) {
      ACTIVITY.forEach(type => window.removeEventListener(type, onActivity, { capture: true }));
      window.clearTimeout(timer);
      asleep = false;
    }
  };
}

export const getIdle = () => asleep;
