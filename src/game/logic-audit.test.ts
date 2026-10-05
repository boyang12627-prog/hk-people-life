import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { actBattle, createBattle } from "./battleSim.ts";
import { readFileSync } from "node:fs";
import { FLAG_LEDGER, RETIRED_FLAGS, SKILL_LEDGER, TAG_LEDGER } from "./ledger.ts";
import { cardFor, choicesFor, fifteenLines, heardNews, lifeVoice, variantOf, yearLean, YEARS } from "./content.ts";
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

describe("logic audit v2.2", () => {
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
    assert.ok(cardFor(state.eventId, state).lines.join("").includes("仲有氣"));
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
    assert.ok(card.includes("繼續食飯"));
    assert.equal(card.includes("企埋去聽"), false);
    state = chooseId(state, "A");
    assert.equal(state.result?.text.includes("頭先講過將來"), false);
    assert.equal(state.memories.find((item) => item.id === "MEM_SILENT_NEWS_01")?.variant, "plain");
  });

  it("playing alone both afternoons makes the news cold", () => {
    let state = run(freshState(1), [{ type: "gender", gender: "boy", name: "" }]);
    state = spend(state, ["ACT_PLAY", "ACT_DRAW"]);
    assert.equal(variantOf("EVT_1984_NEWS_01", state), "cold");
    assert.ok(cardFor("EVT_1984_NEWS_01", state).lines.join("").includes("玩咗成個下午"));
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
    assert.ok(cardFor(state.eventId, state).lines.join("").includes("未正式識"));
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
    assert.ok(before.includes("唔係第一次"));
    state = { ...state, phase: "event", eventId: "EVT_1986_FAMILY_06" };
    const left = chooseId(state, "A");
    const stayed = chooseId(state, "C");
    assert.equal(left.counter.WORLD_DAD_WORK_OCCURRENCES, stayed.counter.WORLD_DAD_WORK_OCCURRENCES);
    assert.equal(left.counter.PLAYER_DAD_CHOICE_RESPONSE, 1);
    assert.equal(stayed.counter.PLAYER_DAD_CHOICE_RESPONSE, 3);
    assert.notEqual(left.npc.NPC_DAD_01.relation, stayed.npc.NPC_DAD_01.relation);
    assert.ok(cardFor("EVT_1986_ECHO_08", left).lines.join("").includes("約裂過"));
    assert.ok(cardFor("EVT_1986_ECHO_08", stayed).lines.join("").includes("留低過"));
  });

  it("followed reading is stronger than an unpracticed attempt", () => {
    const weak = createBattle({ approach: "curious", hp: 80, sp: 40, tidy: false, see: false, ask: false, practiced: false });
    const strong = createBattle({ approach: "curious", hp: 80, sp: 40, tidy: false, see: false, ask: false, practiced: true });
    weak.cd.read = 0;
    strong.cd.read = 0;
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
    assert.ok(loud?.result.includes("唔使即刻還"));
    const quiet = choicesFor("EVT_1986_MARKET_07", { ...freshState(), primary: { ...freshState().primary, STAT_SPEECH: 5 } }).find((item) => item.id === "B");
    assert.equal(quiet?.result.includes("唔使即刻還"), false);
    const dreaming = {
      ...freshState(),
      derived: { ...freshState().derived, VALUE_DREAM: 70, VALUE_REALITY: 50 },
      npc: { ...freshState().npc, NPC_FRIEND_01: { relation: 4, trust: 2, available: true } },
    };
    assert.ok(cardFor("EVT_1986_SKILL_05", dreaming).lines.join("").includes("望住顏色"));
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
    assert.ok(voice.includes("繼續食飯"));
    assert.ok(voice.includes("跟住睇"));
    assert.ok(voice.includes("踏出"));
  });

  it("repair talk and silence each gain and lose something", () => {
    const base = { ...freshState(), phase: "repair" as const, gender: "girl" as const, result: { text: "你踏出一步。", deltas: [], skills: [] } };
    const talk = reducer(base, { type: "repair", talk: true });
    const silent = reducer(base, { type: "repair", talk: false });
    assert.ok(talk.result?.text.includes("屋企近"));
    assert.ok(talk.result?.text.includes("緊"));
    assert.equal(talk.derived.STATE_FAMILY_HARMONY, base.derived.STATE_FAMILY_HARMONY + 2);
    assert.equal(talk.derived.STATE_STRESS, base.derived.STATE_STRESS + 1);
    assert.ok(silent.result?.text.includes("靜"));
    assert.ok(silent.result?.text.includes("少咗一句"));
    assert.equal(silent.derived.STATE_FAMILY_HARMONY, base.derived.STATE_FAMILY_HARMONY - 1);
    assert.equal(silent.derived.STATE_PEACE, base.derived.STATE_PEACE + 1);
  });

  it("low independent thought still shows the question", () => {
    const state = { ...freshState(), derived: { ...freshState().derived, INDEPENDENT_THOUGHT: 12 } };
    const choices = choicesFor("EVT_1986_SKILL_05", state);
    const ask = choices.find((item) => item.id === "D");
    assert.ok(ask);
    assert.equal(ask?.label, "你有個奇怪問題想問");
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
    const ledger = new Set(FLAG_LEDGER.map((item) => item.id));
    for (const flag of seen) assert.equal(ledger.has(flag), true, flag);
    for (const spec of FLAG_LEDGER) {
      assert.ok(spec.producer.length > 0);
      assert.ok(spec.consumer.length > 0);
      assert.ok(spec.consumerKind);
      assert.ok(spec.fallback);
      assert.ok(spec.scope);
    }
    const game = ["./content.ts", "./engine.ts"].map((file) => readFileSync(new URL(file, import.meta.url), "utf8")).join("\n");
    const ui = readFileSync(new URL("../components/life/LifeApp.tsx", import.meta.url), "utf8");
    const reads = (src: string, id: string) => src.includes(`.includes("${id}")`);
    for (const spec of FLAG_LEDGER) {
      const seenInPlay = reads(game, spec.id) || reads(ui, spec.id);
      if (spec.consumerKind === "CODE") assert.equal(reads(game, spec.id), true, spec.id);
      if (spec.consumerKind === "ENDING") assert.equal(seenInPlay, true, spec.id);
      if (spec.consumerKind === "DEBUG" || spec.consumerKind === "MEMORY") assert.equal(seenInPlay, false, spec.id);
    }
    for (const spec of TAG_LEDGER) {
      const seenInPlay = reads(game, spec.id) || reads(ui, spec.id);
      assert.equal(seenInPlay, spec.consumerKind !== "DEBUG" && spec.consumerKind !== "MEMORY", spec.id);
    }
    for (const spec of SKILL_LEDGER) {
      const where = spec.consumerKind === "BATTLE" ? ui : game;
      assert.equal(reads(where, spec.id) || (spec.consumerKind === "ENDING" && (reads(game, spec.id) || reads(ui, spec.id))), true, spec.id);
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
    assert.ok(choicesFor("EVT_1986_ECHO_08", company).find((item) => item.id === "A")?.result.includes("識陪屋企人"));
    const carry = { ...freshState(), skills: ["SKL_08"] };
    assert.equal(choicesFor("EVT_1986_ECHO_08", carry).find((item) => item.id === "C")?.effect.derived?.STATE_STRESS, 1);
    const favour = { ...freshState(), skills: ["SKL_11"] };
    assert.equal(choicesFor("EVT_1986_ECHO_08", favour).find((item) => item.id === "B")?.effect.derived?.STATE_PEACE, 2);
    const walked = { ...freshState(), skills: ["SKL_09"] };
    assert.ok(fifteenLines(walked).join("").includes("自己行過"));
    const lowNews = { ...freshState(), personalityTags: ["TAG_NEWS_ENGAGEMENT_LOW"] };
    assert.ok(fifteenLines(lowNews).join("").includes("顧住食飯"));
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
});
