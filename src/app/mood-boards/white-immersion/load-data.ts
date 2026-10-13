// Server-only: reads our real figure data at build time and downsamples it for the board.
import fs from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), "content", "figures-data");
const read = <T,>(f: string): T => JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")) as T;

type Bin = [number, number, number, number];
type Timeline = { nTest: number; series: { runId: string; method: string; bins: Bin[] }[] };

export type Ridge = { label: string; v: number[]; a: number[] }; // v in 0..1, a = anomaly flag 0/1
export type BoardData = {
  ridges: Ridge[];
  field: number[][]; // [ridgeIndex][i] values 0..1 for the background snowfield
  fieldAnom: number[][];
  facets: { w: number; rate: number }[];
  gmmK: number;
  ariGroups: number;
  hierarchy: { subsystem: string; groups: number[] }[]; // channel count per group
  nChannels: number;
  nGroups: number;
  bic: { m1: { k: number; v: number }[]; m2: { k: number; v: number }[]; k1: number; k2: number };
  hud: { m1Channels: number; m1Test: number; m1Pos: number; m2Channels: number };
};

const r3 = (x: number) => Math.round(x * 1000) / 1000;

// Robust 0..1 scaling: log, then clip to the 2nd–98th percentile.
function normalize(vals: number[]) {
  const lg = vals.map((v) => Math.log(Math.max(v, 0) + 1e-3 + Math.abs(Math.min(...vals))));
  const sorted = [...lg].sort((a, b) => a - b);
  const lo = sorted[Math.floor(sorted.length * 0.02)];
  const hi = sorted[Math.floor(sorted.length * 0.98)];
  return lg.map((v) => Math.min(1, Math.max(0, (v - lo) / (hi - lo || 1))));
}

function down<T>(arr: T[], n: number) {
  const step = arr.length / n;
  return Array.from({ length: n }, (_, i) => arr[Math.floor(i * step)]);
}

export function loadBoardData(): BoardData {
  const m1 = read<Timeline>("score-timelines-m1.json");
  const m2 = read<Timeline>("score-timelines-m2.json");
  const all = [
    ...m1.series.map((s) => ({ ...s, label: `M1 · ${s.method.replace(" (K=8, raw features)", " K=8")}` })),
    ...m2.series.map((s) => ({ ...s, label: `M2 · ${s.method}` })),
  ];
  const ridges: Ridge[] = [];
  const field: number[][] = [];
  const fieldAnom: number[][] = [];
  for (const s of all) {
    const v = normalize(s.bins.map((b) => b[1]));
    const a = s.bins.map((b) => (b[3] > 0.2 ? 1 : 0));
    const small = down(v.map((x, i) => [x, a[i]] as const), 180);
    ridges.push({ label: s.label, v: small.map((p) => r3(p[0])), a: small.map((p) => p[1]) });
    const f = down(v.map((x, i) => [x, a[i]] as const), 500);
    field.push(f.map((p) => r3(p[0])));
    fieldAnom.push(f.map((p) => p[1]));
  }

  const gmm = read<{ k: number; ariVsGroups: number; components: { weight: number; anomalyRate: number }[] }>(
    "gmm-components-m1.json",
  );
  const facets = gmm.components.map((c) => ({ w: c.weight, rate: c.anomalyRate }));

  const h = read<{ m1: { nChannels: number; nGroups: number; subsystems: { subsystem: string; groups: { channels: unknown[] }[] }[] }; m2: { nChannels: number } }>(
    "channel-hierarchy.json",
  );
  const hierarchy = h.m1.subsystems.map((s) => ({
    subsystem: s.subsystem.replace("subsystem_", "SS-"),
    groups: s.groups.map((g) => g.channels.length),
  }));

  const b = read<{ final: Record<"m1" | "m2", { selectedK: number; sweep: { k: number; bic: number }[] }> }>(
    "gmm-bic-sweeps.json",
  );
  const scale = (sw: { k: number; bic: number }[]) => {
    const lo = Math.min(...sw.map((p) => p.bic)), hi = Math.max(...sw.map((p) => p.bic));
    return sw.map((p) => ({ k: p.k, v: r3((p.bic - lo) / (hi - lo)) }));
  };

  return {
    ridges, field, fieldAnom, facets,
    gmmK: gmm.k, ariGroups: gmm.ariVsGroups,
    hierarchy, nChannels: h.m1.nChannels, nGroups: h.m1.nGroups,
    bic: { m1: scale(b.final.m1.sweep), m2: scale(b.final.m2.sweep), k1: b.final.m1.selectedK, k2: b.final.m2.selectedK },
    hud: { m1Channels: h.m1.nChannels, m1Test: m1.nTest, m1Pos: 0.11098, m2Channels: h.m2.nChannels },
  };
}
