/** Pure geometry for the speech bubble: where it sits and where its tail ends. Pixels in stage space. */
export type HeadPoint = { x: number; y: number; r: number };
export type Rect = { x: number; y: number; w: number; h: number };
export type Placed = { left: number; top: number; tail: string; tip: { x: number; y: number } | null; ring: { x: number; y: number; r: number } | null; dashed: boolean };

export const GAP = 8;

function overlap(a: Rect, b: Rect) {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

/** Where the bubble goes and what its tail looks like. Pure: stage size, bubble size, head, things to avoid. */
export function placeBubble(input: {
  W: number;
  H: number;
  bw: number;
  bh: number;
  maxBottom: number;
  head: HeadPoint | null;
  faces: HeadPoint[];
  avoid: Rect[];
  edge: { side: "left" | "right" | "top"; target: Rect | null } | null;
}): Placed {
  const { W, H, bw, bh, maxBottom, head, faces, avoid, edge } = input;
  const clampX = (x: number) => Math.max(GAP, Math.min(W - GAP - bw, x));
  const clampY = (y: number) => Math.max(GAP, Math.min(maxBottom - bh, y));
  if (head) {
    const A = { x: head.x * W, y: head.y * H };
    const R = head.r * H;
    const toCentre = head.x < 0.5;
    // Leave a visible tail between the ring and the bubble.
    const T = Math.max(22, H * 0.035);
    const raw: [number, number][] = [
      [A.x + R * 0.4, A.y - R * 1.15 - T - bh],
      [A.x - R * 0.4 - bw, A.y - R * 1.15 - T - bh],
      [A.x + R * 1.15 + T, A.y - R * 0.6 - bh * 0.5],
      [A.x - R * 1.15 - T - bw, A.y - R * 0.6 - bh * 0.5],
      [A.x + R * 1.1 + T, A.y + R * 0.5],
      [A.x - R * 1.1 - T - bw, A.y + R * 0.5],
    ];
    const order = toCentre ? [0, 2, 1, 3, 4, 5] : [1, 3, 0, 2, 5, 4];
    const headBox = { x: A.x - R * 1.15 - T * 0.6, y: A.y - R * 1.15 - T * 0.6, w: R * 2.3 + T * 1.2, h: R * 2.3 + T * 1.2 };
    const faceBoxes = faces.map((f) => ({ x: f.x * W - f.r * H, y: f.y * H - f.r * H, w: f.r * H * 2, h: f.r * H * 2 }));
    let best = { score: Infinity, x: 0, y: 0 };
    order.forEach((index, rank) => {
      const [rx, ry] = raw[index];
      const x = clampX(rx);
      const y = clampY(ry);
      const box = { x, y, w: bw, h: bh };
      const score =
        overlap(box, headBox) * 40 +
        faceBoxes.reduce((sum, f) => sum + overlap(box, f) * 6, 0) +
        avoid.reduce((sum, r) => sum + overlap(box, r) * 4, 0) +
        (Math.abs(x - rx) + Math.abs(y - ry)) * 3 +
        rank * 30;
      if (score < best.score) best = { score, x, y };
    });
    const box = { x: best.x, y: best.y, w: bw, h: bh };
    const P = { x: Math.max(box.x, Math.min(box.x + bw, A.x)), y: Math.max(box.y, Math.min(box.y + bh, A.y)) };
    const dx = P.x - A.x;
    const dy = P.y - A.y;
    const dist = Math.hypot(dx, dy) || 1;
    const tip = { x: A.x + (dx / dist) * R * 1.12, y: A.y + (dy / dist) * R * 1.12 };
    return { left: box.x, top: box.y, tail: tailPath(box, P, tip), tip, ring: { x: A.x, y: A.y, r: R * 1.12 }, dashed: false };
  }
  if (edge) {
    const t = edge.target;
    let x: number;
    let y: number;
    if (edge.side === "top") {
      x = clampX(W / 2 - bw / 2);
      y = GAP;
    } else if (t) {
      x = clampX(edge.side === "left" ? t.x + t.w + GAP * 2 : t.x - GAP * 2 - bw);
      y = clampY(t.y);
    } else {
      x = edge.side === "left" ? GAP * 3 : W - GAP * 3 - bw;
      y = clampY(H * 0.12);
    }
    const box = { x, y, w: bw, h: bh };
    const goal = t ? { x: t.x + t.w / 2, y: t.y + t.h * 0.35 } : { x: edge.side === "left" ? 0 : edge.side === "right" ? W : W / 2, y: edge.side === "top" ? 0 : y + bh / 2 };
    const P = { x: Math.max(box.x, Math.min(box.x + bw, goal.x)), y: Math.max(box.y, Math.min(box.y + bh, goal.y)) };
    const dx = goal.x - P.x;
    const dy = goal.y - P.y;
    const dist = Math.hypot(dx, dy) || 1;
    const reach = Math.min(dist - (t ? t.w * 0.45 : 0), 48);
    const tip = { x: P.x + (dx / dist) * Math.max(reach, 12), y: P.y + (dy / dist) * Math.max(reach, 12) };
    return { left: x, top: y, tail: tailPath(box, P, tip), tip, ring: null, dashed: true };
  }
  return { left: clampX(W / 2 - bw / 2), top: clampY(H * 0.1), tail: "", tip: null, ring: null, dashed: false };
}

/** A wedge from the bubble edge facing the tip (base hidden under the bubble) to the tip. */
function tailPath(box: Rect, P: { x: number; y: number }, tip: { x: number; y: number }) {
  const half = Math.min(10, box.w / 6, box.h / 3);
  const inset = 4;
  let b1: [number, number];
  let b2: [number, number];
  if (tip.y > box.y + box.h || tip.y < box.y) {
    const below = tip.y > box.y + box.h;
    const cx = Math.max(box.x + 14 + half, Math.min(box.x + box.w - 14 - half, P.x));
    const y = below ? box.y + box.h - inset : box.y + inset;
    b1 = [cx - half, y];
    b2 = [cx + half, y];
  } else {
    const left = tip.x < box.x;
    const cy = Math.max(box.y + 12 + half, Math.min(box.y + box.h - 12 - half, P.y));
    const x = left ? box.x + inset : box.x + box.w - inset;
    b1 = [x, cy - half];
    b2 = [x, cy + half];
  }
  return `M${b1[0].toFixed(1)},${b1[1].toFixed(1)} L${tip.x.toFixed(1)},${tip.y.toFixed(1)} L${b2[0].toFixed(1)},${b2[1].toFixed(1)} Z`;
}

