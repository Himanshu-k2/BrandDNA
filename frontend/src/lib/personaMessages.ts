import { type Role, PERSONAS } from '@/state/session';

export interface PersonaDispatchMessage {
  id: string;
  fromRole: Role;
  fromName: string;
  fromInitials: string;
  toRole: Role;
  toName: string;
  content: string;
  createdAt: string;
  read: boolean;
}

const STORAGE_KEY = 'branddna_persona_messages';

export function getAllPersonaMessages(): PersonaDispatchMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePersonaMessages(messages: PersonaDispatchMessage[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    window.dispatchEvent(new CustomEvent('branddna:persona_message'));
  } catch {}
}

export function getUnreadMessagesForRole(role: Role): PersonaDispatchMessage[] {
  return getAllPersonaMessages().filter(m => m.toRole === role && !m.read);
}

export function sendPersonaMessage(
  fromRole: Role,
  toRole: Role,
  content: string
): PersonaDispatchMessage {
  const fromPersona = PERSONAS[fromRole];
  const toPersona = PERSONAS[toRole];

  const newMsg: PersonaDispatchMessage = {
    id: `pmsg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    fromRole,
    fromName: fromPersona.name,
    fromInitials: fromPersona.initials,
    toRole,
    toName: toPersona.name,
    content: content.trim(),
    createdAt: new Date().toISOString(),
    read: false,
  };

  const all = getAllPersonaMessages();
  all.push(newMsg);
  savePersonaMessages(all);
  return newMsg;
}

export function markMessageAsRead(id: string) {
  const all = getAllPersonaMessages();
  const updated = all.map(m => (m.id === id ? { ...m, read: true } : m));
  savePersonaMessages(updated);
}

export function markAllMessagesForRoleAsRead(role: Role) {
  const all = getAllPersonaMessages();
  const updated = all.map(m => (m.toRole === role ? { ...m, read: true } : m));
  savePersonaMessages(updated);
}

/**
 * Resolves a natural language query into a target Role with strict priority.
 */
export function parseRecipientRole(query: string): Role | null {
  const lower = query.toLowerCase();

  // 1. Direct persona names (unambiguous)
  if (/\b(priya|kapoor)\b/i.test(lower)) return 'brand_manager';
  if (/\b(jordan|blake)\b/i.test(lower)) return 'admin';
  if (/\b(alex|rivera)\b/i.test(lower)) return 'creator';

  // 2. Full role names with word boundaries
  if (/\bbrand\s*manager\b|\b(brand\s*)?reviewer\b|\bapprover\b/i.test(lower)) return 'brand_manager';
  if (/\b(platform\s*)?admin(istrator)?\b/i.test(lower)) return 'admin';
  if (/\b(content\s*)?creator\b/i.test(lower)) return 'creator';

  return null;
}

/**
 * Extracts clean message content from commands like:
 * "message the brand manager: please check the orange banner"
 * "send a message to sarah saying the edits are done"
 * "tell admin that we need access"
 * "reply to Alex: approved"
 */
export function extractMessageContent(raw: string, _targetRole?: Role | null): string {
  // If there's a colon, take everything after the first colon
  const colonIndex = raw.indexOf(':');
  if (colonIndex !== -1 && colonIndex < raw.length - 1) {
    const afterColon = raw.slice(colonIndex + 1).trim();
    if (afterColon) return afterColon.replace(/^["']|["']$/g, '');
  }

  // If there's 'saying' or 'that', take everything after it
  const sayingMatch = raw.match(/\b(saying|that|to\s+tell\s+them)\s+(.+)$/i);
  if (sayingMatch && sayingMatch[2]) {
    return sayingMatch[2].trim().replace(/^["']|["']$/g, '');
  }

  // Remove command prefixes and target role mentions
  const cleaned = raw
    .replace(/^(hey\s+brad[,\s]*|brad[,\s]*|please\s+|can\s+you\s+|could\s+you\s+)?(reply\s*(to)?|message|tell|send(\s+a)?\s+message\s+to|notify|contact|ping)\s+/i, '')
    .replace(/^(the\s+)?(brand\s*manager|reviewer|approver|admin(istrator)?|creator|priya(\s+kapoor)?|sarah(\s+chen)?|jordan(\s+blake)?|alex(\s+rivera)?)[,\s:]*/i, '')
    .trim();

  return cleaned
    .replace(/^[:,\-—]\s*/, '')
    .replace(/^to\s+/i, '')
    .replace(/^["']|["']$/g, '')
    .trim();
}
