import { useEffect, useRef, useState } from "react";
import { resolveAuto } from "@/game/battleBalance";
import type { BattleSpec } from "@/game/battleSpec";
import { BATTLE_COST, createBattle, resolveTurn, type BattleAction, type BattleSim } from "@/game/battleSim";
import type { Approach, BattleKind, BattleOutcome } from "@/game/types";

type Props = {
  spec: BattleSpec;
  approach: Approach;
  hp: number;
  sp: number;
  skills: readonly string[];
  techniques: readonly string[];
  mind: number;
  gearSpeed: number;
  stressResist: number;
  held?: string;
  onEnd: (outcome: BattleOutcome) => void;
};

export function Battle({ spec, approach, hp, sp, skills, techniques, mind, gearSpeed, stressResist, held, onEnd }: Props) {
  const stabilize = skills.includes(spec.skills.stabilize);
  const see = techniques.includes("TECH_READ_FACE");
  const ask = skills.includes(spec.skills.ask);
  const prepared = skills.includes(spec.skills.prepared);
  const startRef = useRef({ approach, hp, sp, stabilize, see, ask, prepared, spec, mind, gearSpeed, stressResist });
  const simRef = useRef<BattleSim>(createBattle(startRef.current));
  const onEndRef = useRef(onEnd);
  const reportedRef = useRef(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  const sim = simRef.current;
  const report = (kind: BattleKind) => {
    if (reportedRef.current) return;
    reportedRef.current = true;
    onEndRef.current({ kind, stress: sim.stress, hp: sim.hp });
  };

  const choose = (name: BattleAction) => {
    if (sim.over || reportedRef.current) return;
    resolveTurn(sim, name);
    setTick((n) => n + 1);
  };

  const endAs = (kind: BattleKind, hint: string) => {
    if (reportedRef.current) return;
    if (!sim.over) sim.over = kind;
    sim.hasActed = true;
    sim.hint = hint;
    sim.enemyHint = "";
    setTick((n) => n + 1);
  };

  const finish = () => {
    if (!sim.over) return;
    report(sim.over);
  };

  const broke = (name: BattleAction) => name !== "walk" && sim.sp < BATTLE_COST[name];
  const bonusOnly = sim.awaitingBonus;
  const bonusLocked = (name: BattleAction) => bonusOnly && name !== "walk" && name !== "guard";
  const locked = Boolean(sim.over) || reportedRef.current;
  const entered = sim.over === "win" || sim.over === "perfect";

  return (
    <div className="flex flex-col gap-3" data-round={tick}>
      <div className="overflow-hidden rounded-2xl border border-line/40">
        <div className="relative h-40 bg-bg sm:h-52">
          <img src={`/scenes/${spec.scene}.jpg`} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="grid gap-3 bg-paper px-4 py-3 text-ink">
          <div>
            <p className="text-xs text-ink/60">
              第 {sim.round} / {sim.maxRounds} 步 · {spec.label}
            </p>
            {sim.stableFirst ? <p className="text-xs text-ink/60">你先。</p> : null}
            {sim.pressureFirst ? <p className="text-xs text-ink/60">對方先。</p> : null}
            <div className="mt-2 flex gap-1" aria-hidden="true">
              {Array.from({ length: sim.maxRounds }, (_, index) => (
                <span key={index} className={`h-1.5 flex-1 rounded-full ${index < sim.round ? "bg-ink" : "bg-line"}`} />
              ))}
            </div>
          </div>
          <Meter label="精神力" value={sim.hp} max={sim.maxHp} tone="bg-estate" />
          <Meter label="氣力" value={sim.sp} max={sim.maxSp} tone="bg-amber" />
          <Meter label="壓力" value={sim.stress} max={100} tone="bg-ink" />
          <Meter label={spec.goalLabel} value={sim.goal} max={100} tone="bg-estate" />
          {held ? <p className="text-sm text-pretty text-ink/70">{held}</p> : null}
          {sim.over ? null : (
            <div className="rounded-xl bg-bg px-3 py-2">
              <p className="text-xs text-amber">下一聲</p>
              <p className="text-sm text-pretty text-paper">{sim.threat.hint}</p>
            </div>
          )}
          {sim.hasActed ? (
            <div>
              <p className="text-xs text-muted">剛才</p>
              <p className="text-sm text-pretty text-ink/70">{sim.hint}</p>
              {sim.enemyHint ? (
                <>
                  <p className="mt-2 text-xs text-muted">{spec.hitLabel}</p>
                  <p className="text-sm text-pretty text-ink/70">{sim.enemyHint}</p>
                </>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-pretty text-ink/70">{sim.hint}</p>
          )}
          {sim.over ? <p className="text-sm text-ink">{entered ? spec.voice.entered : spec.voice.back}</p> : null}
        </div>
      </div>
      {sim.over ? (
        <button type="button" className="min-h-12 rounded-xl bg-amber px-4 text-base font-medium text-ink" onClick={finish}>
          看這一次
        </button>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <TurnButton label={spec.voice.walk.label} detail={spec.voice.walk.detail} disabled={locked || bonusLocked("walk")} onClick={() => choose("walk")} />
            <TurnButton label={spec.voice.guard.label} detail={costDetail("guard", spec.voice.guard.detail)} disabled={locked || broke("guard") || bonusLocked("guard")} onClick={() => choose("guard")} />
            <TurnButton
              label={spec.voice.read.label}
              detail={costDetail("read", prepared ? spec.voice.read.detail : (spec.voice.read.weakDetail ?? spec.voice.read.detail))}
              disabled={locked || broke("read") || bonusLocked("read")}
              onClick={() => choose("read")}
            />
            {see ? (
              <TurnButton label={spec.voice.see.label} detail={costDetail("see", spec.voice.see.detail)} disabled={locked || broke("see") || bonusLocked("see")} onClick={() => choose("see")} />
            ) : null}
            {ask ? (
              <TurnButton label={spec.voice.ask.label} detail={costDetail("ask", spec.voice.ask.detail)} disabled={locked || broke("ask") || bonusLocked("ask")} onClick={() => choose("ask")} />
            ) : null}
          </div>
          <p className="text-sm text-pretty text-paper/70">
            {bonusOnly ? "還可以再走一步，或停一停。" : null}
            {prepared ? spec.voice.noteReady : spec.voice.noteWeak} {spec.voice.note}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={locked}
              className="min-h-11 rounded-xl border border-paper/30 px-3 text-sm text-paper disabled:opacity-40"
              onClick={() => endAs(spec.skipKind, spec.voice.skip)}
            >
              {spec.voice.skipButton}
            </button>
            <button
              type="button"
              disabled={locked}
              className="min-h-11 rounded-xl border border-paper/30 px-3 text-sm text-paper disabled:opacity-40"
              onClick={() => endAs(resolveAuto(sim), spec.voice.auto)}
            >
              {spec.voice.autoButton}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function costDetail(name: BattleAction, detail: string) {
  return `氣力 ${BATTLE_COST[name]}，${detail}`;
}

function Meter({ label, value, max, tone }: { label: string; value: number; max: number; tone: string }) {
  const width = max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-ink/70">
        <span>{label}</span>
        <span className="tabular-nums">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-line">
        <div className={`h-1.5 rounded-full ${tone}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function TurnButton({ label, detail, onClick, disabled }: { label: string; detail: string; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-12 flex-col items-start justify-center rounded-xl bg-amber px-3 py-2 text-left text-ink disabled:opacity-40"
    >
      <span className="text-base font-medium">{label}</span>
      <span className="text-xs text-ink/70">{detail}</span>
    </button>
  );
}
