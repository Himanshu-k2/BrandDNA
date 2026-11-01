import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react';

/** Status tones. `neutral` stays fully grayscale; the rest use the muted status tokens. */
export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

/* Literal class strings so Tailwind can see every utility. */
export const TONE_SUBTLE: Record<Tone, string> = {
  neutral: 'border border-silver bg-paper text-ink',
  success: 'border border-success-line bg-success-tint text-success',
  warning: 'border border-warning-line bg-warning-tint text-warning',
  danger: 'border border-danger-line bg-danger-tint text-danger',
  info: 'border border-info-line bg-info-tint text-info'
};

export const TONE_STRONG: Record<Tone, string> = {
  neutral: 'border border-graphite bg-graphite text-paper',
  success: 'border border-success bg-success text-paper',
  warning: 'border border-warning bg-warning text-paper',
  danger: 'border border-danger bg-danger text-paper',
  info: 'border border-info bg-info text-paper'
};

export const TONE_TEXT: Record<Tone, string> = {
  neutral: 'text-graphite',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info'
};

export const TONE_ICON: Record<Tone, LucideIcon> = {
  neutral: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
  info: Info
};
