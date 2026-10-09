import { useEffect, useRef, useState } from "react";
import { resolveAuto } from "@/game/battleBalance";
import type { BattleSpec } from "@/game/battleSpec";
import { actionCost, createBattle, resolveTurn, techniqueReady, type BattleAction, type BattleSim } from "@/game/battleSim";
import { battlePlate, personSrc } from "@/game/art";
import type { Approach, BattleKind, BattleOutcome, Gender } from "@/game/types";
import { Frame, PaperPanel, Tag } from "@/components/life/Stage";

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
  /** Skip and auto buttons. Tester tool only; see playtestTools(). */
  tools?: boolean;
  onEnd: (outcome: BattleOutcome) => void;
};

export function Battle({ spec, approach, hp, sp, skills, techniques, mind, gearSpeed, stressResist, attack, held, gender, tools = false, onEnd }: Props) {
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

  const src = battlePlate(spec.scene, gender, { entered, pressed: sim.round >= 4 || sim.threat.heavy });

  const lead = bonusOnly ? "還可以再走一步，或停一停。" : sim.over ? (entered ? spec.voice.entered : spec.voice.back) : sim.threat.hint;
  const face = personSrc("child", gender, sim.over ? "idle" : "think", spec.scene === "study" || spec.scene === "home" ? "sit" : "stand");

  return (
    <Frame
      label={spec.label}
      picture={src}
      overlay={
        <div className="pointer-events-none absolute right-2 top-2 flex flex-col items-end gap-1 md:right-[2%] md:top-[3%]" data-round={tick}>
          <p className="ui-paper-label rotate-1 rounded-sm px-2 py-0.5 font-serif text-sm tabular-nums md:text-base">
            第 {sim.round} / {sim.maxRounds} 步
          </p>
          <div className="flex w-28 gap-0.5 md:w-40" aria-hidden="true">
            {Array.from({ length: sim.maxRounds }, (_, index) => (
              <span key={index} className={`h-1.5 flex-1 rounded-full ${index < sim.round ? "bg-[#f3ead7]" : "bg-[#f3ead7]/35"}`} />
            ))}
          </div>
        </div>
      }
      panel={
        <PaperPanel
          heading={
            <div className="flex min-w-0 items-center gap-2">
              <img loading="lazy" decoding="async" src={face} alt="" className="h-8 w-8 rounded-full border border-[#a77f4c] bg-[#f3ead7] object-cover object-[center_18%]" />
              <div className="min-w-0">
                <p className="text-xs tracking-wide text-ink/60">{spec.label}</p>
                {!sim.over && !bonusOnly ? <p className="font-serif text-base text-[#5c3a1e]">{spec.nextLabel}</p> : null}
              </div>
            </div>
          }
          live={null}
          side={
            sim.over ? (
              <TurnButton main label="看這一次" detail="" disabled={false} onClick={finish} />
            ) : (
              <>
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
                {tools ? <TurnButton label={spec.voice.skipButton} detail="試玩用" disabled={locked} onClick={() => endAs(spec.skipKind, spec.voice.skip)} /> : null}
                {tools ? <TurnButton label={spec.voice.autoButton} detail="試玩用" disabled={locked} onClick={() => endAs(resolveAuto(sim), spec.voice.auto)} /> : null}
              </>
            )
          }
        >
          <p className="text-pretty text-base leading-7 md:text-lg md:leading-8" aria-live="polite">{lead}</p>
          {sim.stableFirst ? <p className="text-xs text-ink/70">你先。</p> : null}
          {sim.pressureFirst ? <p className="text-xs text-ink/70">對方先。</p> : null}
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
            <Meter label="精神力" value={sim.hp} max={sim.maxHp} tone="bg-estate" />
            <Meter label="氣力" value={sim.sp} max={sim.maxSp} tone="bg-amber" />
            <Meter label="壓力" value={sim.stress} max={100} tone="bg-ink" />
            <Meter label={spec.goalLabel} value={sim.goal} max={100} tone="bg-estate" />
          </div>
          {held ? <p className="mt-2 text-sm text-pretty text-ink/75">{held}</p> : null}
          {sim.hasActed ? (
            <div className="mt-2 border-t border-dashed border-[#a77f4c] pt-1.5">
              <p className="text-xs text-[#5c3a1e]">剛才</p>
              <p className="text-sm text-pretty text-ink/80">{sim.hint}</p>
              {sim.enemyHint ? (
                <>
                  <p className="mt-1.5 text-xs text-[#5c3a1e]">{spec.hitLabel}</p>
                  <p className="text-sm text-pretty text-ink/80">{sim.enemyHint}</p>
                </>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-sm text-pretty text-ink/80">{sim.hint}</p>
          )}
        </PaperPanel>
      }
    />
  );
}

function costDetail(cost: number, detail: string) {
  return `氣力 ${cost}，${detail}`;
}

function Meter({ label, value, max, tone }: { label: string; value: number; max: number; tone: string }) {
  const width = max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(value)}>
      <div className="mb-0.5 flex justify-between text-xs text-ink/80">
        <span>{label}</span>
        <span className="tabular-nums">{Math.round(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full border border-[#a77f4c] bg-[#e7d9bb]">
        <div className={`meter h-full rounded-full ${tone}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function TurnButton({ label, detail, onClick, disabled, main = false }: { label: string; detail: string; onClick: () => void; disabled: boolean; main?: boolean }) {
  return <Tag label={label} detail={detail || undefined} onClick={onClick} disabled={disabled} main={main} />;
}
