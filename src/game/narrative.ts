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

/** The only arc in this slice. Ah Kit, the red ball, the next day, and the next year. */
export const ARC_AH_KIT: NarrativeArc = {
  id: "ARC_AH_KIT_FRIENDSHIP",
  chapterId: "CH_1985_CHILDHOOD",
  npcId: "NPC_FRIEND_01",
  echoWindow: ["next-day", "1y"],
  missedMeaning: "他仍在平台過完那個下午。你不在場。",
};

export function echoOpen(arc: NarrativeArc, window: EchoWindow) {
  return arc.echoWindow.includes(window);
}
