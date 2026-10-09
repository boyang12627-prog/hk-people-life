import type { Approach, Effect, SceneId, Tendency } from "./types";
import type { SceneLine } from "./scene";

export type Choice = {
  id: string;
  label: string;
  /** Content / playtest metadata only. Gameplay never reads this. Dream and Reality numbers are the route. */
  designTendency: Tendency;
  effect: Effect;
  result: string;
  memory?: {
    id: string;
    eventId: string;
    choiceId: string;
    npc: string;
    emotion: string;
    weight: number;
    echo: string;
  };
  battle?: Approach;
  /** Which fight this choice starts. Absent means the kindergarten door. */
  specId?: string;
  repair?: boolean;
};

export type Card = {
  scene: SceneId;
  kicker: string;
  title: string;
  /** Every entry is drawn, in order. Dialogue carries its speaker. */
  sequence: SceneLine[];
};

export function choice(
  id: string,
  label: string,
  tendency: Tendency,
  effect: Effect,
  result: string,
  memory?: Choice["memory"],
  battle?: Approach,
  repair?: boolean,
  specId?: string,
): Choice {
  return { id, label, designTendency: tendency, effect, result, memory, battle, repair, specId };
}

export function mem(
  id: string,
  eventId: string,
  choiceId: string,
  npc: string,
  emotion: string,
  echo: string,
  weight = 1,
): Choice["memory"] {
  return { id, eventId, choiceId, npc, emotion, weight, echo };
}

