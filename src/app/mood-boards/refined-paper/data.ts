// Server-only data prep for the refined-paper board. Reads our real exported
// figure data at build time, downsamples it, and hands small arrays to figures.
import fs from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), "content", "figures-data");
const read = <T,>(f: string): T => JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")) as T;

type Curve = { runId: string; method: string; scoring: string; prAuc: number; points: [number, number][] };
type PrFile = { positiveRate: number; curves: Curve[] };

/** Keep every nth point plus the last, rounded to 3 decimals. */
function thin<T extends number[]>(pts: T[], target: number): T[] {
  const step = Math.max(1, Math.floor(pts.length / target));
  const out = pts.filter((_, i) => i % step === 0);
  if (out[out.length - 1] !== pts[pts.length - 1]) out.push(pts[pts.length - 1]);
  return out.map((p) => p.map((v) => Math.round(v * 1000) / 1000) as T);
}

export type PrSeries = { key: string; label: string; scoring: string; ap: number; points: [number, number][] };

function pick(file: PrFile, runId: string, scoring: string, label: string, n = 70): PrSeries {
  const c = file.curves.find((x) => x.runId === runId && x.scoring === scoring);
  if (!c) throw new Error(`missing curve ${runId} ${scoring}`);
  return { key: `${runId}-${scoring}`, label, scoring, ap: c.prAuc, points: thin(c.points, n) };
}

export function getPrM1() {
  const f = read<PrFile>("pr-curves-m1.json");
  return {
    positiveRate: f.positiveRate,
    gmm: pick(f, "gmm_m1", "Neg. log-lik.", "GMM, K = 21", 160),
    kmeans: pick(f, "kmeans_k8_m1", "Centroid dist.", "K-Means, K = 8", 160),
  };
}

export function getPrM2Multiples() {
  const f = read<PrFile>("pr-curves-m2.json");
  return {
    positiveRate: f.positiveRate,
    series: [
      pick(f, "gmm_m2", "Neg. log-lik.", "GMM"),
      pick(f, "capvae_run1_m2", "Neg. ELBO", "CapacityVAE"),
      pick(f, "hvae_run1_m2", "Recon. MSE", "HierarchicalVAE"),
      pick(f, "tvae_run1_m2", "Neg. ELBO", "TransformerVAE"),
    ],
  };
}

type TimelineFile = {
  nTest: number;
  anomalySegments: [number, number][];
  series: { runId: string; bins: [number, number, number, number][] }[];
};

export function getTimelineM1() {
  const f = read<TimelineFile>("score-timelines-m1.json");
  const s = f.series.find((x) => x.runId === "gmm_m1")!;
  const group = 4;
  const bins: [number, number, number][] = [];
  for (let i = 0; i < s.bins.length; i += group) {
    const g = s.bins.slice(i, i + group);
    const med = g.reduce((a, b) => a + b[1], 0) / g.length;
    const max = Math.max(...g.map((b) => b[2]));
    bins.push([g[0][0] / f.nTest, Math.round(med * 100) / 100, Math.round(max * 100) / 100]);
  }
  // Merge segments that would touch at this resolution, keep the normalized span.
  const segs: [number, number][] = [];
  for (const [a, b] of f.anomalySegments) {
    const x0 = a / f.nTest, x1 = b / f.nTest;
    const last = segs[segs.length - 1];
    if (last && x0 - last[1] < 0.0015) last[1] = x1;
    else segs.push([x0, x1]);
  }
  return { bins, segments: segs.map(([a, b]) => [+a.toFixed(4), +Math.max(b, a + 0.0008).toFixed(4)] as [number, number]), nSegments: f.anomalySegments.length, nTest: f.nTest };
}

type BicFile = { final: Record<"m1" | "m2", { selectedK: number; reference: { subsystems: number; groups: number }; sweep: { k: number; bic: number }[] }> };

export function getBicM1() {
  const f = read<BicFile>("gmm-bic-sweeps.json").final.m1;
  return { selectedK: f.selectedK, reference: f.reference, sweep: f.sweep.map((s) => ({ k: s.k, bic: Math.round(s.bic / 1e3) / 1e3 })) };
}

type GmmFile = {
  subsystemColumns: string[];
  groupColumns: string[];
  components: { component: number; weight: number; bySubsystem: number[]; byGroup: number[]; anomalyRate: number }[];
};

export function getGmmGraph() {
  const f = read<GmmFile>("gmm-components-m1.json");
  const top = [...f.components].sort((a, b) => b.weight - a.weight).slice(0, 6);
  const comps = top.map((c) => {
    const tot = c.bySubsystem.reduce((a, b) => a + b, 0);
    const gTot = c.byGroup.reduce((a, b) => a + b, 0);
    const groups = c.byGroup
      .map((v, i) => ({ g: f.groupColumns[i].replace("group_", ""), share: v / gTot }))
      .sort((a, b) => b.share - a.share)
      .slice(0, 2);
    return {
      id: c.component,
      weight: c.weight,
      anomalyRate: c.anomalyRate,
      subsystems: c.bySubsystem.map((v, i) => ({ s: f.subsystemColumns[i].replace("subsystem_", ""), share: v / tot })).filter((x) => x.share > 0.05),
      groups,
    };
  });
  const groupIds = Array.from(new Set(comps.flatMap((c) => c.groups.map((g) => g.g)))).sort((a, b) => +a - +b);
  return { subsystems: f.subsystemColumns.map((s) => s.replace("subsystem_", "")), comps, groupIds };
}
