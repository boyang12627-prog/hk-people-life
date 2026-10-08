import type { Gender, SceneId } from "./types";

/** A picture for one event, when the place name is too broad. */
const EVENT_PLATE: Record<string, string> = {
  MINI_84_TOY: "toy",
  MINI_85_RAIN: "rain",
  MINI_85_GRANDMA: "soup",
  MINI_85_DAD: "shoes",
  MINI_85_TV: "tv",
  MINI_86_TV: "tv",
  MINI_85_ORANGE: "orange",
  MINI_86_HELP: "bags",
  EVT_1988_PEN_01: "pen",
};

const BEAT_PLATE: Record<string, string> = {
  open: "bag",
  downstairs: "stair",
};

function painted(name: string, gender: Gender | null) {
  const who = gender === "girl" ? "girl" : "boy";
  return `/art/q/${name}-${who}.jpg`;
}

export function eventPlate(eventId: string | null, gender: Gender | null) {
  const name = eventId ? EVENT_PLATE[eventId] : null;
  return name ? painted(name, gender) : null;
}

export function beatPlate(beat: string, gender: Gender | null) {
  const name = BEAT_PLATE[beat];
  return name ? painted(name, gender) : null;
}

export function scenePlate(scene: SceneId, gender: Gender | null) {
  const who = gender === "girl" ? "girl" : "boy";
  return `/art/q/${scene}-${who}.jpg`;
}

/** 1985 slice only. Other years still use the empty room strips. */
export function slicePlate(input: { year: number; scene: SceneId; gender: Gender | null; battle?: "door" | "pressure" | "inside" }): string | null {
  if (!input.gender) return null;
  const who = input.gender === "boy" ? "boy" : "girl";
  if (input.battle === "pressure" || input.battle === "inside") return `/art/q/${input.battle}-${who}.jpg`;
  if (input.battle === "door") return scenePlate("kindy", input.gender);
  return scenePlate(input.scene, input.gender);
}

/** One painted dinner. People are already in the picture, so do not paste sprites on it. */
export function dinnerPlate(gender: Gender | null) {
  return scenePlate("home", gender);
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

export type DialogueTurn = { speaker: PersonId | null; name: string; text: string };

/** A whole line spoken by one person. Narration that only mentions a quote stays narration. */
export function readLine(line: string, quoteFallback: PersonId | null = null): DialogueTurn {
  const named = line.match(/^(媽媽|爸爸|嫲嫲|阿傑|老師|阿姨)([^「]{0,10})：「([^」]+)」$/);
  if (named) return { speaker: personFromName(named[1]), name: named[1], text: named[3] };
  const bare = line.match(/^「([^」]+)」$/);
  if (bare && quoteFallback) return { speaker: quoteFallback, name: personName(quoteFallback), text: bare[1] };
  return { speaker: null, name: "旁白", text: line };
}

export function spokenLine(lines: readonly string[]) {
  for (const line of lines) {
    const hit = line.match(/「([^」]+)」/);
    if (hit) return hit[1];
  }
  return lines[0] ?? "";
}
