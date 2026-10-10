import fs from "node:fs";
import path from "node:path";
import type { Study } from "./research-types";

export { CATEGORIES, type Study } from "./research-types";

// Display order matches docs/references.md.
export const ORDER = [
  "planet", "apex", "nasa-eyes", "icomat", "helion", "stoke",
  "ciechanowski", "r2d3", "activation-atlas", "distill-tsne", "anthropic-biology",
  "skyviewer", "igloo", "rauno", "teenage-engineering",
];


const DIR = path.join(process.cwd(), "content", "research");

export function getStudies(): Study[] {
  if (!fs.existsSync(DIR)) return [];
  const studies = fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")) as Study);
  return studies.sort((a, b) => ORDER.indexOf(a.slug) - ORDER.indexOf(b.slug));
}

export function getStudy(slug: string): Study | undefined {
  return getStudies().find((s) => s.slug === slug);
}
