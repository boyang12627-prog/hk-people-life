/**
 * V3.3 regression audit for the simulated playtest (docs: /workspace/playtest/REPORT.md, not in repo).
 * Every P0 in that report has a test here so it cannot come back. P1 groups follow.
 * Each test drives the real reducer and reads the same text functions the screens call.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import {
  activityBlurb,
  activityDetail,
  activityLabel,
  cardFor,
  dadArc,
  EVENT_GATES,
  choicesFor,
  examStory,
  battleStory,
  exploreOfferCopy,
  exploreOfferGo,
  exploreOfferTitle,
  fifteenLines,
  lifeVoice,
  orientationSummary,
  recallLine,
  yearOf,
  yearSummary,
} from "./content.ts";
import { chainEcho, knowsKit, missed1986, missedLine } from "./freedom.ts";
import { beat1985 } from "./story.ts";
import { freshState, mergeDeltas, reducer } from "./engine.ts";
import { lineText, placeLabel } from "./scene.ts";
import { SPOKEN_IN_NARRATION, expandSpokenNarration, splitSpokenNarration } from "./narrationSpeech.ts";
import { ACTION_LOCK_MS } from "./reveal.ts";
import { existsSync } from "node:fs";
import { picked, selectSpoken } from "./speak.ts";
import { KINDY_DOOR, PRIMARY_EXAM, playtestTools } from "./battleSpec.ts";
import { CANTONESE_TO_WRITTEN, cantoneseHits, dialogueWarnings, quotedSpeaker } from "./wording.ts";
import { scanSources } from "../../scripts/voice-scan.ts";
import type { Gender, State } from "./types.ts";
import { isDone, lineAt, skipReveal, startReveal, stepReveal } from "./reveal.ts";
import { SCENE_ANCHORS, SPEAKER_ACCENT, isOffscreen, plateName } from "./sceneAnchors.ts";
import { beatPlate, eraPlate, eventPlate, fifteenPlate, imageManifest, scenePlate, yearPlate } from "./art.ts";
import { say, type SceneLine } from "./scene.ts";

type Page = { year: number; phase: string; known: boolean; text: string; state: State };

/** What a screen shows, as plain text. Mirrors LifeApp.tsx; kept small on purpose. */
function screenText(s: State): string {
  const year = yearOf(s).year;
  const out: string[] = [];
  switch (s.phase) {
    case "year":
      out.push(yearOf(s).era, yearOf(s).open);
      if (year === 1986 && s.chain.stage >= 4) out.push(chainEcho(s.chain.choiceId));
      if (year === 1986) out.push(missedLine(s.missed, "later"));
      if (year === 1988) out.push(missed1986(s.missed, "later", knowsKit(s)));
      break;
    case "story":
      out.push(...beat1985(s.note as Parameters<typeof beat1985>[0], s).sequence.map(lineText));
      break;
    case "activities":
      for (const id of yearOf(s).activities) {
        if (s.spent.includes(id)) continue;
        out.push(activityLabel(id, year, s.spent.length), activityDetail(id, year, s.spent.length));
      }
      break;
    case "note":
    case "result":
    case "repair":
      out.push(s.result?.text ?? "");
      out.push(...(s.result?.deltas ?? []).map((item) => item.label));
      break;
    case "event":
      out.push(...cardFor(s.eventId ?? "", s).sequence.map(lineText));
      out.push(...choicesFor(s.eventId ?? "", s).map((choice) => choice.label));
      break;
    case "explore-offer":
      out.push(exploreOfferTitle(s), exploreOfferCopy(s), exploreOfferGo(s));
      break;
    case "year-end":
      out.push(...s.memories.filter((item) => item.year === year).map(recallLine));
      out.push(yearSummary(s));
      if (year === 1985) out.push(missedLine(s.missed, "now"));
      if (year === 1986) out.push(missed1986(s.missed, "now", knowsKit(s)));
      break;
    case "fifteen":
      out.push(...fifteenLines(s));
      break;
    case "ending":
      out.push(lifeVoice(s.memories, s.name), orientationSummary(s));
      break;
  }
  return out.filter(Boolean).join("\n");
}

type Plan = {
  seed: number;
  gender?: Gender;
  name?: string;
  acts?: Record<number, string[]>;
  pick?: (eventId: string, state: State) => string;
  explore?: boolean;
};

function drive(plan: Plan) {
  let s = reducer(freshState(plan.seed), { type: "begin" });
  s = reducer(s, { type: "gender", gender: plan.gender ?? "girl", name: plan.name ?? "" });
  const pages: Page[] = [];
  for (let i = 0; i < 400; i++) {
    pages.push({ year: yearOf(s).year, phase: s.phase, known: knowsKit(s), text: screenText(s), state: s });
    if (s.phase === "ending") break;
    const year = yearOf(s).year;
    switch (s.phase) {
      case "year":
        s = reducer(s, { type: "toActivities" });
        break;
      case "story":
      case "note":
      case "result":
        s = reducer(s, { type: "ack" });
        break;
      case "activities": {
        const wanted = plan.acts?.[year]?.[s.spent.length];
        const id = wanted && !s.spent.includes(wanted) ? wanted : yearOf(s).activities.find((item) => !s.spent.includes(item))!;
        s = reducer(s, { type: "activity", id });
        break;
      }
      case "event": {
        const list = choicesFor(s.eventId ?? "", s);
        const want = plan.pick?.(s.eventId ?? "", s) ?? "A";
        s = reducer(s, { type: "choose", choice: list.find((item) => item.id === want) ?? list[0] });
        break;
      }
      case "battle":
        s = reducer(s, { type: "battleEnd", outcome: { kind: "win", stress: 40, hp: 50 } });
        break;
      case "battle-result":
        s = reducer(s, { type: "settleBattle" });
        break;
      case "repair":
        s = reducer(s, { type: "repair", talk: true });
        break;
      case "explore-offer":
        s = reducer(s, { type: "explore", go: plan.explore ?? true });
        break;
      case "year-end":
        s = reducer(s, { type: "nextYear" });
        break;
      case "fifteen":
        s = reducer(s, { type: "fifteenAct" });
        break;
      default:
        throw new Error(`dead end at ${s.phase}`);
    }
  }
  assert.equal(s.phase, "ending", "every route reaches the ending");
  return { state: s, pages };
}

const HOME = { 1984: ["ACT_REST", "ACT_PLAY"], 1985: ["ACT_REST", "ACT_PLAY"], 1986: ["ACT_REST", "ACT_PLAY"], 1988: ["ACT_REST", "ACT_DRAW"] };
const MARKET = { 1984: ["ACT_MARKET", "ACT_REST"], 1985: ["ACT_MARKET", "ACT_REST"], 1986: ["ACT_MARKET", "ACT_REST"], 1988: ["ACT_MARKET", "ACT_REST"] };
const SUNDAY_MARKET = { 1984: ["ACT_REST", "ACT_MARKET"], 1985: ["ACT_REST", "ACT_MARKET"], 1986: ["ACT_PLAY", "ACT_MARKET"], 1988: ["ACT_MARKET", "ACT_REST"] };
const OUT = { 1984: ["ACT_PLAY", "ACT_MARKET"], 1985: ["ACT_ESTATE", "ACT_MARKET"], 1986: ["ACT_ESTATE", "ACT_MARKET"], 1988: ["ACT_DRAW", "ACT_MARKET"] };
const ROUTES = [HOME, MARKET, SUNDAY_MARKET, OUT];
const PICKS = ["A", "B", "C"];

function allLives() {
  const lives = [];
  for (const acts of ROUTES) {
    for (const choice of PICKS) {
      for (const seed of [3517, 88421, 777, 19860, 1, 2, 3]) {
        lives.push(drive({ seed, acts, pick: () => choice, gender: seed % 2 ? "boy" : "girl" }));
      }
    }
  }
  return lives;
}

const LIVES = allLives();

function pagesOf(year: number, phase?: string) {
  return LIVES.flatMap((life) => life.pages.filter((page) => page.year === year && (!phase || page.phase === phase)));
}

describe("playtest fixes v3.3 — P0", () => {
  it("P0-1 a Sunday market trip never promises Mom, and the year does not say you skipped the market", () => {
    assert.equal(activityLabel("ACT_MARKET", 1985, 1).includes("陪媽媽"), false);
    assert.equal(activityLabel("ACT_MARKET", 1986, 1).includes("陪媽媽"), false);
    assert.equal(activityLabel("ACT_MARKET", 1985, 0), "陪媽媽去街市");
    assert.equal(activityLabel("ACT_MARKET", 1984, 1), "陪媽媽去街市");
    const sunday = { ...freshState(), yearIndex: 1, spent: ["ACT_REST"] } as State;
    assert.ok(activityBlurb("ACT_MARKET", sunday).includes("媽媽今天留在家"));
    assert.equal(activityBlurb("ACT_MARKET", sunday).includes("你拉著媽媽"), false);
    for (const life of LIVES) {
      for (const page of life.pages) {
        if (page.phase !== "year-end" && page.phase !== "year") continue;
        assert.equal(page.text.includes("今年你沒有去街市"), false, page.text);
        assert.equal(/(?<!星期六)沒有陪媽媽去街市/.test(page.text), false, page.text);
        if (page.text.includes("沒有跟媽媽去街市") || page.text.includes("沒有陪媽媽去街市")) assert.ok(page.text.includes("星期六"), page.text);
      }
    }
  });

  it("P0-2 Saturday at the market with Mom is not written as a Saturday at home", () => {
    let checked = 0;
    for (const seed of Array.from({ length: 40 }, (_, index) => index + 1)) {
      const life = drive({ seed, acts: { 1985: ["ACT_MARKET", "ACT_REST"] } });
      const night = life.pages.find((page) => page.year === 1985 && page.phase === "story" && page.state.note === "sat-night");
      assert.ok(night, `sat-night page on seed ${seed}`);
      assert.equal(night.text.includes("你沒有下過樓"), false, night.text);
      assert.equal(night.text.includes("你睡了很久"), false, night.text);
      assert.equal(night.text.includes("媽媽拎著"), false, night.text);
      checked += 1;
    }
    assert.equal(checked, 40);
  });

  it("P0-3 阿傑's name waits until the child has met him on screen", () => {
    let unknownPages = 0;
    for (const life of LIVES) {
      for (const page of life.pages) {
        if (page.known || !page.text.includes("阿傑")) {
          if (!page.known) unknownPages += 1;
          continue;
        }
        // The one page that introduces him may say his name.
        assert.ok(/叫阿傑/.test(page.text), `${page.year} ${page.phase}: ${page.text}`);
      }
    }
    assert.ok(unknownPages > 100, "routes that never meet him were exercised");
    assert.equal(missed1986(["MISS_86_FRIEND"], "now", false).includes("阿傑"), false);
    assert.equal(missed1986(["MISS_86_FRIEND"], "now", false).includes("再碰到"), false);
  });

  it("P0-4 the extra platform walk counts: the year never says you did not go down after you went", () => {
    for (const life of LIVES) {
      const walked = life.pages.some((page) => page.year === 1986 && page.phase === "explore-offer");
      if (!walked) continue;
      for (const page of life.pages) {
        if ((page.year === 1986 && page.phase === "year-end") || (page.year === 1988 && page.phase === "year")) {
          assert.equal(page.text.includes("沒有到平台"), false, page.text);
        }
      }
    }
    const home = drive({ seed: 777, acts: HOME, explore: true });
    assert.equal(home.pages.filter((page) => page.phase === "explore-offer").length, 1, "offered once");
    assert.ok(home.state.memories.some((item) => item.id === "MEM_FIRST_INDEPENDENCE" && item.choiceId !== "skip"));
  });
});

describe("playtest fixes v3.3 — P1", () => {
  it("timeline: school starts on Monday, and 1986 does not call 1984 last year", () => {
    const open = beat1985("open", freshState()).sequence.map(lineText).join("");
    assert.ok(open.includes("禮拜一開始返學"));
    assert.equal(open.includes("明天開始上學"), false);
    const wrong = ["去年你自己收過玩具", "去年你走過去聽", "去年「九七」", "去年你也是這樣坐", "去年你跟著吃飯"];
    for (const page of pagesOf(1986)) for (const bit of wrong) assert.equal(page.text.includes(bit), false, page.text);
    for (const page of pagesOf(1985, "story")) {
      if (page.state.note !== "monday") continue;
      const sawHimSunday = page.state.memories.some((item) => item.id === "MEM_KIT_WAIT");
      if (sawHimSunday) assert.equal(page.text.includes("你昨天沒有下去"), false, page.text);
    }
  });

  it("echoes: lines that say you saw something need the memory card that showed it", () => {
    for (const page of pagesOf(1986, "event")) {
      const s = page.state;
      if (page.text.includes("這孩子常常畫畫")) assert.ok(s.counter.ART_PROGRESS >= 1 || s.skills.includes("SKL_03"), "drew before");
      assert.equal(page.text.includes("外套摺好又拆開，你見過"), false);
      if (page.text.includes("又是你呀")) assert.ok(["MEM_TOY_WATCH", "MEM_ORANGE", "MEM_NEIGHBOR"].some((id) => s.memories.some((item) => item.id === id)));
    }
    for (const life of LIVES) {
      const fifteen = life.pages.find((page) => page.phase === "fifteen");
      if (fifteen?.text.includes("鞋子脫得很慢")) assert.ok(life.state.memories.some((item) => item.id === "MEM_DAD_HOME"));
      const end85 = life.pages.find((page) => page.year === 1985 && page.phase === "year-end");
      const playedWithHim = life.state.memories.some((item) => item.id === "MEM_KIT_WAIT" && item.choiceId === "A");
      if (playedWithHim && end85) assert.equal(end85.text.includes("沒有碰到那個紅球"), false, end85.text);
    }
  });

  it("scene contradictions are gone", () => {
    const sat = (mood: string) =>
      beat1985("sat-night", { ...freshState(), spent: ["ACT_REST"], npcDays: { NPC_FRIEND_01: { location: "away", mood, todayOutcome: "left-early", seenPlayer: false, missedPlayer: true, nextPlan: "withdraw", observed: { currentMood: 0, relationshipDeltaToday: 0, currentActivity: "" } } } } as State)
        .sequence.map(lineText)
        .join("");
    assert.equal(sat("left").includes("玩了很久"), false);
    const grand = cardFor("MINI_85_GRANDMA", { ...freshState(), npcDays: { NPC_GRAND_01: { location: "home", mood: "waiting", todayOutcome: "alone", seenPlayer: false, missedPlayer: true, nextPlan: "stay", observed: { currentMood: 0, relationshipDeltaToday: 0, currentActivity: "" } } } } as State)
      .sequence.map(lineText)
      .join("");
    assert.equal(grand.includes("湯已經涼了") && grand.includes("碗很熱"), false);
    const family = cardFor("EVT_1986_FAMILY_06", { ...freshState(), yearIndex: 2 }).sequence.map(lineText).join("");
    assert.equal(family.includes("下個星期日"), false);
    const quiet = { ...freshState(3), yearIndex: 1, spent: ["ACT_MARKET"] } as State;
    assert.equal(cardFor("MINI_QUIET", quiet).title, "走了一圈");
    const labels = choicesFor("MINI_QUIET", quiet).map((choice) => choice.label).join("");
    assert.equal(/雀|再坐一陣/.test(labels), false, labels);
  });

  it("a named child is called by name, and nobody is called 女孩子 or 男孩子", () => {
    for (const life of LIVES) for (const page of life.pages) assert.equal(/女孩子|男孩子/.test(page.text), false, page.text);
    const named = drive({ seed: 19860, name: "嘉欣", acts: MARKET });
    assert.ok(named.pages.some((page) => page.text.includes("你自己想點呀，嘉欣？")));
  });

  it("the year-end and ending sentences follow what the child did", () => {
    const start = { dream: 50, reality: 50, think: 40 };
    const lines = new Set([
      yearSummary({ derived: { ...freshState().derived, VALUE_DREAM: 55, VALUE_REALITY: 50 }, yearStart: start }),
      yearSummary({ derived: { ...freshState().derived, VALUE_DREAM: 50, VALUE_REALITY: 55 }, yearStart: start }),
      yearSummary({ derived: { ...freshState().derived, INDEPENDENT_THOUGHT: 45 }, yearStart: start }),
      yearSummary({ derived: { ...freshState().derived }, yearStart: start }),
    ]);
    assert.equal(lines.size, 4);
    const endings = new Set(LIVES.map((life) => orientationSummary(life.state)));
    assert.ok(endings.size >= 3, [...endings].join(" / "));
    const yearEnds = new Set(LIVES.flatMap((life) => life.pages.filter((page) => page.phase === "year-end").map((page) => yearSummary(page.state))));
    assert.ok(yearEnds.size >= 3, [...yearEnds].join(" / "));
  });

  it("at most two remembered lines per card, one per theme, never the same ending twice", () => {
    const picked = selectSpoken(
      [
        { priority: 0, text: "甲。今天這條路，沒有人向你收錢。", theme: "a" },
        { priority: 0, text: "乙。今天這條路，沒有人向你收錢。", theme: "b" },
        { priority: 0, text: "丙。", theme: "a" },
        { priority: 1, text: "丁。", theme: "c" },
        { priority: 2, text: "戊。", theme: "d" },
      ],
      2,
    );
    assert.deepEqual(picked.map((line) => line.text), ["甲。今天這條路，沒有人向你收錢。", "丁。"]);
    for (const page of pagesOf(1986, "event")) {
      const id = page.state.eventId;
      const base = id === "EVT_1986_ECHO_08" ? 3 : id === "EVT_1986_SKILL_05" ? 4 : id === "EVT_1986_FAMILY_06" ? 7 : id === "EVT_1986_MARKET_07" ? 3 : 99;
      const lines = cardFor(id ?? "", page.state).sequence.length;
      assert.ok(lines <= base + 2, `${id} has ${lines} lines`);
      const seq = cardFor(id ?? "", page.state).sequence.map(lineText);
      assert.equal(new Set(seq).size, seq.length, `${id} repeats a line`);
    }
    for (const life of LIVES) {
      const fifteen = life.pages.find((page) => page.phase === "fifteen");
      assert.ok((fifteen?.text.match(/約定/g) ?? []).length <= 1, fifteen?.text ?? "");
    }
  });

  it("battle: next threat after every step, skip text matches the result, tester buttons are opt-in", () => {
    const ui = readFileSync(new URL("../components/life/Battle.tsx", import.meta.url), "utf8");
    assert.equal(ui.includes("sim.hasActed ? sim.hint : sim.threat.hint"), false, "main line always shows what comes next");
    assert.ok(ui.includes("sim.threat.hint"));
    assert.ok(/tools \? <TurnButton label=\{spec\.voice\.skipButton\}/.test(ui));
    assert.ok(/tools \? <TurnButton label=\{spec\.voice\.autoButton\}/.test(ui));
    assert.equal(playtestTools("", null), false);
    assert.equal(playtestTools("?playtest=1", null), true);
    assert.equal(playtestTools("", "1"), true);
    assert.equal(playtestTools("?playtest=0", "1"), false);
    assert.equal(PRIMARY_EXAM.skipKind, "win");
    assert.ok(examStory("win").echo.includes("寫完了"));
    assert.equal(PRIMARY_EXAM.voice.skip.includes("沒有做完"), false);
    assert.ok(battleStory("win", "safe").text.includes("進去了"));
    assert.equal(KINDY_DOOR.voice.skip.includes("沒有打完"), false);
    assert.equal(PRIMARY_EXAM.voice.ask.detail.includes("不是問老師"), false);
  });

  it("result screens put the result in the dialogue box, and the platform offer is honest and single", () => {
    const app = readFileSync(new URL("../components/life/LifeApp.tsx", import.meta.url), "utf8");
    assert.ok(app.includes('kicker="之後" title="你選了" dialogue={[narrate(state.result.text)]}'));
    assert.equal(app.includes("你下平台的次數還不夠"), false);
    assert.ok(exploreOfferCopy({ counter: { ...freshState().counter, COUNTER_EXPLORE: 0 } }).includes("沒有到過平台"));
    assert.ok(exploreOfferCopy({ counter: { ...freshState().counter, COUNTER_EXPLORE: 1 } }).includes("到過一次"));
    const never = { counter: { ...freshState().counter, COUNTER_EXPLORE: 0 } };
    assert.ok(!exploreOfferTitle(never).includes("再") && !exploreOfferGo(never).includes("再"), "never went down: no 再 in title/button");
    for (const life of LIVES) assert.ok(life.pages.filter((page) => page.phase === "explore-offer").length <= 1);
    assert.deepEqual(mergeDeltas([{ label: "家裡", value: 2 }], [{ label: "家裡", value: 4 }]), [{ label: "家裡", value: 6 }]);
  });
});

describe("playtest fixes v3.3 / voice v3.4 — 書面中文 in narration, HK voice in dialogue", () => {
  const root = new URL("..", import.meta.url).pathname;
  const scanned = scanSources(root);

  it("no listed Cantonese word in any narration or action string (strict)", () => {
    const hits: string[] = [];
    for (const item of scanned.narration) {
      for (const hit of cantoneseHits(item.text)) hits.push(`${item.file}: ${item.text} → ${hit.rule.written}`);
    }
    assert.deepEqual(hits, []);
    assert.ok(CANTONESE_TO_WRITTEN.length >= 10);
    assert.ok(scanned.narration.length > 500, "narration was scanned");
  });

  it("dialogue is reported, never failed: the warning list is for the writer (docs/VOICE_WARNINGS.md)", (t) => {
    assert.ok(scanned.dialogue.length >= 50, "dialogue was found");
    for (const item of scanned.dialogue) {
      if (!item.quoted) assert.ok(item.speaker, `say() without a known speaker: ${item.file} ${item.text}`);
    }
    const warnings = scanned.dialogue.flatMap((item) => dialogueWarnings(item.speaker, item.text, item.register).map((w) => `${item.speaker ?? "（未標）"}［${w.register}］${item.text} — ${w.reason}`));
    for (const line of new Set(warnings)) t.diagnostic(`VOICE WARNING ${line}`);
    // Dialogue keeps Hong Kong words on purpose. These are the V3.3 conversions that were reverted.
    const said = scanned.dialogue.map((item) => item.text).join("\n");
    for (const word of ["攞去用啦", "今次", "踢波", "個波", "唔使錢", "你琴日冇落嚟。", "你去年冇落嚟。"]) assert.ok(said.includes(word), `dialogue keeps ${word}`);
  });

  it("speech quoted inside narration is dialogue, not narration", () => {
    assert.deepEqual(cantoneseHits("他說這支是多出來的。「你攞去用啦。」寫出來的顏色有一點深。"), []);
    assert.ok(cantoneseHits("你攞去用啦。").length > 0);
    assert.equal(quotedSpeaker("媽媽看爸爸一眼。「大人有時也會擔心。」", "大人有時也會擔心。"), "媽媽");
    assert.equal(quotedSpeaker("阿姨說：「呢個唔使錢。」", "呢個唔使錢。"), "阿姨");
    const voice = dialogueWarnings("阿傑", "這個球是我先拿到的！");
    assert.ok(voice.length > 0 && voice.every((w) => w.register === "colloquial"));
    assert.deepEqual(dialogueWarnings("老師", "不用怕，進去和其他小朋友玩。"), []);
    assert.ok(dialogueWarnings("老師", "唔使驚。", "formal").length > 0);
  });

  it("the list itself catches what the playtest found", () => {
    for (const bad of ["紅波", "踢波", "今次不是搶", "同阿傑一組", "一隻雀", "這個不必錢", "你攞去用啦。", "走近少少", "他還沒去沖涼", "收進雪櫃", "拎著膠袋", "車仔", "出街沒有你的份"]) {
      assert.ok(cantoneseHits(bad).length > 0, bad);
    }
    for (const ok of ["一隻麻雀飛過", "不要出街口", "塑膠袋太重", "和阿傑一組", "士多", "默書"]) assert.deepEqual(cantoneseHits(ok), [], ok);
  });
});

describe("voice v3.4 — Dad arc pays off only when earned", () => {
  const mem = (id: string, choiceId: string, year: number, variant = "base") => ({ id, memoryTypeId: id, instanceId: `${id}_${year}`, eventId: "", choiceId, variant, year, age: year - 1981, npc: "NPC_DAD_01", emotion: "", weight: 1, echo: "" });
  const at15 = (memories: ReturnType<typeof mem>[], overtime = false) =>
    ({ ...freshState(), yearIndex: 3, memories, npcDays: overtime ? { NPC_DAD_01: { todayOutcome: "overtime" } } : {} }) as unknown as State;

  it("no park, or no shoes seen: no Dad payoff at fifteen", () => {
    assert.deepEqual(dadArc(at15([])), []);
    assert.deepEqual(dadArc(at15([mem("MEM_DAD_WORK", "B", 1986)])), []);
    assert.equal(fifteenLines(at15([])).join("").includes("脫鞋"), false);
  });

  it("saw him come home but never asked: the shoes, and no reason", () => {
    const lines = dadArc(at15([mem("MEM_DAD_WORK", "B", 1986), mem("MEM_DAD_LATE", "A", 1986)])).join("");
    assert.ok(lines.includes("脫得很慢") && lines.includes("沒有問過為什麼"));
    for (const word of ["替人", "移民", "還記得", "安穩"]) assert.equal(lines.includes(word), false, word);
  });

  it("asked, or saw the overtime Sunday: he is reinterpreted, by the reason the child heard", () => {
    const asked86 = dadArc(at15([mem("MEM_DAD_WORK", "C", 1986), mem("MEM_DAD_LATE", "B", 1986)])).join("");
    assert.ok(asked86.includes("替人留到最後") && asked86.includes("請到人") && asked86.includes("還記得"));
    assert.equal(asked86.includes("移民"), false, "移民 is only said if the child asked in 1988");
    const asked88 = dadArc(at15([mem("MEM_DAD_WORK", "A", 1986), mem("MEM_DAD_SIGN", "C", 1988)])).join("");
    assert.ok(asked88.includes("移民") && asked88.includes("約了人"));
    assert.equal(asked88.includes("還記得"), false, "the park promise is remembered only if the child did not walk away from it");
    const overtime = dadArc(at15([mem("MEM_DAD_WORK", "B", 1986), mem("MEM_DAD_HOME", "A", 1985)], true)).join("");
    assert.ok(overtime.includes("那個星期六他替人留到最後"));
    const noOvertime = dadArc(at15([mem("MEM_DAD_WORK", "B", 1986), mem("MEM_DAD_HOME", "A", 1985)])).join("");
    assert.equal(noOvertime.includes("替人"), false);
  });

  it("「一家人安穩」 comes back only if Dad said it on screen in 1984", () => {
    const base = [mem("MEM_DAD_WORK", "B", 1986), mem("MEM_DAD_LATE", "B", 1986)];
    assert.ok(dadArc(at15([...base, mem("MEM_NEWS_01", "A", 1984, "harmony")])).join("").includes("安穩"));
    assert.equal(dadArc(at15([...base, mem("MEM_NEWS_01", "A", 1984, "cold")])).join("").includes("安穩"), false);
  });

  it("driven lives: the night and the signing follow the park and the paper; the reason never comes unearned", () => {
    let full = 0;
    let partial = 0;
    for (const life of LIVES) {
      const order = life.pages.filter((page) => page.phase === "event").map((page) => page.state.eventId);
      const night = order.indexOf("EVT_1986_DAD_NIGHT");
      const sign = order.indexOf("EVT_1988_DAD_SIGN");
      assert.ok(night > order.indexOf("EVT_1986_FAMILY_06"), "the night comes after the park");
      assert.ok(sign > order.indexOf("EVT_1988_EXAM_01"), "the signing comes after the paper");
      const fifteen = life.pages.find((page) => page.phase === "fifteen");
      assert.ok(fifteen);
      const s = fifteen.state;
      const heard = picked(s, "MEM_DAD_LATE") === "B" || picked(s, "MEM_DAD_SIGN") === "C" || (picked(s, "MEM_DAD_HOME") !== "" && s.npcDays.NPC_DAD_01?.todayOutcome === "overtime");
      if (fifteen.text.includes("替人留到最後")) {
        assert.ok(heard, fifteen.text);
        full += 1;
      } else if (fifteen.text.includes("沒有問過為什麼")) partial += 1;
      if (fifteen.text.includes("移民")) assert.equal(picked(s, "MEM_DAD_SIGN"), "C");
      assert.equal(fifteen.text.split("替人留到最後").length - 1 <= 1, true, "said once");
    }
    assert.ok(full > 0 && partial > 0, `both payoffs were exercised (full ${full}, partial ${partial})`);
    assert.equal(EVENT_GATES.EVT_1986_DAD_NIGHT({ memories: [] }), false);
    const unearned = { ...freshState(), phase: "result", yearIndex: 2, queue: ["EVT_1986_DAD_NIGHT", "EVT_1986_FRIEND_09"], result: { text: "", deltas: [], skills: [] } } as unknown as State;
    assert.equal(reducer(unearned, { type: "ack" }).eventId, "EVT_1986_FRIEND_09", "no park, no night");
    const earned = { ...unearned, memories: [mem("MEM_DAD_WORK", "B", 1986)] } as unknown as State;
    assert.equal(reducer(earned, { type: "ack" }).eventId, "EVT_1986_DAD_NIGHT");
    assert.equal(EVENT_GATES.EVT_1988_DAD_SIGN({ memories: [mem("MEM_DAD_WORK", "A", 1986)] }), false);
  });
});

describe("ui v4 — stage, paper panel, line-by-line reveal", () => {
  it("one tap finishes the typed line, the next tap shows the next line, and it never runs past the end", () => {
    const lengths = [5, 3, 4];
    let r = startReveal(false);
    assert.deepEqual(r, { shown: 1, chars: 0 });
    assert.equal(isDone(r, lengths), false);
    r = stepReveal(r, lengths, false);
    assert.equal(r.shown, 1, "first tap only finishes typing");
    r = stepReveal(r, lengths, false);
    assert.deepEqual(r, { shown: 2, chars: 0 });
    r = stepReveal(stepReveal(r, lengths, false), lengths, false);
    r = stepReveal(r, lengths, false);
    assert.equal(r.shown, 3);
    assert.equal(isDone(r, lengths), true);
    assert.deepEqual(stepReveal(r, lengths, false), r);
    let still = startReveal(true);
    assert.equal(isDone(still, [9]), true, "reduced motion: one line, already done");
    still = stepReveal(still, [9, 9], true);
    assert.equal(isDone(still, [9, 9]), true);
    assert.equal(isDone(skipReveal(lengths), lengths), true);
  });

  it("the panel holds only the current line; earlier lines go to 回看 only", () => {
    const lines = ["n1", "d1", "n2"];
    assert.deepEqual(lineAt(lines, { shown: 1, chars: 0 }), { index: 0, current: "n1", past: [] });
    assert.deepEqual(lineAt(lines, { shown: 2, chars: 0 }), { index: 1, current: "d1", past: ["n1"] });
    assert.deepEqual(lineAt(lines, skipReveal([2, 2, 2])), { index: 2, current: "n2", past: ["n1", "d1"] }, "after the last line the choices sit under it");
    assert.equal(lineAt(lines, { shown: 9, chars: 0 }).current, "n2", "never past the end");
    const app = readFileSync(new URL("../components/life/LifeApp.tsx", import.meta.url), "utf8");
    assert.equal(/turns\.slice\(0, reveal\.shown\)\.map|scrollHeight/.test(app), false, "no history list and no auto-scroll on the paper");
    assert.ok(app.includes("lineAt(turns, reveal)") && app.includes('data-current="true"'));
    assert.ok(app.includes('role="dialog"') && app.includes("回看") && app.includes('"Escape"'), "回看 log is a closable dialog");
    assert.ok(app.includes("useAdvanceKeys(!reveal.done && !log"), "space does not advance under the log");
    assert.ok(/portrait=\{speaking &&/.test(app), "portrait only for a dialogue line");
  });

  it("every line is drawn, choices wait for the last line, lines are announced, and the palette stays at or below amber", () => {
    const app = readFileSync(new URL("../components/life/LifeApp.tsx", import.meta.url), "utf8");
    const stage = readFileSync(new URL("../components/life/Stage.tsx", import.meta.url), "utf8");
    const battle = readFileSync(new URL("../components/life/Battle.tsx", import.meta.url), "utf8");
    const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
    const anchors = readFileSync(new URL("./sceneAnchors.ts", import.meta.url), "utf8");
    assert.ok(app.includes('aria-live="polite"'));
    assert.ok(app.includes("side={reveal.done ? <div ref={sideRef} className=\"contents\">{actions}</div> : null}"), "actions only after every line");
    assert.ok(app.includes("useAdvanceKeys"));
    assert.ok(stage.includes("下午 {afternoons}/2"));
    assert.ok(stage.includes("prefers-reduced-motion"));
    assert.equal(stage.includes("/art/"), false, "Stage.tsx builds no art path");
    assert.equal(app.includes("記下了"), false, "the result page shows no 記下了 stat list");
    assert.equal(/result\.deltas\.map/.test(app), false, "deltas are not rendered to the player");
    assert.ok(app.includes("學會了："), "learned skills still shown");
    assert.ok(app.includes("result.lean"), "lean line still shown");
    // Nothing brighter than amber #c9843a: no colour with more chroma (max - min channel).
    const chroma = (hex: string) => {
      const n = hex.length === 4 ? hex.slice(1).split("").map((c) => parseInt(c + c, 16)) : [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
      return Math.max(...n) - Math.min(...n);
    };
    const limit = chroma("#c9843a");
    for (const [name, src] of Object.entries({ app, stage, battle, css, anchors })) {
      for (const hex of src.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) ?? []) assert.ok(chroma(hex) <= limit, `${name} ${hex} is brighter than amber`);
    }
  });
});

describe("ui v4.5 — the portrait and speaker name identify the speaker; nothing points into the painting", () => {
  it("no speech bubble, head ring or pointer tail; portrait only for a dialogue line", () => {
    const app = readFileSync(new URL("../components/life/LifeApp.tsx", import.meta.url), "utf8");
    const stage = readFileSync(new URL("../components/life/Stage.tsx", import.meta.url), "utf8");
    assert.equal(/SpeechLayer|ui-bubble|ui-head-ring|PanelTail|panelTail|\btail=/.test(app + stage), false);
    assert.ok(/portrait=\{speaking &&/.test(app));
  });
  it("panel v2: no enamel mug, no skip-all, 下一句 sits in its own right-hand column, larger line text", () => {
    const app = readFileSync(new URL("../components/life/LifeApp.tsx", import.meta.url), "utf8");
    const stage = readFileSync(new URL("../components/life/Stage.tsx", import.meta.url), "utf8");
    assert.equal(/\bMug\b|enamel/.test(app + stage), false, "the enamel cup is gone from the panel");
    assert.equal(/跳到最後|reveal\.skip|skipReveal/.test(app + stage), false, "no skip-to-end on the paper");
    assert.match(app, /next=\{\s*reveal\.done \? null : \(\s*<Tag main label="下一句"/, "下一句 goes in the panel's next slot");
    assert.match(stage, /data-next="true"[^>]*md:self-center/, "the next column is vertically centred on desktop");
    assert.ok(app.includes("md:text-[1.4375rem]"), "line text is a step above text-xl on desktop");
  });
  it("locations show as a map-pin tag without brackets, everywhere a place is shown", () => {
    assert.equal(placeLabel("（門口）"), "門口");
    assert.equal(placeLabel("(門口)"), "門口");
    assert.equal(placeLabel(" 家裡 · 門口 "), "家裡 · 門口");
    for (const [scene, anchors] of Object.entries(SCENE_ANCHORS)) {
      for (const [who, anchor] of Object.entries(anchors)) {
        if (anchor && isOffscreen(anchor)) assert.equal(/[（）()]/.test(anchor.label), false, `${scene} ${who} offscreen label has brackets`);
      }
    }
    const app = readFileSync(new URL("../components/life/LifeApp.tsx", import.meta.url), "utf8");
    const stage = readFileSync(new URL("../components/life/Stage.tsx", import.meta.url), "utf8");
    const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
    assert.match(stage, /export function LocationTag[\s\S]*<Pin \/>[\s\S]*placeLabel\(place\)|placeLabel\(place\)[\s\S]*<Pin \/>/, "the tag draws the pin before the bracket-free name");
    assert.match(stage, /export function Pin\(\)[\s\S]*?<svg aria-hidden="true"/, "the pin is inline SVG");
    assert.equal(/📍/.test(app + stage), false, "no emoji pin");
    assert.match(css, /\.ui-location \{/);
    assert.equal(app.includes("<LocationTag place={where}"), false, "an off-screen speaker label (旁邊) is not a place: no pin");
    assert.ok(app.includes("data-offscreen-label={where}"), "it is a plain subtle label");
    assert.ok(app.includes("<LocationTag place={current.where}"), "action place uses the tag");
    assert.ok(app.includes("<LocationTag place={turn.where}"), "回看 log shows the place with the tag too");
    assert.equal(/>\{(current\.where|turn\.where)\}</.test(app), false, "no bare place text left");
  });
  it("the beat title sits beside the year/time label in one heading row; the location tag is a step larger", () => {
    const stage = readFileSync(new URL("../components/life/Stage.tsx", import.meta.url), "utf8");
    const heading = stage.slice(stage.indexOf("export function PanelHeading"), stage.indexOf("/** A hanging paper tag."));
    assert.match(heading, /data-heading="true" className="flex[^"]*items-baseline/, "kicker and title share one row");
    assert.ok(heading.indexOf("{kicker}") < heading.indexOf("{title}"), "title comes right after the year/time label");
    assert.match(heading, /<h1 data-beat-title="true"[^>]*>\{title\}<\/h1>/);
    assert.equal(/<p[^>]*>\{kicker\}<\/p>\s*<h1/.test(heading), false, "the title is no longer a separate line under the kicker");
    const tag = stage.slice(stage.indexOf("export function LocationTag"), stage.indexOf("/** Small striped plastic bag."));
    assert.match(tag, /ui-location[^`]*text-sm[^`]*md:text-base/, "location text is larger");
    assert.match(tag, /md:h-5 md:w-4/, "pin is larger");
  });
  it("every speaker has one accent", () => {
    for (const who of ["媽媽", "爸爸", "嫲嫲", "阿傑", "阿姨", "老師"] as const) assert.match(SPEAKER_ACCENT[who], /^#[0-9a-f]{6}$/);
    assert.equal(new Set(Object.values(SPEAKER_ACCENT)).size, 6);
  });
});

describe("live playtest fixes (2026-10-09)", () => {
  const app = readFileSync(new URL("../components/life/LifeApp.tsx", import.meta.url), "utf8");
  const stage = readFileSync(new URL("../components/life/Stage.tsx", import.meta.url), "utf8");
  const battle = readFileSync(new URL("../components/life/Battle.tsx", import.meta.url), "utf8");

  it("P1-1 tags ignore input for a moment after they appear (fast second tap on 下一句 never picks a choice)", () => {
    assert.ok(ACTION_LOCK_MS >= 300 && ACTION_LOCK_MS <= 600, `lock ${ACTION_LOCK_MS}ms`);
    assert.match(app, /setTimeout\(\(\) => setLocked\(false\), ACTION_LOCK_MS\)/, "unlock after the lock time");
    assert.match(app, /useState\(true\)[\s\S]{0,200}setLocked\(true\);\s*if \(!reveal\.done\) return;/, "locked on mount and every time the tags appear, including a typewriter finishing by itself");
    assert.ok(app.includes("locked={reveal.done && locked}"));
    assert.match(stage, /onClickCapture=\{swallow\}/, "clicks on locked tags are swallowed");
    assert.match(stage, /event\.key === "Enter" \|\| event\.key === " "\) swallow\(event\)/, "and Enter/Space too");
  });

  it("P1-2 battle feedback fits: 剛才 and the other side's move side by side on desktop, and any overflow shows a cue", () => {
    assert.match(battle, /data-battle-feedback="true" className="[^"]*md:grid-cols-2/);
    assert.match(stage, /<ScrollCue show=\{cue\.more\} \/>/, "panel text shows 往下還有 when more is below");
    assert.ok(stage.includes("往下還有"));
  });

  it("P1-3 從頭開始 asks first and is not next to the main tag", () => {
    const year = app.slice(app.indexOf("function YearOpen"), app.indexOf("function StoryBeat"));
    assert.equal(/onClick=\{onRestart\}/.test(year), false, "no one-tap restart");
    assert.match(year, /<ConfirmLink label="從頭開始" question="[^"]+" yes="[^"]+" no="[^"]+" onConfirm=\{onRestart\} \/>/);
    const actions = year.slice(year.indexOf("actions={"), year.indexOf("</>"));
    assert.equal(actions.includes("從頭開始"), false, "not among the tags");
    assert.match(stage, /export function ConfirmLink[\s\S]*useState\(false\)[\s\S]*onClick=\{onConfirm\}/);
  });

  it("P2-5 one or two tags use a narrow right column, so the text gets the width", () => {
    assert.ok(app.includes('sideSize={actionCount <= 2 ? "narrow" : "wide"}'));
    assert.match(stage, /sideSize === "narrow"\s*\? "ui-tags ui-tags-narrow[^"]*md:w-56/);
  });

  it("P2-6 回看 covers most of the screen and shows a scroll cue", () => {
    const log = app.slice(app.indexOf("function LineLog"), app.indexOf("function ResultBody"));
    assert.match(log, /role="dialog"[^>]*className="fixed inset-0/);
    assert.match(log, /md:h-\[86dvh\]/);
    assert.match(log, /<ScrollCue show=\{cue\.more\} \/>/);
  });

  it("P2-7 phone: the tag list is not clipped to half the panel and clears the afternoon counter", () => {
    assert.equal(/"ui-tags[^"]*(?<!md:)max-h-\[48%\]/.test(stage), false);
    assert.match(stage, /afternoons !== null \? "pb-8" : "pb-3"/);
  });

  it("P2-8 speech inside narration becomes dialogue with its speaker; the quoted words are unchanged", () => {
    const sources = ["./data/events.ts", "./content.ts", "./battleSpec.ts"].map((file) => readFileSync(new URL(file, import.meta.url), "utf8")).join("\n");
    for (const [quote, speaker] of Object.entries(SPOKEN_IN_NARRATION)) {
      assert.ok(sources.includes(quote), `${quote} is in the data`);
      const literal = [...sources.matchAll(/"([^"\n]*)"/g)].map((m) => m[1]).find((text) => text.includes(quote) && text !== quote);
      assert.ok(literal, `${quote} sits inside a narration string`);
      const lines = splitSpokenNarration(literal);
      const said = lines.filter((line) => line.type === "dialogue");
      assert.ok(said.some((line) => line.type === "dialogue" && line.speaker === speaker && `「${line.text}」` === quote), `${quote} → ${speaker}`);
      for (const line of lines) if (line.type === "narration") assert.equal(line.text.includes(quote), false, `${quote} left in narration`);
    }
    assert.deepEqual(splitSpokenNarration("你看清楚那輛車。阿姨說：「呢個唔使錢。」你把它握在手裡。"), [
      { type: "narration", text: "你看清楚那輛車。" },
      { type: "dialogue", speaker: "阿姨", text: "呢個唔使錢。" },
      { type: "narration", text: "你把它握在手裡。" },
    ]);
    assert.deepEqual(splitSpokenNarration("嫲嫲笑：「以前邊有咁多掣㗎。」你記住「以前」兩個字。").map((line) => line.text), ["嫲嫲笑。", "以前邊有咁多掣㗎。", "你記住「以前」兩個字。"]);
    assert.deepEqual(splitSpokenNarration("你不知道「將來」是什麼。"), [{ type: "narration", text: "你不知道「將來」是什麼。" }], "a quoted word is not speech");
    assert.deepEqual(expandSpokenNarration([say("媽媽", "睇完就要走。")]), [say("媽媽", "睇完就要走。")], "dialogue lines pass through");
    assert.match(app, /sceneTurns\(expandSpokenNarration\(/, "every page splits before drawing");
    // Nothing left: every 「 that follows a speaker's lead-in in the data is listed.
    for (const m of sources.matchAll(/(媽媽|爸爸|嫲嫲|阿傑|老師|阿姨)[^。！？「"]{0,6}：(「[^」]+」)/g)) {
      if (m[0].includes("say(")) continue;
      assert.ok(SPOKEN_IN_NARRATION[m[2]], `unlisted speech in narration: ${m[0]}`);
    }
  });
});

describe("panel portrait without a name plate (2026-10-09)", () => {
  it("the speaker's name shows once, above the line; the bust keeps it as its accessible name", () => {
    const stage = readFileSync(new URL("../components/life/Stage.tsx", import.meta.url), "utf8");
    const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
    assert.equal(/ui-nameplate/.test(stage + css), false, "no name plate under the portrait");
    const portrait = stage.slice(stage.indexOf("export function PanelPortrait"), stage.indexOf("const TYPE_MS"));
    assert.match(portrait, /role="img" aria-label=\{name\}/);
    assert.match(portrait, /md:w-\[6\.75rem\]/, "the bust is sized to fit inside the panel");
    // The portrait sits in its own padded slot (counted in the panel's height), never hanging below it.
    assert.match(stage, /data-portrait-slot="true" className="shrink-0 self-start py-3 pl-3 md:py-4 md:pl-5"/);
    assert.equal(/ui-portrait[^"]*\bpt-4|-mb-|translate-y/.test(portrait), false, "no offset pushes the bust out");
  });
  it("the purple scroll-rod on the panel's left edge is gone", () => {
    const stage = readFileSync(new URL("../components/life/Stage.tsx", import.meta.url), "utf8");
    const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
    assert.equal(/ui-scroll-end|#5b3a57|#4a2e47/.test(stage + css), false);
  });
});

describe("TV pictures painted into the art, no text on screens (2026-10-09)", () => {
  it("each year's TV pages show that year's news picture composited into the glass; Saturday night 1985 is switched off", () => {
    for (const gender of ["boy", "girl"] as const) {
      for (const year of [1984, 1985, 1986]) assert.equal(eraPlate(`/art/q/tv-${gender}.webp`, year), `/art/q/tv${year}-${gender}.webp`);
      assert.equal(eraPlate(`/art/q/tv-${gender}.webp`, 1988), `/art/q/tv-${gender}.webp`);
      assert.equal(eraPlate(`/art/q/rest-${gender}.webp`, 1988), `/art/q/rest1988-${gender}.webp`);
      assert.equal(eraPlate(`/art/q/rest-${gender}.webp`, 1985), `/art/q/rest-${gender}.webp`, "1985 nap keeps the painted static");
      assert.equal(eraPlate(`/art/q/draw-${gender}.webp`, 1988), `/art/q/draw-${gender}.webp`, "draw keeps its painted picture");
      assert.equal(beatPlate("sat-night", gender), `/art/q/tvoff-${gender}.webp`);
      assert.equal(eraPlate(`/art/q/tvoff-${gender}.webp`, 1985), `/art/q/tvoff-${gender}.webp`);
      assert.equal(fifteenPlate(gender), `/art/q/home1996-${gender}.webp`);
      for (const name of ["tv1984", "tv1985", "tv1986", "tvoff", "rest1988", "home1996"]) {
        const path = `/art/q/${name}-${gender}.webp`;
        assert.ok(existsSync(new URL(`../../public${path}`, import.meta.url)), path);
        assert.ok(imageManifest().includes(path), `${path} in the manifest`);
      }
      assert.equal(yearPlate(1984, gender), `/art/q/tv-${gender}.webp`);
      assert.equal(eventPlate("EVT_1984_NEWS_01", gender), `/art/q/tv-${gender}.webp`);
      assert.equal(eventPlate("MINI_85_TV", gender), `/art/q/draw-${gender}.webp`);
    }
    assert.equal(eraPlate("/art/q/home-girl.webp", 1986), "/art/q/home-girl.webp", "only TV paintings swap");
    assert.equal(plateName("/art/q/tv1986-boy.webp"), "tv", "speaker anchors still apply");
    assert.equal(plateName("/art/q/tvoff-girl.webp"), "tv");
    assert.equal(plateName("/art/q/home1996-boy.webp"), "home1996", "the new 1996 painting does not borrow the 1984 dinner's people");
    const app = readFileSync(new URL("../components/life/LifeApp.tsx", import.meta.url), "utf8");
    assert.ok(app.includes("plate={fifteenPlate(state.gender)}"));
  });
  it("the code headline overlay is gone", () => {
    const stage = readFileSync(new URL("../components/life/Stage.tsx", import.meta.url), "utf8");
    const app = readFileSync(new URL("../components/life/LifeApp.tsx", import.meta.url), "utf8");
    const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
    assert.equal(/TvNews|data-tv-news|newsHeadline|ui-tv-/.test(stage + app + css), false);
    assert.equal(existsSync(new URL("./tvNews.ts", import.meta.url)), false);
    assert.ok(app.includes("picture={plainTv ? picture : eraPlate(picture, storyYear)}"));
  });
});

describe("full review batch 1: art follows the text (no new art)", async () => {
  const art = await import("./art.ts");
  const { YEARS } = await import("./content.ts");
  const { splitSpokenNarration } = await import("./narrationSpeech.ts");
  const app = readFileSync(new URL("../components/life/LifeApp.tsx", import.meta.url), "utf8");
  it("activity and year-end pages never reuse the 1984 dinner after 1984", () => {
    assert.equal(art.homePlate(1984, "boy"), "/art/q/home-boy.webp");
    assert.equal(art.homePlate(1985, "girl"), "/art/q/bag-girl.webp");
    assert.equal(art.homePlate(1986, "boy"), "/art/q/tv-boy.webp");
    assert.equal(art.homePlate(1988, "girl"), "/art/q/study-girl.webp");
    assert.ok(!app.includes('scenePlate("home", state.gender)'));
    assert.ok(app.includes("plate={homePlate(year.year, state.gender)}"));
  });
  it("MINI_85_TV shows the child alone with the set on; MINI_QUIET 沒有人在 shows the empty podium", () => {
    assert.equal(art.eventPlate("MINI_85_TV", "boy"), "/art/q/draw-boy.webp");
    assert.equal(art.eventPlate("MINI_QUIET", "girl", "market", "沒有人在"), "/art/q/rain-girl.webp");
    assert.equal(art.eventPlate("MINI_QUIET", "girl", "home", "沒有人在"), "/art/q/rain-girl.webp");
    assert.equal(art.eventPlate("MINI_QUIET", "boy", "market", "走了一圈"), null);
  });
  it("MINI_86_TV keeps the TV room's own painted screen (singing), not the Queen picture", () => {
    assert.ok(art.PLAIN_TV_EVENTS.has("MINI_86_TV"));
    assert.equal(art.eventPlate("MINI_86_TV", "boy"), "/art/q/tv-boy.webp");
    assert.ok(app.includes('plainTv={PLAIN_TV_EVENTS.has(state.eventId ?? "")}'));
  });
  it("1986 opening is titled 電視; Monday walk is tagged 幼稚園門口", () => {
    assert.equal(YEARS.find((y: { year: number }) => y.year === 1986)?.title, "電視");
    const story = readFileSync(new URL("./story.ts", import.meta.url), "utf8");
    assert.ok(!story.includes('"屋邨路"'));
  });
  it("the exam's 老師說：「還有五分鐘。」 is the teacher's line; the 1996 memory quote stays narration", () => {
    assert.deepEqual(splitSpokenNarration("老師說：「還有五分鐘。」"), [{ type: "dialogue", speaker: "老師", text: "還有五分鐘。" }]);
    assert.equal(splitSpokenNarration("「最要緊是一家人安穩。」他只說過一次，之後就一直做。")[0].type, "narration");
    assert.ok(readFileSync(new URL("../components/life/Battle.tsx", import.meta.url), "utf8").includes("splitSpokenNarration(lead)"));
  });
});

describe("ending art: the grown-up protagonist at the same estate", async () => {
  const art = await import("./art.ts");
  const { anchorFor } = await import("./sceneAnchors.ts");
  const { existsSync } = await import("node:fs");
  it("the 十年後 page uses ending-boy/girl.webp, in the manifest, with a child anchor", () => {
    for (const g of ["boy", "girl"] as const) {
      assert.equal(art.endingPlate(g), `/art/q/ending-${g}.webp`);
      assert.ok(existsSync(new URL(`../../public/art/q/ending-${g}.webp`, import.meta.url)));
      assert.ok(art.imageManifest().includes(`/art/q/ending-${g}.webp`));
      assert.ok(anchorFor(`/art/q/ending-${g}.webp`, "child"));
    }
    const app = readFileSync(new URL("../components/life/LifeApp.tsx", import.meta.url), "utf8");
    assert.ok(app.includes('plate={endingPlate(state.gender)} kicker="十年後"'));
  });
  it("the art bible fixes the girl standard as bob + grey tee", () => {
    const bible = readFileSync(new URL("../../docs/ART_BIBLE.md", import.meta.url), "utf8");
    assert.match(bible, /冬菇頭（bob，齊瀏海）＋灰色 T 恤/);
  });
});
