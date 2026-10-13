// Server-only data prep for the refined-paper design system. Reads our real exported
// figure data (content/) at build time and hands small, rounded arrays to the client figures.
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = <T,>(rel: string): T => JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8")) as T;
const fig = <T,>(f: string) => read<T>(`content/figures-data/${f}`);
const r3 = (v: number) => Math.round(v * 1000) / 1000;

/* ------------------------------------------------------------------ WCAG contrast, computed not quoted */
const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export const contrast = (a: string, b: string) => {
  const x = lum(a), y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

/* ------------------------------------------------------------------ Table 1 */
type Row = {
  method: string; label: string; family: "baseline" | "parametric" | "generative"; mission: 1 | 2; latentK: number | null; d: number | null;
  scoring: string; prAuc: number; rocAuc: number; eventF1: number | null; trend: string; trendDirection: "up" | "down" | "best" | null;
  verification?: { status: "exact" | "near" | "mixed" | "not found" };
};
type Results = { table1: { rows: Row[] }; headline: { missions: Record<"1" | "2", Record<string, unknown>> } };

export type MethodRow = Omit<Row, "verification"> & { id: string; verify: "exact" | "near" | "mixed" | "not found" };
export function getTable1(): MethodRow[] {
  const r = read<Results>("content/results.json");
  return r.table1.rows.map(({ verification, ...x }, i) => ({ ...x, id: `r${i}`, verify: verification?.status ?? "not found" }));
}

export type Mission = {
  n: 1 | 2; channels: number; train: number; test: number; hz: number; subsystems: number; groups: number;
  labels: string; testRate: number; events: Record<string, number>; bicK: number; constantRemoved: number;
};
export function getMissions(): Mission[] {
  const r = read<Results>("content/results.json");
  const m = r.headline.missions;
  const pick = (k: "1" | "2", bicK: number): Mission => {
    const x = m[k] as Record<string, never>;
    return {
      n: +k as 1 | 2, channels: x.channels, train: x.trainingTimestepsExact, test: x.testTimestepsExact, hz: x.sampleRateHz,
      subsystems: x.subsystems, groups: x.groups, labels: x.labelType, testRate: x.testAnomalyRate, events: x.anomalyEvents,
      bicK, constantRemoved: x.constantChannelsRemovedForGmm,
    };
  };
  return [pick("1", 21), pick("2", 29)];
}

/* ------------------------------------------------------------------ PR curves */
type Curve = { runId: string; method: string; scoring: string; prAuc: number; rocAuc: number; points: [number, number][]; table1: { row: string; match: string } | null };
type PrFile = { positiveRate: number; nTest: number; curves: Curve[] };
export type PrCurve = { key: string; label: string; family: string; scoring: string; ap: number; exact: boolean; reportAp?: number; points: [number, number][] };
export type PrSet = { mission: 1 | 2; positiveRate: number; nTest: number; curves: PrCurve[] };

/** Resample a PR curve onto a uniform recall grid (0..1, n steps) taking max precision at or after each recall. */
function grid(points: [number, number][], n = 100): [number, number][] {
  const pts = [...points].sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const r = i / n;
    let best = 0;
    for (let j = pts.length - 1; j >= 0 && pts[j][0] >= r - 1e-9; j--) best = Math.max(best, pts[j][1]);
    out.push([r3(r), r3(best || pts[pts.length - 1][1])]);
  }
  return out;
}

function curve(f: PrFile, runId: string, scoring: string, label: string, family: string, reportAp?: number): PrCurve {
  const c = f.curves.find((x) => x.runId === runId && x.scoring === scoring);
  if (!c) throw new Error(`missing curve ${runId} ${scoring}`);
  const exact = c.table1?.match === "exact";
  return { key: `${runId}-${scoring}`, label, family, scoring, ap: r3(c.prAuc), exact, reportAp: exact ? undefined : reportAp, points: grid(c.points) };
}

export function getPr(): PrSet[] {
  const m1 = fig<PrFile>("pr-curves-m1.json");
  const m2 = fig<PrFile>("pr-curves-m2.json");
  return [
    {
      mission: 1, positiveRate: m1.positiveRate, nTest: m1.nTest,
      curves: [
        curve(m1, "gmm_m1", "Neg. log-lik.", "GMM", "parametric"),
        curve(m1, "kmeans_k8_m1", "Centroid dist.", "K-Means", "baseline", 0.322),
        curve(m1, "hvae_run1_m1", "GMM-OOD", "HierarchicalVAE", "generative"),
        curve(m1, "tvae_run1_m1", "Neg. ELBO", "TransformerVAE", "generative", 0.335),
      ],
    },
    {
      mission: 2, positiveRate: m2.positiveRate, nTest: m2.nTest,
      curves: [
        curve(m2, "gmm_m2", "Neg. log-lik.", "GMM", "parametric"),
        curve(m2, "capvae_run1_m2", "Neg. ELBO", "CapacityVAE", "generative", 0.414),
        curve(m2, "hvae_run1_m2", "Recon. MSE", "HierarchicalVAE", "generative", 0.434),
        curve(m2, "tvae_run1_m2", "Neg. ELBO", "TransformerVAE", "generative", 0.438),
      ],
    },
  ];
}

/* ------------------------------------------------------------------ score timelines */
type TlFile = { nTest: number; nAnomalySegments: number; anomalySegments: [number, number][]; series: { runId: string; bins: [number, number, number, number][] }[] };
export type Timeline = { mission: 1 | 2; nTest: number; nSegments: number; bins: [number, number, number, number][]; segments: [number, number][] };

function timeline(file: string, mission: 1 | 2, group: number): Timeline {
  const f = fig<TlFile>(file);
  const s = f.series.find((x) => x.runId.startsWith("gmm"))!;
  const bins: [number, number, number, number][] = [];
  for (let i = 0; i < s.bins.length; i += group) {
    const g = s.bins.slice(i, i + group);
    bins.push([r3(g[0][0] / f.nTest), Math.round((g.reduce((a, b) => a + b[1], 0) / g.length) * 100) / 100, Math.round(Math.max(...g.map((b) => b[2])) * 100) / 100, r3(g.reduce((a, b) => a + b[3], 0) / g.length)]);
  }
  const segs: [number, number][] = [];
  for (const [a, b] of f.anomalySegments) {
    const x0 = a / f.nTest, x1 = b / f.nTest;
    const last = segs[segs.length - 1];
    if (last && x0 - last[1] < 0.0015) last[1] = x1;
    else segs.push([x0, x1]);
  }
  return { mission, nTest: f.nTest, nSegments: f.nAnomalySegments, bins, segments: segs.map(([a, b]) => [+a.toFixed(4), +Math.max(b, a + 0.0008).toFixed(4)]) };
}
export const getTimelines = (): Timeline[] => [timeline("score-timelines-m1.json", 1, 5), timeline("score-timelines-m2.json", 2, 5)];

/* ------------------------------------------------------------------ longest anomaly, twin views */
type LongFile = { segmentStart: number; segmentEnd: number; windowStart: number; windowEnd: number; series: { runId: string; bins: [number, number, number, number][] }[] };
export type Twin = { start: number; end: number; w0: number; w1: number; kmeans: [number, number][]; gmm: [number, number][]; anom: number[] };
export function getLongest(): Twin {
  const f = fig<LongFile>("longest-anomaly-m1.json");
  const take = (id: string) => {
    const s = f.series.find((x) => x.runId === id)!.bins;
    const out: [number, number][] = [];
    for (let i = 0; i < s.length; i += 5) {
      const g = s.slice(i, i + 5);
      out.push([g[0][0], Math.round((g.reduce((a, b) => a + b[1], 0) / g.length) * 100) / 100]);
    }
    return out;
  };
  const km = take("kmeans_k8_m1");
  const s = f.series.find((x) => x.runId === "gmm_m1")!.bins;
  const anom: number[] = [];
  for (let i = 0; i < s.length; i += 5) anom.push(r3(s.slice(i, i + 5).reduce((a, b) => a + b[3], 0) / 5));
  return { start: f.segmentStart, end: f.segmentEnd, w0: f.windowStart, w1: f.windowEnd, kmeans: km, gmm: take("gmm_m1"), anom };
}

/* ------------------------------------------------------------------ BIC sweeps */
type BicFile = { final: Record<"m1" | "m2", { selectedK: number; reference: { subsystems: number; groups: number }; sweep: { k: number; bic: number }[] }> };
export type Bic = { mission: 1 | 2; selectedK: number; subsystems: number; groups: number; sweep: { k: number; bic: number }[] };
export function getBic(): Bic[] {
  const f = fig<BicFile>("gmm-bic-sweeps.json").final;
  return (["m1", "m2"] as const).map((m, i) => ({
    mission: (i + 1) as 1 | 2, selectedK: f[m].selectedK, subsystems: f[m].reference.subsystems, groups: f[m].reference.groups,
    sweep: f[m].sweep.map((s) => ({ k: s.k, bic: Math.round(s.bic / 1e4) / 100 })),
  }));
}

/* ------------------------------------------------------------------ GMM components (M1, K = 21) */
type GmmFile = { ariVsSubsystems: number; ariVsGroups: number; subsystemColumns: string[]; groupColumns: string[]; components: { component: number; weight: number; bySubsystem: number[]; byGroup: number[]; anomalyRate: number; nTotal: number }[] };
export type GmmComp = { id: number; weight: number; anomalyRate: number; sub: number[]; grp: number[] };
export type Gmm = { ariSub: number; ariGrp: number; subs: string[]; groups: string[]; comps: GmmComp[] };
export function getGmm(): Gmm {
  const f = fig<GmmFile>("gmm-components-m1.json");
  const norm = (a: number[]) => { const t = a.reduce((x, y) => x + y, 0) || 1; return a.map((v) => r3(v / t)); };
  return {
    ariSub: f.ariVsSubsystems, ariGrp: f.ariVsGroups,
    subs: f.subsystemColumns.map((s) => s.replace("subsystem_", "")),
    groups: f.groupColumns.map((s) => s.replace("group_", "")),
    comps: f.components.map((c) => ({ id: c.component, weight: c.weight, anomalyRate: c.anomalyRate, sub: norm(c.bySubsystem), grp: norm(c.byGroup) })),
  };
}

/* ------------------------------------------------------------------ channel hierarchy (M1) */
type HierFile = { m1: { subsystems: { subsystem: string; nChannels: number; groups: { group: number; channels: { channel: string; target: boolean }[] }[] }[] } };
export type Channel = { id: number; s: string; g: number; target: boolean };
export function getChannels(): Channel[] {
  const f = fig<HierFile>("channel-hierarchy.json").m1;
  return f.subsystems.flatMap((s) => s.groups.flatMap((g) => g.channels.map((c) => ({ id: +c.channel.replace("channel_", ""), s: s.subsystem.replace("subsystem_", ""), g: g.group, target: c.target }))));
}

/* ------------------------------------------------------------------ anomaly catalogue */
type CatFile = Record<"m1" | "m2", { nEvents: number; byCategory: Record<string, number>; byDimensionality: Record<string, number>; byLocality: Record<string, number>; durationHoursByCategory: Record<string, { count: number; p50: number; max: number }> }>;
export type Catalogue = { mission: 1 | 2; nEvents: number; cats: { name: string; n: number; p50: number; max: number; segments: number }[]; multivariate: number; global: number };
export function getCatalogue(): Catalogue[] {
  const f = fig<CatFile>("anomaly-catalogue.json");
  return (["m1", "m2"] as const).map((m, i) => ({
    mission: (i + 1) as 1 | 2, nEvents: f[m].nEvents,
    cats: Object.entries(f[m].byCategory).map(([name, n]) => ({ name, n, p50: f[m].durationHoursByCategory[name]?.p50 ?? 0, max: f[m].durationHoursByCategory[name]?.max ?? 0, segments: f[m].durationHoursByCategory[name]?.count ?? 0 })).sort((a, b) => b.n - a.n),
    multivariate: f[m].byDimensionality.Multivariate ?? 0,
    global: f[m].byLocality.Global ?? 0,
  }));
}
