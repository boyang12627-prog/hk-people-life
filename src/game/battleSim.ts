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

/** Only cost table. UI and the balance sim both read this. */
export const BATTLE_COST: Record<BattleAction, number> = {
  walk: 1,
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
  const startX = 18;
  let stress = input.approach === "safe" ? 20 : input.approach === "curious" ? 24 : 22;
  if (input.tidy) stress = Math.max(0, stress - 6);
  const hint =
    input.approach === "safe"
      ? "你仍然抓著媽媽。開頭沒有那麼害怕。"
      : input.approach === "curious"
        ? "你看著課室。裡面很吵，壓力大一些。"
        : "媽媽鬆開手。你開過口，現在要自己走過去。";
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
    pressure: 0,
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
  if (sim.regen >= 2) {
    sim.regen = 0;
    sim.sp = Math.min(sim.maxSp, sim.sp + 1);
  }
  sim.spawn -= dt;
  if (sim.spawn <= 0) {
    sim.waves.push({
      x: 112,
      speed: 26 + Math.min(8, sim.t * 0.15),
      dmg: 10,
    });
    sim.spawn = sim.t < 18 ? 2.35 : 2.05;
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
      sim.hint = "你看得出哪一下會撞過來，避開了。";
    } else if (sim.guard > 0) {
      const perfect = sim.guard > 0.48;
      const taken = perfect ? wave.dmg * 0.1 : wave.dmg * 0.5;
      sim.hp = Math.max(0, sim.hp - taken);
      if (perfect) {
        sim.sp = Math.min(sim.maxSp, sim.sp + 10);
        sim.hint = "你剛剛停下。那個聲音擦過，氣力回來少許。";
      } else {
        sim.stress = Math.min(100, sim.stress + 8);
        sim.hint = "你擋住了。聲音小了一半。";
      }
      sim.guard = 0;
    } else {
      sim.hp = Math.max(0, sim.hp - wave.dmg);
      sim.stress = Math.min(100, sim.stress + 12);
      sim.x = Math.max(4, sim.x - 2);
      sim.shake = 0.18;
      sim.hint = "陌生的聲音撞過來。你退後一步。";
    }
  }
  sim.waves = kept;
  if (sim.hp <= 0) sim.over = sim.stress >= 80 ? "bad" : "fail";
  else if (sim.stress >= 100) sim.over = "bad";
  else if (sim.x >= 88) sim.over = finish(sim);
  else if (sim.t >= 46) sim.over = sim.x >= 72 ? "win" : sim.stress >= 80 ? "bad" : "fail";
}

export function actBattle(sim: BattleSim, name: BattleAction, enabled: boolean) {
  if (sim.over || !enabled || sim.cd[name] > 0) return;
  const cost = BATTLE_COST[name];
  if (name === "walk") {
    const weak = sim.sp < cost;
    if (!weak) sim.sp -= cost;
    sim.x = Math.min(100, sim.x + (weak ? 2 : 3));
    sim.stress = Math.min(100, sim.stress + 1);
    sim.cd.walk = 1.1;
    sim.hint = weak ? "氣力不夠。你仍然走，只是慢。" : "你向前走一步。";
    return;
  }
  if (sim.sp < cost) {
    sim.hint = "氣力不夠。可以慢走，或者等一陣。";
    return;
  }
  sim.sp -= cost;
  if (name === "guard") {
    sim.guard = 0.78;
    sim.cd.guard = 0.95;
    sim.hint = "你停下呼吸。";
  } else if (name === "read") {
    const practiced = sim.practiced;
    sim.x = Math.min(100, sim.x + (practiced ? 2 : 1));
    sim.stress = Math.max(0, sim.stress - (practiced ? 10 : 4));
    sim.cd.read = practiced ? 2.1 : 2.6;
    sim.hint = practiced ? "你跟著老師教過的字。聲音細，但你有聲音。" : "你還沒跟熟。只出到半個字，聲音小了一點。";
  } else if (name === "see") {
    sim.dodge = true;
    sim.cd.see = 3.6;
    sim.hint = "你看一看。下一聲，你會避開。";
  } else if (name === "ask") {
    sim.x = Math.min(100, sim.x + 3);
    sim.stress = Math.max(0, sim.stress - 4);
    sim.cd.ask = 3.3;
    sim.hint = "你問了一句。課室近了。";
  }
}
