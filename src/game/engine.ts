import { ACTIVITIES, battleStory, buildQueue, examStory, fifteenAct, knownEventIds, knownMemoryChoice, SKILL_NAME, variantOf, YEARS, yearOf, type Choice } from "./content";
import { MISSED_IDS, produce1985, produce1986, advanceChain, afternoonTags, freshChain } from "./freedom";
import { beat1985, isBeat } from "./story";
import { WORLD_1985, collide, tickKit } from "./world";
import { BATTLE_SPECS, battleSpecById, battleSpecFor } from "./battleSpec";
import {
  clamp,
  COUNTER_RANGE,
  DERIVED_RANGE,
  INITIAL_COUNTERS,
  INITIAL_DERIVED,
  INITIAL_PRIMARY,
  NPC_STAT_RANGE,
  PRIMARY_RANGE,
  BATTLE_TRIES_RANGE,
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
import { FLAG_LEDGER, INDEX_LEDGER, RETIRED_FLAGS, TAG_LEDGER } from "./ledger";
import { catalogGear, EQUIPMENT_CATALOG, questOf, TECHNIQUE_CATALOG, techniquesForSkills } from "./catalog";

export const SAVE_KEY = "hklife-p01-v12";
export const LEGACY_SAVE_KEY = "hklife-p01-v11";
export const SCHEMA_VERSION = 3;

export type SaveEnvelope = {
  schemaVersion: 2 | 3;
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
  STATE_FAMILY_HARMONY: "家裡",
  STATE_GLOBAL_NETWORK: "熟人",
  INDEPENDENT_THOUGHT: "自己想",
};

const COUNTER_LABEL: Partial<Record<keyof Counters, string>> = {
  NPC_MOM_STRESS: "媽媽累",
  WORLD_DAD_WORK_OCCURRENCES: "爸爸上班",
  REL_LOCAL_MARKET: "街坊熟",
  COUNTER_EXPLORE: "出過門",
  ART_PROGRESS: "畫畫",
  MIND_PROGRESS: "數數",
};

const NPC_RELATION: Record<NpcId, string> = {
  NPC_DAD_01: "和爸爸",
  NPC_MOM_01: "和媽媽",
  NPC_GRAND_01: "和嫲嫲",
  NPC_AUNT_01: "和阿姨",
  NPC_FRIEND_01: "和阿傑",
  NPC_TEACH_01: "和老師",
};

const NPC_TRUST: Record<NpcId, string> = {
  NPC_DAD_01: "爸爸信任你",
  NPC_MOM_01: "媽媽信任你",
  NPC_GRAND_01: "嫲嫲信任你",
  NPC_AUNT_01: "阿姨信任你",
  NPC_FRIEND_01: "阿傑信任你",
  NPC_TEACH_01: "老師信任你",
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
    npcDays: {},
    flags: [],
    personalityTags: [],
    skills: [],
    equipment: [],
    equipped: [],
    techniques: [],
    techniqueProgress: {},
    memories: [],
    seed,
    apLeft: 2,
    spent: [],
    missed: [],
    chain: freshChain(),
    queue: [],
    eventId: null,
    note: null,
    noteScene: null,
    result: null,
    approach: null,
    battleSpecId: null,
    battleTries: 0,
    battle: null,
    offeredExplore: false,
    name: "",
    schemaVersion: 3,
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
    schemaVersion: 3,
    savedAt: new Date().toISOString(),
    state: { ...state, schemaVersion: 3 },
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
  if ((data.schemaVersion === 2 || data.schemaVersion === 3) && isRecord(data.state)) return validateState(data.state);
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
  | { type: "fifteenAct" }
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
      if (yearOf(state).year === 1985 && state.phase === "year" && state.spent.length === 0) {
        return { ...state, phase: "story", note: "open", eventId: null, result: null };
      }
      return finishEcho({ ...state, phase: "activities" });
    case "activity":
      return pickActivity(state, action.id);
    case "ack":
      if (state.phase === "story") return advanceStory(state);
      if (state.phase === "note") {
        if (yearOf(state).year === 1985 && (state.spent.length === 1 || state.spent.length === 2)) {
          return begin1985Day(state, state.spent.length === 1 ? "sat" : "sun");
        }
        if (state.apLeft > 0) return { ...state, phase: "activities", note: null };
        return openNext(produceIfNeeded({ ...state, note: null }));
      }
      if (state.phase === "result") return openNext({ ...state, result: null });
      if (state.phase === "fifteen") return commitFifteen(state);
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
      if (state.yearIndex >= YEARS.length - 1) return { ...state, phase: "fifteen" };
      return openYear({ ...state, yearIndex: state.yearIndex + 1 });
    case "fifteenAct":
      return commitFifteen(state);
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
    queue: year?.year === 1985 || year?.year === 1986 ? [] : buildQueue(state.yearIndex, state.seed),
    chain: openChain(state, year?.year ?? 0),
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
  const year = yearOf(state).year;
  const saturday = state.spent.length === 0;
  const momThere = id === "ACT_MARKET" && ((year !== 1985 && year !== 1986) || saturday);
  const base = applyEffect(state, activity.effect);
  const applied = momThere
    ? applyEffect(base.state, { counter: { REL_LOCAL_MARKET: 5, NPC_MOM_STRESS: -3 }, npc: { NPC_MOM_01: { trust: 1 } } })
    : base;
  const blurb =
    id === "ACT_MARKET" && momThere
      ? "你拉著媽媽。那天地面很濕，魚檔的水滲進鞋子。"
      : id === "ACT_MARKET"
        ? "你去了街市。地面很濕，魚檔的水滲進鞋子。媽媽不在。"
        : activity.blurb;
  return {
    ...applied.state,
    phase: "note",
    apLeft: state.apLeft - 1,
    spent: [...state.spent, id],
    note: blurb,
    noteScene: activity.scene,
    result: { text: blurb, deltas: applied.deltas, skills: applied.skills },
  };
}

function choose(state: State, choice: Choice): State {
  const variant = state.eventId ? variantOf(state.eventId, state) : "base";
  const applied = applyEffect(state, choice.effect);
  let next = applied.state;
  if (state.eventId) next = { ...next, chain: advanceChain(next.chain, state.eventId, choice.id) };
  if (choice.memory && state.eventId) {
    const year = yearOf(state);
    const record: MemoryRecord = {
      ...choice.memory,
      memoryTypeId: choice.memory.id,
      instanceId: `${choice.memory.id}_${year.year}`,
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
    if (!choice.specId) console.error(`[battle] ${state.eventId ?? "event"} choice ${choice.id} has no specId; using kindergarten door`);
    return {
      ...next,
      phase: "battle",
      approach: choice.battle,
      battleSpecId: choice.specId ?? "BTL_KINDY_DOOR",
      battleTries: 0,
      battle: null,
      result: { text: choice.result, deltas: applied.deltas, skills: applied.skills },
    };
  }
  if (choice.repair) {
    return { ...next, phase: "repair", result: { text: choice.result, deltas: applied.deltas, skills: applied.skills } };
  }
  return { ...next, phase: "result", result: { text: choice.result, deltas: applied.deltas, skills: applied.skills } };
}

function onBattleEnd(state: State, outcome: BattleOutcome): State {
  const failed = outcome.kind === "fail" || outcome.kind === "bad";
  if (failed && state.battleTries < 1) {
    return { ...state, phase: "battle-result", battle: outcome };
  }
  return settleBattle({ ...state, battle: outcome });
}

function settleBattle(state: State): State {
  const spec = battleSpecById(state.battleSpecId);
  if (spec.settlement === "exam") return settleExam(state);
  const approach: Approach = state.approach ?? "safe";
  const kind = state.battle?.kind ?? "fail";
  const story = battleStory(kind, approach);
  const applied = applyEffect(state, story.effect);
  const year = yearOf(state);
  const record: MemoryRecord = {
    id: "MEM_FIRST_SCHOOL",
    memoryTypeId: "MEM_FIRST_SCHOOL",
    instanceId: `MEM_FIRST_SCHOOL_${year.year}`,
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
    battleSpecId: null,
    result: {
      text: story.text,
      deltas: [...(prior?.deltas ?? []), ...applied.deltas],
      skills: [...(prior?.skills ?? []), ...applied.skills],
    },
  };
}

function settleExam(state: State): State {
  const kind = state.battle?.kind ?? "fail";
  const story = examStory(kind);
  const applied = applyEffect(state, story.effect);
  const year = yearOf(state);
  const approach: Approach = state.approach ?? "safe";
  const record: MemoryRecord = {
    id: "MEM_EXAM_PAPER",
    memoryTypeId: "MEM_EXAM_PAPER",
    instanceId: `MEM_EXAM_PAPER_${year.year}`,
    eventId: "EVT_1988_EXAM_01",
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
    battleSpecId: null,
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
    ? "你告訴媽媽。她拉了你一會兒，沒有再罵。家裡近了，但你心裡緊了。"
    : "你不說，自己去睡。少了一場責罵，心靜下來，但家裡少了一句。";
  return {
    ...applied.state,
    phase: "result",
    battleSpecId: null,
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
      memoryTypeId: "MEM_FIRST_INDEPENDENCE",
      instanceId: `MEM_FIRST_INDEPENDENCE_${year.year}_skip`,
      eventId: "EVT_1986_ECHO_08",
      choiceId: "skip",
      variant: "declined",
      year: year.year,
      age: year.age,
      npc: "NPC_MOM_01",
      emotion: "stay",
      weight: 2,
      echo: "十年後你記得自己可以去，但你留在家裡。",
      snapshot: snapshotOf(applied.state),
    };
    return {
      ...applied.state,
      memories: upsertMemory(applied.state.memories, record),
      offeredExplore: true,
      phase: "result",
      battleSpecId: null,
      result: { text: "你留在家裡。走到走廊盡頭才會發生的事，你自己選了不去。", deltas: applied.deltas, skills: [] },
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
    battleSpecId: null,
    result: {
      text: enough ? "你再下了一次平台。走到屋邨門口，接著那件事才發生。" : "你下了一次平台。還差一次，才走到屋邨門口。沒有人逼你再去。",
      deltas: applied.deltas,
      skills: [],
    },
  };
}

function advanceStory(state: State): State {
  if (state.note === "open") return { ...state, phase: "activities", note: null };
  if (state.note === "sat-night") return { ...state, phase: "activities", note: null, apLeft: 1 };
  if (state.note === "sun-night") return { ...state, phase: "story", note: "monday", result: null };
  if (state.note === "monday") return { ...state, phase: "event", eventId: "EVT_1985_SCHOOL_01", note: null, queue: [], result: null };
  if (state.note === "aftermath") return yearEnd({ ...state, note: null });
  return yearEnd(state);
}

function begin1985Day(state: State, day: "sat" | "sun"): State {
  const world = {
    sat: [...WORLD_1985.sat, { npcId: "TV", place: "home" as const, eventId: "MINI_85_TV" }],
    sun: [...WORLD_1985.sun, { npcId: "TV", place: "home" as const, eventId: "MINI_85_TV" }],
    weather: WORLD_1985.weather,
  };
  const activity = state.spent[day === "sat" ? 0 : 1] ?? "";
  let ids = collide(day, activity, world, "MINI_85_RAIN");
  if (day === "sun") {
    const earlier = collide("sat", state.spent[0] ?? "", world, "MINI_85_RAIN");
    ids = ids.filter((id) => id === "MINI_QUIET" || !earlier.includes(id));
    if (state.npcDays.NPC_FRIEND_01?.nextPlan === "seek") {
      ids = ids.filter((id) => id !== "MINI_85_RAIN" && id !== "MINI_QUIET");
      ids.unshift("MINI_85_KIT_WAIT");
    }
  }
  let missed = state.missed;
  let personalityTags = state.personalityTags;
  let chain = state.chain;
  if (day === "sat" && chain.stage < 1) chain = { ...chain, stage: 1, status: "active" };
  if (day === "sun") {
    const produced = produce1985(state.spent);
    missed = [...missed];
    for (const id of produced.missed) if (!missed.includes(id)) missed.push(id);
    for (const tag of afternoonTags(state.spent)) if (!personalityTags.includes(tag)) personalityTags = [...personalityTags, tag];
  }
  return openNext({ ...state, queue: ids, missed, personalityTags, chain, note: null, result: null });
}

function openChain(state: State, year: number): State["chain"] {
  if (year === 1985 && state.chain.stage === 0) return { ...state.chain, status: "available" };
  if (year === 1986 && state.chain.stage === 4 && state.chain.status === "delayed") return { ...state.chain, status: "recovered" };
  return state.chain;
}

function finishEcho(state: State): State {
  if (yearOf(state).year !== 1986 || state.chain.stage !== 4) return state;
  return { ...state, chain: { ...state.chain, stage: 5, status: "completed" } };
}

function produceIfNeeded(state: State): State {
  const year = yearOf(state).year;
  if ((year !== 1985 && year !== 1986) || state.queue.length > 0) return state;
  const produced = year === 1985 ? produce1985(state.spent) : produce1986(state.spent);
  const missed = [...state.missed];
  for (const id of produced.missed) if (!missed.includes(id)) missed.push(id);
  const personalityTags = [...state.personalityTags];
  for (const tag of afternoonTags(state.spent)) if (!personalityTags.includes(tag)) personalityTags.push(tag);
  const chain = year === 1985 && state.chain.stage < 1 ? { ...state.chain, stage: 1, status: "active" as const } : state.chain;
  return { ...state, queue: produced.queue, missed, personalityTags, chain };
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
  return after1985(state);
}

function after1985(state: State): State {
  if (yearOf(state).year !== 1985) return yearEnd({ ...state, queue: [] });
  const school = state.memories.some((item) => item.eventId === "EVT_1985_SCHOOL_01");
  if (school) return { ...state, phase: "story", note: "aftermath", queue: [], eventId: null, result: null };
  if (state.spent.length === 1) {
    const npcDays = state.npcDays.NPC_FRIEND_01
      ? state.npcDays
      : { ...state.npcDays, NPC_FRIEND_01: tickKit(state.memories) };
    return { ...state, npcDays, phase: "story", note: "sat-night", queue: [], eventId: null, result: null };
  }
  if (state.spent.length === 2) return { ...state, phase: "story", note: "sun-night", queue: [], eventId: null, result: null };
  return yearEnd({ ...state, queue: [] });
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
  let chain = state.chain;
  if (year.year === 1985) {
    chain = { ...state.chain, stage: Math.max(state.chain.stage, 4), status: state.missed.length > 0 ? "delayed" : state.chain.status === "locked" ? "active" : state.chain.status };
  }
  return { ...state, counter, derived, chain, phase: "year-end", eventId: null, queue: [], result: null, note: null };
}

function commitFifteen(state: State): State {
  if (state.phase !== "fifteen") return state;
  const act = fifteenAct(state);
  const record: MemoryRecord = {
    id: "MEM_FIFTEEN",
    memoryTypeId: "MEM_FIFTEEN",
    instanceId: "MEM_FIFTEEN_1996",
    eventId: "EVT_1996",
    choiceId: act.id,
    variant: act.id,
    year: 1996,
    age: 15,
    npc: "NPC_MOM_01",
    emotion: "return",
    weight: 2,
    echo: act.line,
    snapshot: snapshotOf(state),
  };
  return { ...state, phase: "ending", memories: upsertMemory(state.memories, record), eventId: null, queue: [] };
}

function snapshotOf(state: State): NonNullable<MemoryRecord["snapshot"]> {
  return {
    dream: state.derived.VALUE_DREAM,
    reality: state.derived.VALUE_REALITY,
    family: state.derived.STATE_FAMILY_HARMONY,
  };
}

function upsertMemory(list: MemoryRecord[], record: MemoryRecord) {
  const memoryTypeId = record.memoryTypeId ?? record.id;
  const instanceId = record.instanceId ?? `${memoryTypeId}_${record.year}`;
  const next = { ...record, id: memoryTypeId, memoryTypeId, instanceId };
  return [...list.filter((item) => (item.instanceId ?? `${item.memoryTypeId ?? item.id}_${item.year}`) !== instanceId), next];
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
    const max = COUNTER_RANGE[key].max;
    const min = COUNTER_RANGE[key].min;
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
  const personalityTags = [...(state.personalityTags ?? [])];
  for (const flag of effect.flags ?? []) {
    if (flag.startsWith("TAG_")) {
      if (!personalityTags.includes(flag)) personalityTags.push(flag);
      continue;
    }
    if (!flags.includes(flag) && !flag.startsWith("MEM_")) flags.push(flag);
  }
  for (const tag of effect.tags ?? []) {
    if (!personalityTags.includes(tag)) personalityTags.push(tag);
  }
  const skills = [...state.skills];
  const gained: string[] = [];
  for (const skill of effect.skills ?? []) {
    if (!skills.includes(skill)) {
      skills.push(skill);
      gained.push(SKILL_NAME[skill] ?? skill);
    }
  }
  const equipment = [...state.equipment];
  const equipped = [...state.equipped];
  let memories = state.memories;
  const year = yearOf(state).year;
  for (const id of effect.equipment ?? []) {
    const item = catalogGear(id);
    if (!item || year < item.availableFromYear) continue;
    if (item.availableToYear !== undefined && year > item.availableToYear) continue;
    const owned = equipment.includes(id);
    if (!owned) equipment.push(id);
    const slotTaken = equipped.some((held) => catalogGear(held)?.slot === item.slot);
    if (!slotTaken && !equipped.includes(id)) equipped.push(id);
    if (!owned && item.memoryHook) {
      const quest = questOf(item.sourceQuest);
      if (quest) {
        memories = upsertMemory(memories, {
          id: item.memoryHook,
          memoryTypeId: item.memoryHook,
          instanceId: `${item.memoryHook}_${year}`,
          eventId: quest.eventId,
          choiceId: quest.choiceId,
          variant: "base",
          year,
          age: yearOf(state).age,
          npc: quest.npc,
          emotion: "kept",
          weight: 1,
          echo: quest.echo,
          snapshot: snapshotOf({ ...state, derived }),
        });
      }
    }
  }
  const techniques = techniquesForSkills(skills);
  return { state: { ...state, primary, derived, counter, npc, flags, personalityTags, skills, equipment, equipped, techniques, memories }, deltas, skills: gained };
}

function pushDelta(deltas: Delta[], label: string, value: number) {
  if (value !== 0) deltas.push({ label, value });
}

/** Own and wear stay separate. The child still auto-wears a free slot. These are for later. */
export function equipItem(state: State, id: string): State {
  const item = catalogGear(id);
  if (!item || !state.equipment.includes(id)) return state;
  const equipped = state.equipped.filter((held) => held !== id && catalogGear(held)?.slot !== item.slot);
  return { ...state, equipped: [...equipped, id] };
}

export function unequipItem(state: State, id: string): State {
  if (!state.equipped.includes(id)) return state;
  return { ...state, equipped: state.equipped.filter((held) => held !== id) };
}

export function replaceItem(state: State, id: string): State {
  return equipItem(state, id);
}

export function canRetry(state: State) {
  const kind = state.battle?.kind;
  return state.battleTries < 1 && (kind === "fail" || kind === "bad");
}

const PHASES = new Set(["title", "gender", "year", "activities", "note", "event", "battle", "battle-result", "result", "repair", "explore-offer", "year-end", "story", "fifteen", "ending"]);
const SCENES = new Set(["home", "kindy", "corridor", "market", "estate", "study"]);

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
    if (typeof value === "number" && Number.isFinite(value)) primary[key] = clamp(value, PRIMARY_RANGE.min, PRIMARY_RANGE.max);
  }
  const derived = { ...base.derived };
  for (const key of Object.keys(base.derived) as (keyof Derived)[]) {
    const value = raw.derived[key];
    if (typeof value === "number" && Number.isFinite(value)) derived[key] = clamp(value, DERIVED_RANGE.min, DERIVED_RANGE.max);
  }
  const counter = { ...base.counter };
  const legacyCounter = isRecord(raw.counter) ? raw.counter : {};
  for (const key of Object.keys(base.counter) as (keyof Counters)[]) {
    const value = legacyCounter[key];
    if (typeof value === "number" && Number.isFinite(value)) counter[key] = clamp(value, COUNTER_RANGE[key].min, COUNTER_RANGE[key].max);
  }
  if (typeof legacyCounter.WORLD_DAD_WORK_OCCURRENCES !== "number" && typeof legacyCounter.NPC_DAD_OVERTIME_COUNT === "number" && Number.isFinite(legacyCounter.NPC_DAD_OVERTIME_COUNT)) {
    counter.WORLD_DAD_WORK_OCCURRENCES = clamp(legacyCounter.NPC_DAD_OVERTIME_COUNT, COUNTER_RANGE.WORLD_DAD_WORK_OCCURRENCES.min, COUNTER_RANGE.WORLD_DAD_WORK_OCCURRENCES.max);
  }
  const npc = { ...base.npc };
  if (isRecord(raw.npc)) {
    for (const id of Object.keys(base.npc) as NpcId[]) {
      const patch = raw.npc[id];
      if (!isRecord(patch)) continue;
      npc[id] = {
        relation: typeof patch.relation === "number" && Number.isFinite(patch.relation) ? clamp(patch.relation, NPC_STAT_RANGE.min, NPC_STAT_RANGE.max) : base.npc[id].relation,
        trust: typeof patch.trust === "number" && Number.isFinite(patch.trust) ? clamp(patch.trust, NPC_STAT_RANGE.min, NPC_STAT_RANGE.max) : base.npc[id].trust,
        available: typeof patch.available === "boolean" ? patch.available : base.npc[id].available,
      };
    }
  }
  const memories = Array.isArray(raw.memories)
    ? raw.memories.filter(isRecord).flatMap((item) => {
        const id = typeof item.memoryTypeId === "string" && item.memoryTypeId ? item.memoryTypeId : typeof item.id === "string" ? item.id : "";
        const choiceId = typeof item.choiceId === "string" ? item.choiceId : "";
        const eventId = typeof item.eventId === "string" ? item.eventId : "";
        if (!id || !knownMemoryChoice(id, choiceId, eventId)) return [];
        const year = typeof item.year === "number" && Number.isFinite(item.year) ? Math.floor(item.year) : 1984;
        const snapshot = isRecord(item.snapshot)
          ? {
              dream: typeof item.snapshot.dream === "number" && Number.isFinite(item.snapshot.dream) ? clamp(item.snapshot.dream, DERIVED_RANGE.min, DERIVED_RANGE.max) : derived.VALUE_DREAM,
              reality: typeof item.snapshot.reality === "number" && Number.isFinite(item.snapshot.reality) ? clamp(item.snapshot.reality, DERIVED_RANGE.min, DERIVED_RANGE.max) : derived.VALUE_REALITY,
              family: typeof item.snapshot.family === "number" && Number.isFinite(item.snapshot.family) ? clamp(item.snapshot.family, DERIVED_RANGE.min, DERIVED_RANGE.max) : derived.STATE_FAMILY_HARMONY,
            }
          : { dream: derived.VALUE_DREAM, reality: derived.VALUE_REALITY, family: derived.STATE_FAMILY_HARMONY };
        const record: MemoryRecord = {
          id,
          memoryTypeId: id,
          instanceId: typeof item.instanceId === "string" && item.instanceId ? item.instanceId : `${id}_${year}`,
          eventId,
          choiceId,
          variant: typeof item.variant === "string" ? item.variant : "base",
          year,
          age: typeof item.age === "number" && Number.isFinite(item.age) ? Math.floor(item.age) : 3,
          npc: typeof item.npc === "string" ? item.npc : "",
          emotion: typeof item.emotion === "string" ? item.emotion : "",
          weight: typeof item.weight === "number" && Number.isFinite(item.weight) ? item.weight : 1,
          echo: typeof item.echo === "string" ? item.echo : "",
          snapshot,
        };
        return [record];
      })
    : [];
  const knownFlags = new Set([...FLAG_LEDGER, ...INDEX_LEDGER].map((item) => item.id));
  const retired = new Set<string>(RETIRED_FLAGS);
  const knownTags = new Set(TAG_LEDGER.map((item) => item.id));
  const knownSkills = new Set(Object.keys(SKILL_NAME));
  const knownGear = new Set(EQUIPMENT_CATALOG.map((item) => item.id));
  const knownTech = new Set(TECHNIQUE_CATALOG.map((item) => item.id));
  const techniqueProgress: Record<string, number> = {};
  if (isRecord(raw.techniqueProgress)) {
    for (const [id, value] of Object.entries(raw.techniqueProgress)) {
      if (!knownTech.has(id) || typeof value !== "number" || !Number.isFinite(value)) continue;
      techniqueProgress[id] = clamp(Math.floor(value), 0, 99);
    }
  }
  const rawFlags = strings(raw.flags);
  const personalityTags = strings(raw.personalityTags).filter((tag) => knownTags.has(tag));
  const flags: string[] = [];
  for (const flag of rawFlags) {
    if (retired.has(flag)) continue;
    if (flag.startsWith("TAG_")) {
      if (knownTags.has(flag) && !personalityTags.includes(flag)) personalityTags.push(flag);
    } else if (knownFlags.has(flag) && !flags.includes(flag)) flags.push(flag);
  }
  const drafted: State = {
    ...base,
    phase: raw.phase as State["phase"],
    gender: raw.gender === "boy" || raw.gender === "girl" ? raw.gender : null,
    yearIndex: typeof raw.yearIndex === "number" ? clamp(Math.floor(raw.yearIndex), 0, YEARS.length - 1) : 0,
    primary,
    derived,
    counter,
    npc,
    npcDays: savedNpcDays(raw.npcDays),
    flags,
    personalityTags,
    skills: strings(raw.skills).filter((id) => knownSkills.has(id)),
    equipment: strings(raw.equipment).filter((id) => knownGear.has(id)),
    equipped: strings(raw.equipped).filter((id) => knownGear.has(id) && strings(raw.equipment).includes(id)),
    techniques: techniquesForSkills(strings(raw.skills).filter((id) => knownSkills.has(id))),
    techniqueProgress,
    memories,
    seed: typeof raw.seed === "number" ? raw.seed : base.seed,
    apLeft: typeof raw.apLeft === "number" && Number.isFinite(raw.apLeft) ? clamp(Math.floor(raw.apLeft), 0, 2) : 2,
    spent: strings(raw.spent).filter((id) => id in ACTIVITIES),
    missed: strings(raw.missed).filter((id) => (MISSED_IDS as readonly string[]).includes(id)),
    chain: savedChain(raw.chain),
    queue: strings(raw.queue),
    eventId: typeof raw.eventId === "string" ? raw.eventId : null,
    note: typeof raw.note === "string" ? raw.note : null,
    noteScene: typeof raw.noteScene === "string" && SCENES.has(raw.noteScene) ? (raw.noteScene as State["noteScene"]) : null,
    result: savedResult(raw),
    approach: raw.approach === "social" || raw.approach === "safe" || raw.approach === "curious" ? raw.approach : null,
    battleSpecId: typeof raw.battleSpecId === "string" && BATTLE_SPECS.some((spec) => spec.id === raw.battleSpecId) ? raw.battleSpecId : null,
    battleTries: typeof raw.battleTries === "number" && Number.isFinite(raw.battleTries) ? clamp(Math.floor(raw.battleTries), BATTLE_TRIES_RANGE.min, BATTLE_TRIES_RANGE.max) : 0,
    battle:
      isRecord(raw.battle) && (raw.battle.kind === "perfect" || raw.battle.kind === "win" || raw.battle.kind === "fail" || raw.battle.kind === "bad")
        ? { kind: raw.battle.kind, stress: typeof raw.battle.stress === "number" && Number.isFinite(raw.battle.stress) ? clamp(raw.battle.stress, 0, 100) : 0, hp: typeof raw.battle.hp === "number" && Number.isFinite(raw.battle.hp) ? clamp(raw.battle.hp, 0, 100) : 0 }
        : null,
    offeredExplore: raw.offeredExplore === true,
    name: typeof raw.name === "string" ? raw.name.slice(0, 8) : "",
    schemaVersion: 3,
  };
  return reconcile(drafted);
}

function savedNpcDays(raw: unknown): State["npcDays"] {
  if (!isRecord(raw) || !isRecord(raw.NPC_FRIEND_01)) return {};
  const item = raw.NPC_FRIEND_01;
  const next = item.nextPlan;
  const outcome = item.todayOutcome;
  if (next !== "seek" && next !== "avoid" && next !== "withdraw") return {};
  if (outcome !== "shared" && outcome !== "kept" && outcome !== "left" && outcome !== "watched" && outcome !== "alone") return {};
  return {
    NPC_FRIEND_01: {
      currentMood: typeof item.currentMood === "number" && Number.isFinite(item.currentMood) ? clamp(Math.round(item.currentMood), -2, 2) : 0,
      relationshipDeltaToday: typeof item.relationshipDeltaToday === "number" && Number.isFinite(item.relationshipDeltaToday) ? clamp(Math.round(item.relationshipDeltaToday), -5, 5) : 0,
      todayOutcome: outcome,
      nextPlan: next,
      seenPlayer: item.seenPlayer === true,
    },
  };
}

function savedChain(raw: unknown): State["chain"] {
  const fallback = freshChain();
  if (!isRecord(raw)) return fallback;
  const status = raw.status;
  const allowed = ["locked", "available", "active", "delayed", "recovered", "completed"];
  return {
    id: "CHAIN_85_DOOR",
    stage: typeof raw.stage === "number" && Number.isFinite(raw.stage) ? clamp(Math.floor(raw.stage), 0, 5) : 0,
    status: typeof status === "string" && allowed.includes(status) ? (status as State["chain"]["status"]) : "locked",
    choiceId: raw.choiceId === "A" || raw.choiceId === "B" || raw.choiceId === "C" ? raw.choiceId : null,
  };
}

function reconcile(state: State): State {
  const yearIds = new Set(knownEventIds(state.yearIndex));
  const known = new Set(knownEventIds());
  let next: State = {
    ...state,
    apLeft: clamp(state.apLeft, 0, 2),
    queue: state.queue.filter((id) => yearIds.has(id) && id !== state.eventId),
    eventId: state.eventId && known.has(state.eventId) ? state.eventId : null,
  };
  const eventInYear = !!next.eventId && yearIds.has(next.eventId);
  if ((next.phase === "event" || next.phase === "battle" || next.phase === "battle-result" || next.phase === "repair") && !eventInYear) {
    next = { ...next, phase: "year", eventId: null };
  }
  if ((next.phase === "battle" || next.phase === "battle-result") && !next.approach) {
    next = { ...next, phase: next.eventId && yearIds.has(next.eventId) ? "event" : "year" };
  }
  if ((next.phase === "battle" || next.phase === "battle-result") && !next.battleSpecId) {
    next = { ...next, battleSpecId: battleSpecFor(next.eventId).id };
  }
  if ((next.phase === "result" || next.phase === "note" || next.phase === "repair") && !next.result) {
    next = { ...next, phase: next.eventId && yearIds.has(next.eventId) ? "event" : "year" };
  }
  if (next.phase === "explore-offer" && next.yearIndex !== 2) next = { ...next, phase: "year", eventId: null };
  if (next.phase === "story" && !isBeat(next.note)) next = { ...next, phase: "year", note: null };
  if (next.phase === "year") next = { ...next, eventId: null, apLeft: 2 };
  if (next.phase === "activities") next = { ...next, apLeft: clamp(Math.min(next.apLeft, Math.max(0, 2 - next.spent.length)), 0, 2) };
  return next;
}
