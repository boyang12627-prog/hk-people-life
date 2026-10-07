import type { SceneId, State } from "./types";
import { picked } from "./speak";
import { lifeMissed } from "./world";

export type BeatId = "open" | "sat-night" | "sun-night" | "monday" | "aftermath";

const BEATS = new Set<BeatId>(["open", "sat-night", "sun-night", "monday", "aftermath"]);

export function isBeat(value: string | null): value is BeatId {
  return !!value && BEATS.has(value as BeatId);
}

function satNight(state: State) {
  const ball = state.memories.find((item) => item.id === "MEM_RED_BALL");
  const news = state.memories.find((item) => item.id === "MEM_SILENT_NEWS_01" && item.year === 1985);
  const lines: string[] = [];
  if (ball?.emotion === "share") {
    lines.push("你的鞋底有泥。媽媽看了一眼。");
    lines.push("「今天去了平台？」你說跟一個孩子輪流玩球。她說不要出街口。");
  } else if (ball?.emotion === "hold") {
    lines.push("你回來的時候還抓著那種不肯放的感覺。");
    lines.push("媽媽問你下樓做了什麼。你說球是你先拿到的。她沒有再問。");
  } else if (ball?.emotion === "leave") {
    lines.push("你的鞋很乾淨。媽媽問你下樓做了什麼。");
    lines.push("你說看了一下就上來。那個人的名字，你沒有說。");
  } else if (ball?.emotion === "watch") {
    lines.push("你說自己站著看一個人玩球，沒有伸手。");
    lines.push("媽媽說不要搶。她沒有再問那個人叫什麼。");
  } else if (news?.choiceId === "A") {
    lines.push("媽媽晚上還是很靜。電視已經關了。她沒有再提街市。");
  } else if (news?.choiceId === "B") {
    lines.push("你說你在角落玩。媽媽說街市人很多，拉著她就好。");
  } else if (news?.choiceId === "C") {
    lines.push("你還記著那個聲音。媽媽把剩下的菜收進雪櫃，沒有再解釋。");
  } else if (state.spent[0] === "ACT_DRAW") {
    lines.push("紙還在桌上。嫲嫲下午坐在廳裡，看過那張紙，沒有收。");
  } else if (state.spent[0] === "ACT_PLAY") {
    lines.push("嫲嫲在廳裡坐了一下午。你在旁邊自己玩。她沒有叫你停。");
  } else {
    lines.push("你睡了很久。嫲嫲在家，沒有叫你。");
  }
  if (!ball) lines.push(lifeMissed("NPC_FRIEND_01", "sat"));
  else if (!news) lines.push(lifeMissed("NPC_MOM_01", "sat"));
  lines.push("袋子仍然在門口。明天還不是上學。");
  return lines;
}

function sunNight(state: State) {
  const sun = state.spent[1];
  const lines = ["媽媽把袋子再放到門口。", "「明天真的要去。」"];
  if (sun === "ACT_ESTATE") lines.push(`你今天下了樓。下過雨。${lifeMissed("NPC_FRIEND_01", "sun")}`);
  else if (sun === "ACT_MARKET") lines.push(lifeMissed("NPC_MOM_01", "sun"));
  else lines.push("爸爸把鞋子脫在門口。他說累。他明天還是要上班。");
  if (!state.memories.some((item) => item.id === "MEM_RED_BALL")) lines.push("你仍然沒有提過平台上那個孩子。");
  lines.push("你還沒有進過那扇門。");
  return lines;
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
    return { scene: "home", kicker: "1985 · 星期六晚上", title: "燈還開著", lines: satNight(state) };
  }
  if (id === "sun-night") {
    return { scene: "home", kicker: "1985 · 星期日晚上", title: "明天真的要去", lines: sunNight(state) };
  }
  if (id === "monday") {
    const ball = state.memories.find((item) => item.id === "MEM_RED_BALL");
    const lines = ["媽媽牽著你。袋子在你手上，有一點重。", "幼稚園的門開著。裡面有聲音。"];
    if (ball?.emotion === "share") lines.push("你先看門裡有沒有昨天那個孩子。");
    else if (ball?.emotion === "hold") lines.push("你沒有找人。你記得自己不肯放。");
    else lines.push("這一次不是你按下去才發生。明天已經到了。");
    return { scene: "kindy", kicker: "1985 · 星期一早上", title: "門開著", lines };
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
