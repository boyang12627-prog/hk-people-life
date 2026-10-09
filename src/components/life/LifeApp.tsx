import { Children, Fragment, createContext, isValidElement, useContext, useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { Battle } from "@/components/life/Battle";
import { playRoom, playTone, unlockAudio } from "@/components/life/audio";
import { ConfirmLink, Frame, LocationTag, PanelHeading, PanelPortrait, PaperPanel, ScrollCue, StatusContext, Tag, useAdvanceKeys, useReveal, useScrollCue, type Status } from "@/components/life/Stage";
import { expandSpokenNarration } from "@/game/narrationSpeech";
import { ACTION_LOCK_MS } from "@/game/reveal";
import { lineAt } from "@/game/reveal";
import { SPEAKER_ACCENT, anchorFor, isOffscreen } from "@/game/sceneAnchors";
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
import { MEMORY_BALL, afternoonPlate, beatPlate, eraPlate, eventPlate, fifteenPlate, endingPlate, homePlate, PLAIN_TV_EVENTS, personFromSpeaker, personPortrait, protagonistPortrait, scenePlate, slicePlate, yearPlate, type Mood } from "@/game/art";
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
    <StatusContext.Provider value={statusOf(state)}>
    <main className="ui-letterbox flex h-dvh w-full items-start justify-center overflow-hidden md:items-center">
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
        <Paper
          scene={state.noteScene ?? "home"}
          plate={afternoonPlate(state.spent[state.spent.length - 1], state.gender)}
          kicker="這個下午"
          title="用了一個下午"
          dialogue={[narrate(state.result.text)]}
          actions={<Primary onClick={() => { tap(); dispatch({ type: "ack" }); }}>{state.apLeft > 0 ? "還有一個下午" : "接著是今年的事"}</Primary>}
        >
          <ResultBody result={state.result} hideText />
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
        <Paper scene={sceneOf(state)} plate={eventPlate(state.eventId, state.gender, sceneOf(state), cardFor(state.eventId ?? "", state).title)} plainTv={PLAIN_TV_EVENTS.has(state.eventId ?? "")} kicker="之後" title="你選了" dialogue={[narrate(state.result.text)]} actions={<Primary onClick={() => { tap(); dispatch({ type: "ack" }); }}>繼續</Primary>}>
          <ResultBody result={state.result} hideText />
        </Paper>
      ) : null}
      {state.phase === "repair" && state.result ? (
        <Paper
          scene="home"
          plate={beatPlate("sat-night", state.gender)}
          kicker="1986 · 夜晚"
          title="媽媽問你"
          dialogue={[say("媽媽", "為什麼走到門口？")]}
          mood="think"
          actions={
            <>
              <ChoiceButton label="告訴媽媽" onClick={() => { tap(); dispatch({ type: "repair", talk: true }); }} />
              <ChoiceButton label="不說，自己睡" onClick={() => { tap("soft"); dispatch({ type: "repair", talk: false }); }} />
            </>
          }
        >
          <p className="text-pretty text-base leading-7">{state.result.text}</p>
          <p className="mt-3 text-pretty text-base leading-7">
            {state.skills.includes("SKL_09")
              ? "你懂得自己走。今晚她仍然問你為什麼走到門口，但你不必解釋那麼多。"
              : "今晚她問你為什麼走到門口。你可以說，也可以不說。"}
          </p>
        </Paper>
      ) : null}
      {state.phase === "explore-offer" ? (
        <Paper
          scene="estate"
          kicker="1986 · 年尾"
          title={exploreOfferTitle(state)}
          mood="think"
          actions={
            <>
              <ChoiceButton label={exploreOfferGo(state)} hint="不用那兩個下午" onClick={() => { tap(); dispatch({ type: "explore", go: true }); }} />
              <ChoiceButton label="留在家裡" hint="不去也行" onClick={() => { tap("soft"); dispatch({ type: "explore", go: false }); }} />
            </>
          }
        >
          <p className="text-pretty text-base leading-7">{exploreOfferCopy(state)}</p>
        </Paper>
      ) : null}
      {state.phase === "year-end" ? <YearEnd state={state} onNext={() => { tap(); dispatch({ type: "nextYear" }); }} /> : null}
      {state.phase === "fifteen" ? <Fifteen state={state} onAct={() => { tap(); dispatch({ type: "fifteenAct" }); }} /> : null}
      {state.phase === "ending" ? <Ending state={state} onRestart={() => { tap(); dispatch({ type: "restart" }); }} /> : null}
      {hasBody(state) ? null : (
        <Paper scene="home" kicker="這頁沒有畫面" title="重新開始" actions={<Primary onClick={() => dispatch({ type: "restart" })}>重新開始</Primary>}>
          <p className="text-pretty text-base leading-7">這一頁沒有東西可以選。重新開始這三年。</p>
        </Paper>
      )}
    </main>
    </StatusContext.Provider>
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

/** What the wooden frame top-left shows, and the afternoons left this year. */
function statusOf(state: State): Status {
  const outside = state.phase === "title" || state.phase === "gender";
  const later = state.phase === "fifteen" || state.phase === "ending";
  const year = outside || later ? null : yearOf(state);
  const label = state.phase === "fifteen" ? "1996・15歲" : state.phase === "ending" ? "十年後" : year ? `${year.year}・${year.age}歲` : "1984–1988";
  const portraitYear = state.phase === "fifteen" ? 1996 : year?.year;
  const portrait = portraitYear && state.gender ? protagonistPortrait(portraitYear, state.gender) : null;
  const counts = state.phase === "year" || state.phase === "activities" || state.phase === "note" || state.phase === "story" || state.phase === "event" || state.phase === "result";
  const storyYear = state.phase === "fifteen" ? 1996 : year?.year ?? null;
  return { label, portrait, afternoons: counts ? state.apLeft : null, year: storyYear };
}

function Title({ onStart }: { onStart: () => void }) {
  return (
    <Paper
      scene="estate"
      kicker="1984–1988"
      title="小時候那幾年"
      dialogue={[narrate("一九八四到一九八六，你在屋邨長大。一九八八，你坐到書桌前。那不是新的一整年，只是一張測驗紙。你一路在選，才看見自己變成誰。")]}
      overlay={
        <div className="pointer-events-none absolute inset-x-0 top-[14%] flex justify-center">
          <p className="ui-paper-label rotate-[-1.5deg] rounded-sm px-5 py-2 font-serif text-2xl tracking-[0.3em] md:px-8 md:py-3 md:text-5xl">人生・香港</p>
        </div>
      }
      actions={<Primary onClick={onStart}>開始</Primary>}
    />
  );
}

function GenderPick({ onPick }: { onPick: (gender: Gender, name: string) => void }) {
  const [name, setName] = useState("");
  const clean = name.trim().slice(0, 8);
  return (
    <Paper
      scene="home"
      kicker="開始之前"
      title="你是？"
      dialogue={[narrate("男孩或女孩。想留個名字也可以，不寫也行。")]}
      actions={
        <>
          <Primary onClick={() => onPick("boy", clean)}>男孩</Primary>
          <Primary onClick={() => onPick("girl", clean)}>女孩</Primary>
        </>
      }
    >
      <label className="mt-2 block text-sm text-ink/75">
        別人怎麼叫你
        <input
          value={name}
          maxLength={8}
          placeholder="不寫也行"
          onChange={(event) => setName(event.target.value)}
          className="mt-1 min-h-11 w-full rounded-sm border border-[#a77f4c] bg-[#fbf5e6] px-3 text-base text-ink placeholder:text-ink/45"
        />
      </label>
    </Paper>
  );
}

function YearOpen({ state, onNext, onRestart }: { state: State; onNext: () => void; onRestart: () => void }) {
  const year = yearOf(state);
  const plate = yearPlate(year.year, state.gender) ?? slicePlate({ year: year.year, scene: year.scene, gender: state.gender });
  return (
    <Paper
      scene={year.scene}
      plate={plate}
      kicker={String(year.year)}
      title={year.title}
      bodyColumns
      dialogue={[narrate(year.era), narrate(year.open)]}
      actions={
        <>
          <Primary onClick={onNext}>{year.year === 1985 ? "早上" : "用這兩個下午"}</Primary>
        </>
      }
    >
      {state.name ? <p className="mt-2 text-pretty text-base leading-7">別人叫你{state.name}。</p> : null}
      <p className="mt-2 text-sm text-pretty text-ink/75">
        {year.year === 1985
          ? "星期六早上。門還沒有開。"
          : year.year === 1986
            ? "星期六和星期日，人在的地方不一樣。你去了，不一定見到。"
            : "今年有兩個下午。你可以陪人、自己玩，或者休息。之後的事會自己來，不必你預先留時間。"}
      </p>
      {year.year === 1986 && state.chain.stage >= 4 ? <p className="mt-2 text-pretty text-base leading-7">{chainEcho(state.chain.choiceId)}</p> : null}
      {year.year === 1986 && state.personalityTags.includes("TAG_ON_YOUR_OWN") ? <p className="mt-2 text-pretty text-base leading-7">去年那兩個下午，你都是自己過的。</p> : null}
      {year.year === 1986 && state.personalityTags.includes("TAG_WITH_FAMILY") ? <p className="mt-2 text-pretty text-base leading-7">去年那兩個下午，你都在家裡人旁邊。</p> : null}
      {year.year === 1986 && missedLine(state.missed, "later") ? <p className="mt-2 text-pretty text-base leading-7">{missedLine(state.missed, "later")}</p> : null}
      {year.year === 1988 && missed1986(state.missed, "later", knowsKit(state)) ? <p className="mt-2 text-pretty text-base leading-7">{missed1986(state.missed, "later", knowsKit(state))}</p> : null}
      <LifeNow state={state} />
      {/* Far from the main tag (that sits at the panel's right edge), and it asks first. */}
      <div className="mt-1">
        <ConfirmLink label="從頭開始" question="真的從頭開始？這一局會清掉。" yes="從頭開始" no="不用" onConfirm={onRestart} />
      </div>
    </Paper>
  );
}

function StoryBeat({ state, beat, onNext }: { state: State; beat: Parameters<typeof beat1985>[0]; onNext: () => void }) {
  const page = beat1985(beat, state);
  return (
    <Paper scene={page.scene} plate={beatPlate(beat, state.gender)} kicker={page.kicker} title={page.title} dialogue={page.sequence} actions={<Primary onClick={onNext}>{beat === "aftermath" ? "這一年就這樣" : "繼續"}</Primary>} />
  );
}

function Activities({ state, onPick }: { state: State; onPick: (id: string) => void }) {
  const year = yearOf(state);
  const timed = year.year === 1985 || year.year === 1986;
  const choosing = year.year === 1985 && state.spent.length === 0 ? beatPlate("downstairs", state.gender) : homePlate(year.year, state.gender);
  return (
    <Paper
      scene="home"
      plate={choosing}
      kicker="今年"
      title={year.year === 1985 ? (state.spent.length ? "星期日下午" : "星期六下午") : timed ? "這兩個下午" : "今天怎麼過"}
      mood="think"
      dialogue={[narrate(
        year.year === 1985
          ? state.spent.length
            ? "昨天已經過了。今天再過一個下午。"
            : "早上你在樓梯口停過。這個下午你自己過。"
          : timed
            ? "先過星期六，再過星期日。兩天不要做同一件事。"
            : "兩個下午要不同。選完，其他事才來。",
      )]}
      actions={year.activities.map((id) => {
        const used = state.spent.includes(id);
        const slot = state.spent.length;
        return (
          <Tag
            key={id}
            disabled={used}
            onClick={() => onPick(id)}
            label={used ? activityLabel(id, year.year, state.spent.indexOf(id)) : activityLabel(id, year.year, slot)}
            detail={used ? "今年去過" : activityDetail(id, year.year, slot)}
          />
        );
      })}
    >
      <div className="mt-2 grid grid-cols-2 gap-2">
        {(timed ? ["星期六下午", "星期日下午"] : ["第一個下午", "第二個下午"]).map((label, slot) => {
          const id = state.spent[slot];
          return (
            <p key={label} className="rounded-sm border border-dashed border-[#a77f4c] bg-[#f7efdc]/70 px-3 py-2 text-sm text-ink">
              {label}
              <span className="mt-1 block font-serif">{id ? activityLabel(id, year.year, slot) : "還沒過"}</span>
            </p>
          );
        })}
      </div>
      {timed ? <p className="mt-2 text-sm text-pretty text-ink/75">人已經在某個地方。你去了，才碰得上。自己玩、塗鴉、休息，都是留在家。</p> : null}
    </Paper>
  );
}

function EventCard({ state, onChoose }: { state: State; onChoose: (choice: ReturnType<typeof choicesFor>[number]) => void }) {
  const card = cardFor(state.eventId ?? "", state);
  const choices = choicesFor(state.eventId ?? "", state);
  const year = yearOf(state);
  const plate = eventPlate(state.eventId, state.gender, card.scene, card.title) ?? slicePlate({ year: year.year, scene: card.scene, gender: state.gender });
  return (
    <Paper
      scene={card.scene}
      plate={plate}
      plainTv={PLAIN_TV_EVENTS.has(state.eventId ?? "")}
      kicker={card.kicker}
      title={card.title}
      mood="think"
      dialogue={card.sequence}
      actions={choices.map((choice) => (
        <ChoiceButton
          key={choice.id}
          label={choice.label}
          onClick={() => onChoose(choice)}
        />
      ))}
    />
  );
}

function BattleResult({ state, onRetry, onSettle }: { state: State; onRetry: () => void; onSettle: () => void }) {
  const copy = battleNarrative(state.battleSpecId);
  const retry = canRetry(state);
  const plate = copy.scene === "kindy" ? slicePlate({ year: 1985, scene: "kindy", gender: state.gender, battle: retry ? "door" : "inside" }) : null;
  return (
    <Paper
      scene={copy.scene}
      plate={plate}
      kicker={copy.kicker}
      title={retry ? copy.retryTitle : copy.title}
      dialogue={[narrate(copy.text(state.battle?.kind ?? "fail", state.approach ?? "safe")), ...(retry ? [narrate(copy.retryNote)] : [])]}
      actions={
        <>
          {retry ? <Primary onClick={onRetry}>再試一次</Primary> : null}
          <ChoiceButton label={retry ? copy.homeLabel : copy.continueLabel} onClick={onSettle} />
        </>
      }
    />
  );
}

function YearEnd({ state, onNext }: { state: State; onNext: () => void }) {
  const year = yearOf(state);
  const memories = state.memories.filter((item) => item.year === year.year);
  const last = isLastYear(state.yearIndex);
  const hasGate = memories.some((item) => item.id === "MEM_FIRST_INDEPENDENCE");
  const missedGate = year.year === 1986 && !hasGate && state.counter.COUNTER_EXPLORE < 2;
  return (
    <Paper
      scene="home"
      plate={homePlate(year.year, state.gender)}
      kicker={`${year.year} 完`}
      title="你記住了"
      bodyColumns
      dialogue={[...(memories.length === 0 ? [narrate("這一年沒有什麼特別的事。")] : memories.map((item) => narrate(recallLine(item)))), narrate(yearSummary(state))]}
      actions={<Primary onClick={onNext}>{last ? "看看十年後" : "下一年"}</Primary>}
    >
      {memories.length > 0 ? <p className="mt-2 text-sm text-pretty text-ink/75">這幾句會留下。明年可能會再出現。</p> : null}
      {state.personalityTags.includes("TAG_EMPATHY") ? <p className="mt-2 text-pretty text-base leading-7">這一年，你有時會坐過去，不必人叫。</p> : null}
      {year.year === 1985 && missedLine(state.missed, "now") ? <p className="mt-2 text-pretty text-base leading-7">{missedLine(state.missed, "now")}</p> : null}
      {year.year === 1986 && missed1986(state.missed, "now", knowsKit(state)) ? <p className="mt-2 text-pretty text-base leading-7">{missed1986(state.missed, "now", knowsKit(state))}</p> : null}
      {missedGate ? <p className="mt-2 text-sm text-pretty text-ink/75">你還沒走到走廊盡頭。沒有人逼你去。</p> : null}
    </Paper>
  );
}

function Fifteen({ state, onAct }: { state: State; onAct: () => void }) {
  const act = fifteenAct(state);
  // The overlay is a small hand and the red ball. Only a child who was near that ball gets it.
  const echo = state.memories.some((item) => item.id === "MEM_RED_BALL" || item.id === "MEM_KIT_WAIT" || item.id === "MEM_FRIEND_AGAIN");
  return (
    <Paper
      scene="home"
      plate={fifteenPlate(state.gender)}
      kicker="1996 · 十五歲"
      title="自己回家"
      dialogue={fifteenLines(state).map((line) => narrate(line))}
      overlay={echo ? <img src={MEMORY_BALL} alt="" loading="lazy" decoding="async" className="pointer-events-none absolute right-[4%] top-[6%] h-[30%] w-auto rounded-lg object-cover opacity-50 mix-blend-multiply md:top-[8%]" /> : null}
      actions={<Primary onClick={onAct}>{act.label}</Primary>}
    />
  );
}

function Ending({ state, onRestart }: { state: State; onRestart: () => void }) {
  const skills = state.skills.map((id) => SKILL_NAME[id] ?? id);
  return (
    <Paper scene="estate" plate={endingPlate(state.gender)} kicker="十年後" title="同一個屋邨" dialogue={[narrate(lifeVoice(state.memories, state.name)), narrate(orientationSummary(state))]} actions={<Primary onClick={onRestart}>再來一次</Primary>}>
      {state.flags.includes("FLAG_REPAIR_TALK") ? <p className="mt-2 text-pretty text-base leading-7">你跟媽媽談過屋邨門口。家裡近了，但心裡緊過。</p> : null}
      {state.flags.includes("FLAG_REPAIR_SILENT") ? <p className="mt-2 text-pretty text-base leading-7">你沒有說。少了一場責罵，家裡少了一句。</p> : null}
      <details className="mt-3">
        <summary className="min-h-11 py-2 text-sm text-ink/75">其他你記住的句子</summary>
        <ul className="flex flex-col gap-2 pb-2">
          {state.memories.map((item) => (
            <li key={item.id} className="text-pretty text-base leading-7">
              {item.echo}
            </li>
          ))}
        </ul>
      </details>
      {skills.length > 0 ? <p className="mt-2 text-sm text-pretty text-ink/75">你會的事：{skills.join("、")}</p> : null}
    </Paper>
  );
}

function LifeNow({ state }: { state: State }) {
  const home =
    state.derived.STATE_FAMILY_HARMONY >= 70 ? "家裡現在還算和氣" : state.derived.STATE_FAMILY_HARMONY >= 45 ? "家裡現在普普通通" : "家裡現在很少說話";
  const mood = state.derived.STATE_MOOD >= 70 ? "你心情很好" : state.derived.STATE_MOOD >= 45 ? "你心情普通" : "你心情不太好";
  const stress = state.derived.STATE_STRESS >= 60 ? "壓力很大" : state.derived.STATE_STRESS >= 30 ? "有一點壓力" : "沒有什麼壓力";
  return (
    <div className="mt-2">
      <p className="text-pretty text-base leading-7">
        {home}。{mood}，{stress}。
      </p>
      <details className="mt-1">
        <summary className="min-h-11 py-2 text-sm text-ink/75">看數字</summary>
        <p className="text-sm text-pretty text-ink/75">
          心情 {state.derived.STATE_MOOD} · 壓力 {state.derived.STATE_STRESS} · 家裡 {state.derived.STATE_FAMILY_HARMONY}
        </p>
        <p className="mt-2 text-sm text-pretty text-ink/75">
          想做 {state.derived.VALUE_DREAM} · 要做 {state.derived.VALUE_REALITY} · 自己想 {state.derived.INDEPENDENT_THOUGHT}
        </p>
        <details className="mt-2">
          <summary className="min-h-11 py-2 text-sm text-ink/70">其餘</summary>
          <p className="text-sm text-pretty text-ink/70">
            心安 {state.derived.STATE_PEACE} · 健康 {state.derived.STATE_HEALTH} · 熟人 {state.derived.STATE_GLOBAL_NETWORK}
          </p>
          <p className="mt-2 text-sm text-pretty text-ink/70">
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

type PaperProps = {
  scene: SceneId;
  plate?: string | null;
  /** Keep the plate as painted (no year news picture on the TV). */
  plainTv?: boolean;
  kicker: string;
  title: string;
  mood?: Mood;
  dialogue?: SceneLine[];
  overlay?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  /** Long info pages (year opening, year end): on desktop the body flows in two columns so it fits the panel. */
  bodyColumns?: boolean;
};

/** How many tags a page offers (fragments flattened). One or two get the narrow right-hand column. */
function countActions(node: ReactNode): number {
  let n = 0;
  Children.forEach(node, (child) => {
    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) n += countActions(child.props.children);
    else if (child !== null && child !== undefined && child !== false) n += 1;
  });
  return n;
}

/** One page: the painting as the stage, the lines one by one, then the body and the tags. */
function Paper(props: PaperProps) {
  // Speech written inside narration strings becomes real dialogue lines (wording unchanged).
  const turns = sceneTurns(expandSpokenNarration(props.dialogue?.length ? props.dialogue : [narrate(SENSE[props.scene])]));
  const signature = `${props.kicker}|${props.title}|${turns.map((turn) => turn.text).join("|")}`;
  return <PaperPage key={signature} {...props} turns={turns} />;
}

/** Narration, action, and dialogue are all drawn on the paper; none is dropped. A dialogue line brings its speaker's portrait (its name shows above the line). */
function PaperPage({ scene, plate, plainTv = false, kicker, title, turns, overlay, actions, children, bodyColumns = false }: PaperProps & { turns: Turn[] }) {
  const gender = useContext(Face);
  const storyYear = useContext(StatusContext).year;
  const picture = plate ?? scenePlate(scene, gender);
  const reveal = useReveal(turns.map((turn) => turn.text.length));
  const [log, setLog] = useState(false);
  useAdvanceKeys(!reveal.done && !log, reveal.advance);
  const sideRef = useRef<HTMLDivElement>(null);
  const nextFocused = useRef(false);

  useEffect(() => {
    if (reveal.done && nextFocused.current) sideRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
  }, [reveal.done]);

  // When the tags appear (after the last line, whether tapped or typed out by itself, or on a page that
  // opens already done) they ignore input for ACTION_LOCK_MS, so a quick second tap meant for 下一句 or
  // for the previous page's tag never picks a choice.
  const [locked, setLocked] = useState(true);
  useEffect(() => {
    setLocked(true);
    if (!reveal.done) return;
    const id = window.setTimeout(() => setLocked(false), ACTION_LOCK_MS);
    return () => window.clearTimeout(id);
  }, [reveal.done]);
  const actionCount = countActions(actions);

  const { index, current, past } = lineAt(turns, reveal);
  const textOf = (at: number) => (at === index ? turns[at].text.slice(0, reveal.chars) : turns[at].text);
  const speaking = current.kind === "dialogue" ? current : null;
  const anchor = speaking?.speaker ? anchorFor(picture, speaking.speaker) : undefined;
  const accent = speaking?.speaker ? SPEAKER_ACCENT[speaking.speaker] : "#6e4524";
  const person = speaking?.speaker ? personFromSpeaker(speaking.speaker) : null;
  const where = anchor && isOffscreen(anchor) ? anchor.label : null;

  return (
    <Frame
      label={`${kicker} · ${title}`}
      picture={plainTv ? picture : eraPlate(picture, storyYear)}
      overlay={overlay}
      onStageClick={reveal.done || log ? undefined : reveal.advance}
      panel={
        <PaperPanel
          heading={
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
              <PanelHeading kicker={kicker} title={title} />
              {past.length > 0 ? (
                <button type="button" onClick={() => setLog(true)} className="min-h-11 shrink-0 rounded-sm px-2 text-sm text-ink/70 underline decoration-dotted underline-offset-4 md:min-h-8" aria-haspopup="dialog">
                  回看
                </button>
              ) : null}
            </div>
          }
          log={log ? <LineLog turns={past} onClose={() => setLog(false)} /> : null}
          portrait={speaking && person && person !== "child" ? <PanelPortrait key={speaking.name} {...personPortrait(person)} name={speaking.name} accent={accent} /> : null}
          live={
            <p className="sr-only" aria-live="polite">
              {current.kind === "dialogue" ? `${current.name}：「${current.text}」` : current.text}
            </p>
          }
          side={reveal.done ? <div ref={sideRef} className="contents">{actions}</div> : null}
          sideSize={actionCount <= 2 ? "narrow" : "wide"}
          locked={reveal.done && locked}
          next={
            reveal.done ? null : (
              <Tag main label="下一句" hint="空白鍵" onClick={reveal.advance} tagRef={(node) => {
                if (node) {
                  node.onfocus = () => { nextFocused.current = true; };
                  node.onblur = () => { nextFocused.current = false; };
                }
              }} />
            )
          }
        >
          {/* Only the current line is on the paper; earlier lines are in 回看. */}
          <div className="flex flex-col gap-1.5" onClick={reveal.done ? undefined : reveal.advance} data-lines={turns.length} data-shown={reveal.shown}>
            {current.kind === "dialogue" ? (
              <div key={index} className="mt-0.5" data-kind="dialogue" data-current="true" data-speaker={current.name}>
                <p className="flex items-center gap-1.5 text-sm tracking-wide md:text-lg" style={{ color: accent }}>
                  <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full md:h-2.5 md:w-2.5" style={{ background: accent }} />
                  <span className="font-medium">{current.name}</span>
                  {where ? <span data-offscreen-label={where} className="ml-1 text-sm font-normal text-ink/55 md:text-base">{where}</span> : null}
                </p>
                <p className="text-pretty text-[1.0625rem] leading-7 text-ink md:text-[1.4375rem] md:leading-[1.75]">
                  「{textOf(index)}
                  {reveal.typing ? <span aria-hidden="true" className="ui-caret">▍</span> : "」"}
                </p>
              </div>
            ) : (
              <div key={index} className="mt-0.5" data-kind={current.kind} data-current="true">
                {current.kind === "action" && current.where ? <LocationTag place={current.where} className="-mt-0.5 mb-1.5" /> : null}
                <p className={`text-pretty text-[1.0625rem] leading-7 md:text-[1.4375rem] md:leading-[1.75] ${current.kind === "action" ? "text-ink/85" : "text-ink"}`}>
                  {textOf(index)}
                  {reveal.typing ? <span aria-hidden="true" className="ui-caret">▍</span> : null}
                </p>
              </div>
            )}
          </div>
          {reveal.done ? (
            <div data-body="true" className={bodyColumns ? "mt-1 md:columns-2 md:gap-x-8 [&>*]:break-inside-avoid" : "mt-1"}>
              {children}
            </div>
          ) : null}
        </PaperPanel>
      }
    />
  );
}

/** 回看: the lines already read on this page, over the panel. Esc or the button closes it. */
function LineLog({ turns, onClose }: { turns: Turn[]; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, []);
  const cue = useScrollCue<HTMLOListElement>();
  return (
    // Over most of the screen, not just the panel, so a long page reads back without squinting.
    <div role="dialog" aria-modal="true" aria-label="回看" data-log="true" className="fixed inset-0 z-50 flex items-center justify-center bg-[#140c06]/60 p-2 md:p-[4vh]" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
     <div className="ui-panel flex h-full max-h-[92dvh] w-full max-w-5xl flex-col rounded-md px-5 pb-3 pt-4 md:h-[86dvh] md:px-8 md:pt-6">
      <div className="flex items-center justify-between">
        <p className="font-serif text-lg text-ink md:text-2xl">回看</p>
        <button ref={closeRef} type="button" onClick={onClose} className="min-h-11 rounded-sm px-3 text-sm text-ink/75 underline decoration-dotted underline-offset-4 md:text-base">
          關上
        </button>
      </div>
      <div className="relative mt-2 flex min-h-0 flex-1 flex-col">
      <ol ref={cue.ref} className="min-h-0 flex-1 space-y-2 overflow-y-auto pb-8 pr-2 text-base leading-7 md:text-xl md:leading-[1.75]">
        {turns.map((turn, at) => (
          <li key={at} data-kind={turn.kind}>
            {turn.kind === "dialogue" ? (
              <>
                <span className="mr-1.5 text-sm md:text-lg" style={{ color: turn.speaker ? SPEAKER_ACCENT[turn.speaker] : "#5c3a1e" }}>{turn.name}</span>「{turn.text}」
              </>
            ) : (
              <>
                {turn.kind === "action" && turn.where ? <LocationTag place={turn.where} className="mr-1.5" /> : null}
                {turn.text}
              </>
            )}
          </li>
        ))}
      </ol>
      <ScrollCue show={cue.more} />
      </div>
     </div>
    </div>
  );
}

function ResultBody({ result, hideText = false }: { result: NonNullable<State["result"]>; hideText?: boolean }) {
  return (
    <>
      {hideText ? null : <p className="text-pretty text-base leading-7">{result.text}</p>}
      {result.skills.length > 0 ? <p className="mt-2 text-sm text-ink/75">學會了：{result.skills.join("、")}</p> : null}
      {result.lean ? <p className="mt-2 text-sm text-ink/65">{result.lean}</p> : null}
      {/* Deltas stay in the engine; the player does not see a stat list. */}
    </>
  );
}

function ChoiceButton({ label, hint, onClick }: { label: string; hint?: string; onClick: () => void }) {
  return <Tag label={label} hint={hint} onClick={onClick} />;
}

function Primary({ children, onClick }: { children: string; onClick: () => void }) {
  return <Tag main label={children} onClick={onClick} />;
}

function sceneOf(state: State): SceneId {
  if (state.noteScene && state.phase === "note") return state.noteScene;
  if (state.eventId) return cardFor(state.eventId, state).scene;
  return yearOf(state).scene;
}
