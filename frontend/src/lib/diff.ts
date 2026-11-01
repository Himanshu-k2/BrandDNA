export type DiffOp = { type: 'eq' | 'del' | 'ins'; text: string };

const tokenize = (text: string) => text.match(/\n|[^\S\n]+|[^\s]+/g) ?? [];

/** Word-level LCS diff that keeps newlines as their own tokens. */
export function diffWords(base: string, next: string): DiffOp[] {
  const a = tokenize(base);
  const b = tokenize(next);
  const table: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      ops.push({ type: 'eq', text: a[i] });
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      ops.push({ type: 'del', text: a[i++] });
    } else {
      ops.push({ type: 'ins', text: b[j++] });
    }
  }
  while (i < a.length) ops.push({ type: 'del', text: a[i++] });
  while (j < b.length) ops.push({ type: 'ins', text: b[j++] });
  return ops;
}

/** Splits ops into display lines and merges adjacent ops of the same type. */
export function toLines(ops: DiffOp[]): DiffOp[][] {
  const lines: DiffOp[][] = [[]];
  for (const op of ops) {
    if (op.text === '\n') {
      lines.push([]);
      continue;
    }
    const line = lines[lines.length - 1];
    const last = line[line.length - 1];
    // Keep whitespace between two changed words inside the same highlight.
    if (last && (last.type === op.type || (op.type === 'eq' && !op.text.trim() && last.type !== 'eq'))) {
      last.text += op.text;
    } else {
      line.push({ ...op });
    }
  }
  return lines;
}

export function diffStats(ops: DiffOp[]) {
  const count = (type: DiffOp['type']) =>
    ops.filter(op => op.type === type && op.text !== '\n').reduce((sum, op) => sum + op.text.length, 0);
  return { added: count('ins'), removed: count('del') };
}
