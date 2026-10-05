export type FlagScope = "run" | "year" | "life" | "npc";

/** CODE is read by a later branch. ENDING is the ending, the year-end, or the 1996 beat. */
export type ConsumerKind = "CODE" | "ENDING";

export type IndexKind = "DEBUG";

export type MemoryKind = "MEMORY";

export type FlagSpec = {
  id: string;
  producer: string[];
  consumer: string[];
  consumerKind: ConsumerKind;
  fallback: string;
  scope: FlagScope;
  debugLabel: string;
  owner: string;
};

export type IndexSpec = Omit<FlagSpec, "consumerKind"> & { consumerKind: IndexKind };

export type MemoryMarkSpec = Omit<FlagSpec, "consumerKind"> & { consumerKind: MemoryKind };

/**
 * Formal flags only: a later branch or the ending actually reads the flag.
 * Indexes and memory-only marks live in INDEX_LEDGER and MEMORY_LEDGER.
 */
export const FLAG_LEDGER: FlagSpec[] = [
  {
    id: "FLAG_PARENT_EXPLAIN",
    producer: ["EVT_1984_NEWS_01 B"],
    consumer: ["EVT_1986_SKILL_05"],
    consumerKind: "CODE",
    fallback: "Skill card uses the shorter dad line.",
    scope: "life",
    debugLabel: "阿爸解釋過",
    owner: "news",
  },
  {
    id: "FLAG_HELPED_MOM_01",
    producer: ["EVT_1984_FAMILY_02 A"],
    consumer: ["EVT_1986_MARKET_07"],
    consumerKind: "CODE",
    fallback: "Market does not mention the toys.",
    scope: "life",
    debugLabel: "收過玩具",
    owner: "mom",
  },
  {
    id: "FLAG_FIRST_SCHOOL",
    producer: ["EVT_1985_SCHOOL_01"],
    consumer: ["battle memory MEM_FIRST_SCHOOL"],
    consumerKind: "CODE",
    fallback: "No school flag if the event was never reached.",
    scope: "life",
    debugLabel: "上過學",
    owner: "school",
  },
  {
    id: "FLAG_TEACHER_SLOW",
    producer: ["EVT_1985_SCHOOL_01 B", "battle bad"],
    consumer: ["EVT_1986_SKILL_05"],
    consumerKind: "CODE",
    fallback: "Teacher speaks at the normal pace.",
    scope: "life",
    debugLabel: "老師慢熱",
    owner: "school",
  },
  {
    id: "FLAG_CURIOUS_SCHOOL",
    producer: ["EVT_1985_SCHOOL_01 C"],
    consumer: ["battle approach curious"],
    consumerKind: "CODE",
    fallback: "Approach stays safe or social.",
    scope: "run",
    debugLabel: "自己行近",
    owner: "school",
  },
  {
    id: "FLAG_FAMILY_NEWS_SILENCE",
    producer: ["EVT_1985_FAMILY_03"],
    consumer: ["MEM_SILENT_NEWS_01"],
    consumerKind: "CODE",
    fallback: "No silence memory if the card was skipped.",
    scope: "life",
    debugLabel: "屋企靜過",
    owner: "family",
  },
  {
    id: "FLAG_TOY_MONOPOLY",
    producer: ["EVT_1985_FRIEND_04 A"],
    consumer: ["EVT_1986_SKILL_05"],
    consumerKind: "CODE",
    fallback: "Ah Jit sits at a normal distance.",
    scope: "life",
    debugLabel: "霸住個波",
    owner: "friend",
  },
  {
    id: "FLAG_SHARED_BALL",
    producer: ["EVT_1985_FRIEND_04 B"],
    consumer: ["EVT_1986_SKILL_05"],
    consumerKind: "CODE",
    fallback: "No wave from Ah Jit.",
    scope: "life",
    debugLabel: "輪住玩",
    owner: "friend",
  },
  {
    id: "FLAG_AVOID_CONFLICT",
    producer: ["EVT_1985_FRIEND_04 C"],
    consumer: ["EVT_1986_SKILL_05"],
    consumerKind: "CODE",
    fallback: "The seat line is not about walking away.",
    scope: "life",
    debugLabel: "行開",
    owner: "friend",
  },
  {
    id: "FLAG_FIRST_INTEREST_CHOICE",
    producer: ["EVT_1986_SKILL_05"],
    consumer: ["EVT_1986_MARKET_07"],
    consumerKind: "CODE",
    fallback: "No interest memory.",
    scope: "life",
    debugLabel: "揀過興趣",
    owner: "skill",
  },
  {
    id: "FLAG_DAD_WILL_COMPENSATE",
    producer: ["EVT_1986_FAMILY_06 A"],
    consumer: ["EVT_1986_ECHO_08"],
    consumerKind: "CODE",
    fallback: "Echo does not mention a later promise.",
    scope: "life",
    debugLabel: "話會補返",
    owner: "dad",
  },
  {
    id: "FLAG_MARKET_KINDNESS",
    producer: ["EVT_1986_MARKET_07 A", "EVT_1986_MARKET_07 C"],
    consumer: ["EVT_1986_ECHO_08"],
    consumerKind: "CODE",
    fallback: "No market memory.",
    scope: "life",
    debugLabel: "街市人情",
    owner: "market",
  },
  {
    id: "FLAG_FAVOUR_QUESTION",
    producer: ["EVT_1986_MARKET_07 B"],
    consumer: ["EVT_1986_ECHO_08"],
    consumerKind: "CODE",
    fallback: "Echo does not mention the unpaid vegetable.",
    scope: "life",
    debugLabel: "問人情",
    owner: "market",
  },
  {
    id: "FLAG_RETRY_SCHOOL",
    producer: ["battle fail", "battle bad"],
    consumer: ["MEM_FIRST_SCHOOL"],
    consumerKind: "CODE",
    fallback: "Win and perfect do not set a retry.",
    scope: "life",
    debugLabel: "第一日未入到",
    owner: "school",
  },
  {
    id: "FLAG_GATE_DECLINED",
    producer: ["explore stay home"],
    consumer: ["openNext skips EVT_1986_ECHO_08"],
    consumerKind: "CODE",
    fallback: "The offer repeats until the gate is met.",
    scope: "run",
    debugLabel: "留在家裡",
    owner: "echo",
  },
  {
    id: "FLAG_REPAIR_TALK",
    producer: ["repair talk"],
    consumer: ["ending"],
    consumerKind: "ENDING",
    fallback: "Ending does not mention the confession.",
    scope: "life",
    debugLabel: "同阿媽講",
    owner: "repair",
  },
  {
    id: "FLAG_REPAIR_SILENT",
    producer: ["repair silent"],
    consumer: ["ending"],
    consumerKind: "ENDING",
    fallback: "Ending does not mention the swallowed night.",
    scope: "life",
    debugLabel: "沒有說",
    owner: "repair",
  },
];

export const INDEX_LEDGER: IndexSpec[] = [
  {
    id: "FLAG_HEARD_ADULT_FUTURE",
    producer: ["EVT_1984_NEWS_01 A", "EVT_1984_NEWS_01 B"],
    consumer: ["nobody. heardNews reads MEM_NEWS_01 choiceId, not this flag"],
    consumerKind: "DEBUG",
    fallback: "No flag means not heard. Memory choiceId is the fact.",
    scope: "life",
    debugLabel: "聽過將來",
    owner: "news",
  },
];

export const MEMORY_LEDGER: MemoryMarkSpec[] = [
  {
    id: "FLAG_DAD_OVERTIME_MEMORY",
    producer: ["EVT_1986_FAMILY_06"],
    consumer: ["MEM_DAD_WORK is the fact. Ending reads the memory, not this flag"],
    consumerKind: "MEMORY",
    fallback: "Ending has no dad-work sentence.",
    scope: "life",
    debugLabel: "記得阿爸返工",
    owner: "dad",
  },
  {
    id: "FLAG_FIRST_INDEPENDENCE",
    producer: ["EVT_1986_ECHO_08"],
    consumer: ["MEM_FIRST_INDEPENDENCE is the fact. Ending reads the memory, not this flag"],
    consumerKind: "MEMORY",
    fallback: "Skip memory covers an explicit refusal.",
    scope: "life",
    debugLabel: "到過邨口",
    owner: "echo",
  },
];

export const RETIRED_FLAGS = ["FLAG_GATE_RISK", "FLAG_SELF_COMFORT", "NPC_DAD_OVERTIME_COUNT"] as const;

export const TAG_LEDGER: FlagSpec[] = [
  {
    id: "TAG_RESPONSIBILITY",
    producer: ["MINI_86_HELP A", "EVT_1984_FAMILY_02 A", "EVT_1986_MARKET_07 C"],
    consumer: ["EVT_1986_MARKET_07 reads personalityTags"],
    consumerKind: "CODE",
    fallback: "The hand does not reach for the bag by itself.",
    scope: "life",
    debugLabel: "識幫手",
    owner: "personality",
  },
  {
    id: "TAG_EMPATHY",
    producer: ["EVT_1984_FAMILY_02 C", "EVT_1985_FAMILY_03 A"],
    consumer: ["year-end line"],
    consumerKind: "ENDING",
    fallback: "Year-end does not mention sitting beside someone.",
    scope: "life",
    debugLabel: "識坐埋",
    owner: "personality",
  },
  {
    id: "TAG_NEWS_ENGAGEMENT_LOW",
    producer: ["EVT_1984_NEWS_01 C"],
    consumer: ["1996 beat"],
    consumerKind: "ENDING",
    fallback: "The fifteen-year-old scene does not mention eating through the news.",
    scope: "life",
    debugLabel: "顧住食飯",
    owner: "personality",
  },
];

export const SKILL_LEDGER: { id: string; consumer: string; consumerKind: "BATTLE" | "EVENT" | "ENDING" }[] = [
  { id: "SKL_01", consumer: "battle practiced read", consumerKind: "BATTLE" },
  { id: "SKL_02", consumer: "battle see", consumerKind: "BATTLE" },
  { id: "SKL_03", consumer: "EVT_1986_MARKET_07", consumerKind: "EVENT" },
  { id: "SKL_04", consumer: "battle ask", consumerKind: "BATTLE" },
  { id: "SKL_05", consumer: "EVT_1986_SKILL_05 choice E", consumerKind: "EVENT" },
  { id: "SKL_06", consumer: "EVT_1986_ECHO_08 choice A", consumerKind: "EVENT" },
  { id: "SKL_07", consumer: "battle tidy", consumerKind: "BATTLE" },
  { id: "SKL_08", consumer: "EVT_1986_ECHO_08 choice C", consumerKind: "EVENT" },
  { id: "SKL_09", consumer: "1996 beat and repair", consumerKind: "ENDING" },
  { id: "SKL_10", consumer: "EVT_1986_MARKET_07", consumerKind: "EVENT" },
  { id: "SKL_11", consumer: "EVT_1986_ECHO_08 choice B", consumerKind: "EVENT" },
  { id: "SKL_12", consumer: "EVT_1986_MARKET_07", consumerKind: "EVENT" },
];
