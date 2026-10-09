import { INITIAL_COUNTERS, INITIAL_DERIVED, INITIAL_PRIMARY, type Approach, type BattleKind, type Effect, type SceneId, type State, type Tendency } from "./types";
import { freshChain, friendFollow, knowsKit } from "./freedom";
import { slotIs } from "./world";
import { cardFor, choicesFor, STATIC_EVENTS, variantOf1986Market, type Card, type Choice } from "./data/events";
import { heardNews, newsCold, picked, selectByPriority, type Spoken } from "./speak";

export { cardFor, choicesFor, type Card, type Choice };

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
  SKL_13: "拆開一題",
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

/** childhood-afternoon is the current childhood year: two afternoons. prototype-slice borrows that shape for 1988 only. It is not primary school. Official primary school, not built, is one semester and 3 AP. */
export type YearCalendar = "childhood-afternoon" | "prototype-slice";

type YearDef = {
  year: number;
  age: number;
  scene: SceneId;
  /** Year-open title. The screen does not guess this from the year number. */
  title: string;
  calendar: YearCalendar;
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
    title: "飯桌",
    calendar: "childhood-afternoon",
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
    title: "門口",
    calendar: "childhood-afternoon",
    era: "大人有時會安靜一下。你知道自己要去幼稚園。",
    open: "你四歲。媽媽說門口有其他小朋友。你還不知道自己進不進得去。",
    events: ["EVT_1985_SCHOOL_01", "EVT_1985_FAMILY_03", "EVT_1985_FRIEND_04"],
    dailies: ["MINI_85_RAIN", "MINI_85_GRANDMA", "MINI_85_DAD", "MINI_85_TV", "MINI_QUIET", "MINI_85_KIT_WAIT", "MINI_85_ORANGE", "MINI_85_MOM_ALONE", "MINI_85_NEIGHBOR", "MINI_85_ALONE_PODIUM"],
    activities: ["ACT_MARKET", "ACT_PLAY", "ACT_DRAW", "ACT_REST", "ACT_ESTATE"],
  },
  {
    year: 1986,
    age: 5,
    scene: "corridor",
    title: "走廊",
    calendar: "childhood-afternoon",
    era: "屋邨還是那樣。十月，電視裡有個戴帽子的女人下船。",
    open: "你五歲。爸爸說：「女皇來了。」你不知道女皇是誰。你也開始明白，大人不是不想陪你，是他們也有必須做的事。",
    events: ["EVT_1986_SKILL_05", "EVT_1986_FAMILY_06", "EVT_1986_DAD_NIGHT", "EVT_1986_MARKET_07", "EVT_1986_ECHO_08", "EVT_1986_FRIEND_09"],
    dailies: ["MINI_86_ESTATE", "MINI_86_TV", "MINI_86_HELP"],
    activities: ["ACT_MARKET", "ACT_PLAY", "ACT_DRAW", "ACT_REST", "ACT_ESTATE"],
  },
  {
    year: 1988,
    age: 7,
    scene: "study",
    title: "書桌",
    calendar: "prototype-slice",
    era: "小學。測驗紙發下來的時候，課室很靜。",
    open: "你七歲。老師說今天要寫一張卷。你還不知道自己寫不寫得完。",
    events: ["EVT_1988_PEN_01", "EVT_1988_EXAM_01", "EVT_1988_DAD_SIGN"],
    dailies: [],
    activities: ["ACT_MARKET", "ACT_DRAW", "ACT_REST"],
  },
];

export const ACTIVITIES: Record<string, { id: string; label: string; detail: string; blurb: string; scene: SceneId; effect: Effect }> = {
  ACT_MARKET: {
    id: "ACT_MARKET",
    label: "陪媽媽去街市",
    detail: "去街市。誰在，要到了才知道。",
    blurb: "你去了街市。地面很濕，魚檔的水滲進鞋子。",
    scene: "market",
    effect: { derived: { STATE_MOOD: 2, VALUE_REALITY: 1 }, counter: { MIND_PROGRESS: 1 } },
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
    detail: "下樓到平台。不要出街口。",
    blurb: "你下了樓，到了平台。你沒有出到街上。",
    scene: "estate",
    effect: { counter: { COUNTER_EXPLORE: 1 }, derived: { STATE_MOOD: 2, STATE_STRESS: 1 }, primary: { STAT_VIT: 1 } },
  },
};

/** 1984 and 1988 are one ordinary market trip with Mom. In 1985 and 1986 she goes on Saturday; on Sunday she stays home. */
export function marketWithMom(year: number, slot: number) {
  return (year !== 1985 && year !== 1986) || slot === 0;
}

/** The label is what the player is promised. A Sunday market trip does not promise Mom. */
export function activityLabel(id: string, year: number, slot: number) {
  if (id === "ACT_MARKET" && !marketWithMom(year, slot)) return "去街市";
  return ACTIVITIES[id]?.label ?? id;
}

export function activityDetail(id: string, year: number, slot: number) {
  if (id === "ACT_MARKET" && !marketWithMom(year, slot)) return "媽媽星期六已經買了菜，今天留在家。街市有誰在，到了才知道。";
  return ACTIVITIES[id]?.detail ?? "";
}

/** The sentence under 這個下午. Reads only what already happened. */
export function activityBlurb(id: string, state: Pick<State, "yearIndex" | "spent" | "skills" | "counter">) {
  const year = yearOf(state).year;
  if (id === "ACT_MARKET") {
    return marketWithMom(year, state.spent.length)
      ? "你拉著媽媽。那天地面很濕，魚檔的水滲進鞋子。"
      : "你去了街市。地面很濕，魚檔的水滲進鞋子。媽媽今天留在家，沒有來。";
  }
  if (id === "ACT_DRAW" && (state.skills.includes("SKL_03") || state.counter.ART_PROGRESS >= 2)) {
    return "你把紙塗滿。這一次你知道自己在畫什麼，畫完了才抬頭。";
  }
  return ACTIVITIES[id]?.blurb ?? "";
}

/** End-of-1986 offer. Says how many times you really went down; offered once. */
export function exploreOfferTitle(state: Pick<State, "counter">) {
  return state.counter.COUNTER_EXPLORE <= 0 ? "要不要下一次平台" : "要不要再下一次平台";
}

export function exploreOfferGo(state: Pick<State, "counter">) {
  return state.counter.COUNTER_EXPLORE <= 0 ? "下平台" : "再下一次平台";
}

export function exploreOfferCopy(state: Pick<State, "counter">) {
  return state.counter.COUNTER_EXPLORE <= 0
    ? "這一年你沒有下過平台。屋邨門口在平台再過去一點。要不要下去一次？你也可以留在家裡。"
    : "這一年你下過一次平台。再下去一次，會一直走到屋邨門口。你也可以留在家裡。";
}

const EVENT_SCENE: Record<string, SceneId> = {
  EVT_1984_NEWS_01: "home",
  EVT_1984_FAMILY_02: "home",
  EVT_1985_SCHOOL_01: "kindy",
  EVT_1985_FAMILY_03: "home",
  EVT_1985_FRIEND_04: "kindy",
  MINI_85_KIT_WAIT: "estate",
  MINI_85_ORANGE: "market",
  MINI_85_NEIGHBOR: "market",
  MINI_85_MOM_ALONE: "home",
  MINI_85_ALONE_PODIUM: "estate",
  EVT_1986_SKILL_05: "kindy",
  EVT_1986_FAMILY_06: "home",
  EVT_1986_MARKET_07: "market",
  EVT_1986_ECHO_08: "estate",
  EVT_1986_FRIEND_09: "corridor",
  EVT_1986_DAD_NIGHT: "home",
  EVT_1988_DAD_SIGN: "home",
};

const has = (state: Pick<State, "memories">, id: string) => state.memories.some((item) => (item.memoryTypeId ?? item.id) === id);

/** Events that only open when the player has earned them. openNext skips a gated event; nothing else changes. */
export const EVENT_GATES: Record<string, (state: Pick<State, "memories">) => boolean> = {
  EVT_1986_DAD_NIGHT: (state) => has(state, "MEM_DAD_WORK"),
  EVT_1988_DAD_SIGN: (state) => has(state, "MEM_DAD_WORK") && has(state, "MEM_EXAM_PAPER"),
};

export function isLastYear(yearIndex: number) {
  return yearIndex >= YEARS.length - 1;
}

export function yearOf(state: Pick<State, "yearIndex">) {
  return YEARS[state.yearIndex] ?? YEARS[0];
}

export function buildQueue(yearIndex: number, seed: number) {
  const year = YEARS[yearIndex];
  const events = [...year.events];
  if (year.dailies.length === 0) return events;
  const daily = year.dailies[Math.abs(seed + year.year) % year.dailies.length];
  events.splice(1, 0, daily);
  return events;
}

export function sceneFor(id: string | null, fallback: SceneId): SceneId {
  if (id && STATIC_EVENTS[id]) return STATIC_EVENTS[id].scene;
  if (id && EVENT_SCENE[id]) return EVENT_SCENE[id];
  return fallback;
}

export function variantOf(id: string, state: State) {
  if (id === "EVT_1984_NEWS_01") return newsCold(state) ? "cold" : "harmony";
  if (id === "EVT_1984_FAMILY_02") return state.counter.NPC_MOM_STRESS < 20 ? "low_pressure" : "tired";
  if (id === "EVT_1985_FAMILY_03") return heardNews(state) ? "heard" : "plain";
  if (id === "EVT_1985_FRIEND_04") {
    if (state.flags.includes("FLAG_CURIOUS_SCHOOL") && !state.npc.NPC_FRIEND_01.available) return "observe";
    if (slotIs(state.spent, "sat", "ACT_ESTATE")) return "podium";
    return state.npc.NPC_FRIEND_01.available ? "known" : "stranger";
  }
  if (id === "EVT_1986_FRIEND_09") return friendFollow(state);
  if (id === "EVT_1986_SKILL_05") return state.derived.INDEPENDENT_THOUGHT >= 50 ? "reflective" : "plain";
  if (id === "EVT_1986_MARKET_07") return variantOf1986Market(state);
  return "base";
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
    const text =
      approach === "safe"
        ? `${approachLine}你進去了，但你拉著媽媽很久。老師等你。`
        : approach === "social"
          ? `${approachLine}你進去了。你開過口，不過你走得很慢。老師等你。`
          : `${approachLine}你進去了。你沒有拉住誰。老師等你。`;
    const echo =
      approach === "safe"
        ? "十年後你記得門口。你進去了，但你拉著一個人很久。"
        : approach === "social"
          ? "十年後你記得門口。你進去了，不過你走得很慢。"
          : "十年後你記得門口。你是自己走近去的。";
    return {
      text,
      echo,
      emotion: approach === "safe" ? "cling" : "enter",
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

export function examStory(kind: BattleKind) {
  if (kind === "perfect") {
    return {
      text: "你交卷的時候，課室還有人在寫。你沒有再翻回去看。",
      echo: "十年後你記得那張卷。你寫完了，而且沒有拖到最後。",
      emotion: "steady",
      weight: 2,
      effect: { derived: { STATE_PEACE: 2, STATE_MOOD: 1 } } as Effect,
    };
  }
  if (kind === "win") {
    return {
      text: "你交了卷。有一兩題是猜的。老師收下，沒有當堂說對錯。",
      echo: "十年後你記得那張卷。你寫完了，不過有題是猜的。",
      emotion: "enter",
      weight: 1,
      effect: { derived: { STATE_STRESS: 1 } } as Effect,
    };
  }
  if (kind === "bad") {
    return {
      text: "你看著紙，寫不下去。老師說可以停。你沒有做完。",
      echo: "十年後你記得那張卷。你停過一次。",
      emotion: "overwhelm",
      weight: 2,
      effect: { derived: { STATE_STRESS: 4, STATE_MOOD: -2 } } as Effect,
    };
  }
  return {
    text: "收卷了。你還有題空著。老師把紙抽走，沒有罵你。",
    echo: "十年後你記得那張卷。你沒有寫完。",
    emotion: "cry",
    weight: 1,
    effect: { derived: { STATE_STRESS: 3 } } as Effect,
  };
}

export function yearLean(dream: number, reality: number) {
  const gap = dream - reality;
  if (gap >= 8) return "這一年，你似乎越來越想自己決定。";
  if (gap <= -8) return "這一年，你似乎越來越先做該做的事。";
  return "這一年，想做的和該做的，你還沒分出哪一樣先。";
}

/**
 * The year-end sentence. It compares this year's movement, not the lifetime total,
 * so a year spent on yourself and a year spent on chores read differently.
 */
export function yearSummary(state: Pick<State, "derived" | "yearStart">) {
  const start = state.yearStart ?? { dream: 50, reality: 50, think: 40 };
  const dream = state.derived.VALUE_DREAM - start.dream;
  const reality = state.derived.VALUE_REALITY - start.reality;
  const think = state.derived.INDEPENDENT_THOUGHT - start.think;
  const gap = dream - reality;
  if (gap >= 3) return "這一年，你多數先做自己想做的事。";
  if (gap <= -3) return "這一年，你多數先做該做的事。";
  if (think >= 3) return "這一年，你常常先問一句，才決定。";
  if (dream + reality >= 4) return "這一年，想做的和該做的，你兩邊都做了一點。";
  return "這一年，想做的和該做的，你還沒分出哪一樣先。";
}

/** The ending sentence. Same idea over the whole childhood. */
export function orientationSummary(state: Pick<State, "derived">) {
  const gap = state.derived.VALUE_DREAM - state.derived.VALUE_REALITY;
  if (gap >= 8) return "過了這幾年，你似乎越來越想自己決定。";
  if (gap <= -8) return "過了這幾年，你似乎越來越先做該做的事。";
  if (state.derived.INDEPENDENT_THOUGHT >= 48) return "過了這幾年，你習慣先問一句為什麼，才決定。";
  if (gap >= 6) return "過了這幾年，你多數先做想做的事，該做的也沒有放下。";
  if (gap <= -6) return "過了這幾年，你多數先做該做的事，想做的也沒有放下。";
  return "過了這幾年，想做的和該做的，你都放在心上，還沒分出哪一樣先。";
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
  const keptWatch = state.memories.some((item) => (item.memoryTypeId ?? item.id) === "MEM_TOY_WATCH");
  const stillHeld = state.equipment.includes("EQP_PLASTIC_WATCH");
  if (keptWatch && stillHeld) lines.push("你手腕上那隻塑膠錶仍然不會走。士多沒有買那輛車。錶是阿姨放進你手裡的。");
  else if (keptWatch) lines.push("那隻不會走的塑膠錶不在手上了。士多沒有買那輛車。你記得阿姨把它放進你手裡。");
  const keptPen = state.memories.some((item) => (item.memoryTypeId ?? item.id) === "MEM_BALLPOINT");
  const penHeld = state.equipment.includes("EQP_BALLPOINT");
  if (keptPen && penHeld) lines.push("你小學那張卷，用的是同學多出來的那支筆。筆還在。");
  else if (keptPen) lines.push("那支原子筆不在了。你記得那張卷是用它寫的。");
  const dadPick = picked(state, "MEM_DAD_WORK");
  const response = state.counter.PLAYER_DAD_CHOICE_RESPONSE || (dadPick === "A" ? 1 : dadPick === "B" ? 2 : dadPick === "C" ? 3 : 0);
  if (response === 1) lines.push("你小時候把約定放下，自己去玩了。這天你沒有再等誰。");
  else if (response === 2) lines.push("你答應過他去上班。這天回家，你只應了一聲。");
  else if (response === 3) lines.push("你留下來陪過。這天你也先坐下，再答。");
  lines.push(...dadArc(state));
  const again = picked(state, "MEM_FRIEND_AGAIN");
  if (again === "A") lines.push("五歲那年，你還是走向阿傑。");
  else if (again === "B") lines.push("五歲那年，你看著，沒有馬上加入。");
  else if (again === "C") lines.push("五歲那年，你又走開了一次。");
  lines.push(...thirdHop(state));
  lines.push(...rememberedPeople(state));
  lines.push("原來你小時候那些選擇，沒有消失。");
  return lines;
}

/**
 * Dad arc, beat 5 of 5, at fifteen. One line from childhood, gated by what the child saw and asked:
 * 1984 「最要緊是一家人安穩」 (MEM_NEWS_01, harmony variant) → 1985 slow shoes (MEM_DAD_HOME) →
 * 1986 「下次吧」 (MEM_DAD_WORK) → that night (MEM_DAD_LATE) → 1988 signing the paper (MEM_DAD_SIGN) → here.
 * The reason (he stayed late for others) is only said if the child heard it: asked in 1986 or 1988, or saw the overtime Sunday.
 */
export function dadArc(state: State): string[] {
  const park = picked(state, "MEM_DAD_WORK");
  if (!park) return [];
  const night = picked(state, "MEM_DAD_LATE");
  const sign = picked(state, "MEM_DAD_SIGN");
  const sawHome = state.memories.some((item) => (item.memoryTypeId ?? item.id) === "MEM_DAD_HOME");
  const overtime = sawHome && state.npcDays.NPC_DAD_01?.todayOutcome === "overtime";
  const sawShoes = sawHome || !!night || !!sign;
  const heardWhy = night === "B" || sign === "C" || overtime;
  if (!sawShoes) return [];
  const lines = ["十一點，門開了。爸爸坐在門口脫鞋，脫得很慢。"];
  if (!heardWhy) {
    lines.push("你小時候見過他這樣脫鞋。你沒有問過為什麼。");
    return lines;
  }
  lines.push("小時候你以為「下次吧」只是推你。");
  if (sign === "C") lines.push("那幾年同事一個一個移民，他替人留到最後。走不開的時候，他就說下次。");
  else if (night === "B") lines.push("公司一直沒有請到人。他替人留到最後。走不開的時候，他就說下次。");
  else lines.push("那個星期六他替人留到最後。當時你只知道，鞋子脫得很慢。");
  const news = state.memories.find((item) => (item.memoryTypeId ?? item.id) === "MEM_NEWS_01");
  if (news?.variant === "harmony") lines.push("「最要緊是一家人安穩。」他只說過一次，之後就一直做。");
  lines.push(park === "A" ? "他問你星期日有沒有空。你說約了人。他說好，下次。" : "他問你星期日有沒有空。公園那個下次，他還記得。");
  return lines;
}

export type FifteenActId = "walk" | "bag" | "ask" | "wait" | "answer";

/** One action at fifteen. It repeats something the child actually did, not a history lesson. */
export function fifteenAct(state: State): { id: FifteenActId; label: string; line: string } {
  const news = picked(state, "MEM_NEWS_01");
  const ball = picked(state, "MEM_RED_BALL");
  const step = picked(state, "MEM_FIRST_INDEPENDENCE");
  if (state.skills.includes("SKL_09") || step === "C") {
    return { id: "walk", label: "自己走回去", line: "你沒有再解釋。你自己走回去，像小時候走出的那一步。" };
  }
  if (state.skills.includes("SKL_08") || state.skills.includes("SKL_07") || state.personalityTags.includes("TAG_RESPONSIBILITY")) {
    return { id: "bag", label: "先把袋子放下", line: "你進門先把袋子放下。這個動作，你小時候做過。" };
  }
  if (news === "B" || state.skills.includes("SKL_04")) {
    return { id: "ask", label: "先問一句", line: "媽媽問你幾點回來。你先問她今天過得怎樣。" };
  }
  if (state.skills.includes("SKL_05") || ball === "B") {
    return { id: "wait", label: "等她說完", line: "你沒有搶著解釋。你等她說完，再答一句。" };
  }
  return { id: "answer", label: "應一聲", line: "你應了一聲，沒有再解釋那麼多。" };
}

function thirdHop(state: State) {
  const spoken: Spoken[] = [];
  const news = picked(state, "MEM_NEWS_01");
  if (news === "B") spoken.push({ priority: 0, text: "有人提起前途。你自己先開口問。" });
  else if (news === "A") spoken.push({ priority: 0, text: "電視又開著。你會停下來，聽大人沒說完的那句。" });
  else if (news === "C" || state.personalityTags.includes("TAG_NEWS_ENGAGEMENT_LOW")) spoken.push({ priority: 0, text: "新聞響著，你也不急著問。你小時候也是顧著吃飯。" });
  const mom = picked(state, "MEM_MOM_TIRED");
  if (mom === "A") spoken.push({ priority: 0, text: "媽媽問你吃了沒有。你的手自己伸出去。" });
  else if (mom === "C") spoken.push({ priority: 0, text: "媽媽坐在那裡。你坐過去，沒有問很多。" });
  else if (mom === "B") spoken.push({ priority: 0, text: "你還是想有人陪。想完，你懂得自己把話收回來。" });
  const ball = picked(state, "MEM_RED_BALL");
  if (ball === "B") spoken.push({ priority: 1, text: "朋友叫你。你會說輪流，不會一個人霸佔。" });
  else if (ball === "A") spoken.push({ priority: 1, text: "你記得自己霸過那個球。今天你不再搶先。" });
  else if (ball === "C") spoken.push({ priority: 1, text: "有人叫你。你站了一陣才走過去。" });
  // MEM_DAD_WORK is said once, by fifteenLines. Saying it here too gave two 約定 lines on one page.
  const market = picked(state, "MEM_MARKET_01");
  if (market === "B") spoken.push({ priority: 1, text: "有人幫你。你還是會問，一份好意是不是一定要還。" });
  else if (market === "A") spoken.push({ priority: 1, text: "街坊多給過你。你現在也會說謝謝。" });
  if (state.flags.includes("FLAG_CURIOUS_SCHOOL")) spoken.push({ priority: 2, text: "你小時候自己走近過。現在回學校，你不必再拉著人。" });
  else if (state.flags.includes("FLAG_FAMILY_NEWS_SILENCE") && picked(state, "MEM_SILENT_NEWS_01") === "A") spoken.push({ priority: 2, text: "家裡靜過。你現在也明白，靜有時是擔心。" });
  return selectByPriority(spoken, 3);
}

function rememberedPeople(state: State) {
  const spoken: Spoken[] = [];
  if (picked(state, "MEM_ORANGE") === "C") spoken.push({ priority: 1, text: "阿姨沒有再說那顆橙。你記得它很圓，也很酸。" });
  if (picked(state, "MEM_MOM_ALONE") === "B") spoken.push({ priority: 1, text: "那袋菜她一個人提過。你去玩了。她沒有再提。" });
  if (picked(state, "MEM_GRAND_DAY") === "B") spoken.push({ priority: 1, text: "嫲嫲後來說湯還是熱的。你記得它涼了。" });
  if (picked(state, "MEM_NEIGHBOR") === "A") spoken.push({ priority: 1, text: "媽媽以為你不喜歡街市。你只是拉過她的衣袖。" });
  if (state.memories.some((item) => item.id === "MEM_OTHER_CHILD")) spoken.push({ priority: 1, text: "平台上那個孩子，你到現在也不知道名字。" });
  return selectByPriority(spoken, 2);
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
    B: "你和阿傑輪流玩。你不再一個人霸佔那個球。",
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
  MEM_DAD_LATE: {
    A: "那晚他很晚回來。你裝睡，聽見他脫鞋。",
    B: "你問過下次是幾時。他說，等公司請到人。",
    C: "你替他把鞋擺好。鞋底很薄。",
  },
  MEM_DAD_SIGN: {
    A: "你等爸爸簽完卷才睡。",
    B: "你先睡了。卷第二天已經簽好。",
    C: "你問過他為什麼這麼晚。同事移民了，他替人做。",
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
    skip: "你本來可以下平台。你選了留在家裡。",
  },
};

function schoolRecall(choiceId: string) {
  if (choiceId.includes("perfect")) return "你自己走進過課室。";
  if (choiceId.includes("bad")) return "那天太吵。你回了家，第二天再試。";
  if (!choiceId.includes("win")) return "你哭過。幼稚園第二天仍然在。";
  if (choiceId.startsWith("social")) return "你進去了，不過你走得很慢。";
  if (choiceId.startsWith("curious")) return "你進去了，你沒有拉住誰。";
  return "你進去了，但你拉著媽媽很久。";
}

function schoolVoice(choiceId: string) {
  if (choiceId.includes("perfect")) return "你自己走進過課室";
  if (choiceId.includes("bad")) return "那天太吵，你回了家";
  if (!choiceId.includes("win")) return "你哭過，幼稚園第二天仍然在";
  if (choiceId.startsWith("social")) return "你進去了，不過你走得很慢";
  if (choiceId.startsWith("curious")) return "你進去了，你沒有拉住誰";
  return "你進去了，但你拉著媽媽很久";
}

export function recallLine(memory: { id: string; choiceId: string; echo: string }) {
  if (memory.id === "MEM_FIRST_SCHOOL") return schoolRecall(memory.choiceId);
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
  MEM_DAD_LATE: {
    A: "你裝睡，聽見爸爸在門口脫鞋",
    B: "你問過爸爸下次是幾時",
    C: "你替爸爸把鞋擺好",
  },
  MEM_DAD_SIGN: {
    A: "你等爸爸簽完卷才睡",
    B: "你先睡了，卷第二天簽好",
    C: "你問過爸爸為什麼這麼晚",
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
    skip: "你本來可以下平台，你選了留在家裡",
  },
};

function voiceBit(memory: { id: string; choiceId: string }) {
  if (memory.id === "MEM_FIRST_SCHOOL") return schoolVoice(memory.choiceId);
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

export function knownEventIds(yearIndex?: number) {
  const years = yearIndex === undefined ? YEARS : YEARS[yearIndex] ? [YEARS[yearIndex]] : [];
  return years.flatMap((year) => [...year.events, ...year.dailies]);
}

let memoryCatalog: Map<string, { eventId: string; choices: Set<string> }> | null = null;

function buildMemoryCatalog() {
  const state: State = {
    phase: "event",
    gender: "girl",
    yearIndex: 0,
    primary: { ...INITIAL_PRIMARY },
    derived: { ...INITIAL_DERIVED, INDEPENDENT_THOUGHT: 10 },
    counter: { ...INITIAL_COUNTERS },
    npc: {
      NPC_DAD_01: { relation: 62, trust: 64, available: true },
      NPC_MOM_01: { relation: 68, trust: 70, available: true },
      NPC_GRAND_01: { relation: 60, trust: 66, available: true },
      NPC_AUNT_01: { relation: 20, trust: 15, available: true },
      NPC_FRIEND_01: { relation: 0, trust: 0, available: false },
      NPC_TEACH_01: { relation: 30, trust: 30, available: false },
    },
    npcDays: {},
    flags: [],
    personalityTags: [],
    skills: Object.keys(SKILL_NAME),
    equipment: [],
    equipped: [],
    techniques: [],
    techniqueProgress: {},
    memories: [],
    seed: 1,
    apLeft: 2,
    spent: [],
    missed: [],
    chain: freshChain(),
    queue: [],
    eventId: null,
    note: null,
    noteScene: null,
    result: null,
    approach: null,
    battleSpecId: null,
    battleTries: 0,
    battle: null,
    offeredExplore: false,
    name: "",
    schemaVersion: 3,
  };
  const catalog = new Map<string, { eventId: string; choices: Set<string> }>();
  for (const id of knownEventIds()) {
    for (const choice of choicesFor(id, state)) {
      if (!choice.memory) continue;
      const slot = catalog.get(choice.memory.id) ?? { eventId: choice.memory.eventId, choices: new Set<string>() };
      slot.choices.add(choice.memory.choiceId);
      catalog.set(choice.memory.id, slot);
    }
  }
  catalog.get("MEM_FIRST_INDEPENDENCE")?.choices.add("skip");
  return catalog;
}

/** True when this memory type, choice, and event exist in the content catalog. */
export function knownMemoryChoice(id: string, choiceId: string, eventId: string) {
  if (id === "MEM_FIRST_SCHOOL") {
    return eventId === "EVT_1985_SCHOOL_01" && /^(social|safe|curious)_(perfect|win|fail|bad)$/.test(choiceId);
  }
  if (id === "MEM_EXAM_PAPER") {
    return eventId === "EVT_1988_EXAM_01" && /^(social|safe|curious)_(perfect|win|fail|bad)$/.test(choiceId);
  }
  if (id === "MEM_FIFTEEN") {
    return eventId === "EVT_1996" && /^(walk|bag|ask|wait|answer)$/.test(choiceId);
  }
  memoryCatalog ??= buildMemoryCatalog();
  const slot = memoryCatalog.get(id);
  return !!slot && slot.eventId === eventId && slot.choices.has(choiceId);
}

