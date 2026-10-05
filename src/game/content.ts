import { grownWord, type Approach, type BattleKind, type Effect, type Gender, type SceneId, type State, type Tendency } from "./types";

export type Choice = {
  id: string;
  label: string;
  tendency: Tendency;
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
  repair?: boolean;
};

export type Card = {
  scene: SceneId;
  kicker: string;
  title: string;
  lines: string[];
};

export const TENDENCY_LABEL: Record<Tendency, string> = {
  dream: "夢想",
  reality: "現實",
  balance: "平衡",
  think: "思索",
};

export const SKILL_NAME: Record<string, string> = {
  SKL_01: "跟著讀",
  SKL_02: "看臉色",
  SKL_03: "畫畫",
  SKL_04: "問問題",
  SKL_05: "輪流玩",
  SKL_06: "陪家人",
  SKL_07: "收拾玩具",
  SKL_08: "幫忙提袋子",
  SKL_09: "自己走",
  SKL_10: "看時間",
  SKL_11: "人情",
  SKL_12: "數數",
};

export const PRIMARY_LABEL = {
  STAT_MIND: "機靈",
  STAT_STR: "力量",
  STAT_GRIT: "毅力",
  STAT_VIT: "體質",
  STAT_SPEECH: "口才",
  STAT_COURAGE: "膽識",
  STAT_FATE: "運氣",
} as const;

export const DERIVED_LABEL = {
  STATE_HEALTH: "健康",
  STATE_MOOD: "心情",
  STATE_STRESS: "壓力",
  VALUE_DREAM: "想做",
  VALUE_REALITY: "要做",
  STATE_PEACE: "心安",
  STATE_FAMILY_HARMONY: "家裡",
  STATE_GLOBAL_NETWORK: "熟人",
  INDEPENDENT_THOUGHT: "自己想",
} as const;

type YearDef = {
  year: number;
  age: number;
  scene: SceneId;
  era: string;
  open: string;
  events: string[];
  dailies: string[];
  activities: string[];
};

export const YEARS: YearDef[] = [
  {
    year: 1984,
    age: 3,
    scene: "home",
    era: "十二月。飯桌那部電視開著。畫面裡很遠的人在握手，大人沒有告訴你那是什麼。",
    open: "你三歲。碗裡有魚。大人低聲說話。",
    events: ["EVT_1984_NEWS_01", "EVT_1984_FAMILY_02"],
    dailies: ["MINI_84_TOY"],
    activities: ["ACT_MARKET", "ACT_PLAY", "ACT_DRAW", "ACT_REST"],
  },
  {
    year: 1985,
    age: 4,
    scene: "kindy",
    era: "大人有時會安靜一下。你知道自己要去幼稚園。",
    open: "你四歲。媽媽說門口有其他小朋友。你還不知道自己進不進得去。",
    events: ["EVT_1985_SCHOOL_01", "EVT_1985_FAMILY_03", "EVT_1985_FRIEND_04"],
    dailies: ["MINI_85_RAIN", "MINI_85_GRANDMA"],
    activities: ["ACT_MARKET", "ACT_PLAY", "ACT_DRAW", "ACT_REST", "ACT_ESTATE"],
  },
  {
    year: 1986,
    age: 5,
    scene: "corridor",
    era: "屋邨還是那樣。十月，電視裡有個戴帽子的女人下船。",
    open: "你五歲。爸爸說：「女皇來了。」你不知道女皇是誰。你也開始明白，大人不是不想陪你，是他們也有必須做的事。",
    events: ["EVT_1986_SKILL_05", "EVT_1986_FAMILY_06", "EVT_1986_MARKET_07", "EVT_1986_ECHO_08"],
    dailies: ["MINI_86_ESTATE", "MINI_86_TV", "MINI_86_HELP"],
    activities: ["ACT_MARKET", "ACT_PLAY", "ACT_DRAW", "ACT_REST", "ACT_ESTATE"],
  },
];

export const ACTIVITIES: Record<string, { id: string; label: string; detail: string; blurb: string; scene: SceneId; effect: Effect }> = {
  ACT_MARKET: {
    id: "ACT_MARKET",
    label: "陪媽媽去街市",
    detail: "跟著出門買菜。慢，但你會見到街坊。",
    blurb: "你拉著媽媽。那天地面很濕，魚檔的水滲進鞋子。阿姨開始認得你。",
    scene: "market",
    effect: { counter: { REL_LOCAL_MARKET: 5, NPC_MOM_STRESS: -3, MIND_PROGRESS: 1 }, derived: { STATE_MOOD: 2, VALUE_REALITY: 1 }, npc: { NPC_MOM_01: { trust: 1 } } },
  },
  ACT_PLAY: {
    id: "ACT_PLAY",
    label: "自己玩",
    detail: "留在家裡，和玩具過一個下午。",
    blurb: "你自己玩了一整個下午。沒有人叫你，你也玩得下去。",
    scene: "home",
    effect: { derived: { STATE_MOOD: 3, VALUE_DREAM: 1, STATE_FAMILY_HARMONY: -4 }, primary: { STAT_GRIT: 1 } },
  },
  ACT_DRAW: {
    id: "ACT_DRAW",
    label: "塗鴉",
    detail: "用鉛筆把紙填滿。",
    blurb: "你把紙塗滿。大人說你亂畫，你覺得已經畫完。",
    scene: "home",
    effect: { derived: { VALUE_DREAM: 2, STATE_MOOD: 1, INDEPENDENT_THOUGHT: 2, STATE_FAMILY_HARMONY: -3 }, counter: { ART_PROGRESS: 1 }, primary: { STAT_MIND: 1 } },
  },
  ACT_REST: {
    id: "ACT_REST",
    label: "休息",
    detail: "睡覺、發呆，不必趕著做完。",
    blurb: "你什麼都沒做。睡了一陣，沒那麼累。",
    scene: "home",
    effect: { derived: { STATE_STRESS: -6, STATE_PEACE: 2, STATE_MOOD: 1 }, counter: { NPC_MOM_STRESS: -4 } },
  },
  ACT_ESTATE: {
    id: "ACT_ESTATE",
    label: "去平台",
    detail: "下樓。可以去平台，不要出街口。",
    blurb: "平台有其他孩子。你沒有出到街上，不過你離開了家門。",
    scene: "estate",
    effect: { counter: { COUNTER_EXPLORE: 1 }, derived: { STATE_MOOD: 2, STATE_STRESS: 1 }, primary: { STAT_VIT: 1 } },
  },
};

const EVENT_SCENE: Record<string, SceneId> = {
  EVT_1984_NEWS_01: "home",
  EVT_1984_FAMILY_02: "home",
  MINI_84_TOY: "market",
  EVT_1985_SCHOOL_01: "kindy",
  MINI_85_RAIN: "home",
  MINI_85_GRANDMA: "home",
  EVT_1985_FAMILY_03: "home",
  EVT_1985_FRIEND_04: "kindy",
  EVT_1986_SKILL_05: "kindy",
  MINI_86_ESTATE: "estate",
  MINI_86_TV: "home",
  MINI_86_HELP: "corridor",
  EVT_1986_FAMILY_06: "home",
  EVT_1986_MARKET_07: "market",
  EVT_1986_ECHO_08: "estate",
};

export function yearOf(state: Pick<State, "yearIndex">) {
  return YEARS[state.yearIndex] ?? YEARS[0];
}

export function buildQueue(yearIndex: number, seed: number) {
  const year = YEARS[yearIndex];
  const daily = year.dailies[Math.abs(seed + year.year) % year.dailies.length];
  const events = [...year.events];
  events.splice(1, 0, daily);
  return events;
}

export function sceneFor(id: string | null, fallback: SceneId): SceneId {
  if (id && EVENT_SCENE[id]) return EVENT_SCENE[id];
  return fallback;
}

export function variantOf(id: string, state: State) {
  if (id === "EVT_1984_NEWS_01") return newsCold(state) ? "cold" : "harmony";
  if (id === "EVT_1984_FAMILY_02") return state.counter.NPC_MOM_STRESS < 20 ? "low_pressure" : "tired";
  if (id === "EVT_1985_FAMILY_03") return heardNews(state) ? "heard" : "plain";
  if (id === "EVT_1985_FRIEND_04") return state.npc.NPC_FRIEND_01.available ? "known" : "stranger";
  if (id === "EVT_1986_SKILL_05") return state.derived.INDEPENDENT_THOUGHT >= 50 ? "reflective" : "plain";
  if (id === "EVT_1986_MARKET_07") return state.counter.REL_LOCAL_MARKET < 20 ? "first_meet" : "familiar";
  return "base";
}

/** Memory is the fact. The heard-flag is only an index written by A/B. */
export function heardNews(state: State) {
  const id = state.memories.find((item) => item.id === "MEM_NEWS_01")?.choiceId;
  return id === "A" || id === "B";
}

/** Harmony under 40, or both afternoons spent on yourself before the table. */
export function newsCold(state: State) {
  if (state.derived.STATE_FAMILY_HARMONY < 40) return true;
  return state.spent.includes("ACT_PLAY") && state.spent.includes("ACT_DRAW");
}

function gapLine(state: State, dream: string, reality: string) {
  const gap = state.derived.VALUE_DREAM - state.derived.VALUE_REALITY;
  if (gap >= 8) return dream;
  if (gap <= -8) return reality;
  return "";
}

function picked(state: State, id: string) {
  return state.memories.find((item) => item.id === id)?.choiceId ?? "";
}

export function cardFor(id: string, state: State): Card {
  const gender = state.gender ?? "girl";
  const grown = grownWord(gender);
  switch (id) {
    case "MINI_84_TOY":
      return {
        scene: "market",
        kicker: "日常 · 1984",
        title: "士多有一輛新車",
        lines: ["玻璃櫃裡有一輛新車。你沒有零用錢。", "媽媽已經走開兩步。"],
      };
    case "MINI_85_RAIN":
      return {
        scene: "home",
        kicker: "日常 · 1985",
        title: "下大雨",
        lines: ["下大雨，平台去不了。", "外面一片白，看不見對面。屋裡只有一部風扇和你。"],
      };
    case "MINI_85_GRANDMA":
      return {
        scene: "home",
        kicker: "日常 · 1985",
        title: "嫲嫲揭開煲蓋",
        lines: ["湯很香。嫲嫲說，以前這棟樓要自己走樓梯。", "碗很熱，你用手托住。"],
      };
    case "MINI_86_ESTATE":
      return {
        scene: "estate",
        kicker: "日常 · 1986",
        title: "平台有人叫你",
        lines: ["有個孩子在平台揮手。你未必認識他。", "媽媽在樓上晾衣服，還沒叫你回去。"],
      };
    case "MINI_86_TV":
      return {
        scene: "home",
        kicker: "日常 · 1986",
        title: "電視又開著",
        lines: ["飯還沒吃完。電視裡有人唱歌，有人說話。", "爸爸還沒出聲叫你轉台。"],
      };
    case "MINI_86_HELP":
      return {
        scene: "corridor",
        kicker: "日常 · 1986",
        title: "塑膠袋太重",
        lines: ["媽媽兩隻手都提著袋子。走廊的燈黃黃的。", "她沒有叫你，但她走得很慢。"],
      };
    case "EVT_1984_NEWS_01": {
      const cold = newsCold(state);
      const lines = cold
        ? ["電視聲很大，蓋過吃飯的聲音。媽媽沒有夾魚給你。", "畫面裡有人握手。沒有人告訴你那是誰。", "沒有人向你解釋。你聽得出他們說得很認真。"]
        : [
            "電視裡講著很遠的事。你只知道今天有魚。",
            "畫面裡有人握手。你不知道他們是誰。",
            "媽媽：「先吃飯。這麼遠的事，等一下再說。」",
            "爸爸低聲說：「最要緊是一家人安穩。」",
          ];
      if (cold && state.spent.includes("ACT_PLAY") && state.spent.includes("ACT_DRAW")) {
        lines.push("你玩了一整個下午。吃飯時才見到他們。");
      }
      const lean = gapLine(state, "你今天用了一個下午做自己想做的事。碗遲一點才到你面前。", "你跟著人做該做的事。碗就在你面前。");
      if (!cold && lean) lines.push(lean);
      return { scene: "home", kicker: "1984 · 飯桌", title: "將來", lines };
    }
    case "EVT_1984_FAMILY_02":
      return {
        scene: "home",
        kicker: "1984 · 收工",
        title: state.counter.NPC_MOM_STRESS < 20 ? "媽媽今天早了" : "媽媽今天很累",
        lines:
          state.counter.NPC_MOM_STRESS < 20
            ? ["媽媽今天早收工。地上有玩具，她還有力氣對你笑。", "「再玩一會兒，我們一起收，好不好？」"]
            : ["媽媽還沒脫鞋就坐下了。", "「等一下。媽媽今天真的很累。」", "地上還有你沒有收的玩具。"],
      };
    case "EVT_1985_SCHOOL_01": {
      const mom = picked(state, "MEM_MOM_TIRED");
      const lines = [
        "老師蹲下來：「不用怕，進去和其他小朋友玩。你跟著我讀兩個字就行。」",
        `媽媽：「${gender === "boy" ? "他" : "她"}平時很乖，只是怕生。」`,
        "你看見一個孩子手上拿著紅球。",
      ];
      if (mom === "A") lines.splice(1, 0, "媽媽站得很近。去年你收過玩具，今天她仍然陪你走到門口。");
      if (mom === "B") lines.splice(1, 0, "你想抓緊她。去年你鬧過。她的手今天還在。");
      if (mom === "C") lines.splice(1, 0, "你沒有出聲。去年你也是坐在她旁邊。");
      if (state.counter.NPC_MOM_STRESS >= 26) lines.push("媽媽今天話很少。你知道她還沒鬆下來。");
      else if (state.counter.NPC_MOM_STRESS < 20) lines.push("媽媽走得慢，還有力氣跟你說門口有人。");
      const lean = gapLine(state, "你想自己走進去，多過想有人帶你。", "你想有人講清楚，才肯進去。");
      if (lean) lines.push(lean);
      return { scene: "kindy", kicker: "1985 · 第一日", title: "幼稚園門口", lines };
    }
    case "EVT_1985_FAMILY_03": {
      const news = picked(state, "MEM_NEWS_01");
      const lines = ["你四歲，不懂說這些。你只知道新聞完了，家裡很靜。", "電視有人說「九七」。你不知道那是兩個數字，還是一件事。", "爸爸把甜品推過來：「沒事，吃甜品。」", "媽媽沒有笑，只是把電視聲調小。"];
      if (news === "A") lines.unshift("你記得去年也是這樣靜。你站過去聽過電視。");
      else if (news === "B") lines.unshift("爸爸看你一眼。去年你問過「將來」。他好像記得。");
      else if (news === "C") lines.unshift("去年你選了繼續吃飯。今年你也懂得自己吃甜品。");
      else lines.push("你沒聽過他們談將來，所以你不知道他們在安靜什麼。");
      return { scene: "home", kicker: "1985 · 新聞之後", title: "家裡很靜", lines };
    }
    case "EVT_1985_FRIEND_04": {
      const school = picked(state, "MEM_FIRST_SCHOOL");
      const lines = state.npc.NPC_FRIEND_01.available
        ? ["課室有個紅球。阿傑抱住不放。", "阿傑：「這個球是我先拿到的！」", "你也想碰。老師走開了。"]
        : ["有個孩子抱住紅球，你還不正式認識他。他叫阿傑。", "阿傑：「這個球是我先拿到的！」", "老師走開了。"];
      if (school.includes("fail") || school.includes("bad") || state.flags.includes("FLAG_RETRY_SCHOOL")) lines.unshift("你上次沒進到課室。今天球仍然在。");
      else if (school.startsWith("safe")) lines.unshift("你上次拉著媽媽。今天球在你前面。");
      else if (!state.flags.includes("FLAG_FIRST_SCHOOL")) lines.unshift("你還沒正式進過課室。這個球你沒玩過。");
      return { scene: "kindy", kicker: "1985 · 課室", title: "紅波", lines };
    }
    case "EVT_1986_SKILL_05": {
      const lines = [
        "老師：「這孩子常常畫畫，可以參加小組。」",
        "爸爸：「多學點數數才實際。」",
        `媽媽看著你：「你自己想怎樣，${grown}？」`,
      ];
      const mom = picked(state, "MEM_MOM_TIRED");
      if (mom === "A") lines.push("媽媽沒有幫你選。去年你自己收過玩具。");
      if (state.flags.includes("FLAG_PARENT_EXPLAIN")) lines.push("爸爸解釋過一次將來。今天他想你選實際的。");
      const news = picked(state, "MEM_NEWS_01");
      if (news === "A") lines.push("去年你站過去聽。今天你也是聽完才選。");
      if (news === "C") lines.push("去年「九七」你沒有問。今天新事物擺在面前，你也不急著選。");
      if (state.flags.includes("FLAG_AVOID_CONFLICT")) lines.push("你上次走開了。今天這個位子仍然是你自己坐。");
      if (state.flags.includes("FLAG_CURIOUS_SCHOOL")) lines.push("你第一天自己走近那個球。老師記得。");
      if (state.derived.INDEPENDENT_THOUGHT >= 50) lines.push("你還沒問出口，已經自己想了兩句。沒有人聽見。");
      if (state.skills.includes("SKL_05")) lines.push("你懂得輪流玩。阿傑在，你可以叫他一組。");
      const extra: string[] = [];
      if (state.flags.includes("FLAG_TOY_MONOPOLY") || state.npc.NPC_FRIEND_01.trust < 0) extra.push("阿傑坐得很遠。紅球不在你的桌子上。");
      else if (state.flags.includes("FLAG_SHARED_BALL") || state.npc.NPC_FRIEND_01.trust >= 5) extra.push("阿傑招你過去坐。");
      else if (!state.npc.NPC_FRIEND_01.available) extra.push("你和阿傑還不算認識。課室只有你自己的位子。");
      if (state.counter.ART_PROGRESS >= 2) extra.push("老師：「不是今天才畫的。家裡的紙上也是顏色。」");
      else if (state.counter.MIND_PROGRESS >= 2) extra.push("老師：「這孩子會跟著數到十。」");
      const lean = gapLine(state, "你看著顏色，多過數字。", "你先聽到爸爸說的。你知道「實際」兩個字。");
      if (lean) extra.push(lean);
      if (state.npc.NPC_TEACH_01.trust >= 35) extra.push("老師記得你自己走進課室。");
      else if (state.flags.includes("FLAG_TEACHER_SLOW")) extra.push("老師說得很慢，等你跟上。");
      lines.push(...extra.slice(0, 2));
      return { scene: "kindy", kicker: "1986 · 第一次選", title: "畫畫，還是數數？", lines };
    }
    case "EVT_1986_FAMILY_06": {
      const lines = ["本來約好去公園。", "爸爸不是不想去。他的外套摺好，跟著又拆開。", "「下個星期日可能要上班。」他靜了一陣：「下次吧。」"];
      const mom = picked(state, "MEM_MOM_TIRED");
      if (mom === "A") lines.push("你想起媽媽累的那天。今天是爸爸。");
      if (mom === "C") lines.push("你懂得坐過去。去年你也是這樣坐。");
      if (state.flags.includes("FLAG_FAMILY_NEWS_SILENCE")) lines.push("新聞之後沒有人出聲，你認得。");
      if (state.counter.WORLD_DAD_WORK_OCCURRENCES >= 2) lines.unshift("這不是第一次。外套摺好又拆開，你見過。");
      else if (state.counter.NPC_MOM_STRESS >= 26) lines.push("媽媽沒有出聲幫你。她自己也還沒鬆下來。");
      else if (state.counter.NPC_MOM_STRESS < 20) lines.push("媽媽看你一眼，低聲說：「下星期也可以。」");
      return { scene: "home", kicker: "1986 · 星期日", title: "爸爸說要上班", lines };
    }
    case "EVT_1986_MARKET_07": {
      const lines =
        state.counter.REL_LOCAL_MARKET < 20
          ? ["你跟著媽媽站了很久。這檔你還不熟。", "阿姨和媽媽說話，然後多塞一條菜進袋子。", "沒有人向你解釋，也沒有多收一毫子。"]
          : [`阿姨：「又是你呀？${grown}了，長大了。」`, "媽媽：「謝謝。」", "阿姨偷偷多塞一條菜進袋子。沒有人提錢。"];
      if (state.skills.includes("SKL_03") || state.counter.ART_PROGRESS >= 3) lines.push("你手指上有顏色。阿姨問你畫過這條菜沒有。");
      else if (state.skills.includes("SKL_12") || state.counter.MIND_PROGRESS >= 3) lines.push("阿姨：「你會數嗎？幫我數三條。」你數到了。");
      else if (state.skills.includes("SKL_10")) lines.push("你看一看，兩邊檔都想看。時間不夠。");
      if (state.personalityTags.includes("TAG_RESPONSIBILITY") || state.primary.STAT_STR >= 6) lines.push("你的手自己伸出去接袋子。");
      if (state.flags.includes("FLAG_HELPED_MOM_01")) lines.push("媽媽不用叫你。去年你自己收過玩具。");
      if (
        state.flags.includes("FLAG_FIRST_INTEREST_CHOICE") &&
        !state.skills.includes("SKL_03") &&
        !state.skills.includes("SKL_12") &&
        !state.skills.includes("SKL_10")
      ) {
        lines.push("你問過為什麼一定要選。今天沒有人逼你選。");
      }
      return { scene: "market", kicker: "1986 · 街市", title: "多一條菜", lines };
    }
    case "EVT_1986_ECHO_08": {
      const lines = ["你已經下過平台幾次。今天你站到屋邨門口。", "外面比走廊亮。你其實只是想自己多走兩步。", "媽媽在後面。她還沒出聲，但你知道她看著。"];
      if (state.skills.includes("SKL_06")) lines.push("你懂得陪家人。媽媽在後面，你可以走回去。");
      if (state.skills.includes("SKL_08")) lines.push("袋子你提慣了。自己多走兩步，沒有那麼重。");
      if (state.skills.includes("SKL_11")) lines.push("你懂得問人情。今天這條路，沒有人向你收錢。");
      const news = picked(state, "MEM_NEWS_01");
      const dad = picked(state, "MEM_DAD_WORK");
      const extra: string[] = [];
      if (news === "C") extra.push("去年你跟著吃飯。今天這條路，沒有人推你。");
      if (news === "B") extra.push("你想再問一句。你問過一次將來。");
      if (state.counter.WORLD_DAD_WORK_OCCURRENCES >= 2) extra.push("爸爸今天又不在。家裡又靜下來。");
      if (dad === "A") extra.push("你自己去玩過。約定裂開過，今天他仍然不在。");
      else if (dad === "B") extra.push("你答應過他去上班。今天公園還是去不成。");
      else if (dad === "C") extra.push("你留過。今天你自己走，也記得那時候。");
      if (state.flags.includes("FLAG_DAD_WILL_COMPENSATE")) extra.push("他說遲些會補。今天這條路，他不在。");
      if (state.flags.includes("FLAG_FAVOUR_QUESTION")) lines.push("你問過一份好意是不是要還。今天這條路，沒有人向你收錢。");
      if (state.flags.includes("FLAG_MARKET_KINDNESS")) lines.push("阿姨塞過一條菜。外面沒有人伸手向你要錢。");
      if (state.npc.NPC_MOM_01.trust >= 75) extra.push("媽媽的手伸在你後面，還沒拉你。");
      else if (state.npc.NPC_MOM_01.trust <= 65) extra.push("媽媽站得遠。她一出聲你就聽到。");
      if (state.primary.STAT_FATE >= 6) extra.push("你踏出去的那一下，她遲了半秒才叫你。");
      lines.push(...extra.slice(0, 3));
      return { scene: "estate", kicker: "1986 · 屋邨門口", title: "如果我自己走呢", lines };
    }
    default:
      return { scene: "home", kicker: "日常", title: "一個下午", lines: ["這個下午就這樣過了。"] };
  }
}

export function choicesFor(id: string, state: State): Choice[] {
  const heard = heardNews(state);
  switch (id) {
    case "MINI_84_TOY":
      return [
        choice("A", "拉住媽媽要看", "dream", { derived: { STATE_MOOD: 2 }, npc: { NPC_MOM_01: { trust: -1 } } }, "你拉住她。媽媽歎了口氣，讓你看十秒。「看完要走。」"),
        choice("B", "自己看完就走", "think", { derived: { INDEPENDENT_THOUGHT: 1, STATE_MOOD: 1 } }, "你看清楚那輛車，然後自己追上去。沒有人買。你記得那個樣子。"),
        choice("C", "不看，跟著走", "reality", { derived: { VALUE_REALITY: 1, STATE_FAMILY_HARMONY: 1, STATE_MOOD: -1 } }, "你跟著走。車留在櫃裡。媽媽沒發現你停過。"),
      ];
    case "MINI_85_RAIN":
      return [
        choice("A", "畫畫", "dream", { derived: { VALUE_DREAM: 2, STATE_MOOD: 1 }, counter: { ART_PROGRESS: 1 } }, "雨下得很大。你把紙塗到邊上都有顏色。"),
        choice("B", "聽收音機", "think", { derived: { VALUE_REALITY: 1, INDEPENDENT_THOUGHT: 1, STATE_PEACE: 1 }, counter: { MIND_PROGRESS: 1 } }, "收音機轉台，有人講，有人唱。你不明白，但你聽著。你記住那個節奏。"),
        choice("C", "睡一陣", "balance", { derived: { STATE_STRESS: -4, STATE_PEACE: 2, STATE_MOOD: 1 } }, "你睡了。雨聲遠了。這個下午沒有什麼趕著要做。"),
      ];
    case "MINI_85_GRANDMA":
      return [
        choice("A", "聽她講", "reality", { npc: { NPC_GRAND_01: { trust: 3, relation: 2 } }, derived: { INDEPENDENT_THOUGHT: 1 } }, "你聽。你不知道全部，但你知道這棟樓以前更難走。"),
        choice("B", "走去玩", "dream", { derived: { STATE_MOOD: 2 }, npc: { NPC_GRAND_01: { relation: -1 } } }, "你留下碗湯，走到玩具那裡。嫲嫲沒有叫你回來。"),
        choice("C", "問為什麼要走樓梯", "think", { derived: { INDEPENDENT_THOUGHT: 2 }, npc: { NPC_GRAND_01: { trust: 2 } } }, "嫲嫲笑：「因為那時候沒有這些按鈕。」你記住「以前」兩個字。"),
      ];
    case "MINI_86_ESTATE":
      return [
        choice("A", "揮回去", "dream", { derived: { STATE_MOOD: 2, VALUE_DREAM: 1 } }, "你揮回去。你還不知道他的名字，但你應了他。"),
        choice("B", "站到一邊看", "think", { derived: { INDEPENDENT_THOUGHT: 1, STATE_PEACE: 1 } }, "你看別人怎麼玩。你還沒加入，但你記住怎麼玩。"),
        choice("C", "上去找媽媽", "reality", { derived: { STATE_FAMILY_HARMONY: 2, STATE_MOOD: -1 } }, "你走回樓上。媽媽的衣服還沒乾。你站在她旁邊。"),
      ];
    case "MINI_86_TV":
      return [
        choice("A", "再看一會兒", "dream", { derived: { STATE_MOOD: 2, VALUE_DREAM: 1 } }, "你看。唱歌比新聞容易聽。飯涼得慢。"),
        choice("B", "吃完再看", "reality", { derived: { VALUE_REALITY: 1, STATE_FAMILY_HARMONY: 1 } }, "你扒飯。電視繼續播。你選了碗先。"),
        choice("C", "問他們在看什麼", "think", { derived: { INDEPENDENT_THOUGHT: 1 }, primary: { STAT_SPEECH: 1 } }, "爸爸答得很短：「唱歌。」你知道不只是唱歌，但你問過。"),
      ];
    case "MINI_86_HELP":
      return [
        choice("A", "伸手托住一袋", "reality", { derived: { STATE_FAMILY_HARMONY: 2, VALUE_REALITY: 1 }, primary: { STAT_STR: 1 }, tags: ["TAG_RESPONSIBILITY"] }, "袋帶勒手。媽媽看你一眼，沒有講大道理。"),
        choice("B", "先跑去開門", "balance", { derived: { STATE_FAMILY_HARMONY: 1, VALUE_DREAM: 1, STATE_STRESS: 1 } }, "你跑去按燈。袋子仍然是她提。你只是開了門。"),
        choice("C", "當作沒看見", "dream", { derived: { STATE_MOOD: 1, STATE_FAMILY_HARMONY: -1 } }, "你看著牆上那幅畫。媽媽自己把袋子放下。她沒有罵你。"),
      ];
    case "EVT_1984_NEWS_01":
      return [
        choice(
          "A",
          "站過去聽清楚",
          "think",
          { derived: { STATE_MOOD: 1, INDEPENDENT_THOUGHT: 1 }, flags: ["FLAG_HEARD_ADULT_FUTURE"], skills: ["SKL_02"] },
          "你看著那道光。你不知道「將來」是什麼，但你知道大人今晚很認真。你開始懂得看人臉色。",
          mem("MEM_NEWS_01", "EVT_1984_NEWS_01", "A", "NPC_DAD_01", "curious", "十年後，電視又開著。你還會停下來，聽大人沒說完的那句。", 2),
        ),
        choice(
          "B",
          "將來是什麼？",
          "dream",
          {
            primary: { STAT_SPEECH: 1 },
            derived: { STATE_FAMILY_HARMONY: 1 },
            flags: ["FLAG_HEARD_ADULT_FUTURE", "FLAG_PARENT_EXPLAIN"],
            skills: ["SKL_04"],
          },
          "爸爸頓了頓。「將來就是你長大以後。」他沒有說下去。媽媽把魚夾給你。你學會把問題問出口。",
          mem("MEM_NEWS_01", "EVT_1984_NEWS_01", "B", "NPC_DAD_01", "asking", "十年後，有人提起前途，你會先開口問，而不是等。", 2),
        ),
        choice(
          "C",
          "繼續吃飯",
          "reality",
          {
            derived: { VALUE_REALITY: 1, STATE_PEACE: 1 },
            tags: ["TAG_NEWS_ENGAGEMENT_LOW"],
          },
          "你扒飯。電視仍然響，但你顧著吃飯。你不是以後都聽不到。",
          mem("MEM_NEWS_01", "EVT_1984_NEWS_01", "C", "NPC_MOM_01", "steady", "十年後，飯桌仍然是你最安穩的位子。新聞響著，你也吃得下。"),
        ),
      ];
    case "EVT_1984_FAMILY_02":
      return [
        choice(
          "A",
          "自己收玩具",
          "reality",
          {
            derived: { STATE_FAMILY_HARMONY: 4, VALUE_REALITY: 1 },
            primary: { STAT_STR: 1, STAT_GRIT: 1 },
            npc: { NPC_MOM_01: { trust: 5 } },
            flags: ["FLAG_HELPED_MOM_01"],
            tags: ["TAG_RESPONSIBILITY"],
            skills: ["SKL_07"],
          },
          "你蹲下來，把車仔推進盒子。你本來想玩。媽媽透了口氣。你懂得自己收拾玩具。",
          mem("MEM_MOM_TIRED", "EVT_1984_FAMILY_02", "A", "NPC_MOM_01", "duty", "你見到累的人，手會自己去收拾。", 2),
        ),
        choice(
          "B",
          "鬧著要她陪",
          "dream",
          { derived: { STATE_MOOD: 2, STATE_FAMILY_HARMONY: -2 }, counter: { NPC_MOM_STRESS: 3 }, npc: { NPC_MOM_01: { trust: -6 } } },
          "你扯住她的衣袖。媽媽閉上眼，仍然抱了你一陣。之後她更靜。",
          mem("MEM_MOM_TIRED", "EVT_1984_FAMILY_02", "B", "NPC_MOM_01", "want", "你仍然會想有人陪。想完，有時會有一點內疚。", 2),
        ),
        choice(
          "C",
          "坐在旁邊陪她",
          "balance",
          {
            derived: { STATE_FAMILY_HARMONY: 3, VALUE_DREAM: 1 },
            npc: { NPC_MOM_01: { trust: 5 } },
            tags: ["TAG_EMPATHY"],
          },
          "你坐上地毯，沒有叫她做事。媽媽摸了你的頭一下，就收回手。你沒有學到新東西，但你在。",
          mem("MEM_MOM_TIRED", "EVT_1984_FAMILY_02", "C", "NPC_MOM_01", "beside", "你懂得坐在人旁邊，不必說很多。"),
        ),
      ];
    case "EVT_1985_SCHOOL_01":
      return [
        choice(
          "A",
          "跟人打個招呼",
          "dream",
          {
            primary: { STAT_SPEECH: 1 },
            npc: { NPC_FRIEND_01: { relation: 4, trust: 2, available: true }, NPC_TEACH_01: { available: true, relation: 2 } },
            flags: ["FLAG_FIRST_SCHOOL"],
            skills: ["SKL_01"],
          },
          "你開了口。球還在別人手上，但有人看過你。",
          undefined,
          "social",
        ),
        choice(
          "B",
          "拉住媽媽的手",
          "reality",
          {
            derived: { STATE_PEACE: 2, STATE_FAMILY_HARMONY: 2 },
            npc: { NPC_TEACH_01: { available: true } },
            flags: ["FLAG_FIRST_SCHOOL", "FLAG_TEACHER_SLOW"],
            skills: ["SKL_01"],
          },
          "你還沒走。媽媽的手還在你這裡。老師記住你慢熱。你跟著老師讀了兩個字。",
          undefined,
          "safe",
        ),
        choice(
          "C",
          "自己走去看紅球",
          "think",
          {
            derived: { VALUE_DREAM: 2 },
            npc: { NPC_FRIEND_01: { relation: 1 }, NPC_TEACH_01: { available: true } },
            flags: ["FLAG_FIRST_SCHOOL", "FLAG_CURIOUS_SCHOOL"],
          },
          "你沒有打招呼，也還沒跟著老師讀。你走近那個球。課室吵了一點。",
          undefined,
          "curious",
        ),
      ];
    case "EVT_1985_FAMILY_03":
      return [
        choice(
          "A",
          "你們是不是不開心？",
          "think",
          { flags: ["FLAG_FAMILY_NEWS_SILENCE"], tags: ["TAG_EMPATHY"], derived: { STATE_FAMILY_HARMONY: 3 } },
          heard
            ? "媽媽看爸爸一眼。「我們剛才談過將來。大人有時也會擔心。你先吃甜品。」"
            : "媽媽看爸爸一眼。「大人有時也會擔心。你先吃甜品。」她沒有再解釋。",
          mem("MEM_SILENT_NEWS_01", "EVT_1985_FAMILY_03", "A", "NPC_MOM_01", "empathy", "你後來看得出，靜有時是擔心，不是沒事。", 2),
        ),
        choice(
          "B",
          "自己去玩",
          "dream",
          { derived: { VALUE_DREAM: 1, STATE_PEACE: 1 }, flags: ["FLAG_FAMILY_NEWS_SILENCE"] },
          "你走到角落玩。大人在那裡不出聲。",
          mem("MEM_SILENT_NEWS_01", "EVT_1985_FAMILY_03", "B", "NPC_DAD_01", "aside", "吵的時候，你懂得自己找一個角落。"),
        ),
        choice(
          "C",
          "接著再看一會兒",
          "balance",
          { derived: { INDEPENDENT_THOUGHT: 2, STATE_STRESS: 1 }, flags: ["FLAG_FAMILY_NEWS_SILENCE"] },
          "你坐下，跟著那個聲音聽。你不明白，但你記住節奏。頭有一點緊。",
          mem("MEM_SILENT_NEWS_01", "EVT_1985_FAMILY_03", "C", "NPC_DAD_01", "watch", "你會想多知道一句。多知道一句，有時會累。"),
        ),
      ];
    case "EVT_1985_FRIEND_04":
      return [
        choice(
          "A",
          "這個球我要先玩",
          "dream",
          {
            primary: { STAT_COURAGE: 1 },
            npc: { NPC_FRIEND_01: { relation: -3, trust: -5 } },
            flags: ["FLAG_TOY_MONOPOLY"],
          },
          "你搶到球。阿傑站到一邊。你玩得盡興，但他好一陣都沒再叫你。",
          mem("MEM_RED_BALL", "EVT_1985_FRIEND_04", "A", "NPC_FRIEND_01", "hold", "你記得那個紅球。你記得自己曾經不肯放。", 2),
        ),
        choice(
          "B",
          "一起玩，輪流來",
          "balance",
          {
            derived: { VALUE_DREAM: 1, VALUE_REALITY: 1 },
            primary: { STAT_FATE: 1 },
            npc: { NPC_FRIEND_01: { relation: 5, trust: 5, available: true } },
            flags: ["FLAG_SHARED_BALL"],
            skills: ["SKL_05"],
          },
          "你把球推回給他，再等自己那一輪。你不再一個人霸住球。阿傑開始叫你的名字。",
          mem("MEM_RED_BALL", "EVT_1985_FRIEND_04", "B", "NPC_FRIEND_01", "share", "你後來會說「輪流」。有時你會捨不得，但你會說。", 2),
        ),
        choice(
          "C",
          "走開，不要吵",
          "reality",
          { derived: { STATE_PEACE: 1 }, flags: ["FLAG_AVOID_CONFLICT"] },
          "你走開。球留在他那裡。課室靜了一點，你和他都還不熟。",
          mem("MEM_RED_BALL", "EVT_1985_FRIEND_04", "C", "NPC_FRIEND_01", "leave", "你避開爭執。避開之後，有時位子已經有人站了。"),
        ),
      ];
    case "EVT_1986_SKILL_05": {
      const list: Choice[] = [
        choice(
          "A",
          "我想畫畫",
          "dream",
          {
            derived: { VALUE_DREAM: 5, STATE_PEACE: 4 },
            counter: { ART_PROGRESS: 3, MIND_PROGRESS: -1 },
            flags: ["FLAG_FIRST_INTEREST_CHOICE"],
            skills: ["SKL_03"],
          },
          "你選了顏色。數數那一組今天沒有你。紙填滿了，你的心定下來。",
          mem("MEM_FIRST_INTEREST", "EVT_1986_SKILL_05", "A", "NPC_TEACH_01", "art", "你手上還有顏色。數字不是你的第一眼。", 2),
        ),
        choice(
          "B",
          "我想學數數",
          "reality",
          {
            derived: { VALUE_REALITY: 5, STATE_PEACE: 3 },
            counter: { MIND_PROGRESS: 3, ART_PROGRESS: -1 },
            flags: ["FLAG_FIRST_INTEREST_CHOICE"],
            skills: ["SKL_12"],
          },
          "你跟著數。畫畫小組今天過了你。你數得明白，心定下來。",
          mem("MEM_FIRST_INTEREST", "EVT_1986_SKILL_05", "B", "NPC_DAD_01", "count", "你會先數清楚，再決定畫不畫。", 2),
        ),
        choice(
          "C",
          "兩樣都試一下",
          "balance",
          {
            derived: { VALUE_DREAM: 2, VALUE_REALITY: 2, STATE_STRESS: 3 },
            counter: { ART_PROGRESS: 2, MIND_PROGRESS: 2 },
            flags: ["FLAG_FIRST_INTEREST_CHOICE"],
            skills: ["SKL_10"],
          },
          "你想兩邊都試。時間不夠。兩邊都做了一點，但都沒做完，肩膀有點緊。你開始懂得看鐘。",
          mem("MEM_FIRST_INTEREST", "EVT_1986_SKILL_05", "C", "NPC_TEACH_01", "split", "你想兩邊都要。有時兩邊都只做到一半。"),
        ),
        choice(
          "D",
          state.derived.INDEPENDENT_THOUGHT < 30 ? "你有個奇怪的問題想問" : "為什麼一定要選一樣？",
          "think",
          state.derived.INDEPENDENT_THOUGHT < 30
            ? { derived: { INDEPENDENT_THOUGHT: 1, STATE_STRESS: 1 }, flags: ["FLAG_FIRST_INTEREST_CHOICE"] }
            : { derived: { INDEPENDENT_THOUGHT: 3 }, primary: { STAT_SPEECH: 1 }, flags: ["FLAG_FIRST_INTEREST_CHOICE"] },
          state.derived.INDEPENDENT_THOUGHT >= 50
            ? "你問得很清楚。沒有人立刻答到。老師多看了你一眼。你今天沒有練成畫畫，也沒有練成數數。你記得自己問過。"
            : state.derived.INDEPENDENT_THOUGHT < 30
              ? "你問得不清楚。沒有人立刻答到。你心裡緊了一點，但你仍然問過。"
              : "你問為什麼一定要選一樣。沒有人立刻答到。你今天沒有練成畫畫，也沒有練成數數。",
          mem("MEM_FIRST_INTEREST", "EVT_1986_SKILL_05", "D", "NPC_MOM_01", "ask", "你會先問為什麼一定要選。", 2),
        ),
      ];
      if (state.skills.includes("SKL_05")) {
        list.push(
          choice(
            "E",
            "同阿傑一組",
            "balance",
            {
              npc: { NPC_FRIEND_01: { relation: 3, trust: 2 } },
              derived: { STATE_MOOD: 1 },
              flags: ["FLAG_FIRST_INTEREST_CHOICE"],
            },
            "你叫阿傑一組。畫畫和數數，你都還沒自己選。你懂得等人，輪流來。",
            mem("MEM_FIRST_INTEREST", "EVT_1986_SKILL_05", "E", "NPC_FRIEND_01", "share", "你叫過阿傑一組。你還沒自己選畫畫還是數數。", 2),
          ),
        );
      }
      return list;
    }
    case "EVT_1986_FAMILY_06":
      return [
        choice(
          "A",
          "我自己去玩",
          "dream",
          {
            derived: { STATE_MOOD: 2, STATE_FAMILY_HARMONY: -3 },
            npc: { NPC_DAD_01: { relation: -2 } },
            flags: ["FLAG_DAD_OVERTIME_MEMORY", "FLAG_DAD_WILL_COMPENSATE"],
          },
          "你自己去玩。開心了一點，但約定裂了。爸爸看著你，說遲些會補，今天補不到。",
          mem("MEM_DAD_WORK", "EVT_1986_FAMILY_06", "A", "NPC_DAD_01", "crack", "你記得公園去不成。你自己玩了，約定裂了。", 2),
        ),
        choice(
          "B",
          "知道了，你去上班",
          "reality",
          { derived: { VALUE_REALITY: 2, STATE_FAMILY_HARMONY: 1 }, npc: { NPC_DAD_01: { trust: 2 } }, flags: ["FLAG_DAD_OVERTIME_MEMORY"] },
          "你答應了他。公園取消。你明白他要上班，不過是你自己說出口。",
          mem("MEM_DAD_WORK", "EVT_1986_FAMILY_06", "B", "NPC_DAD_01", "accept", "你會說「知道了」。知道，不等於不想去。"),
        ),
        choice(
          "C",
          "那就留在家裡",
          "balance",
          {
            derived: { STATE_FAMILY_HARMONY: 4, VALUE_DREAM: 1 },
            npc: { NPC_DAD_01: { relation: 3 } },
            flags: ["FLAG_DAD_OVERTIME_MEMORY"],
            skills: ["SKL_06"],
          },
          "公園不去了。你們留在家裡。出街沒有你的份，但他出門之前，有他陪。",
          mem("MEM_DAD_WORK", "EVT_1986_FAMILY_06", "C", "NPC_DAD_01", "stay", "公園取消，你也懂得留下來陪人。", 2),
        ),
      ];
    case "EVT_1986_MARKET_07":
      return [
        choice(
          "A",
          "跟阿姨說謝謝",
          "dream",
          { derived: { STATE_GLOBAL_NETWORK: 2, STATE_MOOD: 1 }, flags: ["FLAG_MARKET_KINDNESS"] },
          "你說了謝謝。沒有人塞錢給你。阿姨笑，下次會再認得你。",
          mem("MEM_MARKET_01", "EVT_1986_MARKET_07", "A", "NPC_AUNT_01", "thanks", "你記得一條不用錢的菜。你記得自己說過謝謝。"),
        ),
        choice(
          "B",
          "為什麼要多給？",
          "think",
          {
            derived: { INDEPENDENT_THOUGHT: 1 },
            primary: { STAT_SPEECH: 1 },
            flags: ["FLAG_FAVOUR_QUESTION"],
            skills: ["SKL_11"],
          },
          state.primary.STAT_SPEECH >= 6
            ? "阿姨頓了頓：「街坊就是這樣，不必立刻還。」你問到一句實在的回答。你記住，人情不是一筆數。"
            : "阿姨笑了，沒有答實。你沒有多認識到人。你記住，人情是不是一定要還。",
          mem("MEM_MARKET_01", "EVT_1986_MARKET_07", "B", "NPC_AUNT_01", "question", "你會問，一份好意是不是一定要還。", 2),
        ),
        choice(
          "C",
          "幫媽媽提起袋子",
          "reality",
          {
            derived: { STATE_FAMILY_HARMONY: 2 },
            flags: ["FLAG_MARKET_KINDNESS"],
            tags: ["TAG_RESPONSIBILITY"],
            skills: ["SKL_08"],
          },
          "你接過袋子。你少了自己走開看檔的時間。媽媽的手空出來。",
          mem("MEM_MARKET_01", "EVT_1986_MARKET_07", "C", "NPC_MOM_01", "carry", "你見到重的袋子，手會自己伸出去。"),
        ),
      ];
    case "EVT_1986_ECHO_08": {
      const company = state.skills.includes("SKL_06");
      const carry = state.skills.includes("SKL_08");
      const favour = state.skills.includes("SKL_11");
      return [
        choice(
          "A",
          "回去拉住媽媽",
          "reality",
          company
            ? { derived: { VALUE_REALITY: 1, STATE_FAMILY_HARMONY: 4 }, flags: ["FLAG_FIRST_INDEPENDENCE"] }
            : { derived: { VALUE_REALITY: 1, STATE_FAMILY_HARMONY: 2 }, flags: ["FLAG_FIRST_INDEPENDENCE"] },
          company
            ? "你回去拉住她。你懂得陪家人，不必說很多。屋邨門口留在後面。你今天沒試，但你知道路在那裡。"
            : "你回去拉住她。屋邨門口留在後面。你今天沒試，但你知道路在那裡。",
          mem("MEM_FIRST_INDEPENDENCE", "EVT_1986_ECHO_08", "A", "NPC_MOM_01", "return", "你記得屋邨門口。你選了回去拉住那個人。"),
        ),
        choice(
          "B",
          "走到門口就停",
          "balance",
          favour
            ? { derived: { VALUE_DREAM: 2, VALUE_REALITY: 1, STATE_PEACE: 2 }, primary: { STAT_COURAGE: 1 }, flags: ["FLAG_FIRST_INDEPENDENCE"] }
            : { derived: { VALUE_DREAM: 2, VALUE_REALITY: 1 }, primary: { STAT_COURAGE: 1 }, flags: ["FLAG_FIRST_INDEPENDENCE"] },
          favour
            ? "你走到門口，自己停下。你懂得問人情，今天沒有人追你還。外面很亮，你看不到盡頭。你還沒踏出去。"
            : "你走到門口，自己停下。外面很亮，你看不到盡頭。你還沒踏出去。",
          mem("MEM_FIRST_INDEPENDENCE", "EVT_1986_ECHO_08", "B", "NPC_MOM_01", "edge", "你懂得走到門口，然後自己停。", 2),
          undefined,
          true,
        ),
        choice(
          "C",
          "踏出屋邨門口一步",
          "dream",
          {
            derived: { VALUE_DREAM: 5, STATE_FAMILY_HARMONY: -2, STATE_STRESS: carry ? 1 : 2 },
            primary: { STAT_COURAGE: 2 },
            flags: ["FLAG_FIRST_INDEPENDENCE"],
            skills: ["SKL_09"],
          },
          carry
            ? "袋子你提慣了，踏出來沒有那麼重。你踏出屋邨門口一步。媽媽立刻叫你回去。「不准走出那條街。」你沒有走到馬路，也沒有受傷。回到家，她罵了你。你記住自己走過的那一步。"
            : "你踏出屋邨門口一步。媽媽立刻叫你回去。「不准走出那條街。」你沒有走到馬路，也沒有受傷。回到家，她罵了你。你記住自己走過的那一步。",
          mem("MEM_FIRST_INDEPENDENCE", "EVT_1986_ECHO_08", "C", "NPC_MOM_01", "risk", "你記得自己踏出過一步。也記得被人叫回去。", 3),
        ),
      ];
    }
    default:
      return [];
  }
}

function choice(
  id: string,
  label: string,
  tendency: Tendency,
  effect: Effect,
  result: string,
  memory?: Choice["memory"],
  battle?: Approach,
  repair?: boolean,
): Choice {
  return { id, label, tendency, effect, result, memory, battle, repair };
}

function mem(
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

export function battleStory(kind: BattleKind, approach: Approach) {
  const approachLine =
    approach === "social" ? "你本來已經打過招呼。" : approach === "safe" ? "你本來拉著媽媽。" : "你本來走近那個紅球。";
  if (kind === "perfect") {
    return {
      text: `${approachLine}接著你自己走進課室。媽媽站在門口，你沒有回頭。`,
      echo: "十年後你仍然記得，你是自己走進去的。",
      emotion: "steady",
      weight: 2,
      effect: {
        npc: { NPC_TEACH_01: { trust: 5 } },
        derived: { STATE_FAMILY_HARMONY: 4 },
      } as Effect,
    };
  }
  if (kind === "win") {
    return {
      text: `${approachLine}你進去了，但你拉著媽媽很久。老師等你。`,
      echo: "十年後你記得門口。你進去了，但你拉著一個人很久。",
      emotion: "cling",
      weight: 1,
      effect: { derived: { STATE_FAMILY_HARMONY: 2, STATE_STRESS: 2 } } as Effect,
    };
  }
  if (kind === "bad") {
    return {
      text: `${approachLine}你喘不過氣，媽媽帶你回家。老師記住你慢熱。你沒有受傷，只是今天去不了。`,
      echo: "十年後你記得那天太吵。你回了家，幼稚園第二天仍然在。",
      emotion: "overwhelm",
      weight: 2,
      effect: {
        derived: { STATE_FAMILY_HARMONY: -1, STATE_STRESS: 5, STATE_MOOD: -4, STATE_HEALTH: -3 },
        flags: ["FLAG_RETRY_SCHOOL", "FLAG_TEACHER_SLOW"],
      } as Effect,
    };
  }
  return {
    text: `${approachLine}你哭了，媽媽帶你回家。今天沒進去。幼稚園明天仍然開。`,
    echo: "十年後你記得自己哭過。你後來仍然要回學校。",
    emotion: "cry",
    weight: 1,
    effect: {
      derived: { STATE_FAMILY_HARMONY: -1, STATE_STRESS: 5 },
      flags: ["FLAG_RETRY_SCHOOL"],
    } as Effect,
  };
}

export function yearLean(dream: number, reality: number) {
  const gap = dream - reality;
  if (gap >= 8) return "這一年，你似乎越來越想自己決定。";
  if (gap <= -8) return "這一年，你似乎越來越先做該做的事。";
  return "這一年，想做的和該做的，你還沒分出哪一樣先。";
}

export function orientationLine(dream: number, reality: number) {
  const gap = dream - reality;
  if (gap >= 8) return "過了這幾年，你似乎越來越想自己決定。";
  if (gap <= -8) return "過了這幾年，你似乎越來越先做該做的事。";
  return "過了這幾年，想做的和該做的，你還沒分出哪一樣先。";
}

export function fifteenLines(state: State) {
  const lines = ["家裡的電視還開著。", "你第一次自己回家。媽媽問你幾點回來。", "你沒有再解釋那麼多。"];
  if (state.skills.includes("SKL_09")) lines.splice(2, 0, "這條路你小時候自己走過。現在沒有人拉著你。");
  lines.push(...thirdHop(state));
  lines.push("原來你小時候那些選擇，沒有消失。");
  return lines;
}

function thirdHop(state: State) {
  const lines: string[] = [];
  const news = picked(state, "MEM_NEWS_01");
  if (news === "B") lines.push("有人提起前途。你自己先開口問。");
  else if (news === "A") lines.push("電視又開著。你會停下來，聽大人沒說完的那句。");
  else if (news === "C" || state.personalityTags.includes("TAG_NEWS_ENGAGEMENT_LOW")) lines.push("新聞響著，你也不急著問。你小時候也是顧著吃飯。");
  const mom = picked(state, "MEM_MOM_TIRED");
  if (mom === "A") lines.push("媽媽問你吃了沒有。你的手自己伸出去。");
  else if (mom === "C") lines.push("媽媽坐在那裡。你坐過去，沒有問很多。");
  else if (mom === "B") lines.push("你還是想有人陪。想完，你懂得自己把話收回來。");
  const ball = picked(state, "MEM_RED_BALL");
  if (ball === "B") lines.push("朋友叫你。你會說輪流，不會一個人霸住。");
  else if (ball === "A") lines.push("你記得自己霸過那個球。今天你不再搶先。");
  else if (ball === "C") lines.push("有人叫你。你站了一陣才走過去。");
  const dad = picked(state, "MEM_DAD_WORK");
  if (dad === "B") lines.push("爸爸又說要上班。你應了一聲，沒有再問整個下午。");
  else if (dad === "A") lines.push("那個約定你小時候裂開過。今天你自己走，不必等人。");
  else if (dad === "C") lines.push("爸爸留不住。你懂得坐下來等，不必立刻走。");
  const market = picked(state, "MEM_MARKET_01");
  if (market === "B") lines.push("有人幫你。你還是會問，一份好意是不是一定要還。");
  else if (market === "A") lines.push("街坊多給過你。你現在也會說謝謝。");
  if (state.flags.includes("FLAG_CURIOUS_SCHOOL")) lines.push("你小時候自己走近過。現在回學校，你不必再拉著人。");
  else if (state.flags.includes("FLAG_FAMILY_NEWS_SILENCE") && picked(state, "MEM_SILENT_NEWS_01") === "A") lines.push("家裡靜過。你現在也明白，靜有時是擔心。");
  return lines.slice(0, 3);
}

const RECALL: Record<string, Record<string, string>> = {
  MEM_NEWS_01: {
    A: "你站過去聽過電視。你還不明白，但你聽過。",
    B: "你問過將來是什麼。爸爸答到一半就停了。",
    C: "你選了繼續吃飯。將來那兩個字，你留給大人。",
  },
  MEM_MOM_TIRED: {
    A: "媽媽累的那天，你收了玩具。",
    B: "你鬧著要媽媽陪。她已經很累，你還是要。",
    C: "你沒有玩，只是坐在媽媽旁邊。",
  },
  MEM_SILENT_NEWS_01: {
    A: "你問過，為什麼新聞完了沒有人出聲。",
    B: "家裡靜了。你自己去玩。",
    C: "你接著看了一會兒，雖然你還不明白。",
  },
  MEM_RED_BALL: {
    A: "紅球你不肯放。阿傑之後沒再叫你。",
    B: "你和阿傑輪流玩。你不再一個人霸住球。",
    C: "你走開。球留在別人那裡。",
  },
  MEM_FIRST_INTEREST: {
    A: "你選了畫畫。數數那一組沒有你。",
    B: "你選了數數。畫畫今天過了你。",
    C: "你兩樣都想要。兩邊都只做到一半。",
    D: "你問為什麼一定要選一樣。你記得自己問過。",
    E: "你叫過阿傑一組。你還沒自己選畫畫還是數數。",
  },
  MEM_DAD_WORK: {
    A: "公園去不成。你自己去玩，約定裂了。",
    B: "你說過「知道了」。公園仍然取消。",
    C: "公園取消。你留下來和他一起。",
  },
  MEM_MARKET_01: {
    A: "你跟阿姨說過謝謝。沒有人塞錢給你。",
    B: "你問過，一份好意是不是一定要還。",
    C: "你幫媽媽提過袋子。你少了自己走開的時間。",
  },
  MEM_FIRST_INDEPENDENCE: {
    A: "屋邨門口，你回去拉住人。",
    B: "你走到門口，然後自己停。",
    C: "你踏出過一步。媽媽叫你回去，你沒有走到馬路。",
    skip: "你本來可以再下平台。你選了留在家裡。",
  },
};

export function recallLine(memory: { id: string; choiceId: string; echo: string }) {
  if (memory.id === "MEM_FIRST_SCHOOL") {
    if (memory.choiceId.includes("perfect")) return "你自己走進過課室。";
    if (memory.choiceId.includes("win")) return "你進去了，但你拉著媽媽很久。";
    if (memory.choiceId.includes("bad")) return "那天太吵。你回了家，第二天再試。";
    return "你哭過。幼稚園第二天仍然在。";
  }
  return RECALL[memory.id]?.[memory.choiceId] ?? memory.echo;
}

const VOICE_BIT: Record<string, Record<string, string>> = {
  MEM_NEWS_01: {
    A: "三歲你站過去聽電視",
    B: "三歲你問過將來",
    C: "三歲你選了繼續吃飯",
  },
  MEM_MOM_TIRED: {
    A: "媽媽累的那天你收了玩具",
    B: "你鬧著要媽媽陪",
    C: "你坐在媽媽旁邊",
  },
  MEM_SILENT_NEWS_01: {
    A: "你問過為什麼家裡那麼靜",
    B: "家裡靜了，你自己去玩",
    C: "你接著看了一會兒",
  },
  MEM_RED_BALL: {
    A: "紅球你不肯放",
    B: "你和阿傑輪流玩",
    C: "你走開，球留在別人那裡",
  },
  MEM_FIRST_INTEREST: {
    A: "五歲你選了畫畫",
    B: "五歲你選了數數",
    C: "五歲你兩樣都想要，兩邊都沒做完",
    D: "五歲你問為什麼一定要選",
    E: "五歲你叫阿傑一組",
  },
  MEM_DAD_WORK: {
    A: "公園去不成，你自己去玩",
    B: "你說過「知道了」",
    C: "公園取消，你留下來和他一起",
  },
  MEM_MARKET_01: {
    A: "你跟阿姨說過謝謝",
    B: "你問過一份好意是不是一定要還",
    C: "你幫媽媽提過袋子",
  },
  MEM_FIRST_INDEPENDENCE: {
    A: "屋邨門口你回去拉住人",
    B: "你走到門口就自己停",
    C: "你踏出過屋邨門口一步，然後被人叫回去",
    skip: "你本來可以再下平台，你選了留在家裡",
  },
};

function voiceBit(memory: { id: string; choiceId: string }) {
  if (memory.id === "MEM_FIRST_SCHOOL") {
    if (memory.choiceId.includes("perfect")) return "你自己走進過課室";
    if (memory.choiceId.includes("win")) return "你進去了，但你拉著媽媽很久";
    if (memory.choiceId.includes("bad")) return "那天太吵，你回了家";
    return "你哭過，幼稚園第二天仍然在";
  }
  return VOICE_BIT[memory.id]?.[memory.choiceId] ?? "";
}

function bestOf(entries: { item: { id: string; weight?: number; year?: number }; bit: string }[]) {
  return [...entries].sort((a, b) => {
    const byWeight = (b.item.weight ?? 1) - (a.item.weight ?? 1);
    if (byWeight !== 0) return byWeight;
    return (a.item.year ?? 0) - (b.item.year ?? 0);
  })[0];
}

export function lifeVoice(memories: { id: string; choiceId: string; weight?: number; year?: number }[], name = "") {
  const usable = memories.map((item) => ({ item, bit: voiceBit(item) })).filter((entry) => entry.bit);
  const used = new Set<string>();
  const picked = [];
  for (const year of [1984, 1985, 1986]) {
    const entry = bestOf(usable.filter((item) => item.item.year === year && !used.has(item.item.id)));
    if (!entry) continue;
    used.add(entry.item.id);
    picked.push(entry);
  }
  const global = bestOf(usable.filter((item) => !used.has(item.item.id)));
  if (global) picked.push(global);
  picked.sort((a, b) => (a.item.year ?? 0) - (b.item.year ?? 0));
  const who = name.trim() ? name.trim() : "你";
  if (picked.length === 0) return `十年後，飯桌仍然在。${who}選過的事，會自己再出現。`;
  return `十年後有人提起${who}小時候：${picked.map((entry) => entry.bit).join("，")}。所以${who}才會變成今天這樣。`;
}
