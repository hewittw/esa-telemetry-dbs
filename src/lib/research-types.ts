export type Study = {
  slug: string;
  name: string;
  url: string;
  category: "Space & hardware" | "Interactive figures" | "Motion & craft" | "Data explorers";
  oneLine: string;
  moodWords: string[];
  palette: { hex: string; role: string; note: string }[];
  type: { family: string; role: string; note: string }[];
  layout: string[];
  motion: string[];
  interactions: string[];
  steal: string[];
  leave: string[];
  relevance: number;
  screenshots: { src: string; caption: string }[];
};

export const CATEGORIES = ["Space & hardware", "Interactive figures", "Motion & craft", "Data explorers"] as const;
