/**
 * P2 decision: one battle engine, many specs.
 * A new fight changes numbers, hints, scene, and which skills open buttons.
 * Write a second engine only when the rules themselves are different.
 * Costs stay in BATTLE_COST. This file does not copy them.
 */
import type { SceneId } from "./types";

export type Threat = { stress: number; hp: number; heavy: boolean; hint: string };

/** Threats by round. How many rounds the fight lasts lives on the spec, not here. */
export type EnemyPattern = {
  id: string;
  threatFor: (round: number) => Threat;
};

const HEAVY = new Set([2, 4, 6, 7]);

const LIGHT: Threat = { stress: 8, hp: 5, heavy: false, hint: "有人拉你的衣袖。聲音不大，但在拉。" };

/** Separation at the kindergarten door. Loud on 2, 4, 6, and 7. Step 8 is the lit door; the spec length must stay 8 for that step to be last. */
export const KINDY_SEPARATION: EnemyPattern = {
  id: "ENEMY_SEPARATION_ANXIETY",
  threatFor: (round) => {
    if (round === 8) return { stress: 6, hp: 5, heavy: false, hint: "門口有光。再走一步就進去。" };
    if (HEAVY.has(round)) return { stress: 18, hp: 8, heavy: true, hint: "下一聲會很大。有人快要哭出來。" };
    return LIGHT;
  },
};

export type BattleSpec = {
  id: string;
  scene: SceneId;
  skills: { tidy: string; see: string; ask: string; practiced: string };
  /** Playtest skip settles as a normal entry, never a perfect. */
  skipKind: "win";
  maxRounds: number;
  startGoal: number;
  enemyPattern: EnemyPattern;
};

export const KINDY_DOOR: BattleSpec = {
  id: "BTL_KINDY_DOOR",
  scene: "kindy",
  skills: { tidy: "SKL_07", see: "SKL_02", ask: "SKL_04", practiced: "SKL_01" },
  skipKind: "win",
  maxRounds: 8,
  startGoal: 12,
  enemyPattern: KINDY_SEPARATION,
};

export const BATTLE_SPECS = [KINDY_DOOR];
