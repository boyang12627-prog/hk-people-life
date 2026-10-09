/**
 * TV news captions. The paintings never carry text, so a TV's headline is drawn by the UI on top of the
 * painted screen. Each painting with a TV records where its screen is (measured on the 1280x720 source,
 * the same for the boy and girl versions) and the headline comes from the year on the page.
 */

export type Point = readonly [number, number];
/** Screen glass corners in source pixels of the 1280x720 painting: top-left, top-right, bottom-right, bottom-left. */
export type Quad = readonly [Point, Point, Point, Point];

export type TvScreen = {
  quad: Quad;
  /** True when the painting already shows a lit picture; false for a dark (switched off) screen we light up. */
  lit: boolean;
  /** Where the news strip sits on the glass. "top" keeps it clear of the panel when the screen is low in the picture. */
  strip: "top" | "bottom";
};

/** The paintings are 1280x720 and the stage is always 16:9, so one scale maps source pixels onto the stage. */
export const SOURCE_W = 1280;
export const SOURCE_H = 720;

/** The flat canvas the caption is laid out on before it is warped onto the glass. Width is fixed; height follows the screen. */
export const CANVAS_W = 400;

/**
 * Every Q painting (public/art/q/{name}-{boy,girl}.webp) that has a TV in it. Corners were read off 4-5x
 * zoomed crops of the glass (inside the bezel, at the tangent of each rounded corner). Boy and girl
 * versions share the same room and set.
 */
export const TV_SCREENS: Record<string, TvScreen> = {
  /** Evening TV room: the set is seen from the left, so the glass's right side is taller. Painted lit. */
  tv: { quad: [[1019, 314], [1100, 310], [1100, 444], [1018, 433]], lit: true, strip: "top" },
  /** Morning by the door: Dad ties his shoes in front of the set (nearly face-on). */
  bag: { quad: [[1087, 160], [1202, 159], [1201, 289], [1088, 288]], lit: false, strip: "bottom" },
  /** Afternoon drawing in the living room: the set is turned a little, top edge drops to the left. */
  draw: { quad: [[633, 155], [776, 151], [774, 255], [635, 257]], lit: false, strip: "bottom" },
  /** Afternoon blocks with Grandma (same room and set as draw). */
  play: { quad: [[633, 155], [776, 151], [774, 255], [635, 257]], lit: false, strip: "bottom" },
  /** Afternoon nap, Grandma with the fan. */
  rest: { quad: [[975, 145], [1092, 143], [1091, 234], [976, 236]], lit: false, strip: "bottom" },
};

const dist = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Height of the flat caption canvas: the glass's average aspect, so text is not stretched once warped. */
export function canvasHeight(quad: Quad) {
  const w = (dist(quad[0], quad[1]) + dist(quad[3], quad[2])) / 2;
  const h = (dist(quad[0], quad[3]) + dist(quad[1], quad[2])) / 2;
  return Math.round((CANVAS_W * h) / w);
}

/**
 * Projective map (homography) that sends the canvas rectangle (0,0)-(w,h) onto the quad, as a CSS
 * matrix3d() with transform-origin 0 0. Square-to-quad after Heckbert, then pre-scaled by 1/w, 1/h.
 */
export function quadMatrix(quad: Quad, w: number, h: number): number[] {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = quad;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  let g = 0, k = 0;
  if (Math.abs(dx3) > 1e-9 || Math.abs(dy3) > 1e-9) {
    const den = dx1 * dy2 - dx2 * dy1;
    g = (dx3 * dy2 - dx2 * dy3) / den;
    k = (dx1 * dy3 - dx3 * dy1) / den;
  }
  const a = x1 - x0 + g * x1, b = x3 - x0 + k * x3, c = x0;
  const d = y1 - y0 + g * y1, e = y3 - y0 + k * y3, f = y0;
  // Column-major 4x4: x' = (a u + b v + c) / (g u + k v + 1) with u = x/w, v = y/h.
  return [a / w, d / w, 0, g / w, b / h, e / h, 0, k / h, 0, 0, 1, 0, c, f, 0, 1];
}

/** Apply a matrix3d (as above) to a canvas point; used by the audit to check corners land on the glass. */
export function applyMatrix(m: readonly number[], x: number, y: number): Point {
  const X = m[0] * x + m[4] * y + m[12];
  const Y = m[1] * x + m[5] * y + m[13];
  const W = m[3] * x + m[7] * y + m[15];
  return [X / W, Y / W];
}

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
