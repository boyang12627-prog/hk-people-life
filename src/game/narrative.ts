/** Story labels the year already plays. They do not add a quest, and they do not change numbers. */

export type EchoWindow = "next-day" | "1y";

export type NarrativeArc = {
  id: string;
  chapterId: string;
  npcId: "NPC_FRIEND_01";
  echoWindow: readonly EchoWindow[];
  /** What the world keeps when you were not there. */
  missedMeaning: string;
};

/** The only arcs in this slice. They do not add a button, and they do not change numbers by themselves. */
export const ARC_AH_KIT: NarrativeArc = {
  id: "ARC_AH_KIT_FRIENDSHIP",
  chapterId: "CH_1985_CHILDHOOD",
  npcId: "NPC_FRIEND_01",
  echoWindow: ["next-day", "1y"],
  missedMeaning: "他仍在平台過完那個下午。你不在場。",
};

export function echoOpen(arc: { echoWindow: readonly EchoWindow[] }, window: EchoWindow) {
  return arc.echoWindow.includes(window);
}

/** Not a quest. The bag splits on some Saturdays. You only see it if you are on that road. */
export const ENC_ORANGES = {
  id: "ENC_85_ORANGES",
  chapterId: "CH_1985_CHILDHOOD",
  npcId: "NPC_AUNT_01" as const,
  echoWindow: ["1y"] as const,
  missedMeaning: "那些橙散過。她自己撿完。你不在場。",
};
