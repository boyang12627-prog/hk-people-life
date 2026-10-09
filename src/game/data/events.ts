import type { SceneId, State } from "../types";
import { choice, mem, type Card, type Choice } from "../choice";
import { friendFollow, knowsKit } from "../freedom";
import { ARC_AH_KIT, ENC_ORANGES, echoOpen } from "../narrative";
import { quietCopy, slotIs } from "../world";
import { gapLine, heardNews, newsCold, picked, selectSpoken, type Spoken } from "../speak";
import { act, say, toSequence, type SceneLine } from "../scene";

/** One file owns childhood prose. Add an event here; do not add a switch in the reducer. */
export const CHILDHOOD_EVENT_IDS = [
  "MINI_84_TOY",
  "MINI_85_RAIN",
  "MINI_85_GRANDMA",
  "MINI_85_DAD",
  "MINI_85_TV",
  "MINI_85_KIT_WAIT",
  "MINI_85_ORANGE",
  "MINI_85_NEIGHBOR",
  "MINI_85_MOM_ALONE",
  "MINI_85_ALONE_PODIUM",
  "MINI_QUIET",
  "MINI_86_ESTATE",
  "MINI_86_TV",
  "MINI_86_HELP",
  "EVT_1984_NEWS_01",
  "EVT_1984_FAMILY_02",
  "EVT_1985_SCHOOL_01",
  "EVT_1985_FAMILY_03",
  "EVT_1985_FRIEND_04",
  "EVT_1986_SKILL_05",
  "EVT_1986_FAMILY_06",
  "EVT_1986_MARKET_07",
  "EVT_1986_ECHO_08",
  "EVT_1986_FRIEND_09",
  "EVT_1986_DAD_NIGHT",
  "EVT_1988_PEN_01",
  "EVT_1988_EXAM_01",
  "EVT_1988_DAD_SIGN",
] as const;

export type StaticEvent = {
  id: string;
  scene: SceneId;
  kicker: string;
  title: string;
  /** Narration only. A static event with speech must become a dynamic card with say(). */
  lines: string[];
  choices: Choice[];
};

/** A fully static event. Dynamic cards stay as functions below. The reducer still does not see this. */
export function renderStatic(event: StaticEvent): { card: Card; choices: Choice[] } {
  return {
    card: { scene: event.scene, kicker: event.kicker, title: event.title, sequence: toSequence(event.lines) },
    choices: [...event.choices],
  };
}

/**
 * Pure prose. cardFor / choicesFor return these before the dynamic switch.
 * EVT_STATIC_LAMP is a pipeline sample: not in YEARS, not a new chapter.
 */
export const STATIC_EVENTS: Record<string, StaticEvent> = {
  MINI_84_TOY: {
    id: "MINI_84_TOY",
    scene: "market",
    kicker: "日常 · 1984",
    title: "士多有一輛新車",
    lines: ["玻璃櫃裡有一輛新車。你沒有零用錢。", "媽媽已經走開兩步。"],
    choices: [
      choice("A", "拉住媽媽要看", "dream", { derived: { STATE_MOOD: 2 }, npc: { NPC_MOM_01: { trust: -1 } } }, "你拉住她。媽媽歎了口氣，讓你看十秒。「看完要走。」"),
      choice(
        "B",
        "自己看完就走",
        "think",
        { derived: { INDEPENDENT_THOUGHT: 1, STATE_MOOD: 1 }, equipment: ["EQP_PLASTIC_WATCH"] },
        "你看清楚那輛車。沒有人買。櫃台旁邊有一隻不會走的塑膠錶。阿姨說：「呢個唔使錢。」你把它握在手裡，再追上媽媽。",
        mem("MEM_TOY_WATCH", "MINI_84_TOY", "B", "NPC_AUNT_01", "kept", "你沒有買那輛車。手上多了一隻不會走的塑膠錶。"),
      ),
      choice("C", "不看，跟著走", "reality", { derived: { VALUE_REALITY: 1, STATE_FAMILY_HARMONY: 1, STATE_MOOD: -1 } }, "你跟著走。車留在櫃裡。媽媽沒發現你停過。"),
    ],
  },
  MINI_85_RAIN: {
    id: "MINI_85_RAIN",
    scene: "home",
    kicker: "日常 · 1985",
    title: "下大雨",
    lines: ["你下了樓。下大雨。", "平台沒有人。對面看不見。你站了一陣，然後回家。"],
    choices: [
      choice("A", "畫畫", "dream", { derived: { VALUE_DREAM: 2, STATE_MOOD: 1 }, counter: { ART_PROGRESS: 1 } }, "雨下得很大。你把紙塗到邊上都有顏色。"),
      choice("B", "聽收音機", "think", { derived: { VALUE_REALITY: 1, INDEPENDENT_THOUGHT: 1, STATE_PEACE: 1 }, counter: { MIND_PROGRESS: 1 } }, "收音機轉台，有人講，有人唱。你不明白，但你聽著。你記住那個節奏。"),
      choice("C", "睡一陣", "balance", { derived: { STATE_STRESS: -4, STATE_PEACE: 2, STATE_MOOD: 1 } }, "你睡了。雨聲遠了。這個下午沒有什麼趕著要做。"),
    ],
  },
  MINI_85_GRANDMA: {
    id: "MINI_85_GRANDMA",
    scene: "home",
    kicker: "日常 · 1985",
    title: "嫲嫲揭開煲蓋",
    lines: ["湯很香。嫲嫲說，以前這棟樓要自己走樓梯。", "碗很熱，你用手托住。"],
    choices: [
      choice("A", "聽她講", "reality", { npc: { NPC_GRAND_01: { trust: 3, relation: 2 } }, derived: { INDEPENDENT_THOUGHT: 1 } }, "你聽。你不知道全部，但你知道這棟樓以前更難走。", mem("MEM_GRAND_DAY", "MINI_85_GRANDMA", "A", "NPC_GRAND_01", "listen", "你留在廳裡聽嫲嫲講以前。")),
      choice("B", "走去玩", "dream", { derived: { STATE_MOOD: 2 }, npc: { NPC_GRAND_01: { relation: -1 } } }, "你留下碗湯，走到玩具那裡。嫲嫲沒有叫你回來。", mem("MEM_GRAND_DAY", "MINI_85_GRANDMA", "B", "NPC_GRAND_01", "left", "湯還在。你聽了一半就走。")),
      choice("C", "問為什麼要走樓梯", "think", { derived: { INDEPENDENT_THOUGHT: 2 }, npc: { NPC_GRAND_01: { trust: 2 } } }, "嫲嫲笑：「以前邊有咁多掣㗎。」你記住「以前」兩個字。", mem("MEM_GRAND_DAY", "MINI_85_GRANDMA", "C", "NPC_GRAND_01", "ask", "你問了以前為什麼要走樓梯。")),
    ],
  },
  MINI_85_DAD: {
    id: "MINI_85_DAD",
    scene: "home",
    kicker: "日常 · 1985",
    title: "爸爸回來",
    lines: ["星期日你在家。門開了。", "爸爸把鞋子脫在門口。他還沒去洗澡。"],
    choices: [
      choice(
        "A",
        "走過去",
        "reality",
        { npc: { NPC_DAD_01: { trust: 2, relation: 1 } } },
        "你走過去。他的手在你頭上停了一下。他說自己很累，但你在家。",
        mem("MEM_DAD_HOME", "MINI_85_DAD", "A", "NPC_DAD_01", "home", "你在家的時候，爸爸回來過。", 2),
      ),
      choice("B", "繼續玩", "dream", { derived: { STATE_MOOD: 1 }, npc: { NPC_DAD_01: { relation: -1 } } }, "你沒有過去。他看見你在，就進了房。", mem("MEM_DAD_HOME", "MINI_85_DAD", "B", "NPC_DAD_01", "saw", "爸爸回來過。你在玩，沒有過去。")),
      choice("C", "問他今天去了哪裡", "think", { derived: { INDEPENDENT_THOUGHT: 1 }, npc: { NPC_DAD_01: { trust: 1 } } }, "他說上班。你不知道上班在哪裡。他還是摸了你一下。", mem("MEM_DAD_HOME", "MINI_85_DAD", "C", "NPC_DAD_01", "ask", "爸爸回來過。你問他去了哪裡。")),
    ],
  },
  MINI_85_TV: {
    id: "MINI_85_TV",
    scene: "home",
    kicker: "日常 · 1985",
    title: "電視又開著",
    lines: ["你留在家。電視開著，沒有人在看。", "畫面裡很遠的人。去年飯桌也是這樣。你還是不知道他們在做什麼。"],
    choices: [
      choice("A", "坐著看", "think", { derived: { INDEPENDENT_THOUGHT: 1 } }, "你看完他們消失。你沒有人可以問。"),
      choice("B", "把聲音關小", "reality", { derived: { STATE_PEACE: 1, VALUE_REALITY: 1 } }, "你把聲音關小。畫面還在。屋裡靜了一點。"),
      choice("C", "轉去玩", "dream", { derived: { STATE_MOOD: 1, VALUE_DREAM: 1 } }, "你沒有再看。電視自己開著。"),
    ],
  },
  MINI_QUIET: {
    id: "MINI_QUIET",
    scene: "home",
    kicker: "日常",
    title: "沒有人在",
    lines: ["這個下午，你去了的地方沒有人。", "你坐了一陣。一隻麻雀飛過。然後你回家。"],
    choices: [
      choice("A", "再坐一陣", "think", { derived: { STATE_PEACE: 1 } }, "你又坐了一陣。仍然沒有人。你回家。"),
      choice("B", "看那隻麻雀", "dream", { derived: { STATE_MOOD: 1 } }, "麻雀飛走了。你沒有事做，可是你看完了。"),
      choice("C", "回家", "reality", { derived: { STATE_FAMILY_HARMONY: 1 } }, "你回家。這個下午就這樣過了。"),
    ],
  },
  MINI_86_ESTATE: {
    id: "MINI_86_ESTATE",
    scene: "estate",
    kicker: "日常 · 1986",
    title: "平台有人叫你",
    lines: ["有個孩子在平台揮手。你未必認識他。", "媽媽在樓上晾衣服，還沒叫你回去。"],
    choices: [
      choice("A", "揮回去", "dream", { derived: { STATE_MOOD: 2, VALUE_DREAM: 1 } }, "你揮回去。你還不知道他的名字，但你應了他。"),
      choice("B", "站到一邊看", "think", { derived: { INDEPENDENT_THOUGHT: 1, STATE_PEACE: 1 } }, "你看別人怎麼玩。你還沒加入，但你記住怎麼玩。"),
      choice("C", "上去找媽媽", "reality", { derived: { STATE_FAMILY_HARMONY: 2, STATE_MOOD: -1 } }, "你走回樓上。媽媽的衣服還沒乾。你站在她旁邊。"),
    ],
  },
  MINI_86_TV: {
    id: "MINI_86_TV",
    scene: "home",
    kicker: "日常 · 1986",
    title: "電視又開著",
    lines: ["飯還沒吃完。電視裡有人唱歌，有人說話。", "爸爸還沒出聲叫你轉台。"],
    choices: [
      choice("A", "再看一會兒", "dream", { derived: { STATE_MOOD: 2, VALUE_DREAM: 1 } }, "你看。唱歌比新聞容易聽。飯涼得慢。"),
      choice("B", "吃完再看", "reality", { derived: { VALUE_REALITY: 1, STATE_FAMILY_HARMONY: 1 } }, "你扒飯。電視繼續播。你選了碗先。"),
      choice("C", "問他們在看什麼", "think", { derived: { INDEPENDENT_THOUGHT: 1 }, primary: { STAT_SPEECH: 1 } }, "爸爸答得很短：「唱歌。」你知道不只是唱歌，但你問過。"),
    ],
  },
  MINI_86_HELP: {
    id: "MINI_86_HELP",
    scene: "corridor",
    kicker: "日常 · 1986",
    title: "塑膠袋太重",
    lines: ["媽媽兩隻手都提著袋子。走廊的燈黃黃的。", "她沒有叫你，但她走得很慢。"],
    choices: [
      choice("A", "伸手托住一袋", "reality", { derived: { STATE_FAMILY_HARMONY: 2, VALUE_REALITY: 1 }, primary: { STAT_STR: 1 }, tags: ["TAG_RESPONSIBILITY"] }, "袋帶勒手。媽媽看你一眼，沒有講大道理。"),
      choice("B", "先跑去開門", "balance", { derived: { STATE_FAMILY_HARMONY: 1, VALUE_DREAM: 1, STATE_STRESS: 1 } }, "你跑去按燈。袋子仍然是她提。你只是開了門。"),
      choice("C", "當作沒看見", "dream", { derived: { STATE_MOOD: 1, STATE_FAMILY_HARMONY: -1 } }, "你看著牆上那幅畫。媽媽自己把袋子放下。她沒有罵你。"),
    ],
  },
  EVT_STATIC_LAMP: {
    id: "EVT_STATIC_LAMP",
    scene: "corridor",
    kicker: "試寫 · 未進年份",
    title: "走廊的燈",
    lines: ["燈黃黃的。媽媽還沒叫你。", "袋子放在腳邊。門還沒開。"],
    choices: [
      choice("A", "等她", "reality", { derived: { STATE_FAMILY_HARMONY: 1 } }, "你等。她叫了你，你才走。"),
      choice("B", "自己按燈", "dream", { derived: { STATE_MOOD: 1 } }, "你按了燈。走廊亮了一點。"),
      choice("C", "問為什麼還不走", "think", { derived: { INDEPENDENT_THOUGHT: 1 } }, "你問了。她說再等一會兒。"),
    ],
  },
  EVT_1988_PEN_01: {
    id: "EVT_1988_PEN_01",
    scene: "study",
    kicker: "1988 · 小息",
    title: "樓梯上的筆",
    lines: ["小息。樓梯轉角有一支原子筆。", "不是你的。上面沒有名字。"],
    choices: [
      choice(
        "A",
        "拿去問坐你旁邊的人",
        "reality",
        { npc: { NPC_FRIEND_01: { trust: 2, relation: 2 } }, skills: ["SKL_13"], equipment: ["EQP_BALLPOINT"] },
        "你問阿傑是不是他的。他搖頭，說這支是多出來的。「你拿去用啦。」筆芯有一點深。",
        mem("MEM_BALLPOINT", "EVT_1988_PEN_01", "A", "NPC_FRIEND_01", "kept", "你問過他是不是他的。他說這支是多出來的，你拿去用。"),
      ),
      choice("B", "不去碰它", "balance", { derived: { STATE_PEACE: 1 } }, "你沒有撿。筆還在那裡。你上了樓。"),
      choice(
        "C",
        "自己放進筆盒",
        "dream",
        { derived: { STATE_MOOD: 1 }, npc: { NPC_FRIEND_01: { trust: -2 } } },
        "你收進筆盒。沒有人問。你寫字的時候，手心有一點熱。",
      ),
    ],
  },
  EVT_1988_EXAM_01: {
    id: "EVT_1988_EXAM_01",
    scene: "study",
    kicker: "1988 · 測驗",
    title: "紙反過來了",
    lines: ["老師把紙反過來。", "你聽見筆尖。你還不知道自己寫不寫得完。"],
    choices: [
      choice("A", "由第一題開始寫", "reality", {}, "你由第一題寫。後面的題，你還沒看。", undefined, "safe", undefined, "BTL_PRIMARY_EXAM"),
      choice("B", "先看整張卷", "think", {}, "你先翻到最後一頁。題很多。", undefined, "curious", undefined, "BTL_PRIMARY_EXAM"),
      choice("C", "看看旁邊的人", "dream", {}, "旁邊有人已經在寫。你要自己落筆。", undefined, "social", undefined, "BTL_PRIMARY_EXAM"),
    ],
  },
};

export const DAILY_STATIC_IDS = ["MINI_84_TOY", "MINI_85_RAIN", "MINI_85_GRANDMA", "MINI_85_DAD", "MINI_85_TV", "MINI_QUIET", "MINI_86_ESTATE", "MINI_86_TV", "MINI_86_HELP"] as const;

type Line = string | SceneLine;

/** At most two remembered lines under any one card. Same theme is said once. */
export const ECHO_CAP = 2;

/** Familiar only when the player has really met the auntie: the toy-shop watch, the oranges, or the neighbour stop. */
export function variantOf1986Market(state: State) {
  const met = ["MEM_TOY_WATCH", "MEM_ORANGE", "MEM_NEIGHBOR"].some((id) => state.memories.some((item) => (item.memoryTypeId ?? item.id) === id));
  return met && state.counter.REL_LOCAL_MARKET >= 20 ? "familiar" : "first_meet";
}

/** What an event author writes. A plain string is narration; speech is `say(...)`. */
type RawCard = { scene: SceneId; kicker: string; title: string; lines: readonly Line[] };

function spokenLine(item: Spoken): Line {
  return item.speaker ? say(item.speaker, item.text, item.register) : item.text;
}

/** The card a screen draws. `sequence` names who says each line; nothing is inferred from punctuation. */
export function cardFor(id: string, state: State): Card {
  const raw = rawCard(id, state);
  return { scene: raw.scene, kicker: raw.kicker, title: raw.title, sequence: toSequence(raw.lines) };
}

function rawCard(id: string, state: State): RawCard {
  if (id === "MINI_QUIET") {
    const year = state.yearIndex === 2 ? 1986 : 1985;
    const copy = quietCopy(state.spent, year);
    if (copy) return { scene: copy.scene, kicker: "日常", title: "沒有人在", lines: copy.lines };
  }
  if (id === "MINI_QUIET" && state.yearIndex === 1 && state.spent[0] === "ACT_MARKET" && state.spent.length === 1) {
    return {
      scene: "market",
      kicker: "1985 · 星期六",
      title: "走了一圈",
      lines: ["你跟著媽媽走了一圈。", "沒有人叫你。地面是濕的。", "菜買完，你們回家。"],
    };
  }
  if (id === "MINI_85_GRANDMA" && state.npcDays.NPC_GRAND_01?.missedPlayer) {
    const card = STATIC_EVENTS.MINI_85_GRANDMA;
    return { scene: card.scene, kicker: card.kicker, title: card.title, lines: ["你昨天不在。那煲湯放涼了，今天她再熱過一次。她還是坐在那裡。", ...card.lines] };
  }
  if (id === "EVT_1988_PEN_01") {
    const card = STATIC_EVENTS.EVT_1988_PEN_01;
    return { scene: card.scene, kicker: card.kicker, title: card.title, lines: [...card.lines, knowsKit(state) ? "坐你旁邊的是阿傑。" : "坐你旁邊的男孩叫阿傑。你們還不熟。"] };
  }
  if (id === "MINI_85_DAD" && state.npcDays.NPC_DAD_01?.todayOutcome === "overtime") {
    const card = STATIC_EVENTS.MINI_85_DAD;
    return { scene: card.scene, kicker: card.kicker, title: card.title, lines: ["他比平時晚。鞋子脫得很慢。", "爸爸把鞋子脫在門口。他還沒去洗澡。"] };
  }
  const staticEvt = STATIC_EVENTS[id];
  if (staticEvt) return { scene: staticEvt.scene, kicker: staticEvt.kicker, title: staticEvt.title, lines: staticEvt.lines };
  const gender = state.gender ?? "girl";
  const name = state.name?.trim() ?? "";
  const kitKnown = knowsKit(state);
  switch (id) {
    case "MINI_85_KIT_WAIT": {
      const back = state.npcDays.NPC_FRIEND_01?.nextPlan === "return" && echoOpen(ARC_AH_KIT, "next-day");
      if (back) {
        return {
          scene: "estate",
          kicker: "1985 · 星期日",
          title: "他已經在玩",
          lines: ["你下了樓。雨還在下。平台上那個抱紅球的孩子已經在玩。", "不是你去找他。他今天自己又來了。", "他看見你，先說他叫阿傑。", say("阿傑", "你昨天沒有下來。")],
        };
      }
      const home = state.spent[1] !== "ACT_ESTATE";
      return {
        scene: home ? "home" : "estate",
        kicker: "1985 · 星期日",
        title: "他來找你",
        lines: home
          ? ["門開了一下。阿傑站在外面。", "他沒有帶球上來。他昨天和你玩過，今天自己來了。"]
          : ["雨還在下。阿傑站在走廊底。", "他昨天和你玩過。今天不是你去找他，是他來了。"],
      };
    }
    case "EVT_1984_NEWS_01": {
      const cold = newsCold(state);
      const lines: Line[] = cold
        ? ["電視聲很大，蓋過吃飯的聲音。媽媽沒有夾魚給你。", "畫面裡有人握手。沒有人告訴你那是誰。", "沒有人向你解釋。你聽得出他們說得很認真。"]
        : [
            "電視裡講著很遠的事。你只知道今天有魚。",
            "畫面裡有人握手。你不知道他們是誰。",
            say("媽媽", "先吃飯。這麼遠的事，等一陣再說。"),
            act("爸爸低聲說。"),
            say("爸爸", "最要緊是一家人安穩。"),
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
            ? ["媽媽今天早收工。地上有玩具，她還有力氣對你笑。", say("媽媽", "再玩一陣，我們一起收，好不好？")]
            : ["媽媽還沒脫鞋就坐下了。", say("媽媽", "等一等。媽媽今日好累。"), "地上還有你沒有收的玩具。"],
      };
    case "EVT_1985_SCHOOL_01": {
      const mom = picked(state, "MEM_MOM_TIRED");
      const pronoun = gender === "boy" ? "他" : "她";
      const metKit = picked(state, "MEM_KIT_WAIT") === "A" || picked(state, "MEM_RED_BALL") === "B";
      const lines: Line[] = [
        act("老師蹲下來。"),
        say("老師", "不用怕，進去和其他小朋友玩。你跟著我讀兩個字就行。"),
        say("媽媽", metKit ? `${pronoun}平時很乖。在樓下也肯跟人玩。` : `${pronoun}平時很乖，只是怕生。`),
        kitKnown ? "阿傑也在門裡。他手上拿著紅球。" : "你看見一個孩子手上拿著紅球。",
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
    case "MINI_85_ORANGE":
      return {
        scene: "market",
        kicker: "1985 · 去街市的路上",
        title: "橙散了",
        lines: ["有幾顆橙滾到濕地上。", "圓圓的。你看著它們。媽媽還在前面。"],
      };
    case "MINI_85_NEIGHBOR":
      return {
        scene: "market",
        kicker: "1985 · 街市",
        title: "媽媽停下來",
        lines: ["一個阿姨叫了媽媽的名字。", "她們說話。你看不見魚檔。", "地面是濕的。沒有人問你要不要聽。"],
      };
    case "MINI_85_MOM_ALONE":
      return {
        scene: "home",
        kicker: "1985 · 星期日",
        title: "菜已經提回來",
        lines: ["廚房有一袋菜。媽媽一個人提的。", "她坐著，沒有叫你。"],
      };
    case "MINI_85_ALONE_PODIUM":
      return {
        scene: "estate",
        kicker: "1985 · 星期日",
        title: "平台沒有他",
        lines: ["你下了樓。雨還在下。", "阿傑不在。", "另一個孩子在踢一個瓶蓋。你不認識他。"],
      };
    case "EVT_1985_FAMILY_03": {
      const news = picked(state, "MEM_NEWS_01");
      const lines: Line[] = ["你四歲，不懂說這些。你只知道新聞完了，家裡很靜。", "電視有人說「九七」。你不知道那是兩個數字，還是一件事。", act("爸爸把甜品推過來。"), say("爸爸", "沒事，吃甜品。"), "媽媽沒有笑，只是把電視聲調小。"];
      if (news === "A") lines.unshift("你記得去年也是這樣靜。你站過去聽過電視。");
      else if (news === "B") lines.unshift("爸爸看你一眼。去年你問過「將來」。他好像記得。");
      else if (news === "C") lines.unshift("去年你選了繼續吃飯。今年你也懂得自己吃甜品。");
      else lines.push("你沒聽過他們談將來，所以你不知道他們在安靜什麼。");
      return { scene: "home", kicker: "1985 · 新聞之後", title: "家裡很靜", lines };
    }
    case "EVT_1985_FRIEND_04": {
      const podium = slotIs(state.spent, "sat", "ACT_ESTATE");
      const watching = state.flags.includes("FLAG_CURIOUS_SCHOOL") && !state.npc.NPC_FRIEND_01.available;
      if (watching) {
        const where = podium ? "平台" : "課室";
        return {
          scene: podium ? "estate" : "kindy",
          kicker: "1985 · 課室",
          title: "你站著看",
          lines: ["你剛才自己走近那個球。這次你沒有再伸手。", `阿傑抱著紅球。你還不正式認識他。你站在${where}看。`],
        };
      }
      if (podium) {
        return {
          scene: "estate",
          kicker: "1985 · 平台",
          title: "平台上的紅球",
          lines: ["你下了樓。平台上那個孩子抱著紅球。", "他叫阿傑。", say("阿傑", "個波係我先攞到㗎！")],
        };
      }
      const school = picked(state, "MEM_FIRST_SCHOOL");
      const lines: Line[] = state.npc.NPC_FRIEND_01.available
        ? ["課室有個紅球。阿傑抱住不放。", say("阿傑", "個波係我先攞到㗎！"), "你也想碰。老師走開了。"]
        : ["有個孩子抱住紅球，你還不正式認識他。他叫阿傑。", say("阿傑", "個波係我先攞到㗎！"), "老師走開了。"];
      if (school.includes("fail") || school.includes("bad") || state.flags.includes("FLAG_RETRY_SCHOOL")) lines.unshift("你上次沒進到課室。今天球仍然在。");
      else if (school.startsWith("safe")) lines.unshift("你上次拉著媽媽。今天球在你前面。");
      else if (!state.flags.includes("FLAG_FIRST_SCHOOL")) lines.unshift("你還沒正式進過課室。這個球你沒玩過。");
      return { scene: "kindy", kicker: "1985 · 課室", title: "紅球", lines };
    }
    case "EVT_1986_FRIEND_09": {
      const follow = friendFollow(state);
      const onPodium = slotIs(state.spent, "sat", "ACT_ESTATE");
      const where = onPodium ? "平台上" : "走廊口";
      const place = kitKnown ? `${where}，阿傑抱著那個紅球。` : `${where}，那個抱紅球的孩子又在。他叫阿傑。`;
      const missed = state.npcDays.NPC_FRIEND_01;
      const lines: Line[] =
        follow === "ask" && missed?.missedPlayer && echoOpen(ARC_AH_KIT, "1y")
          ? [place, say("阿傑", "去年你沒有下來。"), missed.mood === "content" ? "他說自己也玩得很起勁。他在踢球。" : missed.mood === "left" ? "他說玩了一陣就走了。" : "他說後來坐在石凳上。"]
          : follow === "ask"
            ? [place, act("他看你。"), say("阿傑", "你見過呢個未？"), "去年你沒碰到它。"]
            : follow === "wary"
            ? [place, "他把球抱緊。他記得你不肯放。"]
            : follow === "invite"
              ? [place, act("他把球放在腳邊。"), say("阿傑", "今次唔係搶。你嚟唔嚟？")]
              : follow === "watch"
                ? [place, "你沒有走過去。你看他們怎麼輪。"]
                : [place, "去年你站著看過。這次他沒有把球抱那麼緊。"];
      if (state.memories.some((item) => item.id === "MEM_OTHER_CHILD")) lines.push("你沒有再見過那個沒有名字的孩子。");
      return { scene: onPodium ? "estate" : "corridor", kicker: "1986 · 阿傑", title: follow === "invite" ? "這次不是搶" : "紅球還在", lines };
    }
    case "EVT_1986_SKILL_05": {
      const lines: Line[] = [
        say("老師", state.counter.ART_PROGRESS >= 1 || state.skills.includes("SKL_03") ? "這孩子常常畫畫，可以參加小組。" : "這孩子可以試試畫畫小組。"),
        say("爸爸", "多學數數，實際點。"),
        act("媽媽看著你。"),
        say("媽媽", name ? `你自己想怎樣，${name}？` : "你自己想怎樣？"),
      ];
      const mom = picked(state, "MEM_MOM_TIRED");
      const spoken: Spoken[] = [];
      if (mom === "A") spoken.push({ priority: 0, text: "媽媽沒有幫你選。三歲那年你自己收過玩具。", theme: "mom" });
      if (state.flags.includes("FLAG_PARENT_EXPLAIN")) spoken.push({ priority: 0, text: "爸爸解釋過一次將來。今天他想你選實際的。", theme: "news" });
      const news = picked(state, "MEM_NEWS_01");
      if (news === "A") spoken.push({ priority: 0, text: "三歲那年你站過去聽電視。今天你也是聽完才選。", theme: "news" });
      if (news === "C") spoken.push({ priority: 0, text: "三歲那年電視說將來，你沒有問。今天新事物擺在面前，你也不急著選。", theme: "news" });
      if (state.flags.includes("FLAG_AVOID_CONFLICT")) spoken.push({ priority: 1, text: "你上次走開了。今天這個位子仍然是你自己坐。" });
      if (state.flags.includes("FLAG_CURIOUS_SCHOOL")) spoken.push({ priority: 1, text: "你第一天自己走近那個球。老師記得。" });
      if (state.skills.includes("SKL_05")) spoken.push({ priority: 1, text: "你懂得輪流玩。阿傑在，你可以叫他一組。" });
      if (state.flags.includes("FLAG_TOY_MONOPOLY") || state.npc.NPC_FRIEND_01.trust < 0) spoken.push({ priority: 1, text: "阿傑坐得很遠。紅球不在你的桌子上。" });
      else if (state.flags.includes("FLAG_SHARED_BALL") || state.npc.NPC_FRIEND_01.trust >= 5) spoken.push({ priority: 1, text: "阿傑招你過去坐。" });
      else if (!kitKnown) spoken.push({ priority: 2, text: "課室裡有個孩子帶著紅球。你還不認識他。課室只有你自己的位子。" });
      else if (!state.npc.NPC_FRIEND_01.available) spoken.push({ priority: 2, text: "你和阿傑還不算熟。課室只有你自己的位子。" });
      if (state.counter.ART_PROGRESS >= 2) spoken.push({ priority: 1, speaker: "老師", text: "不是今天才畫的。家裡的紙上也是顏色。" });
      else if (state.counter.MIND_PROGRESS >= 2) spoken.push({ priority: 1, speaker: "老師", text: "這孩子會跟著數到十。" });
      const lean = gapLine(state, "你看著顏色，多過數字。", "你先聽到爸爸說的。你知道「實際」兩個字。");
      if (lean) spoken.push({ priority: 2, text: lean });
      if (state.derived.INDEPENDENT_THOUGHT >= 50) spoken.push({ priority: 2, text: "你還沒問出口，已經自己想了兩句。沒有人聽見。" });
      if (state.npc.NPC_TEACH_01.trust >= 35) spoken.push({ priority: 2, text: "老師記得你自己走進課室。" });
      else if (state.flags.includes("FLAG_TEACHER_SLOW")) spoken.push({ priority: 2, text: "老師說得很慢，等你跟上。" });
      lines.push(...selectSpoken(spoken, ECHO_CAP).map(spokenLine));
      return { scene: "kindy", kicker: "1986 · 第一次選", title: "畫畫，還是數數？", lines };
    }
    case "EVT_1986_FAMILY_06": {
      const lines: Line[] = ["本來約好今天去公園。", "爸爸不是不想去。他的外套摺好，跟著又拆開。", say("爸爸", "今日要返工。"), act("他靜了一陣。"), say("爸爸", "下次吧。")];
      if (state.counter.NPC_MOM_STRESS >= 26) lines.push("媽媽沒有出聲幫你。她自己也還沒鬆下來。");
      else if (state.counter.NPC_MOM_STRESS < 20) lines.push(act("媽媽看你一眼，低聲說。"), say("媽媽", "下星期也可以。"));
      const mom = picked(state, "MEM_MOM_TIRED");
      const dadHome = state.memories.find((item) => (item.memoryTypeId ?? item.id) === "MEM_DAD_HOME");
      const spoken: Spoken[] = [];
      if (dadHome && state.npcDays.NPC_DAD_01?.todayOutcome === "overtime") spoken.push({ priority: 0, text: "去年星期日他很晚才回來，鞋子脫得很慢。今天他又要走。", theme: "dad" });
      else if (dadHome) spoken.push({ priority: 0, text: "去年星期日你在家，他累著回來過。今天他又要走。", theme: "dad" });
      if (mom === "A") spoken.push({ priority: 1, text: "你想起媽媽累的那天。今天累的是爸爸。", theme: "mom" });
      if (mom === "C") spoken.push({ priority: 1, text: "你懂得坐過去。三歲那年你也是這樣坐在媽媽旁邊。", theme: "mom" });
      if (state.flags.includes("FLAG_FAMILY_NEWS_SILENCE")) spoken.push({ priority: 1, text: "新聞之後沒有人出聲，你認得。", theme: "news" });
      if (picked(state, "MEM_MOM_ALONE") === "B") spoken.push({ priority: 2, text: "去年那袋菜你沒有拿。她沒有再叫你。", theme: "mom" });
      lines.push(...selectSpoken(spoken, ECHO_CAP).map(spokenLine));
      return { scene: "home", kicker: "1986 · 星期日", title: "爸爸說要上班", lines };
    }
    case "EVT_1986_DAD_NIGHT": {
      // Dad arc, beat 3 of 5. Only after the park was cancelled (MEM_DAD_WORK); see dadArc() in content.ts.
      const dad = picked(state, "MEM_DAD_WORK");
      const lines: Line[] = [
        dad === "A" ? "你玩回來的時候，他還沒回家。" : dad === "C" ? "早上你們留在家。他出門之前，摸過你的頭。" : "公園去不成。你說過「知道了」。",
        "那天晚上，爸爸很晚才回來。",
        act("他坐在門口脫鞋，脫了很久。", "家裡 · 門口"),
      ];
      const spoken: Spoken[] = [];
      if (picked(state, "MEM_DAD_HOME")) spoken.push({ priority: 0, text: "四歲那年，他也是這樣回來。", theme: "dad" });
      lines.push(...selectSpoken(spoken, ECHO_CAP).map(spokenLine));
      lines.push(say("爸爸", "還沒睡？"));
      return { scene: "home", kicker: "1986 · 那天晚上", title: "門口的鞋", lines };
    }
    case "EVT_1988_DAD_SIGN": {
      // Dad arc, beat 4 of 5. Needs the park (MEM_DAD_WORK) and a written paper (MEM_EXAM_PAPER).
      const paper = picked(state, "MEM_EXAM_PAPER");
      const night = picked(state, "MEM_DAD_LATE");
      const lines: Line[] = [
        "測驗卷要家長簽名。媽媽說，等爸爸回來才簽。",
        act("十點多，門開了。爸爸坐在門口脫鞋。", "家裡 · 晚上"),
        paper.includes("perfect") || paper.includes("win") ? "他看了分數，點一下頭。" : "他看了分數，沒有出聲。",
        act("他在最下面簽名，寫得很慢。"),
        say("爸爸", "寫完就好。"),
      ];
      const spoken: Spoken[] = [];
      if (night === "B") spoken.push({ priority: 0, text: "你記得他說過，等公司請到人。兩年了。", theme: "dad" });
      else if (night === "C") spoken.push({ priority: 0, text: "門口那對鞋換過了。新的那對，鞋底也開始薄了。", theme: "dad" });
      else if (night === "A") spoken.push({ priority: 0, text: "你又聽見他在門口坐了很久。", theme: "dad" });
      lines.splice(2, 0, ...selectSpoken(spoken, ECHO_CAP).map(spokenLine));
      return { scene: "home", kicker: "1988 · 晚上", title: "要家長簽名", lines };
    }
    case "EVT_1986_MARKET_07": {
      const orange = picked(state, "MEM_ORANGE");
      const remembered = echoOpen(ENC_ORANGES, "1y");
      const lines: Line[] =
        orange === "C" && remembered
          ? ["阿姨看見你，手停了一下。", "那條多出來的菜，她沒有放進來。", "她記得的不是一顆圓橙。她記得有個孩子拿了東西。"]
          : variantOf1986Market(state) === "first_meet"
            ? ["你跟著媽媽站了很久。這檔你還不熟。", "阿姨和媽媽說話，然後多塞一條菜進袋子。", "沒有人向你解釋，也沒有多收一毫子。"]
            : [say("阿姨", "又係你呀？高咗好多喎。"), say("媽媽", "多謝。"), "阿姨偷偷多塞一條菜進袋子。沒有人提錢。"];
      const spoken: Spoken[] = [];
      if (orange === "A" && remembered) spoken.push({ priority: 0, speaker: "阿姨", text: "舊年啲橙滾到你腳邊㗎。", theme: "aunt" });
      if (orange === "B" && remembered) spoken.push({ priority: 0, text: "阿姨沒有先看你。菜交到媽媽手上。", theme: "aunt" });
      if (picked(state, "MEM_NEIGHBOR") === "A") spoken.push({ priority: 1, text: "媽媽以為你不喜歡跟著來。你只是拉過她的衣袖。", theme: "mom" });
      if (state.skills.includes("SKL_03") || state.counter.ART_PROGRESS >= 3) spoken.push({ priority: 1, text: "你手指上有顏色。阿姨問你畫過這條菜沒有。", theme: "skill" });
      else if (state.skills.includes("SKL_12") || state.counter.MIND_PROGRESS >= 3) spoken.push({ priority: 1, speaker: "阿姨", text: "識唔識數呀？幫我數三條。", theme: "skill" });
      else if (state.skills.includes("SKL_10")) spoken.push({ priority: 1, text: "你看一看，兩邊檔都想看。時間不夠。", theme: "skill" });
      if (state.personalityTags.includes("TAG_RESPONSIBILITY") || state.primary.STAT_STR >= 6) spoken.push({ priority: 2, text: "你的手自己伸出去接袋子。", theme: "carry" });
      if (state.flags.includes("FLAG_HELPED_MOM_01")) spoken.push({ priority: 2, text: "媽媽不用叫你。三歲那年你自己收過玩具。", theme: "carry" });
      if (
        state.flags.includes("FLAG_FIRST_INTEREST_CHOICE") &&
        !state.skills.includes("SKL_03") &&
        !state.skills.includes("SKL_12") &&
        !state.skills.includes("SKL_10")
      ) {
        spoken.push({ priority: 2, text: "你問過為什麼一定要選。今天沒有人逼你選。", theme: "skill" });
      }
      lines.push(...selectSpoken(spoken, ECHO_CAP).map(spokenLine));
      return { scene: "market", kicker: "1986 · 街市", title: "多一條菜", lines };
    }
    case "EVT_1986_ECHO_08": {
      const lines: Line[] = ["你下過平台。今天你一直走到屋邨門口。", "外面比走廊亮。你其實只是想自己多走兩步。", "媽媽在後面。她還沒出聲，但你知道她看著。"];
      const news = picked(state, "MEM_NEWS_01");
      const dad = picked(state, "MEM_DAD_WORK");
      const spoken: Spoken[] = [];
      if (dad === "A") spoken.push({ priority: 0, text: "你自己去玩過。約定裂開過，今天他仍然不在。", theme: "dad" });
      else if (dad === "B") spoken.push({ priority: 0, text: "你答應過他去上班。今天公園還是去不成。", theme: "dad" });
      else if (dad === "C") spoken.push({ priority: 0, text: "你留過。今天你自己走，也記得那時候。", theme: "dad" });
      if (news === "C") spoken.push({ priority: 1, text: "三歲那年你顧著吃飯。今天這條路，沒有人推你。", theme: "news" });
      if (news === "B") spoken.push({ priority: 1, text: "你想再問一句。你問過一次將來。", theme: "news" });
      if (state.skills.includes("SKL_06")) spoken.push({ priority: 1, text: "你懂得陪家人。媽媽在後面，你可以走回去。", theme: "mom" });
      if (state.skills.includes("SKL_08")) spoken.push({ priority: 1, text: "袋子你提慣了。自己多走兩步，沒有那麼重。", theme: "carry" });
      if (state.flags.includes("FLAG_FAVOUR_QUESTION") || state.skills.includes("SKL_11")) spoken.push({ priority: 1, text: "你問過一份好意是不是要還。今天這條路，沒有人向你收錢。", theme: "favour" });
      if (state.flags.includes("FLAG_DAD_WILL_COMPENSATE")) spoken.push({ priority: 2, text: "他說遲些會補。今天這條路，他不在。", theme: "dad" });
      if (state.counter.WORLD_DAD_WORK_OCCURRENCES >= 2) spoken.push({ priority: 2, text: "爸爸今天又不在。家裡又靜下來。", theme: "dad" });
      if (state.flags.includes("FLAG_MARKET_KINDNESS")) spoken.push({ priority: 2, text: "阿姨塞過一條菜。外面沒有人伸手向你要錢。", theme: "favour" });
      if (state.npc.NPC_MOM_01.trust >= 75) spoken.push({ priority: 2, text: "媽媽的手伸在你後面，還沒拉你。", theme: "mom" });
      else if (state.npc.NPC_MOM_01.trust <= 65) spoken.push({ priority: 2, text: "媽媽站得遠。她一出聲你就聽到。", theme: "mom" });
      if (state.primary.STAT_FATE >= 6) spoken.push({ priority: 2, text: "你踏出去的那一下，她遲了半秒才叫你。", theme: "mom" });
      lines.push(...selectSpoken(spoken, ECHO_CAP).map(spokenLine));
      return { scene: "estate", kicker: "1986 · 屋邨門口", title: "如果我自己走呢", lines };
    }
    default:
      return { scene: "home", kicker: "日常", title: "一個下午", lines: ["這個下午就這樣過了。"] };
  }
}

function quietAtMarketWithMom(state: State) {
  return state.yearIndex === 1 && state.spent[0] === "ACT_MARKET" && state.spent.length === 1 && !quietCopy(state.spent, 1985);
}

export function choicesFor(id: string, state: State): Choice[] {
  if (id === "MINI_QUIET" && quietAtMarketWithMom(state)) {
    return [
      choice("A", "再看一眼魚檔", "think", { derived: { STATE_PEACE: 1 } }, "魚在盆裡跳了一下。媽媽叫你，你跟上去。"),
      choice("B", "蹲下去看地上的水", "dream", { derived: { STATE_MOOD: 1 } }, "地上的水映著燈。你看完了，才跟上去。"),
      choice("C", "跟著媽媽回家", "reality", { derived: { STATE_FAMILY_HARMONY: 1 } }, "你跟著媽媽回家。這個下午就這樣過了。"),
    ];
  }
  const staticEvt = STATIC_EVENTS[id];
  if (staticEvt) return renderStatic(staticEvt).choices;
  const heard = heardNews(state);
  switch (id) {
    case "MINI_85_ORANGE":
      return [
        choice(
          "A",
          "它滾到腳邊",
          "balance",
          { npc: { NPC_AUNT_01: { trust: 2, relation: 1 } }, derived: { STATE_MOOD: -1 } },
          "它滾到你腳邊。你蹲下去。橙是濕的。媽媽在前面等。你少了看魚的時間。",
          mem("MEM_ORANGE", "MINI_85_ORANGE", "A", "NPC_AUNT_01", "help", "那些橙滾到你腳邊。你把它們撿起來。"),
        ),
        choice(
          "B",
          "拉住媽媽",
          "balance",
          {},
          "你拉她的手。你沒有停。橙還在地上。",
          mem("MEM_ORANGE", "MINI_85_ORANGE", "B", "NPC_AUNT_01", "pass", "那些橙在地上。你拉著媽媽走了。"),
        ),
        choice(
          "C",
          "我要一顆",
          "dream",
          { derived: { STATE_MOOD: 2 }, npc: { NPC_AUNT_01: { relation: -2, trust: -1 } } },
          "你拿了一顆。很酸。她看見了，沒有出聲。其餘的還在地上。",
          mem("MEM_ORANGE", "MINI_85_ORANGE", "C", "NPC_AUNT_01", "keep", "那些橙散了。你只拿走一顆。"),
        ),
      ];
    case "MINI_85_NEIGHBOR":
      return [
        choice("A", "拉她的衣袖", "dream", { derived: { STATE_MOOD: -1 }, npc: { NPC_MOM_01: { relation: -1 } } }, "你拉她。她說等一下。魚檔你還是看不見。", mem("MEM_NEIGHBOR", "MINI_85_NEIGHBOR", "A", "NPC_MOM_01", "pull", "你拉過媽媽的衣袖。她以為你不想留在街市。")),
        choice("B", "看著她們", "think", { derived: { INDEPENDENT_THOUGHT: 1 } }, "你看著。那個阿姨笑了一下。你不知道她們在說什麼。"),
        choice("C", "蹲下去看水", "balance", { derived: { STATE_MOOD: 1 } }, "地面是涼的。你的手濕了。她們還在說。"),
      ];
    case "MINI_85_ALONE_PODIUM":
      return [
        choice("A", "坐下來", "balance", { derived: { STATE_MOOD: -1 } }, "你坐下。雨打在臉上。那個孩子沒有叫你。", mem("MEM_OTHER_CHILD", "MINI_85_ALONE_PODIUM", "A", "", "sit", "阿傑不在。你在雨裡坐了一陣。那個孩子沒有名字。")),
        choice("B", "看他踢", "think", { derived: { INDEPENDENT_THOUGHT: 1 } }, "瓶蓋滾來滾去。你看完了。你還是不知道他叫什麼。", mem("MEM_OTHER_CHILD", "MINI_85_ALONE_PODIUM", "B", "", "watch", "阿傑不在。你看另一個孩子踢瓶蓋。你沒有問名字。")),
        choice("C", "回家", "reality", { derived: { STATE_FAMILY_HARMONY: 1 } }, "你回家。平台還在下雨。", mem("MEM_OTHER_CHILD", "MINI_85_ALONE_PODIUM", "C", "", "home", "你去了平台。阿傑不在。你回家了。")),
      ];
    case "MINI_85_MOM_ALONE":
      return [
        choice(
          "A",
          "幫她拿出來",
          "reality",
          { npc: { NPC_MOM_01: { trust: 1 } }, derived: { STATE_FAMILY_HARMONY: 1 } },
          "菜是涼的。你一件一件拿出來。她的手空了一點。",
          mem("MEM_MOM_ALONE", "MINI_85_MOM_ALONE", "A", "NPC_MOM_01", "unpack", "她一個人把菜提回來。你幫她拿出來。"),
        ),
        choice(
          "B",
          "走去玩",
          "dream",
          { derived: { STATE_MOOD: 1 }, npc: { NPC_MOM_01: { relation: -1 } } },
          "你沒有過去。袋子一直放在廚房。",
          mem("MEM_MOM_ALONE", "MINI_85_MOM_ALONE", "B", "NPC_MOM_01", "leave", "她一個人把菜提回來。你去玩了。"),
        ),
        choice(
          "C",
          "問重不重",
          "think",
          { derived: { INDEPENDENT_THOUGHT: 1 } },
          "她說還好。你看得出不是還好。你沒有再問。",
          mem("MEM_MOM_ALONE", "MINI_85_MOM_ALONE", "C", "NPC_MOM_01", "ask", "她一個人把菜提回來。你問了，她說還好。"),
        ),
      ];
    case "MINI_85_KIT_WAIT": {
      const back = state.npcDays.NPC_FRIEND_01?.nextPlan === "return" && echoOpen(ARC_AH_KIT, "next-day");
      if (back) {
        return [
          choice("A", "過去一起玩", "balance", { npc: { NPC_FRIEND_01: { relation: 1, trust: 1 } } }, "你過去。他說昨天等過你。球仍然在轉。", mem("MEM_KIT_WAIT", "MINI_85_KIT_WAIT", "A", "NPC_FRIEND_01", "meet", "那個星期日他已經在平台。他說你星期六沒有下來。你過去了。")),
          choice("B", "說昨天沒有下來", "reality", {}, "你說你昨天沒有下來。他點一下頭，沒有再問。", mem("MEM_KIT_WAIT", "MINI_85_KIT_WAIT", "B", "NPC_FRIEND_01", "later", "他說你星期六沒有下來。你承認了。")),
          choice("C", "站遠一點", "dream", { npc: { NPC_FRIEND_01: { relation: -1 } } }, "你站遠。他看了你一眼，繼續玩。", mem("MEM_KIT_WAIT", "MINI_85_KIT_WAIT", "C", "NPC_FRIEND_01", "missed-him", "他說你星期六沒有下來。你站遠了。")),
        ];
      }
      return [
        choice(
          "A",
          "出去見他",
          "balance",
          { npc: { NPC_FRIEND_01: { relation: 1, trust: 1 } } },
          "你出去。他說昨天那個球還在。你們沒有再搶。",
          mem("MEM_KIT_WAIT", "MINI_85_KIT_WAIT", "A", "NPC_FRIEND_01", "meet", "星期日他來找你。你出去見了他。"),
        ),
        choice(
          "B",
          "說今天不行",
          "reality",
          {},
          "你說今天不行。他應了一聲，沒有再約。",
          mem("MEM_KIT_WAIT", "MINI_85_KIT_WAIT", "B", "NPC_FRIEND_01", "later", "星期日他來找你。你說今天不行。"),
        ),
        choice(
          "C",
          "當作沒聽見",
          "dream",
          { npc: { NPC_FRIEND_01: { relation: -1 } } },
          "你沒有出聲。他等了一陣，走了。",
          mem("MEM_KIT_WAIT", "MINI_85_KIT_WAIT", "C", "NPC_FRIEND_01", "missed-him", "星期日他來找你。你沒有出聲。"),
        ),
      ];
    }
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
          "你蹲下來，把玩具車推進盒子。你本來想玩。媽媽透了口氣。你懂得自己收拾玩具。",
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
          "你坐上地毯，沒有叫她做事。媽媽摸了你的頭一下，就收回手。你沒有做什麼，只是在她旁邊。",
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
          undefined,
          "BTL_KINDY_DOOR",
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
          undefined,
          "BTL_KINDY_DOOR",
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
          undefined,
          "BTL_KINDY_DOOR",
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
    case "EVT_1985_FRIEND_04": {
      const watching = state.flags.includes("FLAG_CURIOUS_SCHOOL") && !state.npc.NPC_FRIEND_01.available;
      const podium = slotIs(state.spent, "sat", "ACT_ESTATE");
      if (watching) {
        return [
          choice(
            "A",
            "站著看",
            "think",
            { derived: { INDEPENDENT_THOUGHT: 1, STATE_PEACE: 1 } },
            podium ? "你在平台站著看。球在他手上。你沒有再伸手。" : "你站著看。球在他手上。你沒有再伸手。",
            mem("MEM_RED_BALL", "EVT_1985_FRIEND_04", "A", "NPC_FRIEND_01", "watch", "你看過那個紅球。你沒有伸手。", 2),
          ),
          choice(
            "B",
            "問他輪不輪到你",
            "balance",
            {
              npc: { NPC_FRIEND_01: { relation: 4, trust: 3, available: true } },
              flags: ["FLAG_SHARED_BALL"],
              skills: ["SKL_05"],
            },
            "你問了一句。他想了一下，把球推過來，再要回去。你開始認得他。",
            mem("MEM_RED_BALL", "EVT_1985_FRIEND_04", "B", "NPC_FRIEND_01", "share", "你後來會說「輪流」。有時你會捨不得，但你會說。", 2),
          ),
          choice(
            "C",
            "看完就走",
            "reality",
            { derived: { STATE_PEACE: 1 }, flags: ["FLAG_AVOID_CONFLICT"] },
            "你看完就走。他沒有叫你。你和他都還不熟。",
            mem("MEM_RED_BALL", "EVT_1985_FRIEND_04", "C", "NPC_FRIEND_01", "leave", "你避開爭執。避開之後，有時位子已經有人站了。"),
          ),
        ];
      }
      const where = podium ? "平台上" : "課室裡";
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
          `你在${where}搶到球。阿傑站到一邊。你玩得盡興，但他好一陣都沒再叫你。`,
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
          `你在${where}把球推回給他，再等自己那一輪。阿傑開始叫你的名字。`,
          mem("MEM_RED_BALL", "EVT_1985_FRIEND_04", "B", "NPC_FRIEND_01", "share", "你後來會說「輪流」。有時你會捨不得，但你會說。", 2),
        ),
        choice(
          "C",
          "走開，不要吵",
          "reality",
          { derived: { STATE_PEACE: 1 }, flags: ["FLAG_AVOID_CONFLICT"] },
          `你離開${where.slice(0, 2)}。球留在他那裡。你和他都還不熟。`,
          mem("MEM_RED_BALL", "EVT_1985_FRIEND_04", "C", "NPC_FRIEND_01", "leave", "你避開爭執。避開之後，有時位子已經有人站了。"),
        ),
      ];
    }
    case "EVT_1986_FRIEND_09": {
      const follow = friendFollow(state);
      if (follow === "ask") {
        return [
          choice("A", "說沒有見過", "reality", { npc: { NPC_FRIEND_01: { relation: 1, trust: 1 } } }, "你說沒有。他點一下頭，沒有再問。球仍然在他手上。", mem("MEM_FRIEND_AGAIN", "EVT_1986_FRIEND_09", "A", "NPC_FRIEND_01", "ask", "他問過你有沒有見過那個球。你說沒有。", 2)),
          choice("B", "問能不能一起玩", "balance", { npc: { NPC_FRIEND_01: { relation: 4, trust: 3, available: true } }, flags: ["FLAG_SHARED_BALL"], skills: ["SKL_05"] }, "你問了一句。他這次沒有把球抱那麼緊。你們輪了一輪。", mem("MEM_FRIEND_AGAIN", "EVT_1986_FRIEND_09", "B", "NPC_FRIEND_01", "share", "去年沒碰到的球，今年你問過能不能一起玩。", 2)),
          choice("C", "當沒聽見", "dream", { flags: ["FLAG_AVOID_CONFLICT"], derived: { STATE_PEACE: 1 } }, "你沒有答。他抱著球走了。", mem("MEM_FRIEND_AGAIN", "EVT_1986_FRIEND_09", "C", "NPC_FRIEND_01", "leave", "他問過你。你沒有答。", 2)),
        ];
      }
      if (follow === "wary") {
        return [
          choice("A", "這次讓給他", "reality", { npc: { NPC_FRIEND_01: { relation: 2, trust: 2 } } }, "你沒有伸手。他看了你一陣，球仍然留在他那裡。他沒有走遠。", mem("MEM_FRIEND_AGAIN", "EVT_1986_FRIEND_09", "A", "NPC_FRIEND_01", "return", "你曾經不肯放的球，這次你沒有再搶。", 2)),
          choice("B", "再問一次能不能玩", "think", { npc: { NPC_FRIEND_01: { relation: -1 } }, derived: { STATE_STRESS: 1 } }, "你再問。他把球抱得更緊。這一次沒有輪到你。", mem("MEM_FRIEND_AGAIN", "EVT_1986_FRIEND_09", "B", "NPC_FRIEND_01", "hold", "你又問了一次。他記得你不肯放。", 2)),
          choice("C", "走開", "dream", { flags: ["FLAG_AVOID_CONFLICT"], derived: { STATE_PEACE: 1 } }, "你走開。他沒有叫你。", mem("MEM_FRIEND_AGAIN", "EVT_1986_FRIEND_09", "C", "NPC_FRIEND_01", "leave", "他抱緊那個球。你又走開了。", 2)),
        ];
      }
      if (follow === "invite") {
        return [
          choice("A", "來", "balance", { npc: { NPC_FRIEND_01: { relation: 3, trust: 2 } }, derived: { STATE_MOOD: 2 } }, "你過去。這一次沒有人搶。球放在腳邊，你們玩的是別的。", mem("MEM_FRIEND_AGAIN", "EVT_1986_FRIEND_09", "A", "NPC_FRIEND_01", "play", "他問你來不來。你去了。那一次不是搶球。", 2)),
          choice("B", "只是看", "think", { derived: { INDEPENDENT_THOUGHT: 1, STATE_PEACE: 1 } }, "你看。他玩了一陣，沒有催你。", mem("MEM_FRIEND_AGAIN", "EVT_1986_FRIEND_09", "B", "NPC_FRIEND_01", "watch", "他問你來不來。你看著，沒有馬上加入。", 2)),
          choice("C", "今天不想玩", "reality", { derived: { STATE_PEACE: 1 }, npc: { NPC_FRIEND_01: { relation: -1 } } }, "你說今天不玩。他應了一聲，沒有生氣。", mem("MEM_FRIEND_AGAIN", "EVT_1986_FRIEND_09", "C", "NPC_FRIEND_01", "leave", "他問你來不來。你說今天不玩。", 2)),
        ];
      }
      if (follow === "watch") {
        return [
          choice("A", "看完再走", "think", { derived: { INDEPENDENT_THOUGHT: 1, STATE_PEACE: 1 } }, "你看完他們怎麼輪，然後走。沒有人拉你。", mem("MEM_FRIEND_AGAIN", "EVT_1986_FRIEND_09", "A", "NPC_FRIEND_01", "watch", "你看過別人怎麼輪。你沒有每次都加入。", 2)),
          choice("B", "問能不能加入", "balance", { npc: { NPC_FRIEND_01: { relation: 3, trust: 2, available: true } }, skills: ["SKL_05"] }, "你問了一句。他們讓出一個位子。你這次加入了。", mem("MEM_FRIEND_AGAIN", "EVT_1986_FRIEND_09", "B", "NPC_FRIEND_01", "join", "你看了一陣，然後問過能不能加入。", 2)),
          choice("C", "當作沒看見", "dream", { flags: ["FLAG_AVOID_CONFLICT"], derived: { STATE_MOOD: 1 } }, "你從旁邊走過。球還在轉。", mem("MEM_FRIEND_AGAIN", "EVT_1986_FRIEND_09", "C", "NPC_FRIEND_01", "leave", "你又從旁邊走過一次。", 2)),
        ];
      }
      return [
        choice("A", "走過去", "balance", { npc: { NPC_FRIEND_01: { relation: 2, trust: 1, available: true } }, derived: { STATE_MOOD: 1 } }, "你走過去。他沒有把球藏起來。你們沒有搶。", mem("MEM_FRIEND_AGAIN", "EVT_1986_FRIEND_09", "A", "NPC_FRIEND_01", "meet", "去年你站著看。今年你走過去了。", 2)),
        choice("B", "還是看著", "think", { derived: { STATE_PEACE: 1, INDEPENDENT_THOUGHT: 1 } }, "你還是看。他看了你一眼，沒有催。", mem("MEM_FRIEND_AGAIN", "EVT_1986_FRIEND_09", "B", "NPC_FRIEND_01", "watch", "你又看了一年。你沒有馬上加入。", 2)),
        choice("C", "走開", "reality", { derived: { STATE_PEACE: 1 } }, "你走開。他沒有跟過來。", mem("MEM_FRIEND_AGAIN", "EVT_1986_FRIEND_09", "C", "NPC_FRIEND_01", "leave", "你又走開了一次。", 2)),
      ];
    }
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
            "和阿傑一組",
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
            flags: ["FLAG_DAD_WILL_COMPENSATE"],
          },
          "你自己去玩。開心了一點，但約定裂了。爸爸看著你，說遲些會補，今天補不到。",
          mem("MEM_DAD_WORK", "EVT_1986_FAMILY_06", "A", "NPC_DAD_01", "crack", "你記得公園去不成。你自己玩了，約定裂了。", 2),
        ),
        choice(
          "B",
          "知道了，你去上班",
          "reality",
          { derived: { VALUE_REALITY: 2, STATE_FAMILY_HARMONY: 1 }, npc: { NPC_DAD_01: { trust: 2 } } },
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
            skills: ["SKL_06"],
          },
          "公園不去了。你們留在家裡。去不成公園，但他出門之前，有他陪。",
          mem("MEM_DAD_WORK", "EVT_1986_FAMILY_06", "C", "NPC_DAD_01", "stay", "公園取消，你也懂得留下來陪人。", 2),
        ),
      ];
    case "EVT_1986_DAD_NIGHT":
      return [
        choice("A", "裝睡", "dream", { derived: { STATE_PEACE: 1 } }, "你閉上眼。他在門口又坐了一陣，才進房。", mem("MEM_DAD_LATE", "EVT_1986_DAD_NIGHT", "A", "NPC_DAD_01", "heard", "那晚他很晚回來。你裝睡，聽見他脫鞋。")),
        choice(
          "B",
          "問他下次是幾時",
          "think",
          { derived: { INDEPENDENT_THOUGHT: 1 }, npc: { NPC_DAD_01: { trust: 1 } } },
          "他想了一下。「等公司請到人。」他沒有說是哪一天。",
          mem("MEM_DAD_LATE", "EVT_1986_DAD_NIGHT", "B", "NPC_DAD_01", "ask", "你問過下次是幾時。他說，等公司請到人。", 2),
        ),
        choice("C", "幫他把鞋擺好", "reality", { derived: { STATE_FAMILY_HARMONY: 1 }, npc: { NPC_DAD_01: { relation: 1 } } }, "你把兩隻鞋擺齊。他看著你，沒有說話。鞋底很薄了。", mem("MEM_DAD_LATE", "EVT_1986_DAD_NIGHT", "C", "NPC_DAD_01", "shoes", "你替他把鞋擺好。鞋底很薄。")),
      ];
    case "EVT_1988_DAD_SIGN":
      return [
        choice("A", "等他簽完才睡", "reality", { derived: { STATE_FAMILY_HARMONY: 1 } }, "你站在旁邊等。他把卷交回給你，叫你去睡。", mem("MEM_DAD_SIGN", "EVT_1988_DAD_SIGN", "A", "NPC_DAD_01", "wait", "你等爸爸簽完卷才睡。")),
        choice("B", "先睡，卷放在桌上", "balance", { derived: { STATE_STRESS: -1 } }, "你先睡了。第二天早上，卷在書包旁邊，簽好了。", mem("MEM_DAD_SIGN", "EVT_1988_DAD_SIGN", "B", "NPC_DAD_01", "sleep", "你先睡了。卷第二天已經簽好。")),
        choice(
          "C",
          "問他為什麼這麼晚",
          "think",
          { derived: { INDEPENDENT_THOUGHT: 1 }, npc: { NPC_DAD_01: { trust: 2 } } },
          "他停了一下筆。「有個同事移民了。他那份，我先做著。」他沒有再說。",
          mem("MEM_DAD_SIGN", "EVT_1988_DAD_SIGN", "C", "NPC_DAD_01", "ask", "你問過他為什麼這麼晚。同事移民了，他替人做。", 2),
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
            ? "阿姨頓了頓：「街坊嚟㗎，唔使即刻還。」你問到一句實在的回答。你記住，人情不是一筆數。"
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
            ? { derived: { VALUE_REALITY: 1, STATE_FAMILY_HARMONY: 4 } }
            : { derived: { VALUE_REALITY: 1, STATE_FAMILY_HARMONY: 2 } },
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
            ? { derived: { VALUE_DREAM: 2, VALUE_REALITY: 1, STATE_PEACE: 2 }, primary: { STAT_COURAGE: 1 } }
            : { derived: { VALUE_DREAM: 2, VALUE_REALITY: 1 }, primary: { STAT_COURAGE: 1 } },
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

export type { Card, Choice };
