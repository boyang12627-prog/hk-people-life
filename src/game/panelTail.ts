/**
 * Pure geometry for the dialogue panel's pointer tail: a wedge that rises from the panel's top edge
 * and ends just short of the speaking character's head in the painting, aimed at its centre.
 * Inputs are client rects (any shared pixel space); the output is in panel-local pixels
 * (origin = panel top-left, so the tip has a negative y: it sits above the panel).
 */
export type HeadPoint = { x: number; y: number; r: number };
export type Box = { x: number; y: number; w: number; h: number };
export type Point = { x: number; y: number };
export type Tail = { b1: Point; b2: Point; tip: Point; dashed: boolean };

/** Keep the base this far from the panel's rounded corners. */
export const TAIL_EDGE = 14;
/** The tip stops this many head radii from the head centre: below the chin or beside the hair, never on the face. */
export const TAIL_STOP = 1.45;

export function panelTail(input: { stage: Box; panel: Box; head: HeadPoint; half: number }): Tail | null {
  const { stage, panel, head, half } = input;
  const A = { x: stage.x + head.x * stage.w - panel.x, y: stage.y + head.y * stage.h - panel.y };
  const R = head.r * stage.h;
  const bx = Math.max(TAIL_EDGE + half, Math.min(panel.w - TAIL_EDGE - half, A.x));
  const dx = bx - A.x;
  const dy = 0 - A.y;
  const dist = Math.hypot(dx, dy);
  const stop = R * TAIL_STOP;
  // The head is at or under the panel's edge: nothing sensible to point at.
  if (dist < stop + 16) return null;
  const tip = { x: A.x + (dx / dist) * stop, y: A.y + (dy / dist) * stop };
  if (tip.y > -8) return null;
  return { b1: { x: bx - half, y: 0 }, b2: { x: bx + half, y: 0 }, tip, dashed: false };
}

/** Offscreen voice: a short dashed stub at the panel's top edge, leaning toward the side the voice comes from. */
export function offscreenStub(input: { panelW: number; side: "left" | "right" | "top"; half: number }): Tail {
  const { panelW, side, half } = input;
  const bx = side === "left" ? Math.max(TAIL_EDGE + half, panelW * 0.1) : side === "right" ? Math.min(panelW - TAIL_EDGE - half, panelW * 0.9) : panelW / 2;
  const lean = side === "left" ? -1.4 : side === "right" ? 1.4 : 0;
  const rise = half * 2.2;
  return { b1: { x: bx - half * 0.7, y: 0 }, b2: { x: bx + half * 0.7, y: 0 }, tip: { x: bx + lean * half, y: -rise }, dashed: true };
}
