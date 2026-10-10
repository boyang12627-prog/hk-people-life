import { narrate, say, type SceneLine, type Speaker } from "./scene";
import { quotedSpeech } from "./wording";

/**
 * Speech that the data writes inside a narration string (result texts, a year opening). On the page
 * it becomes a real dialogue line with its speaker's portrait and name. The quoted words are
 * kept EXACTLY; only the narration around them is split. A lead-in such as 「阿姨說：」 becomes the
 * speaker tag; any other lead-in (嫲嫲笑：, 爸爸答得很短：) stays as narration, ending in 。.
 *
 * Quotes not listed here stay inside the narration on purpose: they are words or remembered phrases,
 * not someone speaking now (「將來」「以前」「知道了」「下次啦」, the 1996 recollection of 「最要緊是一家人安穩。」).
 */
/** Keyed by the quote with its brackets, exactly as it appears in the narration string. */
export const SPOKEN_IN_NARRATION: Readonly<Record<string, Speaker>> = {
  "「睇完就要走。」": "媽媽",
  "「呢個唔使錢。」": "阿姨",
  "「以前邊有咁多掣㗎。」": "嫲嫲",
  "「唱歌。」": "爸爸",
  "「你攞去用啦。」": "阿傑",
  "「將來即係你大個之後。」": "爸爸",
  "「我哋啱啱傾緊將來。大人有時都會擔心。你食甜品先。」": "媽媽",
  "「大人有時都會擔心。你食甜品先。」": "媽媽",
  "「等公司請到人先。」": "爸爸",
  "「有個同事移民咗。佢嗰份，我做住先。」": "爸爸",
  "「街坊嚟㗎，唔使即刻還。」": "阿姨",
  "「唔准行出嗰條街。」": "媽媽",
  "「女皇嚟咗。」": "爸爸",
  "「還有五分鐘。」": "老師",
};

/** Split one narration string at its listed quotes. Returns the same line when nothing is listed. */
export function splitSpokenNarration(text: string): SceneLine[] {
  const quotes = quotedSpeech(text).filter((quote) => SPOKEN_IN_NARRATION[`「${quote}」`]);
  if (quotes.length === 0) return [narrate(text)];
  const out: SceneLine[] = [];
  let rest = text;
  for (const quote of quotes) {
    const speaker = SPOKEN_IN_NARRATION[`「${quote}」`];
    const at = rest.indexOf(`「${quote}」`);
    if (at < 0) continue;
    let before = rest.slice(0, at);
    if (before.endsWith("：")) {
      const lead = before.slice(0, -1);
      const cut = Math.max(lead.lastIndexOf("。"), lead.lastIndexOf("！"), lead.lastIndexOf("？"), lead.lastIndexOf("，"));
      const clause = lead.slice(cut + 1);
      // 「爸爸說：」 is just who speaks: the speaker name says it. Any other lead-in stays as narration.
      before = clause === `${speaker}說` ? lead.slice(0, cut + 1) : `${lead}。`;
    }
    if (before.trim()) out.push(narrate(before));
    out.push(say(speaker, quote));
    rest = rest.slice(at + quote.length + 2);
  }
  if (rest.trim()) out.push(narrate(rest));
  return out;
}

/** Every narration line on a page, with listed speech split out into dialogue. Other lines untouched. */
export function expandSpokenNarration(lines: readonly SceneLine[]): SceneLine[] {
  return lines.flatMap((line) => (line.type === "narration" ? splitSpokenNarration(line.text) : [line]));
}
