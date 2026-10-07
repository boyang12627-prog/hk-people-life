import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { actBattle, actionCost, ATTACK_GOAL, BATTLE_COST, battleSpeed, createBattle, initiativeFor, resolveTurn } from "./battleSim.ts";
import { readFileSync, existsSync } from "node:fs";
import { judgeBalance, provePerfect, resolveAuto, runGateSample } from "./battleBalance.ts";
import { slicePlate } from "./art.ts";
import { produce1985, produce1986, missed1986, missedLine, chainEcho, CHAIN_85_STAGES, friendFollow, MISS_85_FRIEND, MISS_85_MOM, MISS_85_RAIN, REPLAY_MATRIX } from "./freedom.ts";
import { runChildhood } from "./lifeSim.ts";
import { WORLD_1985 } from "./world.ts";
import { BATTLE_NARRATIVE, battleNarrative } from "./battleNarrative.ts";
import { BATTLE_SPECS, KINDY_DOOR, PRIMARY_EXAM } from "./battleSpec.ts";
import { EQUIPMENT_CATALOG, questOf } from "./catalog.ts";
import { FLAG_LEDGER, INDEX_LEDGER, MEMORY_LEDGER, ledgerSummary, RETIRED_FLAGS, SKILL_LEDGER, TAG_LEDGER } from "./ledger.ts";
import { battleStory, cardFor, choicesFor, fifteenAct, fifteenLines, isLastYear, knownEventIds, lifeVoice, sceneFor, variantOf, yearLean, yearOf, YEARS } from "./content.ts";
import { beat1985 } from "./story.ts";
import { tickKit } from "./world.ts";
import { CHILDHOOD_EVENT_IDS, DAILY_STATIC_IDS, renderStatic, STATIC_EVENTS } from "./data/events.ts";
import { runLives } from "./lifeSim.ts";
import { heardNews } from "./speak.ts";
import { applyEffect, equipItem, freshState, parseSave, reducer, unequipItem, type Action } from "./engine.ts";
import type { State } from "./types.ts";

function run(state: State, actions: Action[]) {
  return actions.reduce(reducer, state);
}

function spend(state: State, ids: string[]) {
  let next = state.phase === "activities" || state.phase === "story" ? state : reducer(state, { type: "toActivities" });
  if (next.phase === "story" && next.note === "open") next = reducer(next, { type: "ack" });
  for (const id of ids) {
    if (next.phase !== "activities") break;
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

describe("logic audit v3.1", () => {
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
    state = spend(state, ["ACT_MARKET"]);
    assert.equal(state.eventId, "EVT_1985_FAMILY_03");
    assert.equal(variantOf(state.eventId, state), "plain");
    const card = cardFor(state.eventId, state).lines.join("");
    assert.ok(card.includes("繼續吃飯"));
    assert.equal(card.includes("站過去聽"), false);
    state = chooseId(state, "A");
    assert.equal(state.result?.text.includes("頭先講過將來"), false);
    assert.equal(state.memories.find((item) => item.id === "MEM_SILENT_NEWS_01")?.variant, "plain");
    state = reducer(state, { type: "ack" });
    while (state.phase === "story") state = reducer(state, { type: "ack" });
    state = reducer(state, { type: "activity", id: "ACT_REST" });
    state = reducer(state, { type: "ack" });
    while (state.phase === "event") {
      state = chooseId(state, "A");
      state = reducer(state, { type: "ack" });
    }
    while (state.phase === "story" && state.note !== "monday") state = reducer(state, { type: "ack" });
    if (state.note === "monday") state = reducer(state, { type: "ack" });
    assert.equal(state.eventId, "EVT_1985_SCHOOL_01");
    assert.ok(cardFor(state.eventId, state).lines.join("").includes("還有力氣"));
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
    state = spend(state, ["ACT_DRAW"]);
    while (state.phase === "event") {
      state = chooseId(state, "A");
      state = reducer(state, { type: "ack" });
    }
    while (state.phase === "story") state = reducer(state, { type: "ack" });
    state = reducer(state, { type: "activity", id: "ACT_REST" });
    state = reducer(state, { type: "ack" });
    while (state.phase === "event") {
      state = chooseId(state, "A");
      state = reducer(state, { type: "ack" });
    }
    while (state.phase === "story" && state.note !== "monday") state = reducer(state, { type: "ack" });
    if (state.phase === "story") state = reducer(state, { type: "ack" });
    assert.equal(state.eventId, "EVT_1985_SCHOOL_01");
    state = chooseId(state, "C");
    assert.equal(state.skills.includes("SKL_01"), false);
    assert.equal(state.npc.NPC_FRIEND_01.available, false);
    assert.ok(state.missed.includes(MISS_85_MOM));
    assert.ok(state.missed.includes(MISS_85_FRIEND));
    assert.ok(state.missed.includes(MISS_85_RAIN));
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
    const weak = createBattle({ approach: "curious", hp: 80, sp: 40, stabilize: false, see: false, ask: false, prepared: false });
    const strong = createBattle({ approach: "curious", hp: 80, sp: 40, stabilize: false, see: false, ask: false, prepared: true });
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
    assert.equal(migrated?.schemaVersion, 3);
    assert.equal(migrated?.counter.WORLD_DAD_WORK_OCCURRENCES, 4);
    assert.equal(migrated?.memories[0]?.snapshot?.dream, legacy.derived.VALUE_DREAM);
    const envelope = JSON.stringify({ schemaVersion: 2, savedAt: "2026-10-04T00:00:00.000Z", state: freshState() });
    assert.equal(parseSave(envelope)?.phase, "title");
    assert.equal(parseSave(envelope)?.schemaVersion, 3);
    assert.deepEqual(parseSave(envelope)?.equipment, []);
    assert.deepEqual(parseSave(envelope)?.techniques, []);
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
    assert.equal(clamped?.yearIndex, 3);
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
      const battleWired = spec.consumerKind === "BATTLE" && specSrc.includes(`"${spec.id}"`) && (ui.includes("battleSpecById") || ui.includes("KINDY_DOOR"));
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
    assert.equal(after.phase, "year");
    assert.equal(after.yearIndex, 3);
    const fifteen = reducer({ ...freshState(), phase: "year-end", yearIndex: 3 }, { type: "nextYear" });
    assert.equal(fifteen.phase, "fifteen");
    assert.equal(reducer(fifteen, { type: "ack" }).phase, "ending");
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
    assert.equal(actionCost("see", "TECH_READ_FACE"), 5);
    assert.equal(actionCost("see", "TECH_SPLIT_QUESTION"), 5);
    assert.ok(ui.includes("actionCost"));
    assert.equal(ui.includes("requestAnimationFrame"), false);
    assert.ok(ui.includes("resolveTurn"));
    assert.equal(ui.includes('"/scenes/kindy.jpg"'), false);
    assert.ok(ui.includes("spec.scene"));
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

  it("door pattern is loud four times, spirit waits for stress, and 88 is only the bell", () => {
    const pattern = KINDY_DOOR.enemyPattern;
    assert.equal(KINDY_DOOR.maxRounds, 8);
    assert.equal("maxRounds" in pattern, false);
    assert.equal(KINDY_DOOR.startGoal, 12);
    for (const round of [1, 3, 5]) assert.equal(pattern.threatFor(round).heavy, false, String(round));
    for (const round of [2, 4, 6, 7]) assert.equal(pattern.threatFor(round).heavy, true, String(round));
    assert.equal(pattern.threatFor(8).heavy, false);
    assert.ok(pattern.threatFor(8).hint.includes("門口有光"));
    const ui = readFileSync(new URL("../components/life/Battle.tsx", import.meta.url), "utf8");
    assert.ok(ui.includes("下一聲"));
    assert.ok(ui.includes("剛才"));
    assert.ok(ui.includes("hitLabel"));
    assert.ok(KINDY_DOOR.voice.entered.includes("你進去了"));
    assert.ok(ui.includes("hasActed"));
    assert.ok(ui.includes('enemyHint = ""'));

    const fresh = createBattle({ approach: "social", hp: 80, sp: 40, stabilize: false, see: false, ask: false, prepared: false });
    assert.equal(fresh.hasActed, false);
    assert.equal(fresh.maxRounds, KINDY_DOOR.maxRounds);

    const calm = createBattle({ approach: "social", hp: 80, sp: 40, stabilize: false, see: false, ask: false, prepared: false });
    calm.stress = 10;
    calm.threat = { stress: 9, hp: 5, heavy: false, hint: "輕", landed: "有人拉住你的衣袖。" };
    resolveTurn(calm, "walk");
    assert.equal(calm.hint, "你向前走一步。");
    assert.ok(calm.enemyHint.includes("衣袖"));
    assert.equal(calm.hasActed, true);
    assert.ok(calm.stress < 80);
    assert.equal(calm.hp, 80);

    const cracked = createBattle({ approach: "social", hp: 80, sp: 40, stabilize: false, see: false, ask: false, prepared: false });
    cracked.stress = 78;
    cracked.threat = { stress: 9, hp: 5, heavy: false, hint: "輕", landed: "撞過來。" };
    resolveTurn(cracked, "walk");
    assert.ok(cracked.stress >= 80);
    assert.ok(cracked.hp < 80);

    const mid = createBattle({ approach: "social", hp: 40, sp: 40, stabilize: false, see: false, ask: false, prepared: false });
    mid.round = 4;
    mid.goal = 95;
    mid.stress = 50;
    mid.threat = { stress: 0, hp: 0, heavy: false, hint: "無", landed: "無" };
    resolveTurn(mid, null);
    assert.equal(mid.over, null);
    assert.equal(mid.goal, 95);

    const bell = createBattle({ approach: "social", hp: 40, sp: 40, stabilize: false, see: false, ask: false, prepared: false });
    bell.round = bell.maxRounds;
    bell.goal = 95;
    bell.stress = 50;
    bell.threat = { stress: 0, hp: 0, heavy: false, hint: "無", landed: "無" };
    resolveTurn(bell, null);
    assert.equal(bell.over, "win");
  });

  it("auto battle ends, and skip is a win rather than a perfect", () => {
    const sim = createBattle({ approach: "safe", hp: 80, sp: 40, stabilize: true, see: false, ask: false, prepared: true });
    const kind = resolveAuto(sim);
    assert.ok(kind === "win" || kind === "perfect" || kind === "fail" || kind === "bad");
    assert.equal(KINDY_DOOR.skipKind, "win");
    const exam = createBattle({
      approach: "safe",
      hp: 80,
      sp: 40,
      stabilize: false,
      see: false,
      ask: false,
      prepared: true,
      spec: PRIMARY_EXAM,
    });
    assert.equal(exam.hint.includes("媽媽"), false);
    assert.equal(exam.maxRounds, 10);
    assert.equal(PRIMARY_EXAM.scene, "study");
    assert.equal(PRIMARY_EXAM.gated, false);
    const audit = readFileSync(new URL("../../scripts/audit-balance.ts", import.meta.url), "utf8");
    assert.match(audit, /if \(spec\.gated\)/);
    assert.match(audit, /not gated/);
    assert.equal(PRIMARY_EXAM.skills.prepared, "SKL_01");
    assert.equal(PRIMARY_EXAM.skills.stabilize, "SKL_07");
    assert.equal(PRIMARY_EXAM.techniques.see, "TECH_SPLIT_QUESTION");
    assert.equal(PRIMARY_EXAM.pressureSpeed, 10);
    assert.notEqual(PRIMARY_EXAM.voice.ask.label, KINDY_DOOR.voice.ask.label);
    resolveTurn(exam, "read");
    assert.equal(exam.hint.includes("默"), true);
    assert.equal(YEARS.some((year) => year.events.includes("BTL_PRIMARY_EXAM")), false);
    const tied = createBattle({ approach: "social", hp: 80, sp: 40, stabilize: false, see: false, ask: false, prepared: false, mind: 5 });
    assert.equal(tied.playerSpeed, 5);
    assert.equal(tied.stableFirst, false);
    assert.equal(tied.pressureFirst, false);
    assert.equal(tied.bonusQuick, false);
    assert.deepEqual(tied.initiativeOrder, ["player", "pressure"]);
    const ahead = initiativeFor(10, 5);
    assert.equal(ahead.stableFirst, true);
    assert.equal(ahead.bonusQuick, false);
    const quick = createBattle({
      approach: "social",
      hp: 80,
      sp: 40,
      stabilize: false,
      see: false,
      ask: false,
      prepared: false,
      mind: 5,
      passiveSpeed: 10,
    });
    assert.equal(quick.bonusQuick, true);
    assert.equal(battleSpeed({ mind: 5, passive: 10 }), 15);
    assert.equal(battleSpeed({ mind: 5, gear: 9, buff: 9 }), 9);
    const watched = battleSpeed({ mind: 5, gear: 1 });
    assert.equal(initiativeFor(watched, 5).stableFirst, false);
    resolveTurn(quick, "walk");
    resolveTurn(quick, "walk");
    resolveTurn(quick, "walk");
    assert.equal(quick.awaitingBonus, true);
    assert.equal(quick.round, 3);
    const goal = quick.goal;
    resolveTurn(quick, "read");
    assert.equal(quick.goal, goal);
    assert.equal(quick.awaitingBonus, false);
    const slow = createBattle({
      approach: "social",
      hp: 80,
      sp: 40,
      stabilize: false,
      see: false,
      ask: false,
      prepared: false,
      mind: 0,
      enemySpeed: 10,
    });
    assert.equal(slow.pressureFirst, true);
    assert.equal(slow.stress, 28);
    assert.equal(slow.turnOwner, "player");
  });

  it("one watch, one technique, and the echo are real", () => {
    const toy = choicesFor("MINI_84_TOY", freshState());
    const looked = applyEffect(freshState(), toy.find((item) => item.id === "B")!.effect);
    assert.deepEqual(looked.state.equipment, ["EQP_PLASTIC_WATCH"]);
    assert.deepEqual(looked.state.equipped, ["EQP_PLASTIC_WATCH"]);
    const kept = looked.state.memories.find((item) => item.id === "MEM_TOY_WATCH");
    assert.equal(kept?.year, 1984);
    assert.equal(kept?.npc, "NPC_AUNT_01");
    assert.equal(kept?.choiceId, "B");
    assert.equal(EQUIPMENT_CATALOG[0]?.sourceQuest, "QUEST_STALL_WATCH");
    assert.equal(questOf("QUEST_STALL_WATCH")?.kind, "daily");
    assert.equal(questOf("QUEST_STALL_WATCH")?.eventId, "MINI_84_TOY");
    assert.ok(fifteenLines(looked.state).join("").includes("仍然不會走"));
    const off = unequipItem(looked.state, "EQP_PLASTIC_WATCH");
    assert.deepEqual(off.equipment, ["EQP_PLASTIC_WATCH"]);
    assert.deepEqual(off.equipped, []);
    assert.ok(fifteenLines(off).join("").includes("仍然不會走"));
    const lost = { ...off, equipment: [] as string[] };
    assert.ok(fifteenLines(lost).join("").includes("不在手上"));
    assert.equal(fifteenLines(lost).join("").includes("仍然不會走"), false);
    assert.deepEqual(equipItem(off, "EQP_PLASTIC_WATCH").equipped, ["EQP_PLASTIC_WATCH"]);
    const tugged = applyEffect(freshState(), toy.find((item) => item.id === "A")!.effect);
    assert.deepEqual(tugged.state.equipment, []);
    const face = applyEffect(freshState(), { skills: ["SKL_02"] });
    assert.deepEqual(face.state.techniques, ["TECH_READ_FACE"]);
    assert.deepEqual(applyEffect(freshState(), { skills: ["SKL_01"] }).state.techniques, []);
    const plain = createBattle({ approach: "social", hp: 80, sp: 40, stabilize: false, see: false, ask: false, prepared: false });
    const armed = createBattle({ approach: "social", hp: 80, sp: 40, stabilize: false, see: false, ask: false, prepared: false, attack: 9 });
    assert.equal(armed.attack, 0);
    assert.equal(KINDY_DOOR.axes.includes("attack"), false);
    assert.equal(PRIMARY_EXAM.axes.includes("technique"), true);
    resolveTurn(plain, "walk");
    resolveTurn(armed, "walk");
    assert.equal(plain.goal, armed.goal);
    const behind = createBattle({ approach: "safe", hp: 80, sp: 40, stabilize: false, see: false, ask: false, prepared: false, spec: PRIMARY_EXAM, mind: 5, gearSpeed: 0 });
    const edged = createBattle({ approach: "safe", hp: 80, sp: 40, stabilize: false, see: false, ask: false, prepared: false, spec: PRIMARY_EXAM, mind: 5, gearSpeed: 1 });
    assert.equal(behind.pressureFirst, true);
    assert.equal(edged.pressureFirst, false);
    assert.equal(edged.stableFirst, false);
    assert.equal(initiativeFor(5, 5).stableFirst, false);
    assert.ok(behind.stress > edged.stress);
    const barePaper = createBattle({ approach: "safe", hp: 80, sp: 40, stabilize: false, see: true, ask: false, prepared: false, spec: PRIMARY_EXAM, attack: 0 });
    const withPen = createBattle({ approach: "safe", hp: 80, sp: 40, stabilize: false, see: true, ask: false, prepared: false, spec: PRIMARY_EXAM, attack: 1 });
    resolveTurn(barePaper, "walk");
    resolveTurn(withPen, "walk");
    assert.equal(withPen.goal, barePaper.goal + ATTACK_GOAL);
    const pen = choicesFor("EVT_1988_PEN_01", freshState()).find((item) => item.id === "A")!;
    const got = applyEffect({ ...freshState(), yearIndex: 3 }, pen.effect);
    assert.deepEqual(got.state.equipment, ["EQP_BALLPOINT"]);
    assert.deepEqual(got.state.techniques, ["TECH_SPLIT_QUESTION"]);
    assert.equal(questOf("QUEST_SPARE_PEN")?.kind, "side");
    assert.ok(fifteenLines(got.state).join("").includes("筆還在"));
    const split = createBattle({ approach: "safe", hp: 80, sp: 40, stabilize: false, see: true, ask: false, prepared: false, spec: PRIMARY_EXAM });
    assert.equal(actBattle(split, "see", true), true);
    assert.equal(actBattle(split, "see", true), false);
    const junk = { ...freshState(), equipment: ["EQP_DIGI_DEVICE_01"], equipped: ["EQP_DIGI_DEVICE_01"] };
    assert.deepEqual(parseSave(JSON.stringify(junk))?.equipment, []);
    const bare = createBattle({ approach: "social", hp: 80, sp: 40, stabilize: false, see: false, ask: false, prepared: false });
    const held = createBattle({ approach: "social", hp: 80, sp: 40, stabilize: false, see: false, ask: false, prepared: false, stressResist: 1 });
    bare.stress = 10;
    held.stress = 10;
    bare.threat = { stress: 8, hp: 0, heavy: false, hint: "輕", landed: "撞" };
    held.threat = { stress: 8, hp: 0, heavy: false, hint: "輕", landed: "撞" };
    resolveTurn(bare, "walk");
    resolveTurn(held, "walk");
    assert.equal(held.stress, bare.stress - 1);
  });

  it("a failed exam does not talk about kindergarten, and 1986 is not the last year", () => {
    assert.equal(isLastYear(2), false);
    assert.equal(isLastYear(YEARS.length - 1), true);
    assert.equal(yearOf({ yearIndex: 2 }).title, "走廊");
    assert.equal(yearOf({ yearIndex: 3 }).title, "書桌");
    const examChoice = choicesFor("EVT_1988_EXAM_01", freshState()).find((item) => item.id === "A");
    assert.equal(examChoice?.specId, "BTL_PRIMARY_EXAM");
    const started = reducer(
      { ...freshState(), phase: "event", yearIndex: 3, eventId: "EVT_1988_EXAM_01", queue: [] },
      { type: "choose", choice: examChoice! },
    );
    assert.equal(started.battleSpecId, "BTL_PRIMARY_EXAM");
    const failed = reducer(
      { ...started, phase: "battle-result", battle: { kind: "fail", stress: 40, hp: 20 }, battleTries: 1 },
      { type: "settleBattle" },
    );
    assert.equal(failed.result?.text.includes("幼稚園"), false);
    assert.equal(battleNarrative("BTL_PRIMARY_EXAM").retryNote.includes("幼稚園"), false);
    assert.ok(battleNarrative("BTL_KINDY_DOOR").retryNote.includes("幼稚園明天仍然開"));
    assert.ok(choicesFor("EVT_1988_PEN_01", freshState()).find((item) => item.id === "A")?.result.includes("你問他是不是他的"));
    const ui = readFileSync(new URL("../components/life/LifeApp.tsx", import.meta.url), "utf8");
    assert.equal(ui.includes("小時候那三年"), false);
    assert.equal(ui.includes("yearIndex >= 2"), false);
    const specIds = BATTLE_SPECS.map((spec) => spec.id).sort();
    assert.deepEqual(Object.keys(BATTLE_NARRATIVE).sort(), specIds);
    assert.equal(YEARS.filter((year) => year.calendar === "prototype-slice").map((year) => year.year).join(","), "1988");
    for (const year of YEARS) {
      if (year.year <= 1986) assert.equal(year.calendar, "childhood-afternoon");
    }
    for (const eventId of knownEventIds()) {
      for (const choice of choicesFor(eventId, freshState())) {
        if (!choice.battle) continue;
        assert.ok(choice.specId && specIds.includes(choice.specId), `${eventId} ${choice.id} ${choice.specId ?? "missing"}`);
      }
    }
    const specSrc = readFileSync(new URL("./battleSpec.ts", import.meta.url), "utf8");
    assert.equal(specSrc.includes("battleStory"), false);
    assert.equal(specSrc.includes("examStory"), false);
    assert.deepEqual(
      BATTLE_SPECS.map((spec) => `${spec.id}:${spec.settlement}`).sort(),
      ["BTL_KINDY_DOOR:kindy", "BTL_PRIMARY_EXAM:exam"],
    );
    const engineSrc = readFileSync(new URL("./engine.ts", import.meta.url), "utf8");
    assert.equal(engineSrc.includes('id === "BTL_PRIMARY_EXAM"'), false);
    assert.match(engineSrc, /settlement === "exam"/);
    for (const name of ["cast.jpg", "door-girl.jpg", "door-boy.jpg", "pressure-girl.jpg", "pressure-boy.jpg", "inside-girl.jpg", "inside-boy.jpg", "later-girl.jpg", "later-boy.jpg", "memory.jpg"]) {
      assert.equal(existsSync(new URL(`../../public/art/1985/${name}`, import.meta.url)), true, name);
    }
    assert.equal(slicePlate({ year: 1985, scene: "kindy", gender: "girl" }), "/art/1985/door-girl.jpg");
    assert.equal(slicePlate({ year: 1986, scene: "estate", gender: "boy" }), "/art/1985/later-boy.jpg");
    assert.equal(slicePlate({ year: 1984, scene: "home", gender: "girl" }), null);
    assert.equal(slicePlate({ year: 1988, scene: "study", gender: "girl" }), null);
    const played = produce1985(["ACT_PLAY", "ACT_DRAW"]);
    assert.deepEqual(played.queue, ["EVT_1985_SCHOOL_01", "MINI_85_GRANDMA", "MINI_85_TV", "MINI_85_DAD"]);
    assert.ok(played.missed.includes(MISS_85_MOM));
    assert.ok(played.missed.includes(MISS_85_FRIEND));
    assert.ok(played.missed.includes("MISS_85_AUNT"));
    const withMom = produce1985(["ACT_MARKET", "ACT_REST"]);
    assert.ok(withMom.queue.includes("EVT_1985_FAMILY_03"));
    assert.ok(withMom.queue.includes("MINI_85_GRANDMA"));
    assert.equal(withMom.queue.includes("MINI_85_RAIN"), false);
    assert.equal(withMom.queue.includes("EVT_1985_FRIEND_04"), false);
    assert.equal(withMom.queue.includes("MINI_85_DAD"), true);
    const sundayMarket = produce1985(["ACT_REST", "ACT_MARKET"]);
    assert.equal(sundayMarket.queue.includes("EVT_1985_FAMILY_03"), false);
    assert.ok(sundayMarket.queue.includes("MINI_QUIET"));
    const sundayEstate = produce1985(["ACT_DRAW", "ACT_ESTATE"]);
    assert.ok(sundayEstate.queue.includes("MINI_85_RAIN"));
    assert.equal(sundayEstate.queue.includes("EVT_1985_FRIEND_04"), false);
    assert.equal(WORLD_1985.sat.find((spot) => spot.npcId === "NPC_TEACH_01")?.eventId, null);
    assert.deepEqual(
      REPLAY_MATRIX.filter((row) => row.playable).map((row) => row.year),
      YEARS.map((year) => year.year),
    );
    for (const row of REPLAY_MATRIX) {
      const year = YEARS.find((item) => item.year === row.year);
      assert.equal(Boolean(year), row.playable, String(row.year));
      if (year) assert.equal(year.calendar, row.calendar);
    }
    assert.ok(cardFor("EVT_1986_FAMILY_06", remember("MEM_DAD_HOME", "A")).lines.join("").includes("回來過"));
    const out = produce1986(["ACT_MARKET", "ACT_ESTATE"]);
    assert.deepEqual(out.queue, ["EVT_1986_SKILL_05", "EVT_1986_FAMILY_06", "EVT_1986_MARKET_07", "MINI_86_HELP", "MINI_QUIET", "EVT_1986_ECHO_08"]);
    assert.equal(out.missed.includes("MISS_86_FRIEND"), true);
    const home = produce1986(["ACT_PLAY", "ACT_DRAW"]);
    assert.equal(home.queue.includes("MINI_86_TV"), true);
    assert.equal(home.queue.includes("EVT_1986_FRIEND_09"), false);
    assert.equal(home.queue.includes("MINI_QUIET"), true);
    assert.equal(home.queue.includes("EVT_1986_MARKET_07"), false);
    assert.equal(home.queue[0], "EVT_1986_SKILL_05");
    assert.equal(home.queue.at(-1), "EVT_1986_ECHO_08");
    const missedHim = { ...freshState(), missed: ["MISS_85_FRIEND"], spent: ["ACT_ESTATE"] };
    assert.equal(friendFollow(missedHim), "ask");
    assert.ok(cardFor("EVT_1986_FRIEND_09", missedHim).lines.join("").includes("見過"));
    const shared = { ...freshState(), flags: ["FLAG_SHARED_BALL"], spent: ["ACT_PLAY"], npc: { ...freshState().npc, NPC_FRIEND_01: { relation: 5, trust: 5, available: true } } };
    assert.equal(friendFollow(shared), "invite");
    assert.ok(cardFor("EVT_1986_FRIEND_09", shared).lines.join("").includes("不是搶"));
    const grabbed = { ...freshState(), flags: ["FLAG_TOY_MONOPOLY"], spent: ["ACT_ESTATE"] };
    assert.equal(friendFollow(grabbed), "wary");
    assert.ok(cardFor("EVT_1986_FRIEND_09", grabbed).lines.join("").includes("抱緊"));
    const podium = cardFor("EVT_1985_FRIEND_04", { ...freshState(), spent: ["ACT_ESTATE", "ACT_PLAY"] });
    assert.equal(podium.title, "平台上的紅波");
    assert.equal(podium.scene, "estate");
    const sundayPodium = produce1986(["ACT_PLAY", "ACT_ESTATE"]);
    assert.equal(sundayPodium.missed.includes("MISS_86_ESTATE"), false);
    assert.equal(sundayPodium.missed.includes("MISS_86_FRIEND"), true);
    const bothEmpty = cardFor("MINI_QUIET", { ...freshState(), yearIndex: 2, spent: ["ACT_PLAY", "ACT_MARKET"] });
    assert.ok(bothEmpty.lines.join("").includes("這兩個下午"));
    assert.equal(cardFor("MINI_85_DAD", freshState()).lines.join("").includes("兩個下午你都在家"), false);
    assert.ok(missed1986(home.missed, "later").includes("一九八六年"));
    assert.ok(missedLine(played.missed, "later").includes("去年"));
    assert.equal(CHAIN_85_STAGES.length, 5);
    let chain = reducer({ ...freshState(3), phase: "year", yearIndex: 1 }, { type: "toActivities" });
    chain = spend(chain, ["ACT_ESTATE"]);
    assert.equal(chain.chain.stage, 1);
    assert.equal(chain.eventId, "EVT_1985_FRIEND_04");
    chain = chooseId(chain, "B");
    chain = reducer(chain, { type: "ack" });
    while (chain.phase === "story") chain = reducer(chain, { type: "ack" });
    chain = reducer(chain, { type: "activity", id: "ACT_DRAW" });
    chain = reducer(chain, { type: "ack" });
    assert.ok(chain.personalityTags.includes("TAG_ON_YOUR_OWN"));
    while (chain.phase === "event") {
      chain = chooseId(chain, "A");
      chain = reducer(chain, { type: "ack" });
    }
    while (chain.phase === "story" && chain.note !== "monday") chain = reducer(chain, { type: "ack" });
    if (chain.phase === "story") chain = reducer(chain, { type: "ack" });
    assert.equal(chain.eventId, "EVT_1985_SCHOOL_01");
    chain = chooseId(chain, "A");
    chain = reducer(chain, { type: "settleBattle" });
    chain = reducer(chain, { type: "ack" });
    while (chain.phase === "event" || chain.phase === "result") {
      if (chain.phase === "event") chain = chooseId(chain, "A");
      chain = reducer(chain, { type: "ack" });
    }
    if (chain.phase === "story") chain = reducer(chain, { type: "ack" });
    assert.equal(chain.phase, "year-end");
    assert.equal(chain.chain.stage, 4);
    assert.equal(chain.chain.status, "delayed");
    assert.equal(chain.chain.choiceId, "A");
    chain = reducer(chain, { type: "nextYear" });
    assert.equal(chain.chain.status, "recovered");
    assert.equal(chainEcho(chain.chain.choiceId).includes("開了口"), true);
    chain = reducer(chain, { type: "toActivities" });
    assert.equal(chain.chain.stage, 5);
    assert.equal(chain.chain.status, "completed");
  });

  it("saturday night follows what happened, not which button you pressed", () => {
    const ball = {
      id: "MEM_RED_BALL",
      eventId: "EVT_1985_FRIEND_04",
      choiceId: "B",
      variant: "podium",
      year: 1985,
      age: 4,
      npc: "NPC_FRIEND_01",
      emotion: "share",
      weight: 2,
      echo: "",
    };
    const shared = beat1985("sat-night", { ...freshState(), spent: ["ACT_ESTATE"], memories: [ball] }).lines.join("");
    const held = beat1985("sat-night", { ...freshState(), spent: ["ACT_ESTATE"], memories: [{ ...ball, choiceId: "A", emotion: "hold" }] }).lines.join("");
    const stayed = beat1985("sat-night", { ...freshState(), spent: ["ACT_REST"] }).lines.join("");
    assert.ok(shared.includes("鞋底有泥"));
    assert.ok(held.includes("不肯放"));
    assert.equal(held.includes("鞋底有泥"), false);
    assert.ok(stayed.includes("你不在"));
    assert.equal(stayed.includes("自己玩了一整天"), false);
    const alone = tickKit([]);
    const sharedDay = tickKit([{ id: "MEM_RED_BALL", emotion: "share" }]);
    const kept = tickKit([{ id: "MEM_RED_BALL", emotion: "hold" }]);
    assert.equal(alone.nextPlan, "withdraw");
    assert.equal(alone.currentMood, -1);
    assert.equal(alone.relationshipDeltaToday, 0);
    assert.equal(alone.seenPlayer, false);
    assert.equal(sharedDay.nextPlan, "seek");
    assert.equal(sharedDay.relationshipDeltaToday, 5);
    assert.equal(kept.nextPlan, "avoid");
    assert.equal(kept.currentMood, -2);
    const visit = reducer(
      {
        ...freshState(),
        phase: "note",
        yearIndex: 1,
        apLeft: 0,
        spent: ["ACT_ESTATE", "ACT_REST"],
        npcDays: { NPC_FRIEND_01: sharedDay },
        result: { text: "過了。", deltas: [], skills: [] },
      },
      { type: "ack" },
    );
    assert.equal(visit.eventId, "MINI_85_KIT_WAIT");
    const skipped = reducer(
      {
        ...freshState(),
        phase: "note",
        yearIndex: 1,
        apLeft: 0,
        spent: ["ACT_REST", "ACT_DRAW"],
        npcDays: { NPC_FRIEND_01: alone },
        result: { text: "過了。", deltas: [], skills: [] },
      },
      { type: "ack" },
    );
    assert.equal(skipped.eventId === "MINI_85_KIT_WAIT", false);
    assert.equal(skipped.npc.NPC_FRIEND_01.relation, 0);
  });

  it("five scripted childhoods do not meet the same people", () => {
    const lives = (["family", "self", "social", "conflict", "mixed"] as const).map((style) => runChildhood(style));
    assert.ok(lives.every((life) => life.ended), lives.map((life) => life.phase).join(","));
    const traces = lives.map((life) => life.seen.join(" "));
    assert.equal(new Set(traces).size, 5);
    assert.equal(lives[0].seen.some((line) => line.startsWith("EVT_1985_FAMILY_03")), true);
    assert.equal(lives[0].seen.some((line) => line.startsWith("EVT_1985_FRIEND_04")), false);
    assert.equal(lives[1].missed.includes(MISS_85_FRIEND), true);
    assert.equal(lives[2].seen.some((line) => line.startsWith("EVT_1985_FRIEND_04:B")), true);
    assert.equal(lives[3].seen.some((line) => line.startsWith("EVT_1985_FRIEND_04:A")), true);
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
