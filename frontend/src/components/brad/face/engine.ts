/**
 * Brad's face engine — a TypeScript port of the circle bot from
 * "bloub" by Jérémy Perret (https://github.com/jeremy-prt/bloub, MIT, commit b4bb3c1).
 * See ./LICENSE-bloub.txt and /THIRD_PARTY_NOTICES.md.
 *
 * Ported faithfully from `src/bot/{math,face,expressions,shape,engine}.ts`:
 * - the 16 rest expressions, value for value (ids translated from French);
 * - eyes painted on a sphere: each eye takes the sphere's tangent frame under a
 *   head orientation (yaw/pitch/roll), projected orthographically, then its own
 *   in-plane tilt (which is what allows mirrored tilts for angry/sad);
 * - capsule eye paths, the vertical-squash blink, the slow gaze drift;
 * - expression and gaze morphs as exponential ease-outs (easeOutQuint), never springs.
 *
 * Adapted for BrandDNA:
 * - only the circle body (`idle` + rest expressions); the narrative states
 *   (orbit, burst, notify…) and the customiser shapes are not used;
 * - blink cadence 3–6 s (was 1.9–4.6 s), cycled so it never runs out;
 * - expression morph 0.4 s (was 0.45 s) and it blends from the frame on screen
 *   when a change lands mid-morph (the repo's own fix for state changes);
 * - colours come from the BrandDNA palette (face Almost Black #070D0D, eyes #FFFFFF) in BradFace.
 */

/* ── math (bloub src/bot/math.ts) ─────────────────────────────────── */

export const TAU = Math.PI * 2;
export const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOutQuint = (t: number) => 1 - (1 - t) ** 5;
const r2 = (v: number) => Math.round(v * 100) / 100;

/** Periodic 1D noise: loops seamlessly over `period`. */
function loopNoise(t: number, period: number, seed = 0): number {
  const p = (t / period) * TAU;
  return 0.55 * Math.sin(p + seed) + 0.3 * Math.sin(2 * p + seed * 1.7 + 1.1) + 0.15 * Math.sin(3 * p + seed * 2.3 + 2.4);
}

/** Deterministic PRNG (mulberry32). */
function createRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── face (bloub src/bot/face.ts) ─────────────────────────────────── */

type Vec3 = [number, number, number];

/** Half eye spacing on the sphere, degrees (measured). */
export const EYE_SPLIT = 15.46;
/** Rest eye size, in ball-radius units (measured). */
export const EYE_W = 0.186;
export const EYE_H = 0.412;

export interface HeadGaze {
  /** degrees, positive = looks right */
  yaw: number;
  /** degrees, positive = looks up */
  pitch: number;
  /** degrees, head tilt */
  roll: number;
}

/** Rest head orientation fitted on the reference frames. */
export const REST_GAZE: HeadGaze = { yaw: 28.49, pitch: 28.62, roll: -13 };

interface EyePose {
  x: number;
  y: number;
  a: number;
  b: number;
  c: number;
  d: number;
  depth: number;
}

const deg = (d: number) => (d * Math.PI) / 180;

function spin(u: Vec3, v: Vec3, angle: number): [Vec3, Vec3] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [
    [u[0] * c + v[0] * s, u[1] * c + v[1] * s, u[2] * c + v[2] * s],
    [v[0] * c - u[0] * s, v[1] * c - u[1] * s, v[2] * c - u[2] * s]
  ];
}

/** Head frame then both eyes. Screen frame: x right, y down, z towards the viewer. */
function eyePoses(gaze: HeadGaze, scale: number, split = EYE_SPLIT): [EyePose, EyePose] {
  let f: Vec3 = [0, 0, 1];
  let right: Vec3 = [1, 0, 0];
  let down: Vec3 = [0, 1, 0];
  [f, right] = spin(f, right, deg(gaze.yaw));
  [down, f] = spin(down, f, deg(gaze.pitch));
  [right, down] = spin(right, down, deg(gaze.roll));
  const build = (side: number): EyePose => {
    const [ef, er] = spin(f, right, deg(split * side));
    return { x: ef[0] * scale, y: ef[1] * scale, a: er[0], b: er[1], c: down[0], d: down[1], depth: ef[2] };
  };
  return [build(-1), build(1)];
}

const BLINK_CYCLE = 900;
const BLINK_RNG = createRng(0x5eed);
/** Pre-drawn blink calendar: deterministic, stateless. 3–6 s apart, sometimes a double blink. */
const BLINKS: number[] = (() => {
  const out: number[] = [];
  let t = 1.4;
  while (t < BLINK_CYCLE) {
    out.push(t);
    t += 3 + BLINK_RNG() * 3;
    if (BLINK_RNG() < 0.18) {
      out.push(t);
      t += 0.24;
    }
  }
  return out;
})();

/** Measured: 1 to 2 frames at 10 fps. */
const BLINK_DUR = 0.18;

function blinkLid(time: number): number {
  const t = time % BLINK_CYCLE;
  for (const start of BLINKS) {
    if (t < start) break;
    const k = (t - start) / BLINK_DUR;
    // fast close, slightly slower reopen
    if (k >= 0 && k <= 1) return k < 0.45 ? 1 - k / 0.45 : (k - 0.45) / 0.55;
  }
  return 1;
}

interface Liveliness {
  dYaw: number;
  dPitch: number;
  dRoll: number;
  lid: number;
}

/** Rest life as offsets to add to the current pose: slow gaze drift + blinks. */
function liveliness(t: number, wander: number, blink: boolean): Liveliness {
  return {
    dYaw: (loopNoise(t, 11.3, 0.4) * 5.5 + loopNoise(t, 3.7, 2.1) * 1.6) * wander,
    dPitch: (loopNoise(t, 9.1, 1.3) * 4.2 + loopNoise(t, 4.3, 0.7) * 1.3) * wander,
    dRoll: loopNoise(t, 13.7, 3.2) * 2.2 * wander,
    lid: blink ? blinkLid(t) : 1
  };
}

/** The blink is a VERTICAL screen-space squash around the eye centre (measured). */
const blinkScale = (lid: number) => 0.06 + 0.94 * clamp(lid);

/* ── expressions (bloub src/bot/expressions.ts) ───────────────────── */

export type ExpressionId =
  | 'neutral'
  | 'attentive'
  | 'surprised'
  | 'excited'
  | 'happy'
  | 'laughing'
  | 'angry'
  | 'sad'
  | 'scared'
  | 'suspicious'
  | 'confused'
  | 'curious'
  | 'proud'
  | 'shy'
  | 'unimpressed'
  | 'sleepy';

interface EyeCfg {
  /** local width (capsule short axis), ball-radius units */
  w: number;
  /** local height (long axis) */
  h: number;
  /** in-plane tilt, degrees, positive = top leans right */
  tilt: number;
  /** 1 = open, 0 = closed */
  open: number;
}

interface Expression {
  id: ExpressionId;
  gaze: HeadGaze;
  split: number;
  eyes: [EyeCfg, EyeCfg];
}

const eye = (w: number, h: number, tilt = 0, open = 1): EyeCfg => ({ w, h, tilt, open });
/** Both eyes identical, mirrored tilts. */
const pair = (w: number, h: number, tilt = 0, open = 1): [EyeCfg, EyeCfg] => [eye(w, h, tilt, open), eye(w, h, -tilt, open)];

/** Values copied verbatim from bloub's EXPRESSIONS (neutre, attentif, surpris, …). */
export const EXPRESSIONS: Expression[] = [
  { id: 'neutral', gaze: { ...REST_GAZE }, split: EYE_SPLIT, eyes: [eye(EYE_W, EYE_H), eye(EYE_W, EYE_H)] },
  { id: 'attentive', gaze: { yaw: 4, pitch: 5, roll: -4 }, split: 16, eyes: pair(0.21, 0.44) },
  { id: 'surprised', gaze: { yaw: 3, pitch: -3, roll: 0 }, split: 19, eyes: pair(0.45, 0.47) },
  { id: 'excited', gaze: { yaw: 6, pitch: -14, roll: 0 }, split: 19.5, eyes: pair(0.4, 0.56, -10) },
  // squinted arcs: the tops converge slightly
  { id: 'happy', gaze: { yaw: 5, pitch: 9, roll: 0 }, split: 17, eyes: pair(0.27, 0.17, 14) },
  { id: 'laughing', gaze: { yaw: 4, pitch: 14, roll: 0 }, split: 18, eyes: pair(0.34, 0.13, 20) },
  // tops converge hard towards the centre + narrowed eyes
  { id: 'angry', gaze: { yaw: 3, pitch: 7, roll: 0 }, split: 17, eyes: pair(0.34, 0.15, 30) },
  // the reverse: tops diverge and the gaze drops
  { id: 'sad', gaze: { yaw: 3, pitch: -13, roll: 0 }, split: 16, eyes: pair(0.22, 0.4, -28) },
  { id: 'scared', gaze: { yaw: 2, pitch: -20, roll: 0 }, split: 20.5, eyes: pair(0.4, 0.6) },
  // one eye clearly more closed than the other
  { id: 'suspicious', gaze: { yaw: 12, pitch: 6, roll: -6 }, split: 16, eyes: [eye(0.21, 0.4), eye(0.22, 0.15)] },
  // asymmetric on both axes: sizes AND tilts mismatched
  { id: 'confused', gaze: { yaw: -14, pitch: 3, roll: 8 }, split: 16.5, eyes: [eye(0.2, 0.44, -18), eye(0.28, 0.17, 14)] },
  // the head leans: roll carries curiosity
  { id: 'curious', gaze: { yaw: 16, pitch: -9, roll: -15 }, split: 16.5, eyes: [eye(0.24, 0.46, -8), eye(0.2, 0.38, -8)] },
  { id: 'proud', gaze: { yaw: 5, pitch: 17, roll: 0 }, split: 17, eyes: pair(0.3, 0.15, 18) },
  { id: 'shy', gaze: { yaw: -19, pitch: -14, roll: -7 }, split: 14, eyes: pair(0.17, 0.3) },
  // horizontal slits, gaze off to the side
  { id: 'unimpressed', gaze: { yaw: -22, pitch: 2, roll: 0 }, split: 16, eyes: pair(0.3, 0.12) },
  // half-dropped lids, through `open` (same mechanism as the blink)
  { id: 'sleepy', gaze: { yaw: 6, pitch: -9, roll: -3 }, split: 16, eyes: pair(0.2, 0.42, 0, 0.42) }
];

const EXPRESSION_BY_ID = new Map(EXPRESSIONS.map(e => [e.id, e]));

const lerpEye = (a: EyeCfg, b: EyeCfg, t: number): EyeCfg => ({
  w: lerp(a.w, b.w, t),
  h: lerp(a.h, b.h, t),
  tilt: lerp(a.tilt, b.tilt, t),
  open: lerp(a.open, b.open, t)
});

function blendExpression(a: Expression, b: Expression, t: number): Expression {
  return {
    id: b.id,
    gaze: { yaw: lerp(a.gaze.yaw, b.gaze.yaw, t), pitch: lerp(a.gaze.pitch, b.gaze.pitch, t), roll: lerp(a.gaze.roll, b.gaze.roll, t) },
    split: lerp(a.split, b.split, t),
    eyes: [lerpEye(a.eyes[0], b.eyes[0], t), lerpEye(a.eyes[1], b.eyes[1], t)]
  };
}

/* ── capsule (bloub src/bot/shape.ts) ─────────────────────────────── */

function capsulePath(w: number, h: number): string {
  const hw = Math.max(w, 0.01) / 2;
  const hh = Math.max(h, 0.01) / 2;
  const r = Math.min(hw, hh);
  return (
    `M${r2(-hw)} ${r2(-hh + r)}` +
    `A${r2(r)} ${r2(r)} 0 0 1 ${r2(-hw + r)} ${r2(-hh)}` +
    `L${r2(hw - r)} ${r2(-hh)}` +
    `A${r2(r)} ${r2(r)} 0 0 1 ${r2(hw)} ${r2(-hh + r)}` +
    `L${r2(hw)} ${r2(hh - r)}` +
    `A${r2(r)} ${r2(r)} 0 0 1 ${r2(hw - r)} ${r2(hh)}` +
    `L${r2(-hw + r)} ${r2(hh)}` +
    `A${r2(r)} ${r2(r)} 0 0 1 ${r2(-hw)} ${r2(hh - r)}Z`
  );
}

/* ── engine (bloub src/bot/engine.ts, circle + rest expressions only) ── */

/**
 * Where the bot looks when something external drives it (the pointer, the
 * thinking scan). `yaw`/`pitch` are ABSOLUTE and replace the pose's as `mix`
 * rises; `wander` is what remains of the automatic drift.
 */
export interface Look {
  yaw: number;
  pitch: number;
  mix: number;
  wander: number;
}

export const NO_LOOK: Look = { yaw: 0, pitch: 0, mix: 0, wander: 1 };

/** Pointer-follow range (bloub src/ui/gaze.ts, chosen not measured). */
export const YAW_MAX = 16;
export const PITCH_MAX = 13;
export const FOLLOW_PITCH = 10;

export const EXPRESSION_MORPH = 0.4;
/** Gaze catch-up: shorter than the expression morph, so following feels attentive, not viscous. */
export const LOOK_MORPH = 0.24;

/** Ball radius in viewBox units. */
export const R = 100;

export interface RenderedEye {
  d: string;
  transform: string;
  opacity: number;
}

const lerpLook = (a: Look, b: Look, t: number): Look => ({
  yaw: lerp(a.yaw, b.yaw, t),
  pitch: lerp(a.pitch, b.pitch, t),
  mix: lerp(a.mix, b.mix, t),
  wander: lerp(a.wander, b.wander, t)
});

/** Clock-free: `sample(t)` is a pure function of time and the last targets. */
export class BradEngine {
  private expr: Expression;
  private exprPrev: Expression | null = null;
  private exprAt = -10;
  private exprMorph = EXPRESSION_MORPH;
  private look: Look = NO_LOOK;
  private lookPrev: Look = NO_LOOK;
  private lookAt = -10;
  private lookMorph = LOOK_MORPH;

  constructor(expression: ExpressionId) {
    this.expr = EXPRESSION_BY_ID.get(expression)!;
  }

  get expression() {
    return this.expr.id;
  }

  setExpression(id: ExpressionId, now: number, morph = EXPRESSION_MORPH) {
    const next = EXPRESSION_BY_ID.get(id);
    if (!next || next === this.expr) return;
    // Blend from what is on screen, so a change landing mid-morph never jumps.
    this.exprPrev = morph > 0 ? this.exprAtTime(now) : null;
    this.expr = next;
    this.exprAt = now;
    this.exprMorph = morph;
  }

  private exprAtTime(now: number): Expression {
    const from = this.exprPrev;
    if (!from || this.exprMorph <= 0) return this.expr;
    const k = (now - this.exprAt) / this.exprMorph;
    if (k >= 1) return this.expr;
    return blendExpression(from, this.expr, easeOutQuint(clamp(k)));
  }

  setLook(look: Look, now: number, morph = LOOK_MORPH) {
    if (!Number.isFinite(look.yaw + look.pitch + look.mix + look.wander)) return;
    this.lookPrev = this.lookAtTime(now);
    this.look = look;
    this.lookAt = now;
    this.lookMorph = morph;
  }

  get lookTarget() {
    return this.look;
  }

  private lookAtTime(now: number): Look {
    if (this.lookMorph <= 0) return this.look;
    const k = (now - this.lookAt) / this.lookMorph;
    if (k >= 1) return this.look;
    return lerpLook(this.lookPrev, this.look, easeOutQuint(clamp(k)));
  }

  /** `life` is the liveliness clock (offset per instance so faces never blink in sync). */
  sample(now: number, life: number, opts: { blink: boolean; wander: boolean }): RenderedEye[] {
    const pose = this.exprAtTime(now);
    const look = this.lookAtTime(now);
    const live = liveliness(life, opts.wander ? look.wander : 0, opts.blink);
    const gaze: HeadGaze = {
      yaw: lerp(pose.gaze.yaw, look.yaw, look.mix) + live.dYaw,
      pitch: lerp(pose.gaze.pitch, look.pitch, look.mix) + live.dPitch,
      // roll never follows anything: it is part of the expression's signature
      roll: pose.gaze.roll + live.dRoll
    };
    const poses = eyePoses(gaze, R, pose.split);
    const eyes: RenderedEye[] = [];
    for (let i = 0; i < 2; i++) {
      const e = poses[i];
      if (e.depth <= 0.02) continue;
      const cfg = pose.eyes[i];
      // own tilt composed with the tangent frame (Basis × Rot)
      const phi = (cfg.tilt * Math.PI) / 180;
      const cp = Math.cos(phi);
      const sp = Math.sin(phi);
      const ax = e.a * cp + e.c * sp;
      const ay = e.b * cp + e.d * sp;
      const cx2 = -e.a * sp + e.c * cp;
      const cy2 = -e.b * sp + e.d * cp;
      // the blink squashes vertically on screen, after everything else
      const k = blinkScale(Math.min(live.lid, cfg.open));
      eyes.push({
        d: capsulePath(cfg.w * R, cfg.h * R),
        transform: `matrix(${r2(ax)},${r2(ay * k)},${r2(cx2)},${r2(cy2 * k)},${r2(e.x)},${r2(e.y)})`,
        opacity: clamp(e.depth / 0.12)
      });
    }
    return eyes;
  }
}
