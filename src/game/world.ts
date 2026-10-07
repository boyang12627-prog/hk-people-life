/** Where people already are, and what they are doing if you do not go. */

import type { NpcDay } from "./types";

export type Place = "home" | "market" | "estate";
export type Day = "sat" | "sun";

export type Spot = {
  npcId: string;
  place: Place | "work" | "away";
  eventId: string | null;
};

export function placeOf(activity: string): Place {
  if (activity === "ACT_MARKET") return "market";
  if (activity === "ACT_ESTATE") return "estate";
  return "home";
}

export function slotIs(spent: readonly string[], day: Day, activity: string) {
  return spent[day === "sat" ? 0 : 1] === activity;
}

export const WORLD_1985 = {
  sat: [
    { npcId: "NPC_MOM_01", place: "market", eventId: "EVT_1985_FAMILY_03" },
    { npcId: "NPC_AUNT_01", place: "market", eventId: null },
    { npcId: "NPC_GRAND_01", place: "home", eventId: "MINI_85_GRANDMA" },
    { npcId: "NPC_FRIEND_01", place: "estate", eventId: "EVT_1985_FRIEND_04" },
    { npcId: "NPC_DAD_01", place: "work", eventId: null },
    { npcId: "NPC_TEACH_01", place: "away", eventId: null },
  ],
  sun: [
    { npcId: "NPC_MOM_01", place: "home", eventId: null },
    { npcId: "NPC_GRAND_01", place: "home", eventId: "MINI_85_GRANDMA" },
    { npcId: "NPC_FRIEND_01", place: "away", eventId: null },
    { npcId: "NPC_DAD_01", place: "home", eventId: "MINI_85_DAD" },
  ],
  weather: { sat: "clear", sun: "rain" },
} as const;

export const WORLD_1986 = {
  sat: [
    { npcId: "NPC_MOM_01", place: "market", eventId: "EVT_1986_MARKET_07" },
    { npcId: "NPC_MOM_01", place: "market", eventId: "MINI_86_HELP" },
    { npcId: "NPC_FRIEND_01", place: "estate", eventId: "EVT_1986_FRIEND_09" },
  ],
  sun: [{ npcId: "NPC_MOM_01", place: "home", eventId: "MINI_86_TV" }],
  weather: { sat: "clear", sun: "rain" },
} as const;

/** What that person is doing that afternoon, whether or not you go. */
export const LIFE_1985 = {
  NPC_FRIEND_01: {
    sat: { place: "estate", doing: "抱著紅球，在平台等有沒有人來", missed: "平台上，阿傑抱著紅球玩到天色暗。你不在。" },
    sun: { place: "away", doing: "不在屋邨", missed: "阿傑今天不在屋邨。平台沒有他。" },
  },
  NPC_MOM_01: {
    sat: { place: "market", doing: "在街市買菜，沒有等人", missed: "媽媽在街市買完菜才回來。你沒有拉著她。" },
    sun: { place: "home", doing: "在家裡看那隻袋子", missed: "媽媽今天留在家。街市沒有她。" },
  },
  NPC_GRAND_01: {
    sat: { place: "home", doing: "坐在廳裡", missed: "嫲嫲在廳裡坐了一下午。屋裡沒有你。" },
    sun: { place: "home", doing: "坐在廳裡", missed: "嫲嫲還是坐在廳裡。" },
  },
  NPC_DAD_01: {
    sat: { place: "work", doing: "在上班", missed: "爸爸今天在上班。門口沒有他的鞋。" },
    sun: { place: "home", doing: "下班回來，還沒有沖涼", missed: "爸爸回來過。你不在家。" },
  },
} as const;

export function lifeMissed(npcId: keyof typeof LIFE_1985, day: Day) {
  return LIFE_1985[npcId][day].missed;
}

export function tickKit(memories: readonly { id: string; emotion: string }[]): NpcDay {
  const ball = memories.find((item) => item.id === "MEM_RED_BALL");
  if (!ball) {
    return { currentMood: -1, relationshipDeltaToday: 0, todayOutcome: "alone", nextPlan: "withdraw", seenPlayer: false };
  }
  if (ball.emotion === "share") {
    return { currentMood: 1, relationshipDeltaToday: 5, todayOutcome: "shared", nextPlan: "seek", seenPlayer: true };
  }
  if (ball.emotion === "hold") {
    return { currentMood: -2, relationshipDeltaToday: -3, todayOutcome: "kept", nextPlan: "avoid", seenPlayer: true };
  }
  if (ball.emotion === "leave") {
    return { currentMood: 0, relationshipDeltaToday: 0, todayOutcome: "left", nextPlan: "withdraw", seenPlayer: true };
  }
  return { currentMood: 0, relationshipDeltaToday: 0, todayOutcome: "watched", nextPlan: "withdraw", seenPlayer: true };
}

type World = { sat: readonly Spot[]; sun: readonly Spot[]; weather: { sat: string; sun: string } };

/** People at that place, otherwise the weather, otherwise nothing. */
export function collide(day: Day, activity: string, world: World, rainEvent: string | null) {
  const place = placeOf(activity);
  const found = [...new Set(world[day].filter((spot) => spot.place === place && spot.eventId).map((spot) => spot.eventId as string))];
  if (found.length) return found;
  if (rainEvent && world.weather[day] === "rain" && place === "estate") return [rainEvent];
  return ["MINI_QUIET"];
}

/** Empty afternoons only. One card must not pretend the other afternoon was empty too. */
export function quietCopy(spent: readonly string[], year: number): { scene: Place; lines: string[] } | null {
  const world = year === 1986 ? WORLD_1986 : WORLD_1985;
  const rain = year === 1985 ? "MINI_85_RAIN" : null;
  const places: Place[] = [];
  (["sat", "sun"] as const).forEach((day) => {
    const activity = spent[day === "sat" ? 0 : 1] ?? "";
    const found = collide(day, activity, world, rain);
    if (found.length === 1 && found[0] === "MINI_QUIET") places.push(placeOf(activity));
  });
  if (!places.length) return null;
  const lines =
    places.length >= 2
      ? ["這兩個下午，你去了的地方都沒有人。", "你坐了一陣。一隻雀飛過。然後你回家。"]
      : ["這個下午，你去了的地方沒有人。", "你坐了一陣。一隻雀飛過。然後你回家。"];
  return { scene: places[0], lines };
}
