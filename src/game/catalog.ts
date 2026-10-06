import type { Equipment, Technique } from "./types";

/**
 * Speed design rule, scheme B.
 * Gear is the object. Each slot adds at most one point, and different slots add together.
 * A short buff is separate, and also at most one point.
 * A passive from a skill is not gear and is not cut by this cap.
 * Three slots still cannot cross a five-point gap by themselves.
 * Tie: the child acts first, and the screen does not say so.
 */
export const SPEED_RULE = {
  firstGap: 5,
  bonusGap: 10,
  maxGearSpeed: 1,
  gearSlots: 3,
  maxBuffSpeed: 1,
  maxStressResist: 1,
} as const;

export type QuestKind = "daily" | "main" | "side" | "character";

export type QuestDef = {
  id: string;
  kind: QuestKind;
  eventId: string;
  choiceId: string;
  npc: string;
  echo: string;
};

/**
 * The watch is the prototype exception: it comes from a daily, not a side quest.
 * A later item should use kind "side" or "character", and sourceQuest must stay a QUEST_ id.
 */
export const QUEST_CATALOG: readonly QuestDef[] = [
  {
    id: "QUEST_STALL_WATCH",
    kind: "daily",
    eventId: "MINI_84_TOY",
    choiceId: "B",
    npc: "NPC_AUNT_01",
    echo: "你沒有買那輛車。手上多了一隻不會走的塑膠錶。",
  },
];

/** Owned objects. Save validation reads this list. An id that is not here is dropped. */
export const EQUIPMENT_CATALOG: readonly Equipment[] = [
  {
    id: "EQP_PLASTIC_WATCH",
    slot: "hand",
    sourceQuest: "QUEST_STALL_WATCH",
    availableFromYear: 1984,
    battle: { speed: 1, stressResist: 1 },
    memoryHook: "MEM_TOY_WATCH",
  },
];

/**
 * A skill does not become a button by itself.
 * active and reaction can be buttons. passive is not a button. A life-only skill has no row here.
 */
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

export function questOf(id: string) {
  return QUEST_CATALOG.find((item) => item.id === id);
}

export function gearSpeed(equipped: readonly string[]) {
  const bySlot = new Map<string, number>();
  for (const id of equipped) {
    const item = catalogGear(id);
    if (!item) continue;
    const add = Math.min(SPEED_RULE.maxGearSpeed, Math.max(0, item.battle?.speed ?? 0));
    bySlot.set(item.slot, Math.max(bySlot.get(item.slot) ?? 0, add));
  }
  return [...bySlot.values()].reduce((total, value) => total + value, 0);
}

export function gearStressResist(equipped: readonly string[]) {
  const sum = equipped.reduce((total, id) => total + (catalogGear(id)?.battle?.stressResist ?? 0), 0);
  return Math.min(SPEED_RULE.maxStressResist, Math.max(0, sum));
}

export function grantsBattleButton(kind: Technique["kind"]) {
  return kind === "active" || kind === "reaction";
}

/** Buttons only. Passives stay out of this list. Skills with no catalog row stay out too. */
export function techniquesForSkills(skills: readonly string[]) {
  return TECHNIQUE_CATALOG.filter((item) => item.sourceSkill && skills.includes(item.sourceSkill) && grantsBattleButton(item.kind)).map((item) => item.id);
}
