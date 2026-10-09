/**
 * One sequence drives a page. Every entry is shown, in order, and says who it belongs to.
 * A plain string never guesses a speaker: it is narration. Dialogue names its speaker in data.
 */

export type Speaker = "媽媽" | "爸爸" | "嫲嫲" | "阿傑" | "老師" | "阿姨";

export type SceneLine =
  | { type: "narration"; text: string }
  | { type: "action"; where?: string; text: string }
  | { type: "dialogue"; speaker: Speaker; text: string };

export const SPEAKERS: readonly Speaker[] = ["媽媽", "爸爸", "嫲嫲", "阿傑", "老師", "阿姨"];

export function narrate(text: string): SceneLine {
  return { type: "narration", text };
}

/** Something a person does, optionally with the place it happens. */
export function act(text: string, where?: string): SceneLine {
  return where ? { type: "action", where, text } : { type: "action", text };
}

export function say(speaker: Speaker, text: string): SceneLine {
  return { type: "dialogue", speaker, text };
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

/** What the dialogue box draws for one entry. One turn per entry, so nothing is dropped. */
export type Turn = { kind: SceneLine["type"]; speaker: Speaker | null; name: string; where?: string; text: string };

export function sceneTurns(lines: readonly SceneLine[]): Turn[] {
  return lines.map((line) => {
    if (line.type === "dialogue") return { kind: "dialogue", speaker: line.speaker, name: line.speaker, text: line.text };
    if (line.type === "action") return { kind: "action", speaker: null, name: line.where ?? "旁白", where: line.where, text: line.text };
    return { kind: "narration", speaker: null, name: "旁白", text: line.text };
  });
}
