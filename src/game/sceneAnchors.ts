import type { Speaker } from "./scene";

/**
 * Where each person's head is in each Q scene painting (public/art/q/{name}-{boy|girl}.webp).
 * x, y are fractions of the 16:9 image (0..1, from top-left) at the centre of the head; r is the head
 * radius as a fraction of the image height. Measured by eye on a 10% grid; boy and girl versions
 * share one layout (checked side by side, the child's head moves by at most 0.02).
 *
 * A speaker who talks on a page but is not in the painting gets an `offscreen` entry instead, so the
 * panel shows a location tag (map pin + 「旁邊」) after the name.
 */
export type HeadAnchor = { x: number; y: number; r: number };
export type Offscreen = { offscreen: "left" | "right" | "top"; label: string };
export type Who = Speaker | "child";
export type SceneAnchors = Partial<Record<Who, HeadAnchor | Offscreen>>;

const a = (x: number, y: number, r: number): HeadAnchor => ({ x, y, r });

export const SCENE_ANCHORS: Record<string, SceneAnchors> = {
  bag: { 媽媽: a(0.29, 0.32, 0.07), 爸爸: a(0.63, 0.28, 0.07), child: a(0.45, 0.34, 0.07) },
  bags: { 媽媽: a(0.65, 0.15, 0.08), child: a(0.42, 0.52, 0.07) },
  corridor: { 媽媽: a(0.78, 0.18, 0.09), 阿傑: a(0.6, 0.35, 0.05), child: a(0.48, 0.48, 0.07) },
  draw: { child: a(0.44, 0.58, 0.08) },
  ending: { child: a(0.3, 0.47, 0.05) },
  estate: { 阿傑: a(0.42, 0.39, 0.07), child: a(0.29, 0.45, 0.07) },
  home1996: { child: a(0.57, 0.18, 0.07) },
  home: { 爸爸: a(0.45, 0.35, 0.06), 媽媽: a(0.7, 0.4, 0.06), child: a(0.58, 0.48, 0.05) },
  inside: { 阿傑: a(0.6, 0.3, 0.1), 老師: a(0.74, 0.18, 0.06), child: a(0.4, 0.38, 0.1) },
  kindy: {
    媽媽: a(0.3, 0.17, 0.09),
    老師: a(0.66, 0.33, 0.09),
    阿傑: a(0.54, 0.35, 0.05),
    child: a(0.43, 0.5, 0.08),
    // EVT_1986_SKILL_05: Dad joins the talk with the teacher but is not in the kindergarten painting.
    爸爸: { offscreen: "left", label: "旁邊" },
  },
  market: { 阿姨: a(0.16, 0.25, 0.08), 媽媽: a(0.72, 0.17, 0.08), child: a(0.82, 0.48, 0.07) },
  orange: { 媽媽: a(0.79, 0.17, 0.06), child: a(0.53, 0.38, 0.08) },
  pen: { child: a(0.37, 0.37, 0.13) },
  play: { 嫲嫲: a(0.65, 0.33, 0.07), child: a(0.44, 0.5, 0.07) },
  pressure: { 媽媽: a(0.33, 0.21, 0.09), 老師: a(0.61, 0.14, 0.08), child: a(0.34, 0.53, 0.08) },
  rainempty: { child: a(0.38, 0.5, 0.06) },
  rest1988: { 嫲嫲: a(0.65, 0.28, 0.07), child: a(0.37, 0.78, 0.06) },
  shoes1988: { 爸爸: a(0.43, 0.15, 0.08), child: a(0.61, 0.45, 0.07) },
  rain: { child: a(0.38, 0.5, 0.06) },
  rest: { 嫲嫲: a(0.65, 0.33, 0.07), child: a(0.37, 0.73, 0.06) },
  shoes: { 爸爸: a(0.43, 0.15, 0.08), child: a(0.61, 0.53, 0.07) },
  soup: { 嫲嫲: a(0.38, 0.2, 0.09), child: a(0.68, 0.5, 0.08) },
  stair: { 媽媽: a(0.69, 0.17, 0.09), 阿傑: a(0.53, 0.25, 0.04), child: a(0.45, 0.47, 0.09) },
  study: { 老師: a(0.64, 0.32, 0.05), child: a(0.32, 0.48, 0.12) },
  toy: { 媽媽: a(0.6, 0.3, 0.05), child: a(0.37, 0.4, 0.08) },
  tvsing: { 爸爸: a(0.32, 0.36, 0.07), 媽媽: a(0.19, 0.38, 0.07), child: a(0.43, 0.55, 0.07) },
  tv: { 爸爸: a(0.33, 0.35, 0.07), 媽媽: a(0.17, 0.38, 0.07), child: a(0.43, 0.58, 0.07) },
};

/** "/hk-people-life/art/q/market-girl.webp" -> "market". Null for anything that is not a Q scene painting. */
export function plateName(src: string | null | undefined): string | null {
  const match = src ? /\/q\/([a-z]+?)(\d{4}|off)?-(?:boy|girl)\.[a-z]+$/.exec(src) : null;
  if (!match) return null;
  // A year/off copy of a painting (tv1986, tvoff, rest1988) keeps its people; a new painting (home1996) has its own entry.
  const full = match[1] + (match[2] ?? "");
  return SCENE_ANCHORS[full] ? full : match[1];
}

export function isOffscreen(anchor: HeadAnchor | Offscreen | undefined): anchor is Offscreen {
  return !!anchor && "offscreen" in anchor;
}

export function anchorFor(src: string | null | undefined, who: Who): HeadAnchor | Offscreen | undefined {
  const name = plateName(src);
  return name ? SCENE_ANCHORS[name]?.[who] : undefined;
}

/** One accent per speaker: the panel portrait frame and the name above the line share it. All at or below amber. */
export const SPEAKER_ACCENT: Record<Speaker, string> = {
  媽媽: "#35665d",
  爸爸: "#3e4e6c",
  嫲嫲: "#644a74",
  阿傑: "#6e4524",
  阿姨: "#8a4a3a",
  老師: "#4a5a2e",
};
