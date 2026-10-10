import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { isDone, isTyping, startReveal, stepReveal, type Reveal } from "@/game/reveal";
import { placeLabel } from "@/game/scene";

/**
 * UI V4 layout pieces: a full-bleed 16:9 stage (scene painting), a round wooden status frame
 * top-left, and an old-paper panel (speaker portrait for dialogue) at the
 * bottom with hanging paper tags for choices. No text is ever baked into an image.
 */

/** year: the story year on screen (1996 for the fifteen page), null outside the years. It picks the TV headline. */
export type Status = { label: string; portrait: string | null; afternoons: number | null; year: number | null };

export const StatusContext = createContext<Status>({ label: "", portrait: null, afternoons: null, year: null });

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
      <div className="relative flex min-h-0 flex-1 flex-col px-1.5 pb-1.5 pt-2 md:absolute md:inset-x-[2%] md:bottom-[2.5%] md:h-[var(--panel-h)] md:flex-none md:p-0" data-panel-box="true">{panel}</div>
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
            <img src={portrait} alt="" decoding="async" className="block h-full w-full object-cover object-[50%_30%]" />
          </div>
        </div>
      ) : null}
      {label ? <p className={`ui-paper-label -rotate-2 rounded-sm px-2 py-0.5 font-serif text-sm tracking-wide md:text-lg ${portrait ? "-mt-1.5 ml-3" : ""}`}>{label}</p> : null}
    </div>
  );
}

/**
 * True while an element has more content below its visible area. Drives the 「往下還有」 cue on the
 * panel text and the 回看 log, so nothing scrollable is ever hidden without a sign.
 */
export function useScrollCue<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [more, setMore] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setMore(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
    check();
    el.addEventListener("scroll", check, { passive: true });
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(check);
    resize?.observe(el);
    for (const child of Array.from(el.children)) resize?.observe(child);
    const mutate = typeof MutationObserver === "undefined" ? null : new MutationObserver(() => {
      check();
      for (const child of Array.from(el.children)) resize?.observe(child);
    });
    mutate?.observe(el, { childList: true, subtree: true, characterData: true, attributes: true });
    return () => {
      el.removeEventListener("scroll", check);
      resize?.disconnect();
      mutate?.disconnect();
    };
  }, []);
  return { ref, more };
}

/** Fade and a small 「往下還有」 at the bottom of a scrollable area that has more below. */
export function ScrollCue({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div data-scroll-cue="true" aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 flex h-10 items-end justify-center bg-gradient-to-t from-[#efe3c8]/95 to-transparent pb-0.5">
      <span className="ui-scroll-hint rounded-full px-2 text-xs tracking-wide text-[#5c3a1e]">往下還有 ▾</span>
    </div>
  );
}

/**
 * The long old-paper panel. `side` holds the hanging tags; on narrow screens they drop below the text.
 * `next` is the single 下一句 tag while lines are still being read: a narrow column at the panel's
 * right edge, vertically centred, so the text keeps most of the width.
 * `sideSize="narrow"` does the same for one or two tags (繼續, 再試一次…): the text gets the width.
 * `locked` makes the tags ignore input for a moment after they appear (no accidental double-click choice).
 */
export function PaperPanel({ heading, children, side, next, live, portrait, log, sideSize = "wide", locked = false }: { heading?: ReactNode; children: ReactNode; side?: ReactNode; next?: ReactNode; live?: ReactNode; portrait?: ReactNode; log?: ReactNode; sideSize?: "narrow" | "wide"; locked?: boolean }) {
  const { afternoons } = useContext(StatusContext);
  const cue = useScrollCue<HTMLDivElement>();
  const swallow = (event: { preventDefault: () => void; stopPropagation: () => void }) => {
    if (!locked) return;
    event.preventDefault();
    event.stopPropagation();
  };
  return (
    <div className="ui-panel flex h-full min-h-0 rounded-md">
      {log}
      {portrait ? <div data-portrait-slot="true" className="flex shrink-0 self-start py-3 pl-3 md:h-full md:items-center md:self-stretch md:py-0 md:pl-5">{portrait}</div> : null}
      <div className={`flex min-h-0 flex-1 flex-col gap-1 pl-3 pr-3 pt-4 md:flex-row md:gap-5 md:pb-7 md:pl-4 md:pr-4 ${afternoons !== null ? "pb-8" : "pb-3"}`}>
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div ref={cue.ref} data-panel-text="true" className="min-h-0 flex-1 overflow-y-auto pr-1">
            {heading ? <div className="mb-1.5 flex items-center gap-2">{heading}</div> : null}
            {live}
            {children}
          </div>
          <ScrollCue show={cue.more} />
        </div>
        {next ? (
          <div data-next="true" className="flex shrink-0 justify-end px-1 pb-1 md:w-48 md:self-center md:pb-3">
            <div className="w-full max-w-60 md:max-w-none">{next}</div>
          </div>
        ) : side ? (
          <div
            data-side={sideSize}
            data-locked={locked ? "true" : undefined}
            onClickCapture={swallow}
            onKeyDownCapture={(event) => {
              if (event.key === "Enter" || event.key === " ") swallow(event);
            }}
            className={
              sideSize === "narrow"
                ? "ui-tags ui-tags-narrow shrink-0 px-1 pb-1 md:w-56 md:self-center md:pb-3"
                : "ui-tags ui-tags-wide shrink-0 px-1 pb-1 md:w-[48%] md:self-center md:overflow-hidden md:pb-2"
            }
          >
            {side}
          </div>
        ) : null}
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

/** A small text link that asks once before it acts: 從頭開始 → 「真的從頭開始？」 是 / 不. Kept away from the main tag. */
export function ConfirmLink({ label, question, yes, no, onConfirm }: { label: string; question: string; yes: string; no: string; onConfirm: () => void }) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button type="button" data-confirm-link="true" onClick={() => setAsking(true)} className="min-h-11 rounded-sm px-1 text-sm text-ink/60 underline decoration-dotted underline-offset-4 md:min-h-8">
        {label}
      </button>
    );
  }
  return (
    <span role="group" aria-label={question} data-confirm-ask="true" className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-sm border border-dashed border-[#a77f4c] bg-[#f7efdc] px-2 py-1 text-sm text-ink">
      <span>{question}</span>
      <button type="button" onClick={onConfirm} className="min-h-11 rounded-sm px-2 font-medium text-[#7a3d2c] underline underline-offset-4 md:min-h-8">
        {yes}
      </button>
      <button type="button" autoFocus onClick={() => setAsking(false)} className="min-h-11 rounded-sm px-2 text-ink/75 underline decoration-dotted underline-offset-4 md:min-h-8">
        {no}
      </button>
    </span>
  );
}

/**
 * One row at the top of the panel: the year/time label (1985 · 早上), then the beat title for this
 * story moment (袋子在門口) right beside it, so the title no longer takes its own line in the panel.
 */
export function PanelHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div data-heading="true" className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
      <p className="shrink-0 text-xs tracking-wide text-ink/60 md:text-sm">{kicker}</p>
      <span aria-hidden="true" className="h-3 w-px shrink-0 self-center bg-[#a77f4c]/70 md:h-3.5" />
      <h1 data-beat-title="true" className="min-w-0 font-serif text-base font-medium leading-snug tracking-wide text-pretty text-[#5c3a1e] md:text-lg">{title}</h1>
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

/** Head-and-shoulders portrait at the panel's left edge, framed in the speaker's accent. The name shows above the line (● 爸爸), so no plate here; the bust carries it for screen readers. */
export function PanelPortrait({ src, height, name, accent }: { src: string; height: number; name: string; accent: string }) {
  return (
    <div data-portrait={name} className="ui-portrait ui-portrait-frame flex shrink-0 flex-col items-center rounded-t-full p-1 md:h-[82%] md:p-[0.4rem]" style={{ ["--accent" as string]: accent }}>
      <div role="img" aria-label={name} className="ui-bust relative aspect-[4/5] w-16 overflow-hidden rounded-t-full md:h-full md:w-auto">
        {/* Sprites are full-length and of different widths; size by height so every head comes out the same size. */}
        <img src={src} alt="" decoding="async" className="absolute left-1/2 top-[7%] w-auto max-w-none -translate-x-1/2" style={{ height: `${height}%` }} />
      </div>
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
 * the next one. There is no skip-all: every line is read. The rules live in game/reveal.ts.
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

  return { shown: Math.min(r.shown, lengths.length), chars: r.chars, typing, done, advance };
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

/**
 * Location tag: a small map pin (estate green, paper dot) before the place name, on a faint green
 * paper chip so it reads as a label, not as narration. Brackets in the name are dropped.
 */
export function LocationTag({ place, className = "" }: { place: string; className?: string }) {
  const name = placeLabel(place);
  if (!name) return null;
  return (
    <span data-location={name} className={`ui-location inline-flex items-center gap-1.5 rounded-full py-1 pl-2 pr-3 align-middle font-serif text-sm leading-none tracking-wide md:text-base ${className}`}>
      <Pin />
      <span>{name}</span>
    </span>
  );
}

/** Map pin, inline SVG in the Art Bible palette: estate green #35665d body, paper #f3ead7 dot. */
export function Pin() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 20" className="h-4 w-3.5 shrink-0 md:h-5 md:w-4">
      <path d="M8 1.2a6 6 0 0 0-6 6c0 4.4 6 11.4 6 11.4s6-7 6-11.4a6 6 0 0 0-6-6z" fill="#35665d" stroke="#284d46" strokeWidth="0.9" />
      <circle cx="8" cy="7.2" r="2.3" fill="#f3ead7" />
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
