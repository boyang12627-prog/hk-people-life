import type { ChainState } from "./types";

/** 1985 only. Two afternoons decide who you meet. Other years stay on the fixed queue. */

export const MISS_85_MOM = "MISS_85_MOM";
export const MISS_85_GRANDMA = "MISS_85_GRANDMA";
export const MISS_85_RAIN = "MISS_85_RAIN";
export const MISS_85_FRIEND = "MISS_85_FRIEND";

export const MISSED_IDS = [MISS_85_MOM, MISS_85_GRANDMA, MISS_85_RAIN, MISS_85_FRIEND] as const;

/** Two people with a preferred afternoon. Not a full NPC calendar. */
export const NPC_WINDOWS_1985 = [
  { npcId: "NPC_MOM_01", preferred: ["ACT_MARKET"], eventId: "EVT_1985_FAMILY_03", missedId: MISS_85_MOM },
  { npcId: "NPC_GRAND_01", preferred: ["ACT_REST"], eventId: "MINI_85_GRANDMA", missedId: MISS_85_GRANDMA },
] as const;

const TIMED_1985 = { eventId: "MINI_85_RAIN", outside: ["ACT_MARKET", "ACT_ESTATE"], missedId: MISS_85_RAIN };

export function produce1985(spent: readonly string[]) {
  const queue = ["EVT_1985_SCHOOL_01"];
  const missed: string[] = [];
  if (spent.some((id) => (TIMED_1985.outside as readonly string[]).includes(id))) queue.push(TIMED_1985.eventId);
  else missed.push(TIMED_1985.missedId);
  for (const npc of NPC_WINDOWS_1985) {
    if (spent.some((id) => (npc.preferred as readonly string[]).includes(id))) queue.push(npc.eventId);
    else missed.push(npc.missedId);
  }
  if (spent.includes("ACT_PLAY") || spent.includes("ACT_ESTATE")) queue.push("EVT_1985_FRIEND_04");
  else missed.push(MISS_85_FRIEND);
  return { queue, missed };
}

export function missedLine(missed: readonly string[], when: "now" | "later") {
  const bits: string[] = [];
  if (missed.includes(MISS_85_MOM)) bits.push("沒有陪媽媽去街市");
  if (missed.includes(MISS_85_GRANDMA)) bits.push("沒有在家陪嫲嫲");
  if (missed.includes(MISS_85_RAIN)) bits.push("沒有淋到那陣雨");
  if (missed.includes(MISS_85_FRIEND)) bits.push("沒有碰到那個紅球");
  if (!bits.length) return "";
  const lead = when === "now" ? "今年你" : "去年你";
  return `${lead}${bits.join("，")}。那些事沒有消失，只是晚了一年。`;
}

export const CHAIN_85_STAGES = ["afternoons", "door", "someone", "reflect", "echo"] as const;

const SOMEONE = ["EVT_1985_FAMILY_03", "MINI_85_GRANDMA", "MINI_85_RAIN", "EVT_1985_FRIEND_04"];
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
