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
import { lineText } from "./scene.ts";
import { picked, selectSpoken } from "./speak.ts";
import { KINDY_DOOR, PRIMARY_EXAM, playtestTools } from "./battleSpec.ts";
import { CANTONESE_TO_WRITTEN, cantoneseHits, dialogueWarnings, quotedSpeaker } from "./wording.ts";
import { scanSources } from "../../scripts/voice-scan.ts";
import type { Gender, State } from "./types.ts";
import { isDone, lineAt, skipReveal, startReveal, stepReveal } from "./reveal.ts";
import { SCENE_ANCHORS, SPEAKER_ACCENT, isOffscreen, plateName } from "./sceneAnchors.ts";
import { TAIL_EDGE, TAIL_STOP, offscreenStub, panelTail } from "./panelTail.ts";
import { beatPlate, eventPlate, scenePlate } from "./art.ts";
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
          assert.equal(page.text.includes("沒有上平台"), false, page.text);
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
    assert.ok(open.includes("星期一開始上學"));
    assert.equal(open.includes("明天開始上學"), false);
    const wrong = ["去年你自己收過玩具", "去年你站過去聽", "去年「九七」", "去年你也是這樣坐", "去年你跟著吃飯"];
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
    assert.ok(named.pages.some((page) => page.text.includes("你自己想怎樣，嘉欣？")));
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
    assert.ok(exploreOfferCopy({ counter: { ...freshState().counter, COUNTER_EXPLORE: 0 } }).includes("沒有下過平台"));
    assert.ok(exploreOfferCopy({ counter: { ...freshState().counter, COUNTER_EXPLORE: 1 } }).includes("下過一次"));
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
    for (const word of ["拿去用啦", "今次", "踢波", "個波", "唔使錢", "你琴日冇落嚟。", "你去年冇落嚟。"]) assert.ok(said.includes(word), `dialogue keeps ${word}`);
  });

  it("speech quoted inside narration is dialogue, not narration", () => {
    assert.deepEqual(cantoneseHits("他說這支是多出來的。「你拿去用啦。」筆芯有一點深。"), []);
    assert.ok(cantoneseHits("你拿去用啦。").length > 0);
    assert.equal(quotedSpeaker("媽媽看爸爸一眼。「大人有時也會擔心。」", "大人有時也會擔心。"), "媽媽");
    assert.equal(quotedSpeaker("阿姨說：「呢個唔使錢。」", "呢個唔使錢。"), "阿姨");
    const voice = dialogueWarnings("阿傑", "這個球是我先拿到的！");
    assert.ok(voice.length > 0 && voice.every((w) => w.register === "colloquial"));
    assert.deepEqual(dialogueWarnings("老師", "不用怕，進去和其他小朋友玩。"), []);
    assert.ok(dialogueWarnings("老師", "唔使驚。").length > 0);
  });

  it("the list itself catches what the playtest found", () => {
    for (const bad of ["紅波", "踢波", "今次不是搶", "同阿傑一組", "一隻雀", "這個不必錢", "你拿去用啦。", "走近少少", "他還沒去沖涼", "收進雪櫃", "拎著膠袋", "車仔", "出街沒有你的份"]) {
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
    assert.ok(/portrait=\{speaking &&/.test(app) && /tail=\{speaking\?\.speaker/.test(app), "portrait and tail only for a dialogue line");
  });

  it("every line is drawn, choices wait for the last line, lines are announced, and the palette stays at or below amber", () => {
    const app = readFileSync(new URL("../components/life/LifeApp.tsx", import.meta.url), "utf8");
    const stage = readFileSync(new URL("../components/life/Stage.tsx", import.meta.url), "utf8");
    const battle = readFileSync(new URL("../components/life/Battle.tsx", import.meta.url), "utf8");
    const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
    const anchors = readFileSync(new URL("./sceneAnchors.ts", import.meta.url), "utf8");
    assert.ok(app.includes('aria-live="polite"'));
    assert.ok(app.includes("reveal.done ? ("), "actions only after every line");
    assert.ok(app.includes("useAdvanceKeys"));
    assert.ok(stage.includes("下午 {afternoons}/2"));
    assert.ok(stage.includes("prefers-reduced-motion"));
    assert.equal(stage.includes("/art/"), false, "Stage.tsx builds no art path");
    assert.ok(/<details/.test(app), "folded numbers stay");
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

describe("ui v4.2 — speech bubbles point at the person who speaks", () => {
  it("every dialogue speaker on a painted page has a head anchor in that painting, or an explicit offscreen entry", () => {
    const missing = new Set<string>();
    const seen = new Set<string>();
    for (const life of LIVES) {
      for (const page of life.pages) {
        const s = page.state;
        let plate: string | null = null;
        let sequence: SceneLine[] = [];
        if (page.phase === "story") {
          const beat = s.note as Parameters<typeof beat1985>[0];
          const story = beat1985(beat, s);
          plate = beatPlate(beat, s.gender) ?? scenePlate(story.scene, s.gender);
          sequence = story.sequence;
        } else if (page.phase === "event") {
          const card = cardFor(s.eventId ?? "", s);
          plate = eventPlate(s.eventId, s.gender, card.scene) ?? scenePlate(card.scene, s.gender);
          sequence = card.sequence;
        } else if (page.phase === "repair") {
          plate = beatPlate("sat-night", s.gender);
          sequence = [say("媽媽", "為什麼走到門口？")];
        }
        for (const line of sequence) {
          if (line.type !== "dialogue") continue;
          const name = plateName(plate);
          seen.add(`${name}:${line.speaker}`);
          if (!name || !SCENE_ANCHORS[name]?.[line.speaker]) missing.add(`${name}:${line.speaker} (${s.eventId ?? s.note})`);
        }
      }
    }
    console.log(`bubble anchors used ${[...seen].sort().join(" ")}`);
    assert.deepEqual([...missing].sort(), []);
    for (const [name, anchors] of Object.entries(SCENE_ANCHORS)) {
      for (const [who, anchor] of Object.entries(anchors)) {
        if (!anchor || isOffscreen(anchor)) continue;
        assert.ok(anchor.x > 0 && anchor.x < 1 && anchor.y > 0 && anchor.y < 1 && anchor.r > 0 && anchor.r < 0.2, `${name}:${who}`);
      }
    }
    assert.equal(plateName("/hk-people-life/art/q/market-girl.webp"), "market");
    assert.equal(plateName("/art/1985/memory.jpg"), null);
  });
});

describe("ui v4.3 — the dialogue panel's tail points at the speaker's head", () => {
  // Desktop: the panel overlays the bottom ~40% of a 1280x720 stage. Phone: the panel sits below the stage.
  const LAYOUTS = {
    desktop: { stage: { x: 0, y: 0, w: 1280, h: 720 }, panel: { x: 26, y: 446, w: 1228, h: 256 } },
    phone: { stage: { x: 0, y: 0, w: 390, h: 219 }, panel: { x: 6, y: 227, w: 378, h: 600 } },
  };
  it("for every anchored speaker, the tip stops on a ring round the head, aims at its centre, sits above the panel, and the base stays on the panel's top edge", () => {
    for (const [layout, { stage, panel }] of Object.entries(LAYOUTS)) {
      const half = 14;
      for (const [name, anchors] of Object.entries(SCENE_ANCHORS)) {
        for (const [who, head] of Object.entries(anchors)) {
          // The child never speaks a dialogue line; only speakers get a tail.
          if (!head || isOffscreen(head) || who === "child") continue;
          const tail = panelTail({ stage, panel, head, half });
          const label = `${layout} ${name}:${who}`;
          assert.ok(tail, label);
          const A = { x: stage.x + head.x * stage.w - panel.x, y: stage.y + head.y * stage.h - panel.y };
          const R = head.r * stage.h;
          assert.ok(Math.abs(Math.hypot(tail.tip.x - A.x, tail.tip.y - A.y) - R * TAIL_STOP) < 0.5, `${label} tip on the ring`);
          const base = { x: (tail.b1.x + tail.b2.x) / 2, y: 0 };
          const cross = (tail.tip.x - A.x) * (base.y - A.y) - (tail.tip.y - A.y) * (base.x - A.x);
          assert.ok(Math.abs(cross) < 1e-6 * Math.max(1, R * R * 100), `${label} base, tip and head centre are in line`);
          assert.ok(tail.tip.y < 0, `${label} tip above the panel`);
          assert.ok(tail.b1.y === 0 && tail.b2.y === 0 && tail.b1.x >= TAIL_EDGE && tail.b2.x <= panel.w - TAIL_EDGE, `${label} base on the top edge`);
          assert.ok(tail.tip.y > A.y || Math.abs(tail.tip.x - A.x) > R, `${label} tip comes from below or beside, not across the face`);
          assert.equal(tail.dashed, false);
        }
      }
    }
  });
  it("the base slides under the speaker and clamps at the panel's ends", () => {
    const { stage, panel } = LAYOUTS.desktop;
    const left = panelTail({ stage, panel, head: { x: 0.16, y: 0.25, r: 0.08 }, half: 14 });
    const right = panelTail({ stage, panel, head: { x: 0.72, y: 0.17, r: 0.08 }, half: 14 });
    const edge = panelTail({ stage, panel, head: { x: 0.005, y: 0.2, r: 0.05 }, half: 14 });
    assert.ok(left && right && edge);
    assert.ok(Math.abs((left.b1.x + left.b2.x) / 2 - (0.16 * 1280 - 26)) < 0.01);
    assert.ok(Math.abs((right.b1.x + right.b2.x) / 2 - (0.72 * 1280 - 26)) < 0.01);
    assert.equal(edge.b1.x, TAIL_EDGE);
    assert.equal(panelTail({ stage, panel: { ...panel, y: 100 }, head: { x: 0.5, y: 0.2, r: 0.1 }, half: 14 }), null, "head at the panel edge: no tail");
  });
  it("an offscreen voice gets a short dashed stub leaning toward its side", () => {
    const stub = offscreenStub({ panelW: 1228, side: "left", half: 14 });
    assert.equal(stub.dashed, true);
    assert.ok(stub.tip.y < 0 && stub.tip.y > -40 && stub.tip.x < stub.b1.x);
    assert.ok(offscreenStub({ panelW: 1228, side: "right", half: 14 }).tip.x > 1100);
  });
  it("no speech bubble or head ring on the painting; portrait and dialogue live in the panel", () => {
    const app = readFileSync(new URL("../components/life/LifeApp.tsx", import.meta.url), "utf8");
    const stage = readFileSync(new URL("../components/life/Stage.tsx", import.meta.url), "utf8");
    assert.equal(/SpeechLayer|ui-bubble|ui-head-ring/.test(app + stage), false);
    assert.ok(app.includes("portrait={") && app.includes("tail={"));
  });
  it("every speaker has one accent", () => {
    for (const who of ["媽媽", "爸爸", "嫲嫲", "阿傑", "阿姨", "老師"] as const) assert.match(SPEAKER_ACCENT[who], /^#[0-9a-f]{6}$/);
    assert.equal(new Set(Object.values(SPEAKER_ACCENT)).size, 6);
  });
});
