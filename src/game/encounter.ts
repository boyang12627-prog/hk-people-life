/** Same life, a different fact. Year, day, place, and what is being asked each move the number. */
export function eventSeed(worldSeed: number, parts: readonly (string | number)[]): number {
  let n = (Math.abs(worldSeed) ^ 0x9e3779b9) >>> 0;
  for (const part of parts) {
    const text = String(part);
    for (let i = 0; i < text.length; i++) n = Math.imul(n ^ text.charCodeAt(i), 0x01000193) >>> 0;
    n = (n ^ 0x7feb352d) >>> 0;
  }
  return n;
}

/** The bag on that Saturday. Not the same remainder as the market draw. */
export function factSplits(seed: number | undefined) {
  if (seed === undefined) return false;
  return eventSeed(seed, [1985, "sat", "NPC_AUNT_01", "bag"]) % 5 === 0;
}

export type EncounterRow = {
  id: string;
  eventId: string;
  year: number;
  day: "sat" | "sun";
  place: "home" | "market" | "estate";
  weight: number;
  /** World fact. Undefined seed is the stable row used by tests that do not pass one. */
  when: (seed: number | undefined) => boolean;
};

/** Saturday market only. One draw. Not a list of buttons. */
export const ENCOUNTERS: readonly EncounterRow[] = [
  { id: "ENC_85_ORANGES", eventId: "MINI_85_ORANGE", year: 1985, day: "sat", place: "market", weight: 1, when: factSplits },
  { id: "ENC_85_MOM_NEWS", eventId: "EVT_1985_FAMILY_03", year: 1985, day: "sat", place: "market", weight: 2, when: () => true },
  { id: "ENC_85_NEIGHBOR", eventId: "MINI_85_NEIGHBOR", year: 1985, day: "sat", place: "market", weight: 1, when: (seed) => seed !== undefined },
  { id: "ENC_85_NOTHING", eventId: "MINI_QUIET", year: 1985, day: "sat", place: "market", weight: 1, when: (seed) => seed !== undefined },
];

/** One event for this place, or null if this place has no pool. */
export function pickEncounter(year: number, day: "sat" | "sun", place: "home" | "market" | "estate", seed: number | undefined): string | null {
  const rows = ENCOUNTERS.filter((row) => row.year === year && row.day === day && row.place === place && row.when(seed));
  if (!rows.length) return null;
  if (seed === undefined) return rows.find((row) => row.eventId === "EVT_1985_FAMILY_03")?.eventId ?? rows[0].eventId;
  const total = rows.reduce((sum, row) => sum + row.weight, 0);
  let cursor = eventSeed(seed, [year, day, place, "pool"]) % total;
  for (const row of rows) {
    if (cursor < row.weight) return row.eventId;
    cursor -= row.weight;
  }
  return rows[0].eventId;
}
