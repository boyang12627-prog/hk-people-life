export type Gender = "boy" | "girl";

export type ChainStatus = "locked" | "available" | "active" | "delayed" | "recovered" | "completed";

export type ChainState = {
  id: "CHAIN_85_DOOR";
  /** How many of the five stages are done: afternoons, door, someone, reflect, echo. */
  stage: number;
  status: ChainStatus;
  choiceId: string | null;
};

export type SceneId = "home" | "kindy" | "corridor" | "market" | "estate" | "study";

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

/** What one person did in a day, and what that changes for the next day. */
export type NpcDay = {
  location: "estate" | "home" | "away";
  currentActivity: string;
  mood: string;
  currentMood: number;
  relationshipDeltaToday: number;
  todayOutcome: "shared" | "kept" | "left" | "watched" | "alone" | "disappointed" | "content" | "left-early";
  seenPlayer: boolean;
  missedPlayer: boolean;
  nextPlan: "seek" | "avoid" | "withdraw" | "return";
};

export type Effect = {
  primary?: Partial<Primary>;
  derived?: Partial<Derived>;
  counter?: Partial<Counters>;
  npc?: Partial<Record<NpcId, Partial<Npc>>>;
  flags?: string[];
  tags?: string[];
  skills?: string[];
  equipment?: string[];
};

export type Delta = { label: string; value: number };

export type MemoryRecord = {
  /** Prototype lookup key. Same as memoryTypeId. */
  id: string;
  /** Event family. Repeated years keep the same type. */
  memoryTypeId?: string;
  /** One occurrence. A later year must not reuse this id. */
  instanceId?: string;
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

/** A thing the child can carry. Attack on the item is not a kindergarten hit. */
export type Equipment = {
  id: string;
  slot: "hand" | "body" | "bag";
  sourceQuest: string;
  availableFromYear: number;
  availableToYear?: number;
  battle?: { atk?: number; def?: number; speed?: number; stressResist?: number };
  memoryHook?: string;
};

/** A listed way to use one skill. Most skills never get a row. */
export type TechniqueEffect = { dodge?: boolean; stress?: number; goal?: number };

export type Technique = {
  id: string;
  sourceSkill?: string;
  kind: "passive" | "active" | "reaction";
  cost?: number;
  cooldownRounds?: number;
  /** Executed in battle. Passive rows omit this. */
  battle?: TechniqueEffect;
  effect: string;
};

export type TurnOwner = "player" | "pressure";

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
  | "story"
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
  /** Days already lived. Empty until that afternoon is over. */
  npcDays: Partial<Record<NpcId, NpcDay>>;
  flags: string[];
  personalityTags: string[];
  skills: string[];
  /** Owned item ids. Empty until a quest gives one. */
  equipment: string[];
  /** Ids currently in a slot. Empty until the child can equip. */
  equipped: string[];
  /** Learned technique ids. Empty until skills unlock them. */
  techniques: string[];
  techniqueProgress: Record<string, number>;
  memories: MemoryRecord[];
  seed: number;
  apLeft: number;
  spent: string[];
  /** 1985 meetings you did not have. Other years leave this alone. */
  missed: string[];
  chain: ChainState;
  queue: string[];
  eventId: string | null;
  note: string | null;
  noteScene: SceneId | null;
  result: ResultView | null;
  approach: Approach | null;
  /** Which BattleSpec is in progress. The result screen reads this, not a hardcoded year. */
  battleSpecId: string | null;
  battleTries: number;
  battle: BattleOutcome | null;
  offeredExplore: boolean;
  name: string;
  schemaVersion: 3;
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
