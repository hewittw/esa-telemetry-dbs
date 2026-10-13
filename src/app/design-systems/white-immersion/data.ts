// Server-only: reads our real results + figure data at build time and thins it to a few KB of props.
// Every number shown on /design-systems/white-immersion comes from here.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "content");
const read = <T,>(f: string): T => JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8")) as T;
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;

export type Row = {
  id: string; method: string; label: string; family: string; mission: 1 | 2; latentK: number | null;
  scoring: string; prAuc: number; rocAuc: number; eventF1: number | null; trend: string; trendDirection: string | null;
};
export type Curve = { id: string; method: string; family: string; prAuc: number; table1: boolean; match: "exact" | "partial" | "none"; pts: [number, number][] };
export type Timeline = { method: string; v: [number, number, number][] }; // [median 0..1, max 0..1, anomaly fraction]
export type Mission = {
  id: 1 | 2; channels: number; train: string; test: number; hz: number; subsystems: number; groups: number;
  labels: string; testRate: number; events: Record<string, number>; k: number;
};
export type Hier = { subsystem: string; groups: { group: number; channels: { name: string; target: boolean }[] }[] }[];
export type DSData = {
  title: string;
  rows: Row[];
  missions: Record<"1" | "2", Mission>;
  pr: Record<"1" | "2", { pos: number; n: number; curves: Curve[] }>;
  tl: Record<"1" | "2", { n: number; segs: [number, number][]; series: Timeline[] }>;
  bic: Record<"1" | "2", { k: number; bic: number }[]>;
  bicRef: Record<"1" | "2", { subsystems: number; groups: number; selected: number }>;
  hier: Record<"1" | "2", Hier>;
  catalogue: {
    m1: { n: number; cat: Record<string, number>; dim: Record<string, number>; loc: Record<string, number>; dur: Record<string, { p50: number; max: number; count: number }> };
    m2: { n: number; cat: Record<string, number>; dim: Record<string, number>; loc: Record<string, number>; dur: Record<string, { p50: number; max: number; count: number }> };
  };
  longest: { timesteps: number; hours: number; start: string };
  deep: { method: string; n: number; v: [number, number][]; segs: [number, number][] }; // full 1,500 bins, [median, max] 0..1
};

type RawRow = Omit<Row, "id" | "mission"> & { mission: number };
type RawCurve = { runId: string; method: string; family: string; prAuc: number; table1: { match?: string } | null; points: [number, number][] };
type RawTl = { nTest: number; anomalySegments: [number, number][]; series: { method: string; bins: [number, number, number, number][] }[] };

function down<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return arr;
  const step = (arr.length - 1) / (n - 1);
  return Array.from({ length: n }, (_, i) => arr[Math.round(i * step)]);
}

// Robust 0..1 scaling for very different score units (NLL, MSE, ELBO): clip to the 1st–99th percentile.
function scale(vals: number[]) {
  const s = [...vals].sort((a, b) => a - b);
  const lo = s[Math.floor(s.length * 0.01)], hi = s[Math.floor(s.length * 0.99)];
  return vals.map((v) => Math.min(1, Math.max(0, (v - lo) / (hi - lo || 1))));
}

// One curve per method: the Table 1 run when we have it, else the best saved run.
function pickCurves(curves: RawCurve[]): Curve[] {
  const by = new Map<string, RawCurve>();
  for (const c of curves) {
    const prev = by.get(c.method);
    if (!prev || (c.table1 && !prev.table1) || (!prev.table1 && c.prAuc > prev.prAuc)) by.set(c.method, c);
  }
  return [...by.values()].map((c) => ({
    id: c.runId, method: c.method.replace(" (K=8, raw features)", " K=8"), family: c.family, prAuc: r4(c.prAuc), table1: !!c.table1, match: (c.table1?.match === "exact" ? "exact" : c.table1 ? "partial" : "none") as Curve["match"],
    pts: down(c.points, 140).map(([r, p]) => [r4(r), r4(p)] as [number, number]),
  }));
}

export function loadDS(): DSData {
  const res = read<{ title: string; table1: { rows: RawRow[] }; headline: { missions: Record<string, Record<string, unknown>> } }>("results.json");
  const rows: Row[] = res.table1.rows.map((r, i) => ({
    id: `r${i}`, method: r.method, label: r.label, family: r.family, mission: (r.mission === 2 ? 2 : 1),
    latentK: r.latentK, scoring: r.scoring, prAuc: r.prAuc, rocAuc: r.rocAuc, eventF1: r.eventF1, trend: r.trend, trendDirection: r.trendDirection,
  }));

  const hm = res.headline.missions;
  const mission = (id: 1 | 2, k: number): Mission => {
    const m = hm[String(id)] as Record<string, unknown>;
    return {
      id, channels: m.channels as number, train: m.trainingTimesteps as string, test: m.testTimestepsExact as number,
      hz: m.sampleRateHz as number, subsystems: m.subsystems as number, groups: m.groups as number,
      labels: m.labelType as string, testRate: m.testAnomalyRate as number, events: m.anomalyEvents as Record<string, number>, k,
    };
  };

  const pr = (m: 1 | 2) => {
    const d = read<{ positiveRate: number; nTest: number; curves: RawCurve[] }>(`figures-data/pr-curves-m${m}.json`);
    return { pos: d.positiveRate, n: d.nTest, curves: pickCurves(d.curves) };
  };

  const tl = (m: 1 | 2) => {
    const d = read<RawTl>(`figures-data/score-timelines-m${m}.json`);
    return {
      n: d.nTest,
      segs: d.anomalySegments.map(([a, b]) => [r4(a / d.nTest), r4(b / d.nTest)] as [number, number]),
      series: d.series.map((s) => {
        const b = down(s.bins, 360);
        const med = scale(b.map((x) => x[1]));
        const mx = scale(b.map((x) => x[2]));
        return { method: s.method.replace(" (K=8, raw features)", " K=8"), v: b.map((x, i) => [r4(med[i]), r4(mx[i]), r4(x[3])] as [number, number, number]) };
      }),
    };
  };

  const bicRaw = read<{ final: Record<"m1" | "m2", { selectedK: number; reference: { subsystems: number; groups: number }; sweep: { k: number; bic: number }[] }> }>("figures-data/gmm-bic-sweeps.json");

  const hRaw = read<Record<"m1" | "m2", { subsystems: { subsystem: string; groups: { group: number; channels: { channel: string; target: boolean }[] }[] }[] }>>("figures-data/channel-hierarchy.json");
  const hier = (m: "m1" | "m2"): Hier => hRaw[m].subsystems.map((s) => ({
    subsystem: s.subsystem.replace("subsystem_", "Subsystem "),
    groups: s.groups.map((g) => ({ group: g.group, channels: g.channels.map((c) => ({ name: c.channel.replace("channel_", "ch_"), target: c.target })) })),
  }));

  type Cat = { nEvents: number; byCategory: Record<string, number>; byDimensionality: Record<string, number>; byLocality: Record<string, number>; durationHoursByCategory: Record<string, { p50: number; max: number; count: number }> };
  const cRaw = read<{ m1: Cat; m2: Cat }>("figures-data/anomaly-catalogue.json");
  const clean = (o: Record<string, number>) => Object.fromEntries(Object.entries(o).filter(([k]) => k));
  const cat = (c: Cat) => ({
    n: c.nEvents, cat: c.byCategory, dim: clean(c.byDimensionality), loc: clean(c.byLocality),
    dur: Object.fromEntries(Object.entries(c.durationHoursByCategory).map(([k, v]) => [k, { p50: v.p50, max: v.max, count: v.count }])),
  });

  const dRaw = read<RawTl>("figures-data/score-timelines-m1.json");
  const g = dRaw.series.find((x) => x.method.startsWith("GMM")) ?? dRaw.series[0];
  const dMed = scale(g.bins.map((x) => x[1])), dMax = scale(g.bins.map((x) => x[2]));
  const deep = {
    method: g.method, n: dRaw.nTest,
    v: g.bins.map((_, i) => [Math.round(dMed[i] * 1000) / 1000, Math.round(dMax[i] * 1000) / 1000] as [number, number]),
    segs: dRaw.anomalySegments.map(([a, b]) => [r4(a / dRaw.nTest), r4(b / dRaw.nTest)] as [number, number]),
  };

  const lg = (hm["1"].longestTestAnomaly ?? {}) as { timesteps: number; hours: number; start: string };

  return {
    title: res.title,
    rows,
    missions: { "1": mission(1, bicRaw.final.m1.selectedK), "2": mission(2, bicRaw.final.m2.selectedK) },
    pr: { "1": pr(1), "2": pr(2) },
    tl: { "1": tl(1), "2": tl(2) },
    bic: { "1": bicRaw.final.m1.sweep.map((p) => ({ k: p.k, bic: p.bic })), "2": bicRaw.final.m2.sweep.map((p) => ({ k: p.k, bic: p.bic })) },
    bicRef: {
      "1": { ...bicRaw.final.m1.reference, selected: bicRaw.final.m1.selectedK },
      "2": { ...bicRaw.final.m2.reference, selected: bicRaw.final.m2.selectedK },
    },
    hier: { "1": hier("m1"), "2": hier("m2") },
    catalogue: { m1: cat(cRaw.m1), m2: cat(cRaw.m2) },
    longest: lg,
    deep,
  };
}
