import type { Approach, BattleKind } from "./types";
import { KINDY_DOOR, type BattleSpec, type EnemyPattern, type Threat } from "./battleSpec";

export type BattleAction = "walk" | "guard" | "read" | "see" | "ask";
export type { Threat };

export type BattleSim = {
  round: number;
  maxRounds: number;
  goal: number;
  hp: number;
  maxHp: number;
  sp: number;
  maxSp: number;
  stress: number;
  brace: boolean;
  dodge: boolean;
  over: BattleKind | null;
  hint: string;
  threat: Threat;
  pattern: EnemyPattern;
  see: boolean;
  ask: boolean;
  practiced: boolean;
};

/** Only cost table. The turn UI and the balance sim both read this. Walk is free: a child can always step. */
export const BATTLE_COST: Record<BattleAction, number> = {
  walk: 0,
  guard: 2,
  read: 5,
  see: 5,
  ask: 6,
};

export function createBattle(input: {
  approach: Approach;
  hp: number;
  sp: number;
  tidy: boolean;
  see: boolean;
  ask: boolean;
  practiced: boolean;
  spec?: BattleSpec;
}): BattleSim {
  const spec = input.spec ?? KINDY_DOOR;
  let stress = input.approach === "safe" ? 16 : input.approach === "curious" ? 22 : 20;
  if (input.tidy) stress = Math.max(0, stress - 8);
  const hint =
    input.approach === "safe"
      ? "你仍然抓著媽媽。開頭沒有那麼害怕。"
      : input.approach === "curious"
        ? "你看著課室。裡面很吵，壓力大一些。"
        : "媽媽鬆開手。你開過口，現在要自己走過去。";
  return {
    round: 1,
    maxRounds: spec.maxRounds,
    goal: spec.startGoal,
    hp: input.hp,
    maxHp: input.hp,
    sp: input.sp,
    maxSp: input.sp,
    stress,
    brace: false,
    dodge: false,
    over: null,
    hint,
    threat: spec.enemyPattern.threatFor(1),
    pattern: spec.enemyPattern,
    see: input.see,
    ask: input.ask,
    practiced: input.practiced,
  };
}

/**
 * Two doors, on purpose. They are not the same check.
 * Mid-fight, only goal >= 100 ends it: you stepped through before the next cry.
 * A goal of 95 on round 4 does nothing. 88 is not a shortcut during the fight.
 * When the last round is over and you are still standing, goal >= 88 counts as in,
 * if stress stayed under 96. So 95 at the bell is a win. 95 on round 4 is not.
 */
function settle(sim: BattleSim) {
  if (sim.hp <= 0) sim.over = sim.stress >= 80 ? "bad" : "fail";
  else if (sim.stress >= 100) sim.over = "bad";
  else if (sim.goal >= 100) sim.over = sim.stress < 36 ? "perfect" : "win";
}

function timeUp(sim: BattleSim) {
  if (sim.goal >= 88 && sim.stress < 96 && sim.hp > 0) sim.over = sim.stress < 36 ? "perfect" : "win";
  else if (sim.stress >= 85 || sim.hp <= 0) sim.over = sim.stress >= 85 ? "bad" : "fail";
  else sim.over = "fail";
}

/** Player half only. Returns false when the action could not be paid for. */
export function actBattle(sim: BattleSim, name: BattleAction, enabled: boolean) {
  if (sim.over || !enabled) return false;
  const cost = BATTLE_COST[name];
  if (sim.sp < cost) {
    sim.hint = "氣力不夠。可以向前走，或者先停下。";
    return false;
  }
  sim.sp -= cost;
  if (name === "walk") {
    sim.goal = Math.min(100, sim.goal + 14);
    sim.stress = Math.min(100, sim.stress + 1);
    sim.hint = "你向前走一步。";
  } else if (name === "guard") {
    sim.brace = true;
    sim.stress = Math.max(0, sim.stress - 6);
    sim.goal = Math.min(100, sim.goal + 5);
    sim.hint = "你停下呼吸。";
  } else if (name === "read") {
    const cut = sim.practiced ? 18 : 6;
    const step = sim.practiced ? 18 : 4;
    sim.stress = Math.max(0, sim.stress - cut);
    sim.goal = Math.min(100, sim.goal + step);
    sim.hint = sim.practiced ? "你跟著老師教過的字。聲音細，但你有聲音。" : "你還沒跟熟。只出到半個字，聲音小了一點。";
  } else if (name === "see") {
    sim.dodge = true;
    sim.hint = "你看一看。下一聲，你會避開。";
  } else if (name === "ask") {
    sim.goal = Math.min(100, sim.goal + 16);
    sim.stress = Math.max(0, sim.stress - 4);
    sim.hint = "你問了一句。課室近了。";
  }
  return true;
}

function applyEnemy(sim: BattleSim) {
  const threat = sim.threat;
  let stress = threat.stress;
  let hp = threat.hp;
  if (sim.dodge) {
    sim.dodge = false;
    sim.hint = "你看得出哪一下會撞過來，避開了。";
    stress = 0;
    hp = 0;
  } else if (sim.brace) {
    sim.brace = false;
    stress = Math.ceil(stress / 2);
    hp = Math.ceil(hp / 2);
    sim.sp = Math.min(sim.maxSp, sim.sp + 3);
    sim.hint = "你擋住了。聲音小了一半。";
  } else {
    sim.hint = threat.heavy ? "那一聲很大。你退後半步。" : "陌生的聲音撞過來。你停了一下。";
  }
  sim.stress = Math.min(100, sim.stress + stress);
  // 精神力 is not a second stress bar. A voice raises stress first.
  // Spirit only cracks once stress is already at 80 or more.
  if (sim.stress >= 80) sim.hp = Math.max(0, sim.hp - hp);
}

/** One full exchange: your action, then the doorway, then the next threat. Null means you froze. */
export function resolveTurn(sim: BattleSim, action: BattleAction | null) {
  if (sim.over) return;
  if (action) {
    const paid = actBattle(sim, action, action === "see" ? sim.see : action === "ask" ? sim.ask : true);
    if (!paid) return;
  } else {
    sim.hint = "你站著。那一聲還是來了。";
  }
  settle(sim);
  if (sim.over) return;
  applyEnemy(sim);
  settle(sim);
  if (sim.over) return;
  if (sim.round >= sim.maxRounds) {
    timeUp(sim);
    return;
  }
  sim.round += 1;
  sim.threat = sim.pattern.threatFor(sim.round);
}
