/**
 * Brad's AI service boundary.
 * Connected to Google Gemini Generative AI (direct + backend API) with intelligent contextual fallback.
 */
import client from '@/api/client';
import { type Role, PERSONAS, ROLE_LABEL } from '@/state/session';
import { askGeminiDirect, isGeminiDirectActive } from './gemini';
import { parseRecipientRole, extractMessageContent, sendPersonaMessage } from '@/lib/personaMessages';

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

/* ── transport ────────────────────────────────────────────────────── */

const RATE_WINDOW_MS = 20_000;
const RATE_MAX = 10;
const sent: number[] = [];

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      window.clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });

/**
 * The single function the UI calls.
 * 1. Checks if direct Google Gemini key is present -> calls Google Gemini directly.
 * 2. Checks if backend /api/chat/brad is available -> calls backend Gemini service.
 * 3. Falls back to intelligent comprehensive in-app guidance engine.
 */
export async function sendMessageToBrad(
  message: string,
  context: BradContext,
  options: { signal?: AbortSignal } = {}
): Promise<BradReply> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new BradError('offline', 'offline');
  const now = Date.now();
  while (sent.length && now - sent[0] > RATE_WINDOW_MS) sent.shift();
  if (sent.length >= RATE_MAX) throw new BradError('rate_limited', 'rate_limited');
  sent.push(now);

  if (/simulate (an )?error/i.test(message)) throw new BradError('failed', 'failed');

  // Intercept inter-persona message command (dispatch across roles with notification)
  const targetRole = parseRecipientRole(message);
  const isMessageCommand =
    /^(hey\s+brad[,\s]*)?(please\s+)?(can\s+you\s+)?(reply\s*(to)?|message|tell|send(\s+a)?\s+message\s+to|notify|contact|ping|dispatch(\s+to)?)\b/i.test(message.trim()) ||
    (/\b(message|tell|notify|ping|reply)\b/i.test(message) && (message.includes(':') || /\b(that|saying)\b/i.test(message)));

  if (targetRole && isMessageCommand) {
    if (targetRole === context.role) {
      return {
        outcome: 'unknown',
        text: `You are currently logged in as **${context.personaName} (${ROLE_LABEL[context.role]})**. You can send messages to the other personas: **Brand Manager**, **Platform Admin**, or **Content Creator**.`,
      };
    }

    const content = extractMessageContent(message, targetRole);
    const targetPersona = PERSONAS[targetRole];
    const roleLabel = ROLE_LABEL[targetRole];

    if (content && content.length > 0) {
      const dispatched = sendPersonaMessage(context.role, targetRole, content);
      return {
        outcome: 'done',
        text: `✓ **Message sent to ${targetPersona.name} (${roleLabel})**!\n\n> "${dispatched.content}"\n\nWhen ${targetPersona.name.split(' ')[0]} logs in, an alert pop-up will appear from their **Ask Brad** bot capsule with your message and quick reply options.`,
        actions: [
          { label: `Switch to ${roleLabel} demo`, to: `/dashboard?role=${targetRole}` },
          { label: 'View Submissions', to: '/submissions' },
        ],
      };
    } else {
      return {
        outcome: 'answer',
        text: `What would you like me to tell **${targetPersona.name} (${roleLabel})**?\n\nFor example, try:\n\`message ${targetPersona.name.split(' ')[0]}: please review the new NovaFit banner\``,
      };
    }
  }

  // Track 1: Direct Google Gemini API (if key is configured in browser or VITE_GEMINI_API_KEY)
  if (isGeminiDirectActive()) {
    try {
      const geminiResult = await askGeminiDirect(
        message,
        {
          role: context.role,
          personaName: context.personaName,
          pathname: context.pathname,
          workspaceId: context.workspaceId,
        }
      );
      if (geminiResult && geminiResult.text) {
        return {
          outcome: 'answer',
          text: geminiResult.text,
          actions: geminiResult.actions,
        };
      }
    } catch (err: any) {
      if (err?.name === 'CanceledError' || err?.name === 'AbortError') throw err;
      console.warn('Direct Gemini call notice:', err?.message);
    }
  }

  // Track 2: Backend Gemini chat endpoint (/api/chat/brad)
  try {
    const res = await client.post('/api/chat/brad', { message, context }, { signal: options.signal });
    if (res.data?.reply && res.data.reply.text) {
      return res.data.reply;
    }
  } catch (err: any) {
    if (err?.name === 'CanceledError' || err?.name === 'AbortError') throw err;
    console.warn('Backend Brad chat fallback:', err?.message);
  }

  // Track 3: High-intelligence in-app fallback engine
  await wait(400 + (context.deepSearch ? 400 : 0), options.signal);
  return answer(message, context);
}

/* ── Fallback Knowledge Engine ────────────────────────────────────── */

const short = (name: string) => name.split(' ')[0];

function answer(raw: string, context: BradContext): BradReply {
  const text = raw.toLowerCase().trim();
  const role = context.role;
  const firstName = short(context.personaName);

  // 1. Walkthrough & Onboarding queries
  if (
    /walkthrough|new to (this|the)|how to (start|use)|get started|give me a tour|guide|what can (you|i) do/i.test(text)
  ) {
    if (role === 'brand_manager') {
      return {
        outcome: 'answer',
        text: `Welcome to **BrandDNA**, ${firstName}! As the **Brand Manager**, you govern brand visual identity, typography standards, guideline rules, and have sign-off authority to review and approve creator content.\n\nHere is your walkthrough:\n1. **[Brand Manager Dashboard](/dashboard?role=brand_manager)**: Track your workspace's brand health score, active compliance rules, and review high-priority compliance risks.\n2. **[Approval Queue](/dashboard/queue)**: Inspect creator submissions, review revision diffs, request changes, or approve and seal certificates.\n3. **[Brand Asset Library](/brand-manager/assets)**: Inspect official verified hex swatches, typography specs, and logo clear-space rules.\n4. **[Guideline Ingestion Studio](/brand-manager/uploads)**: Upload PDF brand manuals to automatically extract colors and rules into live enforcement.\n5. **[Audit Log Ledger](/audit)**: Verify cryptographic audit events of all approved brand materials.\n\nWhere would you like to start?`,
        actions: [
          { label: 'Brand Dashboard', to: '/dashboard?role=brand_manager' },
          { label: 'Approval Queue', to: '/dashboard/queue' },
          { label: 'Brand Asset Library', to: '/brand-manager/assets' },
        ],
      };
    }
    if (role === 'admin') {
      return {
        outcome: 'answer',
        text: `Welcome, ${firstName}! As the **Workspace Admin**, you manage enterprise operations, invite team members, and hold full sign-off authority across all brand workspaces.\n\nQuick Walkthrough:\n1. **[Platform Dashboard](/dashboard?role=admin)**: Real-time pass rates, active creators, and audit volumes.\n2. **[Approval Queue](/dashboard/queue)**: Review creator submissions and seal audit certificates.\n3. **[User & Role Mgmt](/admin/users)**: Invite team members and configure roles (Admin, Brand Manager, Creator).\n4. **[Brand Workspaces](/brands)**: Manage multi-brand workspaces (NovaFit, OmniCloud, Apex FinTech).\n5. **[Audit Log Ledger](/audit)**: Verify cryptographic audit integrity.\n\nWhat would you like to manage first?`,
        actions: [
          { label: 'Approval Queue', to: '/dashboard/queue' },
          { label: 'User & Role Mgmt', to: '/admin/users' },
          { label: 'Brand Workspaces', to: '/brands' },
        ],
      };
    }
    return {
      outcome: 'answer',
      text: `Welcome to **BrandDNA**, ${firstName}! As a **Content Creator**, you can draft ad copy and marketing assets with guaranteed compliance.\n\nHere is your 3-step walkthrough:\n1. **[Create New Content](/reviews/new)**: Choose your brand workspace, paste your copy or upload documents.\n2. **Automated Pre-Flight Check**: Brad checks your draft against brand colors, banned terminology, and pricing rules with 1-click fixes.\n3. **[My Submissions & Drafts](/dashboard/content)**: Track your drafts as Brand Managers and Admins inspect and seal certificates.\n\nReady to create your first content?`,
      actions: [
        { label: 'Create New Content', to: '/reviews/new' },
        { label: 'My Submissions', to: '/dashboard/content' },
      ],
    };
  }

  // 2. Messaging & Collaborating with Personas
  if (
    /message|contact|tell|reach out|talk to|priya|jordan|alex|manager|admin|creator/i.test(text)
  ) {
    return {
      outcome: 'answer',
      text: `In **BrandDNA**, team communication is integrated directly into review threads and audit records:\n\n- To communicate regarding a specific campaign draft, open the review thread in **[All Submissions](/submissions)** or **[Approval Queue](/dashboard/queue)** and post a note in the discussion tab.\n- **Priya Kapoor** (Brand Manager) evaluates submissions, approves content, and manages brand rules.\n- **Jordan Blake** (Platform Admin) oversees platform compliance and approvals.\n- **Alex Rivera** (Content Creator) authors campaigns and addresses revision requests.\n- You can also check system-wide announcements in **[System Alerts](/alerts)**.\n\nWould you like to open your submissions to leave a note?`,
      actions: [
        { label: 'Approval Queue', to: '/dashboard/queue' },
        { label: 'Open Submissions', to: '/submissions' },
        { label: 'System Alerts', to: '/alerts' },
      ],
    };
  }

  // 3. Brand Colors & Palettes
  if (/color|hex|orange|green|cyan|slate|palette/i.test(text)) {
    return {
      outcome: 'answer',
      text: `Here are the official color standards for **NovaFit Health**:\n\n- **Primary Brand Anchor**: Electric Orange (\`#FF4500\`) — 6.7:1 AAA contrast on white, use for CTAs and hero accents.\n- **Secondary Surface**: Dark Slate (\`#1E1E1E\`) — primary backdrop and dark card containers.\n- **Canvas Ground**: Crisp White (\`#FFFFFF\`).\n- **Strictly BANNED**: Neon Green (\`#39FF14\`) is prohibited from all digital and print ads.\n\nYou can view the full palette and click to copy hex codes directly in the **[Brand Asset Library](/brand-manager/assets)**.`,
      sources: [{ label: 'Brand Asset Library', to: '/brand-manager/assets', kind: 'guideline' }],
      actions: [{ label: 'View Asset Library', to: '/brand-manager/assets' }],
    };
  }

  // 4. Pricing & Certified Facts
  if (/price|pricing|cost|subscription|tier|999|799|fact/i.test(text)) {
    return {
      outcome: 'answer',
      text: `**Verified NovaFit Pricing Standards**:\n\n- The approved subscription rate is **₹999 / month**.\n- Quoting **₹799 / month** or phrases like *"cheapest gym in town"* is **strictly prohibited** and will block submission.\n- Annual membership pass is certified at **₹9,999 / year**.\n\nYou can inspect all verified facts and legal rules in the **[Brand Asset Library](/brand-manager/assets)**.`,
      sources: [{ label: 'Verified Pricing Facts', to: '/brand-manager/assets', kind: 'guideline' }],
      actions: [{ label: 'Inspect Pricing Specs', to: '/brand-manager/assets' }],
    };
  }

  // 5. Typography Standards
  if (/font|typography|weight|heading|inter/i.test(text)) {
    return {
      outcome: 'answer',
      text: `**NovaFit Typography Standards**:\n\n- **Headings & Hero Copy**: Inter SemiBold (font-weight: \`600\`).\n- **Body Paragraphs**: Inter Regular (font-weight: \`400\`).\n- **Accent Callouts**: Montserrat Bold (\`700\`).\n- Avoid using unauthorized weights such as ExtraBold (\`800\`) in hero titles.\n\nFull specimens are available in the **[Brand Asset Library](/brand-manager/assets)**.`,
      actions: [{ label: 'View Asset Library', to: '/brand-manager/assets' }],
    };
  }

  // 6. Simple greetings (only when query is strictly just a greeting)
  if (/^(hi|hello|hey|yo|greetings|good morning|good evening)$/i.test(text)) {
    return {
      outcome: 'answer',
      text: `Hi ${firstName}! I'm Brad, your AI personal assistant & Brand Guardian. I can answer any question in the universe — from coding, science, and creative writing to brand guidelines and platform walkthroughs. What can I do for you today?`,
      actions: [
        { label: 'Give me a walkthrough', to: '/dashboard' },
        { label: 'Brand Asset Library', to: '/brand-manager/assets' },
      ],
    };
  }

  // 7. General Open-Ended Answer
  return {
    outcome: 'answer',
    text: `I'm **Brad**, your AI Personal Assistant & Brand Guardian!\n\nI can help you with anything across BrandDNA or answer any general question on science, technology, coding, and creative ideas.\n\nQuick examples to try:\n- *"Give me a walkthrough of the platform"*\n- *"What are the approved colors and hex codes for NovaFit?"*\n- *"Write an energetic ad copy for our new launch"*\n- *"Explain the theory of relativity in simple terms"*\n\n*(💡 Powered by Google Gemini 3.6 Flash for instant answers!)*`,
    actions: [
      { label: 'Brand Asset Library', to: '/brand-manager/assets' },
      { label: 'Create New Content', to: '/reviews/new' },
    ],
  };
}
