import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { actBattle, BATTLE_COST, createBattle } from "./battleSim.ts";
import { readFileSync } from "node:fs";
import { judgeBalance, provePerfect, resolveAuto, runGateSample } from "./battleBalance.ts";
import { KINDY_DOOR } from "./battleSpec.ts";
import { FLAG_LEDGER, INDEX_LEDGER, MEMORY_LEDGER, ledgerSummary, RETIRED_FLAGS, SKILL_LEDGER, TAG_LEDGER } from "./ledger.ts";
import { battleStory, cardFor, choicesFor, fifteenAct, fifteenLines, knownEventIds, lifeVoice, sceneFor, variantOf, yearLean, YEARS } from "./content.ts";
import { CHILDHOOD_EVENT_IDS, DAILY_STATIC_IDS, renderStatic, STATIC_EVENTS } from "./data/events.ts";
import { runLives } from "./lifeSim.ts";
import { heardNews } from "./speak.ts";
import { applyEffect, freshState, parseSave, reducer, type Action } from "./engine.ts";
import type { State } from "./types.ts";

function run(state: State, actions: Action[]) {
  return actions.reduce(reducer, state);
}

function spend(state: State, ids: string[]) {
  let next = reducer(state, { type: "toActivities" });
  for (const id of ids) {
    next = reducer(next, { type: "activity", id });
    next = reducer(next, { type: "ack" });
  }
  return next;
}

function chooseId(state: State, id: string) {
  const choice = choicesFor(state.eventId ?? "", state).find((item) => item.id === id);
  if (!choice) throw new Error(`missing ${id} on ${state.eventId}`);
  return reducer(state, { type: "choose", choice });
}

describe("logic audit v2.4", () => {
  it("news C is not remembered as heard", () => {
    let state = run(freshState(1), [{ type: "gender", gender: "girl", name: "阿澄" }]);
    state = spend(state, ["ACT_REST", "ACT_MARKET"]);
    assert.equal(state.eventId, "EVT_1984_NEWS_01");
    assert.equal(variantOf(state.eventId, state), "harmony");
    state = chooseId(state, "C");
    assert.equal(state.flags.includes("FLAG_HEARD_ADULT_FUTURE"), false);
    assert.equal(heardNews(state), false);
    assert.equal(state.memories[0]?.choiceId, "C");
    state = reducer(state, { type: "ack" });
    state = chooseId(state, "A");
    state = reducer(state, { type: "ack" });
    assert.equal(state.eventId, "EVT_1984_FAMILY_02");
    assert.equal(state.counter.NPC_MOM_STRESS < 20, true);
    assert.equal(variantOf(state.eventId, state), "low_pressure");
    assert.ok(cardFor(state.eventId, state).lines.join("").includes("早"));
    state = chooseId(state, "C");
    state = reducer(state, { type: "ack" });
    assert.equal(state.phase, "year-end");
    state = reducer(state, { type: "nextYear" });
    state = spend(state, ["ACT_REST", "ACT_PLAY"]);
    assert.equal(state.eventId, "EVT_1985_SCHOOL_01");
    assert.ok(cardFor(state.eventId, state).lines.join("").includes("還有力氣"));
    state = chooseId(state, "B");
    assert.equal(state.skills.includes("SKL_01"), true);
    assert.equal(state.npc.NPC_FRIEND_01.available, false);
    state = reducer(state, { type: "settleBattle" });
    state = reducer(state, { type: "ack" });
    state = chooseId(state, "A");
    state = reducer(state, { type: "ack" });
    assert.equal(state.eventId, "EVT_1985_FAMILY_03");
    assert.equal(variantOf(state.eventId, state), "plain");
    const card = cardFor(state.eventId, state).lines.join("");
    assert.ok(card.includes("繼續吃飯"));
    assert.equal(card.includes("站過去聽"), false);
    state = chooseId(state, "A");
    assert.equal(state.result?.text.includes("頭先講過將來"), false);
    assert.equal(state.memories.find((item) => item.id === "MEM_SILENT_NEWS_01")?.variant, "plain");
  });

  it("playing alone both afternoons makes the news cold", () => {
    let state = run(freshState(1), [{ type: "gender", gender: "boy", name: "" }]);
    state = spend(state, ["ACT_PLAY", "ACT_DRAW"]);
    assert.equal(variantOf("EVT_1984_NEWS_01", state), "cold");
    assert.ok(cardFor("EVT_1984_NEWS_01", state).lines.join("").includes("玩了一整個下午"));
    assert.ok(state.derived.STATE_FAMILY_HARMONY < 70);
  });

  it("school C does not introduce the friend or grant practiced reading", () => {
    let state = run(freshState(1), [{ type: "gender", gender: "girl", name: "" }]);
    state = spend(state, ["ACT_REST", "ACT_PLAY"]);
    state = chooseId(state, "A");
    state = reducer(state, { type: "ack" });
    state = chooseId(state, "A");
    state = reducer(state, { type: "ack" });
    state = chooseId(state, "A");
    state = reducer(state, { type: "ack" });
    state = reducer(state, { type: "nextYear" });
    state = spend(state, ["ACT_PLAY", "ACT_DRAW"]);
    state = chooseId(state, "C");
    assert.equal(state.skills.includes("SKL_01"), false);
    assert.equal(state.npc.NPC_FRIEND_01.available, false);
    state = reducer(state, { type: "settleBattle" });
    state = reducer(state, { type: "ack" });
    state = chooseId(state, "C");
    state = reducer(state, { type: "ack" });
    state = chooseId(state, "C");
    state = reducer(state, { type: "ack" });
    assert.equal(state.eventId, "EVT_1985_FRIEND_04");
    assert.equal(variantOf(state.eventId, state), "stranger");
    assert.ok(cardFor(state.eventId, state).lines.join("").includes("還不正式認識"));
  });

  it("explore fallback cannot skip the gate, and declining is explicit", () => {
    let state = freshState();
    state = { ...state, phase: "result", yearIndex: 2, gender: "girl", queue: ["EVT_1986_ECHO_08"], counter: { ...state.counter, COUNTER_EXPLORE: 0 } };
    state = reducer(state, { type: "ack" });
    assert.equal(state.phase, "explore-offer");
    state = reducer(state, { type: "explore", go: true });
    assert.equal(state.counter.COUNTER_EXPLORE, 1);
    assert.equal(state.phase, "result");
    state = reducer(state, { type: "ack" });
    assert.equal(state.phase, "explore-offer");
    state = reducer(state, { type: "explore", go: true });
    assert.equal(state.counter.COUNTER_EXPLORE, 2);
    state = reducer(state, { type: "ack" });
    assert.equal(state.phase, "event");
    assert.equal(state.eventId, "EVT_1986_ECHO_08");

    let declined = freshState();
    declined = { ...declined, phase: "explore-offer", yearIndex: 2, gender: "boy", queue: ["EVT_1986_ECHO_08"] };
    declined = reducer(declined, { type: "explore", go: false });
    assert.equal(declined.memories.find((item) => item.id === "MEM_FIRST_INDEPENDENCE")?.choiceId, "skip");
    declined = reducer(declined, { type: "ack" });
    assert.equal(declined.phase, "year-end");
    assert.equal(declined.eventId, null);
    assert.ok(declined.memories.some((item) => item.choiceId === "skip"));
  });

  it("one estate trip plus one offer still reaches the echo", () => {
    let state = freshState();
    state = { ...state, phase: "result", yearIndex: 2, gender: "girl", queue: ["EVT_1986_ECHO_08"], counter: { ...state.counter, COUNTER_EXPLORE: 1 } };
    state = reducer(state, { type: "ack" });
    assert.equal(state.phase, "explore-offer");
    state = reducer(state, { type: "explore", go: true });
    state = reducer(state, { type: "ack" });
    assert.equal(state.eventId, "EVT_1986_ECHO_08");
  });

  it("dad's extra work is the world's count, not the child's answer", () => {
    let state = freshState();
    state = { ...state, phase: "result", yearIndex: 1, queue: [], gender: "girl" };
    state = reducer(state, { type: "ack" });
    assert.equal(state.phase, "year-end");
    assert.equal(state.counter.WORLD_DAD_WORK_OCCURRENCES, 1);
    state = reducer(state, { type: "nextYear" });
    assert.equal(state.counter.WORLD_DAD_WORK_OCCURRENCES, 2);
    const before = cardFor("EVT_1986_FAMILY_06", state).lines.join("");
    assert.ok(before.includes("不是第一次"));
    state = { ...state, phase: "event", eventId: "EVT_1986_FAMILY_06" };
    const left = chooseId(state, "A");
    const stayed = chooseId(state, "C");
    assert.equal(left.counter.WORLD_DAD_WORK_OCCURRENCES, stayed.counter.WORLD_DAD_WORK_OCCURRENCES);
    assert.equal(left.counter.PLAYER_DAD_CHOICE_RESPONSE, 1);
    assert.equal(stayed.counter.PLAYER_DAD_CHOICE_RESPONSE, 3);
    assert.notEqual(left.npc.NPC_DAD_01.relation, stayed.npc.NPC_DAD_01.relation);
    assert.ok(cardFor("EVT_1986_ECHO_08", left).lines.join("").includes("裂開過"));
    assert.ok(cardFor("EVT_1986_ECHO_08", stayed).lines.join("").includes("留過"));
  });

  it("followed reading is stronger than an unpracticed attempt", () => {
    const weak = createBattle({ approach: "curious", hp: 80, sp: 40, tidy: false, see: false, ask: false, practiced: false });
    const strong = createBattle({ approach: "curious", hp: 80, sp: 40, tidy: false, see: false, ask: false, practiced: true });
    actBattle(weak, "read", true);
    actBattle(strong, "read", true);
    assert.ok(strong.stress < weak.stress);
  });

  it("later cards still read skill, speech, and the dream gap", () => {
    const painted = {
      ...freshState(),
      skills: ["SKL_03"],
      counter: { ...freshState().counter, ART_PROGRESS: 3 },
    };
    assert.ok(cardFor("EVT_1986_MARKET_07", painted).lines.join("").includes("顏色"));
    const loud = choicesFor("EVT_1986_MARKET_07", { ...freshState(), primary: { ...freshState().primary, STAT_SPEECH: 6 } }).find((item) => item.id === "B");
    assert.ok(loud?.result.includes("不必立刻還"));
    const quiet = choicesFor("EVT_1986_MARKET_07", { ...freshState(), primary: { ...freshState().primary, STAT_SPEECH: 5 } }).find((item) => item.id === "B");
    assert.equal(quiet?.result.includes("不必立刻還"), false);
    const dreaming = {
      ...freshState(),
      derived: { ...freshState().derived, VALUE_DREAM: 70, VALUE_REALITY: 50 },
      npc: { ...freshState().npc, NPC_FRIEND_01: { relation: 4, trust: 2, available: true } },
    };
    assert.ok(cardFor("EVT_1986_SKILL_05", dreaming).lines.join("").includes("看著顏色"));
  });

  it("ending voice keeps one memory from each year", () => {
    const voice = lifeVoice(
      [
        { id: "MEM_NEWS_01", choiceId: "C", weight: 1, year: 1984 },
        { id: "MEM_SILENT_NEWS_01", choiceId: "C", weight: 1, year: 1985 },
        { id: "MEM_FIRST_INTEREST", choiceId: "A", weight: 2, year: 1986 },
        { id: "MEM_DAD_WORK", choiceId: "A", weight: 2, year: 1986 },
        { id: "MEM_MARKET_01", choiceId: "B", weight: 2, year: 1986 },
        { id: "MEM_FIRST_INDEPENDENCE", choiceId: "C", weight: 3, year: 1986 },
      ],
      "阿澄",
    );
    assert.ok(voice.includes("阿澄"));
    assert.ok(voice.includes("繼續吃飯"));
    assert.ok(voice.includes("接著看"));
    assert.ok(voice.includes("踏出"));
  });

  it("repair talk and silence each gain and lose something", () => {
    const base = { ...freshState(), phase: "repair" as const, gender: "girl" as const, result: { text: "你踏出一步。", deltas: [], skills: [] } };
    const talk = reducer(base, { type: "repair", talk: true });
    const silent = reducer(base, { type: "repair", talk: false });
    assert.ok(talk.result?.text.includes("家裡近"));
    assert.ok(talk.result?.text.includes("緊"));
    assert.equal(talk.derived.STATE_FAMILY_HARMONY, base.derived.STATE_FAMILY_HARMONY + 2);
    assert.equal(talk.derived.STATE_STRESS, base.derived.STATE_STRESS + 1);
    assert.ok(silent.result?.text.includes("靜"));
    assert.ok(silent.result?.text.includes("少了一句"));
    assert.equal(silent.derived.STATE_FAMILY_HARMONY, base.derived.STATE_FAMILY_HARMONY - 1);
    assert.equal(silent.derived.STATE_PEACE, base.derived.STATE_PEACE + 1);
  });

  it("low independent thought still shows the question", () => {
    const state = { ...freshState(), derived: { ...freshState().derived, INDEPENDENT_THOUGHT: 12 } };
    const choices = choicesFor("EVT_1986_SKILL_05", state);
    const ask = choices.find((item) => item.id === "D");
    assert.ok(ask);
    assert.equal(ask?.label, "你有個奇怪的問題想問");
    assert.equal(ask?.effect.primary?.STAT_SPEECH, undefined);
    assert.equal(ask?.effect.derived?.STATE_STRESS, 1);
  });

  it("save envelope migrates v11 and rejects garbage", () => {
    assert.equal(parseSave("not-json"), null);
    assert.equal(parseSave("{\"schemaVersion\":2}"), null);
    const legacy = freshState();
    const counter = { ...legacy.counter } as Record<string, number>;
    delete counter.WORLD_DAD_WORK_OCCURRENCES;
    delete counter.PLAYER_DAD_CHOICE_RESPONSE;
    counter.NPC_DAD_OVERTIME_COUNT = 4;
    const raw = JSON.stringify({ ...legacy, counter, memories: [{ id: "MEM_NEWS_01", choiceId: "C", eventId: "EVT_1984_NEWS_01" }] });
    const migrated = parseSave(raw);
    assert.ok(migrated);
    assert.equal(migrated?.schemaVersion, 2);
    assert.equal(migrated?.counter.WORLD_DAD_WORK_OCCURRENCES, 4);
    assert.equal(migrated?.memories[0]?.snapshot?.dream, legacy.derived.VALUE_DREAM);
    const envelope = JSON.stringify({ schemaVersion: 2, savedAt: "2026-10-04T00:00:00.000Z", state: freshState() });
    assert.equal(parseSave(envelope)?.phase, "title");
    const dirty = freshState();
    const broken = JSON.stringify({
      ...dirty,
      yearIndex: 9,
      battleTries: 40,
      primary: { ...dirty.primary, STAT_MIND: 999 },
      derived: { ...dirty.derived, STATE_MOOD: -999 },
      counter: { ...dirty.counter, NPC_MOM_STRESS: 500, ART_PROGRESS: 80, COUNTER_EXPLORE: -3 },
      npc: { ...dirty.npc, NPC_DAD_01: { relation: 999, trust: -20, available: true } },
      battle: { kind: "win", stress: 400, hp: -5 },
    });
    const clamped = parseSave(broken);
    assert.equal(clamped?.primary.STAT_MIND, 10);
    assert.equal(clamped?.derived.STATE_MOOD, 0);
    assert.equal(clamped?.counter.NPC_MOM_STRESS, 100);
    assert.equal(clamped?.counter.ART_PROGRESS, 10);
    assert.equal(clamped?.counter.COUNTER_EXPLORE, 0);
    assert.equal(clamped?.npc.NPC_DAD_01.relation, 100);
    assert.equal(clamped?.npc.NPC_DAD_01.trust, 0);
    assert.equal(clamped?.yearIndex, 2);
    assert.equal(clamped?.battleTries, 9);
    assert.equal(clamped?.battle?.stress, 100);
    assert.equal(clamped?.battle?.hp, 0);
  });

  it("every formal flag has a producer and a consumer", () => {
    const seen = new Set<string>();
    const ids = YEARS.flatMap((year) => [...year.events, ...year.dailies]);
    for (const id of ids) {
      for (const choice of choicesFor(id, freshState())) {
        for (const flag of choice.effect.flags ?? []) if (flag.startsWith("FLAG_")) seen.add(flag);
      }
      const low = { ...freshState(), derived: { ...freshState().derived, INDEPENDENT_THOUGHT: 10 } };
      for (const choice of choicesFor(id, low)) {
        for (const flag of choice.effect.flags ?? []) if (flag.startsWith("FLAG_")) seen.add(flag);
      }
    }
    for (const flag of RETIRED_FLAGS) assert.equal(seen.has(flag), false);
    const catalog = [...FLAG_LEDGER, ...INDEX_LEDGER, ...MEMORY_LEDGER];
    const ledger = new Set(catalog.map((item) => item.id));
    assert.equal(ledger.size, catalog.length);
    for (const flag of seen) assert.equal(ledger.has(flag), true, flag);
    for (const spec of catalog) {
      assert.ok(spec.producer.length > 0);
      assert.ok(spec.consumer.length > 0);
      assert.ok(spec.consumerKind);
      assert.ok(spec.fallback);
      assert.ok(spec.scope);
    }
    const sources: Record<string, string> = {
      "content.ts": readFileSync(new URL("./content.ts", import.meta.url), "utf8"),
      "engine.ts": readFileSync(new URL("./engine.ts", import.meta.url), "utf8"),
      "data/events.ts": readFileSync(new URL("./data/events.ts", import.meta.url), "utf8"),
      "speak.ts": readFileSync(new URL("./speak.ts", import.meta.url), "utf8"),
      "battleSpec.ts": readFileSync(new URL("./battleSpec.ts", import.meta.url), "utf8"),
      "LifeApp.tsx": readFileSync(new URL("../components/life/LifeApp.tsx", import.meta.url), "utf8"),
    };
    const game = ["content.ts", "engine.ts", "data/events.ts", "speak.ts"].map((name) => sources[name]).join("\n");
    const specSrc = sources["battleSpec.ts"];
    const ui = sources["LifeApp.tsx"];
    const readersOf = (id: string) =>
      Object.entries(sources)
        .filter(([, src]) => src.includes(`.includes("${id}")`))
        .map(([name]) => name);
    const reads = (src: string, id: string) => src.includes(`.includes("${id}")`);
    const codeReaders = FLAG_LEDGER.filter((spec) => spec.consumerKind === "CODE").map((spec) => `${spec.id}:${readersOf(spec.id).join("+") || "NONE"}`);
    console.log(`flag readers ${codeReaders.join(" | ")}`);
    for (const spec of FLAG_LEDGER) {
      assert.ok(spec.consumerKind === "CODE" || spec.consumerKind === "ENDING");
      if (spec.consumerKind === "CODE") assert.equal(reads(game, spec.id), true, `${spec.id} read by [${readersOf(spec.id).join(", ") || "none"}]`);
      if (spec.consumerKind === "ENDING") assert.equal(reads(game, spec.id) || reads(ui, spec.id), true, `${spec.id} read by [${readersOf(spec.id).join(", ") || "none"}]`);
    }
    for (const spec of [...INDEX_LEDGER, ...MEMORY_LEDGER]) {
      assert.equal(reads(game, spec.id) || reads(ui, spec.id), false, spec.id);
    }
    for (const spec of TAG_LEDGER) {
      const seenInPlay = reads(game, spec.id) || reads(ui, spec.id);
      assert.equal(seenInPlay, true, spec.id);
    }
    for (const spec of SKILL_LEDGER) {
      const where = spec.consumerKind === "BATTLE" ? ui : game;
      const battleWired = spec.consumerKind === "BATTLE" && specSrc.includes(`"${spec.id}"`) && ui.includes("KINDY_DOOR");
      assert.equal(reads(where, spec.id) || battleWired || (spec.consumerKind === "ENDING" && (reads(game, spec.id) || reads(ui, spec.id))), true, spec.id);
    }
  });

  it("event and choice ids stay unique, and memories point at a real choice", () => {
    const ids = YEARS.flatMap((year) => [...year.events, ...year.dailies]);
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) {
      assert.ok(cardFor(id, freshState()).title);
      const choices = choicesFor(id, freshState());
      assert.ok(choices.length >= 2, id);
      assert.equal(new Set(choices.map((choice) => choice.id)).size, choices.length, id);
      for (const choice of choices) {
        assert.ok(choice.result.includes("。") || choice.result.length > 8, `${id} ${choice.id}`);
        if (!choice.memory) continue;
        assert.equal(choice.memory.choiceId, choice.id, `${id} ${choice.id}`);
        assert.equal(choice.memory.eventId, id);
        assert.ok(choice.memory.echo);
      }
    }
  });

  it("tags stay out of flags, and each quiet skill changes a later scene", () => {
    const news = choicesFor("EVT_1984_NEWS_01", freshState()).find((item) => item.id === "C");
    assert.ok(news?.effect.tags?.includes("TAG_NEWS_ENGAGEMENT_LOW"));
    assert.equal((news?.effect.flags ?? []).some((flag) => flag.startsWith("TAG_")), false);
    const moved = applyEffect(freshState(), { flags: ["FLAG_HELPED_MOM_01", "TAG_RESPONSIBILITY"], tags: ["TAG_EMPATHY"] });
    assert.deepEqual(moved.state.flags, ["FLAG_HELPED_MOM_01"]);
    assert.ok(moved.state.personalityTags.includes("TAG_RESPONSIBILITY"));
    assert.ok(moved.state.personalityTags.includes("TAG_EMPATHY"));
    const market = { ...freshState(), personalityTags: ["TAG_RESPONSIBILITY"], counter: { ...freshState().counter, REL_LOCAL_MARKET: 30 } };
    assert.ok(cardFor("EVT_1986_MARKET_07", market).lines.join("").includes("伸出去接袋"));
    const share = { ...freshState(), skills: ["SKL_05"] };
    assert.equal(choicesFor("EVT_1986_SKILL_05", share).some((item) => item.id === "E"), true);
    assert.equal(choicesFor("EVT_1986_SKILL_05", freshState()).some((item) => item.id === "E"), false);
    const company = { ...freshState(), skills: ["SKL_06"] };
    assert.ok(choicesFor("EVT_1986_ECHO_08", company).find((item) => item.id === "A")?.result.includes("懂得陪家人"));
    const carry = { ...freshState(), skills: ["SKL_08"] };
    assert.equal(choicesFor("EVT_1986_ECHO_08", carry).find((item) => item.id === "C")?.effect.derived?.STATE_STRESS, 1);
    const favour = { ...freshState(), skills: ["SKL_11"] };
    assert.equal(choicesFor("EVT_1986_ECHO_08", favour).find((item) => item.id === "B")?.effect.derived?.STATE_PEACE, 2);
    const walked = { ...freshState(), skills: ["SKL_09"] };
    assert.ok(fifteenLines(walked).join("").includes("自己走過"));
    const lowNews = { ...freshState(), personalityTags: ["TAG_NEWS_ENGAGEMENT_LOW"] };
    assert.ok(fifteenLines(lowNews).join("").includes("顧著吃飯"));
  });

  it("a choice does not announce dream or reality, and 1986 opens 1996 first", () => {
    let state = run(freshState(1), [{ type: "gender", gender: "girl", name: "" }]);
    state = spend(state, ["ACT_REST", "ACT_MARKET"]);
    state = chooseId(state, "C");
    assert.equal(state.result?.lean, undefined);
    assert.equal(state.result?.text.includes("想做自己鍾意"), false);
    assert.equal(yearLean(70, 40).includes("自己決定"), true);
    const after = reducer({ ...freshState(), phase: "year-end", yearIndex: 2 }, { type: "nextYear" });
    assert.equal(after.phase, "fifteen");
    assert.equal(reducer(after, { type: "ack" }).phase, "ending");
    const old = freshState();
    const raw = JSON.stringify({ ...old, flags: ["TAG_EMPATHY", "FLAG_REPAIR_TALK"] });
    const migrated = parseSave(raw);
    assert.equal(migrated?.flags.includes("TAG_EMPATHY"), false);
    assert.ok(migrated?.personalityTags.includes("TAG_EMPATHY"));
    assert.ok(migrated?.flags.includes("FLAG_REPAIR_TALK"));
  });

  it("core choices come back the next year and again at fifteen", () => {
    const ask = remember("MEM_NEWS_01", "B", { flags: ["FLAG_PARENT_EXPLAIN"] });
    assert.ok(cardFor("EVT_1985_FAMILY_03", ask).lines.join("").includes("問過"));
    assert.ok(cardFor("EVT_1986_SKILL_05", ask).lines.join("").includes("實際"));
    assert.ok(fifteenLines(ask).join("").includes("自己先開口問"));
    const eat = remember("MEM_NEWS_01", "C", { personalityTags: ["TAG_NEWS_ENGAGEMENT_LOW"] });
    assert.ok(cardFor("EVT_1985_FAMILY_03", eat).lines.join("").includes("繼續吃飯"));
    assert.ok(cardFor("EVT_1986_SKILL_05", eat).lines.join("").includes("不急著選"));
    assert.ok(fifteenLines(eat).join("").includes("不急著問"));
    const mom = remember("MEM_MOM_TIRED", "A", { flags: ["FLAG_HELPED_MOM_01"] });
    assert.ok(cardFor("EVT_1985_SCHOOL_01", mom).lines.join("").includes("收過玩具"));
    assert.ok(cardFor("EVT_1986_MARKET_07", mom).lines.join("").includes("收過玩具"));
    assert.ok(fifteenLines(mom).join("").includes("伸出去"));
    const ball = remember("MEM_RED_BALL", "B", { flags: ["FLAG_SHARED_BALL"] });
    assert.ok(cardFor("EVT_1986_SKILL_05", ball).lines.join("").includes("招你過去坐"));
    assert.ok(fifteenLines(ball).join("").includes("輪流"));
    const dad = remember("MEM_DAD_WORK", "B");
    assert.ok(cardFor("EVT_1986_ECHO_08", dad).lines.join("").includes("答應過他去上班"));
    assert.ok(fifteenLines(dad).join("").includes("應了一聲"));
  });

  it("battle costs come from one table, and prepared approaches are not a dead road", () => {
    const ui = readFileSync(new URL("../components/life/Battle.tsx", import.meta.url), "utf8");
    assert.equal(BATTLE_COST.walk, 0);
    assert.equal(BATTLE_COST.guard, 2);
    assert.ok(ui.includes("BATTLE_COST"));
    assert.equal(ui.includes("requestAnimationFrame"), false);
    assert.ok(ui.includes("resolveTurn"));
    assert.equal(ui.includes('"/scenes/kindy.jpg"'), false);
    assert.ok(ui.includes("KINDY_DOOR.scene"));
    assert.equal(/useRef\(onEnd\);\s*onEndRef\.current = onEnd/.test(ui), false);
    const simSrc = readFileSync(new URL("./lifeSim.ts", import.meta.url), "utf8");
    assert.equal(simSrc.includes("hp: 80"), false);
    assert.ok(simSrc.includes("spiritHp"));
    assert.ok(simSrc.includes("driveSp"));
    const gate = judgeBalance(runGateSample(200));
    assert.deepEqual(gate.fails, []);
    assert.equal(provePerfect(), "perfect");
  });

  it("dead marks stay out of play, and the dad answer is visible at fifteen", () => {
    const produced = new Set<string>();
    for (const id of YEARS.flatMap((year) => [...year.events, ...year.dailies])) {
      for (const choice of choicesFor(id, freshState())) for (const flag of choice.effect.flags ?? []) produced.add(flag);
    }
    assert.equal(produced.has("FLAG_DAD_OVERTIME_MEMORY"), false);
    assert.equal(produced.has("FLAG_FIRST_INDEPENDENCE"), false);
    assert.equal(INDEX_LEDGER.some((item) => item.id === "FLAG_HEARD_ADULT_FUTURE" && item.consumerKind === "DEBUG"), true);
    assert.equal(MEMORY_LEDGER.length, 0);
    const summary = ledgerSummary();
    assert.ok(summary.retired >= 5);
    assert.equal(summary.indexOnly, 1);
    const answered = { ...freshState(), counter: { ...freshState().counter, PLAYER_DAD_CHOICE_RESPONSE: 1 } };
    assert.ok(fifteenLines(answered).join("").includes("沒有再等"));
    const walked = { ...freshState(), skills: ["SKL_09"] };
    assert.equal(fifteenAct(walked).id, "walk");
    const plain = freshState();
    const acted = reducer({ ...plain, phase: "fifteen" }, { type: "fifteenAct" });
    assert.equal(acted.phase, "ending");
    assert.equal(acted.memories.some((item) => item.memoryTypeId === "MEM_FIFTEEN" && item.instanceId === "MEM_FIFTEEN_1996"), true);
  });

  it("save rehydrate drops unknown ids and keeps repeated memory instances", () => {
    const dirty = freshState();
    const saved = parseSave(JSON.stringify({
      ...dirty,
      phase: "event",
      yearIndex: 0,
      apLeft: 9,
      eventId: "NOPE",
      queue: ["NOPE", "EVT_1984_NEWS_01", "EVT_1986_ECHO_08"],
      skills: ["SKL_01", "SKL_NOPE"],
      flags: ["FLAG_PARENT_EXPLAIN", "FLAG_DAD_OVERTIME_MEMORY", "FLAG_NOPE"],
      memories: [
        { id: "MEM_NEWS_01", choiceId: "C", eventId: "EVT_1984_NEWS_01", year: 1984 },
        { id: "MEM_GHOST", choiceId: "A", eventId: "EVT_NOPE" },
        { id: "MEM_DAD_WORK", instanceId: "MEM_DAD_WORK_1986", choiceId: "A", eventId: "EVT_1986_FAMILY_06", year: 1986 },
        { id: "MEM_DAD_WORK", instanceId: "MEM_DAD_WORK_1996", choiceId: "B", eventId: "EVT_1986_FAMILY_06", year: 1996 },
      ],
    }));
    assert.ok(saved);
    assert.equal(saved?.phase, "year");
    assert.equal(saved?.eventId, null);
    assert.equal(saved?.apLeft, 2);
    assert.deepEqual(saved?.queue, ["EVT_1984_NEWS_01"]);
    assert.deepEqual(saved?.skills, ["SKL_01"]);
    assert.deepEqual(saved?.flags, ["FLAG_PARENT_EXPLAIN"]);
    assert.equal(saved?.memories.some((item) => item.id === "MEM_GHOST"), false);
    assert.equal(saved?.memories.filter((item) => item.memoryTypeId === "MEM_DAD_WORK").length, 2);
    assert.ok(cardFor("EVT_1986_ECHO_08", saved!).lines.join("").includes("答應過他去上班"));
    const crowded = selectOverflow();
    assert.equal(crowded.includes("老師說得很慢"), false);
    assert.ok(crowded.includes("實際"));
  });

  it("daily events are static data, and a new static event does not need a switch", () => {
    const live = new Set(knownEventIds());
    for (const id of live) assert.ok(CHILDHOOD_EVENT_IDS.includes(id as (typeof CHILDHOOD_EVENT_IDS)[number]), id);
    const src = readFileSync(new URL("./data/events.ts", import.meta.url), "utf8");
    const cardFn = src.slice(src.indexOf("export function cardFor"), src.indexOf("export function choicesFor"));
    const choiceFn = src.slice(src.indexOf("export function choicesFor"));
    for (const id of DAILY_STATIC_IDS) {
      assert.equal(cardFn.includes(`case "${id}"`), false, id);
      assert.equal(choiceFn.includes(`case "${id}"`), false, id);
      assert.equal(cardFor(id, freshState()).title, STATIC_EVENTS[id].title);
      assert.equal(choicesFor(id, freshState()).length, 3);
      assert.equal(sceneFor(id, "home"), STATIC_EVENTS[id].scene);
    }
    const started = Date.now();
    const sample = renderStatic(STATIC_EVENTS.EVT_STATIC_LAMP);
    const seconds = (Date.now() - started) / 1000;
    assert.equal(sample.card.title, "走廊的燈");
    assert.equal(sample.choices.length, 3);
    assert.ok(seconds < 1);
    assert.equal(cardFor("EVT_STATIC_LAMP", freshState()).title, "走廊的燈");
    assert.equal(
      YEARS.some((year) => year.events.includes("EVT_STATIC_LAMP") || year.dailies.includes("EVT_STATIC_LAMP")),
      false,
    );
    assert.equal(KINDY_DOOR.scene, "kindy");
    assert.equal(KINDY_DOOR.id, "BTL_KINDY_DOOR");
    assert.equal(KINDY_DOOR.skipKind, "win");
  });

  it("a curious win does not say the child clung to mom", () => {
    const story = battleStory("win", "curious");
    assert.equal(story.text.includes("拉著媽媽"), false);
    assert.ok(story.text.includes("沒有拉住誰"));
    assert.ok(battleStory("win", "safe").text.includes("拉著媽媽"));
  });

  it("a thousand automatic lives all reach the ending", () => {
    const report = runLives(1000);
    assert.equal(report.ended, 1000, JSON.stringify(report.stuck));
    assert.ok(report.events.includes("EVT_1984_NEWS_01"));
    assert.ok(report.events.includes("EVT_1986_FAMILY_06"));
  });

  it("auto battle ends, and skip is a win rather than a perfect", () => {
    const sim = createBattle({ approach: "safe", hp: 80, sp: 40, tidy: true, see: false, ask: false, practiced: true });
    const kind = resolveAuto(sim);
    assert.ok(kind === "win" || kind === "perfect" || kind === "fail" || kind === "bad");
    assert.equal(KINDY_DOOR.skipKind, "win");
  });
});

function selectOverflow() {
  const state = {
    ...freshState(),
    flags: ["FLAG_PARENT_EXPLAIN", "FLAG_AVOID_CONFLICT", "FLAG_CURIOUS_SCHOOL", "FLAG_TEACHER_SLOW"],
    skills: ["SKL_05"],
    derived: { ...freshState().derived, VALUE_DREAM: 70, VALUE_REALITY: 50 },
    npc: { ...freshState().npc, NPC_FRIEND_01: { relation: 1, trust: 6, available: true } },
  };
  return cardFor("EVT_1986_SKILL_05", state).lines.join("");
}

function remember(id: string, choiceId: string, extra: Partial<State> = {}) {
  const base = freshState();
  return {
    ...base,
    ...extra,
    flags: extra.flags ?? base.flags,
    personalityTags: extra.personalityTags ?? [],
    counter: extra.counter ?? base.counter,
    npc: extra.npc ?? base.npc,
    memories: [
      {
        id,
        eventId: id,
        choiceId,
        variant: "base",
        year: 1984,
        age: 3,
        npc: "",
        emotion: "",
        weight: 1,
        echo: "十年後仲喺度。",
      },
    ],
  };
}
