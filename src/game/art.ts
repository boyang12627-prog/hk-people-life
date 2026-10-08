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

export type PersonId = "mom" | "dad" | "grandma" | "kit" | "child";

const FILE: Record<Exclude<PersonId, "child">, string> = {
  mom: "mom",
  dad: "dad",
  grandma: "grandma",
  kit: "kit",
};

export type Mood = "idle" | "think";
export type Pose = "stand" | "sit";

const SIT: Partial<Record<Exclude<PersonId, "child">, string>> = {
  mom: "mom-sit",
  dad: "dad-sit",
  grandma: "grandma-sit",
};

export function personSrc(id: PersonId, gender: Gender | null, mood: Mood = "idle", pose: Pose = "stand") {
  if (id === "child") {
    const who = gender === "boy" ? "boy" : "girl";
    if (pose === "sit") return `/art/1985/people/${who}-sit${mood === "think" ? "-think" : ""}.png`;
    return mood === "think" ? `/art/1985/people/${who}-think.png` : `/art/1985/people/${who}.png`;
  }
  if (pose === "sit" && SIT[id]) return `/art/1985/people/${SIT[id]}.png`;
  return `/art/1985/people/${FILE[id]}.png`;
}

export function personName(id: PersonId) {
  if (id === "mom") return "媽媽";
  if (id === "dad") return "爸爸";
  if (id === "grandma") return "嫲嫲";
  if (id === "kit") return "阿傑";
  return "你";
}

const ROOMS: Record<string, { present: PersonId[]; speaker: PersonId }> = {
  EVT_1984_NEWS_01: { present: ["mom", "dad", "child"], speaker: "dad" },
  EVT_1984_FAMILY_02: { present: ["mom", "child"], speaker: "mom" },
  EVT_1985_FAMILY_03: { present: ["mom", "dad", "child"], speaker: "mom" },
  MINI_85_DAD: { present: ["dad", "child"], speaker: "dad" },
  MINI_85_MOM_ALONE: { present: ["mom", "child"], speaker: "mom" },
  MINI_85_GRANDMA: { present: ["grandma", "child"], speaker: "grandma" },
  MINI_85_NEIGHBOR: { present: ["mom", "child"], speaker: "mom" },
  EVT_1986_FAMILY_06: { present: ["dad", "mom", "child"], speaker: "dad" },
  EVT_1985_FRIEND_04: { present: ["kit", "child"], speaker: "kit" },
  EVT_1986_FRIEND_09: { present: ["kit", "child"], speaker: "kit" },
  MINI_85_KIT_WAIT: { present: ["kit", "child"], speaker: "kit" },
};

export function roomOf(eventId: string) {
  return ROOMS[eventId] ?? null;
}

export function personFromName(name: string): PersonId | null {
  if (name === "媽媽") return "mom";
  if (name === "爸爸") return "dad";
  if (name === "嫲嫲") return "grandma";
  if (name === "阿傑") return "kit";
  return null;
}

export function spokenLine(lines: readonly string[]) {
  for (const line of lines) {
    const hit = line.match(/「([^」]+)」/);
    if (hit) return hit[1];
  }
  return lines[0] ?? "";
}
