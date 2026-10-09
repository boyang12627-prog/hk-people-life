/**
 * V3.3 regression audit for the simulated playtest (docs: /workspace/playtest/REPORT.md, not in repo).
 * Every P0 in that report has a test here so it cannot come back. P1 groups follow.
 * Each test drives the real reducer and reads the same text functions the screens call.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  activityBlurb,
  activityDetail,
  activityLabel,
  cardFor,
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
import { selectSpoken } from "./speak.ts";
import { KINDY_DOOR, PRIMARY_EXAM, playtestTools } from "./battleSpec.ts";
import { CANTONESE_TO_WRITTEN, cantoneseHits } from "./wording.ts";
import type { Gender, State } from "./types.ts";

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

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !name.endsWith(".test.ts") && name !== "wording.ts" ? [path] : [];
  });
}

function stripComments(text: string) {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
}

describe("playtest fixes v3.3 — P2 書面中文", () => {
  it("no listed Cantonese word in any player-facing string", () => {
    const root = new URL("..", import.meta.url).pathname;
    const hits: string[] = [];
    for (const file of sourceFiles(root)) {
      const code = stripComments(readFileSync(file, "utf8"));
      for (const literal of code.match(/"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g) ?? []) {
        for (const hit of cantoneseHits(literal)) hits.push(`${file.replace(root, "")}: ${literal} → ${hit.rule.written}`);
      }
    }
    assert.deepEqual(hits, []);
    assert.ok(CANTONESE_TO_WRITTEN.length >= 10);
  });

  it("the list itself catches what the playtest found", () => {
    for (const bad of ["紅波", "踢波", "今次不是搶", "同阿傑一組", "一隻雀", "這個不必錢", "你拿去用啦。", "走近少少", "他還沒去沖涼", "收進雪櫃", "拎著膠袋", "車仔", "出街沒有你的份"]) {
      assert.ok(cantoneseHits(bad).length > 0, bad);
    }
    for (const ok of ["一隻麻雀飛過", "不要出街口", "塑膠袋太重", "和阿傑一組", "士多", "默書"]) assert.deepEqual(cantoneseHits(ok), [], ok);
  });
});
