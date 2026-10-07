import { grownWord, type SceneId, type State } from "../types";
import { choice, mem, type Card, type Choice } from "../choice";
import { gapLine, heardNews, newsCold, picked, selectByPriority, type Spoken } from "../speak";

/** One file owns childhood prose. Add an event here; do not add a switch in the reducer. */
export const CHILDHOOD_EVENT_IDS = [
  "MINI_84_TOY",
  "MINI_85_RAIN",
  "MINI_85_GRANDMA",
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
  "EVT_1988_PEN_01",
  "EVT_1988_EXAM_01",
] as const;

export type StaticEvent = {
  id: string;
  scene: SceneId;
  kicker: string;
  title: string;
  lines: string[];
  choices: Choice[];
};

/** A fully static event. Dynamic cards stay as functions below. The reducer still does not see this. */
export function renderStatic(event: StaticEvent): { card: Card; choices: Choice[] } {
  return {
    card: { scene: event.scene, kicker: event.kicker, title: event.title, lines: [...event.lines] },
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
        "你看清楚那輛車，然後自己追上去。沒有人買。櫃台旁邊有一隻不會走的塑膠錶。阿姨說：「這個不必錢。」你把它握在手裡。",
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
    lines: ["下大雨，平台去不了。", "外面一片白，看不見對面。屋裡只有一部風扇和你。"],
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
      choice("A", "聽她講", "reality", { npc: { NPC_GRAND_01: { trust: 3, relation: 2 } }, derived: { INDEPENDENT_THOUGHT: 1 } }, "你聽。你不知道全部，但你知道這棟樓以前更難走。"),
      choice("B", "走去玩", "dream", { derived: { STATE_MOOD: 2 }, npc: { NPC_GRAND_01: { relation: -1 } } }, "你留下碗湯，走到玩具那裡。嫲嫲沒有叫你回來。"),
      choice("C", "問為什麼要走樓梯", "think", { derived: { INDEPENDENT_THOUGHT: 2 }, npc: { NPC_GRAND_01: { trust: 2 } } }, "嫲嫲笑：「因為那時候沒有這些按鈕。」你記住「以前」兩個字。"),
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
        "交給坐你旁邊的人",
        "reality",
        { npc: { NPC_FRIEND_01: { trust: 2, relation: 2 } }, skills: ["SKL_13"], equipment: ["EQP_BALLPOINT"] },
        "你交還給他。他說這支是多出來的，你拿去用。筆芯有一點深。",
        mem("MEM_BALLPOINT", "EVT_1988_PEN_01", "A", "NPC_FRIEND_01", "kept", "同學說這支是多出來的。你拿去寫了那張卷。"),
      ),
      choice("B", "放回地上", "balance", { derived: { STATE_PEACE: 1 } }, "你沒有撿。筆還在那裡。你上了樓。"),
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
      choice("A", "由第一題開始寫", "reality", {}, "你由第一題寫。後面的題，你還沒看。", undefined, "safe"),
      choice("B", "先看整張卷", "think", {}, "你先翻到最後一頁。題很多。", undefined, "curious"),
      choice("C", "看看旁邊的人", "dream", {}, "旁邊有人已經在寫。你要自己落筆。", undefined, "social"),
    ],
  },
};

export const DAILY_STATIC_IDS = ["MINI_84_TOY", "MINI_85_RAIN", "MINI_85_GRANDMA", "MINI_86_ESTATE", "MINI_86_TV", "MINI_86_HELP"] as const;

export function cardFor(id: string, state: State): Card {
  const staticEvt = STATIC_EVENTS[id];
  if (staticEvt) return renderStatic(staticEvt).card;
  const gender = state.gender ?? "girl";
  const grown = grownWord(gender);
  switch (id) {
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
      const spoken: Spoken[] = [];
      if (mom === "A") spoken.push({ priority: 0, text: "媽媽沒有幫你選。去年你自己收過玩具。" });
      if (state.flags.includes("FLAG_PARENT_EXPLAIN")) spoken.push({ priority: 0, text: "爸爸解釋過一次將來。今天他想你選實際的。" });
      const news = picked(state, "MEM_NEWS_01");
      if (news === "A") spoken.push({ priority: 0, text: "去年你站過去聽。今天你也是聽完才選。" });
      if (news === "C") spoken.push({ priority: 0, text: "去年「九七」你沒有問。今天新事物擺在面前，你也不急著選。" });
      if (state.flags.includes("FLAG_AVOID_CONFLICT")) spoken.push({ priority: 1, text: "你上次走開了。今天這個位子仍然是你自己坐。" });
      if (state.flags.includes("FLAG_CURIOUS_SCHOOL")) spoken.push({ priority: 1, text: "你第一天自己走近那個球。老師記得。" });
      if (state.skills.includes("SKL_05")) spoken.push({ priority: 1, text: "你懂得輪流玩。阿傑在，你可以叫他一組。" });
      if (state.flags.includes("FLAG_TOY_MONOPOLY") || state.npc.NPC_FRIEND_01.trust < 0) spoken.push({ priority: 1, text: "阿傑坐得很遠。紅球不在你的桌子上。" });
      else if (state.flags.includes("FLAG_SHARED_BALL") || state.npc.NPC_FRIEND_01.trust >= 5) spoken.push({ priority: 1, text: "阿傑招你過去坐。" });
      else if (!state.npc.NPC_FRIEND_01.available) spoken.push({ priority: 2, text: "你和阿傑還不算認識。課室只有你自己的位子。" });
      if (state.counter.ART_PROGRESS >= 2) spoken.push({ priority: 1, text: "老師：「不是今天才畫的。家裡的紙上也是顏色。」" });
      else if (state.counter.MIND_PROGRESS >= 2) spoken.push({ priority: 1, text: "老師：「這孩子會跟著數到十。」" });
      const lean = gapLine(state, "你看著顏色，多過數字。", "你先聽到爸爸說的。你知道「實際」兩個字。");
      if (lean) spoken.push({ priority: 2, text: lean });
      if (state.derived.INDEPENDENT_THOUGHT >= 50) spoken.push({ priority: 2, text: "你還沒問出口，已經自己想了兩句。沒有人聽見。" });
      if (state.npc.NPC_TEACH_01.trust >= 35) spoken.push({ priority: 2, text: "老師記得你自己走進課室。" });
      else if (state.flags.includes("FLAG_TEACHER_SLOW")) spoken.push({ priority: 2, text: "老師說得很慢，等你跟上。" });
      lines.push(...selectByPriority(spoken, 4));
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
      const spoken: Spoken[] = [];
      if (news === "C") spoken.push({ priority: 0, text: "去年你跟著吃飯。今天這條路，沒有人推你。" });
      if (news === "B") spoken.push({ priority: 0, text: "你想再問一句。你問過一次將來。" });
      if (dad === "A") spoken.push({ priority: 0, text: "你自己去玩過。約定裂開過，今天他仍然不在。" });
      else if (dad === "B") spoken.push({ priority: 0, text: "你答應過他去上班。今天公園還是去不成。" });
      else if (dad === "C") spoken.push({ priority: 0, text: "你留過。今天你自己走，也記得那時候。" });
      if (state.counter.WORLD_DAD_WORK_OCCURRENCES >= 2) spoken.push({ priority: 1, text: "爸爸今天又不在。家裡又靜下來。" });
      if (state.flags.includes("FLAG_DAD_WILL_COMPENSATE")) spoken.push({ priority: 1, text: "他說遲些會補。今天這條路，他不在。" });
      if (state.flags.includes("FLAG_FAVOUR_QUESTION")) spoken.push({ priority: 1, text: "你問過一份好意是不是要還。今天這條路，沒有人向你收錢。" });
      if (state.flags.includes("FLAG_MARKET_KINDNESS")) spoken.push({ priority: 2, text: "阿姨塞過一條菜。外面沒有人伸手向你要錢。" });
      if (state.npc.NPC_MOM_01.trust >= 75) spoken.push({ priority: 2, text: "媽媽的手伸在你後面，還沒拉你。" });
      else if (state.npc.NPC_MOM_01.trust <= 65) spoken.push({ priority: 2, text: "媽媽站得遠。她一出聲你就聽到。" });
      if (state.primary.STAT_FATE >= 6) spoken.push({ priority: 2, text: "你踏出去的那一下，她遲了半秒才叫你。" });
      lines.push(...selectByPriority(spoken, 4));
      return { scene: "estate", kicker: "1986 · 屋邨門口", title: "如果我自己走呢", lines };
    }
    default:
      return { scene: "home", kicker: "日常", title: "一個下午", lines: ["這個下午就這樣過了。"] };
  }
}

export function choicesFor(id: string, state: State): Choice[] {
  const staticEvt = STATIC_EVENTS[id];
  if (staticEvt) return renderStatic(staticEvt).choices;
  const heard = heardNews(state);
  switch (id) {
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
