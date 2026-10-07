import { judgeBalance, provePerfect, runGateSample } from "../src/game/battleBalance.ts";
import { BATTLE_SPECS } from "../src/game/battleSpec.ts";
import { DAILY_STATIC_IDS, renderStatic, STATIC_EVENTS } from "../src/game/data/events.ts";
import { runLives } from "../src/game/lifeSim.ts";

const lives = runLives(1000);
console.log("battle audit v3.1");
console.log(`lives n=${lives.n} ended=${lives.ended} stuck=${JSON.stringify(lives.stuck)}`);
console.log(`events ${lives.events.join(" ")}`);

for (const spec of BATTLE_SPECS) {
  const gateSample = runGateSample(200, spec);
  const gate = judgeBalance(gateSample);
  const mark = spec.gated ? "gated" : "catalog";
  console.log(`spec ${spec.id} ${mark} rounds=${spec.maxRounds} perfectScript=${provePerfect(spec)}`);
  console.log("approach/policy/kit | n | win% | perfect% | fail% | bad%");
  for (const report of gateSample) {
    const pct = (n: number) => (n * 100).toFixed(1).padStart(5);
    console.log(
      `${report.label.padEnd(32)} | ${String(report.n).padStart(4)} | ${pct(report.winRate)} | ${pct(report.rate.perfect)} | ${pct(report.rate.fail)} | ${pct(report.rate.bad)}`,
    );
  }
  if (spec.gated) console.log(`gate ${spec.id} ${gate.status} fails=${JSON.stringify(gate.fails)} reviews=${JSON.stringify(gate.reviews)}`);
  else console.log(`spec ${spec.id} not gated. Shared numbers, own words. Do not read this table as the product gate.`);
}

const started = Date.now();
const lamp = renderStatic(STATIC_EVENTS.EVT_STATIC_LAMP);
const renderMs = Date.now() - started;
console.log(`static dailies ${DAILY_STATIC_IDS.join(" ")}`);
console.log(`pipeline sample ${lamp.card.title} renderMs=${renderMs} choices=${lamp.choices.length}`);
console.log("authoring minutes: unmeasured. This is render time, not a timed human writing session.");
