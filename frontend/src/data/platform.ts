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
  { id: 'al3', kind: 'pricing', title: 'NovaFit price sheet updated to ₹999/mo', body: 'Drafts still quoting ₹799 are now flagged as high-severity pricing violations.', time: '3 hrs ago', urgent: false, to: '/guidelines?brand=novafit', audience: ['creator', 'brand_manager', 'admin'] },
  { id: 'al4', kind: 'review', title: 'Member Referral Landing Hero approved', body: 'Sealed as CERT-8841 by Priya Kapoor. The receipt is ready to download.', time: '5 hrs ago', urgent: false, to: '/reviews/rev-1049?tab=compare', audience: ['creator'] },
  { id: 'al5', kind: 'system', title: 'Gemini contextual checks degraded for 6 minutes', body: 'Deterministic rules stayed active; 3 drafts were audited in rule-only fallback mode.', time: 'Yesterday', urgent: false, audience: ['brand_manager', 'admin'] },
  { id: 'al6', kind: 'guideline', title: 'Apex FinTech added an APY disclosure rule', body: 'All savings and rate content must include the APY disclosure line.', time: 'Yesterday', urgent: false, to: '/guidelines?brand=apex', audience: ['creator', 'brand_manager', 'admin'] },
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
  greenbasket: {
  "assets": 150,
  "passRate": 92,
  "open": 2,
  "reviewers": [
    "Sarah Chen"
  ],
  "rules": 15,
  "updated": "Active",
  "voice": "Friendly and environmentally conscious"
},
  finwise: {
  "assets": 150,
  "passRate": 92,
  "open": 2,
  "reviewers": [
    "Sarah Chen"
  ],
  "rules": 15,
  "updated": "Active",
  "voice": "Clear and responsible"
},
  travelnest: {
  "assets": 150,
  "passRate": 92,
  "open": 2,
  "reviewers": [
    "Sarah Chen"
  ],
  "rules": 15,
  "updated": "Active",
  "voice": "Welcoming and inspiring"
},
  pureglow: {
  "assets": 150,
  "passRate": 92,
  "open": 2,
  "reviewers": [
    "Sarah Chen"
  ],
  "rules": 15,
  "updated": "Active",
  "voice": "Calm and informative"
},
  byteforge: {
  "assets": 150,
  "passRate": 92,
  "open": 2,
  "reviewers": [
    "Sarah Chen"
  ],
  "rules": 15,
  "updated": "Active",
  "voice": "Technical and direct"
},
  eduspark: {
  "assets": 150,
  "passRate": 92,
  "open": 2,
  "reviewers": [
    "Sarah Chen"
  ],
  "rules": 15,
  "updated": "Active",
  "voice": "Encouraging and accessible"
},
  freshbite: {
  "assets": 150,
  "passRate": 92,
  "open": 2,
  "reviewers": [
    "Sarah Chen"
  ],
  "rules": 15,
  "updated": "Active",
  "voice": "Fresh and friendly"
},
  homeease: {
  "assets": 150,
  "passRate": 92,
  "open": 2,
  "reviewers": [
    "Sarah Chen"
  ],
  "rules": 15,
  "updated": "Active",
  "voice": "Reassuring and practical"
},
  ecodrive: {
  "assets": 150,
  "passRate": 92,
  "open": 2,
  "reviewers": [
    "Sarah Chen"
  ],
  "rules": 15,
  "updated": "Active",
  "voice": "Innovative and factual"
},
  apex: { assets: 198, passRate: 78, open: 5, reviewers: ['Marcus Vance', 'Priya Nair'], rules: 31, updated: 'APY disclosure added yesterday', voice: 'Calm, regulated, zero guarantees.' }
};

export interface GuidelineSection {
  id: 'facts' | 'terms' | 'disclaimers' | 'tone';
  title: string;
  rows: Array<{ label: string; value: string; note: string; source: string }>;
}

export interface BrandGuidelineConfig {
  brandId: string;
  brandName: string;
  brandSector: string;
  brandInitials: string;
  voice: string;
  updated: string;
  accentColor: string;
  sections: GuidelineSection[];
}

export const BRAND_GUIDELINES: Record<string, BrandGuidelineConfig> = {
  novafit: {
    brandId: 'novafit',
    brandName: 'NovaFit Health',
    brandSector: 'Fitness & Wellness',
    brandInitials: 'NF',
    voice: 'Premium, encouraging, never discount-led.',
    updated: 'Price sheet updated today',
    accentColor: '#FF5500',
    sections: [
      {
        id: 'facts',
        title: 'Approved facts',
        rows: [
          { label: 'Premium membership price', value: '₹999 per month', note: 'Replaces ₹799 from 1 Oct. Never quote annual-equivalent pricing.', source: 'Q1 Master Price Sheet' },
          { label: 'Studio locations', value: '42 studios in 9 cities', note: 'Update quarterly from the operations register.', source: 'Ops Register · Q3' },
          { label: 'Trial length', value: '7-day free trial', note: 'Only for new members; no credit card required.', source: 'Membership T&Cs §2.1' },
          { label: 'Annual pass', value: '₹9,999 per year', note: 'Includes 2 certified guest passes per quarter.', source: 'Certified Tier Specs' }
        ]
      },
      {
        id: 'terms',
        title: 'Terminology',
        rows: [
          { label: 'users / customers', value: 'members', note: 'NovaFit has members, not users or customers.', source: 'Brand Lexicon v4' },
          { label: 'cheap / cheapest', value: 'accessible / most affordable premium', note: 'Never position the brand on lowest price.', source: 'Brand Lexicon v4' },
          { label: 'the best gym', value: 'Remove or substantiate', note: 'Superlatives need a cited independent audit source.', source: 'Claims Policy §3' },
          { label: 'lose weight fast', value: 'build sustainable fitness habits', note: 'Focus on health and empowerment, avoid toxic diet culture.', source: 'Health & Tone Guide' }
        ]
      },
      {
        id: 'disclaimers',
        title: 'Mandatory disclaimers',
        rows: [
          { label: 'Exercise content', value: 'Consult your physician before beginning any exercise routine.', note: 'Required on every fitness or programme claim.', source: 'Legal · Health Claims' },
          { label: 'Pricing content', value: 'Prices include GST. Terms and conditions apply.', note: 'Required wherever a price appears.', source: 'Legal · Pricing' },
          { label: 'Nutrition guidance', value: 'Nutritional guidance is advisory only and does not substitute medical diagnosis.', note: 'Required for any meal or supplement content.', source: 'Medical Compliance §2' }
        ]
      },
      {
        id: 'tone',
        title: 'Tone of voice',
        rows: [
          { label: 'Personality', value: 'Premium, encouraging, inclusive', note: 'Speak to progress, not perfection.', source: 'Voice Guide 2026' },
          { label: 'Prohibited style', value: 'Discount-led urgency, fear, body shaming', note: 'Flagged as high compliance severity.', source: 'Voice Guide 2026' }
        ]
      }
    ]
  },
  omnicloud: {
    brandId: 'omnicloud',
    brandName: 'OmniCloud',
    brandSector: 'B2B Cloud Software',
    brandInitials: 'OC',
    voice: 'Precise, technical, evidence-backed.',
    updated: 'SLA facts updated 4 days ago',
    accentColor: '#00E5FF',
    sections: [
      {
        id: 'facts',
        title: 'Approved facts',
        rows: [
          { label: 'Enterprise tier baseline SLA', value: '₹24,99,000 baseline SLA', note: 'Replaces legacy ₹19,99,000 tier; backed by 99.99% multi-region uptime.', source: 'Enterprise Matrix v2' },
          { label: 'Global edge regions', value: '14 regions across 6 continents', note: 'Verified ISO 27001 & SOC 2 certified cloud infrastructure.', source: 'Infrastructure Ops 2026' },
          { label: 'Automated failover RTO', value: '< 15 seconds multi-region failover', note: 'Consensus-backed automated DNS state synchronization.', source: 'SRE Architecture Spec' },
          { label: 'Support response guarantee', value: '< 15 min P0 response time', note: 'Includes dedicated technical account manager for enterprise contracts.', source: 'Premier Support SLA' }
        ]
      },
      {
        id: 'terms',
        title: 'Terminology',
        rows: [
          { label: 'server downtime', value: 'failover transition', note: 'Never use unmitigated downtime in customer-facing communication.', source: 'OmniCloud Lexicon' },
          { label: 'buggy / glitch', value: 'transient telemetry anomaly', note: 'Describe system behavior with rigorous technical precision.', source: 'Communications Guide §2' },
          { label: 'unlimited storage', value: 'elastic high-throughput object store', note: 'Never claim unlimited without specifying tiered quota parameters.', source: 'Cloud Policy §4' },
          { label: 'hack-proof security', value: 'hardware-isolated zero-trust architecture', note: 'Absolute security claims violate standard RFC guidelines.', source: 'Security Standard §1' }
        ]
      },
      {
        id: 'disclaimers',
        title: 'Mandatory disclaimers',
        rows: [
          { label: 'Performance benchmarks', value: 'Benchmarked on standard c7g.4xlarge nodes with 10Gbps link. Individual throughput varies by network geography.', note: 'Required on all benchmark slides and graphics.', source: 'Legal · Infrastructure' },
          { label: 'Uptime financial credit', value: 'SLA credits subject to enterprise master service agreement terms.', note: 'Mandatory on contract availability and pricing claims.', source: 'Legal · Enterprise SLA' }
        ]
      },
      {
        id: 'tone',
        title: 'Tone of voice',
        rows: [
          { label: 'Engineering authority', value: 'Precise, technical, benchmark-grounded', note: 'Avoid emotional hype; speak in verifiable telemetry metrics.', source: 'DevRel Voice 2026' },
          { label: 'Error accountability', value: 'Direct, honest post-mortem transparency', note: 'Own incidents with timestamped root-cause analysis.', source: 'Trust & Safety' }
        ]
      }
    ]
  },
  apex: {
    brandId: 'apex',
    brandName: 'Apex FinTech',
    brandSector: 'Regulated Finance',
    brandInitials: 'AX',
    voice: 'Calm, regulated, zero guarantees.',
    updated: 'APY disclosure added yesterday',
    accentColor: '#0A2540',
    sections: [
      {
        id: 'facts',
        title: 'Approved facts',
        rows: [
          { label: 'High-Yield Savings yield', value: '6.8% APY certified', note: 'Variable annual percentage yield, compounded monthly.', source: 'Treasury Rate Sheet 2026' },
          { label: 'Regulatory deposit insurance', value: 'DICGC insured up to ₹5,00,000 per depositor', note: 'Mandatory banking certification disclosure.', source: 'Regulatory Compliance Q1' },
          { label: 'Maintenance fees', value: '₹0 annual fees on verified balances', note: 'Requires monthly active direct deposit or ₹10,000 minimum balance.', source: 'Product Fee Schedule' },
          { label: 'Settlement turnaround', value: 'T+0 automated ledger clearance', note: 'Zero settlement delay on certified equity transfers.', source: 'Trading Ops Guide' }
        ]
      },
      {
        id: 'terms',
        title: 'Terminology',
        rows: [
          { label: 'guaranteed profits / 100% safe', value: 'regulated yield with risk disclosure', note: 'Never use "guaranteed" or "zero risk" under financial regulation.', source: 'FINRA/SEBI Policy §1' },
          { label: 'fast cash', value: 'instant automated liquidity', note: 'Frame services around institutional stability, not impulsive credit.', source: 'Apex Brand Lexicon' },
          { label: 'get rich quick', value: 'systematic wealth accumulation', note: 'Focus on disciplined compounding and prudent asset allocation.', source: 'Compliance Standard §3' },
          { label: 'free money', value: 'promotional introductory referral credit', note: 'Never characterize bonus incentives as unconditional free money.', source: 'Legal Advertising §2' }
        ]
      },
      {
        id: 'disclaimers',
        title: 'Mandatory disclaimers',
        rows: [
          { label: 'Yield rate disclaimer', value: 'APY is accurate as of current cycle and subject to change without notice. Terms and conditions apply.', note: 'Mandatory on every interest rate display.', source: 'Banking Legal §4.2' },
          { label: 'Investment risk statutory notice', value: 'Securities investments are subject to market risks. Read all scheme related documents carefully before investing.', note: 'Statutory regulatory line; cannot be omitted.', source: 'Regulatory Compliance Notice' }
        ]
      },
      {
        id: 'tone',
        title: 'Tone of voice',
        rows: [
          { label: 'Institutional prudence', value: 'Calm, fiduciary, transparent, measured', note: 'Zero exclamation points. Treat customer wealth with gravity.', source: 'Financial Voice Guide' },
          { label: 'Risk parity', value: 'Equal prominence for risk disclosures and benefits', note: 'Disclaimers must never be de-emphasized or hidden.', source: 'Transparency Directive' }
        ]
      }
    ]
  }
};

export const GUIDELINES: GuidelineSection[] = BRAND_GUIDELINES.novafit.sections;
