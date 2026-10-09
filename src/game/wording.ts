/**
 * Two layers of wording (V3.4).
 *
 * 1. Narration and action are concise 書面中文. `CANTONESE_TO_WRITTEN` is enforced on them: the audit fails.
 * 2. Dialogue keeps a Hong Kong voice by speaker (docs/VOICE.md). The list is NOT enforced on dialogue.
 *    `dialogueWarnings` only reports lines a writer may want to look at again. It never fails and never rewrites.
 *
 * Speech quoted inside a narration string (阿姨說：「……」) counts as dialogue, not narration.
 * Era words that are also standard Hong Kong written usage stay in narration: 士多、默書、小息、一毫子、街市、一陣.
 */
import type { Register, Speaker } from "./scene";
import { DEFAULT_REGISTER, SPEAKERS } from "./scene";

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
  { pattern: /[唔咗嘅冇佢哋喺嚟睇嘢乜咁啲揸攞㗎喎嘢]/, written: "（改寫成書面語）", note: "粵語用字" },
];

/** Narration strings that may keep a listed word, with the reason. Empty on purpose. */
export const WORDING_ALLOWED: readonly { text: string; reason: string }[] = [];

/** Quoted speech inside a string: 「……」 spans, nested quotes kept whole. */
export function quotedSpeech(text: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "「") {
      if (depth === 0) start = i + 1;
      depth += 1;
    } else if (text[i] === "」" && depth > 0) {
      depth -= 1;
      if (depth === 0) out.push(text.slice(start, i));
    }
  }
  return out;
}

/** The narration part of a string: quoted speech removed. */
export function narrationOnly(text: string) {
  let out = text;
  for (const speech of quotedSpeech(text)) out = out.replace(`「${speech}」`, "「」");
  return out;
}

/** Listed Cantonese words in narration. Quoted speech is skipped: that is dialogue. */
export function cantoneseHits(text: string) {
  if (WORDING_ALLOWED.some((item) => text.includes(item.text))) return [];
  const narration = narrationOnly(text);
  return CANTONESE_TO_WRITTEN.filter((rule) => rule.pattern.test(narration)).map((rule) => ({ rule, text }));
}

/** Who says a quote inside narration: the first speaker named in the sentence that leads into the 「. */
export function quotedSpeaker(text: string, speech: string): Speaker | null {
  const before = text.slice(0, text.indexOf(`「${speech}」`)).replace(/[。！？]$/, "");
  const sentence = before.slice(Math.max(before.lastIndexOf("。"), before.lastIndexOf("！"), before.lastIndexOf("？")) + 1);
  let best: { speaker: Speaker; at: number } | null = null;
  for (const speaker of SPEAKERS) {
    const at = sentence.indexOf(speaker);
    if (at >= 0 && (!best || at < best.at)) best = { speaker, at };
  }
  if (best) return best.speaker;
  if (/^他/.test(sentence) && /阿傑/.test(text)) return "阿傑";
  return null;
}

const CANTONESE_CHARS = /[唔咗嘅冇佢哋喺嚟睇嘢乜咁啲揸攞㗎喎囉咩嗰俾畀]/;
const HEAVY_PARTICLES = /[㗎喎囉咩]/;
const WRITTEN_MARKERS: readonly { pattern: RegExp; word: string }[] = [
  { pattern: /沒有/, word: "沒有" },
  { pattern: /這個|這次|這些/, word: "這個／這次" },
  { pattern: /那個|那些/, word: "那個" },
  { pattern: /什麼|甚麼/, word: "什麼" },
  { pattern: /吧[。！？]?$/, word: "吧" },
  { pattern: /嗎[。！？]?$/, word: "嗎" },
  { pattern: /的時候/, word: "的時候" },
];
/** Hong Kong words that are fine in narrative-register speech. */
const NARRATIVE_OK = /一陣|好累|今日|波|今次|少少|啦/;

export type VoiceWarning = { speaker: Speaker | null; register: Register; text: string; reason: string };

/**
 * Possibly unnatural speech, for the writer to read again. A warning is a question, not a rule:
 * some written lines may be kept on purpose; the writer decides.
 */
export function dialogueWarnings(speaker: Speaker | null, text: string, register?: Register): VoiceWarning[] {
  const reg: Register = register ?? (speaker ? DEFAULT_REGISTER[speaker] : "narrative");
  const out: VoiceWarning[] = [];
  const warn = (reason: string) => out.push({ speaker, register: reg, text, reason });
  const written = WRITTEN_MARKERS.filter((item) => item.pattern.test(text)).map((item) => item.word);
  const cantonese = CANTONESE_CHARS.test(text);
  if (reg === "formal") {
    if (cantonese) warn("formal 說話裡有粵語用字");
    const hk = CANTONESE_TO_WRITTEN.filter((rule) => rule.pattern.test(text)).map((rule) => rule.written);
    if (!cantonese && hk.length) warn(`formal 說話裡有口語詞（書面可寫：${hk.join("、")}）`);
  }
  if (reg === "colloquial") {
    if (cantonese && written.length) warn(`口語和書面混用（${written.join("、")}）`);
    else if (!cantonese && written.length) warn(`colloquial 角色說得像書面語（${written.join("、")}）`);
  }
  if (reg === "narrative") {
    if (HEAVY_PARTICLES.test(text)) warn("narrative 說話用了很重的語氣詞（㗎、喎、囉、咩）；考慮標 colloquial");
    else if (cantonese && !NARRATIVE_OK.test(text)) warn("narrative 說話有粵語用字；考慮標 colloquial 或改書面");
  }
  if (speaker === "阿傑" && text.replace(/[。，！？、「」]/g, "").length > 14) warn("小孩一句話太長");
  if (speaker === "爸爸" && text.replace(/[。，！？、「」]/g, "").length > 14) warn("爸爸一句話太長（他說話短）");
  return out;
}
