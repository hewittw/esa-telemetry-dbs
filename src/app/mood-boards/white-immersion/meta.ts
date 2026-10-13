import type { MoodBoardMeta } from "@/lib/mood-board-types";
import { ARTIFACTS } from "./board-data";

export const board: MoodBoardMeta = {
  slug: "white-immersion",
  name: "Whiteout · Crystalline · Instrumented",
  moodWords: ["Whiteout", "Crystalline", "Instrumented"],
  summary:
    "A cold, silent white field you fly through: Igloo's glacial HUD world merged with Rubin Skyviewer's deep zoom, inverted so the telemetry becomes a snowfield of data.",
  palette: [
    { hex: "#F4F6F8", name: "Whiteout" },
    { hex: "#FFFFFF", name: "Frost" },
    { hex: "#D5DCE4", name: "Rime" },
    { hex: "#56616F", name: "Glacier" },
    { hex: "#111824", name: "Ink" },
    { hex: "#2FE0E3", name: "Signal" },
  ],
  artifactCount: ARTIFACTS.length, // 28
  generatedCount: ARTIFACTS.filter((a) => a.generated).length, // 14
  preview: "/mood-boards/white-immersion/preview.jpg",
  references: ["igloo", "skyviewer"],
};
