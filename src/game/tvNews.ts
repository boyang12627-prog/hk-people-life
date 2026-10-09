/**
 * TV news captions. The paintings never carry text, so a TV's headline is drawn by the UI on top of the
 * painted screen. Each painting with a TV records where its screen is (measured on the 1280x720 source,
 * the same for the boy and girl versions) and the headline comes from the year on the page.
 */

export type TvScreen = {
  /** Screen glass in % of the painting (left, top, width, height). */
  left: number;
  top: number;
  width: number;
  height: number;
  /** True when the painting already shows a lit picture; false for a dark (switched off) screen we light up. */
  lit: boolean;
  /** Where the news strip sits on the glass. "top" keeps it clear of the panel when the screen is low in the picture. */
  strip: "top" | "bottom";
};

const SOURCE_W = 1280;
const SOURCE_H = 720;

/** Screen corners in source pixels -> percentages. */
function screen(x0: number, y0: number, x1: number, y1: number, lit: boolean, strip: TvScreen["strip"]): TvScreen {
  const pct = (value: number, of: number) => Math.round((value / of) * 1000) / 10;
  return { left: pct(x0, SOURCE_W), top: pct(y0, SOURCE_H), width: pct(x1 - x0, SOURCE_W), height: pct(y1 - y0, SOURCE_H), lit, strip };
}

/** Every Q painting (public/art/q/{name}-{boy,girl}.webp) that has a TV in it. */
export const TV_SCREENS: Record<string, TvScreen> = {
  /** Evening TV room: the family at the table, the set on, a picture on the glass. */
  tv: screen(1016, 310, 1102, 444, true, "top"),
  /** Morning by the door: Dad ties his shoes in front of the set. */
  bag: screen(1082, 158, 1204, 294, false, "bottom"),
  /** Afternoon drawing in the living room. */
  draw: screen(631, 149, 777, 258, false, "bottom"),
  /** Afternoon blocks with Grandma (same room and set as draw). */
  play: screen(631, 149, 777, 258, false, "bottom"),
  /** Afternoon nap, Grandma with the fan. */
  rest: screen(973, 138, 1097, 237, false, "bottom"),
};

/**
 * One factual Hong Kong headline per year, matching what the story says is on TV:
 * 1984 the handshake in December (Sino-British Joint Declaration, signed 19 Dec 1984);
 * 1985 Legislative Council's first indirect elections (Sept 1985);
 * 1986 the Queen's visit in October, "女皇來了";
 * 1988 the emigration wave Dad's colleague is part of;
 * 1996 the countdown to the 1997 handover.
 */
export const NEWS_HEADLINE: Record<number, string> = {
  1984: "中英聯合聲明簽署",
  1985: "立法局首次間接選舉",
  1986: "英女皇訪港",
  1988: "移民潮持續",
  1996: "香港回歸倒數",
};

/** The painting name a picture path points at ("/art/q/tv-girl.webp" -> "tv"), or null for anything else. */
export function paintingName(picture: string): string | null {
  const match = /\/q\/([a-z0-9]+)-(?:boy|girl)\.[a-z]+$/.exec(picture);
  return match ? match[1] : null;
}

export function tvScreenFor(picture: string): TvScreen | null {
  const name = paintingName(picture);
  return name ? TV_SCREENS[name] ?? null : null;
}

/** A page that says the TV is off keeps the screen dark. */
const TV_OFF = /電視(?:已經)?關(?:了|掉|上)/;

export function tvIsOff(texts: readonly string[]) {
  return texts.some((text) => TV_OFF.test(text));
}

/** Headline for the TV on this page, or null (no year, no headline for that year, or the text says the TV is off). */
export function newsHeadline(year: number | null | undefined, texts: readonly string[] = []): string | null {
  if (!year) return null;
  const headline = NEWS_HEADLINE[year];
  if (!headline) return null;
  return tvIsOff(texts) ? null : headline;
}
