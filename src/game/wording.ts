/**
 * 書面中文 word list. Player-facing text in this repo is written Chinese, not spoken Cantonese.
 * `logic-audit.test.ts` scans every string literal in src/game and src/components for `pattern`.
 * Era words that are also standard Hong Kong written usage stay: 士多、默書、小息、一毫子、街市.
 * A Cantonese word that must stay for a reason goes in `allowed` with that reason, not by editing the test.
 */
export type WordRule = { pattern: RegExp; written: string; note: string };

export const CANTONESE_TO_WRITTEN: readonly WordRule[] = [
  { pattern: /紅波/, written: "紅球", note: "波 = 球" },
  { pattern: /踢波/, written: "踢球", note: "波 = 球" },
  { pattern: /個波/, written: "那個球", note: "量詞 + 波" },
  { pattern: /今次/, written: "這次", note: "" },
  { pattern: /同阿傑|同媽媽|同爸爸|同嫲嫲/, written: "和阿傑／和媽媽", note: "連詞「同」" },
  { pattern: /一隻雀|那隻雀|(?<![麻])雀飛/, written: "一隻麻雀", note: "雀 = 麻雀" },
  { pattern: /不必錢|唔使錢/, written: "不用錢", note: "" },
  { pattern: /少少/, written: "一點", note: "" },
  { pattern: /啦[。」！？]/, written: "吧", note: "句末語氣詞" },
  { pattern: /沖涼/, written: "洗澡", note: "" },
  { pattern: /雪櫃/, written: "冰箱", note: "" },
  { pattern: /(?<!塑)膠袋/, written: "塑膠袋", note: "" },
  { pattern: /車仔/, written: "玩具車", note: "" },
  { pattern: /出街(?!口)/, written: "出門", note: "「街口」可用" },
  { pattern: /霸住/, written: "霸佔", note: "" },
  { pattern: /[唔咗嘅冇佢哋喺嚟睇嘢乜咁啲揸攞]/, written: "（改寫成書面語）", note: "粵語用字" },
];

/** Strings that may keep a listed word, with the reason. Empty on purpose. */
export const WORDING_ALLOWED: readonly { text: string; reason: string }[] = [];

/** Every listed hit in one string. Used by the audit; also handy in a console. */
export function cantoneseHits(text: string) {
  if (WORDING_ALLOWED.some((item) => text.includes(item.text))) return [];
  return CANTONESE_TO_WRITTEN.filter((rule) => rule.pattern.test(text)).map((rule) => ({ rule, text }));
}
