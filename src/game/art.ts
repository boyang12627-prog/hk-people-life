import type { Gender, SceneId } from "./types";

/** 1985 slice only. Other years still use the empty room strips. */
export function slicePlate(input: { year: number; scene: SceneId; gender: Gender | null; battle?: "door" | "pressure" | "inside" }): string | null {
  if (!input.gender) return null;
  const who = input.gender === "boy" ? "boy" : "girl";
  if (input.battle) return `/art/1985/${input.battle}-${who}.jpg`;
  if (input.year === 1985 && input.scene === "kindy") return `/art/1985/door-${who}.jpg`;
  if (input.year === 1986 && input.scene === "estate") return `/art/1985/later-${who}.jpg`;
  return null;
}

export const MEMORY_BALL = "/art/1985/memory.jpg";
