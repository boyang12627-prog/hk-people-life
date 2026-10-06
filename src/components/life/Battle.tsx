import { useEffect, useRef, useState } from "react";
import { resolveAuto } from "@/game/battleBalance";
import { KINDY_DOOR } from "@/game/battleSpec";
import { BATTLE_COST, createBattle, resolveTurn, type BattleAction, type BattleSim } from "@/game/battleSim";
import type { Approach, BattleKind, BattleOutcome } from "@/game/types";

type Props = {
  approach: Approach;
  hp: number;
  sp: number;
  tidy: boolean;
  see: boolean;
  ask: boolean;
  practiced: boolean;
  onEnd: (outcome: BattleOutcome) => void;
};

export function Battle({ approach, hp, sp, tidy, see, ask, practiced, onEnd }: Props) {
  const startRef = useRef({ approach, hp, sp, tidy, see, ask, practiced });
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
    if (sim.over) report(sim.over);
  };

  const endAs = (kind: BattleKind, hint: string) => {
    if (reportedRef.current) return;
    if (!sim.over) sim.over = kind;
    sim.hint = hint;
    setTick((n) => n + 1);
    report(sim.over ?? kind);
  };

  const broke = (name: BattleAction) => name !== "walk" && sim.sp < BATTLE_COST[name];
  const locked = Boolean(sim.over) || reportedRef.current;

  return (
    <div className="flex flex-col gap-3" data-round={tick}>
      <div className="overflow-hidden rounded-2xl border border-line/40">
        <div className="relative h-40 bg-bg sm:h-52">
          <img src={`/scenes/${KINDY_DOOR.scene}.jpg`} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="grid gap-3 bg-paper px-4 py-3 text-ink">
          <p className="text-xs text-ink/60">
            第 {sim.round} / {sim.maxRounds} 步 · 門口的聲音
          </p>
          <Meter label="精神力" value={sim.hp} max={sim.maxHp} tone="bg-estate" />
          <Meter label="氣力" value={sim.sp} max={sim.maxSp} tone="bg-amber" />
          <Meter label="壓力" value={sim.stress} max={100} tone="bg-ink" />
          <Meter label="入到課室" value={sim.goal} max={100} tone="bg-estate" />
          <p className="text-sm text-pretty text-ink">{sim.over ? sim.hint : sim.threat.hint}</p>
          <p className="min-h-10 text-sm text-pretty text-ink/70">{sim.hint}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <TurnButton label="向前行" detail="不耗氣力，走近一步" disabled={locked} onClick={() => choose("walk")} />
        <TurnButton label="停下呼吸" detail={`氣力 ${BATTLE_COST.guard}，這一聲小一半`} disabled={locked || broke("guard")} onClick={() => choose("guard")} />
        <TurnButton
          label="跟著讀"
          detail={practiced ? `氣力 ${BATTLE_COST.read}，你跟得熟` : `氣力 ${BATTLE_COST.read}，還沒跟熟`}
          disabled={locked || broke("read")}
          onClick={() => choose("read")}
        />
        {see ? (
          <TurnButton label="看臉色" detail={`氣力 ${BATTLE_COST.see}，避開下一聲`} disabled={locked || broke("see")} onClick={() => choose("see")} />
        ) : null}
        {ask ? (
          <TurnButton label="問問題" detail={`氣力 ${BATTLE_COST.ask}，走近少少`} disabled={locked || broke("ask")} onClick={() => choose("ask")} />
        ) : null}
      </div>
      <p className="text-sm text-pretty text-paper/70">
        {practiced ? "你懂得跟著讀。跟著讀，壓力會落得多一些。" : "你還沒跟熟。跟著讀也可以，但聲音很細。"}
        先看這一聲大不大，再決定走還是停。今天進不去，可以再試，不會結束。
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={locked}
          className="min-h-11 rounded-xl border border-paper/30 px-3 text-sm text-paper disabled:opacity-40"
          onClick={() => endAs(KINDY_DOOR.skipKind, "你沒有打完。你還是進去了。")}
        >
          跳過，算進去了
        </button>
        <button
          type="button"
          disabled={locked}
          className="min-h-11 rounded-xl border border-paper/30 px-3 text-sm text-paper disabled:opacity-40"
          onClick={() => endAs(resolveAuto(sim), "你跟著走完這段路。")}
        >
          自動走進去
        </button>
      </div>
    </div>
  );
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
