/**
 * Static scan of player-facing strings, split into the two wording layers (see src/game/wording.ts).
 * - dialogue: the text arguments of say(...), `speaker:` objects, and 「quoted speech」 inside other strings.
 * - narration: every other string literal (narration, action, labels, results, titles).
 * Node only. Used by src/game/playtest-audit.test.ts and scripts/voice-report.ts.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { SPEAKERS, type Register, type Speaker } from "../src/game/scene.ts";
import { quotedSpeaker, quotedSpeech } from "../src/game/wording.ts";

export type NarrationItem = { file: string; text: string };
export type DialogueItem = { file: string; speaker: Speaker | null; register?: Register; text: string; quoted: boolean };

const REGISTERS = ["formal", "narrative", "colloquial"];
const LITERAL = /"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g;

export function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !name.endsWith(".test.ts") && name !== "wording.ts" ? [path] : [];
  });
}

export function stripComments(text: string) {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
}

function unquote(literal: string) {
  return literal.slice(1, -1).replace(/\$\{[^}]*\}/g, "…");
}

/** End index (exclusive) of the call whose "(" is at `open`, skipping strings. */
function closeParen(code: string, open: number) {
  let depth = 0;
  for (let i = open; i < code.length; i++) {
    const c = code[i];
    if (c === '"' || c === "`" || c === "'") {
      const q = c;
      for (i++; i < code.length && code[i] !== q; i++) if (code[i] === "\\") i++;
      continue;
    }
    if (c === "(") depth++;
    else if (c === ")" && --depth === 0) return i + 1;
  }
  return code.length;
}

function mask(code: string, from: number, to: number) {
  return code.slice(0, from) + " ".repeat(to - from) + code.slice(to);
}

export function scanFile(file: string, raw: string) {
  let code = stripComments(raw);
  const dialogue: DialogueItem[] = [];
  const narration: NarrationItem[] = [];
  const sayCall = /(?<![\w.$])say\(/g;
  for (let m = sayCall.exec(code); m; m = sayCall.exec(code)) {
    const open = m.index + 3;
    const end = closeParen(code, open);
    const args = code.slice(open + 1, end - 1);
    const literals = (args.match(LITERAL) ?? []).map(unquote);
    const speaker = (SPEAKERS as readonly string[]).includes(literals[0] ?? "") ? (literals[0] as Speaker) : null;
    const register = literals.find((item) => REGISTERS.includes(item)) as Register | undefined;
    for (const text of literals.slice(speaker ? 1 : 0)) {
      if (REGISTERS.includes(text) || !text.trim() || /^[A-Z0-9_]+$/.test(text)) continue;
      dialogue.push({ file, speaker, register, text, quoted: false });
    }
    code = mask(code, m.index, end);
    sayCall.lastIndex = end;
  }
  const spokenObj = /speaker:\s*"([^"]+)"\s*,\s*(?:register:\s*"(\w+)"\s*,\s*)?text:\s*("(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`)/g;
  for (const m of code.matchAll(spokenObj)) {
    dialogue.push({ file, speaker: m[1] as Speaker, register: m[2] as Register | undefined, text: unquote(m[3]), quoted: false });
  }
  code = code.replace(spokenObj, (all) => " ".repeat(all.length));
  for (const literal of code.match(LITERAL) ?? []) {
    const text = unquote(literal);
    narration.push({ file, text });
    for (const speech of quotedSpeech(text)) {
      dialogue.push({ file, speaker: quotedSpeaker(text, speech), text: speech, quoted: true });
    }
  }
  return { dialogue, narration };
}

export function scanSources(root: string) {
  const dialogue: DialogueItem[] = [];
  const narration: NarrationItem[] = [];
  for (const file of sourceFiles(root)) {
    const scanned = scanFile(file.replace(root, ""), readFileSync(file, "utf8"));
    dialogue.push(...scanned.dialogue);
    narration.push(...scanned.narration);
  }
  return { dialogue, narration };
}
