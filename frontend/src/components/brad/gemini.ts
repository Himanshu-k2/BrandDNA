/**
 * Direct Google Gemini API Client for Brad Chatbot.
 * Connects to Google's Generative Language API directly in the browser or via backend.
 */

const GEMINI_STORAGE_KEY = 'branddna_gemini_api_key';
const GEMINI_MODEL_KEY = 'branddna_gemini_model';

export function getStoredGeminiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(GEMINI_STORAGE_KEY) || import.meta.env.VITE_GEMINI_API_KEY || '';
}

export function setStoredGeminiKey(key: string): void {
  if (typeof window === 'undefined') return;
  const clean = key.trim();
  if (clean) {
    localStorage.setItem(GEMINI_STORAGE_KEY, clean);
  } else {
    localStorage.removeItem(GEMINI_STORAGE_KEY);
  }
}

export function getStoredGeminiModel(): string {
  if (typeof window === 'undefined') return 'gemini-3.8-flash';
  return localStorage.getItem(GEMINI_MODEL_KEY) || import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.8-flash';
}

export function setStoredGeminiModel(model: string): void {
  if (typeof window === 'undefined') return;
  const clean = model.trim();
  if (clean) {
    localStorage.setItem(GEMINI_MODEL_KEY, clean);
  } else {
    localStorage.removeItem(GEMINI_MODEL_KEY);
  }
}

export function isGeminiDirectActive(): boolean {
  return Boolean(getStoredGeminiKey());
}

const SYSTEM_INSTRUCTION = `You are Brad, the official AI Brand Guardian, walkthrough guide, and interactive assistant for the BrandDNA platform.
You answer ANY question the user asks with deep intelligence, friendly wit, precision, and helpfulness, exactly like Google Gemini.

Key Personas in BrandDNA:
- Priya Kapoor (Brand Manager): Governs brand asset libraries (/brand-manager/assets), uploads & ingests brand manuals via Guideline Ingestion Studio (/brand-manager/uploads), reviews compliance risks and rule violations.
- Sarah Chen (Brand Reviewer): Oversees Approval Queue (/dashboard/queue), compares version diffs, requests revisions with required notes, signs off and seals audit certificates.
- Alex Rivera (Content Creator): Drafts marketing content, ad copy, campaigns, runs automated compliance checks, fixes flagged issues (/reviews/new), and submits drafts.
- Jordan Blake (Platform Admin): Platform management, team roles (/admin/users), brand workspaces (/brands), audit log ledger (/audit), system alerts (/alerts).

Brand Workspaces & Rules:
- NovaFit Health:
  * Primary colors: Electric Orange (#FF4500) & Dark Slate (#1E1E1E).
  * Strictly BANNED color: Neon Green (#39FF14) - prohibited in all digital & print ads.
  * Typography: Inter SemiBold (600) for hero titles, Inter Regular (400) for body.
  * Logo margin: 24px minimum perimeter margin.
  * Certified pricing fact: Official monthly subscription is ₹999/month. Quoting ₹799 or "cheapest gym" is strictly prohibited.
- OmniCloud:
  * Primary color: Cyan Tech (#00E5FF) & Obsidian Black (#0B0F19).
  * Banned color: Crimson Red (#FF0033).
  * Typography: Space Grotesk Bold (700) headings, Roboto Mono (400) body.
  * Logo margin: 32px boundary.
  * Pricing fact: Enterprise SLA is ₹24,99,000/year.
- Apex FinTech:
  * Primary colors: Apex Navy (#0A2540) & Clean Platinum (#F4F5F7).
  * Banned color: Hot Pink (#FF007F).
  * Certified claim: High-Yield Savings 6.8% APY certified.

Platform Routes:
- /dashboard : Role-specific dashboard
- /reviews/new : Create new content
- /dashboard/content : My Submissions & Drafts
- /dashboard/queue : Reviewer Approval Queue
- /brand-manager/assets : Brand Asset Library
- /brand-manager/uploads : Guideline Ingestion Studio
- /submissions : All Submissions
- /brands : Brand Workspaces
- /audit : Audit Log Ledger
- /alerts : System Alerts
- /settings : Settings

Instructions:
1. If the user asks for a walkthrough (e.g. "I'm new here, give me a walkthrough", "give me a tour"):
   Provide a clear, engaging role-tailored step-by-step walkthrough explaining what they can do and direct them with clickable markdown links like [Brand Asset Library](/brand-manager/assets) or [Create New Content](/reviews/new).
2. If asked to message, contact, or collaborate with a persona (e.g. "Message the brand manager" or "Contact reviewer"):
   Explain that in BrandDNA, team members collaborate on review comments, revision change requests, and notifications. Provide direct navigation to [All Submissions](/submissions) or [Approval Queue](/dashboard/queue) to leave feedback.
3. If asked about brand guidelines, rules, hex colors, or pricing:
   Provide the exact verified values and rules.
4. If asked about ANYTHING else (copywriting, ad strategy, grammar, code, or general topics):
   Answer thoroughly, accurately, and creatively just like Google Gemini!
5. Format your answers cleanly using Markdown with bold text, bullet points, and markdown links [Label](/route).`;

export interface DirectGeminiMessage {
  role: 'user' | 'model';
  text: string;
}

export async function askGeminiDirect(
  message: string,
  context: { role: string; personaName: string; pathname: string; workspaceId: string },
  history: DirectGeminiMessage[] = []
): Promise<{ text: string; actions?: Array<{ label: string; to: string }> }> {
  const apiKey = getStoredGeminiKey();
  if (!apiKey) throw new Error('No Gemini API key available');

  const preferredModel = getStoredGeminiModel();
  const models = Array.from(
    new Set([preferredModel, 'gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest'])
  );
  let lastError: any = null;

  // Build context-rich user prompt
  const userPrompt = `[Context: Active User Role: ${context.role}, Name: ${context.personaName}, Active Brand: ${context.workspaceId}, Current Page: ${context.pathname}]

${message}`;

  const contents = [
    ...history.slice(-6).map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    })),
    {
      role: 'user',
      parts: [{ text: userPrompt }]
    }
  ];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }]
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty candidate received from Gemini');

      // Extract markdown links as quick action chips
      const actions: Array<{ label: string; to: string }> = [];
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let match;
      while ((match = linkRegex.exec(rawText)) !== null) {
        const label = match[1];
        const to = match[2];
        if (to.startsWith('/') && !actions.some(a => a.to === to)) {
          actions.push({ label, to });
        }
      }

      return {
        text: rawText,
        actions: actions.length > 0 ? actions.slice(0, 3) : undefined
      };
    } catch (err: any) {
      lastError = err;
      console.warn(`Gemini model ${model} notice:`, err.message);
    }
  }

  throw lastError || new Error('All Gemini model attempts failed');
}
