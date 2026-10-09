import type { State } from "./types";
import type { Speaker } from "./scene";

/** `speaker` set means the text is that person's words, without quote marks. */
export type Spoken = { text: string; priority: 0 | 1 | 2; speaker?: Speaker };

/** P0 always. Then up to two P1 lines. P2 fills whatever budget is left. There is no P3. */
export function selectByPriority(lines: Spoken[], budget: number): string[] {
  return selectSpoken(lines, budget).map((line) => (line.speaker ? `${line.speaker}：「${line.text}」` : line.text));
}

/** Same rule as selectByPriority, keeping who says each line. */
export function selectSpoken(lines: Spoken[], budget: number): Spoken[] {
  const kept = lines.filter((line) => line.priority === 0);
  let important = 0;
  for (const line of lines) {
    if (line.priority !== 1 || important >= 2 || kept.length >= budget) continue;
    kept.push(line);
    important += 1;
  }
  for (const line of lines) {
    if (line.priority < 2 || kept.length >= budget) continue;
    kept.push(line);
  }
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
