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

export const SAVE_KEY = "hklife-p01-v11";

const PRIMARY_LABEL: Record<keyof Primary, string> = {
  STAT_MIND: "機靈",
  STAT_STR: "力量",
  STAT_GRIT: "毅力",
  STAT_VIT: "體質",
  STAT_SPEECH: "口才",
  STAT_COURAGE: "膽識",
  STAT_FATE: "福緣",
};

const DERIVED_LABEL: Record<keyof Derived, string> = {
  STATE_HEALTH: "健康",
  STATE_MOOD: "心情",
  STATE_STRESS: "壓力",
  VALUE_DREAM: "夢想",
  VALUE_REALITY: "現實",
  STATE_PEACE: "心安",
  STATE_FAMILY_HARMONY: "家庭",
  STATE_GLOBAL_NETWORK: "人脈",
  INDEPENDENT_THOUGHT: "獨立思考",
};

const COUNTER_LABEL: Partial<Record<keyof Counters, string>> = {
  NPC_MOM_STRESS: "阿媽攰",
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
  };
}

export function loadState(): State | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as State;
    if (!data || typeof data.phase !== "string" || !data.derived || !data.primary) return null;
    if (typeof data.name !== "string") data.name = "";
    return data;
  } catch {
    return null;
  }
}

export function saveState(state: State) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
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
  if (year.year === 1986) counter.NPC_DAD_OVERTIME_COUNT = Math.max(1, counter.NPC_DAD_OVERTIME_COUNT);
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
  dream: "你今日偏向跟住想做嘅事。",
  reality: "你今日偏向跟住要做嘅事。",
  balance: "你今日兩邊都拖住少少。",
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
  if (talk) {
    return {
      ...state,
      phase: "result",
      result: {
        text: "今晚阿媽問你點解行到門口。你講俾佢聽。佢聽完，冇再加一句罰。",
        deltas: prior?.deltas ?? [],
        skills: prior?.skills ?? [],
      },
    };
  }
  const applied = applyEffect(state, { derived: { STATE_FAMILY_HARMONY: -1 } });
  return {
    ...applied.state,
    phase: "result",
    result: {
      text: "你唔講，自己瞓。阿媽喺廳等咗一陣。呢晚屋企少咗一句。",
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
      result: { text: "你留喺屋企。走廊盡頭嗰件事，你自己揀咗唔去。", deltas: applied.deltas, skills: [] },
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
      text: enough ? "你再落咗一次平台。你行到邨口，件事先至發生。" : "你落咗一次平台。仲差一次，先至行到邨口。冇人逼你再去。",
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
    const max = key === "NPC_DAD_OVERTIME_COUNT" || key === "COUNTER_EXPLORE" ? 99 : key.endsWith("PROGRESS") ? 10 : 100;
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
