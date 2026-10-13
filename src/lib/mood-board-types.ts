// Contract between each mood board and the hub. Each board exports one of these
// from src/app/mood-boards/<slug>/meta.ts; the hub reads them for its previews.
export type MoodBoardMeta = {
  slug: string;
  name: string; // the mood's name, e.g. "Calm · Matte · Warm"
  moodWords: [string, string, string];
  summary: string; // one sentence: what this direction feels like and why it fits the site
  palette: { hex: string; name: string }[]; // 4–6 swatches, used for the hub preview
  artifactCount: number; // 25–30
  generatedCount: number; // how many are ✦ agent-generated
  preview: string; // /mood-boards/<slug>/preview.jpg (captured after the board is built)
  references: string[]; // research study slugs it remixes
};
