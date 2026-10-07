/**
 * P2 decision: one battle engine, many specs.
 * A new fight changes numbers, hints, scene, and which skills open buttons.
 * Write a second engine only when the rules themselves are different.
 * Costs stay in BATTLE_COST. Effects stay shared until a fight needs its own numbers.
 * This file does not copy the cost table.
 */
import type { Approach, SceneId } from "./types";

export type BattleAxis = "attack" | "defense" | "speed" | "stressResist" | "technique";

export type Threat = { stress: number; hp: number; heavy: boolean; hint: string; landed: string };

/** What each step sounds like. How many steps the fight lasts lives on the spec. */
export type EnemyPattern = {
  id: string;
  threatFor: (round: number) => Threat;
};

export type ActionLine = {
  label: string;
  detail: string;
  hint: string;
  weakDetail?: string;
  weakHint?: string;
};

const HEAVY = new Set([2, 4, 6, 7]);
const LIGHT: Threat = { stress: 8, hp: 5, heavy: false, hint: "有人拉你的衣袖。聲音不大，但在拉。", landed: "有人拉住你的衣袖。" };

/** Loud on 2, 4, 6, and 7. Step 8 is the lit door; KINDY_DOOR.maxRounds must stay 8. */
export const KINDY_SEPARATION: EnemyPattern = {
  id: "ENEMY_SEPARATION_ANXIETY",
  threatFor: (round) => {
    if (round === 8) return { stress: 6, hp: 5, heavy: false, hint: "門口有光。再走一步就進去。", landed: "光線亮了一點。你停了一下。" };
    if (HEAVY.has(round)) return { stress: 18, hp: 8, heavy: true, hint: "下一聲會很大。有人快要哭出來。", landed: "那一聲很大。你退後半步。" };
    return LIGHT;
  },
};

const EXAM_HEAVY = new Set([3, 5, 7, 9]);

/** Time pressure and a stuck question. Step 10 is the five-minute call; PRIMARY_EXAM.maxRounds must stay 10. */
export const PRIMARY_EXAM_PRESSURE: EnemyPattern = {
  id: "ENEMY_TIME_AND_CARELESS",
  threatFor: (round) => {
    if (round === 10) return { stress: 14, hp: 8, heavy: true, hint: "老師說：「還有五分鐘。」", landed: "收卷的聲音近了。" };
    if (EXAM_HEAVY.has(round)) return { stress: 16, hp: 7, heavy: true, hint: "有兩題你不會做。", landed: "這題卡住。你多看了一眼時鐘。" };
    return { stress: 7, hp: 4, heavy: false, hint: "筆尖沙沙響。時間慢慢過。", landed: "筆尖停了一下。" };
  },
};

export type BattleSpec = {
  id: string;
  scene: SceneId;
  /** Shown beside the step count. Not a scene caption. */
  label: string;
  goalLabel: string;
  /** Name of the line that already happened, under 剛才. */
  hitLabel: string;
  /**
   * Which skill unlocks a shared action. The names are the action's job, not the skill's nickname.
   * stabilize lowers the opening stress. prepared makes read stronger. see and ask only open those buttons.
   */
  skills: { stabilize: string; see: string; ask: string; prepared: string };
  /** Which technique sits on the shared "see" button. The component does not name techniques itself. */
  techniques: { see: string };
  /** Playtest skip settles as a normal entry, never a perfect. */
  skipKind: "win";
  maxRounds: number;
  startGoal: number;
  /** Pressure side's speed. Compared with the child's battle speed. Not a damage number. */
  pressureSpeed: number;
  /**
   * Which words this fight uses. Kindergarten is speed and stress resist, not a hit-point boss.
   * Attack and defense exist for a later fight. This doorway does not read them.
   */
  axes: readonly BattleAxis[];
  /** Catalog fight. Numbers are shared with other specs. Do not gate on this. */
  gated: boolean;
  enemyPattern: EnemyPattern;
  voice: {
    walk: ActionLine;
    guard: ActionLine;
    read: ActionLine;
    see: ActionLine;
    ask: ActionLine;
    braced: string;
    dodged: string;
    froze: string;
    broke: string;
    noteReady: string;
    noteWeak: string;
    note: string;
    openings: Record<Approach, string>;
    entered: string;
    back: string;
    skip: string;
    auto: string;
    skipButton: string;
    autoButton: string;
  };
};

export const KINDY_DOOR: BattleSpec = {
  id: "BTL_KINDY_DOOR",
  scene: "kindy",
  label: "門口的聲音",
  goalLabel: "入到課室",
  hitLabel: "門口",
  skills: { stabilize: "SKL_07", see: "SKL_02", ask: "SKL_04", prepared: "SKL_01" },
  techniques: { see: "TECH_READ_FACE" },
  skipKind: "win",
  maxRounds: 8,
  startGoal: 12,
  pressureSpeed: 5,
  axes: ["speed", "stressResist"],
  gated: true,
  enemyPattern: KINDY_SEPARATION,
  voice: {
    walk: { label: "向前行", detail: "不耗氣力，走近一步", hint: "你向前走一步。" },
    guard: { label: "停下呼吸", detail: "這一聲小一半", hint: "你停下呼吸。" },
    read: {
      label: "跟著讀",
      detail: "你跟得熟",
      weakDetail: "還沒跟熟",
      hint: "你跟著老師教過的字。聲音細，但你有聲音。",
      weakHint: "你還沒跟熟。只出到半個字，聲音小了一點。",
    },
    see: { label: "看臉色", detail: "避開下一聲", hint: "你看一看。下一聲，你會避開。" },
    ask: { label: "問問題", detail: "走近少少", hint: "你問了一句。課室近了。" },
    braced: "你擋住了。聲音小了一半。",
    dodged: "你看得出哪一下會撞過來，避開了。",
    froze: "你站著。那一聲還是來了。",
    broke: "氣力不夠。可以向前走，或者先停下。",
    noteReady: "你懂得跟著讀。跟著讀，壓力會落得多一些。",
    noteWeak: "你還沒跟熟。跟著讀也可以，但聲音很細。",
    note: "先看這一聲大不大，再決定走還是停。今天進不去，可以再試，不會結束。",
    openings: {
      safe: "你仍然抓著媽媽。開頭沒有那麼害怕。",
      curious: "你看著課室。裡面很吵，壓力大一些。",
      social: "媽媽鬆開手。你開過口，現在要自己走過去。",
    },
    entered: "你進去了。",
    back: "你回到門口。",
    skip: "你沒有打完。你還是進去了。",
    auto: "你跟著走完這段路。",
    skipButton: "跳過，算進去了",
    autoButton: "自動走進去",
  },
};

/**
 * Primary-school test. One short year, 1988.
 * Victory is still the paper, not a person.
 * pressureSpeed 10: a mind of 5 is exactly five behind, so pressure moves first.
 * One point of speed (the plastic watch) steps off that line. firstGap stays 5, so this is not "你先".
 * Attack, if the pen is in the bag, only finishes more of the paper per stroke.
 */
export const PRIMARY_EXAM: BattleSpec = {
  id: "BTL_PRIMARY_EXAM",
  scene: "study",
  label: "書桌前的時間",
  goalLabel: "做完這張卷",
  hitLabel: "試卷",
  skills: { stabilize: "SKL_07", see: "SKL_13", ask: "SKL_04", prepared: "SKL_01" },
  techniques: { see: "TECH_SPLIT_QUESTION" },
  skipKind: "win",
  maxRounds: 10,
  startGoal: 8,
  pressureSpeed: 10,
  axes: ["speed", "attack", "technique"],
  gated: false,
  enemyPattern: PRIMARY_EXAM_PRESSURE,
  voice: {
    walk: { label: "落筆", detail: "不耗氣力，做下一題", hint: "你做下一題。" },
    guard: { label: "停一停", detail: "這一分鐘沒那麼趕", hint: "你停一停。" },
    read: {
      label: "想起默過的",
      detail: "你默過，寫得比較穩",
      weakDetail: "你還沒默過",
      hint: "你想起默書那陣。這題沒有那麼陌生。",
      weakHint: "你還沒默過。只是再讀一次題目。",
    },
    see: { label: "先看哪題", detail: "這題可以放後", hint: "你先看哪題可以放後。" },
    ask: { label: "分配時間", detail: "不是問老師", hint: "你把剩下的時間分了一下。" },
    braced: "你停住。這一分鐘沒有那麼趕。",
    dodged: "這題先放下。你去做會的。",
    froze: "你握著筆。時間還是在走。",
    broke: "氣力不夠。可以落筆，或者先停一停。",
    noteReady: "你默過。想起默過的，壓力會落得多一些。",
    noteWeak: "你還沒默過。重看一次也可以，但幫助很小。",
    note: "先看這一題難不難，再決定做還是停。今天做不完，可以再試。",
    openings: {
      safe: "你看過一次範圍。開頭沒有那麼慌。",
      curious: "你先翻到最後一頁。題很多，壓力大一些。",
      social: "旁邊有人已經在寫。你要自己落筆。",
    },
    entered: "你交了卷。",
    back: "你沒有做完。",
    skip: "你沒有做完。卷子還是交了。",
    auto: "你自己做到收卷。",
    skipButton: "跳過，算交了卷",
    autoButton: "自動做完",
  },
};

export const BATTLE_SPECS = [KINDY_DOOR, PRIMARY_EXAM];

export function battleSpecFor(eventId: string | null) {
  if (eventId === "EVT_1988_EXAM_01") return PRIMARY_EXAM;
  return KINDY_DOOR;
}
