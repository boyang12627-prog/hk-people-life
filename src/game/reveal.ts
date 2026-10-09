/**
 * Line-by-line reveal for a page (UI V4). Pure, so the audit can check it without a browser.
 * `chars` is how much of the current line is typed; Infinity-like values mean "all of it".
 */
export type Reveal = { shown: number; chars: number };

export const ALL = Number.MAX_SAFE_INTEGER;

export function startReveal(still: boolean): Reveal {
  return { shown: 1, chars: still ? ALL : 0 };
}

export function isTyping(r: Reveal, lengths: readonly number[]) {
  const current = lengths[Math.min(r.shown, lengths.length) - 1] ?? 0;
  return r.chars < current;
}

export function isDone(r: Reveal, lengths: readonly number[]) {
  return r.shown >= lengths.length && !isTyping(r, lengths);
}

/** One tap: finish the line being typed, else show the next line. Never past the end. */
export function stepReveal(r: Reveal, lengths: readonly number[], still: boolean): Reveal {
  if (isTyping(r, lengths)) return { shown: r.shown, chars: ALL };
  if (r.shown < lengths.length) return { shown: r.shown + 1, chars: still ? ALL : 0 };
  return r;
}

/** Show everything at once. */
export function skipReveal(lengths: readonly number[]): Reveal {
  return { shown: Math.max(1, lengths.length), chars: ALL };
}

/**
 * The panel shows one line at a time (V4.4): the current line, and the lines already read
 * (for the 回看 log only). Never empty while there is at least one line.
 */
export function lineAt<T>(items: readonly T[], r: Reveal): { index: number; current: T; past: T[] } {
  const index = Math.max(0, Math.min(r.shown, items.length) - 1);
  return { index, current: items[index], past: items.slice(0, index) };
}
