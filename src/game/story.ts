import type { SceneId, State } from "./types";
import { picked } from "./speak";
import { lifeMissed, placeOf } from "./world";

export type BeatId = "open" | "downstairs" | "sat-night" | "sun-night" | "monday" | "aftermath";

export type Shot = { where: string; action: string; speaker: string; line: string };

const BEATS = new Set<BeatId>(["open", "downstairs", "sat-night", "sun-night", "monday", "aftermath"]);

export function isBeat(value: string | null): value is BeatId {
  return !!value && BEATS.has(value as BeatId);
}

function missedHeard(state: State) {
  const mood = state.npcDays.NPC_FRIEND_01?.mood;
  if (mood === "content") return "他一個人在平台踢波，也玩得很起勁。";
  if (mood === "left") return "他玩了一陣就走了。";
  return "他玩到天黑，後來坐在石凳上。";
}

function satNight(state: State): { lines: string[]; shots: Shot[] } {
  const ball = state.memories.find((item) => item.id === "MEM_RED_BALL");
  const news = state.memories.find((item) => item.id === "MEM_SILENT_NEWS_01" && item.year === 1985);
  const lines: string[] = [];
  const shots: Shot[] = [];
  if (ball?.emotion === "share") {
    lines.push("你的鞋底有泥。媽媽看了一眼。");
    lines.push("「今天去了平台？」你說跟一個孩子輪流玩球。她說不要出街口。");
    shots.push({ where: "家裡 · 門口", action: "你的鞋底有泥。", speaker: "媽媽", line: "今天去了平台？" });
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
  if (!ball) {
    const heard = missedHeard(state);
    lines.push("媽媽把膠袋放下。「今天樓下那個孩子，好像自己玩了很久。」");
    lines.push(`媽媽：「${heard}」`);
    shots.push(
      { where: "屋邨走廊 · 傍晚", action: "媽媽拎著膠袋走上來。", speaker: "媽媽", line: "今天樓下那個孩子，好像自己玩了很久。" },
      { where: "家裡 · 門口", action: "她把鞋脫在門口。你沒有下過樓。", speaker: "媽媽", line: heard },
    );
  } else if (!news) lines.push(lifeMissed("NPC_MOM_01", "sat"));
  lines.push("袋子仍然在門口。明天還不是上學。");
  return { lines, shots };
}

function sunNight(state: State): { lines: string[]; shots: Shot[] } {
  const sun = state.spent[1];
  const kit = state.npcDays.NPC_FRIEND_01;
  const waited = state.memories.find((item) => item.id === "MEM_KIT_WAIT");
  const lines = ["媽媽把袋子再放到門口。"];
  let heard = "爸爸把鞋子脫在門口。他說累。他明天還是要上班。";
  if (kit?.nextPlan === "seek") {
    if (waited?.emotion === "meet") heard = "你出去見了他。他說明天學校見。";
    else if (waited?.emotion === "later") heard = "你說今天不行。他沒有再約。";
    else heard = "他來過。你沒有出聲。他走了。";
  } else if (kit?.nextPlan === "return") {
    heard = waited ? "你下去的時候，他已經在玩。他說你昨天沒有下來。" : "阿傑今天又去了平台。你不在。他沒有上來找你。";
  } else if (kit?.nextPlan === "avoid") {
    heard = "阿傑今天沒有來。球留在他家。他沒有再約你。";
  } else if (kit?.nextPlan === "withdraw") {
    heard = "阿傑今天沒有來找你。昨天平台上只有他一個人。";
  } else if (sun === "ACT_ESTATE") heard = `你今天下了樓。下過雨。${lifeMissed("NPC_FRIEND_01", "sun")}`;
  else if (sun === "ACT_MARKET") heard = lifeMissed("NPC_MOM_01", "sun");
  lines.push(heard);
  if (!state.memories.some((item) => item.id === "MEM_RED_BALL")) lines.push("你仍然沒有提過平台上那個孩子。");
  const grand = state.npcDays.NPC_GRAND_01;
  const away = placeOf(sun ?? "") !== "home";
  lines.push(grand?.missedPlayer && away ? "嫲嫲昨天一個人坐到湯涼。你還沒有進過那扇門。" : "你還沒有進過那扇門。");
  return {
    lines,
    shots: [
      { where: "家裡 · 門口", action: "媽媽把袋子再放到門口。", speaker: "媽媽", line: "明天真的要去。" },
      { where: "家裡 · 晚上", action: "燈還開著。袋子沒有收。", speaker: "", line: heard },
    ],
  };
}

/** 1985 only. The year moves even if the child has not chosen anything yet. */
export function beat1985(id: BeatId, state: State): { scene: SceneId; kicker: string; title: string; lines: string[]; shots: Shot[] } {
  if (id === "open") {
    return {
      scene: "home",
      kicker: "1985 · 早上",
      title: "袋子在門口",
      lines: ["媽媽把袋子放在門口。「明天開始上學。」", "爸爸在電視前面穿鞋。「我去上班。」", "媽媽說：「今晚早點睡。」", "你看著那個門口。星期六還沒有過。"],
      shots: [
        { where: "家裡 · 早上", action: "媽媽把袋子放在門口。", speaker: "媽媽", line: "明天開始上學。" },
        { where: "電視前面", action: "爸爸在穿鞋。", speaker: "爸爸", line: "我去上班。" },
      ],
    };
  }
  if (id === "downstairs") {
    return {
      scene: "estate",
      kicker: "1985 · 星期六早上",
      title: "樓下",
      lines: ["你跟到樓梯口。", "平台在下面。有個孩子抱著紅球。", "你沒有下去。下午還沒有開始。"],
      shots: [
        { where: "屋邨走廊", action: "你跟媽媽走到樓梯口。", speaker: "媽媽", line: "不要自己跑出去。" },
        { where: "平台", action: "下面有個孩子，抱著一個紅球。你還沒有下去。", speaker: "", line: "他沒有看見你。" },
      ],
    };
  }
  if (id === "sat-night") {
    const night = satNight(state);
    return { scene: "home", kicker: "1985 · 星期六晚上", title: "燈還開著", lines: night.lines, shots: night.shots };
  }
  if (id === "sun-night") {
    const night = sunNight(state);
    return { scene: "home", kicker: "1985 · 星期日晚上", title: "明天真的要去", lines: night.lines, shots: night.shots };
  }
  if (id === "monday") {
    const ball = state.memories.find((item) => item.id === "MEM_RED_BALL");
    const plan = state.npcDays.NPC_FRIEND_01?.nextPlan;
    const lines = ["媽媽牽著你。袋子在你手上，有一點重。", "幼稚園的門開著。裡面有聲音。"];
    let door = "這一次不是你按下去才發生。明天已經到了。";
    if (plan === "seek") door = "門裡有人在等。是昨天來找你的那個孩子。";
    else if (plan === "return") door = "你昨天沒有下去。今天你先看平台那個方向。";
    else if (plan === "avoid") door = "你沒有找人。他昨天沒有再約你。";
    else if (ball?.emotion === "hold") door = "你沒有找人。你記得自己不肯放。";
    lines.push(door);
    return {
      scene: "kindy",
      kicker: "1985 · 星期一早上",
      title: "門開著",
      lines,
      shots: [
        { where: "屋邨路", action: "媽媽牽著你。袋子在你手上，有一點重。", speaker: "媽媽", line: "到了就進去。" },
        { where: "幼稚園門口", action: "門開著。裡面有聲音。", speaker: "", line: door },
      ],
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
  return { scene: "home", kicker: "1985 · 晚上", title: "媽媽問你", lines, shots: [] };
}
