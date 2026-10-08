import { useEffect, useRef, useState } from "react";
import { resolveAuto } from "@/game/battleBalance";
import type { BattleSpec } from "@/game/battleSpec";
import { actionCost, createBattle, resolveTurn, techniqueReady, type BattleAction, type BattleSim } from "@/game/battleSim";
import { personSrc } from "@/game/art";
import type { Approach, BattleKind, BattleOutcome, Gender } from "@/game/types";

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
  attack: number;
  held?: string;
  gender: Gender | null;
  onEnd: (outcome: BattleOutcome) => void;
};

export function Battle({ spec, approach, hp, sp, skills, techniques, mind, gearSpeed, stressResist, attack, held, gender, onEnd }: Props) {
  const stabilize = skills.includes(spec.skills.stabilize);
  const seeId = spec.techniques.see;
  const see = techniques.includes(seeId);
  const ask = skills.includes(spec.skills.ask);
  const prepared = skills.includes(spec.skills.prepared);
  const startRef = useRef({ approach, hp, sp, stabilize, see, ask, prepared, spec, mind, gearSpeed, stressResist, attack });
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

  const broke = (name: BattleAction) => name !== "walk" && sim.sp < actionCost(name, seeId);
  const seeLocked = !techniqueReady(sim, seeId);
  const bonusOnly = sim.awaitingBonus;
  const bonusLocked = (name: BattleAction) => bonusOnly && name !== "walk" && name !== "guard";
  const locked = Boolean(sim.over) || reportedRef.current;
  const entered = sim.over === "win" || sim.over === "perfect";

  const who = gender === "boy" ? "boy" : "girl";
  const kindy = spec.scene === "kindy";
  const src = kindy
    ? entered
      ? `/art/q/inside-${who}.jpg`
      : sim.round >= 4 || sim.threat.heavy
        ? `/art/q/pressure-${who}.jpg`
        : `/art/q/kindy-${who}.jpg`
    : `/art/q/${spec.scene}-${who}.jpg`;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border-4 border-[#6e4524] bg-[#f4efe4] shadow-[inset_0_0_0_2px_#e8d7a8]" data-round={tick}>
      <div className="relative h-[34%] min-h-36 shrink-0">
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1c140c]/25 to-transparent" />
      </div>
      <div className="shrink-0 border-b-2 border-[#8a6232] bg-[#fffaf0] px-3 py-2 text-ink">
        <div className="mb-1 flex items-center gap-2">
          <img src={personSrc("child", gender, sim.over ? "idle" : "think", spec.scene === "study" || spec.scene === "home" ? "sit" : "stand")} alt="" className="h-8 w-8 rounded-full border border-[#c4a574] object-cover object-[center_18%]" />
          <p className="font-serif text-sm tracking-wide text-[#6e4524]">{spec.label}</p>
        </div>
        {!sim.over && !sim.hasActed ? <p className="text-xs text-[#6e4524]">下一聲</p> : null}
        <p className="text-pretty text-base leading-7">{bonusOnly ? "還可以再走一步，或停一停。" : sim.over ? (entered ? spec.voice.entered : spec.voice.back) : sim.hasActed ? sim.hint : sim.threat.hint}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto bg-[#f6efe0] px-3 py-2 text-ink">
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
          {held ? <p className="mt-2 text-sm text-pretty text-ink/70">{held}</p> : null}
          {sim.hasActed ? (
            <div className="mt-2">
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
            <p className="mt-2 text-sm text-pretty text-ink/70">{sim.hint}</p>
          )}
      </div>
      {sim.over ? (
        <div className="shrink-0 border-t border-[#c4a574] bg-[#efe2c6] p-2">
          <button type="button" className="min-h-12 w-full rounded-md border border-[#8a6232] bg-[#e7c27a] text-base font-medium text-ink" onClick={finish}>
            看這一次
          </button>
        </div>
      ) : (
        <div className="shrink-0 border-t border-[#c4a574] bg-[#efe2c6] p-2">
          <div className="grid grid-cols-2 gap-1">
            <TurnButton label={spec.voice.walk.label} detail={spec.voice.walk.detail} disabled={locked || bonusLocked("walk")} onClick={() => choose("walk")} />
            <TurnButton label={spec.voice.guard.label} detail={costDetail(actionCost("guard"), spec.voice.guard.detail)} disabled={locked || broke("guard") || bonusLocked("guard")} onClick={() => choose("guard")} />
            <TurnButton
              label={spec.voice.read.label}
              detail={costDetail(actionCost("read"), prepared ? spec.voice.read.detail : (spec.voice.read.weakDetail ?? spec.voice.read.detail))}
              disabled={locked || broke("read") || bonusLocked("read")}
              onClick={() => choose("read")}
            />
            {see ? (
              <TurnButton label={spec.voice.see.label} detail={costDetail(actionCost("see", seeId), spec.voice.see.detail)} disabled={locked || broke("see") || seeLocked || bonusLocked("see")} onClick={() => choose("see")} />
            ) : null}
            {ask ? (
              <TurnButton label={spec.voice.ask.label} detail={costDetail(actionCost("ask"), spec.voice.ask.detail)} disabled={locked || broke("ask") || bonusLocked("ask")} onClick={() => choose("ask")} />
            ) : null}
            <TurnButton label={spec.voice.skipButton} detail="" disabled={locked} onClick={() => endAs(spec.skipKind, spec.voice.skip)} />
            <TurnButton label={spec.voice.autoButton} detail="" disabled={locked} onClick={() => endAs(resolveAuto(sim), spec.voice.auto)} />
          </div>
        </div>
      )}
    </div>
  );
}

function costDetail(cost: number, detail: string) {
  return `氣力 ${cost}，${detail}`;
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
      className="flex min-h-12 flex-col items-start justify-center rounded-md border border-[#c4a574] bg-[#fff8ea] px-3 py-2 text-left text-ink disabled:opacity-40"
    >
      <span className="text-base font-medium">{label}</span>
      <span className="text-xs text-ink/70">{detail}</span>
    </button>
  );
}
