import { spiritHp, driveSp, INITIAL_PRIMARY, type Approach, type BattleKind, type Primary } from "./types";
import { actBattle, createBattle, stepBattle, BATTLE_COST, type BattleAction, type BattleSim } from "./battleSim";

export type Policy = "walk" | "read" | "guard" | "steady" | "smart";

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function decide(sim: BattleSim, policy: Policy): BattleAction | null {
  const ready = (name: BattleAction) => sim.cd[name] <= 0 && (name === "walk" || sim.sp >= BATTLE_COST[name]);
  const close = sim.waves.some((wave) => wave.x > sim.x && wave.x - sim.x < 18);
  if (policy === "walk") return ready("walk") ? "walk" : null;
  if (policy === "read") {
    if (sim.stress >= 28 && ready("read")) return "read";
    return ready("walk") ? "walk" : null;
  }
  if (policy === "guard") {
    if (close && ready("guard")) return "guard";
    return ready("walk") ? "walk" : null;
  }
  if (policy === "steady") {
    if (close && ready("guard")) return "guard";
    if (sim.stress >= 48 && ready("read")) return "read";
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

function runCell(n: number, approach: Approach, policy: Policy, label: string, kit: Kit, seedStart: number) {
  const tally: Record<BattleKind, number> = { perfect: 0, win: 0, fail: 0, bad: 0 };
  const skillUse: Record<BattleAction, number> = { walk: 0, guard: 0, read: 0, see: 0, ask: 0 };
  let seed = seedStart;
  for (let i = 0; i < n; i += 1) {
    const rand = rng(seed++);
    const result = simulateOnce({
      seed,
      approach,
      policy,
      kit,
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
  const report: BalanceReport = {
    label: `${approach}/${policy}/${label}`,
    n,
    rate,
    winRate: rate.perfect + rate.win,
    skillUse,
  };
  return { report, seed };
}

export function runBalance(n = 1000): BalanceReport[] {
  const policies: Policy[] = ["walk", "read", "guard", "steady", "smart"];
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
  for (const approach of APPROACHES) {
    for (const policy of policies) {
      for (const kit of kits) {
        const cell = runCell(n, approach, policy, kit.label, kit.kit, seed);
        seed = cell.seed;
        reports.push(cell.report);
      }
    }
  }
  return reports;
}

/** The cells the gate actually judges. Full 72-cell matrix stays on runBalance. */
export function runGateSample(n = 200): BalanceReport[] {
  const kits: { label: string; kit: Kit }[] = [
    { label: "none", kit: { practiced: false, tidy: false, see: false, ask: false } },
    { label: "read", kit: { practiced: true, tidy: false, see: false, ask: false } },
    { label: "tidy+read", kit: { practiced: true, tidy: true, see: false, ask: false } },
  ];
  const reports: BalanceReport[] = [];
  let seed = 1;
  for (const approach of APPROACHES) {
    for (const kit of kits) {
      const cell = runCell(n, approach, "steady", kit.label, kit.kit, seed);
      seed = cell.seed;
      reports.push(cell.report);
    }
  }
  return reports;
}

/** Hard fail if a normally prepared approach is near death. Over-98% and a skill that does nothing are reviews, not automatic fails. */
export const BALANCE_THRESHOLDS = {
  APPROACH_WIN_MIN: 0.2,
  APPROACH_WIN_MAX: 0.98,
  NO_POLICY_0_PERCENT: 0.02,
  SKILL_REQUIRED_DELTA: 0.04,
};

export type GateStatus = "PASS" | "FAIL" | "REVIEW";

const APPROACHES: Approach[] = ["social", "safe", "curious"];

export function judgeBalance(reports: BalanceReport[]) {
  const fails: string[] = [];
  const reviews: string[] = [];
  const byLabel = new Map(reports.map((report) => [report.label, report]));
  for (const approach of APPROACHES) {
    const normal = byLabel.get(`${approach}/steady/tidy+read`);
    if (!normal) {
      fails.push(`missing ${approach}/steady/tidy+read`);
      continue;
    }
    if (normal.winRate < BALANCE_THRESHOLDS.APPROACH_WIN_MIN) {
      fails.push(`${normal.label} ${(normal.winRate * 100).toFixed(0)}% < ${BALANCE_THRESHOLDS.APPROACH_WIN_MIN * 100}%`);
    }
    if (normal.winRate < BALANCE_THRESHOLDS.NO_POLICY_0_PERCENT) {
      fails.push(`${normal.label} near 0`);
    }
    if (normal.winRate > BALANCE_THRESHOLDS.APPROACH_WIN_MAX) {
      reviews.push(`${normal.label} ${(normal.winRate * 100).toFixed(0)}% > ${BALANCE_THRESHOLDS.APPROACH_WIN_MAX * 100}%`);
    }
    const bare = byLabel.get(`${approach}/steady/none`);
    const skilled = byLabel.get(`${approach}/steady/read`);
    if (bare && skilled) {
      const delta = skilled.winRate - bare.winRate;
      if (delta < BALANCE_THRESHOLDS.SKILL_REQUIRED_DELTA) {
        reviews.push(`${approach} read delta ${(delta * 100).toFixed(0)}%`);
      }
    }
  }
  const status: GateStatus = fails.length > 0 ? "FAIL" : reviews.length > 0 ? "REVIEW" : "PASS";
  return { status, fails, reviews };
}
