/**
 * Brad's AI service boundary.
 *
 * MOCKED: BrandDNA has no AI/API integration yet, so `sendMessageToBrad` answers
 * from the app's demo data with realistic latency. To connect a real backend,
 * replace the body of `sendMessageToBrad` (keep the signature, `BradReply` and
 * `BradError`), e.g. POST { message, context } to your endpoint and map the result.
 *
 * Scope guard: answers only use data from the user's CURRENT brand workspace and
 * only routes their role can open. Other brands' data is never returned.
 */
import client from '@/api/client';
import { NAV } from '@/components/mono/nav';
import { BRANDS, QUEUE, SUBMISSIONS } from '@/data/demo';
import { ALERTS, AUDIT_LOG, BRAND_STATS, GUIDELINES, USERS } from '@/data/platform';
import { DISCLAIMER } from '@/lib/rules';
import { ROLE_LABEL, type Role } from '@/state/session';

export interface BradContext {
  role: Role;
  personaName: string;
  personaEmail: string;
  pathname: string;
  workspaceId: string;
  deepSearch: boolean;
}

export interface BradSource {
  label: string;
  to: string;
  kind: 'guideline' | 'submission';
}

export interface BradAction {
  label: string;
  to: string;
}

export interface BradReply {
  /** Light markdown: paragraphs, "- " / "1. " lists, **bold**, `code`, [label](/route). */
  text: string;
  /** answer = normal reply, done = task completed (Brad looks proud), unknown = couldn't find it. */
  outcome: 'answer' | 'done' | 'unknown';
  sources?: BradSource[];
  actions?: BradAction[];
}

export type BradErrorKind = 'offline' | 'rate_limited' | 'failed';

export class BradError extends Error {
  constructor(
    readonly kind: BradErrorKind,
    message: string
  ) {
    super(message);
  }
}

/* ── mock transport ───────────────────────────────────────────────── */

const RATE_WINDOW_MS = 20_000;
const RATE_MAX = 6;
const sent: number[] = [];

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      window.clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });

/** The single function the UI calls. Connects to backend Gemini endpoint with fallback. */
export async function sendMessageToBrad(message: string, context: BradContext, options: { signal?: AbortSignal } = {}): Promise<BradReply> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new BradError('offline', 'offline');
  const now = Date.now();
  while (sent.length && now - sent[0] > RATE_WINDOW_MS) sent.shift();
  if (sent.length >= RATE_MAX) throw new BradError('rate_limited', 'rate_limited');
  sent.push(now);

  if (/simulate (an )?error/i.test(message)) throw new BradError('failed', 'failed');

  try {
    const res = await client.post('/api/chat/brad', { message, context }, { signal: options.signal });
    if (res.data?.reply) {
      return res.data.reply;
    }
  } catch (err: any) {
    if (err?.name === 'CanceledError' || err?.name === 'AbortError') throw err;
    console.warn('Backend Brad chat fallback:', err?.message);
  }

  await wait(600 + (context.deepSearch ? 600 : 0), options.signal);
  return answer(message, context);
}

/* ── mock brain ───────────────────────────────────────────────────── */

const short = (name: string) => name.split(' ')[0];

function access(context: BradContext) {
  const user = USERS.find(item => item.email === context.personaEmail);
  const all = !user || user.brands.includes('All workspaces');
  return BRANDS.filter(brand => all || user.brands.some(name => short(name) === short(brand.name)));
}

const has = (text: string, ...patterns: RegExp[]) => patterns.some(pattern => pattern.test(text));

const PAGE_HELP: Array<[RegExp, string]> = [
  [/^\/dashboard\/content/, 'your submissions and drafts. Filter by status, then open any row to continue editing or view its certificate'],
  [/^\/dashboard\/queue/, 'the approval queue. Urgent items sit in the first lane; open one to compare versions and sign off'],
  [/^\/dashboard/, 'your dashboard: an overview of compliance scores, recent reviews and activity'],
  [/^\/reviews\/new/, 'the New Content form. Pick a brand and content type, paste or upload your draft, then run the brand audit'],
  [/^\/reviews\//, 'the review studio. Findings are on the right; apply fixes, compare versions, and submit or sign off'],
  [/^\/submissions/, 'All Submissions: every asset in the workspace with its score, status and reviewer'],
  [/^\/brands/, 'Brand Workspaces: each brand’s pass rate, open items, reviewers and voice'],
  [/^\/(alerts|notifications)/, 'your alerts. Urgent items are marked; open one to jump to the related page'],
  [/^\/admin\/users/, 'User & Role Management: invite people, change roles and suspend access'],
  [/^\/audit/, 'the Audit Log Ledger: a tamper-evident history of every decision, with hashes'],
  [/^\/guidelines/, 'the Brand Guidelines Hub: approved facts, terminology, disclaimers and tone'],
  [/^\/settings/, 'Settings: profile, notifications and sessions']
];

function answer(raw: string, context: BradContext): BradReply {
  const text = raw.toLowerCase();
  const brands = access(context);
  const workspace = BRANDS.find(brand => brand.id === context.workspaceId) ?? BRANDS[0];
  const ws = short(workspace.name);
  const nav = NAV[context.role];
  const can = (to: string) => nav.some(item => item.to === to || item.to.startsWith(to));
  const deep = context.deepSearch ? `\n\n_Deep search: checked ${BRAND_STATS[workspace.id]?.rules ?? 0} rules and ${SUBMISSIONS.filter(item => short(item.brand) === ws).length} submissions in ${workspace.name}._` : '';

  // ── privacy guard ──
  if (!brands.some(brand => brand.id === workspace.id)) {
    return {
      outcome: 'answer',
      text: `You don’t have access to **${workspace.name}** data, so I can’t answer about it. Switch to one of your workspaces (${brands.map(brand => brand.name).join(', ')}) from the sidebar, or ask a Platform Admin for access.`
    };
  }
  const other = BRANDS.find(brand => brand.id !== workspace.id && text.includes(short(brand.name).toLowerCase()));
  if (other) {
    const allowed = brands.some(brand => brand.id === other.id);
    return {
      outcome: 'answer',
      text: allowed
        ? `I keep answers scoped to your current workspace, **${workspace.name}**. Switch to **${other.name}** from the workspace menu in the sidebar and ask me again.`
        : `I can’t share anything about **${other.name}**: it’s outside your workspaces. I can help with ${brands.map(brand => brand.name).join(' or ')}.`
    };
  }

  // ── small talk ──
  if (has(text, /^(hi|hello|hey)\b/)) return { outcome: 'answer', text: `Hi ${short(context.personaName)}! Ask me about ${workspace.name} guidelines, submission status, findings, or where to find something.` };
  if (has(text, /\b(thanks|thank you|cheers)\b/)) return { outcome: 'done', text: 'Happy to help. I’m here whenever you need me.' };

  // ── check content ──
  if (has(text, /check (my )?content|brand rules|audit (my|a) draft|run (an |the )?audit/)) {
    if (context.role !== 'creator') {
      return {
        outcome: 'answer',
        text: `Audits run when a creator submits a draft. As a ${ROLE_LABEL[context.role]}, you can open any item in the queue to see its deterministic findings.`,
        actions: [{ label: 'Open approval queue', to: context.role === 'reviewer' ? '/dashboard?role=reviewer' : '/dashboard/queue' }]
      };
    }
    return {
      outcome: 'answer',
      text: `Paste or upload your draft in **New Content** and I’ll run the ${workspace.name} rules on it. The most common blockers are:\n- Off-sheet prices (NovaFit is \`₹999 per month\`)\n- Banned terms such as “cheapest” or “users”\n- Missing mandatory disclaimers\n\nYou need **85/100** with no high-severity issues to submit.${deep}`,
      actions: [{ label: 'Open New Content', to: '/reviews/new' }],
      sources: [{ label: `${ws} guidelines`, to: '/guidelines', kind: 'guideline' }]
    };
  }

  // ── rejected / changes requested ──
  if (has(text, /reject|changes requested|needs changes|why (was|is) my|explain (a|my) (rejected|submission)/)) {
    const items = SUBMISSIONS.filter(item => short(item.brand) === ws && item.status === 'needs_changes');
    const list = items.length
      ? items.map(item => `- **${item.title}** · ${item.score}/100 · reviewer ${item.reviewer}`).join('\n')
      : `- No ${ws} submissions currently need changes.`;
    return {
      outcome: 'answer',
      text: `Here’s what needs changes in **${workspace.name}**:\n${list}\n\nA submission is sent back when it has a high-severity finding or scores under 85. In the NovaFit example, v1 quoted \`₹799\` instead of \`₹999\`, said “users” instead of “members”, and was missing: _${DISCLAIMER}_${deep}`,
      sources: [{ label: 'REV-1049 · NovaFit Summer Promo', to: '/reviews/rev-1049', kind: 'submission' }],
      actions: [{ label: context.role === 'creator' ? 'Open my submissions' : 'Open all submissions', to: context.role === 'creator' ? '/dashboard/content' : '/submissions' }]
    };
  }

  // ── compliance finding ──
  if (has(text, /finding|violation|severity|compliance/)) {
    return {
      outcome: 'answer',
      text: `Every finding comes from a deterministic rule checked against approved ${workspace.name} data:\n1. **Severity**: critical and high block submission; medium and low lower the score.\n2. **Detected vs. expected**: the exact phrase and the approved replacement.\n3. **Source**: the guideline row it comes from.\n\nApply the suggested fix in the studio to clear it, or ask a reviewer if you think the rule doesn’t apply.${deep}`,
      sources: [{ label: `${ws} guidelines · Terminology`, to: '/guidelines', kind: 'guideline' }]
    };
  }

  // ── sign-off summary / urgent ──
  if (has(text, /sign-?off|urgent|queue|pending review|needs? (my )?approval/)) {
    if (context.role === 'creator') {
      return {
        outcome: 'answer',
        text: 'Sign-off is done by reviewers, and authors can’t approve their own work. I can show you the status of your submissions instead.',
        actions: [{ label: 'Open my submissions', to: '/dashboard/content' }]
      };
    }
    const items = QUEUE.filter(item => item.brand === workspace.name && item.lane !== 'approved');
    const urgent = items.filter(item => item.lane === 'urgent');
    const focus = has(text, /urgent/) ? urgent : items;
    return {
      outcome: focus.length ? 'answer' : 'done',
      text: focus.length
        ? `**${focus.length}** ${has(text, /urgent/) ? 'urgent ' : ''}item${focus.length === 1 ? '' : 's'} in ${workspace.name} need sign-off:\n${focus.map(item => `- **${item.title}** · ${item.score}/100${item.due ? ` · ${item.due}` : ''}`).join('\n')}${deep}`
        : `All caught up! Nothing in ${workspace.name} is waiting for sign-off.`,
      actions: [{ label: 'Open approval queue', to: context.role === 'reviewer' ? '/dashboard?role=reviewer' : '/dashboard/queue' }]
    };
  }

  // ── alerts ──
  if (has(text, /alert|notification/)) {
    const items = ALERTS.filter(alert => alert.audience.includes(context.role)).slice(0, 4);
    const to = context.role === 'creator' ? '/notifications' : '/alerts';
    return {
      outcome: 'answer',
      text: `Latest ${context.role === 'creator' ? 'notifications' : 'system alerts'}:\n${items.map(alert => `- ${alert.urgent ? '**Urgent** · ' : ''}${alert.title} (${alert.time})`).join('\n')}`,
      actions: [{ label: context.role === 'creator' ? 'Open notifications' : 'Open system alerts', to }]
    };
  }

  // ── audit ──
  if (has(text, /audit (event|log|ledger)|ledger|recent (event|decision)/)) {
    if (!can('/audit')) return { outcome: 'answer', text: 'The Audit Log Ledger is limited to Platform Admins. Your own submission history is on your submissions page.' };
    const entry = AUDIT_LOG.find(item => item.target.includes(ws)) ?? AUDIT_LOG[0];
    return {
      outcome: 'answer',
      text: `The most recent ${ws} event: **${entry.action}** by ${entry.actor} (${entry.at}) on _${entry.target}_. Its hash \`${entry.hash}\` chains to the previous entry, so any edit to history would break the chain.`,
      actions: [{ label: 'Open audit ledger', to: '/audit' }]
    };
  }

  // ── roles ──
  if (has(text, /role|permission|invite|access|suspend/)) {
    if (context.role !== 'admin') {
      return {
        outcome: 'answer',
        text: `You’re a **${ROLE_LABEL[context.role]}**. Roles are managed by Platform Admins. Remember: authors can never approve their own submissions; another authorised reviewer must sign off.`
      };
    }
    return {
      outcome: 'answer',
      text: 'In **User & Role Mgmt** you can:\n- Invite a user and pick their role\n- Change a role from the row’s role menu (you can’t change your own)\n- Suspend or reactivate access from the row menu\n\nEvery change is written to the audit ledger.',
      actions: [{ label: 'Open User & Role Mgmt', to: '/admin/users' }]
    };
  }

  // ── guidelines ──
  if (has(text, /guideline|price|pricing|disclaimer|terminology|tone|voice|term\b|word/)) {
    const voice = BRAND_STATS[workspace.id]?.voice;
    const rows = workspace.id === 'novafit' ? GUIDELINES.flatMap(section => section.rows.map(row => ({ ...row, section: section.title }))) : [];
    const hit = rows.find(row => text.includes(row.label.toLowerCase().split(' ')[0]) || has(text, new RegExp(row.section.split(' ')[0].toLowerCase())));
    const to = can('/guidelines') ? '/guidelines' : '/brands';
    return {
      outcome: 'answer',
      text: hit
        ? `**${hit.label}** → ${hit.value}\n\n${hit.note} _(${hit.source})_${deep}`
        : `${workspace.name} voice: _${voice}_\n\nThe hub covers approved facts, terminology, mandatory disclaimers and tone. Ask me about a specific one, e.g. “What’s the membership price?”${deep}`,
      sources: [{ label: `${ws} guidelines${hit ? ` · ${hit.section}` : ''}`, to, kind: 'guideline' }]
    };
  }

  // ── this page ──
  if (has(text, /this page|where am i|what can i do here|how do i use/)) {
    const help = PAGE_HELP.find(([pattern]) => pattern.test(context.pathname));
    return { outcome: 'answer', text: help ? `You’re on ${help[1]}.` : 'This page is part of BrandDNA. Use the sidebar to move between sections.' };
  }

  // ── navigation ──
  if (has(text, /where|find|open|go to|how do i get/)) {
    const words = text.replace(/[^a-z\s&]/g, ' ').split(/\s+/).filter(word => word.length > 3);
    const item = nav.find(entry => words.some(word => entry.label.toLowerCase().includes(word)));
    if (item) return { outcome: 'answer', text: `**${item.label}** is in the sidebar.`, actions: [{ label: `Open ${item.label}`, to: item.to }] };
    if (has(text, /setting/)) return { outcome: 'answer', text: 'Settings are under your user card at the bottom of the sidebar.', actions: [{ label: 'Open Settings', to: '/settings' }] };
  }

  return {
    outcome: 'unknown',
    text: `I couldn’t find an answer to that in ${workspace.name}. I can help with brand guidelines, submission status, compliance findings and finding your way around BrandDNA.`
  };
}
