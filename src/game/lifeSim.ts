import { resolveAuto } from "./battleBalance";
import { battleSpecById } from "./battleSpec";
import { gearAttack, gearSpeed, gearStressResist } from "./catalog";
import { createBattle } from "./battleSim";
import type { Choice } from "./choice";
import { choicesFor, yearOf, YEARS } from "./content";
import { freshState, reducer } from "./engine";
import { driveSp, spiritHp, type State } from "./types";

export type LifePolicy = "first" | "last" | "mix";

function pickChoice(choices: Choice[], seed: number, step: number, policy: LifePolicy) {
  if (policy === "first") return choices[0];
  if (policy === "last") return choices[choices.length - 1];
  return choices[(seed + step * 17) % choices.length];
}

function stepLife(state: State, seed: number, step: number, policy: LifePolicy, seen: string[]): State {
  if (state.phase === "title") return reducer(state, { type: "begin" });
  if (state.phase === "gender") return reducer(state, { type: "gender", gender: "girl", name: "" });
  if (state.phase === "year") return reducer(state, { type: "toActivities" });
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
  while (state.phase !== "ending" && steps < 160) {
    const next = stepLife(state, seed, steps, policy, seen);
    if (next === state) break;
    state = next;
    steps += 1;
  }
  return { phase: state.phase, steps, seen, ended: state.phase === "ending" };
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
