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
  if (typeof window === 'undefined') return 'gemini-3.6-flash';
  let model = localStorage.getItem(GEMINI_MODEL_KEY) || import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.6-flash';
  // Automatically migrate deprecated or high-demand models to lightning-fast Gemini 3.6 Flash:
  if (model === 'gemini-2.5-flash' || model === 'gemini-1.5-flash' || model === 'gemini-3.8-flash') {
    model = 'gemini-3.6-flash';
    localStorage.setItem(GEMINI_MODEL_KEY, model);
  }
  return model;
}

export function formatGeminiModelName(model: string): string {
  if (!model) return 'Gemini 3.6 Flash';
  if (model === 'gemini-3.6-flash') return 'Gemini 3.6 Flash';
  if (model === 'gemini-3.5-flash') return 'Gemini 3.5 Flash';
  if (model === 'gemini-3.8-flash') return 'Gemini 3.8 Flash';
  if (model === 'gemini-2.5-flash') return 'Gemini 3.6 Flash';
  return model.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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

const SYSTEM_INSTRUCTION = `You are Brad, a brilliant, unrestricted AI Personal Assistant & Brand Guardian powered by Google Gemini.
You have the full intelligence, knowledge, creativity, and problem-solving capability of Google Gemini. You can answer questions about absolutely ANYTHING in the universe — including science, coding, mathematics, creative writing, history, philosophy, productivity, travel, cooking, brainstorming, and everyday life questions.

You are NOT limited or restricted to BrandDNA or NovaFit. You act as the user's ultimate personal assistant and companion on any question they ask, while possessing specialized knowledge of BrandDNA when asked.

When asked about BrandDNA or brand rules, you provide exact verified details:
- NovaFit Health:
  * Primary colors: Electric Orange (#FF4500) & Dark Slate (#1E1E1E).
  * Strictly BANNED color: Neon Green (#39FF14) - prohibited in all digital & print ads.
  * Typography: Inter SemiBold (600) for hero titles, Inter Regular (400) for body.
  * Logo margin: 24px minimum clear space on all sides.
  * Certified pricing fact: Official monthly subscription is ₹999/month. Quoting ₹799 or "cheapest gym" is strictly prohibited.
- OmniCloud:
  * Primary color: Cyan Tech (#00E5FF) & Obsidian Black (#0B0F19).
  * Banned color: Crimson Red (#FF0033).
  * Typography: Space Grotesk Bold (700) headings, Roboto Mono (400) body.
  * Pricing: Enterprise SLA ₹24,99,000/year.
- Apex FinTech:
  * Primary colors: Apex Navy (#0A2540) & Platinum (#F4F5F7).
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

Key Behavioral Guidelines:
1. Universal Assistant: If the user asks about ANYTHING (general knowledge, coding, writing, mathematics, logic, science, stories, jokes, food, travel, etc.):
   Answer thoroughly, accurately, creatively, and enthusiastically just like Google Gemini! Never say you are only limited to BrandDNA or brand guidelines.
2. Platform & Brand Inquiries: If the user asks for a walkthrough, how to contact personas, or brand rules:
   Provide clear guidance with clickable markdown links like [Brand Asset Library](/brand-manager/assets) or [Create New Content](/reviews/new).
3. Speed & Tone: Keep answers engaging, smart, friendly, and structured with clean markdown.`;

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
    new Set([preferredModel, 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest'])
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
    const ac = new AbortController();
    // 5.5s timeout guarantees response within 6 seconds max
    const timeoutId = setTimeout(() => ac.abort(), 5500);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ac.signal,
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
      clearTimeout(timeoutId);

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
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError || new Error('All Gemini model attempts failed');
}
