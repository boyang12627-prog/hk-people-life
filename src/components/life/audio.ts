let ctx: AudioContext | null = null;

export function unlockAudio() {
  if (typeof window === "undefined") return;
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
}

export function playRoom(scene: "home" | "kindy" | "corridor" | "market" | "estate") {
  if (!ctx) return;
  const bed = { home: 90, kindy: 220, corridor: 140, market: 180, estate: 70 }[scene];
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(scene === "market" ? 900 : 420, now);
  osc.type = scene === "kindy" ? "triangle" : "sine";
  osc.frequency.setValueAtTime(bed, now);
  osc.frequency.exponentialRampToValueAtTime(bed * 0.8, now + 0.45);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.018, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
  osc.start(now);
  osc.stop(now + 0.52);
}

export function playTone(kind: "tap" | "soft" | "hit" | "good") {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  const now = ctx.currentTime;
  const tone = {
    tap: [540, 0.025, 0.05],
    soft: [320, 0.02, 0.12],
    hit: [140, 0.04, 0.14],
    good: [660, 0.03, 0.16],
  } as const;
  const [freq, volume, dur] = tone[kind];
  osc.type = kind === "hit" ? "triangle" : "sine";
  osc.frequency.setValueAtTime(freq, now);
  if (kind === "good") osc.frequency.exponentialRampToValueAtTime(880, now + dur);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}
