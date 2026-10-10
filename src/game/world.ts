/** Where people already are, and what they are doing if you do not go. */

import type { NpcDay, NpcId, State } from "./types";
import { factSplits, pickEncounter, eventSeed } from "./encounter";

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
    sun: { place: "home", doing: "下班回來，還沒有洗澡", missed: "爸爸回來過。你不在家。" },
  },
} as const;

export function lifeMissed(npcId: keyof typeof LIFE_1985, day: Day) {
  return LIFE_1985[npcId][day].missed;
}

function observed(currentMood: number, relationshipDeltaToday: number, currentActivity: string): NpcDay["observed"] {
  return { currentMood, relationshipDeltaToday, currentActivity };
}

/** World fact. Same life, same Saturday. Undefined seed means the tests that do not pass one. */
export function bagSplits(seed: number | undefined) {
  return factSplits(seed);
}

export function dadStayedLate(seed: number | undefined) {
  if (seed === undefined) return false;
  return eventSeed(seed, [1985, "sat", "NPC_DAD_01", "shift"]) % 2 === 0;
}
function kitSaturday(state: Pick<State, "memories" | "seed">): NpcDay {
  const ball = state.memories.find((item) => item.id === "MEM_RED_BALL");
  if (!ball) {
    const roll = eventSeed(state.seed, [1985, "sat", "NPC_FRIEND_01", "alone"]) % 3;
    if (roll === 1) {
      return {
        location: "estate",
        mood: "content",
        todayOutcome: "content",
        seenPlayer: false,
        missedPlayer: true,
        nextPlan: "return",
        observed: observed(0, 0, "一個人把球踢來踢去"),
      };
    }
    if (roll === 2) {
      return {
        location: "away",
        mood: "left",
        todayOutcome: "left-early",
        seenPlayer: false,
        missedPlayer: true,
        nextPlan: "withdraw",
        observed: observed(-1, 0, "玩了一陣就走了"),
      };
    }
    return {
      location: "away",
      mood: "disappointed",
      todayOutcome: "disappointed",
      seenPlayer: false,
      missedPlayer: true,
      nextPlan: "withdraw",
      observed: observed(-1, 0, "一個人玩到天黑，坐在石凳上"),
    };
  }
  if (ball.emotion === "share") {
    return { location: "home", mood: "glad", todayOutcome: "shared", seenPlayer: true, missedPlayer: false, nextPlan: "seek", observed: observed(1, 5, "來找你") };
  }
  if (ball.emotion === "hold") {
    return { location: "away", mood: "sore", todayOutcome: "kept", seenPlayer: true, missedPlayer: false, nextPlan: "avoid", observed: observed(-2, -3, "把球留在家") };
  }
  if (ball.emotion === "leave") {
    return { location: "away", mood: "flat", todayOutcome: "left", seenPlayer: true, missedPlayer: false, nextPlan: "withdraw", observed: observed(0, 0, "沒有再等") };
  }
  return { location: "away", mood: "flat", todayOutcome: "watched", seenPlayer: true, missedPlayer: false, nextPlan: "withdraw", observed: observed(0, 0, "沒有再等") };
}

function momSaturday(state: Pick<State, "memories" | "spent">): NpcDay {
  const withHer = state.spent[0] === "ACT_MARKET" || state.memories.some((item) => item.eventId === "EVT_1985_FAMILY_03");
  if (withHer) {
    return { location: "home", mood: "easier", todayOutcome: "shared", seenPlayer: true, missedPlayer: false, nextPlan: "lighter", observed: observed(1, 0, "有人跟她去了街市") };
  }
  return { location: "home", mood: "tired", todayOutcome: "carried", seenPlayer: false, missedPlayer: true, nextPlan: "carry", observed: observed(-1, 0, "一個人把菜提回來") };
}

function grandSaturday(state: Pick<State, "memories">): NpcDay {
  const met = state.memories.find((item) => item.id === "MEM_GRAND_DAY");
  if (!met) {
    return { location: "home", mood: "waiting", todayOutcome: "alone", seenPlayer: false, missedPlayer: true, nextPlan: "stay", observed: observed(0, 0, "坐在廳裡，湯涼了") };
  }
  if (met.emotion === "left") {
    return { location: "home", mood: "flat", todayOutcome: "left", seenPlayer: true, missedPlayer: false, nextPlan: "stay", observed: observed(-1, 0, "你聽了一半就走") };
  }
  return { location: "home", mood: "glad", todayOutcome: "shared", seenPlayer: true, missedPlayer: false, nextPlan: "stay", observed: observed(1, 0, "你留在廳裡聽") };
}

function dadSaturday(state: Pick<State, "seed">): NpcDay {
  if (dadStayedLate(state.seed)) {
    return { location: "away", mood: "tired", todayOutcome: "overtime", seenPlayer: false, missedPlayer: true, nextPlan: "late", observed: observed(-1, 0, "做到天黑才下班") };
  }
  return { location: "away", mood: "steady", todayOutcome: "watched", seenPlayer: false, missedPlayer: false, nextPlan: "ordinary", observed: observed(0, 0, "按時下班") };
}

function auntSaturday(state: Pick<State, "memories" | "seed">): NpcDay {
  if (!bagSplits(state.seed)) {
    return { location: "away", mood: "ordinary", todayOutcome: "watched", seenPlayer: false, missedPlayer: false, nextPlan: "ordinary", observed: observed(0, 0, "自己買完就走") };
  }
  const orange = state.memories.find((item) => item.id === "MEM_ORANGE");
  if (!orange) {
    return { location: "away", mood: "alone", todayOutcome: "alone", seenPlayer: false, missedPlayer: true, nextPlan: "alone", observed: observed(0, 0, "橙散了一地，她自己撿") };
  }
  if (orange.emotion === "help") {
    return { location: "away", mood: "glad", todayOutcome: "shared", seenPlayer: true, missedPlayer: false, nextPlan: "grateful", observed: observed(1, 0, "有個孩子幫她撿橙") };
  }
  if (orange.emotion === "keep") {
    return { location: "away", mood: "sore", todayOutcome: "kept", seenPlayer: true, missedPlayer: false, nextPlan: "cool", observed: observed(-1, 0, "有個孩子撿了一顆走") };
  }
  return { location: "away", mood: "flat", todayOutcome: "left", seenPlayer: true, missedPlayer: false, nextPlan: "unseen", observed: observed(0, 0, "孩子看見了，沒有停") };
}

/** One row per person who finishes Saturday without waiting for the player. */
const DAY_RULES: { npcId: NpcId; year: number; day: Day; resolve: (state: Pick<State, "memories" | "seed" | "spent">) => NpcDay }[] = [
  { npcId: "NPC_FRIEND_01", year: 1985, day: "sat", resolve: kitSaturday },
  { npcId: "NPC_MOM_01", year: 1985, day: "sat", resolve: momSaturday },
  { npcId: "NPC_GRAND_01", year: 1985, day: "sat", resolve: grandSaturday },
  { npcId: "NPC_DAD_01", year: 1985, day: "sat", resolve: dadSaturday },
  { npcId: "NPC_AUNT_01", year: 1985, day: "sat", resolve: auntSaturday },
];

/** Finish the day for every person who has a rule. Does not touch relation. */
export function worldTick(state: State, when: { year: number; day: Day }): State {
  if (when.day !== "sat") return state;
  let npcDays = state.npcDays;
  for (const rule of DAY_RULES) {
    if (rule.year !== when.year || rule.day !== when.day || npcDays[rule.npcId]) continue;
    npcDays = { ...npcDays, [rule.npcId]: rule.resolve(state) };
  }
  return npcDays === state.npcDays ? state : { ...state, npcDays };
}

function kitMeets(day: NpcDay, place: Place): string | null {
  if (day.nextPlan === "seek") return "MINI_85_KIT_WAIT";
  if (day.nextPlan === "return" && day.location === "estate" && place === "estate") return "MINI_85_KIT_WAIT";
  return null;
}

function eventsAt(spots: readonly Spot[], day: Day, activity: string, weather: { sat: string; sun: string }, rainEvent: string | null) {
  const place = placeOf(activity);
  const found = [...new Set(spots.filter((spot) => spot.place === place && spot.eventId).map((spot) => spot.eventId as string))];
  if (found.length) return found;
  if (rainEvent && weather[day] === "rain" && place === "estate") return [rainEvent];
  return ["MINI_QUIET"];
}

/** The only answer to who is here now. Base schedule first, then a finished day. */
export function resolveWorldAt(year: number, day: Day, activity: string, state: Pick<State, "npcDays"> & { seed?: number }): string[] {
  const table = year === 1986 ? WORLD_1986 : WORLD_1985;
  let spots: Spot[] = table[day].map((spot) => ({ npcId: spot.npcId, place: spot.place, eventId: spot.eventId }));
  if (year === 1985) spots.push({ npcId: "TV", place: "home", eventId: "MINI_85_TV" });
  if (year === 1985 && day === "sat" && placeOf(activity) === "market") {
    spots = spots.filter((spot) => spot.place !== "market");
    const eventId = pickEncounter(1985, "sat", "market", state.seed);
    if (eventId) spots.push({ npcId: "POOL", place: "market", eventId });
  }
  if (year === 1985 && day === "sun") {
    spots = spots.filter((spot) => spot.npcId !== "NPC_FRIEND_01");
    const kit = state.npcDays.NPC_FRIEND_01;
    const event = kit ? kitMeets(kit, placeOf(activity)) : null;
    if (event) spots.push({ npcId: "NPC_FRIEND_01", place: placeOf(activity), eventId: event });
    else if (kit && kit.location !== "estate" && placeOf(activity) === "estate") {
      spots.push({ npcId: "PASSER", place: "estate", eventId: "MINI_85_ALONE_PODIUM" });
    }
    if (state.npcDays.NPC_MOM_01?.nextPlan === "carry" && placeOf(activity) === "home") {
      spots.push({ npcId: "NPC_MOM_01", place: "home", eventId: "MINI_85_MOM_ALONE" });
    }
  }
  const ids = eventsAt(spots, day, activity, table.weather, year === 1985 ? "MINI_85_RAIN" : null);
  if (ids.includes("MINI_85_KIT_WAIT")) return ["MINI_85_KIT_WAIT", ...ids.filter((id) => id !== "MINI_85_KIT_WAIT")];
  return ids;
}

type World = { sat: readonly Spot[]; sun: readonly Spot[]; weather: { sat: string; sun: string } };

/** People at that place, otherwise the weather, otherwise nothing. */
export function collide(day: Day, activity: string, world: World, rainEvent: string | null) {
  return eventsAt(world[day], day, activity, world.weather, rainEvent);
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
      ? ["這兩個下午，你去的地方都沒有人。", "你坐了一陣。一隻麻雀飛過。然後你回家。"]
      : ["這個下午，你去的地方沒有人。", "你坐了一陣。一隻麻雀飛過。然後你回家。"];
  return { scene: places[0], lines };
}
