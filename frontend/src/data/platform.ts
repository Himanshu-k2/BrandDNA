import type { Role } from '@/state/session';

export type UserStatus = 'active' | 'invited' | 'suspended';

export interface WorkspaceUser {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: Role;
  brands: string[];
  lastActive: string;
  status: UserStatus;
}

export const USERS: WorkspaceUser[] = [
  { id: 'u1', name: 'Jordan Blake', initials: 'JB', email: 'admin@demobrands.test', role: 'admin', brands: ['All workspaces'], lastActive: 'Online now', status: 'active' },
  { id: 'u2', name: 'Priya Kapoor', initials: 'PK', email: 'brandmanager@branddna.com', role: 'brand_manager', brands: ['NovaFit', 'OmniCloud'], lastActive: 'Online now', status: 'active' },
  { id: 'u3', name: 'Alex Rivera', initials: 'AR', email: 'creator@demobrands.test', role: 'creator', brands: ['NovaFit', 'OmniCloud'], lastActive: 'Online now', status: 'active' },
  { id: 'u4', name: 'Priya Nair', initials: 'PN', email: 'priya@demobrands.test', role: 'brand_manager', brands: ['NovaFit', 'Apex FinTech'], lastActive: '1 hr ago', status: 'active' },
  { id: 'u5', name: 'Marcus Vance', initials: 'MV', email: 'marcus@demobrands.test', role: 'brand_manager', brands: ['Apex FinTech'], lastActive: 'Yesterday', status: 'active' },
  { id: 'u6', name: 'Lena Okafor', initials: 'LO', email: 'lena@demobrands.test', role: 'creator', brands: ['Apex FinTech'], lastActive: '2 days ago', status: 'active' },
  { id: 'u7', name: 'Diego Ramos', initials: 'DR', email: 'diego@demobrands.test', role: 'creator', brands: ['OmniCloud'], lastActive: 'Invite sent', status: 'invited' },
  { id: 'u8', name: 'Hannah Moore', initials: 'HM', email: 'hannah@demobrands.test', role: 'creator', brands: ['NovaFit'], lastActive: '3 weeks ago', status: 'suspended' }
];

export type AlertKind = 'review' | 'pricing' | 'guideline' | 'system' | 'sla';

export interface Alert {
  id: string;
  kind: AlertKind;
  title: string;
  body: string;
  time: string;
  urgent: boolean;
  to?: string;
  audience: Role[];
}

export const ALERTS: Alert[] = [
  { id: 'al1', kind: 'sla', title: '2 urgent sign-offs due Friday 5:00 PM EST', body: 'NovaFit Summer Membership Promo and OmniCloud Partner Launch Email are blocking launch.', time: '12 mins ago', urgent: true, to: '/dashboard/queue', audience: ['brand_manager', 'admin'] },
  { id: 'al2', kind: 'review', title: 'Changes requested on Quarterly Product Brochure', body: 'Priya Kapoor: savings claim needs the Q2 benchmark citation; use “clients”, not “customers”.', time: '1 hr ago', urgent: true, to: '/reviews/rev-1049', audience: ['creator'] },
  { id: 'al3', kind: 'pricing', title: 'NovaFit price sheet updated to ₹999/mo', body: 'Drafts still quoting ₹799 are now flagged as high-severity pricing violations.', time: '3 hrs ago', urgent: false, to: '/guidelines', audience: ['creator', 'brand_manager', 'admin'] },
  { id: 'al4', kind: 'review', title: 'Member Referral Landing Hero approved', body: 'Sealed as CERT-8841 by Priya Kapoor. The receipt is ready to download.', time: '5 hrs ago', urgent: false, to: '/reviews/rev-1049?tab=compare', audience: ['creator'] },
  { id: 'al5', kind: 'system', title: 'Gemini contextual checks degraded for 6 minutes', body: 'Deterministic rules stayed active; 3 drafts were audited in rule-only fallback mode.', time: 'Yesterday', urgent: false, audience: ['brand_manager', 'admin'] },
  { id: 'al6', kind: 'guideline', title: 'Apex FinTech added an APY disclosure rule', body: 'All savings and rate content must include the APY disclosure line.', time: 'Yesterday', urgent: false, to: '/guidelines', audience: ['creator', 'brand_manager', 'admin'] },
  { id: 'al7', kind: 'system', title: 'Diego Ramos has not accepted his invite', body: 'The OmniCloud creator invite expires in 2 days.', time: '2 days ago', urgent: false, to: '/admin/users', audience: ['admin'] }
];

export interface LedgerEntry {
  id: string;
  at: string;
  actor: string;
  role: Role | 'system';
  action: string;
  target: string;
  hash: string;
}

export const AUDIT_LOG: LedgerEntry[] = [
  { id: 'L-20931', at: 'Today 14:42', actor: 'Priya Kapoor', role: 'brand_manager', action: 'Approved & sealed', target: 'Member Referral Landing Hero · CERT-8841', hash: '9f2c…a71e' },
  { id: 'L-20930', at: 'Today 14:32', actor: 'Alex Rivera', role: 'creator', action: 'Submitted for sign-off', target: 'NovaFit Summer Membership Promo · v2', hash: '41bd…0c93' },
  { id: 'L-20929', at: 'Today 14:31', actor: 'BrandDNA engine', role: 'system', action: 'Deterministic audit', target: 'NovaFit Summer Membership Promo · 98/100', hash: 'c07e…5f12' },
  { id: 'L-20928', at: 'Today 11:05', actor: 'Priya Kapoor', role: 'brand_manager', action: 'Requested changes', target: 'Quarterly Product Brochure · v1', hash: '7aa1…e4d0' },
  { id: 'L-20927', at: 'Today 09:12', actor: 'Jordan Blake', role: 'admin', action: 'Updated approved fact', target: 'NovaFit · subscription_price → ₹999', hash: 'e5d3…28bb' },
  { id: 'L-20926', at: 'Yesterday 18:40', actor: 'BrandDNA engine', role: 'system', action: 'Fallback mode engaged', target: 'Gemini contextual checks · 6 min', hash: '0b6f…9a44' },
  { id: 'L-20925', at: 'Yesterday 16:03', actor: 'Jordan Blake', role: 'admin', action: 'Changed role', target: 'Priya Nair · Creator → Brand Manager', hash: '3c18…d7f5' },
  { id: 'L-20924', at: 'Yesterday 10:21', actor: 'Marcus Vance', role: 'brand_manager', action: 'Rejected', target: 'Credit Card Cashback Explainer · v2', hash: 'b9e2…1c08' },
  { id: 'L-20923', at: '2 days ago', actor: 'Jordan Blake', role: 'admin', action: 'Invited user', target: 'Diego Ramos · OmniCloud creator', hash: '6d47…f3a9' },
  { id: 'L-20922', at: '3 days ago', actor: 'Jordan Blake', role: 'admin', action: 'Added rule', target: 'Apex FinTech · APY disclosure', hash: 'f1a0…7be6' }
];

export const BRAND_STATS: Record<string, { assets: number; passRate: number; open: number; reviewers: string[]; rules: number; updated: string; voice: string }> = {
  novafit: { assets: 486, passRate: 91, open: 4, reviewers: ['Sarah Chen', 'Priya Nair'], rules: 24, updated: 'Price sheet updated today', voice: 'Premium, encouraging, never discount-led.' },
  omnicloud: { assets: 312, passRate: 87, open: 3, reviewers: ['Sarah Chen'], rules: 18, updated: 'SLA facts updated 4 days ago', voice: 'Precise, technical, evidence-backed.' },
  apex: { assets: 198, passRate: 78, open: 5, reviewers: ['Marcus Vance', 'Priya Nair'], rules: 31, updated: 'APY disclosure added yesterday', voice: 'Calm, regulated, zero guarantees.' }
};

export interface GuidelineSection {
  id: 'facts' | 'terms' | 'disclaimers' | 'tone';
  title: string;
  rows: Array<{ label: string; value: string; note: string; source: string }>;
}

export const GUIDELINES: GuidelineSection[] = [
  {
    id: 'facts',
    title: 'Approved facts',
    rows: [
      { label: 'Premium membership price', value: '₹999 per month', note: 'Replaces ₹799 from 1 Oct. Never quote annual-equivalent pricing.', source: 'Q1 Master Price Sheet' },
      { label: 'Studio locations', value: '42 studios in 9 cities', note: 'Update quarterly from the operations register.', source: 'Ops Register · Q3' },
      { label: 'Trial length', value: '7-day free trial', note: 'Only for new members; no card required.', source: 'Membership T&Cs §2.1' }
    ]
  },
  {
    id: 'terms',
    title: 'Terminology',
    rows: [
      { label: 'users', value: 'members', note: 'NovaFit has members, not users or customers.', source: 'Brand Lexicon v4' },
      { label: 'cheap / cheapest', value: 'accessible / most affordable premium', note: 'Never position the brand on lowest price.', source: 'Brand Lexicon v4' },
      { label: 'the best', value: 'Remove or substantiate', note: 'Superlatives need a cited third-party source.', source: 'Claims Policy §3' }
    ]
  },
  {
    id: 'disclaimers',
    title: 'Mandatory disclaimers',
    rows: [
      { label: 'Exercise content', value: 'Consult your physician before beginning any exercise routine.', note: 'Required on every fitness or programme claim.', source: 'Legal · Health Claims' },
      { label: 'Pricing content', value: 'Prices include GST. Terms apply.', note: 'Required wherever a price appears.', source: 'Legal · Pricing' }
    ]
  },
  {
    id: 'tone',
    title: 'Tone of voice',
    rows: [
      { label: 'Personality', value: 'Premium, encouraging, inclusive', note: 'Speak to progress, not perfection.', source: 'Voice Guide 2025' },
      { label: 'Avoid', value: 'Discount-led urgency, fear, body shaming', note: 'Flagged as medium severity by the tone check.', source: 'Voice Guide 2025' }
    ]
  }
];
