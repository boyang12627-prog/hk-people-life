import type { ChainState } from "./types";

/** 1985 only. Two afternoons decide who you meet. Other years stay on the fixed queue. */

export const MISS_85_MOM = "MISS_85_MOM";
export const MISS_85_GRANDMA = "MISS_85_GRANDMA";
export const MISS_85_RAIN = "MISS_85_RAIN";
export const MISS_85_FRIEND = "MISS_85_FRIEND";

export const MISS_85_DAD = "MISS_85_DAD";
export const MISS_85_TV = "MISS_85_TV";
export const MISS_85_AUNT = "MISS_85_AUNT";

export const MISSED_IDS = [MISS_85_MOM, MISS_85_GRANDMA, MISS_85_RAIN, MISS_85_FRIEND, MISS_85_DAD, MISS_85_TV, MISS_85_AUNT] as const;

const HOME = ["ACT_PLAY", "ACT_DRAW", "ACT_REST"] as const;

/** The people who can appear in 1985. A row with no event does not add a scene. */
export const NPC_SCHEDULE_1985 = [
  { npcId: "NPC_MOM_01", location: "market", preferred: ["ACT_MARKET"], eventId: "EVT_1985_FAMILY_03", missedId: MISS_85_MOM, prerequisite: "", fallback: "沒有陪她去街市" },
  { npcId: "NPC_GRAND_01", location: "home", preferred: ["ACT_REST"], eventId: "MINI_85_GRANDMA", missedId: MISS_85_GRANDMA, prerequisite: "", fallback: "沒有在家陪她" },
  { npcId: "NPC_FRIEND_01", location: "kindy", preferred: ["ACT_PLAY", "ACT_ESTATE"], eventId: "EVT_1985_FRIEND_04", missedId: MISS_85_FRIEND, prerequisite: "", fallback: "沒有碰到紅球" },
  { npcId: "NPC_DAD_01", location: "home", preferred: [...HOME], eventId: "MINI_85_DAD", missedId: MISS_85_DAD, prerequisite: "兩個下午都在家", fallback: "你出門的時候他回來過" },
  { npcId: "NPC_TEACH_01", location: "kindy", preferred: [] as string[], eventId: null, missedId: null, prerequisite: "幼稚園門口", fallback: "老師在門口那一件裡，不另開一場" },
  { npcId: "NPC_AUNT_01", location: "market", preferred: ["ACT_MARKET"], eventId: null, missedId: MISS_85_AUNT, prerequisite: "", fallback: "街市那檔沒有叫到你" },
] as const;

/** Same television as 1984. Not a new historical chapter. */
const HISTORY_1985 = { eventId: "MINI_85_TV", missedId: MISS_85_TV };

const TIMED_1985 = { eventId: "MINI_85_RAIN", outside: ["ACT_MARKET", "ACT_ESTATE"], missedId: MISS_85_RAIN };

function stayedHome(spent: readonly string[]) {
  return spent.length > 0 && spent.every((id) => (HOME as readonly string[]).includes(id));
}

export function produce1985(spent: readonly string[]) {
  const queue = ["EVT_1985_SCHOOL_01"];
  const missed: string[] = [];
  if (spent.some((id) => (TIMED_1985.outside as readonly string[]).includes(id))) queue.push(TIMED_1985.eventId);
  else missed.push(TIMED_1985.missedId);
  for (const row of NPC_SCHEDULE_1985) {
    if (!row.eventId && !row.missedId) continue;
    const hit = row.prerequisite === "兩個下午都在家" ? stayedHome(spent) : spent.some((id) => (row.preferred as readonly string[]).includes(id));
    if (hit && row.eventId) queue.push(row.eventId);
    else if (!hit && row.missedId) missed.push(row.missedId);
  }
  if (stayedHome(spent)) queue.push(HISTORY_1985.eventId);
  else missed.push(HISTORY_1985.missedId);
  return { queue, missed };
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
