import { DISCLAIMER } from '@/lib/rules';

export const BRANDS = [
  { id: 'novafit', name: 'NovaFit Health', sector: 'Fitness & Wellness', initials: 'NF' },
  { id: 'omnicloud', name: 'OmniCloud', sector: 'B2B Cloud Software', initials: 'OC' },
  { id: 'apex', name: 'Apex FinTech', sector: 'Regulated Finance', initials: 'AX' }
] as const;

export type BrandId = (typeof BRANDS)[number]['id'];

export const REVIEW = {
  id: 'rev-1049',
  code: 'REV-1049',
  title: 'NovaFit Summer Membership Promo',
  breadcrumb: 'Summer Campaign Copy',
  brand: 'NovaFit Health',
  format: 'Social / Ad Copy',
  channel: 'Instagram Carousel',
  author: 'Alex Rivera',
  reviewer: 'Sarah Chen',
  submitted: 'Today, 14:32',
  v1: 'Welcome NovaFit users!\nOur premium membership is only ₹799 per month.\nSign up now for the cheapest gym in town.',
  v2: `Welcome NovaFit members!\nOur premium membership is only ₹999 per month.\nSign up now for the most affordable premium fitness community.\n${DISCLAIMER}`
};

export type SubmissionStatus = 'pending' | 'needs_changes' | 'approved' | 'draft';

export interface Submission {
  id: string;
  title: string;
  channel: string;
  brand: string;
  version: number;
  score: number;
  status: SubmissionStatus;
  reviewer: string;
  modified: string;
}

export const SUBMISSIONS: Submission[] = [
  { id: 's1', title: 'NovaFit Summer Membership Promo', channel: 'Social Post', brand: 'NovaFit', version: 2, score: 98, status: 'pending', reviewer: 'Sarah Chen', modified: '18 min ago' },
  { id: 's2', title: 'Quarterly Product Brochure', channel: 'PDF Document', brand: 'OmniCloud', version: 1, score: 38, status: 'needs_changes', reviewer: 'Sarah Chen', modified: '1 hr ago' },
  { id: 's3', title: 'Monsoon Bootcamp Launch Email', channel: 'Email Newsletter', brand: 'NovaFit', version: 3, score: 91, status: 'pending', reviewer: 'Priya Nair', modified: '2 hrs ago' },
  { id: 's4', title: 'Savings Account Rate Banner', channel: 'Display Banner', brand: 'Apex FinTech', version: 2, score: 64, status: 'needs_changes', reviewer: 'Sarah Chen', modified: '3 hrs ago' },
  { id: 's5', title: 'Member Referral Landing Hero', channel: 'Landing Page', brand: 'NovaFit', version: 2, score: 96, status: 'approved', reviewer: 'Sarah Chen', modified: 'Yesterday' },
  { id: 's6', title: 'Uptime SLA Announcement', channel: 'Blog Snippet', brand: 'OmniCloud', version: 1, score: 88, status: 'pending', reviewer: 'Priya Nair', modified: 'Yesterday' },
  { id: 's7', title: 'Personal Trainer Spotlight Reel', channel: 'Social Post', brand: 'NovaFit', version: 2, score: 97, status: 'approved', reviewer: 'Sarah Chen', modified: 'Yesterday' },
  { id: 's8', title: 'Credit Card Cashback Explainer', channel: 'Social Post', brand: 'Apex FinTech', version: 3, score: 57, status: 'needs_changes', reviewer: 'Marcus Vance', modified: '2 days ago' },
  { id: 's9', title: 'Nutrition Plan Upsell Email', channel: 'Email Newsletter', brand: 'NovaFit', version: 2, score: 95, status: 'approved', reviewer: 'Priya Nair', modified: '2 days ago' },
  { id: 's10', title: 'Data Residency FAQ', channel: 'Landing Page', brand: 'OmniCloud', version: 2, score: 99, status: 'approved', reviewer: 'Sarah Chen', modified: '3 days ago' },
  { id: 's11', title: 'Festive Season Offer Carousel', channel: 'Social Post', brand: 'NovaFit', version: 1, score: 93, status: 'approved', reviewer: 'Sarah Chen', modified: '4 days ago' },
  { id: 's12', title: 'Wealth Desk Webinar Invite', channel: 'Email Newsletter', brand: 'Apex FinTech', version: 2, score: 94, status: 'approved', reviewer: 'Marcus Vance', modified: '5 days ago' },
  { id: 's13', title: 'Kubernetes Migration Case Study', channel: 'PDF Document', brand: 'OmniCloud', version: 2, score: 92, status: 'approved', reviewer: 'Priya Nair', modified: '6 days ago' },
  { id: 's14', title: 'Yoga Studio Opening Banner', channel: 'Display Banner', brand: 'NovaFit', version: 2, score: 98, status: 'approved', reviewer: 'Sarah Chen', modified: '1 week ago' }
];

export type QueueLane = 'urgent' | 'changes' | 'approved';

export interface QueueItem {
  id: string;
  title: string;
  brand: string;
  channel: string;
  author: string;
  authorInitials: string;
  submitted: string;
  score: number;
  counts: { critical: number; high: number; medium: number };
  snippet: string;
  flags: string[];
  lane: QueueLane;
  due?: string;
  note?: string;
  certificate?: string;
}

export const QUEUE: QueueItem[] = [
  {
    id: 'q1',
    title: 'NovaFit Summer Membership Promo',
    brand: 'NovaFit Health',
    channel: 'Instagram Carousel',
    author: 'Alex Rivera',
    authorInitials: 'AR',
    submitted: '18 mins ago',
    score: 98,
    counts: { critical: 0, high: 1, medium: 1 },
    snippet: '',
    flags: [],
    lane: 'urgent',
    due: 'Due Fri 5:00 PM EST'
  },
  {
    id: 'q2',
    title: 'OmniCloud Partner Launch Email',
    brand: 'OmniCloud',
    channel: 'Email Newsletter',
    author: 'Lena Okafor',
    authorInitials: 'LO',
    submitted: '42 mins ago',
    score: 91,
    counts: { critical: 0, high: 0, medium: 2 },
    snippet: 'OmniCloud now offers the fastest multi-region failover, backed by a 99.99% uptime SLA.',
    flags: ['fastest', '99.99% uptime SLA'],
    lane: 'urgent',
    due: 'Due Fri 5:00 PM EST'
  },
  {
    id: 'q3',
    title: 'Savings Account Rate Banner',
    brand: 'Apex FinTech',
    channel: 'Display Banner',
    author: 'Marcus Vance',
    authorInitials: 'MV',
    submitted: '3 hrs ago',
    score: 64,
    counts: { critical: 1, high: 1, medium: 0 },
    snippet: 'Earn guaranteed 9% returns on every savings account, with zero risk.',
    flags: ['guaranteed 9% returns', 'zero risk'],
    lane: 'changes',
    note: 'Remove the guaranteed-return claim and add the APY disclosure line.'
  },
  {
    id: 'q4',
    title: 'Quarterly Product Brochure',
    brand: 'OmniCloud',
    channel: 'PDF Document',
    author: 'Alex Rivera',
    authorInitials: 'AR',
    submitted: '5 hrs ago',
    score: 38,
    counts: { critical: 1, high: 2, medium: 1 },
    snippet: 'Our customers save 70% on cloud bills compared to every other provider.',
    flags: ['customers', '70%'],
    lane: 'changes',
    note: 'Savings claim needs the Q2 benchmark citation; use "clients", not "customers".'
  },
  {
    id: 'q5',
    title: 'Credit Card Cashback Explainer',
    brand: 'Apex FinTech',
    channel: 'Social Post',
    author: 'Priya Nair',
    authorInitials: 'PN',
    submitted: 'Yesterday',
    score: 57,
    counts: { critical: 0, high: 2, medium: 1 },
    snippet: 'Unlimited 5% cashback on everything you buy. No conditions.',
    flags: ['Unlimited 5% cashback', 'No conditions'],
    lane: 'changes',
    note: 'Cashback is capped at ₹1,500/month. State the cap and link the T&Cs.'
  },
  {
    id: 'q6',
    title: 'Yoga Studio Opening Banner',
    brand: 'NovaFit Health',
    channel: 'Display Banner',
    author: 'Marcus Vance',
    authorInitials: 'MV',
    submitted: 'Yesterday',
    score: 72,
    counts: { critical: 0, high: 1, medium: 1 },
    snippet: 'The best yoga studio in Bengaluru opens Saturday for all users.',
    flags: ['The best', 'users'],
    lane: 'changes',
    note: 'Drop the unsubstantiated "best" claim and use "members".'
  },
  ...[
    ['Member Referral Landing Hero', 'NovaFit Health', 'Landing Page', 'Alex Rivera', 'AR', 96, 'CERT-8841'],
    ['Data Residency FAQ', 'OmniCloud', 'Landing Page', 'Priya Nair', 'PN', 99, 'CERT-8839'],
    ['Personal Trainer Spotlight Reel', 'NovaFit Health', 'Social Post', 'Alex Rivera', 'AR', 97, 'CERT-8836'],
    ['Wealth Desk Webinar Invite', 'Apex FinTech', 'Email Newsletter', 'Marcus Vance', 'MV', 94, 'CERT-8833'],
    ['Nutrition Plan Upsell Email', 'NovaFit Health', 'Email Newsletter', 'Priya Nair', 'PN', 95, 'CERT-8830'],
    ['Kubernetes Migration Case Study', 'OmniCloud', 'PDF Document', 'Alex Rivera', 'AR', 92, 'CERT-8827'],
    ['Festive Season Offer Carousel', 'NovaFit Health', 'Social Post', 'Marcus Vance', 'MV', 93, 'CERT-8824']
  ].map(
    ([title, brand, channel, author, initials, score, certificate], index): QueueItem => ({
      id: `a${index}`,
      title: String(title),
      brand: String(brand),
      channel: String(channel),
      author: String(author),
      authorInitials: String(initials),
      submitted: `Approved ${index + 1}h ago`,
      score: Number(score),
      counts: { critical: 0, high: 0, medium: 0 },
      snippet: '',
      flags: [],
      lane: 'approved',
      certificate: String(certificate)
    })
  )
];

export interface Comment {
  id: string;
  author: string;
  initials: string;
  role: string;
  time: string;
  body: string;
  anchor?: string;
}

export const COMMENTS: Comment[] = [
  {
    id: 'c1',
    author: 'Sarah Chen',
    initials: 'SC',
    role: 'Brand Reviewer',
    time: 'Today, 11:05',
    anchor: 'Line 2 · ₹799 per month',
    body: 'Finance moved Pro to ₹999 on 1 Oct. Please pull pricing from the fact database rather than the January PDF.'
  },
  {
    id: 'c2',
    author: 'Alex Rivera',
    initials: 'AR',
    role: 'Content Creator',
    time: 'Today, 11:22',
    anchor: 'Line 2 · ₹799 per month',
    body: 'Applied the ₹999 fix and added the physician disclaimer. Reframed the "cheapest gym" line to keep the premium tone.'
  },
  {
    id: 'c3',
    author: 'Sarah Chen',
    initials: 'SC',
    role: 'Brand Reviewer',
    time: 'Today, 14:40',
    body: 'v2 reads well. Checking the diff before sign-off.'
  }
];
