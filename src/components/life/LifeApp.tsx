import { useEffect, useReducer, useState, type ReactNode } from "react";
import { Battle } from "@/components/life/Battle";
import { playRoom, playTone, unlockAudio } from "@/components/life/audio";
import {
  ACTIVITIES,
  battleStory,
  cardFor,
  choicesFor,
  fifteenLines,
  fifteenAct,
  lifeVoice,
  orientationLine,
  PRIMARY_LABEL,
  recallLine,
  SKILL_NAME,
  yearLean,
  yearOf,
} from "@/game/content";
import { KINDY_DOOR } from "@/game/battleSpec";
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
    <main className="mx-auto h-dvh w-full max-w-lg overflow-y-auto overscroll-contain px-4 py-3 pb-24">
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
        <Paper scene={state.noteScene ?? "home"} kicker="這個下午" title="用了一個下午">
          <ResultBody result={state.result} />
          <Primary onClick={() => { tap(); dispatch({ type: "ack" }); }}>{state.apLeft > 0 ? "還有一個下午" : "接著是今年的事"}</Primary>
        </Paper>
      ) : null}
      {state.phase === "event" && state.eventId ? <EventCard state={state} onChoose={(choice) => { tap(); dispatch({ type: "choose", choice }); }} /> : null}
      {state.phase === "battle" && state.approach ? (
        <Battle
          spec={KINDY_DOOR}
          approach={state.approach}
          hp={spiritHp(state.primary, state.approach === "safe" ? 5 : 0)}
          sp={driveSp(state.primary, state.derived.STATE_MOOD)}
          skills={state.skills}
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
        <Paper scene={sceneOf(state)} kicker="之後" title="你選了">
          <ResultBody result={state.result} />
          <Primary onClick={() => { tap(); dispatch({ type: "ack" }); }}>繼續</Primary>
        </Paper>
      ) : null}
      {state.phase === "repair" && state.result ? (
        <Paper scene="home" kicker="1986 · 夜晚" title="媽媽問你">
          <p className="text-pretty text-base leading-7">{state.result.text}</p>
          <p className="mt-3 text-pretty text-base leading-7">
            {state.skills.includes("SKL_09")
              ? "你懂得自己走。今晚她仍然問你為什麼走到門口，但你不必解釋那麼多。"
              : "今晚她問你為什麼走到門口。你可以說，也可以不說。"}
          </p>
          <ChoiceButton label="告訴媽媽" hint="說了會近一些，心裡會緊" onClick={() => { tap(); dispatch({ type: "repair", talk: true }); }} />
          <ChoiceButton label="不說，自己睡" hint="少一句責罵，自己收著" onClick={() => { tap("soft"); dispatch({ type: "repair", talk: false }); }} />
        </Paper>
      ) : null}
      {state.phase === "explore-offer" ? (
        <Paper scene="estate" kicker="1986 · 年尾" title="要不要再下一次平台">
          <p className="text-pretty text-base leading-7">你下平台的次數還不夠。再下一次，才走到屋邨門口。你也可以留在家裡，不去也行。</p>
          <ChoiceButton label="下一次平台" hint="這次不計入那兩個下午" onClick={() => { tap(); dispatch({ type: "explore", go: true }); }} />
          <ChoiceButton label="留在家裡" hint="不去也行" onClick={() => { tap("soft"); dispatch({ type: "explore", go: false }); }} />
        </Paper>
      ) : null}
      {state.phase === "year-end" ? <YearEnd state={state} onNext={() => { tap(); dispatch({ type: "nextYear" }); }} /> : null}
      {state.phase === "fifteen" ? <Fifteen state={state} onAct={() => { tap(); dispatch({ type: "fifteenAct" }); }} /> : null}
      {state.phase === "ending" ? <Ending state={state} onRestart={() => { tap(); dispatch({ type: "restart" }); }} /> : null}
      {hasBody(state) ? null : (
        <Paper scene="home" kicker="這頁沒有畫面" title="重新開始">
          <p className="text-pretty text-base leading-7">這一頁沒有東西可以選。重新開始這三年。</p>
          <Primary onClick={() => dispatch({ type: "restart" })}>重新開始</Primary>
        </Paper>
      )}
    </main>
  );
}

function hasBody(state: State) {
  if (state.phase === "title" || state.phase === "gender" || state.phase === "year" || state.phase === "activities") return true;
  if (state.phase === "explore-offer" || state.phase === "year-end" || state.phase === "fifteen" || state.phase === "ending") return true;
  if (state.phase === "note" || state.phase === "result" || state.phase === "repair") return !!state.result;
  if (state.phase === "event") return !!state.eventId;
  if (state.phase === "battle") return !!state.approach;
  if (state.phase === "battle-result") return !!state.battle && !!state.approach;
  return false;
}

function Top({ state }: { state: State }) {
  const year = state.phase === "title" || state.phase === "gender" || state.phase === "ending" || state.phase === "fifteen" ? null : yearOf(state);
  const showAp = state.phase === "activities" || state.phase === "year";
  const stamp = state.phase === "fifteen" ? "1996 · 15 歲" : year ? `${year.year} · ${year.age} 歲` : "1984–1986";
  return (
    <header className="mb-3 flex items-end justify-between gap-3">
      <div>
        <p className="font-serif text-xl tracking-wide text-paper">人生・香港</p>
        <p className="text-sm text-paper/70">{stamp}</p>
      </div>
      {showAp ? <p className="text-sm text-paper/70">{state.apLeft >= 2 ? "還有兩個下午" : "還有一個下午"}</p> : null}
    </header>
  );
}

function Title({ onStart }: { onStart: () => void }) {
  return (
    <Paper scene="estate" kicker="幼年" title="小時候那三年">
      <p className="text-pretty text-base leading-7">一九八四到一九八六。你在屋邨長大。你一路在選，過了這三年，才看見自己變成誰。</p>
      <Primary onClick={onStart}>開始</Primary>
    </Paper>
  );
}

function GenderPick({ onPick }: { onPick: (gender: Gender, name: string) => void }) {
  const [name, setName] = useState("");
  const clean = name.trim().slice(0, 8);
  return (
    <Paper scene="home" kicker="開始之前" title="你是？">
      <p className="text-pretty text-base leading-7">男孩或女孩。想留個名字也可以，不寫也行。</p>
      <label className="mt-3 block text-sm text-ink/70">
        別人怎麼叫你
        <input
          value={name}
          maxLength={8}
          placeholder="不寫也行"
          onChange={(event) => setName(event.target.value)}
          className="mt-1 min-h-11 w-full rounded-xl border border-line bg-paper px-3 text-base text-ink"
        />
      </label>
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto grid w-full max-w-lg grid-cols-2 gap-2 bg-bg/95 px-4 py-3">
        <button type="button" onClick={() => onPick("boy", clean)} className="min-h-12 rounded-xl bg-amber text-base font-medium text-ink">
          男孩
        </button>
        <button type="button" onClick={() => onPick("girl", clean)} className="min-h-12 rounded-xl bg-amber text-base font-medium text-ink">
          女孩
        </button>
      </div>
    </Paper>
  );
}

function YearOpen({ state, onNext, onRestart }: { state: State; onNext: () => void; onRestart: () => void }) {
  const year = yearOf(state);
  const title = year.year === 1984 ? "飯桌" : year.year === 1985 ? "門口" : "走廊";
  return (
    <Paper scene={year.scene} kicker={String(year.year)} title={title}>
      <p className="text-pretty text-base leading-7">{year.era}</p>
      <p className="mt-3 text-pretty text-base leading-7">{year.open}</p>
      {state.name ? <p className="mt-3 text-pretty text-base leading-7">別人叫你{state.name}。</p> : null}
      <p className="mt-3 text-sm text-pretty text-ink/70">今年有兩個下午。你可以陪人、自己玩，或者休息。之後的事會自己來，不必你預先留時間。</p>
      <LifeNow state={state} />
      <Primary onClick={onNext}>用這兩個下午</Primary>
      <button type="button" onClick={onRestart} className="mt-2 min-h-11 w-full text-sm text-ink/70">
        從頭開始
      </button>
    </Paper>
  );
}

function Activities({ state, onPick }: { state: State; onPick: (id: string) => void }) {
  const year = yearOf(state);
  return (
    <Paper scene={year.scene} kicker="今年" title="今天怎麼過">
      <p className="text-sm text-ink/70">兩個下午要不同。選完，其他事才來。</p>
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
              <span className="text-sm text-pretty text-paper/70">{used ? "今年去過" : activity.detail}</span>
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
    <Paper scene="kindy" kicker="1985 · 第一日" title={retry ? "今天沒進去" : "門口"}>
      <p className="text-pretty text-base leading-7">{story.text}</p>
      {retry ? <p className="mt-3 text-sm text-pretty text-ink/70">可以再試一次。再進不去，就回家。幼稚園明天仍然開。</p> : null}
      {retry ? <Primary onClick={onRetry}>再試一次</Primary> : null}
      <button type="button" onClick={onSettle} className="mt-2 min-h-12 w-full rounded-xl border border-line text-base text-ink">
        {retry ? "今天回家" : "繼續"}
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
    <Paper scene="home" kicker={`${year.year} 完`} title="你記住了">
      {memories.length === 0 ? <p className="text-base leading-7">這一年沒有什麼特別的事。</p> : null}
      <ul className="flex flex-col gap-3">
        {memories.map((item) => (
          <li key={item.id} className="border-l-2 border-amber pl-3 text-pretty text-base leading-7">
            {recallLine(item)}
          </li>
        ))}
      </ul>
      {memories.length > 0 ? <p className="mt-3 text-sm text-pretty text-ink/70">這幾句會留下。明年可能會再出現。</p> : null}
      <p className="mt-3 text-pretty text-base leading-7">{yearLean(state.derived.VALUE_DREAM, state.derived.VALUE_REALITY)}</p>
      {state.personalityTags.includes("TAG_EMPATHY") ? <p className="mt-3 text-pretty text-base leading-7">這一年，你有時會坐過去，不必人叫。</p> : null}
      {missedGate ? <p className="mt-3 text-sm text-pretty text-ink/70">你還沒走到走廊盡頭。沒有人逼你去。</p> : null}
      <Primary onClick={onNext}>{last ? "看看十年後" : "下一年"}</Primary>
    </Paper>
  );
}

function Fifteen({ state, onAct }: { state: State; onAct: () => void }) {
  const act = fifteenAct(state);
  return (
    <Paper scene="home" kicker="1996 · 十五歲" title="自己回家">
      {fifteenLines(state).map((line) => (
        <p key={line} className="mt-2 text-pretty text-base leading-7 first:mt-0">
          {line}
        </p>
      ))}
      <Primary onClick={onAct}>{act.label}</Primary>
    </Paper>
  );
}

function Ending({ state, onRestart }: { state: State; onRestart: () => void }) {
  const skills = state.skills.map((id) => SKILL_NAME[id] ?? id);
  return (
    <Paper scene="home" kicker="十年後" title="同一個屋邨">
      <p className="font-serif text-pretty text-xl leading-9">{lifeVoice(state.memories, state.name)}</p>
      <p className="mt-3 text-pretty text-base leading-7">{orientationLine(state.derived.VALUE_DREAM, state.derived.VALUE_REALITY)}</p>
      {state.flags.includes("FLAG_REPAIR_TALK") ? <p className="mt-3 text-pretty text-base leading-7">你跟媽媽談過屋邨門口。家裡近了，但心裡緊過。</p> : null}
      {state.flags.includes("FLAG_REPAIR_SILENT") ? <p className="mt-3 text-pretty text-base leading-7">你沒有說。少了一場責罵，家裡少了一句。</p> : null}
      <details className="mt-4">
        <summary className="min-h-11 text-sm text-ink/70">其他你記住的句子</summary>
        <ul className="flex flex-col gap-3 pb-2">
          {state.memories.map((item) => (
            <li key={item.id} className="text-pretty text-base leading-7">
              {item.echo}
            </li>
          ))}
        </ul>
      </details>
      {skills.length > 0 ? <p className="mt-4 text-sm text-pretty text-ink/70">你會的事：{skills.join("、")}</p> : null}
      <Primary onClick={onRestart}>再來一次</Primary>
    </Paper>
  );
}

function LifeNow({ state }: { state: State }) {
  const home =
    state.derived.STATE_FAMILY_HARMONY >= 70 ? "家裡現在還算和氣" : state.derived.STATE_FAMILY_HARMONY >= 45 ? "家裡現在普普通通" : "家裡現在很少說話";
  const mood = state.derived.STATE_MOOD >= 70 ? "你心情很好" : state.derived.STATE_MOOD >= 45 ? "你心情普通" : "你心情不太好";
  const stress = state.derived.STATE_STRESS >= 60 ? "壓力很大" : state.derived.STATE_STRESS >= 30 ? "有一點壓力" : "沒有什麼壓力";
  return (
    <div className="mt-4">
      <p className="text-pretty text-base leading-7">
        {home}。{mood}，{stress}。
      </p>
      <details className="mt-3">
        <summary className="min-h-11 text-sm text-ink/70">看數字</summary>
        <p className="text-sm text-pretty text-ink/70">
          心情 {state.derived.STATE_MOOD} · 壓力 {state.derived.STATE_STRESS} · 家裡 {state.derived.STATE_FAMILY_HARMONY}
        </p>
        <p className="mt-2 text-sm text-pretty text-ink/70">
          想做 {state.derived.VALUE_DREAM} · 要做 {state.derived.VALUE_REALITY} · 自己想 {state.derived.INDEPENDENT_THOUGHT}
        </p>
        <details className="mt-2">
          <summary className="min-h-11 text-sm text-ink/60">其餘</summary>
          <p className="text-sm text-pretty text-ink/60">
            心安 {state.derived.STATE_PEACE} · 健康 {state.derived.STATE_HEALTH} · 熟人 {state.derived.STATE_GLOBAL_NETWORK}
          </p>
          <p className="mt-2 text-sm text-pretty text-ink/60">
            {Object.entries(PRIMARY_LABEL)
              .map(([key, label]) => `${label} ${state.primary[key as keyof typeof state.primary]}`)
              .join(" · ")}
          </p>
        </details>
      </details>
    </div>
  );
}

const SENSE: Record<SceneId, string> = {
  home: "廳裡的風扇轉著，電視還沒關，碗碟都還沒收。",
  kindy: "有人拖著塑膠凳。紅球放在角落。",
  corridor: "走廊晾滿衣服，燈有些黃。媽媽的袋子放在地上。",
  market: "街市。那天地面很濕，魚檔的水滲進鞋子。",
  estate: "大廈門口的鐵閘拉上了。遊樂場的鞦韆響著。",
};

function Paper({ scene, kicker, title, children }: { scene: SceneId; kicker: string; title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line/40">
      <img src={`/scenes/${scene}.jpg`} alt="" className="h-16 w-full object-cover" />
      <div className="bg-paper px-4 py-3 text-ink">
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
      {result.skills.length > 0 ? <p className="mt-3 text-sm text-ink/70">學會了：{result.skills.join("、")}</p> : null}
      {result.lean ? <p className="mt-3 text-sm text-ink/50">{result.lean}</p> : null}
      {result.deltas.length > 0 ? (
        <details className="mt-3">
          <summary className="min-h-11 text-sm text-ink/70">記下了</summary>
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
    <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-lg bg-bg/95 px-4 py-3">
      <button type="button" onClick={onClick} className="min-h-12 w-full rounded-xl bg-amber text-base font-medium text-ink">
        {children}
      </button>
    </div>
  );
}

function sceneOf(state: State): SceneId {
  if (state.noteScene && state.phase === "note") return state.noteScene;
  if (state.eventId) return cardFor(state.eventId, state).scene;
  return yearOf(state).scene;
}
