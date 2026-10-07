import { resolveAuto } from "./battleBalance";
import { battleSpecById } from "./battleSpec";
import { gearAttack, gearSpeed, gearStressResist } from "./catalog";
import { createBattle } from "./battleSim";
import type { Choice } from "./choice";
import { choicesFor, yearOf, YEARS } from "./content";
import { freshState, reducer } from "./engine";
import { driveSp, spiritHp, type State } from "./types";

export type LifePolicy = "first" | "last" | "mix";
export type ChildhoodStyle = "family" | "self" | "social" | "conflict" | "mixed";

const PLAN: Record<ChildhoodStyle, Record<number, [string, string]>> = {
  family: { 1984: ["ACT_MARKET", "ACT_REST"], 1985: ["ACT_MARKET", "ACT_REST"], 1986: ["ACT_MARKET", "ACT_REST"], 1988: ["ACT_MARKET", "ACT_REST"] },
  self: { 1984: ["ACT_PLAY", "ACT_DRAW"], 1985: ["ACT_PLAY", "ACT_DRAW"], 1986: ["ACT_PLAY", "ACT_DRAW"], 1988: ["ACT_DRAW", "ACT_REST"] },
  social: { 1984: ["ACT_MARKET", "ACT_PLAY"], 1985: ["ACT_ESTATE", "ACT_PLAY"], 1986: ["ACT_ESTATE", "ACT_PLAY"], 1988: ["ACT_DRAW", "ACT_REST"] },
  conflict: { 1984: ["ACT_PLAY", "ACT_MARKET"], 1985: ["ACT_ESTATE", "ACT_DRAW"], 1986: ["ACT_ESTATE", "ACT_MARKET"], 1988: ["ACT_DRAW", "ACT_REST"] },
  mixed: { 1984: ["ACT_REST", "ACT_DRAW"], 1985: ["ACT_MARKET", "ACT_ESTATE"], 1986: ["ACT_PLAY", "ACT_MARKET"], 1988: ["ACT_REST", "ACT_DRAW"] },
};

function pickStyled(choices: Choice[], eventId: string, style: ChildhoodStyle) {
  if (style === "conflict" && eventId.includes("FRIEND")) return choices.find((item) => item.id === "A") ?? choices[0];
  if (style === "social" && eventId.includes("FRIEND")) return choices.find((item) => item.id === "B") ?? choices[0];
  if (style === "family") return choices.find((item) => item.designTendency === "reality") ?? choices[0];
  if (style === "self") return choices.find((item) => item.designTendency === "dream") ?? choices[0];
  return choices.find((item) => item.designTendency === "balance") ?? choices[0];
}

function pickChoice(choices: Choice[], seed: number, step: number, policy: LifePolicy) {
  if (policy === "first") return choices[0];
  if (policy === "last") return choices[choices.length - 1];
  return choices[(seed + step * 17) % choices.length];
}

function stepLife(state: State, seed: number, step: number, policy: LifePolicy, seen: string[]): State {
  if (state.phase === "title") return reducer(state, { type: "begin" });
  if (state.phase === "gender") return reducer(state, { type: "gender", gender: "girl", name: "" });
  if (state.phase === "year") return reducer(state, { type: "toActivities" });
  if (state.phase === "story") return reducer(state, { type: "ack" });
  if (state.phase === "activities") {
    const id = yearOf(state).activities.find((item) => !state.spent.includes(item));
    if (!id) return state;
    return reducer(state, { type: "activity", id });
  }
  if (state.phase === "note" || state.phase === "result") return reducer(state, { type: "ack" });
  if (state.phase === "event" && state.eventId) {
    const choices = choicesFor(state.eventId, state);
    const choice = pickChoice(choices, seed, step, policy);
    if (!choice) return state;
    seen.push(`${state.eventId}:${choice.id}`);
    return reducer(state, { type: "choose", choice });
  }
  if (state.phase === "battle" && state.approach) {
    const spec = battleSpecById(state.battleSpecId);
    const battle = createBattle({
      approach: state.approach,
      hp: spiritHp(state.primary, state.approach === "safe" ? 5 : 0),
      sp: driveSp(state.primary, state.derived.STATE_MOOD),
      stabilize: state.skills.includes(spec.skills.stabilize),
      see: state.techniques.includes(spec.techniques.see),
      ask: state.skills.includes(spec.skills.ask),
      prepared: state.skills.includes(spec.skills.prepared),
      spec,
      mind: state.primary.STAT_MIND,
      gearSpeed: gearSpeed(state.equipped),
      stressResist: gearStressResist(state.equipped),
      attack: gearAttack(state.equipped),
    });
    const kind = resolveAuto(battle);
    return reducer(state, { type: "battleEnd", outcome: { kind, stress: battle.stress, hp: battle.hp } });
  }
  if (state.phase === "battle-result") return reducer(state, { type: "settleBattle" });
  if (state.phase === "repair") return reducer(state, { type: "repair", talk: seed % 2 === 0 });
  if (state.phase === "explore-offer") return reducer(state, { type: "explore", go: (seed + step) % 5 !== 0 });
  if (state.phase === "year-end") return reducer(state, { type: "nextYear" });
  if (state.phase === "fifteen") return reducer(state, { type: "fifteenAct" });
  return state;
}

/** One childhood, from the first year through 1996. Battles use the steady auto policy. */
export function simulateLife(seed: number, policy: LifePolicy = "mix") {
  let state = reducer(freshState(seed), { type: "gender", gender: seed % 2 === 0 ? "girl" : "boy", name: "" });
  const seen: string[] = [];
  let steps = 0;
  while (state.phase !== "ending" && steps < 220) {
    const next = stepLife(state, seed, steps, policy, seen);
    if (next === state) break;
    state = next;
    steps += 1;
  }
  return { phase: state.phase, steps, seen, ended: state.phase === "ending" };
}

/** Five scripted childhoods. This is not a human playtest. It only checks that the years diverge. */
export function runChildhood(style: ChildhoodStyle) {
  let state = reducer(freshState(1), { type: "gender", gender: "girl", name: "" });
  const seen: string[] = [];
  let steps = 0;
  while (state.phase !== "ending" && steps < 260) {
    const year = yearOf(state).year;
    const plan = PLAN[style][year];
    let next = state;
    if (state.phase === "year") next = reducer(state, { type: "toActivities" });
    else if (state.phase === "activities" && plan) {
      const id = plan[state.spent.length];
      next = id ? reducer(state, { type: "activity", id }) : state;
    } else if (state.phase === "event" && state.eventId) {
      const choice = pickStyled(choicesFor(state.eventId, state), state.eventId, style);
      if (choice) {
        seen.push(`${state.eventId}:${choice.id}`);
        next = reducer(state, { type: "choose", choice });
      }
    } else if (state.phase === "explore-offer") next = reducer(state, { type: "explore", go: style !== "family" });
    else if (state.phase === "repair") next = reducer(state, { type: "repair", talk: style === "family" });
    else next = stepLife(state, 1, steps, "first", seen);
    if (next === state) break;
    state = next;
    steps += 1;
  }
  return {
    ended: state.phase === "ending",
    phase: state.phase,
    missed: [...state.missed],
    flags: [...state.flags],
    seen,
  };
}

export function runLives(n = 1000) {
  const policies: LifePolicy[] = ["first", "last", "mix"];
  let ended = 0;
  const stuck: Record<string, number> = {};
  const events = new Set<string>();
  for (let i = 0; i < n; i += 1) {
    const life = simulateLife(i + 1, policies[i % policies.length]);
    if (life.ended) ended += 1;
    else stuck[life.phase] = (stuck[life.phase] ?? 0) + 1;
    for (const id of life.seen) events.add(id.split(":")[0]);
  }
  return { n, ended, stuck, events: [...events].sort(), years: YEARS.length };
}
