export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface BrandRule {
  id: string;
  title: string;
  tag: string;
  severity: Severity;
  source: string;
  weight: number;
  detectedLabel: string;
  expected: string;
  explanation: string;
  citation: string;
  actionLabel: string;
  resolvedLabel: string;
  /** Character ranges to highlight in the draft. */
  ranges: (text: string) => Array<[number, number]>;
  violated: (text: string) => boolean;
  apply: (text: string) => string;
}

export const DISCLAIMER = 'Consult your physician before beginning any exercise routine.';
export const BASE_SCORE = 42;
export const SUBMIT_THRESHOLD = 85;

function matchRanges(pattern: RegExp, text: string): Array<[number, number]> {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  return Array.from(text.matchAll(new RegExp(pattern.source, flags)), m => [m.index ?? 0, (m.index ?? 0) + m[0].length]);
}

const PRICE = /₹\s?799/;
const USERS = /\busers\b/i;
const CHEAP = /\bcheap(?:est)?\b(?: gym in town\.?)?/i;

export const NOVAFIT_RULES: BrandRule[] = [
  {
    id: 'pricing',
    title: 'Unapproved Pricing Figure',
    tag: 'Pricing',
    severity: 'high',
    source: 'Rule-Based',
    weight: 22,
    detectedLabel: '₹799',
    expected: '₹999',
    explanation: "Quoted price ₹799 contradicts active brand pricing fact 'subscription_price: ₹999'.",
    citation: 'Approved Fact: subscription_price [id: 6ae5ae…]',
    actionLabel: 'Apply Fix to Draft',
    resolvedLabel: 'Unapproved price ₹799 updated to approved ₹999',
    ranges: text => matchRanges(PRICE, text),
    violated: text => PRICE.test(text),
    apply: text => text.replace(new RegExp(PRICE.source, 'g'), '₹999')
  },
  {
    id: 'disclaimer',
    title: 'Mandatory Medical Disclaimer Missing',
    tag: 'Claims & Disclaimers',
    severity: 'high',
    source: 'Rule-Based',
    weight: 18,
    detectedLabel: 'Missing from content',
    expected: DISCLAIMER,
    explanation: 'All NovaFit fitness copy must close with the approved physician-consultation disclaimer.',
    citation: 'NovaFit Legal Copy Standards §4.2',
    actionLabel: 'Add Required Disclaimer',
    resolvedLabel: 'Required medical consultation disclaimer inserted',
    ranges: () => [],
    violated: text => text.trim().length > 0 && !text.includes(DISCLAIMER),
    apply: text => `${text.trimEnd()}\n${DISCLAIMER}`
  },
  {
    id: 'terminology',
    title: 'Prohibited Terminology',
    tag: 'Terminology',
    severity: 'medium',
    source: 'Rule-Based',
    weight: 8,
    detectedLabel: 'users',
    expected: 'members',
    explanation: 'NovaFit is a member community. "users" is on the prohibited lexicon; refer to people as "members".',
    citation: 'NovaFit Brand Identity Guide p. 14',
    actionLabel: 'Apply Fix to Draft',
    resolvedLabel: "Prohibited term 'users' replaced with 'members'",
    ranges: text => matchRanges(USERS, text),
    violated: text => USERS.test(text),
    apply: text => text.replace(/\busers\b/gi, 'members')
  },
  {
    id: 'tone',
    title: 'Off-Brand Value Language',
    tag: 'Tone & Lexicon',
    severity: 'medium',
    source: 'Rule-Based',
    weight: 8,
    detectedLabel: 'cheapest gym in town',
    expected: 'most affordable premium fitness community',
    explanation: '"Cheap" undermines NovaFit\'s premium positioning. Use value language that keeps the premium promise.',
    citation: 'NovaFit Tone of Voice: Value Language',
    actionLabel: 'Apply Fix to Draft',
    resolvedLabel: "'cheapest gym in town' reframed as premium value language",
    ranges: text => matchRanges(CHEAP, text),
    violated: text => CHEAP.test(text),
    apply: text =>
      text
        .replace(/the cheapest gym in town\.?/gi, 'the most affordable premium fitness community.')
        .replace(/\bcheapest\b/gi, 'most affordable')
        .replace(/\bcheap\b/gi, 'accessible')
  }
];

export function auditDraft(text: string) {
  const open = NOVAFIT_RULES.filter(rule => rule.violated(text));
  const resolved = NOVAFIT_RULES.filter(rule => !rule.violated(text));
  const score = text.trim() ? BASE_SCORE + resolved.reduce((sum, rule) => sum + rule.weight, 0) : 0;
  const openHigh = open.filter(rule => rule.severity === 'high' || rule.severity === 'critical').length;
  return { open, resolved, score, openHigh, canSubmit: score >= SUBMIT_THRESHOLD && openHigh === 0 };
}

export function scoreTone(score: number) {
  if (score >= SUBMIT_THRESHOLD) return 'ok' as const;
  if (score >= 60) return 'medium' as const;
  return 'critical' as const;
}
