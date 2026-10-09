import type { SceneId, State } from "./types";
import { picked } from "./speak";
import { lifeMissed, placeOf } from "./world";
import { knowsKit } from "./freedom";
import { act, narrate, say, type SceneLine } from "./scene";

export type BeatId = "open" | "downstairs" | "sat-night" | "sun-night" | "monday" | "aftermath";

/** One page of the 1985 story. `sequence` is the only text: every entry is drawn, in this order. */
export type StoryPage = { scene: SceneId; kicker: string; title: string; sequence: SceneLine[] };

const BEATS = new Set<BeatId>(["open", "downstairs", "sat-night", "sun-night", "monday", "aftermath"]);

export const BEAT_IDS: readonly BeatId[] = ["open", "downstairs", "sat-night", "sun-night", "monday", "aftermath"];

export function isBeat(value: string | null): value is BeatId {
  return !!value && BEATS.has(value as BeatId);
}

/** What Mom saw on the way up. One sentence about how long he stayed, never two that disagree. */
function missedHeard(state: State): SceneLine {
  const mood = state.npcDays.NPC_FRIEND_01?.mood;
  if (mood === "content") return say("媽媽", "他自己踢波，玩了好久，玩得好起勁。");
  if (mood === "left") return say("媽媽", "他玩了一陣就走了。");
  return say("媽媽", "他玩到天黑，後來坐在石凳上。");
}

function satNight(state: State): SceneLine[] {
  const ball = state.memories.find((item) => item.id === "MEM_RED_BALL");
  const news = state.memories.find((item) => item.id === "MEM_SILENT_NEWS_01" && item.year === 1985);
  const seq: SceneLine[] = [];
  if (ball?.emotion === "share") {
    seq.push(act("你的鞋底有泥。媽媽看了一眼。", "家裡 · 門口"));
    seq.push(say("媽媽", "今日去了平台？"));
    seq.push(narrate("你說跟一個孩子輪流玩球。她說不要出街口。"));
  } else if (ball?.emotion === "hold") {
    seq.push(narrate("你回來的時候還抓著那種不肯放的感覺。"));
    seq.push(narrate("媽媽問你下樓做了什麼。你說球是你先拿到的。她沒有再問。"));
  } else if (ball?.emotion === "leave") {
    seq.push(narrate("你的鞋很乾淨。媽媽問你下樓做了什麼。"));
    seq.push(narrate("你說看了一下就上來。那個人的名字，你沒有說。"));
  } else if (ball?.emotion === "watch") {
    seq.push(narrate("你說自己站著看一個人玩球，沒有伸手。"));
    seq.push(narrate("媽媽說不要搶。她沒有再問那個人叫什麼。"));
  } else if (news?.choiceId === "A") {
    seq.push(narrate("媽媽晚上還是很靜。電視已經關了。她沒有再提街市。"));
  } else if (news?.choiceId === "B") {
    seq.push(narrate("你說你在角落玩。媽媽說街市人很多，拉著她就好。"));
  } else if (news?.choiceId === "C") {
    seq.push(narrate("你還記著那個聲音。媽媽把剩下的菜收進冰箱，沒有再解釋。"));
  } else if (state.spent[0] === "ACT_MARKET") {
    seq.push(narrate("你跟媽媽從街市回來。鞋底還是濕的。"));
  } else if (state.spent[0] === "ACT_DRAW") {
    seq.push(narrate("紙還在桌上。嫲嫲下午坐在廳裡，看過那張紙，沒有收。"));
  } else if (state.spent[0] === "ACT_PLAY") {
    seq.push(narrate("嫲嫲在廳裡坐了一下午。你在旁邊自己玩。她沒有叫你停。"));
  } else {
    seq.push(narrate("你睡了很久。嫲嫲在家，沒有叫你。"));
  }
  if (!ball) {
    const withMom = state.spent[0] === "ACT_MARKET";
    seq.push(act(withMom ? "你們拎著塑膠袋走上來。經過平台的時候，媽媽看了一眼。" : "媽媽拎著塑膠袋走上來。", "屋邨走廊 · 傍晚"));
    seq.push(act("媽媽把塑膠袋放下。", "家裡 · 門口"));
    seq.push(say("媽媽", "樓下那個抱紅波的孩子，今日一個人在平台。"));
    seq.push(act(withMom ? "她把鞋脫在門口。你今天沒有到平台。" : "她把鞋脫在門口。你今天沒有下過樓。"));
    seq.push(missedHeard(state));
  } else if (!news) seq.push(narrate(lifeMissed("NPC_MOM_01", "sat")));
  seq.push(narrate("袋子仍然在門口。明天還不用上學。"));
  return seq;
}

function sunNight(state: State): SceneLine[] {
  const sun = state.spent[1];
  const kit = state.npcDays.NPC_FRIEND_01;
  const waited = state.memories.find((item) => item.id === "MEM_KIT_WAIT");
  let heard = "爸爸把鞋子脫在門口。他說累。他明天還是要上班。";
  if (kit?.nextPlan === "seek") {
    if (waited?.emotion === "meet") heard = "你出去見了他。他說明天學校見。";
    else if (waited?.emotion === "later") heard = "你說今天不行。他沒有再約。";
    else heard = "他來過。你沒有出聲。他走了。";
  } else if (kit?.nextPlan === "return") {
    heard = waited ? "你下去的時候，他已經在玩。他說你昨天沒有下來。" : "平台上那個抱紅球的孩子，今天又去了平台。你不在。他沒有上來找你。";
  } else if (kit?.nextPlan === "avoid") {
    heard = "阿傑今天沒有來。球留在他家。他沒有再約你。";
  } else if (kit?.nextPlan === "withdraw") {
    heard = knowsKit(state) ? "阿傑今天沒有來找你。" : "平台上那個抱紅球的孩子，今天沒有再出現。昨天平台上只有他一個人。";
  } else if (sun === "ACT_ESTATE") heard = `你今天下了樓。下過雨。${lifeMissed("NPC_FRIEND_01", "sun")}`;
  else if (sun === "ACT_MARKET") heard = lifeMissed("NPC_MOM_01", "sun");
  const seq: SceneLine[] = [
    act("媽媽把袋子再放到門口。", "家裡 · 門口"),
    say("媽媽", "明天真的要去。"),
    act("燈還開著。袋子沒有收。", "家裡 · 晚上"),
    narrate(heard),
  ];
  if (!state.memories.some((item) => item.id === "MEM_RED_BALL")) seq.push(narrate("你仍然沒有提過平台上那個孩子。"));
  const grand = state.npcDays.NPC_GRAND_01;
  const away = placeOf(sun ?? "") !== "home";
  seq.push(narrate(grand?.missedPlayer && away ? "嫲嫲昨天一個人坐到湯涼。你還沒有進過那扇門。" : "你還沒有進過那扇門。"));
  return seq;
}

/** 1985 only. The year moves even if the child has not chosen anything yet. */
export function beat1985(id: BeatId, state: State): StoryPage {
  if (id === "open") {
    return {
      scene: "home",
      kicker: "1985 · 早上",
      title: "袋子在門口",
      sequence: [
        act("媽媽把袋子放在門口。", "家裡 · 早上"),
        say("媽媽", "星期一開始上學。"),
        act("爸爸在電視前面穿鞋。", "電視前面"),
        say("爸爸", "我返工了。"),
        say("媽媽", "今晚早點睡。"),
        narrate("你看著那個門口。星期六還沒有過。"),
      ],
    };
  }
  if (id === "downstairs") {
    return {
      scene: "estate",
      kicker: "1985 · 星期六早上",
      title: "樓下",
      sequence: [
        act("你跟媽媽走到樓梯口。", "屋邨走廊"),
        say("媽媽", "不要自己跑出去。"),
        act("平台在下面。有個孩子抱著紅球。", "平台"),
        narrate("他沒有看見你。"),
        narrate("你沒有下去。下午還沒有開始。"),
      ],
    };
  }
  if (id === "sat-night") return { scene: "home", kicker: "1985 · 星期六晚上", title: "燈還開著", sequence: satNight(state) };
  if (id === "sun-night") return { scene: "home", kicker: "1985 · 星期日晚上", title: "明天真的要去", sequence: sunNight(state) };
  if (id === "monday") {
    const ball = state.memories.find((item) => item.id === "MEM_RED_BALL");
    const plan = state.npcDays.NPC_FRIEND_01?.nextPlan;
    const waited = state.memories.find((item) => item.id === "MEM_KIT_WAIT");
    let door = "星期一到了。";
    if (plan === "seek") door = "門裡有人在等。是昨天上來找你的阿傑。";
    else if (plan === "return" && waited?.choiceId === "A") door = "昨天你在平台和阿傑玩過。今天你先找他。";
    else if (plan === "return" && waited) door = "昨天你在平台見過阿傑。今天你先看他在不在。";
    else if (plan === "return") door = "星期六你沒有下去。今天你先看平台那個方向。";
    else if (plan === "avoid") door = "你沒有找人。他昨天沒有再約你。";
    else if (ball?.emotion === "hold") door = "你沒有找人。你記得自己不肯放。";
    return {
      scene: "kindy",
      kicker: "1985 · 星期一早上",
      title: "門開著",
      sequence: [
        act("媽媽牽著你。袋子在你手上，有一點重。", "幼稚園門口"),
        say("媽媽", "到了就進去。"),
        act("幼稚園的門開著。裡面有聲音。", "幼稚園門口"),
        narrate(door),
      ],
    };
  }
  const school = picked(state, "MEM_FIRST_SCHOOL");
  const seq: SceneLine[] = [narrate("晚上。回到家。")];
  if (school.includes("fail") || school.includes("bad")) seq.push(narrate("你沒有進去。媽媽說明天再來。門還會開。"));
  else if (school.startsWith("safe")) seq.push(narrate("媽媽還沒有完全放開你的手。她問你今天怎樣。你沒有說很多。"));
  else if (school.startsWith("curious") || school.startsWith("social")) seq.push(narrate("你自己走近過。媽媽問你今天怎樣。你先點頭。"));
  else seq.push(narrate("你進去了。媽媽問你今天怎樣。"));
  if (state.flags.includes("FLAG_SHARED_BALL") || state.npc.NPC_FRIEND_01.relation >= 5) seq.push(narrate("你提到一個孩子。媽媽記住了那個名字。"));
  else if (state.missed.includes("MISS_85_FRIEND")) seq.push(narrate("你沒有提到平台上的孩子。媽媽也沒有問。"));
  return { scene: "home", kicker: "1985 · 晚上", title: "媽媽問你", sequence: seq };
}
