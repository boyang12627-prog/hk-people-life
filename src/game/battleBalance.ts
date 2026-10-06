import { spiritHp, driveSp, INITIAL_PRIMARY, type Approach, type BattleKind, type Primary } from "./types";
import { KINDY_DOOR, type BattleSpec } from "./battleSpec";
import { BATTLE_COST, createBattle, resolveTurn, type BattleAction, type BattleSim } from "./battleSim";

export type Policy = "walk" | "read" | "guard" | "steady" | "smart";

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function decide(sim: BattleSim, policy: Policy): BattleAction | null {
  const ready = (name: BattleAction) => name === "walk" || sim.sp >= BATTLE_COST[name];
  const heavy = sim.threat.heavy;
  if (policy === "walk") return "walk";
  if (policy === "read") {
    if (sim.stress >= 34 && ready("read")) return "read";
    return "walk";
  }
  if (policy === "guard") {
    if (heavy && ready("guard")) return "guard";
    return "walk";
  }
  if (policy === "steady") {
    if (heavy && ready("guard")) return "guard";
    if (sim.prepared && sim.stress >= 40 && ready("read")) return "read";
    return "walk";
  }
  if (sim.see && heavy && ready("see")) return "see";
  if (sim.stress >= 34 && ready("read")) return "read";
  if (heavy && ready("guard")) return "guard";
  if (sim.ask && sim.goal < 78 && ready("ask")) return "ask";
  return "walk";
}

export type Kit = { prepared: boolean; stabilize: boolean; see: boolean; ask: boolean };

export function simulateOnce(input: {
  seed: number;
  approach: Approach;
  policy: Policy;
  kit: Kit;
  grit: number;
  vit: number;
  mood: number;
  spec?: BattleSpec;
}) {
  const primary = { ...INITIAL_PRIMARY, STAT_GRIT: input.grit, STAT_VIT: input.vit } as Primary;
  const hp = spiritHp(primary, input.approach === "safe" ? 5 : 0);
  const sp = driveSp(primary, input.mood);
  const sim = createBattle({ approach: input.approach, hp, sp, ...input.kit, spec: input.spec ?? KINDY_DOOR });
  const rand = rng(input.seed);
  const used: Record<BattleAction, number> = { walk: 0, guard: 0, read: 0, see: 0, ask: 0 };
  for (let i = 0; i < sim.maxRounds + 1 && !sim.over; i += 1) {
    const hesitate = rand() < 0.12;
    const action = hesitate ? null : decide(sim, input.policy);
    if (action) used[action] += 1;
    resolveTurn(sim, action);
  }
  return { kind: (sim.over ?? "fail") as BattleKind, used, t: sim.round };
}

export type BalanceReport = {
  label: string;
  n: number;
  rate: Record<BattleKind, number>;
  winRate: number;
  skillUse: Record<BattleAction, number>;
};

function runCell(n: number, approach: Approach, policy: Policy, label: string, kit: Kit, seedStart: number, spec: BattleSpec = KINDY_DOOR) {
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
      spec,
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

export function runBalance(n = 1000, spec: BattleSpec = KINDY_DOOR): BalanceReport[] {
  const policies: Policy[] = ["walk", "read", "guard", "steady", "smart"];
  const kits: { label: string; kit: Kit }[] = [
    { label: "none", kit: { prepared: false, stabilize: false, see: false, ask: false } },
    { label: "read", kit: { prepared: true, stabilize: false, see: false, ask: false } },
    { label: "stabilize+read", kit: { prepared: true, stabilize: true, see: false, ask: false } },
    { label: "see+read", kit: { prepared: true, stabilize: false, see: true, ask: false } },
    { label: "ask+read", kit: { prepared: true, stabilize: false, see: false, ask: true } },
    { label: "all", kit: { prepared: true, stabilize: true, see: true, ask: true } },
  ];
  const reports: BalanceReport[] = [];
  let seed = 1;
  for (const approach of APPROACHES) {
    for (const policy of policies) {
      for (const kit of kits) {
        const cell = runCell(n, approach, policy, kit.label, kit.kit, seed, spec);
        seed = cell.seed;
        reports.push(cell.report);
      }
    }
  }
  return reports;
}

/** The cells the gate actually judges. Full 72-cell matrix stays on runBalance. */
export function runGateSample(n = 200, spec: BattleSpec = KINDY_DOOR): BalanceReport[] {
  const kits: { label: string; kit: Kit }[] = [
    { label: "none", kit: { prepared: false, stabilize: false, see: false, ask: false } },
    { label: "read", kit: { prepared: true, stabilize: false, see: false, ask: false } },
    { label: "stabilize+read", kit: { prepared: true, stabilize: true, see: false, ask: false } },
  ];
  const reports: BalanceReport[] = [];
  let seed = 1;
  for (const approach of APPROACHES) {
    for (const kit of kits) {
      const cell = runCell(n, approach, "steady", kit.label, kit.kit, seed, spec);
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
    const normal = byLabel.get(`${approach}/steady/stabilize+read`);
    if (!normal) {
      fails.push(`missing ${approach}/steady/stabilize+read`);
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

/** Deterministic turns for the doorway. A later fight passes its own spec, and will need its own script. */
export function provePerfect(spec: BattleSpec = KINDY_DOOR): BattleKind {
  const primary = { ...INITIAL_PRIMARY, STAT_GRIT: 8, STAT_VIT: 8 };
  const sim = createBattle({
    approach: "safe",
    hp: spiritHp(primary, 5),
    sp: driveSp(primary, 80),
    stabilize: true,
    see: false,
    ask: false,
    prepared: true,
    spec,
  });
  for (let i = 0; i < sim.maxRounds && !sim.over; i += 1) {
    let action: BattleAction = "walk";
    if (sim.threat.heavy && sim.sp >= BATTLE_COST.guard) action = "guard";
    else if (sim.stress >= 40 && sim.sp >= BATTLE_COST.read) action = "read";
    resolveTurn(sim, action);
  }
  return sim.over ?? "fail";
}

export function balanceSummary(reports: BalanceReport[]) {
  return reports.map((report) => ({
    label: report.label,
    n: report.n,
    win: Number((report.winRate * 100).toFixed(1)),
    perfect: Number((report.rate.perfect * 100).toFixed(1)),
  }));
}

/** Playtest auto. Steady policy. Stops as fail if the fight never ends. */
export function resolveAuto(sim: BattleSim, policy: Policy = "steady") {
  let steps = 0;
  while (!sim.over && steps < sim.maxRounds + 1) {
    resolveTurn(sim, decide(sim, policy));
    steps += 1;
  }
  if (!sim.over) sim.over = "fail";
  return sim.over;
}
