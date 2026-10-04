import type { Approach, BattleKind } from "./types";

export type BattleAction = "walk" | "guard" | "read" | "see" | "ask";

type Wave = { x: number; speed: number; dmg: number };

export type BattleSim = {
  x: number;
  hp: number;
  maxHp: number;
  sp: number;
  maxSp: number;
  stress: number;
  t: number;
  spawn: number;
  waves: Wave[];
  cd: Record<BattleAction, number>;
  guard: number;
  dodge: boolean;
  over: BattleKind | null;
  shake: number;
  hint: string;
  pressure: number;
  see: boolean;
  ask: boolean;
  practiced: boolean;
  regen: number;
};

const COST: Record<BattleAction, number> = {
  walk: 2,
  guard: 3,
  read: 6,
  see: 8,
  ask: 8,
};

export function createBattle(input: {
  approach: Approach;
  hp: number;
  sp: number;
  tidy: boolean;
  see: boolean;
  ask: boolean;
  practiced: boolean;
}): BattleSim {
  const startX = input.approach === "social" ? 16 : input.approach === "curious" ? 11 : 9;
  let stress = input.approach === "safe" ? 10 : input.approach === "curious" ? 22 : 16;
  if (input.tidy) stress = Math.max(0, stress - 6);
  const hint =
    input.approach === "safe"
      ? "你仍然捉實阿媽。開頭冇咁驚。"
      : input.approach === "curious"
        ? "你望住課室。入面好嘈，壓力大啲。"
        : "阿媽鬆開手。你開過口，而家要自己行埋去。";
  return {
    x: startX,
    hp: input.hp,
    maxHp: input.hp,
    sp: input.sp,
    maxSp: input.sp,
    stress,
    t: 0,
    spawn: 1.5,
    waves: [],
    cd: { walk: 0, guard: 0, read: 0.4, see: 0, ask: 0 },
    guard: 0,
    dodge: false,
    over: null,
    shake: 0,
    hint,
    pressure: input.approach === "curious" ? 2 : 0,
    see: input.see,
    ask: input.ask,
    practiced: input.practiced,
    regen: 0,
  };
}

function finish(sim: BattleSim): BattleKind {
  if (sim.stress < 36) return "perfect";
  return "win";
}

export function stepBattle(sim: BattleSim, dt: number) {
  if (sim.over) return;
  sim.t += dt;
  sim.guard = Math.max(0, sim.guard - dt);
  sim.shake = Math.max(0, sim.shake - dt);
  (Object.keys(sim.cd) as BattleAction[]).forEach((key) => {
    sim.cd[key] = Math.max(0, sim.cd[key] - dt);
  });
  sim.regen += dt;
  if (sim.regen >= 2.4) {
    sim.regen = 0;
    sim.sp = Math.min(sim.maxSp, sim.sp + 1);
  }
  sim.spawn -= dt;
  if (sim.spawn <= 0) {
    sim.waves.push({
      x: 112,
      speed: 26 + Math.min(10, sim.t * 0.18),
      dmg: 10 + sim.pressure,
    });
    sim.spawn = sim.t < 18 ? 2.55 : 2.15;
  }
  const kept: Wave[] = [];
  for (const wave of sim.waves) {
    wave.x -= wave.speed * dt;
    if (wave.x > sim.x + 6) {
      kept.push(wave);
      continue;
    }
    if (sim.dodge) {
      sim.dodge = false;
      sim.hint = "你睇得出邊一下會撞過嚟，避開咗。";
    } else if (sim.guard > 0) {
      const perfect = sim.guard > 0.48;
      const taken = perfect ? wave.dmg * 0.1 : wave.dmg * 0.5;
      sim.hp = Math.max(0, sim.hp - taken);
      if (perfect) {
        sim.sp = Math.min(sim.maxSp, sim.sp + 10);
        sim.hint = "你啱啱停低。個聲擦過，氣力返嚟少少。";
      } else {
        sim.stress = Math.min(100, sim.stress + 1);
        sim.hint = "你擋住咗。個聲細咗一半。";
      }
      sim.guard = 0;
    } else {
      sim.hp = Math.max(0, sim.hp - wave.dmg);
      sim.stress = Math.min(100, sim.stress + 8);
      sim.x = Math.max(4, sim.x - 4);
      sim.shake = 0.18;
      sim.hint = "陌生嘅聲撞過嚟。你退後一步。";
    }
  }
  sim.waves = kept;
  if (sim.hp <= 0) sim.over = sim.stress >= 80 ? "bad" : "fail";
  else if (sim.stress >= 100) sim.over = "bad";
  else if (sim.x >= 88) sim.over = finish(sim);
  else if (sim.t >= 58) sim.over = sim.x >= 72 ? "win" : sim.stress >= 80 ? "bad" : "fail";
}

export function actBattle(sim: BattleSim, name: BattleAction, enabled: boolean) {
  if (sim.over || !enabled || sim.cd[name] > 0) return;
  const cost = COST[name];
  if (name === "walk") {
    const weak = sim.sp < cost;
    if (!weak) sim.sp -= cost;
    sim.x = Math.min(100, sim.x + (weak ? 2 : 3));
    sim.stress = Math.min(100, sim.stress + 2);
    sim.cd.walk = 1.35;
    sim.hint = weak ? "氣力唔夠。你仍然行，只係慢。" : "你行前一步。";
    return;
  }
  if (sim.sp < cost) {
    sim.hint = "氣力唔夠。可以慢行，或者等一陣。";
    return;
  }
  sim.sp -= cost;
  if (name === "guard") {
    sim.guard = 0.78;
    sim.cd.guard = 0.95;
    sim.hint = "你停低呼吸。";
  } else if (name === "read") {
    const practiced = sim.practiced;
    sim.x = Math.min(100, sim.x + (practiced ? 2 : 1));
    sim.stress = Math.max(0, sim.stress - (practiced ? 10 : 4));
    sim.cd.read = practiced ? 2.1 : 2.6;
    sim.hint = practiced ? "你跟住老師教過嘅字。聲細，但你有聲。" : "你未跟熟。只係出到半個字，聲細少少。";
  } else if (name === "see") {
    sim.dodge = true;
    sim.cd.see = 3.6;
    sim.hint = "你望一望。下一聲，你會避開。";
  } else if (name === "ask") {
    sim.x = Math.min(100, sim.x + 8);
    sim.stress = Math.max(0, sim.stress - 4);
    sim.cd.ask = 3.3;
    sim.hint = "你問咗一句。課室近咗。";
  }
}
