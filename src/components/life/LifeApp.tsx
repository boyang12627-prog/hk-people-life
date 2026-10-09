import { createContext, useContext, useEffect, useReducer, useState, type ReactNode } from "react";
import { Battle } from "@/components/life/Battle";
import { playRoom, playTone, unlockAudio } from "@/components/life/audio";
import {
  activityDetail,
  activityLabel,
  cardFor,
  choicesFor,
  fifteenLines,
  fifteenAct,
  isLastYear,
  lifeVoice,
  exploreOfferCopy,
  exploreOfferGo,
  exploreOfferTitle,
  orientationSummary,
  PRIMARY_LABEL,
  recallLine,
  SKILL_NAME,
  yearOf,
  yearSummary,
} from "@/game/content";
import { MEMORY_BALL, afternoonPlate, beatPlate, eventPlate, personFromSpeaker, personSrc, scenePlate, slicePlate, yearPlate, type Mood, type PersonId, type Pose } from "@/game/art";
import { narrate, say, sceneTurns, type SceneLine, type Turn } from "@/game/scene";
import { chainEcho, knowsKit, missed1986, missedLine } from "@/game/freedom";
import { beat1985, isBeat } from "@/game/story";
import { battleNarrative } from "@/game/battleNarrative";
import { battleSpecById, PLAYTEST_KEY, playtestTools } from "@/game/battleSpec";
import { gearAttack, gearSpeed, gearStressResist } from "@/game/catalog";
import { canRetry, freshState, loadState, reducer, saveState } from "@/game/engine";
import { driveSp, spiritHp, type Gender, type SceneId, type State } from "@/game/types";

function heldLine(state: State) {
  const lines = [];
  if (state.equipped.includes("EQP_PLASTIC_WATCH")) lines.push("手上有一隻不會走的塑膠錶。");
  if (state.equipped.includes("EQP_BALLPOINT")) lines.push("筆盒裡有一支同學多出來的原子筆。");
  return lines.length ? lines.join("") : undefined;
}

const Face = createContext<Gender | null>(null);

function testerTools() {
  if (typeof window === "undefined") return false;
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(PLAYTEST_KEY);
  } catch {
    stored = null;
  }
  return playtestTools(window.location.search, stored);
}

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

  // Warm the cache for the next event's painting so it is ready when the card opens.
  const nextId = state.queue[0];
  useEffect(() => {
    if (!nextId || typeof Image === "undefined") return;
    const scene = cardFor(nextId, state).scene;
    const src = eventPlate(nextId, state.gender, scene) ?? slicePlate({ year: yearOf(state).year, scene, gender: state.gender });
    if (!src) return;
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  }, [nextId, state.gender]);

  const tap = (kind: "tap" | "soft" | "good" | "hit" = "tap") => {
    unlockAudio();
    playTone(kind);
  };

  return (
    <Face.Provider value={state.gender}>
    <main className="mx-auto flex h-dvh w-full max-w-lg flex-col bg-[#3a2616] px-2 py-2">
      <Top state={state} />
      <div className="min-h-0 flex-1">
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
      {state.phase === "story" && isBeat(state.note) ? <StoryBeat state={state} beat={state.note} onNext={() => { tap(); dispatch({ type: "ack" }); }} /> : null}
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
        <Paper scene={state.noteScene ?? "home"} plate={afternoonPlate(state.spent[state.spent.length - 1], state.gender)} kicker="這個下午" title="用了一個下午" dialogue={[narrate(state.result.text)]}>
          <ResultBody result={state.result} hideText />
          <Primary onClick={() => { tap(); dispatch({ type: "ack" }); }}>{state.apLeft > 0 ? "還有一個下午" : "接著是今年的事"}</Primary>
        </Paper>
      ) : null}
      {state.phase === "event" && state.eventId ? <EventCard state={state} onChoose={(choice) => { tap(); dispatch({ type: "choose", choice }); }} /> : null}
      {state.phase === "battle" && state.approach ? (
        <Battle
          spec={battleSpecById(state.battleSpecId)}
          approach={state.approach}
          hp={spiritHp(state.primary, state.approach === "safe" ? 5 : 0)}
          sp={driveSp(state.primary, state.derived.STATE_MOOD)}
          skills={state.skills}
          techniques={state.techniques}
          mind={state.primary.STAT_MIND}
          gearSpeed={gearSpeed(state.equipped)}
          stressResist={gearStressResist(state.equipped)}
          attack={gearAttack(state.equipped)}
          held={heldLine(state)}
          gender={state.gender}
          tools={testerTools()}
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
        <Paper scene={sceneOf(state)} plate={eventPlate(state.eventId, state.gender, sceneOf(state))} kicker="之後" title="你選了" dialogue={[narrate(state.result.text)]}>
          <ResultBody result={state.result} hideText />
          <Primary onClick={() => { tap(); dispatch({ type: "ack" }); }}>繼續</Primary>
        </Paper>
      ) : null}
      {state.phase === "repair" && state.result ? (
        <Paper scene="home" plate={beatPlate("sat-night", state.gender)} kicker="1986 · 夜晚" title="媽媽問你" dialogue={[say("媽媽", "為什麼走到門口？")]} mood="think">
          <p className="text-pretty text-base leading-7">{state.result.text}</p>
          <p className="mt-3 text-pretty text-base leading-7">
            {state.skills.includes("SKL_09")
              ? "你懂得自己走。今晚她仍然問你為什麼走到門口，但你不必解釋那麼多。"
              : "今晚她問你為什麼走到門口。你可以說，也可以不說。"}
          </p>
          <ChoiceButton label="告訴媽媽" onClick={() => { tap(); dispatch({ type: "repair", talk: true }); }} />
          <ChoiceButton label="不說，自己睡" onClick={() => { tap("soft"); dispatch({ type: "repair", talk: false }); }} />
        </Paper>
      ) : null}
      {state.phase === "explore-offer" ? (
        <Paper scene="estate" kicker="1986 · 年尾" title={exploreOfferTitle(state)} mood="think">
          <p className="text-pretty text-base leading-7">{exploreOfferCopy(state)}</p>
          <ChoiceButton label={exploreOfferGo(state)} hint="不用那兩個下午" onClick={() => { tap(); dispatch({ type: "explore", go: true }); }} />
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
      </div>
    </main>
    </Face.Provider>
  );
}

function hasBody(state: State) {
  if (state.phase === "title" || state.phase === "gender" || state.phase === "year" || state.phase === "activities") return true;
  if (state.phase === "story") return isBeat(state.note);
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
  const stamp = state.phase === "fifteen" ? "1996 · 15 歲" : year ? `${year.year} · ${year.age} 歲` : "1984–1988";
  return (
    <header className="mb-1 flex items-center justify-between rounded-t-md bg-[#5c3a1e] px-3 py-1.5 text-[#f6efe0]">
      <p className="font-serif text-base tracking-wide">人生・香港</p>
      <p className="text-sm">{showAp ? `${stamp} · ${state.apLeft >= 2 ? "兩個下午" : "一個下午"}` : stamp}</p>
    </header>
  );
}

function Title({ onStart }: { onStart: () => void }) {
  return (
    <Paper scene="estate" kicker="1984–1988" title="小時候那幾年">
      <p className="text-pretty text-base leading-7">一九八四到一九八六，你在屋邨長大。一九八八，你坐到書桌前。那不是新的一整年，只是一張測驗紙。你一路在選，才看見自己變成誰。</p>
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
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => onPick("boy", clean)} className="min-h-12 rounded-md border border-[#8a6232] bg-[#e7c27a] text-base font-medium text-ink">
          男孩
        </button>
        <button type="button" onClick={() => onPick("girl", clean)} className="min-h-12 rounded-md border border-[#8a6232] bg-[#e7c27a] text-base font-medium text-ink">
          女孩
        </button>
      </div>
    </Paper>
  );
}

function YearOpen({ state, onNext, onRestart }: { state: State; onNext: () => void; onRestart: () => void }) {
  const year = yearOf(state);
  const plate = yearPlate(year.year, state.gender) ?? slicePlate({ year: year.year, scene: year.scene, gender: state.gender });
  return (
    <Paper scene={year.scene} plate={plate} kicker={String(year.year)} title={year.title}>
      <p className="text-pretty text-base leading-7">{year.era}</p>
      <p className="mt-3 text-pretty text-base leading-7">{year.open}</p>
      {state.name ? <p className="mt-3 text-pretty text-base leading-7">別人叫你{state.name}。</p> : null}
      <p className="mt-3 text-sm text-pretty text-ink/70">
        {year.year === 1985
          ? "星期六早上。門還沒有開。"
          : year.year === 1986
            ? "星期六和星期日，人在的地方不一樣。你去了，不一定見到。"
            : "今年有兩個下午。你可以陪人、自己玩，或者休息。之後的事會自己來，不必你預先留時間。"}
      </p>
      {year.year === 1986 && state.chain.stage >= 4 ? <p className="mt-3 text-pretty text-base leading-7">{chainEcho(state.chain.choiceId)}</p> : null}
      {year.year === 1986 && state.personalityTags.includes("TAG_ON_YOUR_OWN") ? <p className="mt-3 text-pretty text-base leading-7">去年那兩個下午，你都是自己過的。</p> : null}
      {year.year === 1986 && state.personalityTags.includes("TAG_WITH_FAMILY") ? <p className="mt-3 text-pretty text-base leading-7">去年那兩個下午，你都在家裡人旁邊。</p> : null}
      {year.year === 1986 && missedLine(state.missed, "later") ? <p className="mt-3 text-pretty text-base leading-7">{missedLine(state.missed, "later")}</p> : null}
      {year.year === 1988 && missed1986(state.missed, "later", knowsKit(state)) ? <p className="mt-3 text-pretty text-base leading-7">{missed1986(state.missed, "later", knowsKit(state))}</p> : null}
      <LifeNow state={state} />
      <Primary onClick={onNext}>{year.year === 1985 ? "早上" : "用這兩個下午"}</Primary>
      <button type="button" onClick={onRestart} className="mt-2 min-h-11 w-full text-sm text-ink/70">
        從頭開始
      </button>
    </Paper>
  );
}

function StoryBeat({ state, beat, onNext }: { state: State; beat: Parameters<typeof beat1985>[0]; onNext: () => void }) {
  const page = beat1985(beat, state);
  return (
    <Paper scene={page.scene} plate={beatPlate(beat, state.gender)} kicker={page.kicker} title={page.title} dialogue={page.sequence}>
      <Primary onClick={onNext}>{beat === "aftermath" ? "這一年就這樣" : "繼續"}</Primary>
    </Paper>
  );
}

function Activities({ state, onPick }: { state: State; onPick: (id: string) => void }) {
  const year = yearOf(state);
  const timed = year.year === 1985 || year.year === 1986;
  const choosing = year.year === 1985 && state.spent.length === 0 ? beatPlate("downstairs", state.gender) : scenePlate("home", state.gender);
  return (
    <Paper scene="home" plate={choosing} kicker="今年" title={year.year === 1985 ? (state.spent.length ? "星期日下午" : "星期六下午") : timed ? "這兩個下午" : "今天怎麼過"} mood="think" dialogue={[narrate(
      year.year === 1985
        ? state.spent.length
          ? "昨天已經過了。今天再過一個下午。"
          : "早上你在樓梯口停過。這個下午你自己過。"
        : timed
          ? "先過星期六，再過星期日。兩天不要做同一件事。"
          : "兩個下午要不同。選完，其他事才來。",
    )]}>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {(timed ? ["星期六下午", "星期日下午"] : ["第一個下午", "第二個下午"]).map((label, slot) => {
          const id = state.spent[slot];
          return (
            <p key={label} className="rounded-xl bg-line/40 px-3 py-2 text-sm text-ink">
              {label}
              <span className="mt-1 block">{id ? activityLabel(id, year.year, slot) : "還沒過"}</span>
            </p>
          );
        })}
      </div>
      {timed ? <p className="mt-3 text-sm text-pretty text-ink/70">人已經在某個地方。你去了，才碰得上。自己玩、塗鴉、休息，都是留在家。</p> : null}
      <div className="mt-3 flex flex-col gap-2">
        {year.activities.map((id) => {
          const used = state.spent.includes(id);
          const slot = state.spent.length;
          return (
            <button
              key={id}
              type="button"
              disabled={used}
              onClick={() => onPick(id)}
              className="mt-2 flex min-h-14 flex-col items-start justify-center rounded-md border border-[#c4a574] bg-[#fff8ea] px-3 py-2 text-left text-ink disabled:opacity-40"
            >
              <span className="text-base font-medium">{used ? activityLabel(id, year.year, state.spent.indexOf(id)) : activityLabel(id, year.year, slot)}</span>
              <span className="text-sm text-pretty text-ink/60">{used ? "今年去過" : activityDetail(id, year.year, slot)}</span>
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
  const year = yearOf(state);
  const plate = eventPlate(state.eventId, state.gender, card.scene) ?? slicePlate({ year: year.year, scene: card.scene, gender: state.gender });
  return (
    <Paper
      scene={card.scene}
      plate={plate}
      kicker={card.kicker}
      title={card.title}
      mood="think"
      dialogue={card.sequence}
    >
      <div className="mt-1 flex flex-col gap-2">
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
  const copy = battleNarrative(state.battleSpecId);
  const retry = canRetry(state);
  const plate = copy.scene === "kindy" ? slicePlate({ year: 1985, scene: "kindy", gender: state.gender, battle: retry ? "door" : "inside" }) : null;
  return (
    <Paper scene={copy.scene} plate={plate} kicker={copy.kicker} title={retry ? copy.retryTitle : copy.title} dialogue={[narrate(copy.text(state.battle?.kind ?? "fail", state.approach ?? "safe")), ...(retry ? [narrate(copy.retryNote)] : [])]}>
      {retry ? <Primary onClick={onRetry}>再試一次</Primary> : null}
      <button type="button" onClick={onSettle} className="mt-2 min-h-12 w-full rounded-md border border-[#c4a574] bg-[#fff8ea] text-base text-ink">
        {retry ? copy.homeLabel : copy.continueLabel}
      </button>
    </Paper>
  );
}

function YearEnd({ state, onNext }: { state: State; onNext: () => void }) {
  const year = yearOf(state);
  const memories = state.memories.filter((item) => item.year === year.year);
  const last = isLastYear(state.yearIndex);
  const hasGate = memories.some((item) => item.id === "MEM_FIRST_INDEPENDENCE");
  const missedGate = year.year === 1986 && !hasGate && state.counter.COUNTER_EXPLORE < 2;
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
      <p className="mt-3 text-pretty text-base leading-7">{yearSummary(state)}</p>
      {state.personalityTags.includes("TAG_EMPATHY") ? <p className="mt-3 text-pretty text-base leading-7">這一年，你有時會坐過去，不必人叫。</p> : null}
      {year.year === 1985 && missedLine(state.missed, "now") ? <p className="mt-3 text-pretty text-base leading-7">{missedLine(state.missed, "now")}</p> : null}
      {year.year === 1986 && missed1986(state.missed, "now", knowsKit(state)) ? <p className="mt-3 text-pretty text-base leading-7">{missed1986(state.missed, "now", knowsKit(state))}</p> : null}
      {missedGate ? <p className="mt-3 text-sm text-pretty text-ink/70">你還沒走到走廊盡頭。沒有人逼你去。</p> : null}
      <Primary onClick={onNext}>{last ? "看看十年後" : "下一年"}</Primary>
    </Paper>
  );
}

function Fifteen({ state, onAct }: { state: State; onAct: () => void }) {
  const act = fifteenAct(state);
  // The overlay is a small hand and the red ball. Only a child who was near that ball gets it.
  const echo = state.memories.some((item) => item.id === "MEM_RED_BALL" || item.id === "MEM_KIT_WAIT" || item.id === "MEM_FRIEND_AGAIN");
  return (
    <Paper scene="home" plate={beatPlate("sat-night", state.gender)} kicker="1996 · 十五歲" title="自己回家">
      <div className="relative">
        {echo ? <img src={MEMORY_BALL} alt="" loading="lazy" decoding="async" className="pointer-events-none float-right mb-2 ml-3 h-24 w-24 rounded-lg object-cover opacity-50" /> : null}
        {fifteenLines(state).map((line) => (
          <p key={line} className="mt-2 text-pretty text-base leading-7 first:mt-0">
            {line}
          </p>
        ))}
      </div>
      <Primary onClick={onAct}>{act.label}</Primary>
    </Paper>
  );
}

function Ending({ state, onRestart }: { state: State; onRestart: () => void }) {
  const skills = state.skills.map((id) => SKILL_NAME[id] ?? id);
  return (
    <Paper scene="estate" kicker="十年後" title="同一個屋邨">
      <p className="font-serif text-pretty text-xl leading-9">{lifeVoice(state.memories, state.name)}</p>
      <p className="mt-3 text-pretty text-base leading-7">{orientationSummary(state)}</p>
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
  home: "廳裡的電視還沒關，碗碟都還沒收。",
  kindy: "有人拖著塑膠凳。紅球放在角落。",
  corridor: "走廊晾滿衣服，燈有些黃。媽媽的袋子放在地上。",
  market: "街市。那天地面很濕，魚檔的水滲進鞋子。",
  estate: "大廈門口的鐵閘拉上了。遊樂場的鞦韆響著。",
  study: "課室的風扇響著。卷子已經翻開，時鐘在黑板旁邊。",
};

/** One row per scene entry. Narration, action, and dialogue are all drawn; none is dropped. */
function Dialogue({ turns, face }: { turns: Turn[]; face: (id: PersonId) => string }) {
  return (
    <div className="max-h-40 shrink-0 overflow-y-auto border-b-2 border-[#8a6232] bg-[#fffaf0] px-3 py-2 text-ink">
      {turns.map((turn, index) => {
        const person = turn.speaker ? personFromSpeaker(turn.speaker) : null;
        return (
          <div key={`${index}-${turn.text}`} className="mt-2 flex items-start gap-2 first:mt-0" data-kind={turn.kind}>
            {person ? <img src={face(person)} alt="" loading="lazy" decoding="async" className="h-8 w-8 shrink-0 rounded-full border border-[#c4a574] object-cover object-[center_18%]" /> : <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#c4a574] text-xs text-[#6e4524]">{turn.name.slice(0, 1)}</span>}
            <div className="min-w-0">
              <p className={turn.kind === "action" ? "text-xs tracking-wide text-ink/50" : "font-serif text-sm tracking-wide text-[#6e4524]"}>{turn.name}</p>
              <p className={turn.kind === "dialogue" ? "text-pretty text-base leading-7" : "text-pretty text-base leading-7 text-ink/80"}>{turn.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Paper({ scene, plate, kicker, title, mood = "idle", dialogue, children }: { scene: SceneId; plate?: string | null; kicker: string; title: string; mood?: Mood; dialogue?: SceneLine[]; children: ReactNode }) {
  const gender = useContext(Face);
  const pose: Pose = scene === "home" || scene === "study" ? "sit" : "stand";
  const face = (id: PersonId) => personSrc(id, gender, id === "child" ? mood : "idle", pose);
  const turns = sceneTurns(dialogue?.length ? dialogue : [narrate(SENSE[scene])]);
  const picture = plate ?? scenePlate(scene, gender);
  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border-4 border-[#6e4524] bg-[#f4efe4] shadow-[inset_0_0_0_2px_#e8d7a8]">
      <div className="relative h-[34%] min-h-32 shrink-0">
        <img src={picture} alt="" decoding="async" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1c140c]/25 to-transparent" />
      </div>
      <Dialogue turns={turns} face={face} />
      <div className="flex min-h-0 flex-1 flex-col bg-[#f6efe0] text-ink">
        <div className="shrink-0 border-b border-[#e0d3bf] px-3 py-2">
          <p className="text-xs tracking-wide text-ink/50">{kicker}</p>
          <h1 className="font-serif text-xl leading-snug text-pretty">{title}</h1>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">{children}</div>
      </div>
    </section>
  );
}

function ResultBody({ result, hideText = false }: { result: NonNullable<State["result"]>; hideText?: boolean }) {
  return (
    <>
      {hideText ? null : <p className="text-pretty text-base leading-7">{result.text}</p>}
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
    <button type="button" onClick={onClick} className="mt-2 flex min-h-12 w-full items-center justify-between gap-3 rounded-md border border-[#c4a574] bg-[#fff8ea] px-3 py-2 text-left">
      <span className="min-w-0 flex-1 text-base font-medium text-pretty text-ink">{label}</span>
      {hint ? <span className="shrink-0 text-xs text-ink/50">{hint}</span> : null}
    </button>
  );
}

function Primary({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mt-3 min-h-12 w-full rounded-md border border-[#8a6232] bg-[#e7c27a] text-base font-medium text-ink">
      {children}
    </button>
  );
}

function sceneOf(state: State): SceneId {
  if (state.noteScene && state.phase === "note") return state.noteScene;
  if (state.eventId) return cardFor(state.eventId, state).scene;
  return yearOf(state).scene;
}
