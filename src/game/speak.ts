import type { State } from "./types";
import type { Speaker } from "./scene";

/** `speaker` set means the text is that person's words, without quote marks. `theme` groups lines that remember the same thing. */
export type Spoken = { text: string; priority: 0 | 1 | 2; speaker?: Speaker; theme?: string };

/** P0 first, then up to two P1 lines, then P2. The budget is a hard cap, P0 included (V3.3). There is no P3. */
export function selectByPriority(lines: Spoken[], budget: number): string[] {
  return selectSpoken(lines, budget).map((line) => (line.speaker ? `${line.speaker}：「${line.text}」` : line.text));
}

function lastClause(text: string) {
  const parts = text.split(/[。！？]/).map((part) => part.trim()).filter(Boolean);
  return parts.at(-1) ?? text;
}

/**
 * Same rule as selectByPriority, keeping who says each line.
 * The budget is a hard cap, P0 included. One line per theme, and never two lines that end the same way.
 */
export function selectSpoken(lines: Spoken[], budget: number): Spoken[] {
  const kept: Spoken[] = [];
  const themes = new Set<string>();
  const endings = new Set<string>();
  const take = (line: Spoken) => {
    if (kept.length >= budget || kept.includes(line)) return false;
    if (line.theme && themes.has(line.theme)) return false;
    const ending = lastClause(line.text);
    if (endings.has(ending)) return false;
    kept.push(line);
    if (line.theme) themes.add(line.theme);
    endings.add(ending);
    return true;
  };
  for (const line of lines) if (line.priority === 0) take(line);
  let important = 0;
  for (const line of lines) {
    if (line.priority !== 1 || important >= 2) continue;
    if (take(line)) important += 1;
  }
  for (const line of lines) if (line.priority === 2) take(line);
  return kept;
}

export function picked(state: State, id: string) {
  const matches = state.memories.filter((item) => (item.memoryTypeId ?? item.id) === id);
  if (matches.length === 0) return "";
  return [...matches].sort((a, b) => a.year - b.year || a.age - b.age).at(-1)?.choiceId ?? "";
}

/** Memory is the fact. The heard-flag is only an index written by A/B. */
export function heardNews(state: State) {
  const id = state.memories.find((item) => item.id === "MEM_NEWS_01")?.choiceId;
  return id === "A" || id === "B";
}

/** Harmony under 40, or both afternoons spent on yourself before the table. */
export function newsCold(state: State) {
  if (state.derived.STATE_FAMILY_HARMONY < 40) return true;
  return state.spent.includes("ACT_PLAY") && state.spent.includes("ACT_DRAW");
}

export function gapLine(state: State, dream: string, reality: string) {
  const gap = state.derived.VALUE_DREAM - state.derived.VALUE_REALITY;
  if (gap >= 8) return dream;
  if (gap <= -8) return reality;
  return "";
}
