import type { MoodBoardMeta } from "@/lib/mood-board-types";

export const board: MoodBoardMeta = {
  slug: "refined-paper",
  name: "Lucid · Patient · Inked",
  moodWords: ["Lucid", "Patient", "Inked"],
  summary:
    "The paper as a well-made journal page: warm paper, a serif for the argument, ink-blue plot lines named by matching words, and one vermilion path, so peers trust the rigor and recruiters read the finding in a glance.",
  palette: [
    { hex: "#F6F2EA", name: "Paper" },
    { hex: "#ECE6D8", name: "Parchment" },
    { hex: "#211F1B", name: "Ink" },
    { hex: "#2D5B88", name: "Prussian" },
    { hex: "#B0401C", name: "Vermilion" },
  ],
  artifactCount: 28,
  generatedCount: 14,
  preview: "/mood-boards/refined-paper/preview.jpg",
  references: ["ciechanowski", "r2d3", "activation-atlas", "distill-tsne", "anthropic-biology"],
};
