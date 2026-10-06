import type { Equipment, Technique } from "./types";

/**
 * Speed design rule.
 * Five points ahead: that side is told "first". Ten points ahead: one small extra action every third round.
 * A tie is not a first-strike. The child still acts before the pressure, and the screen says nothing about it.
 * Gear and a short buff may add at most one point each. Neither can cross a five-point gap alone.
 */
export const SPEED_RULE = {
  firstGap: 5,
  bonusGap: 10,
  maxGearSpeed: 1,
  maxBuffSpeed: 1,
  maxStressResist: 1,
} as const;

/** Owned objects. Save validation reads this list. An id that is not here is dropped. */
export const EQUIPMENT_CATALOG: readonly Equipment[] = [
  {
    id: "EQP_PLASTIC_WATCH",
    slot: "hand",
    sourceQuest: "MINI_84_TOY",
    availableFromYear: 1984,
    battle: { speed: 1, stressResist: 1 },
    memoryHook: "MEM_TOY_WATCH",
  },
];

/** Ways to use a life skill under pressure. Save validation reads this list. */
export const TECHNIQUE_CATALOG: readonly Technique[] = [
  {
    id: "TECH_READ_FACE",
    sourceSkill: "SKL_02",
    kind: "reaction",
    cost: 5,
    effect: "dodge the next pressure hit",
  },
];

export function catalogGear(id: string) {
  return EQUIPMENT_CATALOG.find((item) => item.id === id);
}

export function gearSpeed(equipped: readonly string[]) {
  const sum = equipped.reduce((total, id) => total + (catalogGear(id)?.battle?.speed ?? 0), 0);
  return Math.min(SPEED_RULE.maxGearSpeed, Math.max(0, sum));
}

export function gearStressResist(equipped: readonly string[]) {
  const sum = equipped.reduce((total, id) => total + (catalogGear(id)?.battle?.stressResist ?? 0), 0);
  return Math.min(SPEED_RULE.maxStressResist, Math.max(0, sum));
}

export function techniquesForSkills(skills: readonly string[]) {
  return TECHNIQUE_CATALOG.filter((item) => item.sourceSkill && skills.includes(item.sourceSkill)).map((item) => item.id);
}
