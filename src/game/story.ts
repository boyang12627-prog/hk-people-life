import type { SceneId, State } from "./types";
import { picked } from "./speak";

export type BeatId = "open" | "sat-night" | "sun-night" | "monday" | "aftermath";

const BEATS = new Set<BeatId>(["open", "sat-night", "sun-night", "monday", "aftermath"]);

export function isBeat(value: string | null): value is BeatId {
  return !!value && BEATS.has(value as BeatId);
}

/** 1985 only. The year moves even if the child has not chosen anything yet. */
export function beat1985(id: BeatId, state: State): { scene: SceneId; kicker: string; title: string; lines: string[] } {
  if (id === "open") {
    return {
      scene: "home",
      kicker: "1985 · 早上",
      title: "袋子在門口",
      lines: ["媽媽把袋子放在門口。「明天開始上學。」", "爸爸在電視前面穿鞋。「我去上班。」", "媽媽說：「今晚早點睡。」", "你看著那個門口。星期六還沒有過。"],
    };
  }
  if (id === "sat-night") {
    const sat = state.spent[0];
    const line =
      sat === "ACT_MARKET"
        ? "媽媽說：「今天街市走了一趟。」她沒有再解釋你見到誰。"
        : sat === "ACT_ESTATE"
          ? "媽媽問你下樓做了什麼。你說到了平台。她說不要出街口。"
          : sat === "ACT_DRAW"
            ? "紙還在桌上。媽媽看了一眼，沒有收。"
            : sat === "ACT_PLAY"
              ? "媽媽說：「今天你自己玩了一整天。」"
              : "你睡了很久。媽媽沒有叫你。";
    return { scene: "home", kicker: "1985 · 星期六晚上", title: "燈還開著", lines: [line, "袋子仍然在門口。明天還不是上學。"] };
  }
  if (id === "sun-night") {
    return {
      scene: "home",
      kicker: "1985 · 星期日晚上",
      title: "明天真的要去",
      lines: ["媽媽把袋子再放到門口。", "「明天真的要去。」", "你還沒有進過那扇門。"],
    };
  }
  if (id === "monday") {
    return {
      scene: "kindy",
      kicker: "1985 · 星期一早上",
      title: "門開著",
      lines: ["媽媽牽著你。袋子在你手上，有一點重。", "幼稚園的門開著。裡面有聲音。", "這一次不是你按下去才發生。明天已經到了。"],
    };
  }
  const school = picked(state, "MEM_FIRST_SCHOOL");
  const lines = ["晚上。回到家。"];
  if (school.includes("fail") || school.includes("bad")) lines.push("你沒有進去。媽媽說明天再來。門還會開。");
  else if (school.startsWith("safe")) lines.push("媽媽還沒有完全放開你的手。她問你今天怎樣。你沒有說很多。");
  else if (school.startsWith("curious") || school.startsWith("social")) lines.push("你自己走近過。媽媽問你今天怎樣。你先點頭。");
  else lines.push("你進去了。媽媽問你今天怎樣。");
  if (state.flags.includes("FLAG_SHARED_BALL") || state.npc.NPC_FRIEND_01.relation >= 5) lines.push("你提到一個孩子。媽媽記住了那個名字。");
  else if (state.missed.includes("MISS_85_FRIEND")) lines.push("你沒有提到平台上的孩子。媽媽也沒有問。");
  return { scene: "home", kicker: "1985 · 晚上", title: "媽媽問你", lines };
}
