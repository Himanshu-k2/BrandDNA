import { QUEUE, SUBMISSIONS } from '@/data/demo';

export type Period = 'day' | 'week' | 'month' | 'year';
export type View = 'creator' | 'reviewer' | 'brand_manager' | 'admin';

export const PERIODS: Array<{ id: Period; label: string; window: string; factor: number }> = [
  { id: 'day', label: 'Day', window: 'last 24 hours', factor: 1 / 7 },
  { id: 'week', label: 'Week', window: 'last 7 days', factor: 1 },
  { id: 'month', label: 'Month', window: 'last 30 days', factor: 4.3 },
  { id: 'year', label: 'Year', window: 'last 12 months', factor: 52 }
];

export interface Stat {
  label: string;
  /** Weekly baseline; scaled by the selected period unless `percent`. */
  value: number;
  previous: number;
  percent?: boolean;
  /** Accent emphasis: one orange hero and one dark card per dashboard; the rest stay white. */
  accent?: 'orange' | 'dark';
}

export const STATS: Record<View, Stat[]> = {
  creator: [
    { label: 'Drafts audited', value: 128, previous: 112 },
    { label: 'Submitted', value: 42, previous: 36 },
    { label: 'Approved', value: 31, previous: 27, accent: 'dark' },
    { label: 'First-pass rate', value: 78, previous: 81, percent: true, accent: 'orange' }
  ],
  reviewer: [
    { label: 'Reviews completed', value: 96, previous: 88 },
    { label: 'Approved & sealed', value: 74, previous: 65, accent: 'dark' },
    { label: 'Changes requested', value: 18, previous: 21 },
    { label: 'Approval rate', value: 77, previous: 74, percent: true, accent: 'orange' }
  ],
  brand_manager: [
    { label: 'Verified brand assets', value: 384, previous: 360 },
    { label: 'Turnaround velocity', value: 18, previous: 22 },
    { label: 'Active brand rules', value: 142, previous: 130, accent: 'dark' },
    { label: 'Brand health score', value: 94, previous: 90, percent: true, accent: 'orange' }
  ],
  admin: [
    { label: 'Assets audited', value: 212, previous: 190 },
    { label: 'Active creators', value: 18, previous: 16 },
    { label: 'Sign-offs completed', value: 96, previous: 88, accent: 'dark' },
    { label: 'Platform pass rate', value: 86, previous: 83, percent: true, accent: 'orange' }
  ]
};

export const scaleStat = (stat: Stat, period: Period) => {
  if (stat.percent) return { value: stat.value, previous: stat.previous };
  const factor = PERIODS.find(item => item.id === period)!.factor;
  return { value: Math.max(1, Math.round(stat.value * factor)), previous: Math.max(1, Math.round(stat.previous * factor)) };
};

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const SERIES = {
  'Last Year': { year: 2024, values: [880, 920, 1010, 905, 912, 960, 1005, 1080, 1287, 1060, 1120, 1210] },
  'This Year': { year: 2025, values: [1040, 1105, 1190, 1150, 1240, 1310, 1295, 1380, 1452, 1410, 1488, 1530] }
} as const;
export const CHART_MAX = 2000;

/** Deterministic daily volume for the month views: weekday rhythm + weekend dip. */
const daily = (base: number, seed: number) =>
  Array.from({ length: 30 }, (_, day) => {
    const weekend = day % 7 === 5 || day % 7 === 6;
    return Math.round(base + Math.sin((day + seed) * 0.9) * 6 + day * 0.3 - (weekend ? 18 : 0));
  });

export interface AuditRange {
  /** Tooltip label per bar. */
  labels: string[];
  /** Axis label per bar ('' hides it, for dense ranges). */
  axis: string[];
  values: readonly number[];
  compare: readonly number[];
  primaryLabel: string;
  secondaryLabel: string;
  max: number;
  ticks: number[];
  defaultIndex: number;
  /** "You gained +N audits …" */
  gained: { value: number; suffix: string };
  csvHeader: string;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEK = { now: [48, 52, 61, 57, 64, 38, 29], prev: [44, 49, 53, 55, 58, 35, 27] };
const MONTH = { now: daily(50, 0), prev: daily(44, 2) };
const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);
const yearRange = (key: keyof typeof SERIES): AuditRange => {
  const other = SERIES[key === 'This Year' ? 'Last Year' : 'This Year'];
  const { year, values } = SERIES[key];
  return {
    labels: MONTHS,
    axis: MONTHS,
    values,
    compare: other.values,
    primaryLabel: `${year} audits`,
    secondaryLabel: `${other.year} audits`,
    max: CHART_MAX,
    ticks: [2000, 1500, 1000, 500, 0],
    defaultIndex: 8,
    gained: { value: values[values.length - 1] - values[values.length - 2], suffix: 'this month' },
    csvHeader: `month ${year}`
  };
};

/** Audit volume ranges, in menu order. Each compares against the previous period (hatched). */
export const AUDIT_RANGES = {
  'This Week': {
    labels: DAYS,
    axis: DAYS,
    values: WEEK.now,
    compare: WEEK.prev,
    primaryLabel: 'This week',
    secondaryLabel: 'Last week',
    max: 80,
    ticks: [80, 60, 40, 20, 0],
    defaultIndex: DAYS.length - 1,
    gained: { value: sum(WEEK.now) - sum(WEEK.prev), suffix: 'more than last week' },
    csvHeader: 'day'
  },
  'This Month': {
    labels: MONTH.now.map((_, day) => `Day ${day + 1}`),
    axis: MONTH.now.map((_, day) => (day === 0 || (day + 1) % 5 === 0 ? String(day + 1) : '')),
    values: MONTH.now,
    compare: MONTH.prev,
    primaryLabel: 'This month',
    secondaryLabel: 'Last month',
    max: 80,
    ticks: [80, 60, 40, 20, 0],
    defaultIndex: MONTH.now.length - 1,
    gained: { value: sum(MONTH.now) - sum(MONTH.prev), suffix: 'more than last month' },
    csvHeader: 'day'
  },
  'This Year': yearRange('This Year'),
  'Last Year': yearRange('Last Year')
} satisfies Record<string, AuditRange>;
export type AuditRangeKey = keyof typeof AUDIT_RANGES;

/** Status counts for the "Reviews" card, derived from the seeded demo data. */
export function reviewCounts(view: View) {
  if (view === 'creator') {
    const count = (status: string) => SUBMISSIONS.filter(item => item.status === status).length;
    return [
      { label: 'Approved', value: count('approved') },
      { label: 'Awaiting sign-off', value: count('pending') },
      { label: 'Needs changes', value: count('needs_changes') }
    ];
  }
  const lane = (name: string) => QUEUE.filter(item => item.lane === name).length;
  if (view === 'admin') {
    return [
      { label: 'Awaiting sign-off', value: lane('urgent') },
      { label: 'Changes requested', value: lane('changes') },
      { label: 'Sealed today', value: lane('approved') }
    ];
  }
  if (view === 'brand_manager') {
    return [
      { label: 'Rule approvals pending', value: 6 },
      { label: 'Policy change requests', value: 4 },
      { label: 'Certified assets sealed', value: 18 }
    ];
  }
  return [
    { label: 'Urgent sign-offs', value: lane('urgent') },
    { label: 'Changes requested', value: lane('changes') },
    { label: 'Approved today', value: lane('approved') }
  ];
}

export const ACTIVITIES = [
  { initials: 'SC', name: 'Sarah Chen', action: 'approved Member Referral Landing Hero', time: '6 mins ago', to: '/reviews/rev-1049?tab=compare' },
  { initials: 'AR', name: 'Alex Rivera', action: 'submitted NovaFit Summer Membership Promo', time: '18 mins ago', to: '/reviews/rev-1049' },
  { initials: 'PN', name: 'Priya Nair', action: 'requested changes on Savings Account Rate Banner', time: '32 mins ago', to: '/reviews/rev-1049' },
  { initials: 'MV', name: 'Marcus Vance', action: 'sealed Wealth Desk Webinar Invite', time: '1 hr ago', to: '/reviews/rev-1049?tab=compare' }
];
