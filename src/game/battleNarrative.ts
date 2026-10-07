/**
 * Win, fail, and retry sentences. Rules stay in battleSpec.ts.
 * This file may read story helpers. battleSpec.ts must not.
 */
import { battleStory, examStory } from "./content";
import type { Approach, BattleKind, SceneId } from "./types";

export type BattleResultCopy = {
  scene: SceneId;
  kicker: string;
  title: string;
  retryTitle: string;
  retryNote: string;
  continueLabel: string;
  homeLabel: string;
  text: (kind: BattleKind, approach: Approach) => string;
};

export const BATTLE_NARRATIVE: Record<string, BattleResultCopy> = {
  BTL_KINDY_DOOR: {
    scene: "kindy",
    kicker: "1985 · 第一日",
    title: "門口",
    retryTitle: "今天沒進去",
    retryNote: "可以再試一次。再進不去，就回家。幼稚園明天仍然開。",
    continueLabel: "繼續",
    homeLabel: "今天回家",
    text: (kind, approach) => battleStory(kind, approach).text,
  },
  BTL_PRIMARY_EXAM: {
    scene: "study",
    kicker: "1988 · 測驗",
    title: "卷子",
    retryTitle: "這張還沒完",
    retryNote: "可以再寫一次。再寫不完，就交上去。明天還有課。",
    continueLabel: "繼續",
    homeLabel: "先交上去",
    text: (kind) => examStory(kind).text,
  },
};

/** Player-safe. An unknown id still shows the kindergarten sentences, and logs, so a typo is visible. */
export function battleNarrative(id: string | null | undefined): BattleResultCopy {
  if (!id) return BATTLE_NARRATIVE.BTL_KINDY_DOOR;
  const found = BATTLE_NARRATIVE[id];
  if (!found) {
    console.error(`[battle] unknown narrative ${id}; using kindergarten result`);
    return BATTLE_NARRATIVE.BTL_KINDY_DOOR;
  }
  return found;
}
