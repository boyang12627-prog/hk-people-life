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
  bag: { 媽媽: a(0.24, 0.27, 0.09), 爸爸: a(0.73, 0.14, 0.09), child: a(0.43, 0.35, 0.08) },
  bags: { 媽媽: a(0.65, 0.15, 0.08), child: a(0.42, 0.52, 0.07) },
  corridor: { 媽媽: a(0.78, 0.18, 0.09), 阿傑: a(0.6, 0.35, 0.05), child: a(0.48, 0.48, 0.07) },
  draw: { child: a(0.5, 0.37, 0.13) },
  estate: { 阿傑: a(0.61, 0.25, 0.09), child: a(0.41, 0.33, 0.09) },
  home: { 爸爸: a(0.29, 0.33, 0.09), 媽媽: a(0.71, 0.35, 0.09), child: a(0.53, 0.47, 0.07) },
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
  play: { 嫲嫲: a(0.78, 0.18, 0.08), child: a(0.37, 0.43, 0.1) },
  pressure: { 媽媽: a(0.33, 0.21, 0.09), 老師: a(0.61, 0.14, 0.08), child: a(0.34, 0.53, 0.08) },
  rain: { child: a(0.42, 0.3, 0.09) },
  rest: { 嫲嫲: a(0.63, 0.18, 0.1), child: a(0.33, 0.64, 0.1) },
  shoes: { 爸爸: a(0.41, 0.16, 0.1), child: a(0.67, 0.54, 0.08) },
  soup: { 嫲嫲: a(0.69, 0.17, 0.1), child: a(0.25, 0.38, 0.1) },
  stair: { 媽媽: a(0.69, 0.17, 0.09), 阿傑: a(0.53, 0.25, 0.04), child: a(0.45, 0.47, 0.09) },
  study: { 老師: a(0.64, 0.32, 0.05), child: a(0.32, 0.48, 0.12) },
  toy: { 媽媽: a(0.79, 0.19, 0.07), child: a(0.45, 0.39, 0.08) },
  tv: { 爸爸: a(0.19, 0.31, 0.08), 媽媽: a(0.32, 0.32, 0.08), child: a(0.5, 0.53, 0.08) },
};

/** "/hk-people-life/art/q/market-girl.webp" -> "market". Null for anything that is not a Q scene painting. */
export function plateName(src: string | null | undefined): string | null {
  const match = src ? /\/q\/([a-z]+)(?:\d{4})?-(?:boy|girl)\.[a-z]+$/.exec(src) : null;
  return match ? match[1] : null;
}

export function isOffscreen(anchor: HeadAnchor | Offscreen | undefined): anchor is Offscreen {
  return !!anchor && "offscreen" in anchor;
}

export function anchorFor(src: string | null | undefined, who: Who): HeadAnchor | Offscreen | undefined {
  const name = plateName(src);
  return name ? SCENE_ANCHORS[name]?.[who] : undefined;
}

/** One accent per speaker: the panel portrait frame, name plate and name share it. All at or below amber. */
export const SPEAKER_ACCENT: Record<Speaker, string> = {
  媽媽: "#35665d",
  爸爸: "#3e4e6c",
  嫲嫲: "#644a74",
  阿傑: "#6e4524",
  阿姨: "#8a4a3a",
  老師: "#4a5a2e",
};
