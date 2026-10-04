import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { actBattle, createBattle } from "./battleSim.ts";
import { cardFor, choicesFor, heardNews, lifeVoice, variantOf } from "./content.ts";
import { freshState, reducer, type Action } from "./engine.ts";
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

describe("logic audit v2.1", () => {
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

  it("dad overtime, skills, speech and dream are read later", () => {
    let state = freshState();
    state = { ...state, phase: "event", eventId: "EVT_1984_FAMILY_02", gender: "girl", yearIndex: 0 };
    state = chooseId(state, "B");
    assert.equal(state.counter.NPC_DAD_OVERTIME_COUNT, 1);
    state = { ...state, phase: "event", eventId: "EVT_1985_FAMILY_03", yearIndex: 1 };
    state = chooseId(state, "B");
    assert.equal(state.counter.NPC_DAD_OVERTIME_COUNT, 2);
    state = { ...state, phase: "year-end", yearIndex: 1 };
    state = reducer(state, { type: "nextYear" });
    assert.ok(cardFor("EVT_1986_FAMILY_06", state).lines.join("").includes("唔係第一次"));

    state = { ...state, skills: [...state.skills, "SKL_03"], counter: { ...state.counter, ART_PROGRESS: 3 } };
    assert.ok(cardFor("EVT_1986_MARKET_07", state).lines.join("").includes("顏色"));

    state = { ...state, primary: { ...state.primary, STAT_SPEECH: 6 } };
    const asked = choicesFor("EVT_1986_MARKET_07", state).find((item) => item.id === "B");
    assert.ok(asked?.result.includes("唔使即刻還"));
    const quiet = choicesFor("EVT_1986_MARKET_07", { ...state, primary: { ...state.primary, STAT_SPEECH: 5 } }).find((item) => item.id === "B");
    assert.equal(quiet?.result.includes("唔使即刻還"), false);

    state = { ...state, derived: { ...state.derived, VALUE_DREAM: 70, VALUE_REALITY: 50 }, counter: { ...state.counter, ART_PROGRESS: 0, MIND_PROGRESS: 0 }, npc: { ...state.npc, NPC_FRIEND_01: { relation: 4, trust: 2, available: true } } };
    assert.ok(cardFor("EVT_1986_SKILL_05", state).lines.join("").includes("望住顏色"));
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

  it("ending voice uses weight, not a fixed set of ids", () => {
    const voice = lifeVoice(
      [
        { id: "MEM_NEWS_01", choiceId: "C", weight: 1, year: 1984 },
        { id: "MEM_MOM_TIRED", choiceId: "C", weight: 1, year: 1984 },
        { id: "MEM_SILENT_NEWS_01", choiceId: "C", weight: 1, year: 1985 },
        { id: "MEM_RED_BALL", choiceId: "C", weight: 1, year: 1985 },
        { id: "MEM_FIRST_INTEREST", choiceId: "C", weight: 1, year: 1986 },
        { id: "MEM_FIRST_INDEPENDENCE", choiceId: "C", weight: 3, year: 1986 },
      ],
      "阿澄",
    );
    assert.ok(voice.includes("阿澄"));
    assert.ok(voice.includes("踏出"));
    assert.equal(voice.includes("繼續食飯"), false);
  });
});
