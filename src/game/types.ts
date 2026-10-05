export type Gender = "boy" | "girl";

export type SceneId = "home" | "kindy" | "corridor" | "market" | "estate";

export type Tendency = "dream" | "reality" | "balance" | "think";

export type Approach = "social" | "safe" | "curious";

export type PrimaryKey =
  | "STAT_MIND"
  | "STAT_STR"
  | "STAT_GRIT"
  | "STAT_VIT"
  | "STAT_SPEECH"
  | "STAT_COURAGE"
  | "STAT_FATE";

export type DerivedKey =
  | "STATE_HEALTH"
  | "STATE_MOOD"
  | "STATE_STRESS"
  | "VALUE_DREAM"
  | "VALUE_REALITY"
  | "STATE_PEACE"
  | "STATE_FAMILY_HARMONY"
  | "STATE_GLOBAL_NETWORK"
  | "INDEPENDENT_THOUGHT";

export type CounterKey =
  | "NPC_MOM_STRESS"
  | "WORLD_DAD_WORK_OCCURRENCES"
  | "PLAYER_DAD_CHOICE_RESPONSE"
  | "REL_LOCAL_MARKET"
  | "COUNTER_EXPLORE"
  | "ART_PROGRESS"
  | "MIND_PROGRESS";

export type Primary = Record<PrimaryKey, number>;
export type Derived = Record<DerivedKey, number>;
export type Counters = Record<CounterKey, number>;

export type NpcId =
  | "NPC_DAD_01"
  | "NPC_MOM_01"
  | "NPC_GRAND_01"
  | "NPC_AUNT_01"
  | "NPC_FRIEND_01"
  | "NPC_TEACH_01";

export type Npc = { relation: number; trust: number; available: boolean };

export type Effect = {
  primary?: Partial<Primary>;
  derived?: Partial<Derived>;
  counter?: Partial<Counters>;
  npc?: Partial<Record<NpcId, Partial<Npc>>>;
  flags?: string[];
  tags?: string[];
  skills?: string[];
};

export type Delta = { label: string; value: number };

export type MemoryRecord = {
  id: string;
  eventId: string;
  choiceId: string;
  variant: string;
  year: number;
  age: number;
  npc: string;
  emotion: string;
  weight: number;
  echo: string;
  snapshot?: { dream: number; reality: number; family: number };
};

export type BattleKind = "perfect" | "win" | "fail" | "bad";

export type BattleOutcome = {
  kind: BattleKind;
  stress: number;
  hp: number;
};

export type Phase =
  | "title"
  | "gender"
  | "year"
  | "activities"
  | "note"
  | "event"
  | "battle"
  | "battle-result"
  | "result"
  | "repair"
  | "explore-offer"
  | "year-end"
  | "fifteen"
  | "ending";

export type ResultView = { text: string; deltas: Delta[]; skills: string[]; lean?: string };

export type State = {
  phase: Phase;
  gender: Gender | null;
  yearIndex: number;
  primary: Primary;
  derived: Derived;
  counter: Counters;
  npc: Record<NpcId, Npc>;
  flags: string[];
  personalityTags: string[];
  skills: string[];
  memories: MemoryRecord[];
  seed: number;
  apLeft: number;
  spent: string[];
  queue: string[];
  eventId: string | null;
  note: string | null;
  noteScene: SceneId | null;
  result: ResultView | null;
  approach: Approach | null;
  battleTries: number;
  battle: BattleOutcome | null;
  offeredExplore: boolean;
  name: string;
  schemaVersion: 2;
};

export const INITIAL_PRIMARY: Primary = {
  STAT_MIND: 5,
  STAT_STR: 5,
  STAT_GRIT: 5,
  STAT_VIT: 5,
  STAT_SPEECH: 5,
  STAT_COURAGE: 5,
  STAT_FATE: 5,
};

export const INITIAL_DERIVED: Derived = {
  STATE_HEALTH: 90,
  STATE_MOOD: 75,
  STATE_STRESS: 15,
  VALUE_DREAM: 50,
  VALUE_REALITY: 50,
  STATE_PEACE: 60,
  STATE_FAMILY_HARMONY: 70,
  STATE_GLOBAL_NETWORK: 10,
  INDEPENDENT_THOUGHT: 40,
};

export const COUNTER_RANGE: Record<CounterKey, { min: number; max: number }> = {
  NPC_MOM_STRESS: { min: 0, max: 100 },
  WORLD_DAD_WORK_OCCURRENCES: { min: 0, max: 99 },
  PLAYER_DAD_CHOICE_RESPONSE: { min: 0, max: 99 },
  REL_LOCAL_MARKET: { min: 0, max: 100 },
  COUNTER_EXPLORE: { min: 0, max: 99 },
  ART_PROGRESS: { min: 0, max: 10 },
  MIND_PROGRESS: { min: 0, max: 10 },
};

export const PRIMARY_RANGE = { min: 0, max: 10 };
export const DERIVED_RANGE = { min: 0, max: 100 };
export const NPC_STAT_RANGE = { min: 0, max: 100 };
export const BATTLE_TRIES_RANGE = { min: 0, max: 9 };

export const INITIAL_COUNTERS: Counters = {
  NPC_MOM_STRESS: 25,
  WORLD_DAD_WORK_OCCURRENCES: 0,
  PLAYER_DAD_CHOICE_RESPONSE: 0,
  REL_LOCAL_MARKET: 15,
  COUNTER_EXPLORE: 0,
  ART_PROGRESS: 0,
  MIND_PROGRESS: 0,
};

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function spiritHp(primary: Primary, mod = 0) {
  return clamp(50 + primary.STAT_GRIT * 6 + primary.STAT_VIT * 4 + mod, 50, 100);
}

export function driveSp(primary: Primary, mood: number) {
  const moodMod = mood >= 70 ? 4 : mood >= 45 ? 0 : -4;
  return clamp(30 + primary.STAT_GRIT * 2 + moodMod, 30, 60);
}

export function grownWord(gender: Gender) {
  return gender === "boy" ? "男孩子" : "女孩子";
}
