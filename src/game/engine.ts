import { ACTIVITIES, battleStory, buildQueue, SKILL_NAME, variantOf, YEARS, yearOf, type Choice } from "./content";
import {
  clamp,
  INITIAL_COUNTERS,
  INITIAL_DERIVED,
  INITIAL_PRIMARY,
  type Approach,
  type BattleOutcome,
  type Counters,
  type Delta,
  type Derived,
  type Effect,
  type Gender,
  type MemoryRecord,
  type Npc,
  type NpcId,
  type Primary,
  type ResultView,
  type State,
} from "./types";

export const SAVE_KEY = "hklife-p01-v12";
export const LEGACY_SAVE_KEY = "hklife-p01-v11";
export const SCHEMA_VERSION = 2;

export type SaveEnvelope = {
  schemaVersion: 2;
  savedAt: string;
  state: State;
};

const PRIMARY_LABEL: Record<keyof Primary, string> = {
  STAT_MIND: "機靈",
  STAT_STR: "力量",
  STAT_GRIT: "毅力",
  STAT_VIT: "體質",
  STAT_SPEECH: "口才",
  STAT_COURAGE: "膽識",
  STAT_FATE: "運氣",
};

const DERIVED_LABEL: Record<keyof Derived, string> = {
  STATE_HEALTH: "健康",
  STATE_MOOD: "心情",
  STATE_STRESS: "壓力",
  VALUE_DREAM: "想做",
  VALUE_REALITY: "要做",
  STATE_PEACE: "心安",
  STATE_FAMILY_HARMONY: "屋企",
  STATE_GLOBAL_NETWORK: "熟人",
  INDEPENDENT_THOUGHT: "自己諗",
};

const COUNTER_LABEL: Partial<Record<keyof Counters, string>> = {
  NPC_MOM_STRESS: "阿媽攰",
  WORLD_DAD_WORK_OCCURRENCES: "阿爸返工",
  REL_LOCAL_MARKET: "街坊熟",
  COUNTER_EXPLORE: "出過門",
  ART_PROGRESS: "畫畫",
  MIND_PROGRESS: "數數",
};

const NPC_RELATION: Record<NpcId, string> = {
  NPC_DAD_01: "同阿爸",
  NPC_MOM_01: "同阿媽",
  NPC_GRAND_01: "同嫲嫲",
  NPC_AUNT_01: "同阿姨",
  NPC_FRIEND_01: "同阿傑",
  NPC_TEACH_01: "同老師",
};

const NPC_TRUST: Record<NpcId, string> = {
  NPC_DAD_01: "阿爸信你",
  NPC_MOM_01: "阿媽信你",
  NPC_GRAND_01: "嫲嫲信你",
  NPC_AUNT_01: "阿姨信你",
  NPC_FRIEND_01: "阿傑信你",
  NPC_TEACH_01: "老師信你",
};

export function freshState(seed = 198401): State {
  return {
    phase: "title",
    gender: null,
    yearIndex: 0,
    primary: { ...INITIAL_PRIMARY },
    derived: { ...INITIAL_DERIVED },
    counter: { ...INITIAL_COUNTERS },
    npc: {
      NPC_DAD_01: { relation: 62, trust: 64, available: true },
      NPC_MOM_01: { relation: 68, trust: 70, available: true },
      NPC_GRAND_01: { relation: 60, trust: 66, available: true },
      NPC_AUNT_01: { relation: 20, trust: 15, available: true },
      NPC_FRIEND_01: { relation: 0, trust: 0, available: false },
      NPC_TEACH_01: { relation: 30, trust: 30, available: false },
    },
    flags: [],
    skills: [],
    memories: [],
    seed,
    apLeft: 2,
    spent: [],
    queue: [],
    eventId: null,
    note: null,
    noteScene: null,
    result: null,
    approach: null,
    battleTries: 0,
    battle: null,
    offeredExplore: false,
    name: "",
    schemaVersion: 2,
  };
}

export function loadState(): State | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const current = localStorage.getItem(SAVE_KEY);
    if (current) return parseSave(current);
    const legacy = localStorage.getItem(LEGACY_SAVE_KEY);
    if (!legacy) return null;
    const migrated = parseSave(legacy);
    if (migrated) saveState(migrated);
    return migrated;
  } catch {
    return null;
  }
}

export function saveState(state: State) {
  if (typeof localStorage === "undefined") return;
  const envelope: SaveEnvelope = {
    schemaVersion: 2,
    savedAt: new Date().toISOString(),
    state: { ...state, schemaVersion: 2 },
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(envelope));
  localStorage.removeItem(LEGACY_SAVE_KEY);
}

export function parseSave(raw: string): State | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(data)) return null;
  if (data.schemaVersion === 2 && isRecord(data.state)) return validateState(data.state);
  if (typeof data.phase === "string") return validateState(data);
  return null;
}

export type Action =
  | { type: "hydrate"; state: State }
  | { type: "begin" }
  | { type: "gender"; gender: Gender; name: string }
  | { type: "toActivities" }
  | { type: "activity"; id: string }
  | { type: "ack" }
  | { type: "choose"; choice: Choice }
  | { type: "battleEnd"; outcome: BattleOutcome }
  | { type: "retry" }
  | { type: "settleBattle" }
  | { type: "repair"; talk: boolean }
  | { type: "explore"; go: boolean }
  | { type: "nextYear" }
  | { type: "restart" };

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "begin":
      return { ...state, phase: "gender" };
    case "gender":
      return openYear({ ...state, gender: action.gender, name: action.name.trim().slice(0, 8), yearIndex: 0 });
    case "toActivities":
      return { ...state, phase: "activities" };
    case "activity":
      return pickActivity(state, action.id);
    case "ack":
      if (state.phase === "note") {
        if (state.apLeft > 0) return { ...state, phase: "activities", note: null };
        return openNext({ ...state, note: null });
      }
      if (state.phase === "result") return openNext({ ...state, result: null });
      return state;
    case "choose":
      return choose(state, action.choice);
    case "battleEnd":
      return onBattleEnd(state, action.outcome);
    case "retry":
      return { ...state, phase: "battle", battleTries: state.battleTries + 1, battle: null };
    case "settleBattle":
      return settleBattle(state);
    case "repair":
      return repair(state, action.talk);
    case "explore":
      return exploreOffer(state, action.go);
    case "nextYear":
      if (state.yearIndex >= YEARS.length - 1) return { ...state, phase: "ending" };
      return openYear({ ...state, yearIndex: state.yearIndex + 1 });
    case "restart":
      return freshState(Math.floor(Math.random() * 1_000_000_000));
    default:
      return state;
  }
}

function openYear(state: State): State {
  const year = YEARS[state.yearIndex];
  const counter = { ...state.counter };
  if (year.year === 1986) counter.WORLD_DAD_WORK_OCCURRENCES = Math.max(2, counter.WORLD_DAD_WORK_OCCURRENCES);
  return {
    ...state,
    counter,
    phase: "year",
    apLeft: 2,
    spent: [],
    queue: buildQueue(state.yearIndex, state.seed),
    eventId: null,
    note: null,
    noteScene: null,
    result: null,
    approach: state.yearIndex === 0 ? null : state.approach,
    battleTries: 0,
    battle: null,
    offeredExplore: false,
  };
}

function pickActivity(state: State, id: string): State {
  const activity = ACTIVITIES[id];
  if (!activity || state.apLeft <= 0 || state.spent.includes(id)) return state;
  const applied = applyEffect(state, activity.effect);
  return {
    ...applied.state,
    phase: "note",
    apLeft: state.apLeft - 1,
    spent: [...state.spent, id],
    note: activity.blurb,
    noteScene: activity.scene,
    result: { text: activity.blurb, deltas: applied.deltas, skills: applied.skills },
  };
}

const LEAN_AFTER = {
  dream: "你今日比較想做自己鍾意嘅嘢。",
  reality: "你今日比較跟住要做嘅嘢。",
  balance: "你今日兩邊都想要。",
  think: "你今日停低諗咗一句。",
} as const;

function choose(state: State, choice: Choice): State {
  const variant = state.eventId ? variantOf(state.eventId, state) : "base";
  const applied = applyEffect(state, choice.effect);
  let next = applied.state;
  if (choice.memory && state.eventId) {
    const year = yearOf(state);
    const record: MemoryRecord = {
      ...choice.memory,
      variant,
      year: year.year,
      age: year.age,
      snapshot: snapshotOf(next),
    };
    next = { ...next, memories: upsertMemory(next.memories, record) };
  }
  if (choice.memory?.id === "MEM_DAD_WORK") {
    const response = choice.id === "A" ? 1 : choice.id === "B" ? 2 : 3;
    next = { ...next, counter: { ...next.counter, PLAYER_DAD_CHOICE_RESPONSE: response } };
  }
  if (choice.battle) {
    return {
      ...next,
      phase: "battle",
      approach: choice.battle,
      battleTries: 0,
      battle: null,
      result: { text: choice.result, deltas: applied.deltas, skills: applied.skills, lean: LEAN_AFTER[choice.tendency] },
    };
  }
  if (choice.repair) {
    return { ...next, phase: "repair", result: { text: choice.result, deltas: applied.deltas, skills: applied.skills, lean: LEAN_AFTER[choice.tendency] } };
  }
  return { ...next, phase: "result", result: { text: choice.result, deltas: applied.deltas, skills: applied.skills, lean: LEAN_AFTER[choice.tendency] } };
}

function onBattleEnd(state: State, outcome: BattleOutcome): State {
  const failed = outcome.kind === "fail" || outcome.kind === "bad";
  if (failed && state.battleTries < 1) {
    return { ...state, phase: "battle-result", battle: outcome };
  }
  return settleBattle({ ...state, battle: outcome });
}

function settleBattle(state: State): State {
  const approach: Approach = state.approach ?? "safe";
  const kind = state.battle?.kind ?? "fail";
  const story = battleStory(kind, approach);
  const applied = applyEffect(state, story.effect);
  const year = yearOf(state);
  const record: MemoryRecord = {
    id: "MEM_FIRST_SCHOOL",
    eventId: "EVT_1985_SCHOOL_01",
    choiceId: `${approach}_${kind}`,
    variant: `${approach}_${kind}`,
    year: year.year,
    age: year.age,
    npc: "NPC_TEACH_01",
    emotion: story.emotion,
    weight: story.weight,
    echo: story.echo,
    snapshot: snapshotOf(applied.state),
  };
  const withMemory: State = { ...applied.state, memories: upsertMemory(applied.state.memories, record) };
  const prior = state.result;
  return {
    ...withMemory,
    phase: "result",
    result: {
      text: story.text,
      deltas: [...(prior?.deltas ?? []), ...applied.deltas],
      skills: [...(prior?.skills ?? []), ...applied.skills],
    },
  };
}

function repair(state: State, talk: boolean): State {
  const prior = state.result;
  const applied = applyEffect(
    state,
    talk
      ? { derived: { STATE_FAMILY_HARMONY: 2, STATE_STRESS: 1 }, flags: ["FLAG_REPAIR_TALK"] }
      : { derived: { STATE_FAMILY_HARMONY: -1, STATE_PEACE: 1 }, flags: ["FLAG_REPAIR_SILENT"] },
  );
  const text = talk
    ? "你講俾阿媽聽。佢拉住你一陣，冇再鬧。屋企近咗，但你個心緊咗。"
    : "你唔講，自己瞓。少咗場鬧，個心靜返，但屋企少咗一句。";
  return {
    ...applied.state,
    phase: "result",
    result: {
      text,
      deltas: [...(prior?.deltas ?? []), ...applied.deltas],
      skills: prior?.skills ?? [],
    },
  };
}

function exploreOffer(state: State, go: boolean): State {
  if (!go) {
    const applied = applyEffect(state, { flags: ["FLAG_GATE_DECLINED"] });
    const year = yearOf(state);
    const record: MemoryRecord = {
      id: "MEM_FIRST_INDEPENDENCE",
      eventId: "EVT_1986_ECHO_08",
      choiceId: "skip",
      variant: "declined",
      year: year.year,
      age: year.age,
      npc: "NPC_MOM_01",
      emotion: "stay",
      weight: 2,
      echo: "十年後你記得自己可以去，但你留喺屋企。",
      snapshot: snapshotOf(applied.state),
    };
    return {
      ...applied.state,
      memories: upsertMemory(applied.state.memories, record),
      offeredExplore: true,
      phase: "result",
      result: { text: "你留喺屋企。行到走廊盡頭先會發生嘅事，你自己揀咗唔去。", deltas: applied.deltas, skills: [] },
    };
  }
  const applied = applyEffect(state, {
    counter: { COUNTER_EXPLORE: 1 },
    derived: { STATE_MOOD: 2, STATE_STRESS: 1 },
  });
  const enough = applied.state.counter.COUNTER_EXPLORE >= 2;
  return {
    ...applied.state,
    offeredExplore: false,
    phase: "result",
    result: {
      text: enough ? "你再落咗一次平台。行到邨口，跟住嗰件事先至發生。" : "你落咗一次平台。仲差一次，先至行到邨口。冇人逼你再去。",
      deltas: applied.deltas,
      skills: [],
    },
  };
}

function openNext(state: State): State {
  const queue = [...state.queue];
  while (queue.length) {
    const id = queue[0];
    if (id === "EVT_1986_ECHO_08" && state.counter.COUNTER_EXPLORE < 2) {
      const declined = state.flags.includes("FLAG_GATE_DECLINED") || state.memories.some((item) => item.id === "MEM_FIRST_INDEPENDENCE" && item.choiceId === "skip");
      if (!declined) {
        return { ...state, phase: "explore-offer", queue, eventId: null, result: null, note: null };
      }
      queue.shift();
      continue;
    }
    queue.shift();
    return { ...state, phase: "event", queue, eventId: id, result: null, note: null, noteScene: null };
  }
  return yearEnd({ ...state, queue });
}

function yearEnd(state: State): State {
  const counter = { ...state.counter, NPC_MOM_STRESS: clamp(state.counter.NPC_MOM_STRESS - 2, 0, 100) };
  const year = yearOf(state);
  if (year.year === 1985) counter.WORLD_DAD_WORK_OCCURRENCES = clamp(counter.WORLD_DAD_WORK_OCCURRENCES + 1, 0, 99);
  const derived = { ...state.derived };
  if (derived.STATE_STRESS >= 80) {
    derived.STATE_MOOD = clamp(derived.STATE_MOOD - 3, 0, 100);
    derived.STATE_HEALTH = clamp(derived.STATE_HEALTH - 2, 0, 100);
  }
  return { ...state, counter, derived, phase: "year-end", eventId: null, queue: [], result: null, note: null };
}

function snapshotOf(state: State): NonNullable<MemoryRecord["snapshot"]> {
  return {
    dream: state.derived.VALUE_DREAM,
    reality: state.derived.VALUE_REALITY,
    family: state.derived.STATE_FAMILY_HARMONY,
  };
}

function upsertMemory(list: MemoryRecord[], record: MemoryRecord) {
  const rest = list.filter((item) => item.id !== record.id);
  return [...rest, record];
}

export function applyEffect(state: State, effect: Effect): { state: State; deltas: Delta[]; skills: string[] } {
  const deltas: Delta[] = [];
  const primary = { ...state.primary };
  const derived = { ...state.derived };
  const counter = { ...state.counter };
  const npc: State["npc"] = {
    NPC_DAD_01: { ...state.npc.NPC_DAD_01 },
    NPC_MOM_01: { ...state.npc.NPC_MOM_01 },
    NPC_GRAND_01: { ...state.npc.NPC_GRAND_01 },
    NPC_AUNT_01: { ...state.npc.NPC_AUNT_01 },
    NPC_FRIEND_01: { ...state.npc.NPC_FRIEND_01 },
    NPC_TEACH_01: { ...state.npc.NPC_TEACH_01 },
  };
  for (const [key, value] of Object.entries(effect.primary ?? {}) as [keyof Primary, number][]) {
    const before = primary[key];
    primary[key] = clamp(before + value, 0, 10);
    pushDelta(deltas, PRIMARY_LABEL[key], primary[key] - before);
  }
  for (const [key, value] of Object.entries(effect.derived ?? {}) as [keyof Derived, number][]) {
    const before = derived[key];
    derived[key] = clamp(before + value, 0, 100);
    pushDelta(deltas, DERIVED_LABEL[key], derived[key] - before);
  }
  for (const [key, value] of Object.entries(effect.counter ?? {}) as [keyof Counters, number][]) {
    const before = counter[key];
    const max = key === "WORLD_DAD_WORK_OCCURRENCES" || key === "PLAYER_DAD_CHOICE_RESPONSE" || key === "COUNTER_EXPLORE" ? 99 : key.endsWith("PROGRESS") ? 10 : 100;
    const min = key.endsWith("PROGRESS") ? 0 : 0;
    counter[key] = clamp(before + value, min, max);
    const label = COUNTER_LABEL[key];
    if (label) pushDelta(deltas, label, counter[key] - before);
  }
  for (const [id, patch] of Object.entries(effect.npc ?? {}) as [NpcId, Partial<Npc>][]) {
    const current = npc[id];
    if (patch.relation) {
      const before = current.relation;
      current.relation = clamp(before + patch.relation, 0, 100);
      pushDelta(deltas, NPC_RELATION[id], current.relation - before);
    }
    if (patch.trust) {
      const before = current.trust;
      current.trust = clamp(before + patch.trust, 0, 100);
      pushDelta(deltas, NPC_TRUST[id], current.trust - before);
    }
    if (patch.available !== undefined) current.available = patch.available;
  }
  const flags = [...state.flags];
  for (const flag of effect.flags ?? []) {
    if (!flags.includes(flag) && !flag.startsWith("MEM_")) flags.push(flag);
  }
  const skills = [...state.skills];
  const gained: string[] = [];
  for (const skill of effect.skills ?? []) {
    if (!skills.includes(skill)) {
      skills.push(skill);
      gained.push(SKILL_NAME[skill] ?? skill);
    }
  }
  return { state: { ...state, primary, derived, counter, npc, flags, skills }, deltas, skills: gained };
}

function pushDelta(deltas: Delta[], label: string, value: number) {
  if (value !== 0) deltas.push({ label, value });
}

export function canRetry(state: State) {
  const kind = state.battle?.kind;
  return state.battleTries < 1 && (kind === "fail" || kind === "bad");
}

const PHASES = new Set(["title", "gender", "year", "activities", "note", "event", "battle", "battle-result", "result", "repair", "explore-offer", "year-end", "ending"]);
const SCENES = new Set(["home", "kindy", "corridor", "market", "estate"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function savedDeltas(value: unknown): Delta[] {
  if (!Array.isArray(value)) return [];
  const deltas: Delta[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    if (typeof item.label !== "string" || typeof item.value !== "number") continue;
    deltas.push({ label: item.label, value: item.value });
  }
  return deltas;
}

function savedResult(raw: Record<string, unknown>): ResultView | null {
  if (!isRecord(raw.result) || typeof raw.result.text !== "string") return null;
  const lean = raw.result.lean;
  return {
    text: raw.result.text,
    deltas: savedDeltas(raw.result.deltas),
    skills: strings(raw.result.skills),
    lean: typeof lean === "string" ? lean : undefined,
  };
}

export function validateState(raw: Record<string, unknown>): State | null {
  if (typeof raw.phase !== "string" || !PHASES.has(raw.phase) || !isRecord(raw.primary) || !isRecord(raw.derived)) return null;
  const base = freshState();
  const primary = { ...base.primary };
  for (const key of Object.keys(base.primary) as (keyof Primary)[]) {
    const value = raw.primary[key];
    if (typeof value === "number" && Number.isFinite(value)) primary[key] = value;
  }
  const derived = { ...base.derived };
  for (const key of Object.keys(base.derived) as (keyof Derived)[]) {
    const value = raw.derived[key];
    if (typeof value === "number" && Number.isFinite(value)) derived[key] = value;
  }
  const counter = { ...base.counter };
  const legacyCounter = isRecord(raw.counter) ? raw.counter : {};
  for (const key of Object.keys(base.counter) as (keyof Counters)[]) {
    const value = legacyCounter[key];
    if (typeof value === "number" && Number.isFinite(value)) counter[key] = value;
  }
  if (typeof legacyCounter.WORLD_DAD_WORK_OCCURRENCES !== "number" && typeof legacyCounter.NPC_DAD_OVERTIME_COUNT === "number") {
    counter.WORLD_DAD_WORK_OCCURRENCES = legacyCounter.NPC_DAD_OVERTIME_COUNT;
  }
  const npc = { ...base.npc };
  if (isRecord(raw.npc)) {
    for (const id of Object.keys(base.npc) as NpcId[]) {
      const patch = raw.npc[id];
      if (!isRecord(patch)) continue;
      npc[id] = {
        relation: typeof patch.relation === "number" ? patch.relation : base.npc[id].relation,
        trust: typeof patch.trust === "number" ? patch.trust : base.npc[id].trust,
        available: typeof patch.available === "boolean" ? patch.available : base.npc[id].available,
      };
    }
  }
  const memories = Array.isArray(raw.memories)
    ? raw.memories.filter(isRecord).flatMap((item) => {
        if (typeof item.id !== "string" || !item.id) return [];
        const snapshot = isRecord(item.snapshot)
          ? {
              dream: typeof item.snapshot.dream === "number" ? item.snapshot.dream : derived.VALUE_DREAM,
              reality: typeof item.snapshot.reality === "number" ? item.snapshot.reality : derived.VALUE_REALITY,
              family: typeof item.snapshot.family === "number" ? item.snapshot.family : derived.STATE_FAMILY_HARMONY,
            }
          : { dream: derived.VALUE_DREAM, reality: derived.VALUE_REALITY, family: derived.STATE_FAMILY_HARMONY };
        const record: MemoryRecord = {
          id: item.id,
          eventId: typeof item.eventId === "string" ? item.eventId : "",
          choiceId: typeof item.choiceId === "string" ? item.choiceId : "",
          variant: typeof item.variant === "string" ? item.variant : "base",
          year: typeof item.year === "number" ? item.year : 1984,
          age: typeof item.age === "number" ? item.age : 3,
          npc: typeof item.npc === "string" ? item.npc : "",
          emotion: typeof item.emotion === "string" ? item.emotion : "",
          weight: typeof item.weight === "number" ? item.weight : 1,
          echo: typeof item.echo === "string" ? item.echo : "",
          snapshot,
        };
        return [record];
      })
    : [];
  return {
    ...base,
    phase: raw.phase as State["phase"],
    gender: raw.gender === "boy" || raw.gender === "girl" ? raw.gender : null,
    yearIndex: typeof raw.yearIndex === "number" ? clamp(raw.yearIndex, 0, 2) : 0,
    primary,
    derived,
    counter,
    npc,
    flags: strings(raw.flags),
    skills: strings(raw.skills),
    memories,
    seed: typeof raw.seed === "number" ? raw.seed : base.seed,
    apLeft: typeof raw.apLeft === "number" ? raw.apLeft : 2,
    spent: strings(raw.spent),
    queue: strings(raw.queue),
    eventId: typeof raw.eventId === "string" ? raw.eventId : null,
    note: typeof raw.note === "string" ? raw.note : null,
    noteScene: typeof raw.noteScene === "string" && SCENES.has(raw.noteScene) ? (raw.noteScene as State["noteScene"]) : null,
    result: savedResult(raw),
    approach: raw.approach === "social" || raw.approach === "safe" || raw.approach === "curious" ? raw.approach : null,
    battleTries: typeof raw.battleTries === "number" ? raw.battleTries : 0,
    battle:
      isRecord(raw.battle) && (raw.battle.kind === "perfect" || raw.battle.kind === "win" || raw.battle.kind === "fail" || raw.battle.kind === "bad")
        ? { kind: raw.battle.kind, stress: typeof raw.battle.stress === "number" ? raw.battle.stress : 0, hp: typeof raw.battle.hp === "number" ? raw.battle.hp : 0 }
        : null,
    offeredExplore: raw.offeredExplore === true,
    name: typeof raw.name === "string" ? raw.name.slice(0, 8) : "",
    schemaVersion: 2,
  };
}
