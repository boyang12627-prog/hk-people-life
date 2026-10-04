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
  think: "諗",
};

export const SKILL_NAME: Record<string, string> = {
  SKL_01: "跟讀",
  SKL_02: "察言觀色",
  SKL_03: "畫畫",
  SKL_04: "問問題",
  SKL_05: "輪流玩",
  SKL_06: "家庭時間",
  SKL_07: "收拾玩具",
  SKL_08: "幫拎袋",
  SKL_09: "自己走路",
  SKL_10: "時間分配",
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
  STAT_FATE: "福緣",
} as const;

export const DERIVED_LABEL = {
  STATE_HEALTH: "健康",
  STATE_MOOD: "心情",
  STATE_STRESS: "壓力",
  VALUE_DREAM: "夢想",
  VALUE_REALITY: "現實",
  STATE_PEACE: "心安",
  STATE_FAMILY_HARMONY: "家庭",
  STATE_GLOBAL_NETWORK: "人脈",
  INDEPENDENT_THOUGHT: "獨立思考",
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
    era: "十二月。飯枱部電視開住，大人講緊好遠嘅事。",
    open: "你三歲。碗入面有魚。你未需要知道年份，你只聽到個聲壓低咗。",
    events: ["EVT_1984_NEWS_01", "EVT_1984_FAMILY_02"],
    dailies: ["MINI_84_TOY"],
    activities: ["ACT_MARKET", "ACT_PLAY", "ACT_DRAW", "ACT_REST"],
  },
  {
    year: 1985,
    age: 4,
    scene: "kindy",
    era: "大人有時會靜一靜。你知道自己要去一間叫幼稚園嘅地方。",
    open: "你四歲。阿媽話，門口有其他小朋友。你未知道自己會唔會入到去。",
    events: ["EVT_1985_SCHOOL_01", "EVT_1985_FAMILY_03", "EVT_1985_FRIEND_04"],
    dailies: ["MINI_85_RAIN", "MINI_85_GRANDMA"],
    activities: ["ACT_MARKET", "ACT_PLAY", "ACT_DRAW", "ACT_REST", "ACT_ESTATE"],
  },
  {
    year: 1986,
    age: 5,
    scene: "corridor",
    era: "屋邨照舊。大人開始忙過之前。",
    open: "你五歲。你開始知道，大人唔係唔想陪你，係佢哋都有要做嘅事。",
    events: ["EVT_1986_SKILL_05", "EVT_1986_FAMILY_06", "EVT_1986_MARKET_07", "EVT_1986_ECHO_08"],
    dailies: ["MINI_86_ESTATE", "MINI_86_TV", "MINI_86_HELP"],
    activities: ["ACT_MARKET", "ACT_PLAY", "ACT_DRAW", "ACT_REST", "ACT_ESTATE"],
  },
];

export const ACTIVITIES: Record<string, { id: string; label: string; detail: string; blurb: string; scene: SceneId; effect: Effect }> = {
  ACT_MARKET: {
    id: "ACT_MARKET",
    label: "陪阿媽去街市",
    detail: "跟住出街買餸。慢，但你會見到街坊。",
    blurb: "你拖住阿媽。街市濕，膠袋響。阿姨開始認得你張臉。",
    scene: "market",
    effect: { counter: { REL_LOCAL_MARKET: 5, NPC_MOM_STRESS: -3, MIND_PROGRESS: 1 }, derived: { STATE_MOOD: 2, VALUE_REALITY: 1 }, npc: { NPC_MOM_01: { trust: 1 } } },
  },
  ACT_PLAY: {
    id: "ACT_PLAY",
    label: "自己玩",
    detail: "留喺屋企，同玩具過一個下午。",
    blurb: "你自己安排咗個下午。冇人叫你，你都玩得落。",
    scene: "home",
    effect: { derived: { STATE_MOOD: 3, VALUE_DREAM: 1, STATE_FAMILY_HARMONY: -4 }, primary: { STAT_GRIT: 1 } },
  },
  ACT_DRAW: {
    id: "ACT_DRAW",
    label: "塗鴉",
    detail: "用鉛筆將張紙填滿。",
    blurb: "紙上有顏色。大人叫佢做亂畫，你叫佢做完。",
    scene: "home",
    effect: { derived: { VALUE_DREAM: 2, STATE_MOOD: 1, INDEPENDENT_THOUGHT: 2, STATE_FAMILY_HARMONY: -3 }, counter: { ART_PROGRESS: 1 }, primary: { STAT_MIND: 1 } },
  },
  ACT_REST: {
    id: "ACT_REST",
    label: "休息",
    detail: "瞓、發呆、唔做任何趕住要完成嘅事。",
    blurb: "你乜都冇做。個身鬆咗。",
    scene: "home",
    effect: { derived: { STATE_STRESS: -6, STATE_PEACE: 2, STATE_MOOD: 1 }, counter: { NPC_MOM_STRESS: -4 } },
  },
  ACT_ESTATE: {
    id: "ACT_ESTATE",
    label: "去平台",
    detail: "落樓。可以去平台，唔好出街口。",
    blurb: "平台有其他細路。你冇出到街，但你離開咗屋門。",
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
        title: "士多有架新車",
        lines: ["玻璃櫃入面有架新車。你冇零用錢。", "阿媽已經行開兩步。"],
      };
    case "MINI_85_RAIN":
      return {
        scene: "home",
        kicker: "日常 · 1985",
        title: "落大雨",
        lines: ["落大雨。平台去唔到。", "窗外面白晒，屋入面只剩風扇同你。"],
      };
    case "MINI_85_GRANDMA":
      return {
        scene: "home",
        kicker: "日常 · 1985",
        title: "嫲嫲揭開煲蓋",
        lines: ["湯好香。嫲嫲話，以前呢棟樓要自己行樓梯。", "你握住碗，熱。"],
      };
    case "MINI_86_ESTATE":
      return {
        scene: "estate",
        kicker: "日常 · 1986",
        title: "平台有人叫你",
        lines: ["有個細路喺平台揮手。你未必識佢。", "阿媽喺樓上晾衫，未叫你返。"],
      };
    case "MINI_86_TV":
      return {
        scene: "home",
        kicker: "日常 · 1986",
        title: "電視又開住",
        lines: ["飯未食完。電視有人唱歌，有人講嘢。", "阿爸未出聲叫你揀。"],
      };
    case "MINI_86_HELP":
      return {
        scene: "corridor",
        kicker: "日常 · 1986",
        title: "膠袋太重",
        lines: ["阿媽兩隻手都係袋。走廊燈黃。", "佢冇叫你，但佢行得慢。"],
      };
    case "EVT_1984_NEWS_01": {
      const cold = newsCold(state);
      const lines = cold
        ? ["電視聲大過碗筷。阿媽冇夾魚畀你。", "冇人同你解釋。你仍然聽得到個聲好認真。"]
        : [
            "電視入面講緊好遠嘅事。你只知道今日有魚。",
            "阿媽：「食飯先。咁遠嘅事，陣間先講。」",
            "阿爸細聲：「最緊要一家人穩穩陣陣。」",
          ];
      if (cold && state.spent.includes("ACT_PLAY") && state.spent.includes("ACT_DRAW")) {
        lines.push("你玩咗成個下午。飯枱係你今日第一眼見到佢哋。");
      }
      const lean = gapLine(state, "你今日花喺自己想做嘅事。碗係遲啲先到你面前。", "你跟過人做要做嘅事。碗先至係你面前。");
      if (!cold && lean) lines.push(lean);
      return { scene: "home", kicker: "1984 · 飯枱", title: "將來", lines };
    }
    case "EVT_1984_FAMILY_02":
      return {
        scene: "home",
        kicker: "1984 · 收工",
        title: state.counter.NPC_MOM_STRESS < 20 ? "阿媽今日早咗" : "阿媽今日好攰",
        lines:
          state.counter.NPC_MOM_STRESS < 20
            ? ["阿媽今日早收工。地上有玩具，佢仲有氣同你笑。", "「玩埋陣，我哋一齊收，好唔好？」"]
            : ["阿媽未除鞋已經坐低。", "「等陣先，媽咪今日真係好攰。」", "地上仲有你未收嘅玩具。"],
      };
    case "EVT_1985_SCHOOL_01": {
      const mom = picked(state, "MEM_MOM_TIRED");
      const lines = [
        "老師蹲低：「唔使驚，入去同其他小朋友玩。我教你跟住講兩個字。」",
        "阿媽：「佢平時好乖，係怕生。」",
        "你見到一個細路手上攞住個紅波。",
      ];
      if (mom === "A") lines.splice(1, 0, "阿媽企得好近。上年你收過玩具，佢今日仍然陪你行到門口。");
      if (mom === "B") lines.splice(1, 0, "你想捉實佢。上年你扭過佢。佢隻手今日都喺度。");
      if (mom === "C") lines.splice(1, 0, "你冇出聲。上年你都係坐喺佢隔離。");
      if (state.counter.NPC_MOM_STRESS >= 26) lines.push("阿媽今日把口短。你知佢未完全鬆。");
      else if (state.counter.NPC_MOM_STRESS < 20) lines.push("阿媽行得慢，仲有氣同你講門口有人。");
      const lean = gapLine(state, "你想自己行入去，多過想有人帶。", "你想有人講清楚，先至肯入。");
      if (lean) lines.push(lean);
      return { scene: "kindy", kicker: "1985 · 第一日", title: "幼稚園門口", lines };
    }
    case "EVT_1985_FAMILY_03": {
      const news = picked(state, "MEM_NEWS_01");
      const lines = ["四歲嘅你唔識講呢啲。你只知道新聞完咗之後，屋企好靜。", "阿爸將甜品推過嚟：「冇事，食甜品。」", "阿媽冇笑，只係將電視聲調細。"];
      if (news === "A") lines.unshift("你認得呢種靜。上年你企埋去聽過個電視。");
      else if (news === "B") lines.unshift("阿爸望你一眼。上年你問過「將來」。佢好似記得。");
      else if (news === "C") lines.unshift("上年你揀咗繼續食飯。今年你都識接住個甜品。");
      else lines.push("你未聽過佢哋講將來，所以你唔知佢哋靜緊咩。");
      return { scene: "home", kicker: "1985 · 新聞之後", title: "屋企好靜", lines };
    }
    case "EVT_1985_FRIEND_04": {
      const school = picked(state, "MEM_FIRST_SCHOOL");
      const lines = state.npc.NPC_FRIEND_01.available
        ? ["阿傑：「我先攞到㗎！」", "你都想掂個波。", "老師行開咗。"]
        : ["有個細路，你未正式識佢。佢叫自己阿傑。", "阿傑：「我先攞到㗎！」", "老師行開咗。"];
      if (school.includes("fail") || school.includes("bad")) lines.unshift("你上次未入到課室。今日個波仍然喺度。");
      else if (school.startsWith("safe")) lines.unshift("你上次拉住阿媽。今日個波喺你前面。");
      return { scene: "kindy", kicker: "1985 · 課室", title: "紅波", lines };
    }
    case "EVT_1986_SKILL_05": {
      const lines = [
        "老師：「佢成日畫畫喎，可以參加小組。」",
        "阿爸：「學多啲數就實際。」",
        `阿媽望住你：「你自己想點，${grown}？」`,
      ];
      const mom = picked(state, "MEM_MOM_TIRED");
      if (mom === "A") lines.push("阿媽冇幫你揀。上年你自己收過玩具。");
      if (state.derived.INDEPENDENT_THOUGHT >= 50) lines.push("你問出口之前，已經自己喺度諗咗兩句。冇人聽見。");
      const extra: string[] = [];
      if (state.flags.includes("FLAG_TOY_MONOPOLY") || state.npc.NPC_FRIEND_01.trust < 0) extra.push("阿傑坐得好遠。個紅波唔喺你枱。");
      else if (state.flags.includes("FLAG_SHARED_BALL") || state.npc.NPC_FRIEND_01.trust >= 5) extra.push("阿傑揮你過去坐。");
      else if (!state.npc.NPC_FRIEND_01.available) extra.push("你同阿傑未算識。課室得你自己個位。");
      if (state.counter.ART_PROGRESS >= 2) extra.push("老師：「佢唔係今日先畫。屋企張紙都係顏色。」");
      else if (state.counter.MIND_PROGRESS >= 2) extra.push("老師：「佢識跟住數到十。」");
      const lean = gapLine(state, "你望住顏色多過數字。", "阿爸個聲先到。你知「實際」兩個字。");
      if (lean) extra.push(lean);
      if (state.npc.NPC_TEACH_01.trust >= 35) extra.push("老師記得你自己行入課室。");
      else if (state.flags.includes("FLAG_TEACHER_SLOW")) extra.push("佢講得好慢，等你跟。");
      lines.push(...extra.slice(0, 2));
      return { scene: "kindy", kicker: "1986 · 第一次揀", title: "畫畫，定係數數？", lines };
    }
    case "EVT_1986_FAMILY_06": {
      const lines = ["本來約好去公園。", "阿爸唔係唔想去。佢件外套已經摺好，然後又拆開。", "「下個星期日可能要返工。」佢靜一陣：「下次啦。」"];
      const mom = picked(state, "MEM_MOM_TIRED");
      if (mom === "A") lines.push("你想起阿媽攰嗰日。今日係阿爸。");
      if (mom === "C") lines.push("你識坐埋去。上年你都係咁坐。");
      if (state.counter.NPC_DAD_OVERTIME_COUNT >= 2) lines.unshift("呢個唔係第一次。外套摺好又拆開，你見過。");
      else if (state.counter.NPC_MOM_STRESS >= 26) lines.push("阿媽冇幫你圓。佢自己都未鬆。");
      else if (state.counter.NPC_MOM_STRESS < 20) lines.push("阿媽望你一眼，聲軟：「下星期都得。」");
      return { scene: "home", kicker: "1986 · 星期日", title: "阿爸話要返工", lines };
    }
    case "EVT_1986_MARKET_07": {
      const lines =
        state.counter.REL_LOCAL_MARKET < 20
          ? ["你跟阿媽企咗好耐。呢檔你未熟。", "阿姨同阿媽講嘢，然後多塞一條菜入袋。", "冇人解釋，亦都冇收多一毫子。"]
          : [`阿姨：「又係你呀？${grown}喎，大個喇。」`, "阿媽：「唔該晒。」", "阿姨偷偷多塞一條菜入袋。冇人提錢。"];
      if (state.skills.includes("SKL_03") || state.counter.ART_PROGRESS >= 3) lines.push("你手指有顏色。阿姨問你畫過條菜未。");
      else if (state.skills.includes("SKL_12") || state.counter.MIND_PROGRESS >= 3) lines.push("阿姨：「你識數㗎？幫我數三條。」你數到。");
      else if (state.skills.includes("SKL_10")) lines.push("你望一望，兩邊檔都想睇。時間唔夠。");
      if (state.flags.includes("TAG_RESPONSIBILITY") || state.primary.STAT_STR >= 6) lines.push("你隻手識得自己伸去接袋。");
      return { scene: "market", kicker: "1986 · 街市", title: "多一條菜", lines };
    }
    case "EVT_1986_ECHO_08": {
      const lines = ["你已經落過平台幾次。今日你企到邨口。", "出面光過走廊。你其實只係想自己行多兩步。", "阿媽喺後邊。佢未出聲，但你知道佢望住。"];
      const news = picked(state, "MEM_NEWS_01");
      const extra: string[] = [];
      if (news === "C") extra.push("上年你跟住食飯。今日條路，冇人推你。");
      if (news === "B") extra.push("你想再問一句。你問過一次將來。");
      if (state.counter.NPC_DAD_OVERTIME_COUNT >= 2) extra.push("阿爸今日又唔喺度。你知呢種靜。");
      if (state.flags.includes("FLAG_DAD_WILL_COMPENSATE")) extra.push("佢話遲啲會補。今日條路，佢唔喺度。");
      if (state.npc.NPC_MOM_01.trust >= 75) extra.push("阿媽隻手伸喺你後面，未拉你。");
      else if (state.npc.NPC_MOM_01.trust <= 65) extra.push("阿媽企得遠。聲會先到。");
      if (state.primary.STAT_FATE >= 6) extra.push("你踏出去嗰下，佢遲咗半秒先叫你。");
      lines.push(...extra.slice(0, 3));
      return { scene: "estate", kicker: "1986 · 邨口", title: "如果我自己行呢", lines };
    }
    default:
      return { scene: "home", kicker: "日常", title: "一個下午", lines: ["時間過去。"] };
  }
}

export function choicesFor(id: string, state: State): Choice[] {
  const heard = heardNews(state);
  switch (id) {
    case "MINI_84_TOY":
      return [
        choice("A", "拉住阿媽要睇", "dream", { derived: { STATE_MOOD: 2 }, npc: { NPC_MOM_01: { trust: -1 } } }, "你拉住佢。阿媽歎口氣，俾你睇十秒。「睇完要行。」"),
        choice("B", "自己望完就走", "think", { derived: { INDEPENDENT_THOUGHT: 1, STATE_MOOD: 1 } }, "你望清楚個車，然後自己追上去。冇人買。你記得個樣。"),
        choice("C", "唔睇，跟住行", "reality", { derived: { VALUE_REALITY: 1, STATE_FAMILY_HARMONY: 1, STATE_MOOD: -1 } }, "你跟住行。車留喺櫃入面。阿媽冇發現你停過。"),
      ];
    case "MINI_85_RAIN":
      return [
        choice("A", "畫畫", "dream", { derived: { VALUE_DREAM: 2, STATE_MOOD: 1 }, counter: { ART_PROGRESS: 1 } }, "雨聲好密。你將張紙塗到邊都有顏色。"),
        choice("B", "聽收音機", "think", { derived: { VALUE_REALITY: 1, INDEPENDENT_THOUGHT: 1, STATE_PEACE: 1 }, counter: { MIND_PROGRESS: 1 } }, "收音機轉台，有人講，有人唱。你唔明，但你聽。你記住個節奏。"),
        choice("C", "瞓一陣", "balance", { derived: { STATE_STRESS: -4, STATE_PEACE: 2, STATE_MOOD: 1 } }, "你瞓。雨聲變遠。呢個下午冇發生任何要你完成嘅事。"),
      ];
    case "MINI_85_GRANDMA":
      return [
        choice("A", "聽佢講", "reality", { npc: { NPC_GRAND_01: { trust: 3, relation: 2 } }, derived: { INDEPENDENT_THOUGHT: 1 } }, "你聽。你唔知全部，但你知呢棟樓以前仲難行。"),
        choice("B", "走去玩", "dream", { derived: { STATE_MOOD: 2 }, npc: { NPC_GRAND_01: { relation: -1 } } }, "你留低碗湯，走去玩具度。嫲嫲冇叫你返。"),
        choice("C", "問點解要行樓梯", "think", { derived: { INDEPENDENT_THOUGHT: 2 }, npc: { NPC_GRAND_01: { trust: 2 } } }, "嫲嫲笑。「因為嗰陣冇呢啲掣。」你將「以前」兩個字記住。"),
      ];
    case "MINI_86_ESTATE":
      return [
        choice("A", "揮返手", "dream", { derived: { STATE_MOOD: 2, VALUE_DREAM: 1 } }, "你揮返手。你未知佢個名。平台大咗少少。"),
        choice("B", "企埋一邊睇", "think", { derived: { INDEPENDENT_THOUGHT: 1, STATE_PEACE: 1 } }, "你睇人哋點玩。你未加入，但你記住個規則。"),
        choice("C", "上去搵阿媽", "reality", { derived: { STATE_FAMILY_HARMONY: 2, STATE_MOOD: -1 } }, "你行返上樓。阿媽件衫未乾。你站喺佢隔離。"),
      ];
    case "MINI_86_TV":
      return [
        choice("A", "睇多陣", "dream", { derived: { STATE_MOOD: 2, VALUE_DREAM: 1 } }, "你睇。歌聲比新聞易入耳。飯涼得慢。"),
        choice("B", "食完先", "reality", { derived: { VALUE_REALITY: 1, STATE_FAMILY_HARMONY: 1 } }, "你扒飯。電視繼續。你揀咗碗先。"),
        choice("C", "問佢哋睇緊咩", "think", { derived: { INDEPENDENT_THOUGHT: 1 }, primary: { STAT_SPEECH: 1 } }, "阿爸答得好短。「唱歌。」你知道唔係淨係唱歌，但你問過。"),
      ];
    case "MINI_86_HELP":
      return [
        choice("A", "伸手托住一袋", "reality", { derived: { STATE_FAMILY_HARMONY: 2, VALUE_REALITY: 1 }, primary: { STAT_STR: 1 }, flags: ["TAG_RESPONSIBILITY"] }, "袋帶勒手。阿媽望你一眼，冇講大道理。"),
        choice("B", "走先行開門", "balance", { derived: { STATE_FAMILY_HARMONY: 1, VALUE_DREAM: 1, STATE_STRESS: 1 } }, "你跑去按燈。袋仍然係佢拎。你只係開咗路。"),
        choice("C", "當睇唔到", "dream", { derived: { STATE_MOOD: 1, STATE_FAMILY_HARMONY: -1 } }, "你望住牆畫。阿媽自己將袋放低。佢冇鬧你。"),
      ];
    case "EVT_1984_NEWS_01":
      return [
        choice(
          "A",
          "企埋去聽清楚",
          "think",
          { derived: { STATE_MOOD: 1, INDEPENDENT_THOUGHT: 1 }, flags: ["FLAG_HEARD_ADULT_FUTURE"], skills: ["SKL_02"] },
          "你望住個光。你唔知「將來」係咩，但你知道大人今晚好認真。你開始識得睇人嘅面色。",
          mem("MEM_NEWS_01", "EVT_1984_NEWS_01", "A", "NPC_DAD_01", "curious", "十年後，電視又開住。你仲會停低，聽成年人唔講完嗰句。", 2),
        ),
        choice(
          "B",
          "問：乜嘢將來？",
          "dream",
          {
            primary: { STAT_SPEECH: 1 },
            derived: { STATE_FAMILY_HARMONY: 1 },
            flags: ["FLAG_HEARD_ADULT_FUTURE", "FLAG_PARENT_EXPLAIN"],
            skills: ["SKL_04"],
          },
          "阿爸頓一頓。「將來即係你大個之後。」佢冇講落去。阿媽將魚夾畀你。你學識問出口。",
          mem("MEM_NEWS_01", "EVT_1984_NEWS_01", "B", "NPC_DAD_01", "asking", "十年後，有人提起前途，你會先開口問，而唔係等。", 2),
        ),
        choice(
          "C",
          "繼續食飯",
          "reality",
          {
            derived: { VALUE_REALITY: 1, STATE_PEACE: 1 },
            flags: ["TAG_NEWS_ENGAGEMENT_LOW"],
          },
          "你扒飯。電視仍然響，但飯熱過新聞。你冇因此以後都聽唔到。",
          mem("MEM_NEWS_01", "EVT_1984_NEWS_01", "C", "NPC_MOM_01", "steady", "十年後，飯桌仍然係你最穩嘅位置。新聞響，你都食得落。"),
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
            flags: ["FLAG_HELPED_MOM_01", "TAG_RESPONSIBILITY"],
            skills: ["SKL_07"],
          },
          "你蹲低，將車仔推入盒。你本來想玩。阿媽肩鬆咗少少。你識得點收自己嘅嘢。",
          mem("MEM_MOM_TIRED", "EVT_1984_FAMILY_02", "A", "NPC_MOM_01", "duty", "你見到攰嘅人，手會自己去收拾。", 2),
        ),
        choice(
          "B",
          "扭住要佢陪",
          "dream",
          { derived: { STATE_MOOD: 2, STATE_FAMILY_HARMONY: -2 }, counter: { NPC_MOM_STRESS: 3, NPC_DAD_OVERTIME_COUNT: 1 }, npc: { NPC_MOM_01: { trust: -6 } } },
          "你扯住佢衣袖。阿媽閉一閉眼，仍然抱你一陣。之後佢更靜。阿爸嗰陣出門口，話去補鐘。",
          mem("MEM_MOM_TIRED", "EVT_1984_FAMILY_02", "B", "NPC_MOM_01", "want", "你仍然會想人陪。想完，有時會有少少內疚。", 2),
        ),
        choice(
          "C",
          "坐喺旁邊陪佢",
          "balance",
          {
            derived: { STATE_FAMILY_HARMONY: 3, VALUE_DREAM: 1 },
            npc: { NPC_MOM_01: { trust: 5 } },
            flags: ["TAG_EMPATHY"],
          },
          "你坐上地氈，冇叫佢做任何事。阿媽隻手搁咗你個頭一下，就收返。你冇因此多到一項本事。",
          mem("MEM_MOM_TIRED", "EVT_1984_FAMILY_02", "C", "NPC_MOM_01", "beside", "你識坐喺人旁邊，唔使講好多。"),
        ),
      ];
    case "EVT_1985_SCHOOL_01":
      return [
        choice(
          "A",
          "主動同人打招呼",
          "dream",
          {
            primary: { STAT_SPEECH: 1 },
            npc: { NPC_FRIEND_01: { relation: 4, trust: 2, available: true }, NPC_TEACH_01: { available: true, relation: 2 } },
            flags: ["FLAG_FIRST_SCHOOL"],
            skills: ["SKL_01"],
          },
          "你開咗口。個波仲係喺人哋手上，但有人望過你。",
          undefined,
          "social",
        ),
        choice(
          "B",
          "拉住阿媽隻手",
          "reality",
          {
            derived: { STATE_PEACE: 2, STATE_FAMILY_HARMONY: 2 },
            npc: { NPC_TEACH_01: { available: true } },
            flags: ["FLAG_FIRST_SCHOOL", "FLAG_TEACHER_SLOW"],
            skills: ["SKL_01"],
          },
          "你未行。阿媽隻手還喺你度。老師記住你慢熱。你跟住佢講咗兩個字。",
          undefined,
          "safe",
        ),
        choice(
          "C",
          "自己行去睇個紅波",
          "think",
          {
            derived: { VALUE_DREAM: 2 },
            npc: { NPC_FRIEND_01: { relation: 1 }, NPC_TEACH_01: { available: true } },
            flags: ["FLAG_FIRST_SCHOOL", "FLAG_CURIOUS_SCHOOL"],
          },
          "你冇打招呼，亦都未跟老師讀。你行近個波。課室嘅聲密咗少少。",
          undefined,
          "curious",
        ),
      ];
    case "EVT_1985_FAMILY_03":
      return [
        choice(
          "A",
          "問：你哋唔開心呀？",
          "think",
          { flags: ["TAG_EMPATHY", "FLAG_FAMILY_NEWS_SILENCE"], derived: { STATE_FAMILY_HARMONY: 3 } },
          heard
            ? "阿媽望阿爸一眼。「我哋頭先講過將來。大人有時都會擔心。你食甜品先。」"
            : "阿媽望阿爸一眼。「大人有時都會擔心。你食甜品先。」佢冇再解釋。",
          mem("MEM_SILENT_NEWS_01", "EVT_1985_FAMILY_03", "A", "NPC_MOM_01", "empathy", "你後來識得察覺，靜有時係擔心，唔係冇事。", 2),
        ),
        choice(
          "B",
          "自己去玩",
          "dream",
          { derived: { VALUE_DREAM: 1, STATE_PEACE: 1 }, counter: { NPC_DAD_OVERTIME_COUNT: 1 }, flags: ["FLAG_SELF_COMFORT", "FLAG_FAMILY_NEWS_SILENCE"] },
          "你走去角落。靜係大人嘅，玩具係你嘅。阿爸冇叫你返。佢陣間會再出門。",
          mem("MEM_SILENT_NEWS_01", "EVT_1985_FAMILY_03", "B", "NPC_DAD_01", "aside", "嘈雜嘅時候，你識得自己搵一個角落。"),
        ),
        choice(
          "C",
          "跟住睇多一陣",
          "balance",
          { derived: { INDEPENDENT_THOUGHT: 2, STATE_STRESS: 1 }, flags: ["FLAG_FAMILY_NEWS_SILENCE"] },
          "你坐低，跟住個聲。你唔明，但你記住個節奏。頭有少少緊。",
          mem("MEM_SILENT_NEWS_01", "EVT_1985_FAMILY_03", "C", "NPC_DAD_01", "watch", "你會想知多一句。知多一句，有時會攰。"),
        ),
      ];
    case "EVT_1985_FRIEND_04":
      return [
        choice(
          "A",
          "個波我要先玩",
          "dream",
          {
            primary: { STAT_COURAGE: 1 },
            npc: { NPC_FRIEND_01: { relation: -3, trust: -5 } },
            flags: ["FLAG_TOY_MONOPOLY"],
          },
          "你搶到個波。阿傑企埋一邊。你玩得盡興，但佢一陣都冇再叫你。",
          mem("MEM_RED_BALL", "EVT_1985_FRIEND_04", "A", "NPC_FRIEND_01", "hold", "你記得個紅波。你記得自己曾經唔肯放。", 2),
        ),
        choice(
          "B",
          "一齊玩，輪住嚟",
          "balance",
          {
            derived: { VALUE_DREAM: 1, VALUE_REALITY: 1 },
            primary: { STAT_FATE: 1 },
            npc: { NPC_FRIEND_01: { relation: 5, trust: 5, available: true } },
            flags: ["FLAG_SHARED_BALL"],
            skills: ["SKL_05"],
          },
          "你將個波推返畀佢，再等自己嗰輪。你放棄咗自己一個人霸住佢。阿傑開始叫你個名。",
          mem("MEM_RED_BALL", "EVT_1985_FRIEND_04", "B", "NPC_FRIEND_01", "share", "你後來識講「輪住」。有時你會唔捨得，但你識講。", 2),
        ),
        choice(
          "C",
          "走開，唔好嘈",
          "reality",
          { derived: { STATE_PEACE: 1 }, flags: ["FLAG_AVOID_CONFLICT"] },
          "你行開。個波留喺佢度。課室靜返少少，你同佢都未熟到。",
          mem("MEM_RED_BALL", "EVT_1985_FRIEND_04", "C", "NPC_FRIEND_01", "leave", "你避開爭執。避開完，有時個位已經有人企咗。"),
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
          "你揀顏色。數數嗰組今日冇你份。紙填滿嘅時候，你個心定。",
          mem("MEM_FIRST_INTEREST", "EVT_1986_SKILL_05", "A", "NPC_TEACH_01", "art", "你手上仲有顏色。數字唔係你第一眼。", 2),
        ),
        choice(
          "B",
          "我想學數",
          "reality",
          {
            derived: { VALUE_REALITY: 5, STATE_PEACE: 3 },
            counter: { MIND_PROGRESS: 3, ART_PROGRESS: -1 },
            flags: ["FLAG_FIRST_INTEREST_CHOICE"],
            skills: ["SKL_12"],
          },
          "你跟住數。畫畫小組今日過咗你。你數得明嘅時候，個心亦都定。",
          mem("MEM_FIRST_INTEREST", "EVT_1986_SKILL_05", "B", "NPC_DAD_01", "count", "你會先數清楚，再決定畫唔畫。", 2),
        ),
        choice(
          "C",
          "兩樣都試下",
          "balance",
          {
            derived: { VALUE_DREAM: 2, VALUE_REALITY: 2, STATE_STRESS: 3 },
            counter: { ART_PROGRESS: 2, MIND_PROGRESS: 2 },
            flags: ["FLAG_FIRST_INTEREST_CHOICE"],
            skills: ["SKL_10"],
          },
          "你想兩邊都試。時間只夠六成。你都做咗，但兩邊都未做完，肩有啲緊。你開始識得睇鐘。",
          mem("MEM_FIRST_INTEREST", "EVT_1986_SKILL_05", "C", "NPC_TEACH_01", "split", "你想兩邊都要。有時兩邊都只做到一半。"),
        ),
        choice(
          "D",
          "問：點解一定要揀一樣？",
          "think",
          {
            derived: { INDEPENDENT_THOUGHT: 3 },
            primary: { STAT_SPEECH: 1 },
            flags: ["FLAG_FIRST_INTEREST_CHOICE"],
          },
          state.derived.INDEPENDENT_THOUGHT >= 50
            ? "你問得清楚。冇人即刻答到。你今日冇練成畫畫，亦都冇練成數數。你記得自己問過。"
            : "你問點解一定要揀一樣。冇人即刻答到。你今日冇練成畫畫，亦都冇練成數數。",
          mem("MEM_FIRST_INTEREST", "EVT_1986_SKILL_05", "D", "NPC_MOM_01", "ask", "你會先問點解一定要揀。", 2),
        ),
      ];
      if (state.derived.INDEPENDENT_THOUGHT < 30) return list.filter((item) => item.id !== "D");
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
            counter: { NPC_DAD_OVERTIME_COUNT: 1 },
            flags: ["FLAG_DAD_OVERTIME_MEMORY", "FLAG_DAD_WILL_COMPENSATE"],
          },
          "你去玩。心情鬆咗，但約裂咗。阿爸望住你，遲啲會想補返，今日先至補唔到。",
          mem("MEM_DAD_WORK", "EVT_1986_FAMILY_06", "A", "NPC_DAD_01", "crack", "你記得一個去唔成嘅公園。你自己玩咗，個約仍然裂過。", 2),
        ),
        choice(
          "B",
          "知道啦，你去開工",
          "reality",
          { derived: { VALUE_REALITY: 2, STATE_FAMILY_HARMONY: 1 }, flags: ["FLAG_DAD_OVERTIME_MEMORY"] },
          "你應佢。公園取消。你明白佢要返工，呢句明白係你畀出嚟嘅。",
          mem("MEM_DAD_WORK", "EVT_1986_FAMILY_06", "B", "NPC_DAD_01", "accept", "你識講「知道啦」。知道，唔等於唔想去。"),
        ),
        choice(
          "C",
          "咁留喺屋企一齊",
          "balance",
          {
            derived: { STATE_FAMILY_HARMONY: 4, VALUE_DREAM: 1 },
            flags: ["FLAG_DAD_OVERTIME_MEMORY"],
            skills: ["SKL_06"],
          },
          "公園取消。你哋留喺屋企。你放棄咗出街，換到佢未出門之前嗰陣。",
          mem("MEM_DAD_WORK", "EVT_1986_FAMILY_06", "C", "NPC_DAD_01", "stay", "你後來會將時間留低，即使個行程已經取消。", 2),
        ),
      ];
    case "EVT_1986_MARKET_07":
      return [
        choice(
          "A",
          "同阿姨講多謝",
          "dream",
          { derived: { STATE_GLOBAL_NETWORK: 2, STATE_MOOD: 1 }, flags: ["FLAG_MARKET_KINDNESS"] },
          "你講多謝。冇人塞錢入你手。阿姨笑，下次會再認得你。",
          mem("MEM_MARKET_01", "EVT_1986_MARKET_07", "A", "NPC_AUNT_01", "thanks", "你記得一條唔使錢嘅菜。你記得自己講過多謝。"),
        ),
        choice(
          "B",
          "問：點解要多畀？",
          "think",
          {
            derived: { INDEPENDENT_THOUGHT: 1 },
            primary: { STAT_SPEECH: 1 },
            flags: ["FLAG_FAVOUR_QUESTION"],
            skills: ["SKL_11"],
          },
          state.primary.STAT_SPEECH >= 6
            ? "阿姨頓一頓：「街坊就係咁，唔使即刻還。」你問到一句實答。你記住，人情唔係一筆數。"
            : "阿姨笑，冇答實。你冇因此多到一個人脈。你記住一個問題：人情係咪一定要還。",
          mem("MEM_MARKET_01", "EVT_1986_MARKET_07", "B", "NPC_AUNT_01", "question", "你會問，一份好意係咪一定要還。", 2),
        ),
        choice(
          "C",
          "幫阿媽拎住袋",
          "reality",
          {
            derived: { STATE_FAMILY_HARMONY: 2 },
            flags: ["TAG_RESPONSIBILITY", "FLAG_MARKET_KINDNESS"],
            skills: ["SKL_08"],
          },
          "你接過袋。你少咗自己行開睇檔嘅時間。阿媽隻手空出嚟。",
          mem("MEM_MARKET_01", "EVT_1986_MARKET_07", "C", "NPC_MOM_01", "carry", "你見到重嘅袋，手會自己伸出去。"),
        ),
      ];
    case "EVT_1986_ECHO_08":
      return [
        choice(
          "A",
          "返去拉住阿媽",
          "reality",
          { derived: { VALUE_REALITY: 1, STATE_FAMILY_HARMONY: 2 }, flags: ["FLAG_FIRST_INDEPENDENCE"] },
          "你返去拉住佢。邨口留喺後面。你今日未試，但你知道條路喺度。",
          mem("MEM_FIRST_INDEPENDENCE", "EVT_1986_ECHO_08", "A", "NPC_MOM_01", "return", "你記得邨口。你揀咗返去拉住個人。"),
        ),
        choice(
          "B",
          "行到門口就停",
          "balance",
          {
            derived: { VALUE_DREAM: 2, VALUE_REALITY: 1 },
            primary: { STAT_COURAGE: 1 },
            flags: ["FLAG_FIRST_INDEPENDENCE"],
          },
          "你行到門口，自己停低。出面嘅光你見唔到盡。你未踏出去。",
          mem("MEM_FIRST_INDEPENDENCE", "EVT_1986_ECHO_08", "B", "NPC_MOM_01", "edge", "你識行到門口，然後自己停。", 2),
          undefined,
          true,
        ),
        choice(
          "C",
          "踏出邨口一步",
          "dream",
          {
            derived: { VALUE_DREAM: 5, STATE_FAMILY_HARMONY: -2, STATE_STRESS: 2 },
            primary: { STAT_COURAGE: 2 },
            flags: ["FLAG_FIRST_INDEPENDENCE", "FLAG_GATE_RISK"],
            skills: ["SKL_09"],
          },
          "你踏出邨口一步。阿媽即刻叫你返。「唔准行出嗰條街。」你冇行到馬路，亦都冇整傷。返到屋企，佢鬧咗你。你記住自己行過嗰一步。",
          mem("MEM_FIRST_INDEPENDENCE", "EVT_1986_ECHO_08", "C", "NPC_MOM_01", "risk", "你記得自己踏出過一步。亦都記得被人叫返去。", 3),
        ),
      ];
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
    approach === "social" ? "你本來已經打過招呼。" : approach === "safe" ? "你本來拉住阿媽。" : "你本來行近個紅波。";
  if (kind === "perfect") {
    return {
      text: `${approachLine}跟住你自己行入課室。阿媽企喺門口，你冇返轉頭。`,
      echo: "十年後你仍然記得，你係自己行入去嘅。",
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
      text: `${approachLine}你入到去，但你拖住阿媽好耐。老師等你。`,
      echo: "十年後你記得門口。你入到去，但你拖住個人好耐。",
      emotion: "cling",
      weight: 1,
      effect: { derived: { STATE_FAMILY_HARMONY: 2, STATE_STRESS: 2 } } as Effect,
    };
  }
  if (kind === "bad") {
    return {
      text: `${approachLine}你喘唔到氣，阿媽帶你返屋企。老師記住你慢熱。你冇傷到，只係今日去唔到。`,
      echo: "十年後你記得嗰日太嘈。你返咗屋企，幼稚園第二日仍然喺度。",
      emotion: "overwhelm",
      weight: 2,
      effect: {
        derived: { STATE_FAMILY_HARMONY: -1, STATE_STRESS: 5, STATE_MOOD: -4, STATE_HEALTH: -3 },
        flags: ["FLAG_RETRY_SCHOOL", "FLAG_TEACHER_SLOW"],
      } as Effect,
    };
  }
  return {
    text: `${approachLine}你喊，阿媽帶你返屋企。今日未入到。幼稚園唔會因此消失。`,
    echo: "十年後你記得自己喊咗。你其後仍然要返學。",
    emotion: "cry",
    weight: 1,
    effect: {
      derived: { STATE_FAMILY_HARMONY: -1, STATE_STRESS: 5 },
      flags: ["FLAG_RETRY_SCHOOL"],
    } as Effect,
  };
}

export function orientationLine(dream: number, reality: number) {
  const gap = dream - reality;
  if (gap >= 8) return "你而家比較跟住想做嘅事行。";
  if (gap <= -8) return "你而家比較跟住要做嘅事行。";
  return "你想做同要做，仲未分勝負。";
}

const RECALL: Record<string, Record<string, string>> = {
  MEM_NEWS_01: {
    A: "你企埋去聽過電視。你未明，但你聽過。",
    B: "你問過將來係咩。阿爸答到一半就停。",
    C: "你揀咗繼續食飯。將來嗰兩個字，你留返畀大人。",
  },
  MEM_MOM_TIRED: {
    A: "阿媽攰嗰日，你收咗玩具。",
    B: "你扭住要阿媽陪，即使佢已經好攰。",
    C: "你冇玩，只係坐喺阿媽旁邊。",
  },
  MEM_SILENT_NEWS_01: {
    A: "你問過，點解新聞完咗冇人出聲。",
    B: "屋企靜咗。你自己去玩。",
    C: "你跟住睇多一陣，雖然你仲未明。",
  },
  MEM_RED_BALL: {
    A: "個紅波你唔肯放。阿傑之後冇再叫你。",
    B: "你同阿傑輪住玩。你放棄咗一個人霸住個波。",
    C: "你行開。個波留喺人哋度。",
  },
  MEM_FIRST_INTEREST: {
    A: "你揀咗畫畫。數數嗰組冇你份。",
    B: "你揀咗數數。畫畫今日過咗你。",
    C: "你兩樣都想要。兩邊都只做到一半。",
    D: "你問點解一定要揀一樣。你記得自己問過。",
  },
  MEM_DAD_WORK: {
    A: "公園去唔成。你自己去玩，個約裂過。",
    B: "你講過「知道啦」。公園仍然取消。",
    C: "公園取消。你留低同佢一齊。",
  },
  MEM_MARKET_01: {
    A: "你同阿姨講過多謝。冇人塞錢入你手。",
    B: "你問過，一份好意係咪一定要還。",
    C: "你幫阿媽拎過袋。你少咗自己行開嘅時間。",
  },
  MEM_FIRST_INDEPENDENCE: {
    A: "邨口你返去拉住人。",
    B: "你行到門口，然後自己停。",
    C: "你踏出過一步。阿媽叫你返，你冇行到馬路。",
    skip: "你本可以再落平台。你揀咗留喺屋企。",
  },
};

export function recallLine(memory: { id: string; choiceId: string; echo: string }) {
  if (memory.id === "MEM_FIRST_SCHOOL") {
    if (memory.choiceId.includes("perfect")) return "你自己行入過課室。";
    if (memory.choiceId.includes("win")) return "你入到去，但你拖住阿媽好耐。";
    if (memory.choiceId.includes("bad")) return "嗰日太嘈。你返咗屋企，第二日先再試。";
    return "你喊過。幼稚園第二日仍然喺度。";
  }
  return RECALL[memory.id]?.[memory.choiceId] ?? memory.echo;
}

const VOICE_BIT: Record<string, Record<string, string>> = {
  MEM_NEWS_01: {
    A: "三歲你企埋去聽電視",
    B: "三歲你問過將來",
    C: "三歲你揀咗繼續食飯",
  },
  MEM_MOM_TIRED: {
    A: "阿媽攰嗰日你收咗玩具",
    B: "你扭住要阿媽陪",
    C: "你坐喺阿媽旁邊",
  },
  MEM_SILENT_NEWS_01: {
    A: "你問過點解屋企咁靜",
    B: "屋企靜咗，你自己去玩",
    C: "你跟住睇多一陣",
  },
  MEM_RED_BALL: {
    A: "個紅波你唔肯放",
    B: "你同阿傑輪住玩",
    C: "你行開，個波留喺人哋度",
  },
  MEM_FIRST_INTEREST: {
    A: "五歲你揀咗畫畫",
    B: "五歲你揀咗數數",
    C: "五歲你兩樣都想要，兩邊都未做完",
    D: "五歲你問點解一定要揀",
  },
  MEM_DAD_WORK: {
    A: "公園去唔成，你自己去玩",
    B: "你講過「知道啦」",
    C: "公園取消，你留低同佢一齊",
  },
  MEM_MARKET_01: {
    A: "你同阿姨講過多謝",
    B: "你問過一份好意係咪一定要還",
    C: "你幫阿媽拎過袋",
  },
  MEM_FIRST_INDEPENDENCE: {
    A: "邨口你返去拉住人",
    B: "你行到門口就自己停",
    C: "你踏出過邨口一步，然後被人叫返去",
    skip: "你本可以再落平台，你揀咗留喺屋企",
  },
};

function voiceBit(memory: { id: string; choiceId: string }) {
  if (memory.id === "MEM_FIRST_SCHOOL") {
    if (memory.choiceId.includes("perfect")) return "你自己行入過課室";
    if (memory.choiceId.includes("win")) return "你入到去，但你拖住阿媽好耐";
    if (memory.choiceId.includes("bad")) return "嗰日太嘈，你返咗屋企";
    return "你喊過，幼稚園第二日仍然喺度";
  }
  return VOICE_BIT[memory.id]?.[memory.choiceId] ?? "";
}

export function lifeVoice(memories: { id: string; choiceId: string; weight?: number; year?: number }[], name = "") {
  const ranked = memories
    .map((item) => ({ item, bit: voiceBit(item) }))
    .filter((entry) => entry.bit)
    .sort((a, b) => {
      const byWeight = (b.item.weight ?? 1) - (a.item.weight ?? 1);
      if (byWeight !== 0) return byWeight;
      return (b.item.year ?? 0) - (a.item.year ?? 0);
    });
  const picked = ranked.slice(0, 4).sort((a, b) => (a.item.year ?? 0) - (b.item.year ?? 0));
  const who = name.trim() ? name.trim() : "你";
  if (picked.length === 0) return `十年後，飯桌仍然喺度。${who}一路揀過嘅事，會自己出聲。`;
  return `十年後有人提起${who}細個：${picked.map((entry) => entry.bit).join("，")}。所以${who === "你" ? "你" : who}今日先會咁。`;
}
