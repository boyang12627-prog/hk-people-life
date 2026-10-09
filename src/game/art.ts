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
  EVT_1984_FAMILY_02: "home",
  EVT_1986_FAMILY_06: "tv",
  EVT_1986_ECHO_08: "corridor",
  MINI_85_ALONE_PODIUM: "rain",
  EVT_1986_DAD_NIGHT: "shoes",
  EVT_1988_DAD_SIGN: "shoes",
};

const BEAT_PLATE: Record<string, string> = {
  open: "bag",
  downstairs: "stair",
  "sun-night": "bag",
  "sat-night": "tv",
  aftermath: "tv",
};

/** Q scene paintings are WebP, 1280x720: the plate is at most ~640 CSS px wide in the max-w-lg column, so 1280 covers 2x screens. */
export const SCENE_EXT = "webp";

function painted(name: string, gender: Gender | null) {
  const who = gender === "girl" ? "girl" : "boy";
  return `/art/q/${name}-${who}.${SCENE_EXT}`;
}

export function eventPlate(eventId: string | null, gender: Gender | null, scene?: string | null) {
  if (eventId === "EVT_1985_FRIEND_04" && scene === "kindy") return painted("inside", gender);
  if (eventId === "MINI_QUIET" && scene === "estate") return painted("rain", gender);
  const name = eventId ? EVENT_PLATE[eventId] : null;
  return name ? painted(name, gender) : null;
}

export function beatPlate(beat: string, gender: Gender | null) {
  const name = BEAT_PLATE[beat];
  return name ? painted(name, gender) : null;
}

export function yearPlate(year: number, gender: Gender | null) {
  if (year === 1986) return painted("tv", gender);
  return null;
}

export function scenePlate(scene: SceneId, gender: Gender | null) {
  return painted(scene, gender);
}

/** Scene picture for a year card or a kindergarten battle step. Every year now uses the Q-version set in /art/q. */
export function slicePlate(input: { year: number; scene: SceneId; gender: Gender | null; battle?: "door" | "pressure" | "inside" }): string | null {
  if (!input.gender) return null;
  if (input.battle === "pressure" || input.battle === "inside") return painted(input.battle, input.gender);
  if (input.battle === "door") return scenePlate("kindy", input.gender);
  return scenePlate(input.scene, input.gender);
}

/** One painted dinner. People are already in the picture, so do not paste sprites on it. */
export function dinnerPlate(gender: Gender | null) {
  return scenePlate("home", gender);
}

export const MEMORY_BALL = "/art/1985/memory.jpg";

export type PersonId = "mom" | "dad" | "grandma" | "kit" | "teacher" | "auntie" | "child";

const FILE: Record<Exclude<PersonId, "child">, string> = {
  mom: "mom",
  dad: "dad",
  grandma: "grandma",
  kit: "kit",
  teacher: "teacher",
  auntie: "auntie",
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
  if (id === "teacher") return "老師";
  if (id === "auntie") return "阿姨";
  return "你";
}

/** Face for a speaker in the dialogue box. Every speaker has a portrait. */
export function personFromSpeaker(name: string): PersonId | null {
  if (name === "媽媽") return "mom";
  if (name === "爸爸") return "dad";
  if (name === "嫲嫲") return "grandma";
  if (name === "阿傑") return "kit";
  if (name === "老師") return "teacher";
  if (name === "阿姨") return "auntie";
  return null;
}

/** The picture after an afternoon spent at home. Null means the screen uses the scene picture. */
export function afternoonPlate(activityId: string | undefined, gender: Gender | null) {
  if (activityId === "ACT_DRAW") return painted("draw", gender);
  if (activityId === "ACT_PLAY") return painted("play", gender);
  if (activityId === "ACT_REST") return painted("rest", gender);
  return null;
}

/** The battle picture. Kindergarten gets crowded under pressure; other fights keep their room. */
export function battlePlate(scene: SceneId, gender: Gender | null, state: { entered: boolean; pressed: boolean }) {
  if (scene !== "kindy") return scenePlate(scene, gender);
  if (state.entered) return painted("inside", gender);
  if (state.pressed) return painted("pressure", gender);
  return scenePlate("kindy", gender);
}

const SCENES: readonly SceneId[] = ["home", "kindy", "corridor", "market", "estate", "study"];
const GENDERS: readonly Gender[] = ["boy", "girl"];
const PEOPLE: readonly PersonId[] = ["mom", "dad", "grandma", "kit", "teacher", "auntie", "child"];

/**
 * Every image path the game can ask for, built from the same functions the screens call.
 * The audit checks each one exists. A file under public/art that is not here is not used.
 */
export function imageManifest(): string[] {
  const out = new Set<string>();
  const add = (path: string | null) => {
    if (path) out.add(path);
  };
  for (const gender of GENDERS) {
    for (const scene of SCENES) {
      add(scenePlate(scene, gender));
      add(battlePlate(scene, gender, { entered: false, pressed: false }));
      add(battlePlate(scene, gender, { entered: true, pressed: false }));
      add(battlePlate(scene, gender, { entered: false, pressed: true }));
      add(slicePlate({ year: 1985, scene, gender }));
    }
    for (const battle of ["door", "pressure", "inside"] as const) add(slicePlate({ year: 1985, scene: "kindy", gender, battle }));
    for (const id of Object.keys(EVENT_PLATE)) add(eventPlate(id, gender));
    add(eventPlate("EVT_1985_FRIEND_04", gender, "kindy"));
    add(eventPlate("MINI_QUIET", gender, "estate"));
    for (const beat of Object.keys(BEAT_PLATE)) add(beatPlate(beat, gender));
    for (const year of [1984, 1985, 1986, 1988]) add(yearPlate(year, gender));
    for (const id of ["ACT_DRAW", "ACT_PLAY", "ACT_REST"]) add(afternoonPlate(id, gender));
    add(dinnerPlate(gender));
    for (const id of PEOPLE) {
      for (const mood of ["idle", "think"] as const) {
        for (const pose of ["stand", "sit"] as const) add(personSrc(id, gender, mood, pose));
      }
    }
  }
  add(MEMORY_BALL);
  return [...out].sort();
}
