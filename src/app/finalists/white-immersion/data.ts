// Server-only: reads our real results + figure data at build time and thins it to a few KB of props.
// Every number on /finalists/white-immersion comes from content/ through this file.
import fs from "node:fs";
import path from "node:path";
import { loadBoardData } from "../../mood-boards/white-immersion/load-data";

const ROOT = path.join(process.cwd(), "content");
const read = <T,>(f: string): T => JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8")) as T;
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;
const r3 = (n: number) => Math.round(n * 1e3) / 1e3;

export type Row = {
  id: string; method: string; label: string; family: "baseline" | "parametric" | "generative"; mission: 1 | 2;
  latentK: number | null; d: number | null; scoring: string; prAuc: number; rocAuc: number; eventF1: number | null;
  trend: string; trendDirection: string | null; bold: boolean; verify: { status: string; detail?: string };
};
export type Curve = { id: string; method: string; prAuc: number; match: "exact" | "partial" | "none"; note?: string; pts: [number, number][] };
export type Hier = { subsystem: string; groups: { group: number; channels: { name: string; target: boolean }[] }[] }[];
export type Strip = { method: string; scoring: string; nominal: number; peak: number; late: number; threshold?: number; lo: number; hi: number; v: [number, number][] }; // log10 [median, max]
export type SiteData = {
  rows: Row[];
  missions: Record<"1" | "2", { train: string; channels: number; subsystems: number; groups: number; test: number; testRate: number; hz: number; labels: string; k: number; sec: number }>;
  pr: Record<"1" | "2", { pos: number; n: number; curves: Curve[] }>;
  bic: Record<"1" | "2", { k: number; bic: number }[]>;
  hier: Record<"1" | "2", Hier>;
  longest: { timesteps: number; hours: number; start: string; a: number; b: number; winStart: number; winLen: number; strips: Strip[] };
  field: number[][];
  fieldAnom: number[][];
  plateau: number;
};

type RawRow = { method: string; label: string; family: Row["family"]; mission: number; latentK: number | null; d: number | null; scoring: string; prAuc: number; rocAuc: number; eventF1: number | null; trend: string; trendDirection: string | null; verification: { status: string; detail?: string } };
type RawCurve = { runId: string; method: string; prAuc: number; table1: { match?: string; detail?: string } | null; points: [number, number][] };
type Bin = [number, number, number, number];

function down<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return arr;
  const step = (arr.length - 1) / (n - 1);
  return Array.from({ length: n }, (_, i) => arr[Math.round(i * step)]);
}
const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const clean = (m: string) => m.replace(" (K=8, raw features)", " K=8");

// One curve per method: the Table 1 run when there is one, else the best saved run.
function pickCurves(curves: RawCurve[]): Curve[] {
  const by = new Map<string, RawCurve>();
  for (const c of curves) {
    const prev = by.get(c.method);
    if (!prev || (c.table1 && !prev.table1) || (!prev.table1 && !c.table1 && c.prAuc > prev.prAuc)) by.set(c.method, c);
  }
  return [...by.values()].map((c) => ({
    id: c.runId, method: clean(c.method), prAuc: r4(c.prAuc),
    match: (c.table1?.match === "exact" ? "exact" : c.table1 ? "partial" : "none") as Curve["match"],
    note: c.table1?.detail,
    pts: down(c.points, 160).map(([r, p]) => [r4(r), r4(p)] as [number, number]),
  }));
}

export function loadSite(): SiteData {
  const res = read<{ table1: { rows: RawRow[]; bold: string[] }; headline: { missions: Record<string, Record<string, unknown>>; conclusions: { linearPlateau: string } } }>("results.json");
  const rows: Row[] = res.table1.rows.map((r, i) => ({
    id: `r${i}`, method: r.method, label: r.label, family: r.family, mission: r.mission === 2 ? 2 : 1,
    latentK: r.latentK, d: r.d, scoring: r.scoring, prAuc: r.prAuc, rocAuc: r.rocAuc, eventF1: r.eventF1,
    trend: r.trend, trendDirection: r.trendDirection,
    bold: res.table1.bold.includes(`${r.method} M${r.mission} prAuc`),
    verify: { status: r.verification.status, detail: r.verification.detail },
  }));

  const bicRaw = read<{ final: Record<"m1" | "m2", { selectedK: number; sweep: { k: number; bic: number }[] }> }>("figures-data/gmm-bic-sweeps.json");
  const hm = res.headline.missions;
  const mission = (id: 1 | 2) => {
    const m = hm[String(id)];
    return {
      train: m.trainingTimesteps as string, channels: m.channels as number, subsystems: m.subsystems as number, groups: m.groups as number,
      test: m.testTimestepsExact as number, testRate: m.testAnomalyRate as number, hz: m.sampleRateHz as number,
      labels: m.labelType as string, k: bicRaw.final[id === 1 ? "m1" : "m2"].selectedK, sec: id === 1 ? 30 : 1 / 0.056,
    };
  };

  const pr = (m: 1 | 2) => {
    const d = read<{ positiveRate: number; nTest: number; curves: RawCurve[] }>(`figures-data/pr-curves-m${m}.json`);
    return { pos: r4(d.positiveRate), n: d.nTest, curves: pickCurves(d.curves) };
  };

  const hRaw = read<Record<"m1" | "m2", { subsystems: { subsystem: string; groups: { group: number; channels: { channel: string; target: boolean }[] }[] }[] }>>("figures-data/channel-hierarchy.json");
  const hier = (m: "m1" | "m2"): Hier => hRaw[m].subsystems.map((s) => ({
    subsystem: s.subsystem.replace("subsystem_", "Subsystem "),
    groups: s.groups.map((g) => ({ group: g.group, channels: g.channels.map((c) => ({ name: c.channel.replace("channel_", "ch "), target: c.target })) })),
  }));

  // the longest anomaly (report Fig. 3 segment), saved scores, log10
  const L = read<{ segmentStart: number; segmentEnd: number; windowStart: number; windowEnd: number; series: { method: string; scoring: string; bins: Bin[] }[] }>("figures-data/longest-anomaly-m1.json");
  const winLen = L.windowEnd - L.windowStart;
  const thr = (res.headline as unknown as { gmm: { trainingNllThreshold99pct: Record<string, number> } }).gmm.trainingNllThreshold99pct["1"];
  const strips: Strip[] = L.series.map((s) => {
    const b = down(s.bins, 600);
    const pre = s.bins.filter((x) => x[0] < L.segmentStart).map((x) => x[1]);
    const ins = s.bins.filter((x) => x[0] >= L.segmentStart && x[0] < L.segmentEnd);
    const late = median(ins.slice(Math.floor((ins.length * 2) / 3)).map((x) => x[1]));
    const lg = (v: number) => Math.log10(Math.max(v, 1e-3));
    const v = b.map((x) => [r3(lg(x[1])), r3(lg(x[2]))] as [number, number]);
    const all = v.flat();
    return {
      method: clean(s.method), scoring: s.scoring, nominal: r3(median(pre)), peak: Math.max(...s.bins.map((x) => x[2])), late: r3(late),
      threshold: s.method.startsWith("GMM") ? thr : undefined,
      lo: r3(Math.min(...all)), hi: r3(Math.max(...all)), v,
    };
  });
  const lg = (hm["1"].longestTestAnomaly ?? {}) as { timesteps: number; hours: number; start: string };

  const board = loadBoardData();

  return {
    rows,
    missions: { "1": mission(1), "2": mission(2) },
    pr: { "1": pr(1), "2": pr(2) },
    bic: { "1": bicRaw.final.m1.sweep.map((p) => ({ k: p.k, bic: p.bic })), "2": bicRaw.final.m2.sweep.map((p) => ({ k: p.k, bic: p.bic })) },
    hier: { "1": hier("m1"), "2": hier("m2") },
    longest: {
      ...lg, a: r4((L.segmentStart - L.windowStart) / winLen), b: r4((L.segmentEnd - L.windowStart) / winLen),
      winStart: L.windowStart, winLen, strips,
    },
    field: board.field, fieldAnom: board.fieldAnom,
    plateau: 0.322,
  };
}
