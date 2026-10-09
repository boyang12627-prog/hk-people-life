/**
 * One sequence drives a page. Every entry is shown, in order, and says who it belongs to.
 * A plain string never guesses a speaker: it is narration. Dialogue names its speaker in data.
 */

export type Speaker = "媽媽" | "爸爸" | "嫲嫲" | "阿傑" | "老師" | "阿姨";

/**
 * How a line of speech is written. Narration and action are always concise written Chinese.
 * - formal: written Chinese, as a teacher speaks to a class.
 * - narrative: written grammar with Hong Kong words and rhythm (一陣、好累、今日).
 * - colloquial: Cantonese as it is said (唔、咗、嘅、啦). Use for a line that would sound false in written grammar.
 * See docs/VOICE.md for each speaker.
 */
export type Register = "formal" | "narrative" | "colloquial";

export type SceneLine =
  | { type: "narration"; text: string }
  | { type: "action"; where?: string; text: string }
  | { type: "dialogue"; speaker: Speaker; text: string; register?: Register };

/** The register a speaker uses when a line does not say. Matches docs/VOICE.md. */
export const DEFAULT_REGISTER: Record<Speaker, Register> = {
  媽媽: "narrative",
  爸爸: "narrative",
  嫲嫲: "colloquial",
  阿傑: "colloquial",
  阿姨: "colloquial",
  老師: "formal",
};

export function registerOf(line: Extract<SceneLine, { type: "dialogue" }>): Register {
  return line.register ?? DEFAULT_REGISTER[line.speaker];
}

export const SPEAKERS: readonly Speaker[] = ["媽媽", "爸爸", "嫲嫲", "阿傑", "老師", "阿姨"];

export function narrate(text: string): SceneLine {
  return { type: "narration", text };
}

/** Something a person does, optionally with the place it happens. */
export function act(text: string, where?: string): SceneLine {
  return where ? { type: "action", where, text } : { type: "action", text };
}

export function say(speaker: Speaker, text: string, register?: Register): SceneLine {
  return register ? { type: "dialogue", speaker, text, register } : { type: "dialogue", speaker, text };
}

/** Plain strings are narration by rule, not by reading their punctuation. */
export function toSequence(lines: readonly (string | SceneLine)[]): SceneLine[] {
  return lines.filter((line) => (typeof line === "string" ? line.length > 0 : line.text.length > 0)).map((line) => (typeof line === "string" ? narrate(line) : line));
}

/** Flat text, for search and tests. Not used to decide who speaks. */
export function lineText(line: SceneLine): string {
  if (line.type === "dialogue") return `${line.speaker}：「${line.text}」`;
  return line.text;
}

export function sequenceText(lines: readonly SceneLine[]): string {
  return lines.map(lineText).join("");
}

/** A place name for a location tag: no wrapping brackets (（門口） -> 門口), trimmed. The pin icon replaces them. */
export function placeLabel(raw: string) {
  return raw.trim().replace(/^[（(]\s*/, "").replace(/\s*[）)]$/, "").trim();
}

/** What the dialogue box draws for one entry. One turn per entry, so nothing is dropped. */
export type Turn = { kind: SceneLine["type"]; speaker: Speaker | null; name: string; where?: string; text: string };

export function sceneTurns(lines: readonly SceneLine[]): Turn[] {
  return lines.map((line) => {
    if (line.type === "dialogue") return { kind: "dialogue", speaker: line.speaker, name: line.speaker, text: line.text };
    if (line.type === "action") return { kind: "action", speaker: null, name: line.where ?? "旁白", where: line.where, text: line.text };
    return { kind: "narration", speaker: null, name: "旁白", text: line.text };
  });
}
