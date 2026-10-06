/**
 * P2 decision: one battle engine, many specs.
 * A new fight changes numbers, hints, scene, and which skills open buttons.
 * Write a second engine only when the rules themselves are different.
 * Costs stay in BATTLE_COST. This file does not copy them.
 */
import type { SceneId } from "./types";

export type Threat = { stress: number; hp: number; heavy: boolean; hint: string };

/** One enemy's timetable. A later fight (exam, layoff) replaces this, not the turn resolver. */
export type EnemyPattern = {
  id: string;
  maxRounds: number;
  threatFor: (round: number) => Threat;
};

const HEAVY = new Set([2, 4, 6, 7]);

/** Separation at the kindergarten door. Loud on 2, 4, 6, and 7 so stopping to breathe is a repeated choice, not a one-off. */
export const KINDY_SEPARATION: EnemyPattern = {
  id: "ENEMY_SEPARATION_ANXIETY",
  maxRounds: 8,
  threatFor: (round) =>
    HEAVY.has(round)
      ? { stress: 18, hp: 8, heavy: true, hint: "下一聲會很大。有人快要哭出來。" }
      : { stress: 8, hp: 5, heavy: false, hint: "有人拉你的衣袖。聲音不大，但在拉。" },
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
  maxRounds: KINDY_SEPARATION.maxRounds,
  startGoal: 12,
  enemyPattern: KINDY_SEPARATION,
};

export const BATTLE_SPECS = [KINDY_DOOR];
