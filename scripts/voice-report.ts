/**
 * Writes docs/VOICE_WARNINGS.md: dialogue a writer may want to read again. Warnings only; nothing is rewritten.
 * Run: node --import ./scripts/register-ts-ext.mjs --experimental-strip-types scripts/voice-report.ts
 */
import { writeFileSync } from "node:fs";
import { dialogueWarnings } from "../src/game/wording.ts";
import { scanSources } from "./voice-scan.ts";

const root = new URL("../src/", import.meta.url).pathname;
const { dialogue } = scanSources(root);
const seen = new Set<string>();
const rows: string[] = [];
for (const item of dialogue) {
  for (const warning of dialogueWarnings(item.speaker, item.text, item.register)) {
    const key = `${item.speaker}|${item.text}|${warning.reason}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(`| ${item.speaker ?? "（未標）"} | ${warning.register} | ${item.text.replace(/\|/g, "／")} | ${warning.reason} | \`${item.file}\`${item.quoted ? "（旁白內引號）" : ""} |`);
  }
}
const body = [
  "# 對白提示（自動產生，只供作者參考）",
  "",
  "這份清單不會令審計失敗，也不會自動改字。旁白和動作才必須是書面中文；對白按 [VOICE.md](VOICE.md) 的聲音寫。",
  "重新產生：`node --import ./scripts/register-ts-ext.mjs --experimental-strip-types scripts/voice-report.ts`",
  "",
  `對白共 ${dialogue.length} 句，提示 ${rows.length} 條。`,
  "",
  "| 說話的人 | 語域 | 句子 | 提示 | 位置 |",
  "|---|---|---|---|---|",
  ...rows,
  "",
].join("\n");
writeFileSync(new URL("../docs/VOICE_WARNINGS.md", import.meta.url), body);
console.log(`dialogue ${dialogue.length}, warnings ${rows.length}`);
