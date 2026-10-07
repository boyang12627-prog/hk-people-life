import type { ChainState, State } from "./types";
import { WORLD_1985, WORLD_1986, collide, placeOf } from "./world";

/** 1985 and 1986. Two afternoons decide which of the existing scenes you get. 1984 and 1988 stay on a fixed queue. */

export const MISS_85_MOM = "MISS_85_MOM";
export const MISS_85_GRANDMA = "MISS_85_GRANDMA";
export const MISS_85_RAIN = "MISS_85_RAIN";
export const MISS_85_FRIEND = "MISS_85_FRIEND";

export const MISS_85_DAD = "MISS_85_DAD";
export const MISS_85_TV = "MISS_85_TV";
export const MISS_85_AUNT = "MISS_85_AUNT";

export const MISS_86_MARKET = "MISS_86_MARKET";
export const MISS_86_ESTATE = "MISS_86_ESTATE";
export const MISS_86_TV = "MISS_86_TV";
export const MISS_86_FRIEND = "MISS_86_FRIEND";

export const MISSED_IDS = [
  MISS_85_MOM,
  MISS_85_GRANDMA,
  MISS_85_RAIN,
  MISS_85_FRIEND,
  MISS_85_DAD,
  MISS_85_TV,
  MISS_85_AUNT,
  MISS_86_MARKET,
  MISS_86_ESTATE,
  MISS_86_TV,
  MISS_86_FRIEND,
] as const;

const TV_1985 = { npcId: "TV", place: "home" as const, eventId: "MINI_85_TV" };

function pushUnique(queue: string[], ids: readonly string[]) {
  for (const id of ids) if (!queue.includes(id)) queue.push(id);
}

export function produce1985(spent: readonly string[]) {
  const world = {
    sat: [...WORLD_1985.sat, TV_1985],
    sun: [...WORLD_1985.sun, TV_1985],
    weather: WORLD_1985.weather,
  };
  const queue = ["EVT_1985_SCHOOL_01"];
  pushUnique(queue, collide("sat", spent[0] ?? "", world, "MINI_85_RAIN"));
  pushUnique(queue, collide("sun", spent[1] ?? "", world, "MINI_85_RAIN"));
  const missed: string[] = [];
  if (!queue.includes("EVT_1985_FAMILY_03")) missed.push(MISS_85_MOM);
  if (!queue.includes("MINI_85_GRANDMA")) missed.push(MISS_85_GRANDMA);
  if (!queue.includes("EVT_1985_FRIEND_04")) missed.push(MISS_85_FRIEND);
  if (!queue.includes("MINI_85_DAD")) missed.push(MISS_85_DAD);
  if (!queue.includes("MINI_85_RAIN")) missed.push(MISS_85_RAIN);
  if (!queue.includes("MINI_85_TV")) missed.push(MISS_85_TV);
  if (placeOf(spent[0] ?? "") !== "market") missed.push(MISS_85_AUNT);
  return { queue, missed };
}

export function produce1986(spent: readonly string[]) {
  const queue = ["EVT_1986_SKILL_05", "EVT_1986_FAMILY_06"];
  const missed: string[] = [];
  pushUnique(queue, collide("sat", spent[0] ?? "", WORLD_1986, null));
  pushUnique(queue, collide("sun", spent[1] ?? "", WORLD_1986, null));
  if (!queue.includes("EVT_1986_MARKET_07")) missed.push(MISS_86_MARKET);
  if (!queue.includes("EVT_1986_FRIEND_09")) missed.push(MISS_86_FRIEND);
  if (placeOf(spent[0] ?? "") !== "estate") missed.push(MISS_86_ESTATE);
  if (!queue.includes("MINI_86_TV")) missed.push(MISS_86_TV);
  queue.push("EVT_1986_ECHO_08");
  return { queue, missed };
}

export function missed1986(missed: readonly string[], when: "now" | "later") {
  const bits: string[] = [];
  if (missed.includes(MISS_86_MARKET)) bits.push("沒有去街市");
  if (missed.includes(MISS_86_ESTATE)) bits.push("沒有上平台");
  if (missed.includes(MISS_86_TV)) bits.push("沒有留在家看那一次電視");
  if (missed.includes(MISS_86_FRIEND)) bits.push("沒有再碰到阿傑");
  if (!bits.length) return "";
  if (when === "now") return `今年你${bits.join("，")}。`;
  return `一九八六年你${bits.join("，")}。中間隔了一年，那些事沒有補回來。`;
}

/** Same person, different life. The afternoon only decides whether you can meet him. */
export function friendFollow(state: Pick<State, "missed" | "flags" | "npc" | "derived">) {
  if (state.missed.includes(MISS_85_FRIEND)) return "ask";
  if (state.flags.includes("FLAG_TOY_MONOPOLY")) return "wary";
  if (state.flags.includes("FLAG_SHARED_BALL") || state.npc.NPC_FRIEND_01.relation >= 5) return "invite";
  if (state.flags.includes("FLAG_AVOID_CONFLICT") || state.derived.INDEPENDENT_THOUGHT >= 50) return "watch";
  return "again";
}

export function missedLine(missed: readonly string[], when: "now" | "later") {
  const bits: string[] = [];
  if (missed.includes(MISS_85_MOM)) bits.push("沒有陪媽媽去街市");
  if (missed.includes(MISS_85_GRANDMA)) bits.push("沒有在家陪嫲嫲");
  if (missed.includes(MISS_85_RAIN)) bits.push("沒有淋到那陣雨");
  if (missed.includes(MISS_85_FRIEND)) bits.push("沒有碰到那個紅球");
  if (missed.includes(MISS_85_DAD)) bits.push("沒有在家等到爸爸");
  if (missed.includes(MISS_85_TV)) bits.push("沒有看見電視又開著");
  if (missed.includes(MISS_85_AUNT)) bits.push("沒有聽見阿姨叫你");
  if (!bits.length) return "";
  const lead = when === "now" ? "今年你" : "去年你";
  return `${lead}${bits.join("，")}。那些事沒有消失，只是晚了一年。`;
}

export const CHAIN_85_STAGES = ["afternoons", "door", "someone", "reflect", "echo"] as const;

const SOMEONE = ["EVT_1985_FAMILY_03", "MINI_85_GRANDMA", "MINI_85_RAIN", "EVT_1985_FRIEND_04", "MINI_85_DAD", "MINI_85_TV"];
const SELF = ["ACT_PLAY", "ACT_DRAW", "ACT_ESTATE"];
const FAMILY = ["ACT_MARKET", "ACT_REST"];

export function freshChain(): ChainState {
  return { id: "CHAIN_85_DOOR", stage: 0, status: "locked", choiceId: null };
}

export function afternoonTags(spent: readonly string[]) {
  if (spent.length < 2) return [];
  if (spent.every((id) => SELF.includes(id))) return ["TAG_ON_YOUR_OWN"];
  if (spent.every((id) => FAMILY.includes(id))) return ["TAG_WITH_FAMILY"];
  return [];
}

export function advanceChain(chain: ChainState, eventId: string | null, choiceId: string): ChainState {
  if (eventId === "EVT_1985_SCHOOL_01") return { ...chain, stage: Math.max(chain.stage, 2), status: "active", choiceId };
  if (eventId && SOMEONE.includes(eventId)) return { ...chain, stage: Math.max(chain.stage, 3), status: chain.status === "locked" ? "active" : chain.status };
  return chain;
}

export function chainEcho(choiceId: string | null) {
  if (choiceId === "A") return "去年你在門口開了口。今年你還記得有人看過你。";
  if (choiceId === "B") return "去年你拉著媽媽的手。今年你還記得那隻手。";
  if (choiceId === "C") return "去年你自己走向紅球。今年你還是會自己走近。";
  return "去年你走到了門口。";
}

/** Which years of the decade exist. A year that is not here is not a hidden chapter. */
export const REPLAY_MATRIX = [
  { year: 1980, playable: false, calendar: null },
  { year: 1981, playable: false, calendar: null },
  { year: 1982, playable: false, calendar: null },
  { year: 1983, playable: false, calendar: null },
  { year: 1984, playable: true, calendar: "childhood-afternoon" },
  { year: 1985, playable: true, calendar: "childhood-afternoon" },
  { year: 1986, playable: true, calendar: "childhood-afternoon" },
  { year: 1987, playable: false, calendar: null },
  { year: 1988, playable: true, calendar: "prototype-slice" },
  { year: 1989, playable: false, calendar: null },
] as const;
