import type { MoodBoardMeta } from "@/lib/mood-board-types";

export const board: MoodBoardMeta = {
  slug: "intense-space",
  name: "Charged · Fibrous · Instrumented",
  moodWords: ["Charged", "Fibrous", "Instrumented"],
  summary:
    "A deep-space control room drawn in steered fiber: charcoal void, telemetry strands that flare where the faults are, and bracketed mono readouts, so the findings read like a live instrument rather than a paper.",
  palette: [
    { hex: "#0A0B0D", name: "Void" },
    { hex: "#333333", name: "Charcoal" },
    { hex: "#CFD9E0", name: "Frost" },
    { hex: "#37FD08", name: "Fiber Green" },
    { hex: "#E04FD6", name: "Fault Magenta" },
    { hex: "#4BCFE0", name: "Survey Teal" },
  ],
  artifactCount: 28,
  generatedCount: 14,
  preview: "/mood-boards/intense-space/preview.jpg",
  references: ["icomat", "planet", "nasa-eyes", "helion"],
};
