import { useEffect, useRef, type RefObject } from "react";
import { actBattle, createBattle, stepBattle, type BattleAction, type BattleSim } from "@/game/battleSim";
import type { Approach, BattleOutcome } from "@/game/types";

type Props = {
  approach: Approach;
  hp: number;
  sp: number;
  tidy: boolean;
  see: boolean;
  ask: boolean;
  practiced: boolean;
  onEnd: (outcome: BattleOutcome) => void;
};

const INK = "#241c14";
const AMBER = "#c9843a";
const PAPER = "#f3ead7";

export function Battle({ approach, hp, sp, tidy, see, ask, practiced, onEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<BattleSim>(createBattle({ approach, hp, sp, tidy, see, ask, practiced }));
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;
  const hintRef = useRef<HTMLParagraphElement>(null);
  const hpRef = useRef<HTMLDivElement>(null);
  const spRef = useRef<HTMLDivElement>(null);
  const stressRef = useRef<HTMLDivElement>(null);
  const meterRef = useRef<HTMLDivElement>(null);
  const hpLabel = useRef<HTMLSpanElement>(null);
  const spLabel = useRef<HTMLSpanElement>(null);
  const stressLabel = useRef<HTMLSpanElement>(null);
  const buttons = useRef<Partial<Record<BattleAction, HTMLButtonElement | null>>>({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sim = createBattle({ approach, hp, sp, tidy, see, ask, practiced });
    simRef.current = sim;
    const image = new Image();
    image.src = "/scenes/kindy.jpg";
    let raf = 0;
    let last = performance.now();
    let dead = false;
    let reported = false;
    let hud = 0;

    const paintHud = () => {
      if (hpRef.current) hpRef.current.style.width = `${(sim.hp / sim.maxHp) * 100}%`;
      if (spRef.current) spRef.current.style.width = `${(sim.sp / sim.maxSp) * 100}%`;
      if (stressRef.current) stressRef.current.style.width = `${sim.stress}%`;
      if (meterRef.current) meterRef.current.style.width = `${Math.min(100, sim.x)}%`;
      if (hpLabel.current) hpLabel.current.textContent = String(Math.round(sim.hp));
      if (spLabel.current) spLabel.current.textContent = String(Math.round(sim.sp));
      if (stressLabel.current) stressLabel.current.textContent = String(Math.round(sim.stress));
      if (hintRef.current) hintRef.current.textContent = sim.hint;
      const costs: Record<BattleAction, number> = { walk: 2, guard: 3, read: 6, see: 8, ask: 8 };
      (Object.keys(costs) as BattleAction[]).forEach((name) => {
        const button = buttons.current[name];
        if (!button) return;
        const broke = name !== "walk" && sim.sp < costs[name];
        button.disabled = sim.cd[name] > 0 || broke;
      });
      const shell = canvas.parentElement;
      if (shell) shell.style.transform = sim.shake > 0 ? "translateX(3px)" : "none";
    };

    const loop = (now: number) => {
      if (dead) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      stepBattle(sim, dt);
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(280, rect.width);
      const h = Math.max(168, rect.height);
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(ctx, sim, image, w, h);
      hud += dt;
      if (hud > 0.08) {
        hud = 0;
        paintHud();
      }
      if (sim.over && !reported) {
        reported = true;
        paintHud();
        onEndRef.current({ kind: sim.over, stress: sim.stress, hp: sim.hp });
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
    };
  }, [approach, ask, hp, practiced, see, sp, tidy]);

  const press = (name: BattleAction, enabled = true) => {
    actBattle(simRef.current, name, enabled);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-2xl border border-line/40">
        <div className="relative h-52 bg-bg sm:h-64">
          <canvas ref={canvasRef} className="h-full w-full" />
        </div>
        <div className="grid gap-3 bg-paper px-4 py-3 text-ink">
          <Meter label="精神力" barRef={hpRef} valueRef={hpLabel} tone="bg-estate" />
          <Meter label="氣力" barRef={spRef} valueRef={spLabel} tone="bg-amber" />
          <Meter label="壓力" barRef={stressRef} valueRef={stressLabel} tone="bg-ink" />
          <Meter label="入到課室" barRef={meterRef} tone="bg-estate" />
          <p ref={hintRef} className="min-h-12 text-sm text-pretty text-ink/70">
            阿媽鬆開手。
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <BattleButton
          label="向前行"
          detail="氣力 2，唔夠就慢行"
          buttonRef={(node) => {
            buttons.current.walk = node;
          }}
          onClick={() => press("walk")}
        />
        <BattleButton
          label="停低呼吸"
          detail="氣力 3，擋一半"
          buttonRef={(node) => {
            buttons.current.guard = node;
          }}
          onClick={() => press("guard")}
        />
        <BattleButton
          label="跟住讀"
          detail={practiced ? "氣力 6，你跟得熟" : "氣力 6，未跟熟，冇咁有效"}
          buttonRef={(node) => {
            buttons.current.read = node;
          }}
          onClick={() => press("read")}
        />
        {see ? (
          <BattleButton
            label="睇面色"
            detail="氣力 8，避開下一聲"
            buttonRef={(node) => {
              buttons.current.see = node;
            }}
            onClick={() => press("see", see)}
          />
        ) : null}
        {ask ? (
          <BattleButton
            label="問問題"
            detail="氣力 8，走近少少"
            buttonRef={(node) => {
              buttons.current.ask = node;
            }}
            onClick={() => press("ask", ask)}
          />
        ) : null}
      </div>
      <p className="text-sm text-pretty text-paper/70">
        {practiced ? "你識跟住讀。跟住讀，壓力會落得多啲。" : "你未跟熟。跟住讀都得，但個聲好細。"}
        氣力用嚟行、停、跟住讀。今日入唔到，可以再試，唔會完。
      </p>
    </div>
  );
}

function draw(ctx: CanvasRenderingContext2D, sim: BattleSim, image: HTMLImageElement | null, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  if (image && image.complete && image.naturalWidth) {
    const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
    const dw = image.naturalWidth * scale;
    const dh = image.naturalHeight * scale;
    ctx.drawImage(image, (w - dw) / 2, (h - dh) / 2, dw, dh);
  } else {
    ctx.fillStyle = "#35665d";
    ctx.fillRect(0, 0, w, h);
  }
  ctx.fillStyle = "rgba(28,25,22,0.28)";
  ctx.fillRect(0, 0, w, h);
  const floor = h * 0.78;
  ctx.fillStyle = "rgba(36,28,20,0.35)";
  ctx.fillRect(0, floor, w, h - floor);
  const doorX = w * 0.86;
  ctx.fillStyle = "rgba(243,234,215,0.88)";
  ctx.fillRect(doorX, h * 0.3, w * 0.07, floor - h * 0.3);
  if (sim.x < 42) {
    const mx = w * 0.08;
    ctx.fillStyle = INK;
    ctx.fillRect(mx, floor - 58, 16, 40);
    ctx.beginPath();
    ctx.arc(mx + 8, floor - 68, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const wave of sim.waves) {
    const wx = (wave.x / 100) * w;
    ctx.fillStyle = "rgba(36,28,20,0.45)";
    ctx.beginPath();
    ctx.ellipse(wx, floor - 30, 36, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const px = (sim.x / 100) * w;
  const py = floor - 8;
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(px, py - 46, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = AMBER;
  ctx.fillRect(px - 9, py - 34, 18, 24);
  ctx.fillStyle = INK;
  ctx.fillRect(px - 12, py - 8, 7, 14);
  ctx.fillRect(px + 5, py - 8, 7, 14);
  if (sim.guard > 0) {
    ctx.strokeStyle = PAPER;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py - 28, 26, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function Meter({
  label,
  barRef,
  valueRef,
  tone,
}: {
  label: string;
  barRef: RefObject<HTMLDivElement | null>;
  valueRef?: RefObject<HTMLSpanElement | null>;
  tone: string;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-ink/70">
        <span>{label}</span>
        {valueRef ? <span ref={valueRef} className="tabular-nums" /> : <span />}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-line">
        <div ref={barRef} className={`meter h-1.5 rounded-full ${tone}`} style={{ width: "0%" }} />
      </div>
    </div>
  );
}

function BattleButton({
  label,
  detail,
  onClick,
  buttonRef,
}: {
  label: string;
  detail: string;
  onClick: () => void;
  buttonRef: (node: HTMLButtonElement | null) => void;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      className="flex min-h-12 flex-col items-start justify-center rounded-xl bg-amber px-3 py-2 text-left text-ink disabled:opacity-40"
    >
      <span className="text-base font-medium">{label}</span>
      <span className="text-xs text-ink/70">{detail}</span>
    </button>
  );
}
