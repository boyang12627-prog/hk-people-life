import { useEffect, useReducer, useState, type ReactNode } from "react";
import { Battle } from "@/components/life/Battle";
import { playRoom, playTone, unlockAudio } from "@/components/life/audio";
import {
  ACTIVITIES,
  battleStory,
  cardFor,
  choicesFor,
  lifeVoice,
  orientationLine,
  PRIMARY_LABEL,
  recallLine,
  SKILL_NAME,
  yearOf,
} from "@/game/content";
import { canRetry, freshState, loadState, reducer, saveState } from "@/game/engine";
import { driveSp, spiritHp, type Gender, type SceneId, type State } from "@/game/types";

export function LifeApp() {
  const [state, dispatch] = useReducer(reducer, undefined, freshState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = loadState();
    if (saved) dispatch({ type: "hydrate", state: saved });
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveState(state);
  }, [ready, state]);

  useEffect(() => {
    playRoom(sceneOf(state));
  }, [state.phase, state.eventId, state.noteScene, state.yearIndex]);

  const tap = (kind: "tap" | "soft" | "good" | "hit" = "tap") => {
    unlockAudio();
    playTone(kind);
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col overflow-x-hidden px-4 py-5">
      <Top state={state} />
      {state.phase === "title" ? <Title onStart={() => { tap(); dispatch({ type: "begin" }); }} /> : null}
      {state.phase === "gender" ? (
        <GenderPick
          onPick={(gender, name) => {
            tap();
            dispatch({ type: "gender", gender, name });
          }}
        />
      ) : null}
      {state.phase === "year" ? <YearOpen state={state} onNext={() => { tap(); dispatch({ type: "toActivities" }); }} onRestart={() => dispatch({ type: "restart" })} /> : null}
      {state.phase === "activities" ? (
        <Activities
          state={state}
          onPick={(id) => {
            tap("soft");
            dispatch({ type: "activity", id });
          }}
        />
      ) : null}
      {state.phase === "note" && state.result ? (
        <Paper scene={state.noteScene ?? "home"} kicker="呢個下午" title="時間用咗一次">
          <ResultBody result={state.result} />
          <Primary onClick={() => { tap(); dispatch({ type: "ack" }); }}>{state.apLeft > 0 ? "仲有一次" : "今年嘅事開始"}</Primary>
        </Paper>
      ) : null}
      {state.phase === "event" && state.eventId ? <EventCard state={state} onChoose={(choice) => { tap(); dispatch({ type: "choose", choice }); }} /> : null}
      {state.phase === "battle" && state.approach ? (
        <Battle
          approach={state.approach}
          hp={spiritHp(state.primary, state.approach === "safe" ? 5 : 0)}
          sp={driveSp(state.primary, state.derived.STATE_MOOD)}
          tidy={state.skills.includes("SKL_07")}
          see={state.skills.includes("SKL_02")}
          ask={state.skills.includes("SKL_04")}
          practiced={state.skills.includes("SKL_01")}
          onEnd={(outcome) => {
            playTone(outcome.kind === "fail" || outcome.kind === "bad" ? "hit" : "good");
            dispatch({ type: "battleEnd", outcome });
          }}
        />
      ) : null}
      {state.phase === "battle-result" && state.battle && state.approach ? (
        <BattleResult
          state={state}
          onRetry={() => {
            tap();
            dispatch({ type: "retry" });
          }}
          onSettle={() => {
            tap("soft");
            dispatch({ type: "settleBattle" });
          }}
        />
      ) : null}
      {state.phase === "result" && state.result ? (
        <Paper scene={sceneOf(state)} kicker="之後" title="你揀咗">
          <ResultBody result={state.result} />
          <Primary onClick={() => { tap(); dispatch({ type: "ack" }); }}>繼續</Primary>
        </Paper>
      ) : null}
      {state.phase === "repair" && state.result ? (
        <Paper scene="home" kicker="1986 · 夜晚" title="阿媽問你">
          <p className="text-pretty text-base leading-7">{state.result.text}</p>
          <p className="mt-3 text-pretty text-base leading-7">今晚佢問你點解行到門口。你可以講，亦都可以唔講。</p>
          <ChoiceButton label="同阿媽講" hint="屋企近，個心會緊" onClick={() => { tap(); dispatch({ type: "repair", talk: true }); }} />
          <ChoiceButton label="唔講，自己瞓" hint="少句鬧，自己吞" onClick={() => { tap("soft"); dispatch({ type: "repair", talk: false }); }} />
        </Paper>
      ) : null}
      {state.phase === "explore-offer" ? (
        <Paper scene="estate" kicker="1986 · 年尾" title="要唔要再落一次平台">
          <p className="text-pretty text-base leading-7">你自己出過門嘅次數未夠兩次。落一次平台會計一次。夠數，走廊盡頭先會發生。你亦可以留低，呢個係你自己揀。</p>
          <ChoiceButton label="落一次平台" hint="唔使再扣今年嗰兩次" onClick={() => { tap(); dispatch({ type: "explore", go: true }); }} />
          <ChoiceButton label="留喺屋企" hint="件事就未發生" onClick={() => { tap("soft"); dispatch({ type: "explore", go: false }); }} />
        </Paper>
      ) : null}
      {state.phase === "year-end" ? <YearEnd state={state} onNext={() => { tap(); dispatch({ type: "nextYear" }); }} /> : null}
      {state.phase === "ending" ? <Ending state={state} onRestart={() => { tap(); dispatch({ type: "restart" }); }} /> : null}
    </main>
  );
}

function Top({ state }: { state: State }) {
  const year = state.phase === "title" || state.phase === "gender" || state.phase === "ending" ? null : yearOf(state);
  const showAp = state.phase === "activities" || state.phase === "year";
  return (
    <header className="mb-3 flex items-end justify-between gap-3">
      <div>
        <p className="font-serif text-xl tracking-wide text-paper">人生・香港</p>
        <p className="text-sm text-paper/70">{year ? `${year.year} · ${year.age} 歲` : "1984–1986"}</p>
      </div>
      {showAp ? <p className="text-sm text-paper/70">今年仲有 {state.apLeft} 次</p> : null}
    </header>
  );
}

function Title({ onStart }: { onStart: () => void }) {
  return (
    <Paper scene="estate" kicker="幼年" title="你唔係要打贏">
      <p className="text-pretty text-base leading-7">一九八四至一九八六。屋邨、飯枱、幼稚園門口。</p>
      <p className="mt-3 text-pretty text-base leading-7">你一路揀。三年之後，先睇到自己變成邊個。</p>
      <Primary onClick={onStart}>開始</Primary>
    </Paper>
  );
}

function GenderPick({ onPick }: { onPick: (gender: Gender, name: string) => void }) {
  const [name, setName] = useState("");
  const clean = name.trim().slice(0, 8);
  return (
    <Paper scene="home" kicker="開始之前" title="你係？">
      <p className="text-pretty text-base leading-7">故事唔會因為你係仔定女而少一段。稱呼會跟你。年份仍然係一九八四。</p>
      <label className="mt-4 block text-sm text-ink/70">
        人哋點叫你
        <input
          value={name}
          maxLength={8}
          placeholder="可留空"
          onChange={(event) => setName(event.target.value)}
          className="mt-1 min-h-12 w-full rounded-xl border border-line bg-paper px-3 text-base text-ink"
        />
      </label>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => onPick("boy", clean)} className="min-h-12 rounded-xl bg-amber text-base font-medium text-ink">
          仔
        </button>
        <button type="button" onClick={() => onPick("girl", clean)} className="min-h-12 rounded-xl bg-amber text-base font-medium text-ink">
          女
        </button>
      </div>
    </Paper>
  );
}

function YearOpen({ state, onNext, onRestart }: { state: State; onNext: () => void; onRestart: () => void }) {
  const year = yearOf(state);
  const title = year.year === 1984 ? "飯枱" : year.year === 1985 ? "門口" : "走廊";
  return (
    <Paper scene={year.scene} kicker={String(year.year)} title={title}>
      <p className="text-pretty text-base leading-7">{year.era}</p>
      <p className="mt-3 text-pretty text-base leading-7">{year.open}</p>
      {state.name ? <p className="mt-3 text-pretty text-base leading-7">人哋叫你{state.name}。</p> : null}
      <p className="mt-3 text-sm text-pretty text-ink/70">今年你有兩次時間，用嚟陪人、玩、或者休息。之後嘅事會自己嚟，唔使你預留。</p>
      <LifeNow state={state} />
      <Primary onClick={onNext}>用呢兩次時間</Primary>
      <button type="button" onClick={onRestart} className="mt-2 min-h-11 w-full text-sm text-ink/70">
        由頭開始
      </button>
    </Paper>
  );
}

function Activities({ state, onPick }: { state: State; onPick: (id: string) => void }) {
  const year = yearOf(state);
  return (
    <Paper scene={year.scene} kicker="今年" title="你想點過">
      <p className="text-sm text-ink/70">兩次要唔同。揀完先至會發生其他事。</p>
      <div className="mt-3 flex flex-col gap-2">
        {year.activities.map((id) => {
          const activity = ACTIVITIES[id];
          const used = state.spent.includes(id);
          return (
            <button
              key={id}
              type="button"
              disabled={used}
              onClick={() => onPick(id)}
              className="flex min-h-14 flex-col items-start justify-center rounded-xl bg-bg px-4 py-3 text-left text-paper disabled:opacity-40"
            >
              <span className="text-base font-medium">{activity.label}</span>
              <span className="text-sm text-pretty text-paper/70">{used ? "今年用過" : activity.detail}</span>
            </button>
          );
        })}
      </div>
    </Paper>
  );
}

function EventCard({ state, onChoose }: { state: State; onChoose: (choice: ReturnType<typeof choicesFor>[number]) => void }) {
  const card = cardFor(state.eventId ?? "", state);
  const choices = choicesFor(state.eventId ?? "", state);
  return (
    <Paper scene={card.scene} kicker={card.kicker} title={card.title}>
      {card.lines.map((line) => (
        <p key={line} className="mt-2 text-pretty text-base leading-7 first:mt-0">
          {line}
        </p>
      ))}
      <div className="mt-4 flex flex-col gap-2">
        {choices.map((choice) => (
          <ChoiceButton
            key={choice.id}
            label={choice.label}
            onClick={() => onChoose(choice)}
          />
        ))}
      </div>
    </Paper>
  );
}

function BattleResult({ state, onRetry, onSettle }: { state: State; onRetry: () => void; onSettle: () => void }) {
  const story = battleStory(state.battle?.kind ?? "fail", state.approach ?? "safe");
  const retry = canRetry(state);
  return (
    <Paper scene="kindy" kicker="1985 · 第一日" title={retry ? "今日未入到" : "門口"}>
      <p className="text-pretty text-base leading-7">{story.text}</p>
      {retry ? <p className="mt-3 text-sm text-pretty text-ink/70">可以再試一次。再入唔到，就返屋企，第二日幼稚園仍然喺度。</p> : null}
      {retry ? <Primary onClick={onRetry}>再試一次</Primary> : null}
      <button type="button" onClick={onSettle} className="mt-2 min-h-12 w-full rounded-xl border border-line text-base text-ink">
        {retry ? "今日返屋企" : "繼續"}
      </button>
    </Paper>
  );
}

function YearEnd({ state, onNext }: { state: State; onNext: () => void }) {
  const year = yearOf(state);
  const memories = state.memories.filter((item) => item.year === year.year);
  const last = state.yearIndex >= 2;
  const hasGate = memories.some((item) => item.id === "MEM_FIRST_INDEPENDENCE");
  const missedGate = last && !hasGate && state.counter.COUNTER_EXPLORE < 2;
  return (
    <Paper scene="home" kicker={`${year.year} 完`} title="你記住咗">
      {memories.length === 0 ? <p className="text-base leading-7">呢一年好靜。</p> : null}
      <ul className="flex flex-col gap-3">
        {memories.map((item) => (
          <li key={item.id} className="border-l-2 border-amber pl-3 text-pretty text-base leading-7">
            {recallLine(item)}
          </li>
        ))}
      </ul>
      {memories.length > 0 ? <p className="mt-3 text-sm text-pretty text-ink/70">呢幾句會留低。下年可能會自己出返嚟。</p> : null}
      {missedGate ? <p className="mt-3 text-sm text-pretty text-ink/70">你未行到走廊盡頭。冇人逼你去。</p> : null}
      <Primary onClick={onNext}>{last ? "睇十年後" : "下一年"}</Primary>
    </Paper>
  );
}

function Ending({ state, onRestart }: { state: State; onRestart: () => void }) {
  const skills = state.skills.map((id) => SKILL_NAME[id] ?? id);
  return (
    <Paper scene="home" kicker="十年後" title="同一個屋邨">
      <p className="font-serif text-pretty text-xl leading-9">{lifeVoice(state.memories, state.name)}</p>
      <p className="mt-3 text-pretty text-base leading-7">{orientationLine(state.derived.VALUE_DREAM, state.derived.VALUE_REALITY)}</p>
      {state.flags.includes("FLAG_REPAIR_TALK") ? <p className="mt-3 text-pretty text-base leading-7">你同阿媽講過邨口。屋企近咗，個心緊過。</p> : null}
      {state.flags.includes("FLAG_REPAIR_SILENT") ? <p className="mt-3 text-pretty text-base leading-7">你冇講。少咗一場鬧，屋企少咗一句。</p> : null}
      <details className="mt-4">
        <summary className="min-h-11 text-sm text-ink/70">其他你記住嘅句</summary>
        <ul className="flex flex-col gap-3 pb-2">
          {state.memories.map((item) => (
            <li key={item.id} className="text-pretty text-base leading-7">
              {item.echo}
            </li>
          ))}
        </ul>
      </details>
      {skills.length > 0 ? <p className="mt-4 text-sm text-pretty text-ink/70">你識嘅事：{skills.join("、")}</p> : null}
      <Primary onClick={onRestart}>再活一次</Primary>
    </Paper>
  );
}

function LifeNow({ state }: { state: State }) {
  const mood = state.derived.STATE_MOOD >= 70 ? "鬆" : state.derived.STATE_MOOD >= 45 ? "普通" : "緊";
  const stress = state.derived.STATE_STRESS >= 60 ? "重" : state.derived.STATE_STRESS >= 30 ? "有啲" : "輕";
  const home = state.derived.STATE_FAMILY_HARMONY >= 70 ? "暖" : state.derived.STATE_FAMILY_HARMONY >= 45 ? "普通" : "靜";
  const gap = state.derived.VALUE_DREAM - state.derived.VALUE_REALITY;
  const lean = gap >= 8 ? "你偏向想做自己" : gap <= -8 ? "你偏向穩陣" : "想做同要做，仲未分";
  return (
    <div className="mt-4">
      <p className="text-pretty text-base leading-7">屋企而家{home}。你個心情{mood}，壓力{stress}。{lean}。</p>
      <details className="mt-3">
        <summary className="min-h-11 text-sm text-ink/70">人生檔案</summary>
        <p className="text-sm text-pretty text-ink/70">
          心情 {state.derived.STATE_MOOD} · 壓力 {state.derived.STATE_STRESS} · 家庭 {state.derived.STATE_FAMILY_HARMONY}
        </p>
        <p className="mt-2 text-sm text-pretty text-ink/70">
          夢想 {state.derived.VALUE_DREAM} · 現實 {state.derived.VALUE_REALITY} · 獨立思考 {state.derived.INDEPENDENT_THOUGHT}
        </p>
        <details className="mt-2">
          <summary className="min-h-11 text-sm text-ink/60">其餘</summary>
          <p className="text-sm text-pretty text-ink/60">
            心安 {state.derived.STATE_PEACE} · 健康 {state.derived.STATE_HEALTH} · 人脈 {state.derived.STATE_GLOBAL_NETWORK}
          </p>
          <p className="mt-2 text-sm text-pretty text-ink/60">
            {Object.entries(PRIMARY_LABEL)
              .map(([key, label]) => `${label} ${state.primary[key as keyof typeof state.primary]}`)
              .join(" · ")}
          </p>
        </details>
        <p className="mt-2 text-sm text-pretty text-ink/60">心安唔係戰鬥血量。戰鬥用精神力同幹勁。</p>
      </details>
    </div>
  );
}

const SENSE: Record<SceneId, string> = {
  home: "風扇、電視、碗碟。",
  kindy: "矮桌、膠凳、有人拖凳。",
  corridor: "走廊有衫晾住。",
  market: "膠袋、叫賣、地面有水。",
  estate: "鐵閘、信箱，遊樂場遠遠有聲。",
};

function Paper({ scene, kicker, title, children }: { scene: SceneId; kicker: string; title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line/40">
      <img src={`/scenes/${scene}.jpg`} alt="" className="h-44 w-full object-cover sm:h-52" />
      <div className="bg-paper px-4 py-4 text-ink">
        <p className="text-xs text-ink/60">{SENSE[scene]}</p>
        <p className="mt-2 text-xs tracking-wide text-ink/60">{kicker}</p>
        <h1 className="mt-1 font-serif text-2xl leading-snug text-pretty">{title}</h1>
        <div className="mt-3">{children}</div>
      </div>
    </section>
  );
}

function ResultBody({ result }: { result: NonNullable<State["result"]> }) {
  return (
    <>
      <p className="text-pretty text-base leading-7">{result.text}</p>
      {result.skills.length > 0 ? <p className="mt-3 text-sm text-ink/70">識咗：{result.skills.join("、")}</p> : null}
      {result.lean ? <p className="mt-3 text-sm text-ink/50">{result.lean}</p> : null}
      {result.deltas.length > 0 ? (
        <details className="mt-3">
          <summary className="min-h-11 text-sm text-ink/70">檔案記低咗</summary>
          <ul className="flex flex-wrap gap-2 pb-2">
            {result.deltas.map((delta, index) => (
              <li key={`${delta.label}-${index}`} className="rounded-full bg-line px-2.5 py-1 text-xs text-ink">
                {delta.label} {delta.value > 0 ? `+${delta.value}` : delta.value}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </>
  );
}

function ChoiceButton({ label, hint, onClick }: { label: string; hint?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mt-2 flex min-h-14 w-full items-center justify-between gap-3 rounded-xl bg-bg px-4 py-3 text-left">
      <span className="min-w-0 flex-1 text-base font-medium text-pretty text-paper">{label}</span>
      {hint ? <span className="shrink-0 text-xs text-paper/60">{hint}</span> : null}
    </button>
  );
}

function Primary({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mt-4 min-h-12 w-full rounded-xl bg-amber text-base font-medium text-ink">
      {children}
    </button>
  );
}

function sceneOf(state: State): SceneId {
  if (state.noteScene && state.phase === "note") return state.noteScene;
  if (state.eventId) return cardFor(state.eventId, state).scene;
  return yearOf(state).scene;
}
