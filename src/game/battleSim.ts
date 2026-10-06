import type { Approach, BattleKind, TurnOwner } from "./types";
import { SPEED_RULE } from "./catalog";
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
  /** What you just did. Not the doorway. */
  hint: string;
  /** What the doorway did after you moved. Empty until that happens. */
  enemyHint: string;
  hasActed: boolean;
  threat: Threat;
  pattern: EnemyPattern;
  see: boolean;
  ask: boolean;
  prepared: boolean;
  spec: BattleSpec;
  turnOwner: TurnOwner;
  playerSpeed: number;
  enemySpeed: number;
  /** Tie and a real lead both list the child first. Only a lead of firstGap sets stableFirst. */
  initiativeOrder: TurnOwner[];
  intent: string;
  /** Recorded when you guard. The hit still checks `brace`. Nothing else reads this. */
  guardUntilRound: number;
  /** Reserved. No buff is written. */
  temporaryBuffs: string[];
  /** Reserved. A technique is not spent through this list yet. */
  usedTechniques: string[];
  stableFirst: boolean;
  pressureFirst: boolean;
  bonusQuick: boolean;
  awaitingBonus: boolean;
  stressResist: number;
};

/** Mind, a memory passive, a short buff, and gear. No source is invented here. */
export function battleSpeed(parts: { mind: number; passive?: number; buff?: number; gear?: number }) {
  const gear = Math.min(SPEED_RULE.maxGearSpeed, Math.max(0, Math.floor(parts.gear ?? 0)));
  const buff = Math.min(SPEED_RULE.maxBuffSpeed, Math.max(0, Math.floor(parts.buff ?? 0)));
  return Math.max(0, Math.floor(parts.mind) + Math.floor(parts.passive ?? 0) + buff + gear);
}

/**
 * Tie: the child acts first, and the screen does not say so.
 * firstGap or more: say who is first. bonusGap or more: one extra walk or guard every third round.
 */
export function initiativeFor(playerSpeed: number, enemySpeed: number) {
  const gap = playerSpeed - enemySpeed;
  const stableFirst = gap >= SPEED_RULE.firstGap;
  const pressureFirst = gap <= -SPEED_RULE.firstGap;
  const childFirst = !pressureFirst;
  return {
    stableFirst,
    pressureFirst,
    bonusQuick: gap >= SPEED_RULE.bonusGap,
    initiativeOrder: (childFirst ? ["player", "pressure"] : ["pressure", "player"]) as TurnOwner[],
  };
}

const BONUS_ACTION = new Set<BattleAction>(["walk", "guard"]);
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
  stabilize: boolean;
  see: boolean;
  ask: boolean;
  prepared: boolean;
  spec?: BattleSpec;
  mind?: number;
  passiveSpeed?: number;
  buffSpeed?: number;
  gearSpeed?: number;
  stressResist?: number;
  enemySpeed?: number;
}): BattleSim {
  const spec = input.spec ?? KINDY_DOOR;
  let stress = input.approach === "safe" ? 16 : input.approach === "curious" ? 22 : 20;
  if (input.stabilize) stress = Math.max(0, stress - 8);
  const playerSpeed = battleSpeed({ mind: input.mind ?? 5, passive: input.passiveSpeed, buff: input.buffSpeed, gear: input.gearSpeed });
  const enemySpeed = input.enemySpeed ?? spec.pressureSpeed;
  const order = initiativeFor(playerSpeed, enemySpeed);
  const threat = spec.enemyPattern.threatFor(1);
  const sim: BattleSim = {
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
    hint: spec.voice.openings[input.approach],
    enemyHint: "",
    hasActed: false,
    threat,
    pattern: spec.enemyPattern,
    see: input.see,
    ask: input.ask,
    prepared: input.prepared,
    spec,
    turnOwner: order.pressureFirst ? "pressure" : "player",
    playerSpeed,
    enemySpeed,
    initiativeOrder: order.initiativeOrder,
    intent: threat.hint,
    guardUntilRound: 0,
    temporaryBuffs: [],
    usedTechniques: [],
    stableFirst: order.stableFirst,
    pressureFirst: order.pressureFirst,
    bonusQuick: order.bonusQuick,
    awaitingBonus: false,
    stressResist: Math.min(SPEED_RULE.maxStressResist, Math.max(0, Math.floor(input.stressResist ?? 0))),
  };
  if (order.pressureFirst) openPressure(sim);
  return sim;
}

/**
 * Two doors, on purpose. They are not the same check.
 * Mid-fight, only goal >= 100 ends it: you stepped through before the next cry.
 * A goal of 95 on round 4 does nothing. 88 is not a shortcut during the fight.
 * When the last round is over and you are still standing, goal >= 88 counts as in,
 * if stress stayed under 96. So 95 at the bell is a win. 95 on round 4 is not.
 * This fight is won by getting into the room. There is no enemy-pressure bar to empty.
 * A later fight can add one. Do not treat a loud voice as something you defeat.
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
    sim.hasActed = true;
    sim.hint = sim.spec.voice.broke;
    return false;
  }
  sim.hasActed = true;
  sim.sp -= cost;
  const voice = sim.spec.voice;
  if (name === "walk") {
    sim.goal = Math.min(100, sim.goal + 14);
    sim.stress = Math.min(100, sim.stress + 1);
    sim.hint = voice.walk.hint;
  } else if (name === "guard") {
    sim.brace = true;
    sim.guardUntilRound = sim.round;
    sim.stress = Math.max(0, sim.stress - 6);
    sim.goal = Math.min(100, sim.goal + 5);
    sim.hint = voice.guard.hint;
  } else if (name === "read") {
    const cut = sim.prepared ? 18 : 6;
    const step = sim.prepared ? 18 : 4;
    sim.stress = Math.max(0, sim.stress - cut);
    sim.goal = Math.min(100, sim.goal + step);
    sim.hint = sim.prepared ? voice.read.hint : (voice.read.weakHint ?? voice.read.hint);
  } else if (name === "see") {
    sim.dodge = true;
    sim.hint = voice.see.hint;
  } else if (name === "ask") {
    sim.goal = Math.min(100, sim.goal + 16);
    sim.stress = Math.max(0, sim.stress - 4);
    sim.hint = voice.ask.hint;
  }
  return true;
}

function applyEnemy(sim: BattleSim) {
  const threat = sim.threat;
  let stress = threat.stress;
  let hp = threat.hp;
  if (sim.dodge) {
    sim.dodge = false;
    sim.enemyHint = sim.spec.voice.dodged;
    stress = 0;
    hp = 0;
  } else if (sim.brace) {
    sim.brace = false;
    stress = Math.ceil(stress / 2);
    hp = Math.ceil(hp / 2);
    sim.sp = Math.min(sim.maxSp, sim.sp + 3);
    sim.enemyHint = sim.spec.voice.braced;
  } else {
    sim.enemyHint = threat.landed;
  }
  stress = Math.max(0, stress - sim.stressResist);
  sim.stress = Math.min(100, sim.stress + stress);
  // 精神力 is not a second stress bar. A voice raises stress first.
  // Spirit only cracks once stress is already at 80 or more.
  if (sim.stress >= 80) sim.hp = Math.max(0, sim.hp - hp);
}

/** One full exchange. Null means you froze. A bonus click may only walk or guard. */
export function resolveTurn(sim: BattleSim, action: BattleAction | null) {
  if (sim.over) return;
  if (sim.awaitingBonus) {
    sim.awaitingBonus = false;
    if (action && BONUS_ACTION.has(action)) actBattle(sim, action, true);
    else sim.enemyHint = "";
    closeAfterPlayer(sim);
    return;
  }
  sim.enemyHint = "";
  if (action) {
    const paid = actBattle(sim, action, action === "see" ? sim.see : action === "ask" ? sim.ask : true);
    if (!paid) return;
  } else {
    sim.hasActed = true;
    sim.hint = sim.spec.voice.froze;
  }
  settle(sim);
  if (sim.over) return;
  if (sim.bonusQuick && sim.round % 3 === 0) {
    sim.awaitingBonus = true;
    sim.turnOwner = "player";
    return;
  }
  closeAfterPlayer(sim);
}

function closeAfterPlayer(sim: BattleSim) {
  if (!sim.pressureFirst) {
    applyEnemy(sim);
    settle(sim);
    if (sim.over) return;
  }
  if (sim.round >= sim.maxRounds) {
    timeUp(sim);
    return;
  }
  sim.round += 1;
  sim.threat = sim.pattern.threatFor(sim.round);
  sim.intent = sim.threat.hint;
  sim.turnOwner = sim.pressureFirst ? "pressure" : "player";
  if (sim.pressureFirst) openPressure(sim);
}

function openPressure(sim: BattleSim) {
  applyEnemy(sim);
  settle(sim);
  sim.hasActed = true;
  sim.turnOwner = "player";
}
