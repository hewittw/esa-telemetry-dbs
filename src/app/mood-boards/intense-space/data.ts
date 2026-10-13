// Server-only: reads our real exported figure data at build time and downsamples it
// so the client components only receive a few KB of props.
import timelinesM1 from "../../../../content/figures-data/score-timelines-m1.json";
import timelinesM2 from "../../../../content/figures-data/score-timelines-m2.json";
import bic from "../../../../content/figures-data/gmm-bic-sweeps.json";
import prM2 from "../../../../content/figures-data/pr-curves-m2.json";
import hierarchy from "../../../../content/figures-data/channel-hierarchy.json";
import results from "../../../../content/results.json";

type Bin = number[]; // [startIndex, medianScore, maxScore, anomalyFraction]

const round = (n: number, d = 3) => Math.round(n * 10 ** d) / 10 ** d;

function downsampleBins(bins: Bin[], n: number, detrend = false) {
  const step = bins.length / n;
  const out: { score: number; peak: number; anomaly: number }[] = [];
  for (let i = 0; i < n; i++) {
    const chunk = bins.slice(Math.floor(i * step), Math.floor((i + 1) * step));
    const score = chunk.reduce((a, b) => a + b[1], 0) / chunk.length;
    const peak = Math.max(...chunk.map((b) => b[2]));
    const anomaly = chunk.reduce((a, b) => a + b[3], 0) / chunk.length;
    out.push({ score, peak, anomaly });
  }
  // rank-normalise the score to 0..1 (percentile) so the canvas never sees raw units
  // optional: score relative to its local baseline (rolling median of ±12 slices)
  const val = out.map((o, i) => {
    if (!detrend) return o.score;
    const win = out.slice(Math.max(0, i - 12), i + 13).map((x) => x.score).sort((a, b) => a - b);
    return o.score / (win[Math.floor(win.length / 2)] || 1);
  });
  const order = val.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
  const rank = new Array<number>(out.length);
  order.forEach(([, i], r) => (rank[i] = r / (out.length - 1)));
  return out.map((o, i) => ({
    s: round(rank[i]),
    a: round(o.anomaly, 2),
  }));
}

export function fiberStrands() {
  const gmm = timelinesM1.series.find((s) => s.runId === "gmm_m1")!;
  const strands = downsampleBins(gmm.bins as Bin[], 300, true);
  return {
    strands,
    perStrand: Math.round(timelinesM1.nTest / strands.length),
    nTest: timelinesM1.nTest,
    method: gmm.method,
  };
}

export function hudSpark() {
  const gmm = timelinesM2.series.find((s) => s.runId === "gmm_m2")!;
  return downsampleBins(gmm.bins as Bin[], 96);
}

export function bicSweeps() {
  const norm = (sweep: { k: number; bic: number }[]) => {
    const lo = Math.min(...sweep.map((s) => s.bic));
    const hi = Math.max(...sweep.map((s) => s.bic));
    return sweep.map((s) => ({ k: s.k, v: round((s.bic - lo) / (hi - lo)) }));
  };
  return {
    m1: { points: norm(bic.final.m1.sweep), selectedK: bic.final.m1.selectedK },
    m2: { points: norm(bic.final.m2.sweep), selectedK: bic.final.m2.selectedK },
  };
}

export function prBundle() {
  return prM2.curves.map((c) => {
    const pts = c.points as number[][];
    const step = Math.max(1, Math.floor(pts.length / 70));
    const thin = pts.filter((_, i) => i % step === 0 || i === pts.length - 1);
    return {
      id: `${c.runId}-${c.scoring}`,
      method: c.method,
      scoring: c.scoring,
      prAuc: c.prAuc,
      inTable: c.table1 !== null,
      points: thin.map(([r, p]) => [round(r), round(p)] as [number, number]),
    };
  });
}

export function channelTree() {
  const m1 = hierarchy.m1;
  const groups: { group: number; subsystem: number; channels: number }[] = [];
  m1.subsystems.forEach((s, si) =>
    s.groups.forEach((g) => groups.push({ group: g.group, subsystem: si, channels: g.channels.length })),
  );
  return {
    nChannels: m1.nChannels,
    nGroups: m1.nGroups,
    nSubsystems: m1.nSubsystems,
    subsystems: m1.subsystems.map((s) => ({ name: s.subsystem.replace("subsystem_", "SS-"), n: s.nChannels })),
    groups,
  };
}

export function table1() {
  const rows = results.table1.rows;
  const pick = (method: string, mission: number) =>
    rows.find((r) => r.method === method && r.mission === mission)!;
  return {
    best: pick("TransformerVAE", 2),
    others: [pick("GMM", 1), pick("GMM", 2), pick("TransformerVAE", 1), pick("HierarchicalVAE", 2)],
  };
}
