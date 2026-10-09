import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { isDone, isTyping, skipReveal, startReveal, stepReveal, type Reveal } from "@/game/reveal";

/**
 * UI V4 layout pieces: a full-bleed 16:9 stage (scene painting), a round wooden status frame
 * top-left, and an old-paper panel (speaker portrait for dialogue) at the
 * bottom with hanging paper tags for choices. No text is ever baked into an image.
 */

export type Status = { label: string; portrait: string | null; afternoons: number | null };

export const StatusContext = createContext<Status>({ label: "", portrait: null, afternoons: null });

/** Stage on top, panel below on narrow screens; panel laid over the painting's foot on wide ones. */
export function Frame({ picture, overlay, stage, panel, onStageClick, label }: { picture: string; overlay?: ReactNode; stage?: ReactNode; panel: ReactNode; onStageClick?: () => void; label?: string }) {
  return (
    <section aria-label={label} className="ui-stage-frame relative flex h-full w-full flex-col md:aspect-video md:h-auto md:w-[min(calc(100vw-3rem),calc((100dvh-3rem)*16/9))] md:rounded-sm">
      <div className="ui-stage relative aspect-video w-full shrink-0 overflow-hidden bg-[#2a1d12] md:absolute md:inset-0 md:aspect-auto md:h-full md:rounded-sm" onClick={onStageClick}>
        <img src={picture} alt="" decoding="async" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_40%,transparent_55%,rgb(20_12_6/0.45))]" />
        {overlay}
        <StatusFrame />
        {stage}
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col px-1.5 pb-1.5 pt-2 md:absolute md:inset-x-[2%] md:bottom-[2.5%] md:max-h-[38%] md:flex-none md:p-0">{panel}</div>
    </section>
  );
}

function StatusFrame() {
  const { label, portrait } = useContext(StatusContext);
  if (!label && !portrait) return null;
  return (
    <div data-avoid="status" className="pointer-events-none absolute left-2 top-2 flex flex-col items-start md:left-[2%] md:top-[3%]">
      {portrait ? (
        <div className="ui-wood-ring rounded-full p-1.5 md:p-2">
          <div className="h-12 w-12 overflow-hidden rounded-full bg-[radial-gradient(circle_at_50%_35%,#f6eedb,#d9c7a2)] md:h-20 md:w-20">
            <img src={portrait} alt="" decoding="async" className="-ml-[10%] mt-[4%] h-auto w-[120%] max-w-none" />
          </div>
        </div>
      ) : null}
      {label ? <p className={`ui-paper-label -rotate-2 rounded-sm px-2 py-0.5 font-serif text-sm tracking-wide md:text-lg ${portrait ? "-mt-1.5 ml-3" : ""}`}>{label}</p> : null}
    </div>
  );
}

/** The long old-paper panel. `side` holds the hanging tags; on narrow screens they drop below the text. */
export function PaperPanel({ heading, children, side, live, portrait, log }: { heading?: ReactNode; children: ReactNode; side?: ReactNode; live?: ReactNode; portrait?: ReactNode; log?: ReactNode }) {
  const { afternoons } = useContext(StatusContext);
  return (
    <div className="ui-panel flex h-full min-h-0 rounded-md md:h-auto">
      {log}
      <div aria-hidden="true" className="ui-scroll-end relative my-4 ml-1.5 w-3.5 shrink-0 rounded-sm md:ml-2 md:w-5" />
      {portrait ? <div className="ml-2 md:ml-3">{portrait}</div> : null}
      <div className="flex min-h-0 flex-1 flex-col gap-1 pb-7 pl-2 pr-3 pt-4 md:flex-row md:gap-4 md:pl-3">
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {heading ? (
            <div className="mb-1 flex items-center gap-2">
              <Mug />
              {heading}
            </div>
          ) : null}
          {live}
          {children}
        </div>
        {side ? <div className="ui-tags max-h-[48%] shrink-0 overflow-y-auto px-1 pb-1 md:max-h-none md:w-[42%] md:max-w-xl">{side}</div> : null}
      </div>
      {afternoons !== null ? (
        <p className="pointer-events-none absolute bottom-1.5 right-3 flex items-center gap-1 font-serif text-sm text-[#5c3a1e]" aria-label={`今年還有 ${afternoons} 個下午`}>
          <Bag />
          <span>下午 {afternoons}/2</span>
        </p>
      ) : null}
    </div>
  );
}

export function PanelHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs tracking-wide text-ink/60">{kicker}</p>
      <h1 className="font-serif text-lg leading-snug text-pretty text-ink md:text-xl">{title}</h1>
    </div>
  );
}

/** A hanging paper tag. Used for every choice and every "next" button. */
export function Tag({ label, detail, hint, onClick, disabled = false, main = false, tagRef }: { label: string; detail?: string; hint?: string; onClick: () => void; disabled?: boolean; main?: boolean; tagRef?: Ref<HTMLButtonElement> }) {
  return (
    <button
      ref={tagRef}
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-main={main ? "true" : undefined}
      className="ui-tag mt-4 flex min-h-12 w-full shrink-0 flex-col items-start justify-center rounded-sm px-3 pb-2 pt-4 text-left focus-visible:outline-[#5c3a1e]"
    >
      <span className="flex w-full items-baseline justify-between gap-2">
        <span className="min-w-0 flex-1 font-serif text-base font-medium text-pretty">{label}</span>
        {hint ? <span className="shrink-0 text-xs text-ink/65">{hint}</span> : null}
      </span>
      {detail ? <span className="text-sm text-pretty text-ink/70">{detail}</span> : null}
    </button>
  );
}

export type Side = "left" | "right";

/** Head-and-shoulders portrait at the panel's left edge, name plate under it, framed in the speaker's accent. */
export function PanelPortrait({ src, height, name, accent }: { src: string; height: number; name: string; accent: string }) {
  return (
    <div data-portrait={name} className="ui-portrait flex shrink-0 flex-col items-center self-start pt-4" style={{ ["--accent" as string]: accent }}>
      <div className="ui-bust relative aspect-[4/5] w-16 overflow-hidden rounded-t-full md:w-[6.5rem]">
        {/* Sprites are full-length and of different widths; size by height so every head comes out the same size. */}
        <img src={src} alt="" decoding="async" className="absolute left-1/2 top-[7%] w-auto max-w-none -translate-x-1/2" style={{ height: `${height}%` }} />
      </div>
      <p className="ui-nameplate relative z-10 -mt-2 rounded-sm px-2 py-0.5 font-serif text-xs tracking-wide md:text-sm">{name}</p>
    </div>
  );
}

const TYPE_MS = 32;

function prefersStill() {
  if (typeof window === "undefined" || !window.matchMedia) return true;
  try {
    if (window.localStorage.getItem("hk-life-typewriter") === "0") return true;
  } catch {
    // storage blocked: keep the default
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Line-by-line reveal with an optional typewriter (off under prefers-reduced-motion, or with
 * localStorage hk-life-typewriter=0). advance() first finishes the line being typed, then shows
 * the next one. skip() shows everything. The rules live in game/reveal.ts.
 */
export function useReveal(lengths: readonly number[]) {
  const still = useRef(prefersStill());
  const [r, setR] = useState<Reveal>(() => startReveal(still.current));
  const typing = isTyping(r, lengths);
  const done = isDone(r, lengths);

  useEffect(() => {
    if (!typing) return;
    const id = window.setInterval(() => setR((prev) => ({ ...prev, chars: prev.chars + 1 })), TYPE_MS);
    return () => window.clearInterval(id);
  }, [typing, r.shown]);

  const key = lengths.join(",");
  const advance = useCallback(() => setR((prev) => stepReveal(prev, lengths, still.current)), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const skip = useCallback(() => setR(skipReveal(lengths)), [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return { shown: Math.min(r.shown, lengths.length), chars: r.chars, typing, done, advance, skip };
}

/** Space or Enter advances when focus is not on a control that already uses those keys. */
export function useAdvanceKeys(active: boolean, advance: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== " " && event.key !== "Enter") return;
      const target = event.target as HTMLElement | null;
      if (target && target.closest("button, a, input, textarea, select, summary, [contenteditable='true']")) return;
      event.preventDefault();
      advance();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, advance]);
}

/** Small enamel mug: white enamel, dark rim, a chip. */
export function Mug() {
  return (
    <svg aria-hidden="true" viewBox="0 0 28 28" className="h-6 w-6 shrink-0 md:h-7 md:w-7">
      <path d="M5 8h14v12a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z" fill="#efe8d8" stroke="#35665d" strokeWidth="1.6" />
      <path d="M19 11h2.5a3 3 0 0 1 0 6H19" fill="none" stroke="#35665d" strokeWidth="1.6" />
      <ellipse cx="12" cy="8" rx="7" ry="1.6" fill="#35665d" />
      <circle cx="9" cy="17" r="1" fill="#5c3a1e" opacity="0.7" />
    </svg>
  );
}

/** Small striped plastic bag. */
export function Bag() {
  return (
    <svg aria-hidden="true" viewBox="0 0 28 28" className="h-5 w-5 shrink-0 md:h-6 md:w-6">
      <path d="M9 9c0-3 2-5 5-5s5 2 5 5" fill="none" stroke="#7a3d2c" strokeWidth="1.6" />
      <path d="M6 9h16l-1.5 14h-13z" fill="#efe8d8" stroke="#7a3d2c" strokeWidth="1.4" />
      <path d="M7 13h14M7.4 17h13.2M7.8 21h12.4" stroke="#8d4a36" strokeWidth="1.6" opacity="0.8" />
    </svg>
  );
}
