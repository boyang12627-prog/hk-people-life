/**
 * P2 decision: one battle engine, many specs.
 * A new fight changes numbers, hints, scene, and which skills open buttons.
 * Write a second engine only when the rules themselves are different.
 * Costs stay in BATTLE_COST. This file does not copy them.
 */
import type { SceneId } from "./types";

export type BattleSpec = {
  id: string;
  scene: SceneId;
  skills: { tidy: string; see: string; ask: string; practiced: string };
  /** Playtest skip settles as a normal entry, never a perfect. */
  skipKind: "win";
};

export const KINDY_DOOR: BattleSpec = {
  id: "BTL_KINDY_DOOR",
  scene: "kindy",
  skills: { tidy: "SKL_07", see: "SKL_02", ask: "SKL_04", practiced: "SKL_01" },
  skipKind: "win",
};

export const BATTLE_SPECS = [KINDY_DOOR];
