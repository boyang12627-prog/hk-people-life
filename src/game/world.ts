/** Where people already are. The player does not summon them. */

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
