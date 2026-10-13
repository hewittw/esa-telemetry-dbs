// Server-only: reads our exported figure data at build time and thins it so client
// components receive a few KB of props. Every number on the page comes from here.
import results from "../../../../content/results.json";
import tlM1 from "../../../../content/figures-data/score-timelines-m1.json";
import tlM2 from "../../../../content/figures-data/score-timelines-m2.json";
import prM1 from "../../../../content/figures-data/pr-curves-m1.json";
import prM2 from "../../../../content/figures-data/pr-curves-m2.json";
import bic from "../../../../content/figures-data/gmm-bic-sweeps.json";
import hierarchy from "../../../../content/figures-data/channel-hierarchy.json";
import catalogue from "../../../../content/figures-data/anomaly-catalogue.json";

const r3 = (n: number, d = 3) => Math.round(n * 10 ** d) / 10 ** d;

export type Row = {
  method: string;
  label: string;
  family: string;
  mission: number;
  latentK: number | null;
  scoring: string;
  prAuc: number;
  rocAuc: number;
  eventF1: number | null;
  trend: string;
  trendDirection: string | null;
};

export function tableRows(): Row[] {
  return results.table1.rows.map((r) => ({
    method: r.method,
    label: r.label,
    family: r.family,
    mission: r.mission,
    latentK: r.latentK,
    scoring: r.scoring,
    prAuc: r.prAuc,
    rocAuc: r.rocAuc,
    eventF1: r.eventF1,
    trend: r.trend,
    trendDirection: r.trendDirection,
  }));
}

export function missions() {
  const h = results.headline;
  const m = h.missions;
  return {
    1: {
      channels: m["1"].channels,
      test: m["1"].testTimestepsExact,
      hz: m["1"].sampleRateHz,
      anomalyRate: m["1"].testAnomalyRate,
      subsystems: m["1"].subsystems,
      groups: m["1"].groups,
      k: h.gmm.bicSelectedK["1"],
      labels: m["1"].labelType,
      events: catalogue.m1.nEvents,
      mix: m["1"].anomalyEvents as Record<string, number>,
      best: { method: "GMM", prAuc: 0.384, rocAuc: 0.692 },
    },
    2: {
      channels: m["2"].channels,
      test: m["2"].testTimestepsExact,
      hz: m["2"].sampleRateHz,
      anomalyRate: m["2"].testAnomalyRate,
      subsystems: m["2"].subsystems,
      groups: m["2"].groups,
      k: h.gmm.bicSelectedK["2"],
      labels: m["2"].labelType,
      events: catalogue.m2.nEvents,
      mix: m["2"].anomalyEvents as Record<string, number>,
      best: { method: "TransformerVAE", prAuc: 0.438, rocAuc: 0.749 },
    },
  };
}
export type Missions = ReturnType<typeof missions>;

/* ---------- PR curves: the five Table 1 runs that have saved scores, plus the rest as context ---------- */
export type Curve = {
  id: string;
  mission: 1 | 2;
  method: string;
  scoring: string;
  prAuc: number;
  rocAuc: number;
  table1: string | null;
  /** Table 1's printed PR-AUC for this row, and whether the saved-score curve reproduces it exactly */
  t1Pr: number | null;
  match: "exact" | "partial" | null;
  points: [number, number][];
};

function thinCurve(pts: number[][], n: number) {
  const step = Math.max(1, Math.floor(pts.length / n));
  return pts.filter((_, i) => i % step === 0 || i === pts.length - 1).map(([r, p]) => [r3(r), r3(p)] as [number, number]);
}

export function curves(): { list: Curve[]; nTest: Record<1 | 2, number>; pos: Record<1 | 2, number> } {
  const mk = (src: typeof prM1, mission: 1 | 2): Curve[] =>
    src.curves.map((c) => ({
      id: `${c.runId}-${c.scoring}`.replace(/[^a-z0-9]+/gi, "-").toLowerCase(),
      mission,
      method: c.method.replace(/ \(.*\)/, ""),
      scoring: c.scoring,
      prAuc: r3(c.prAuc),
      rocAuc: r3(c.rocAuc),
      table1: c.table1 ? c.table1.row : null,
      t1Pr: c.table1 ? (results.table1.rows.find((r) => r.label === c.table1!.row)?.prAuc ?? null) : null,
      match: c.table1 ? (c.table1.match as "exact" | "partial") : null,
      points: thinCurve(c.points as number[][], c.table1 ? 120 : 40),
    }));
  return {
    list: [...mk(prM1, 1), ...mk(prM2 as unknown as typeof prM1, 2)],
    nTest: { 1: prM1.nTest, 2: prM2.nTest },
    pos: { 1: prM1.positiveRate, 2: prM2.positiveRate },
  };
}
export type Curves = ReturnType<typeof curves>;

/* ---------- score timelines: 1500 bins thinned to 300, rank-normalised per series ---------- */
type Bin = number[]; // [startIndex, medianScore, maxScore, anomalyFraction]
function thinBins(bins: Bin[], n: number) {
  const step = bins.length / n;
  const out: { i: number; s: number; a: number }[] = [];
  for (let k = 0; k < n; k++) {
    const chunk = bins.slice(Math.floor(k * step), Math.floor((k + 1) * step));
    out.push({
      i: chunk[0][0],
      s: chunk.reduce((a, b) => a + b[1], 0) / chunk.length,
      a: chunk.reduce((a, b) => a + b[3], 0) / chunk.length,
    });
  }
  // log-scale then min-max so heavy-tailed scores still draw as a readable trace
  const floor = Math.min(...out.map((x) => x.s));
  const logs = out.map((o) => Math.log(o.s - floor + 1));
  const lo = Math.min(...logs);
  const hi = Math.max(...logs);
  return out.map((o, k) => ({ i: o.i, raw: r3(o.s, 2), s: r3((logs[k] - lo) / (hi - lo || 1)), a: r3(o.a, 2) }));
}

export function timelines() {
  const mk = (t: typeof tlM1) => ({
    nTest: t.nTest,
    nSegments: t.nAnomalySegments,
    series: t.series.map((s) => ({ id: s.runId, method: s.method.replace(/ \(.*\)/, ""), bins: thinBins(s.bins as Bin[], 240) })),
  });
  return { 1: mk(tlM1), 2: mk(tlM2 as unknown as typeof tlM1) };
}
export type Timelines = ReturnType<typeof timelines>;

/* ---------- fiber strands for the generative field (same recipe as the mood board) ---------- */
export function strands(mission: 1 | 2) {
  const t = mission === 1 ? tlM1 : tlM2;
  const s = t.series.find((x) => x.runId === (mission === 1 ? "gmm_m1" : "gmm_m2"))!;
  const bins = s.bins as Bin[];
  const n = 300;
  const step = bins.length / n;
  const raw: { score: number; anomaly: number }[] = [];
  for (let i = 0; i < n; i++) {
    const c = bins.slice(Math.floor(i * step), Math.floor((i + 1) * step));
    raw.push({ score: c.reduce((a, b) => a + b[1], 0) / c.length, anomaly: c.reduce((a, b) => a + b[3], 0) / c.length });
  }
  const val = raw.map((o, i) => {
    const win = raw.slice(Math.max(0, i - 12), i + 13).map((x) => x.score).sort((a, b) => a - b);
    return o.score / (win[Math.floor(win.length / 2)] || 1);
  });
  const order = val.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
  const rank = new Array<number>(n);
  order.forEach(([, i], r) => (rank[i] = r / (n - 1)));
  return raw.map((o, i) => ({ s: r3(rank[i]), a: r3(o.anomaly, 2) }));
}

/* ---------- BIC sweeps, raw values kept for the readout ---------- */
export function bicSweeps() {
  const mk = (m: { selectedK: number; reference: { subsystems: number; groups: number }; sweep: { k: number; bic: number }[] }) => ({
    selectedK: m.selectedK,
    subsystems: m.reference.subsystems,
    groups: m.reference.groups,
    points: m.sweep.map((p) => ({ k: p.k, bic: Math.round(p.bic) })),
  });
  return { 1: mk(bic.final.m1), 2: mk(bic.final.m2) };
}
export type Bic = ReturnType<typeof bicSweeps>;

/* ---------- channel hierarchy: mission → subsystem → group → channel ---------- */
export function tree() {
  const mk = (m: typeof hierarchy.m1) => ({
    nChannels: m.nChannels,
    subsystems: m.subsystems.map((s) => ({
      name: s.subsystem.replace("subsystem_", "Subsystem "),
      n: s.nChannels,
      groups: s.groups.map((g) => ({
        group: g.group,
        channels: g.channels.map((c) => ({ ch: c.channel.replace("channel_", "ch "), unit: c.physicalUnit.replace("physical_unit_", "unit "), target: c.target })),
      })),
    })),
  });
  return { 1: mk(hierarchy.m1), 2: mk(hierarchy.m2) };
}
export type Tree = ReturnType<typeof tree>;

/* ---------- anomaly catalogue ---------- */
export function events() {
  const mk = (m: typeof catalogue.m1) => ({
    n: m.nEvents,
    byCategory: m.byCategory as Record<string, number>,
    byDimensionality: m.byDimensionality as Record<string, number>,
    byLocality: m.byLocality as Record<string, number>,
    duration: Object.fromEntries(
      Object.entries(m.durationHoursByCategory).map(([k, v]) => [k, { p50: v.p50, p75: v.p75, max: v.max, count: v.count }]),
    ) as Record<string, { p50: number; p75: number; max: number; count: number }>,
  });
  return { 1: mk(catalogue.m1), 2: mk(catalogue.m2 as unknown as typeof catalogue.m1) };
}
export type Events = ReturnType<typeof events>;

export const headline = {
  ariSub: results.headline.gmm.ariVsSubsystemsM1,
  ariGroup: results.headline.gmm.ariVsGroupsM1,
  tau: results.headline.gmm.trainingNllThreshold99pct,
  pcaVar: results.headline.gmm.pcaVarianceRetained,
  constant: { 1: results.headline.missions["1"].constantChannelsRemovedForGmm, 2: results.headline.missions["2"].constantChannelsRemovedForGmm },
  plateau: 0.322,
};
