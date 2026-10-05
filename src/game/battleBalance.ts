import { spiritHp, driveSp, INITIAL_PRIMARY, type Approach, type BattleKind, type Primary } from "./types";
import { actBattle, createBattle, stepBattle, type BattleAction, type BattleSim } from "./battleSim";

export type Policy = "walk" | "read" | "guard" | "smart";

const COST: Record<BattleAction, number> = { walk: 1, guard: 3, read: 6, see: 8, ask: 8 };

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function decide(sim: BattleSim, policy: Policy): BattleAction | null {
  const ready = (name: BattleAction) => sim.cd[name] <= 0 && (name === "walk" || sim.sp >= COST[name]);
  const close = sim.waves.some((wave) => wave.x > sim.x && wave.x - sim.x < 28);
  if (policy === "walk") return ready("walk") ? "walk" : null;
  if (policy === "read") {
    if (sim.stress >= 28 && ready("read")) return "read";
    return ready("walk") ? "walk" : null;
  }
  if (policy === "guard") {
    if (close && ready("guard")) return "guard";
    return ready("walk") ? "walk" : null;
  }
  if (sim.see && close && ready("see")) return "see";
  if (sim.stress >= 36 && ready("read")) return "read";
  if (close && ready("guard")) return "guard";
  if (sim.ask && sim.x < 60 && ready("ask")) return "ask";
  return ready("walk") ? "walk" : null;
}

export type Kit = { practiced: boolean; tidy: boolean; see: boolean; ask: boolean };

export function simulateOnce(input: { seed: number; approach: Approach; policy: Policy; kit: Kit; grit: number; vit: number; mood: number }) {
  const primary = { ...INITIAL_PRIMARY, STAT_GRIT: input.grit, STAT_VIT: input.vit } as Primary;
  const hp = spiritHp(primary, input.approach === "safe" ? 5 : 0);
  const sp = driveSp(primary, input.mood);
  const sim = createBattle({ approach: input.approach, hp, sp, ...input.kit });
  const rand = rng(input.seed);
  const used: Record<BattleAction, number> = { walk: 0, guard: 0, read: 0, see: 0, ask: 0 };
  for (let i = 0; i < 700 && !sim.over; i += 1) {
    if (rand() > 0.18) {
      const action = decide(sim, input.policy);
      if (action) {
        const before = sim.t;
        actBattle(sim, action, action === "see" ? sim.see : action === "ask" ? sim.ask : true);
        if (sim.t === before && sim.cd[action] > 0) used[action] += 1;
      }
    }
    stepBattle(sim, 0.12);
  }
  return { kind: (sim.over ?? "fail") as BattleKind, used, t: sim.t };
}

export type BalanceReport = {
  label: string;
  n: number;
  rate: Record<BattleKind, number>;
  winRate: number;
  skillUse: Record<BattleAction, number>;
};

export function runBalance(n = 1000): BalanceReport[] {
  const approaches: Approach[] = ["social", "safe", "curious"];
  const policies: Policy[] = ["walk", "read", "guard", "smart"];
  const kits: { label: string; kit: Kit }[] = [
    { label: "none", kit: { practiced: false, tidy: false, see: false, ask: false } },
    { label: "read", kit: { practiced: true, tidy: false, see: false, ask: false } },
    { label: "tidy+read", kit: { practiced: true, tidy: true, see: false, ask: false } },
    { label: "see+read", kit: { practiced: true, tidy: false, see: true, ask: false } },
    { label: "ask+read", kit: { practiced: true, tidy: false, see: false, ask: true } },
    { label: "all", kit: { practiced: true, tidy: true, see: true, ask: true } },
  ];
  const reports: BalanceReport[] = [];
  let seed = 1;
  for (const approach of approaches) {
    for (const policy of policies) {
      for (const kit of kits) {
        const tally: Record<BattleKind, number> = { perfect: 0, win: 0, fail: 0, bad: 0 };
        const skillUse: Record<BattleAction, number> = { walk: 0, guard: 0, read: 0, see: 0, ask: 0 };
        for (let i = 0; i < n; i += 1) {
          const rand = rng(seed++);
          const result = simulateOnce({
            seed,
            approach,
            policy,
            kit: kit.kit,
            grit: 3 + Math.floor(rand() * 4),
            vit: 3 + Math.floor(rand() * 4),
            mood: 40 + Math.floor(rand() * 45),
          });
          tally[result.kind] += 1;
          for (const key of Object.keys(skillUse) as BattleAction[]) skillUse[key] += result.used[key];
        }
        const rate = {
          perfect: tally.perfect / n,
          win: tally.win / n,
          fail: tally.fail / n,
          bad: tally.bad / n,
        };
        reports.push({
          label: `${approach}/${policy}/${kit.label}`,
          n,
          rate,
          winRate: rate.perfect + rate.win,
          skillUse,
        });
      }
    }
  }
  return reports;
}
