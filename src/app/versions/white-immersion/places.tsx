"use client";
// The nine places. Each is a real, working piece of the explorer on our exported data.
import { useEffect, useMemo, useRef, useState } from "react";
import type { Curve, Hier, Row, SiteData } from "./data";
import { Circle, Icon, Scramble, Segmented, StatusTag, fmt, pad, useReduced, useWidth } from "./kit";
import { useSite } from "./site";

type M = "1" | "2";
type P = { d: SiteData; active: boolean; seen: boolean };
const MONO = { fontFamily: "var(--wi-mono)" } as const;
const DASH = ["", "5 3", "1.5 2.5", "8 3 2 3", "3 3", "10 4"];
const short = (m: string) => m.replace("HierarchicalVAE", "HVAE").replace("TransformerVAE", "TVAE").replace("CapacityVAE", "CapVAE").replace("Nystroem-KPCA", "KPCA");
const fam: Record<string, string> = { baseline: "Baseline", parametric: "Parametric", generative: "Generative" };
const PDF = "/paper/esa-telemetry-latent-structure.pdf";
const missionOpts = [{ v: "1" as M, label: "Mission 1" }, { v: "2" as M, label: "Mission 2" }];

export function Body({ id, d, active, seen }: { id: string } & P) {
  const p = { d, active, seen };
  switch (id) {
    case "finding": return <Finding {...p} />;
    case "crystal": return <Crystal {...p} />;
    case "glacier": return <Glacier {...p} />;
    case "failure": return <Failure {...p} />;
    case "deep": return <DeepField {...p} />;
    case "compare": return <Compare {...p} />;
    case "threshold": return <Threshold {...p} />;
    case "paper": return <PaperPlace />;
    case "credits": return <Credits />;
    default: return null;
  }
}

/* ====================================================================== */
/* 00 · the finding                                                         */
/* ====================================================================== */
function Finding({ d }: P) {
  const { openPaper, go } = useSite();
  const m1 = d.missions["1"], m2 = d.missions["2"];
  const gmm1 = d.rows.find((r) => r.method === "GMM" && r.mission === 1)!;
  const tv2 = d.rows.find((r) => r.method === "TransformerVAE" && r.mission === 2)!;
  const cells: { k: string; v: string; note: string; dim?: boolean }[] = [
    { k: "Expected · subsystems", v: `${m1.subsystems}–${m2.subsystems}`, note: "The coarse engineering level the project set out to test.", dim: true },
    { k: "Found · operational modes", v: `${m1.groups}–${m2.groups}`, note: `GMM BIC picks K* = ${m1.k} and ${m2.k}, against ${m1.groups} and ${m2.groups} defined groups.` },
    { k: "Global baselines · PR-AUC", v: d.plateau.toFixed(3), note: `Linear baselines plateau on Mission 1. Local modes reach ${gmm1.prAuc.toFixed(3)} (GMM), ${tv2.prAuc.toFixed(3)} on Mission 2.` },
  ];
  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="wiv-label tabular-nums text-[var(--ink)]">00 · The finding</span>
        <span className="wiv-label">ESA Anomaly Dataset · {m1.channels} + {m2.channels} channels · {fmt(m1.test + m2.test)} test steps</span>
      </div>
      <h1 id="finding-h" className="wiv-lead mt-6 max-w-[54ch] text-[19px] sm:text-[24px]">
        ESA telemetry has real latent structure at the <span className="font-medium underline decoration-1 underline-offset-[6px]">operational-group level (18–29 modes)</span>, not the subsystem level (4–5), and that multi-modality is why global detectors fail.
      </h1>
      <dl className="mt-9 grid border-y border-[var(--rime)] sm:grid-cols-3">
        {cells.map((c, i) => (
          <div key={c.k} className={`py-5 sm:px-6 sm:first:pl-0 ${i ? "border-t border-[var(--rime)] sm:border-l sm:border-t-0" : ""}`}>
            <dt className="wiv-label">{c.k}</dt>
            <dd className={`wiv-num mt-2 text-[40px] leading-none ${c.dim ? "text-[var(--muted)]" : ""}`}><Scramble text={c.v} ms={800} /></dd>
            <dd className="wiv-caption mt-3 max-w-[34ch] text-[11.5px]">{c.note}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-7 flex flex-wrap items-center gap-2">
        <button type="button" className="wiv-btn" onClick={() => go("crystal")}>See the structure<Icon n="arrow" size={13} /></button>
        <button type="button" className="wiv-btn" onClick={() => go("compare")}>Compare the methods</button>
        <button type="button" className="wiv-btn is-ghost" onClick={() => openPaper(1)}>Read the paper</button>
        <a className="wiv-btn is-ghost" href={PDF} download>Download PDF</a>
      </div>
      <p className="wiv-caption mt-6">Paper by Rhea Madhogarhia &amp; Hewitt Watkins · TTIC 31220, Spring 2026 · Site designed &amp; built by Hewitt Watkins</p>
    </div>
  );
}

/* ====================================================================== */
/* 01 · the channel crystal: channels → groups → subsystems                 */
/* ====================================================================== */
const seeded = (seed: number) => { let s = seed; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; };
const q = (n: number) => Math.round(n * 10) / 10;
function crystalLayout(h: Hier, W: number, H: number) {
  const groups = h.flatMap((s, si) => s.groups.map((g) => ({ si, id: g.group, n: g.channels.length, chans: g.channels })));
  const G = groups.length, S = h.length;
  const rnd = seeded(31);
  // level 1: every group its own island on a jittered grid
  const cols = Math.max(3, Math.round(Math.sqrt((G * W) / H))), rows = Math.ceil(G / cols);
  const cw = W / cols, ch = (H - 44) / rows;
  const g1 = groups.map((_, i) => ({ x: q(cw * ((i % cols) + 0.5) + (rnd() - 0.5) * cw * 0.3), y: q(34 + ch * (Math.floor(i / cols) + 0.5) + (rnd() - 0.5) * ch * 0.25) }));
  // level 2: groups packed into their subsystem crystals
  const subs = h.map((s, i) => {
    const a = (i / S) * Math.PI * 2 - Math.PI / 2 + 0.5;
    return { x: q(W / 2 + Math.cos(a) * W * 0.3), y: q(H / 2 + Math.sin(a) * H * 0.29), name: s.subsystem, nG: s.groups.length, nC: s.groups.reduce((t, g) => t + g.channels.length, 0) };
  });
  const g2 = groups.map((g) => {
    const mates = groups.filter((x) => x.si === g.si), k = mates.indexOf(g), R = mates.length === 1 ? 0 : Math.min(H * 0.17, 8 + mates.length * 4.2);
    const a = (k / mates.length) * Math.PI * 2;
    return { x: q(subs[g.si].x + Math.cos(a) * R), y: q(subs[g.si].y + Math.sin(a) * R * 0.85) };
  });
  const chans = groups.flatMap((g, gi) => g.chans.map((c, ci) => {
    const a = (ci / g.n) * Math.PI * 2 + gi, r1 = Math.min(Math.min(cw, ch) * 0.3, 5 + g.n * 1.3), r2 = 3 + g.n * 0.55;
    return {
      gi, target: c.target,
      p0: { x: q(14 + rnd() * (W - 28)), y: q(14 + rnd() * (H - 28)) },
      p1: { x: q(g1[gi].x + Math.cos(a) * r1), y: q(g1[gi].y + Math.sin(a) * r1) },
      p2: { x: q(g2[gi].x + Math.cos(a) * r2), y: q(g2[gi].y + Math.sin(a) * r2) },
      r1, r2,
    };
  }));
  const ring1 = groups.map((g) => Math.min(Math.min(cw, ch) * 0.3, 5 + g.n * 1.3) + 6);
  const subR = subs.map((_, si) => Math.max(26, ...groups.map((g, gi) => (g.si === si ? Math.hypot(g2[gi].x - subs[si].x, g2[gi].y - subs[si].y) + 3 + g.n * 0.55 + 12 : 0))));
  return { groups, subs, g1, g2, chans, ring1, subR };
}

function Crystal({ d, seen }: P) {
  const [m, setM] = useState<M>("1");
  const [lv, setLv] = useState<"0" | "1" | "2">("0");
  useEffect(() => { if (!seen) return; const t = window.setTimeout(() => setLv((l) => (l === "0" ? "1" : l)), 900); return () => window.clearTimeout(t); }, [seen]);
  const [wref, W] = useWidth<HTMLDivElement>(560);
  const H = Math.round(Math.min(400, Math.max(300, W * 0.66)));
  const h = d.hier[m];
  const L = useMemo(() => crystalLayout(h, W, H), [h, W, H]);
  const M_ = d.missions[m];
  const level = +lv;
  const text = [
    `${M_.channels} sensor channels, each one time series. Read raw, they look like one cloud.`,
    `ESA wires them into ${M_.groups} operational groups (battery charging, say). GMM BIC picks K* = ${M_.k}. This is the level the models find.`,
    `The ${M_.subsystems} subsystems are the coarse level the project hypothesised. On raw Mission 1, K-Means silhouette peaks at K = 2, not 4.`,
  ][level];
  const st = (p: { x: number; y: number }) => ({ transform: `translate(${p.x}px, ${p.y}px)` });
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <div ref={wref} className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block h-auto w-full border border-[var(--rime)] bg-[radial-gradient(110%_100%_at_50%_45%,#fff_0%,#f4f6f8_70%,#e9edf2_100%)]" role="img"
          aria-label={`${M_.channels} channels shown at the ${["channel", "group", "subsystem"][level]} level: ${level === 0 ? `${M_.channels} channels` : level === 1 ? `${M_.groups} groups` : `${M_.subsystems} subsystems`}.`}>
          {L.subs.map((s, i) => {
            const r = L.subR[i];
            const pts = Array.from({ length: 6 }, (_, k) => { const a = (k / 6) * Math.PI * 2 + i * 0.4; return `${q(s.x + Math.cos(a) * r)},${q(s.y + Math.sin(a) * r * 0.86)}`; }).join(" ");
            return (
              <g key={`s${m}${i}`} className="wiv-fade" opacity={level === 2 ? 1 : 0}>
                <polygon points={pts} fill="rgba(255,255,255,.7)" stroke="#111824" strokeWidth="1" />
                <text x={Math.min(W - 8, Math.max(8, s.x))} y={Math.max(14, s.y - r * 0.86 - 9)} textAnchor="middle" fontSize="10.5" fill="#111824" style={{ ...MONO, letterSpacing: ".08em" }}>{s.name.toUpperCase().replace("SUBSYSTEM", "SUBSYS.")} · {s.nG} GR · {s.nC} CH</text>
              </g>
            );
          })}
          {L.groups.map((g, gi) => (
            <g key={`g${m}${gi}`} className="wiv-speck" style={st(level === 2 ? L.g2[gi] : L.g1[gi])} opacity={level === 0 ? 0 : 1}>
              <circle r={level === 2 ? 3 + g.n * 0.55 + 3 : L.ring1[gi]} fill="none" stroke={level === 1 ? "#111824" : "#d5dce4"} strokeWidth=".8" />
              {level === 1 && <text y={-L.ring1[gi] - 4} textAnchor="middle" fontSize="10.5" fill="#56616f" style={MONO}>{pad(g.id)}</text>}
            </g>
          ))}
          {L.chans.map((c, i) => (
            <rect key={`c${m}${i}`} className="wiv-speck" x={-1.6} y={-1.6} width={3.2} height={3.2} fill={c.target ? "#111824" : "#56616f"} style={st(level === 0 ? c.p0 : level === 1 ? c.p1 : c.p2)} />
          ))}
        </svg>
        <div className="wiv-hud pointer-events-none absolute left-2.5 top-2"><span className="wiv-backing block">{["Channels", "Operational groups", "Subsystems"][level]} · {[M_.channels, M_.groups, M_.subsystems][level]}</span></div>
        <div className="wiv-hud pointer-events-none absolute bottom-2 right-2.5"><span className="wiv-backing block text-[var(--muted)]">dark = target channel (carries labels) · grey = other</span></div>
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Segmented label="Mission" value={m} set={setM} options={missionOpts} />
        </div>
        <Segmented label="Level" value={lv} set={setLv} options={[
          { v: "0", label: `${M_.channels} channels` }, { v: "1", label: `${M_.groups} groups` }, { v: "2", label: `${M_.subsystems} subsys.` },
        ]} />
        <p className="wiv-body min-h-[64px]" aria-live="polite">{text}</p>
        <KRuler d={d} m={m} />
      </div>
    </div>
  );
}

function KRuler({ d, m }: { d: SiteData; m: M }) {
  const [ref, W] = useWidth<HTMLDivElement>(360);
  const M_ = d.missions[m];
  const marks = d.rows.filter((r) => r.mission === +m && r.latentK !== null).map((r) => ({ name: short(r.method), k: r.latentK!, how: r.method === "GMM" ? "BIC K*" : r.family === "baseline" ? "clusters" : "latent K" }))
    .sort((a, b) => a.k - b.k);
  const L = 128, R = 26, T = 30, RH = 19, H = T + marks.length * RH + 8;
  const X = (k: number) => L + (k / 31) * (W - L - R);
  return (
    <div ref={ref} className="border-t border-[var(--ink)] pt-3">
      <p className="wiv-label text-[var(--ink)]">Where each method&apos;s K lands · Mission {m}</p>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="mt-1 block h-auto w-full" role="img"
        aria-label={`K per method on Mission ${m}: ${marks.map((x) => `${x.name} ${x.k}`).join(", ")}. Subsystems ${M_.subsystems}, groups ${M_.groups}.`}>
        {[0, 10, 20, 30].map((k) => <text key={k} x={X(k)} y={11} textAnchor="middle" fontSize="10.5" fill="#56616f" style={MONO}>{k}</text>)}
        <line x1={X(0)} x2={X(31)} y1={17} y2={17} stroke="#d5dce4" />
        <line x1={X(M_.subsystems)} x2={X(M_.subsystems)} y1={17} y2={H} stroke="#56616f" strokeDasharray="2 3" />
        <line x1={X(M_.groups)} x2={X(M_.groups)} y1={17} y2={H} stroke="#111824" />
        <text x={X(M_.subsystems) - 4} y={27} textAnchor="end" fontSize="10.5" fill="#56616f" style={MONO}>{M_.subsystems} SUBSYS.</text>
        <text x={X(M_.groups) + 4} y={27} textAnchor={M_.groups > 24 ? "end" : "start"} dx={M_.groups > 24 ? -8 : 0} fill="#111824" fontSize="10.5" style={MONO}>{M_.groups} GROUPS</text>
        {marks.map((x, i) => {
          const y = T + i * RH + 12;
          return (
            <g key={x.name}>
              <text x={0} y={y + 3.5} fontSize="10.5" fill="#111824" style={MONO}>{x.name}</text>
              <line x1={X(0)} x2={X(x.k)} y1={y} y2={y} stroke="#d5dce4" />
              <rect x={X(x.k) - 4} y={y - 4} width="8" height="8" fill={x.how === "BIC K*" ? "#111824" : "#fff"} stroke="#111824" />
              <text x={X(x.k) + 8} y={y + 3.5} fontSize="10.5" fill="#56616f" style={MONO}>{x.k}</text>
            </g>
          );
        })}
      </svg>
      <p className="wiv-caption mt-1">■ GMM BIC K* · □ K-Means clusters or the K found in a VAE latent space (Table 1).</p>
    </div>
  );
}

/* ====================================================================== */
/* 02 · BIC as a glacier profile                                            */
/* ====================================================================== */
function Glacier({ d }: P) {
  const [m, setM] = useState<M>("1");
  const sw = d.bic[m], M_ = d.missions[m];
  const [k, setK] = useState(M_.k);
  useEffect(() => setK(d.missions[m].k), [m, d]);
  const [wref, W] = useWidth<HTMLDivElement>(900);
  const H = W < 560 ? 240 : 290, L = 16, R = 16, T = 40, B = 34;
  const ks = sw.map((p) => p.k), bs = sw.map((p) => p.bic);
  const k0 = Math.min(...ks), k1 = Math.max(...ks), b0 = Math.min(...bs), b1 = Math.max(...bs);
  const X = (x: number) => q(L + ((x - k0) / (k1 - k0)) * (W - L - R));
  const Y = (b: number) => q(T + 14 + (1 - (b - b0) / (b1 - b0)) * (H - T - B - 14));
  const surf = sw.map((p) => `${X(p.k)},${Y(p.bic)}`).join(" L");
  const ice = `M${X(k0)},${H - B} L${surf} L${X(k1)},${H - B} Z`;
  const cur = sw.find((p) => p.k === k) ?? sw[0], best = sw.find((p) => p.k === M_.k)!;
  const dB = cur.bic - best.bic;
  const zone = k < M_.subsystems ? "below the subsystem count" : k <= M_.subsystems + 1 ? "at subsystem scale" : k < M_.groups - 3 ? "between subsystems and groups" : k <= M_.groups + 3 ? "at operational-group scale" : "past the group count";
  const cid = `wiv-ice-${m}`;
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Mission" value={m} set={setM} options={missionOpts} />
        <span className="wiv-caption">Full-covariance GMM on PCA-30 · 800K-row training sample · lower BIC = better</span>
      </div>
      <div ref={wref}>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block h-auto w-full border border-[var(--rime)] bg-[linear-gradient(#ffffff,#f4f6f8)]" role="group"
          aria-label={`BIC against K for Mission ${m}, K from ${k0} to ${k1}. The minimum is K* = ${M_.k}. Subsystems ${M_.subsystems}, groups ${M_.groups}.`}>
          <defs><clipPath id={cid}><path d={ice} /></clipPath></defs>
          <path d={ice} fill="#eef2f6" />
          <g clipPath={`url(#${cid})`} fill="none" stroke="#ffffff" strokeWidth="1.2">
            {[9, 18, 30, 46, 66].map((o) => <path key={o} d={`M${sw.map((p) => `${X(p.k)},${Y(p.bic) + o}`).join(" L")}`} strokeDasharray={o > 20 ? "3 4" : undefined} />)}
          </g>
          <path className="wiv-draw" pathLength={1} d={`M${surf}`} fill="none" stroke="#111824" strokeWidth="1.4" />
          <line x1={L} x2={W - R} y1={H - B + 0.5} y2={H - B + 0.5} stroke="#56616f" />
          {/* reference levels */}
          <line x1={X(M_.subsystems)} x2={X(M_.subsystems)} y1={T - 18} y2={H - B} stroke="#56616f" strokeDasharray="2 3" />
          <text x={X(M_.subsystems) + 5} y={T - 8} fontSize="10.5" fill="#56616f" style={MONO}>{M_.subsystems} {W < 560 ? "SUBS." : "SUBSYSTEMS"}</text>
          <line x1={X(Math.min(M_.groups, k1))} x2={X(Math.min(M_.groups, k1))} y1={T - 18} y2={H - B} stroke="#111824" strokeDasharray="5 3" />
          <text x={X(Math.min(M_.groups, k1)) - 5} y={T - 8} textAnchor="end" fontSize="10.5" fill="#111824" style={MONO}>{M_.groups} {W < 560 ? "GR." : "GROUPS"}</text>
          {/* K* flag: pole from the valley floor up to a pennant under the top rail */}
          {(() => { const fx = X(M_.k), left = M_.k > k1 - 6, fy = T + 4; return (<>
            <line x1={fx} x2={fx} y1={fy} y2={Y(best.bic)} stroke="#111824" />
            <path d={`M${fx},${fy} l${left ? -14 : 14},5 l${left ? 14 : -14},5 Z`} fill="#111824" />
            <text x={fx + (left ? -18 : 18)} y={fy + 9} textAnchor={left ? "end" : "start"} fontSize="10.5" fill="#111824" style={MONO}>K* = {M_.k}{W < 560 ? "" : " · BIC MINIMUM"}</text>
          </>); })()}
          {sw.map((p) => (
            <g key={p.k}>
              <rect x={X(p.k) - (W - L - R) / (k1 - k0) / 2} y={T - 20} width={(W - L - R) / (k1 - k0)} height={H - T + 20} fill="transparent" className="cursor-pointer" onClick={() => setK(p.k)} />
              <rect x={X(p.k) - (p.k === k ? 4.5 : 2)} y={Y(p.bic) - (p.k === k ? 4.5 : 2)} width={p.k === k ? 9 : 4} height={p.k === k ? 9 : 4} fill={p.k === k ? "#fff" : "#111824"} stroke="#111824" pointerEvents="none" />
              {((W < 560 ? p.k % 4 === 0 && Math.abs(p.k - M_.k) > 1 : p.k % 2 === 0) || p.k === M_.k) && <text x={X(p.k)} y={H - B + 18} textAnchor="middle" fontSize="10.5" fill={p.k === M_.k ? "#111824" : "#56616f"} style={MONO} pointerEvents="none">{p.k}</text>}
            </g>
          ))}
          <line x1={X(k)} x2={X(k)} y1={T - 18} y2={H - B} stroke="#111824" strokeWidth=".8" pointerEvents="none" />
        </svg>
      </div>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <label className="grid gap-1">
          <span className="wiv-label text-[var(--ink)]">Number of components · K = {k}</span>
          <input type="range" className="wiv-range" min={k0} max={k1} value={k} onChange={(e) => setK(+e.target.value)}
            aria-valuetext={`K ${k}, ${dB === 0 ? "the BIC minimum" : `BIC ${(dB / 1e6).toFixed(2)} million above the minimum`}, ${zone}`} />
        </label>
        <dl className="grid grid-cols-2 border border-[var(--rime)] bg-white sm:grid-cols-3" aria-live="polite">
          <div className="px-3 py-2"><dt className="wiv-label">BIC</dt><dd className="wiv-num wiv-tick text-[17px]">{(cur.bic / 1e6).toFixed(2)}M</dd></div>
          <div className="border-l border-[var(--rime)] px-3 py-2"><dt className="wiv-label">vs K*</dt><dd className="wiv-num wiv-tick text-[17px]">{dB === 0 ? "min" : `+${(dB / 1e6).toFixed(2)}M`}</dd></div>
          <div className="col-span-2 border-t border-[var(--rime)] px-3 py-2 sm:col-span-1 sm:border-l sm:border-t-0"><dt className="wiv-label">K = {k} is</dt><dd className="text-[11.5px] leading-snug">{zone}</dd></div>
        </dl>
      </div>
      <p className="wiv-caption">Swept K = {k0}–{k1} in the notebook. The paper&apos;s text says 2–20, but K* = {d.missions["1"].k} (M1) and {d.missions["2"].k} (M2) lie outside that range, so the full notebook sweep is drawn.</p>
    </div>
  );
}

/* ====================================================================== */
/* 03 · why global detectors fail: the longest anomaly, three saved scores  */
/* ====================================================================== */
function Failure({ d }: P) {
  const reduced = useReduced();
  const Lg = d.longest, S = Lg.strips, n = S[0].v.length;
  const [f, setF] = useState(Math.round(n * (Lg.a + 0.04)));
  const [play, setPlay] = useState(false);
  useEffect(() => {
    if (!play) return;
    const id = window.setInterval(() => setF((x) => { if (x >= n - 1) { setPlay(false); return x; } return x + 1; }), reduced ? 120 : 30);
    return () => window.clearInterval(id);
  }, [play, n, reduced]);
  const [wref, W] = useWidth<HTMLDivElement>(900);
  const SH = W < 560 ? 62 : 74;
  const a = Lg.a * W, b = Lg.b * W;
  const frac = (f + 0.5) / n;
  const step = Lg.winStart + Math.round(frac * Lg.winLen);
  const segA = Lg.winStart + Math.round(Lg.a * Lg.winLen);
  const hrs = ((step - segA) * 30) / 3600;
  const inside = frac >= Lg.a && frac <= Lg.b;
  const km = S[0], gm = S[1];
  const peakX = km.peak / km.nominal, lateX = km.late / km.nominal;
  const i0 = Math.ceil(Lg.a * n), i1 = Math.floor(Lg.b * n);
  const thrL = gm.threshold ? Math.log10(gm.threshold) : 0;
  const above = gm.v.slice(i0, i1).filter((x) => x[0] > thrL).length / Math.max(1, i1 - i0);
  const big = (x: number) => (x >= 1e4 ? `${fmt(Math.round(x / 1000))}K` : x >= 100 ? fmt(Math.round(x)) : x.toFixed(1));
  const ticks = (W < 560 ? [0, 400, 800] : [-200, 0, 200, 400, 600, 800, 1000]).map((hh) => ({ hh, x: ((segA + (hh * 3600) / 30 - Lg.winStart) / Lg.winLen) * W })).filter((t) => t.x > 4 && t.x < W - 4);
  return (
    <div className="grid gap-4">
      <p className="wiv-body max-w-[96ch]">
        K-Means jumps <b className="font-medium">×{big(peakX)}</b> at onset, then sinks to <b className="font-medium">×{lateX.toFixed(1)}</b> of its nominal level: the fault is folded into a &ldquo;normal&rdquo; cluster.
        The GMM&apos;s score stays above its own alarm line (99th percentile of training NLL, {gm.threshold}) for <b className="font-medium">{Math.round(above * 100)}%</b> of the segment.
      </p>
      <div ref={wref} className="relative grid gap-2">
        <div className="relative min-h-[18px]">
          <span className="wiv-hud block sm:absolute sm:top-0 sm:whitespace-nowrap" style={W >= 640 ? { left: Math.max(0, Math.min(a, W - 520)) } : undefined}>▲ Labelled anomaly · {fmt(Lg.timesteps)} steps · ~{Lg.hours} h · from {Lg.start}</span>
        </div>
        {S.map((s, si) => {
          const Y = (v: number) => q(4 + (1 - (v - s.lo) / (s.hi - s.lo || 1)) * (SH - 8));
          const med = "M" + s.v.map((p, i) => `${q((i / (n - 1)) * W)},${Y(p[0])}`).join("L");
          const mx = "M" + s.v.map((p, i) => `${q((i / (n - 1)) * W)},${Y(p[1])}`).join("L");
          const nowV = Math.pow(10, s.v[f][0]);
          return (
            <div key={s.method}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <span className="wiv-label text-[var(--ink)]">{s.method} · {s.scoring}</span>
                <span className="wiv-hud wiv-tick text-[var(--muted)]">peak ×{big(s.peak / s.nominal)} · last third ×{(s.late / s.nominal).toFixed(1)} · <span className="text-[var(--ink)]">now ×{big(nowV / s.nominal)}</span></span>
              </div>
              <svg viewBox={`0 0 ${W} ${SH}`} width={W} height={SH} className="block h-auto w-full border border-[var(--rime)] bg-white" aria-hidden="true">
                <rect x={a} width={b - a} y={0} height={SH} fill="#111824" opacity=".06" />
                <rect x={a} width={b - a} y={0} height={2} fill="#111824" />
                <line x1={0} x2={W} y1={Y(Math.log10(s.nominal))} y2={Y(Math.log10(s.nominal))} stroke="#56616f" strokeDasharray="1.5 3" />
                {s.threshold && <><line x1={0} x2={W} y1={Y(Math.log10(s.threshold))} y2={Y(Math.log10(s.threshold))} stroke="#111824" strokeDasharray="6 3" />
                  <text x={6} y={Y(Math.log10(s.threshold)) - 4} fontSize="10.5" fill="#111824" style={MONO}>ALARM LINE {s.threshold}</text></>}
                <path d={mx} fill="none" stroke="#56616f" strokeWidth=".7" opacity=".55" />
                <path className="wiv-draw" pathLength={1} d={med} fill="none" stroke="#111824" strokeWidth="1.2" />
                <line x1={frac * W} x2={frac * W} y1={0} y2={SH} stroke="#111824" strokeWidth="1.2" />
              </svg>
            </div>
          );
        })}
        <div className="relative h-[16px]">
          {ticks.map((t) => <span key={t.hh} className="wiv-caption absolute top-0 -translate-x-1/2 tabular-nums" style={{ left: t.x }}>{t.hh === 0 ? "onset" : `${t.hh > 0 ? "+" : ""}${t.hh} h`}</span>)}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
        <div className="flex items-center gap-2">
          <Circle small label={play ? "Pause playback" : "Play through the fault"} icon={play ? "pause" : "play"} pressed={play} onClick={() => { if (f >= n - 1) setF(0); setPlay(!play); }} />
          <button type="button" className="wiv-btn" onClick={() => { setPlay(false); setF(Math.round(n * (Lg.a + 0.01))); }}>Jump to onset</button>
        </div>
        <input type="range" className="wiv-range" min={0} max={n - 1} value={f} onChange={(e) => { setPlay(false); setF(+e.target.value); }}
          aria-label="Scrub through the fault" aria-valuetext={`${inside ? `${Math.round(hrs)} hours into the anomaly` : hrs < 0 ? `${Math.round(-hrs)} hours before onset` : "after the anomaly"}. K-Means ×${(Math.pow(10, km.v[f][0]) / km.nominal).toFixed(1)} of nominal, GMM ${Math.pow(10, gm.v[f][0]) > (gm.threshold ?? 0) ? "above" : "below"} its alarm line.`} />
        {inside ? <StatusTag s="anomaly" label={`Inside fault · ${Math.round(hrs)} h`} solid /> : <StatusTag s="nominal" label={hrs < 0 ? `${Math.round(-hrs)} h before` : "After fault"} />}
      </div>
      <p className="wiv-caption">Same segment as the paper&apos;s Fig. 3. The paper plots the K = 2 K-Means and PCA scores, which were not saved; these are the saved K = 8 K-Means, GMM (K = 21) and HierarchicalVAE scores. Log scale, each strip on its own range; dotted line = median score before onset (×1.0).</p>
    </div>
  );
}

/* ====================================================================== */
/* 04 · deep field over the whole Mission 1 test set (Skyviewer deep zoom)  */
/* ====================================================================== */
const NICE_H = [1, 2, 6, 12, 24, 48, 168, 336, 720, 2160, 4320, 8760, 17520, 35040];
const hLabel = (h: number) => (h >= 8760 ? `${h / 8760} yr` : h >= 720 ? `${h / 720} mo` : h >= 168 ? `${h / 168} wk` : h >= 24 ? `${h / 24} d` : `${h} h`);
type VCam = { c: number; z: number };
const ZD = 60;
function DeepField({ d }: P) {
  const reduced = useReduced();
  const { v, segs, n } = d.deep;
  const [cam, setCamS] = useState<VCam>({ c: 0.5, z: 1 });
  const camRef = useRef(cam); camRef.current = cam;
  const anim = useRef(0);
  const clamp = (c: VCam): VCam => { const z = Math.min(ZD, Math.max(1, c.z)); const h = 0.5 / z; return { z, c: Math.min(1 - h, Math.max(h, c.c)) }; };
  const set = (c: VCam) => { cancelAnimationFrame(anim.current); setCamS(clamp(c)); };
  const fly = (t: VCam) => {
    cancelAnimationFrame(anim.current);
    const to = clamp(t), from = camRef.current;
    if (reduced) { setCamS(to); return; }
    const dist = Math.abs(to.c - from.c), dur = Math.min(1700, 800 + dist * 1600);
    const l0 = Math.log(from.z), l1 = Math.log(to.z), zOut = Math.min(from.z, to.z, 1 / (dist * 1.6 + 0.0001));
    const bump = Math.max(0, (l0 + l1) / 2 - Math.log(Math.max(1, zOut))), t0 = performance.now();
    const stepF = (now: number) => {
      const k = Math.min(1, (now - t0) / dur), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      setCamS(clamp({ c: from.c + (to.c - from.c) * e, z: Math.exp(l0 + (l1 - l0) * e - bump * Math.sin(Math.PI * e)) }));
      if (k < 1) anim.current = requestAnimationFrame(stepF);
    };
    anim.current = requestAnimationFrame(stepF);
  };
  useEffect(() => () => cancelAnimationFrame(anim.current), []);
  const longest = useMemo(() => segs.reduce((x, s) => (s[1] - s[0] > x[1] - x[0] ? s : x), segs[0]), [segs]);
  const wrap = useRef<HTMLDivElement>(null), stage = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const [W, setW] = useState(900);
  const H = W < 560 ? 230 : 300;
  const lo = cam.c - 0.5 / cam.z, hi = cam.c + 0.5 / cam.z, span = hi - lo;
  const hoursTotal = (n * 30) / 3600;
  useEffect(() => { const el = wrap.current!; const ro = new ResizeObserver(() => setW(el.clientWidth)); ro.observe(el); return () => ro.disconnect(); }, []);
  useEffect(() => {
    const c = canvas.current!, ctx = c.getContext("2d")!, dpr = Math.min(2, devicePixelRatio || 1);
    c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const X = (f: number) => ((f - lo) / span) * W, top = 46, bot = H - 50, amp = bot - top;
    const hrsPerPx = (span * hoursTotal) / W, stepH = NICE_H.find((h) => h / hrsPerPx > 110) ?? 8760, stepF = stepH / hoursTotal;
    ctx.strokeStyle = "rgba(17,24,36,0.08)"; ctx.fillStyle = "#56616f"; ctx.font = "300 10.5px ui-monospace, monospace"; ctx.lineWidth = 1;
    for (let f = Math.ceil(lo / stepF) * stepF; f < hi; f += stepF) {
      const x = Math.round(X(f)) + 0.5; ctx.beginPath(); ctx.moveTo(x, top - 10); ctx.lineTo(x, bot + 6); ctx.stroke();
      const hrs = f * hoursTotal; ctx.fillText(hrs >= 48 ? `day ${Math.round(hrs / 24)}` : `${Math.round(hrs)} h`, x + 4, bot + 18);
    }
    for (const [a, b] of segs) {
      if (b < lo || a > hi) continue;
      const x0 = X(a), x1 = Math.max(x0 + 1, X(b));
      ctx.fillStyle = a === longest[0] ? "rgba(17,24,36,0.15)" : "rgba(17,24,36,0.08)"; ctx.fillRect(x0, top - 10, x1 - x0, amp + 16);
      ctx.fillStyle = "#111824"; ctx.fillRect(x0, top - 12, x1 - x0, 2);
    }
    const nB = v.length, i0 = Math.max(0, Math.floor(lo * nB) - 1), i1 = Math.min(nB - 1, Math.ceil(hi * nB) + 1), every = Math.max(1, Math.floor((i1 - i0) / (W * 0.9)));
    ctx.fillStyle = "rgba(86,97,111,0.55)";
    for (let i = i0; i <= i1; i += every) { const x = X((i + 0.5) / nB); ctx.fillRect(x - 0.7, bot - v[i][1] * amp - 0.7, 1.4, 1.4); }
    ctx.beginPath(); ctx.strokeStyle = "#111824"; ctx.lineWidth = 1.1;
    for (let i = i0; i <= i1; i += every) { const x = X((i + 0.5) / nB), y = bot - (0.15 + v[i][0] * 0.6) * amp; if (i === i0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.stroke();
    ctx.strokeStyle = "#d5dce4"; ctx.beginPath(); ctx.moveTo(0, bot + 6.5); ctx.lineTo(W, bot + 6.5); ctx.stroke();
    const lx = X(longest[0]);
    if (lx > -40 && lx < W - 10) { ctx.fillStyle = "#111824"; ctx.font = "400 10.5px ui-monospace, monospace"; ctx.fillText(`LONGEST · ${fmt(d.longest.timesteps)} STEPS`, Math.max(6, Math.min(W - 220, lx + 4)), top - 18); }
  }, [W, H, lo, hi, span, v, segs, longest, hoursTotal, d.longest]);
  useEffect(() => {
    const el = stage.current!, pts = new Map<number, number>();
    let last = 0, pinch0 = 0, z0 = 1, moved = false;
    const down = (e: PointerEvent) => { if ((e.target as HTMLElement).closest("button")) return; pts.set(e.pointerId, e.clientX); last = e.clientX; moved = false; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.abs(a - b); z0 = camRef.current.z; } };
    const move = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, e.clientX);
      if (pts.size === 2) { const [a, b] = [...pts.values()]; if (pinch0 > 10) set({ ...camRef.current, z: z0 * (Math.abs(a - b) / pinch0) }); return; }
      const dx = e.clientX - last; last = e.clientX;
      if (!moved && Math.abs(dx) < 2) return;
      if (!moved) { moved = true; el.setPointerCapture(e.pointerId); el.dataset.drag = "true"; }
      const c = camRef.current; set({ ...c, c: c.c - dx / el.clientWidth / c.z });
    };
    const up = (e: PointerEvent) => { pts.delete(e.pointerId); el.dataset.drag = "false"; };
    const wheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const r = el.getBoundingClientRect(), c = camRef.current, fx = (e.clientX - r.left) / r.width;
      const f = c.c - 0.5 / c.z + fx / c.z, z = Math.min(ZD, Math.max(1, c.z * Math.exp(-e.deltaY * 0.01)));
      set({ z, c: f - (fx - 0.5) / z });
    };
    el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move); el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => { el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up); el.removeEventListener("wheel", wheel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const zoomBy = (k: number) => fly({ ...cam, z: cam.z * k });
  const nextSeg = () => { const s = segs.find(([a]) => a > cam.c + 0.001) ?? segs[0]; fly({ c: (s[0] + s[1]) / 2, z: Math.min(ZD, 0.5 / Math.max(0.0008, s[1] - s[0])) }); };
  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key;
    if (k === "ArrowLeft" || k === "ArrowRight") { e.preventDefault(); set({ ...cam, c: cam.c + (k === "ArrowRight" ? 0.1 : -0.1) / cam.z }); }
    else if (k === "+" || k === "=") { e.preventDefault(); zoomBy(1.6); }
    else if (k === "-" || k === "_") { e.preventDefault(); zoomBy(1 / 1.6); }
    else if (k === "0") { e.preventDefault(); fly({ c: 0.5, z: 1 }); }
  };
  const hrsPerPx = (span * hoursTotal) / W;
  const barH = [...NICE_H].reverse().find((h) => h / hrsPerPx <= Math.min(140, W * 0.28)) ?? 1;
  const atLongest = Math.abs(cam.c - (longest[0] + longest[1]) / 2) < 0.002 && cam.z > 8;
  const frac = cam.z < 1.05 ? "all" : `1/${Math.round(cam.z)}`;
  const inView = segs.filter(([a, b]) => b >= lo && a <= hi).length;
  return (
    <div ref={wrap} className="grid gap-3" data-nodrag data-ownzoom>
      <div ref={stage} className="wiv-viewer border border-[var(--rime)]" style={{ height: H, touchAction: "pan-y" }} tabIndex={0} onKeyDown={onKey}
        role="application" aria-roledescription="deep-zoom timeline"
        aria-label={`Mission 1 GMM anomaly score over ${fmt(n)} test timesteps. Viewing ${frac} of the mission, ${inView} labelled anomalies in view. Left and right arrows pan, plus and minus zoom, 0 fits.`}>
        <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-hidden="true" />
        <div className="wiv-hud pointer-events-none absolute left-3 top-2"><span className="wiv-backing block">M1 · GMM K = 21 · neg. log-lik.</span></div>
        <div className="wiv-hud wiv-tick pointer-events-none absolute right-[60px] top-2 hidden text-right sm:block"><span className="wiv-backing ml-auto block">T +{fmt(Math.round(cam.c * n))} · {cam.z.toFixed(1)}× · {inView} anomalies in view</span></div>
        <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 flex-col gap-2" role="group" aria-label="Deep-zoom controls">
          <Circle small label="Zoom in (+)" icon="plus" onClick={() => zoomBy(1.6)} disabled={cam.z >= ZD} />
          <Circle small label="Zoom out (−)" icon="minus" onClick={() => zoomBy(1 / 1.6)} disabled={cam.z <= 1} />
          <Circle small label="Fit the whole mission (0)" icon="fit" onClick={() => fly({ c: 0.5, z: 1 })} />
        </div>
        <div className="pointer-events-none absolute bottom-3 left-3 grid gap-1">
          <span className="wiv-hud wiv-backing block">{hLabel(barH)}</span>
          <span className="block h-[5px] border-x border-b border-[var(--ink)]" style={{ width: barH / hrsPerPx }} />
        </div>
      </div>
      <Minimap v={v} segs={segs} lo={lo} hi={hi} onSeek={(c) => set({ ...cam, c })} />
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="wiv-btn" onClick={() => (atLongest ? fly({ c: 0.5, z: 1 }) : fly({ c: (longest[0] + longest[1]) / 2, z: Math.min(ZD, 0.6 / (longest[1] - longest[0])) }))}>
          {atLongest ? "Fit the whole mission" : "Fly to the longest fault"}
        </button>
        <button type="button" className="wiv-btn" onClick={nextSeg}>Next anomaly<Icon n="right" size={12} /></button>
        <span className="wiv-caption ml-auto">Viewing <span className="text-[var(--ink)]">{frac}</span> of M1 · {segs.length} labelled segments · 1,500 bins (~{fmt(Math.round(n / 1500))} steps each), median line, bin max as specks</span>
      </div>
    </div>
  );
}
function Minimap({ v, segs, lo, hi, onSeek }: { v: [number, number][]; segs: [number, number][]; lo: number; hi: number; onSeek: (c: number) => void }) {
  const ref = useRef<SVGSVGElement>(null), drag = useRef(false);
  const path = useMemo(() => { const n = 300, st = v.length / n; return "M" + Array.from({ length: n }, (_, i) => `${(i / (n - 1)) * 1000},${(34 - v[Math.floor(i * st)][0] * 26).toFixed(1)}`).join("L"); }, [v]);
  const seek = (x: number) => { const r = ref.current!.getBoundingClientRect(); onSeek(Math.max(0, Math.min(1, (x - r.left) / r.width))); };
  const c = (lo + hi) / 2;
  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-3">
      <span className="wiv-label">Minimap</span>
      <svg ref={ref} viewBox="0 0 1000 40" preserveAspectRatio="none" className="h-[36px] w-full cursor-pointer border border-[var(--rime)] bg-white" style={{ touchAction: "none" }}
        role="slider" tabIndex={0} aria-label="Minimap: move the view along the mission" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(c * 100)} aria-valuetext={`${Math.round(c * 100)}% through the mission`}
        onPointerDown={(e) => { drag.current = true; e.currentTarget.setPointerCapture(e.pointerId); seek(e.clientX); }}
        onPointerMove={(e) => { if (drag.current) seek(e.clientX); }} onPointerUp={() => { drag.current = false; }}
        onKeyDown={(e) => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); onSeek(Math.max(0, Math.min(1, c + (e.key === "ArrowRight" ? 0.05 : -0.05)))); } }}>
        {segs.map(([a, b], i) => <rect key={i} x={a * 1000} width={Math.max(1, (b - a) * 1000)} y="0" height="40" fill="#111824" opacity=".1" />)}
        <path d={path} fill="none" stroke="#56616f" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <rect x={lo * 1000} width={Math.max(4, (hi - lo) * 1000)} y="1" height="38" fill="rgba(17,24,36,.06)" stroke="#111824" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

/* ====================================================================== */
/* 05 · compare: Table 1 live, with a method detail panel                   */
/* ====================================================================== */
type Key = "label" | "prAuc" | "rocAuc" | "eventF1";
function Compare({ d }: P) {
  const { openPaper, go } = useSite();
  const [scope, setScope] = useState<"all" | M>("all");
  const [fams, setFams] = useState<string[]>(["baseline", "parametric", "generative"]);
  const [key, setKey] = useState<Key>("prAuc");
  const [dir, setDir] = useState<1 | -1>(-1);
  const [sel, setSel] = useState(d.rows.find((r) => r.method === "GMM" && r.mission === 1)!.id);
  const top: Record<number, number> = {};
  for (const r of d.rows) top[r.mission] = Math.max(top[r.mission] ?? 0, r.prAuc);
  const rows = useMemo(() => d.rows.filter((r) => (scope === "all" || r.mission === +scope) && fams.includes(r.family)).sort((a, b) => {
    const av = a[key], bv = b[key];
    if (av === null) return 1; if (bv === null) return -1;
    return (typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number)) * dir;
  }), [d, scope, fams, key, dir]);
  const r = d.rows.find((x) => x.id === sel)!;
  const th = (k: Key, label: string, right = false) => (
    <th scope="col" aria-sort={key === k ? (dir === 1 ? "ascending" : "descending") : "none"} className={`py-0 font-normal ${right ? "text-right" : "text-left"}`}>
      <button type="button" className={`wiv-label inline-flex min-h-[34px] items-center gap-1.5 whitespace-nowrap px-1.5 text-[var(--ink)] hover:bg-white active:bg-[var(--press)] ${right ? "flex-row-reverse" : ""}`}
        onClick={() => { if (key === k) setDir(dir === 1 ? -1 : 1); else { setKey(k); setDir(k === "label" ? 1 : -1); } }}>
        {label}<span aria-hidden="true" className={key === k ? "" : "opacity-40"}>{key === k ? (dir === 1 ? "↑" : "↓") : "↕"}</span>
      </button>
    </th>
  );
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
      <div className="grid min-w-0 content-start gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented label="Mission" value={scope} set={setScope} options={[{ v: "all", label: "Both" }, { v: "1", label: "M1" }, { v: "2", label: "M2" }]} />
          <div role="group" aria-label="Method family" className="flex flex-wrap gap-1.5">
            {(["baseline", "parametric", "generative"] as const).map((f) => {
              const on = fams.includes(f);
              return (
                <button key={f} type="button" className="wiv-chip" aria-pressed={on} disabled={on && fams.length === 1}
                  onClick={() => setFams(on ? fams.filter((x) => x !== f) : [...fams, f])}>
                  <span className="wiv-chipMark" aria-hidden="true">{on && <Icon n="check" size={10} />}</span>{fam[f]}
                </button>
              );
            })}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-[12px]">
            <caption className="sr-only">Table 1: point-wise and event-wise performance. Sort with the column buttons; select a row to open its detail.</caption>
            <thead><tr className="border-b border-[var(--ink)]">{th("label", "Method")}{th("prAuc", "PR-AUC", true)}{th("rocAuc", "ROC", true)}{th("eventF1", "Ev. F1", true)}</tr></thead>
            <tbody>
              {rows.map((x: Row) => {
                const isTop = x.prAuc === top[x.mission];
                return (
                  <tr key={x.id} className="cursor-pointer border-b border-[var(--rime)] hover:bg-white" onClick={() => setSel(x.id)}
                    style={x.id === sel ? { background: "#fff", boxShadow: "inset 4px 0 0 #111824" } : undefined}>
                    <td className="py-0 pr-1">
                      <button type="button" className="flex min-h-[30px] w-full items-center gap-2 pl-2.5 text-left" aria-pressed={x.id === sel} onClick={(e) => { e.stopPropagation(); setSel(x.id); }}>
                        <span className="wiv-label w-[22px] shrink-0">M{x.mission}</span>
                        <span className="truncate">{x.label.replace(/ \(M\d,?\s?/, " (").replace(" ()", "").replace("()", "")}</span>
                      </button>
                    </td>
                    <td className="px-1.5 text-right">
                      <span className="inline-flex items-center gap-2">
                        {isTop && <span className="wiv-label whitespace-nowrap text-[var(--ink)]">● Top</span>}
                        <span className="hidden h-[3px] w-[52px] bg-[var(--rime)] sm:inline-block"><span className="block h-full bg-[var(--ink)]" style={{ width: `${(x.prAuc / 0.45) * 100}%` }} /></span>
                        <span className={`wiv-tick ${x.bold ? "font-medium" : ""}`}>{x.prAuc.toFixed(3)}</span>
                      </span>
                    </td>
                    <td className={`wiv-tick px-1.5 text-right ${x.bold ? "font-medium" : ""}`}>{x.rocAuc.toFixed(3)}</td>
                    <td className="wiv-tick px-1.5 text-right">{x.eventF1?.toFixed(3) ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="wiv-caption">● Top = highest PR-AUC in that mission. Medium weight = bold in the paper (the best VAE). — = event F1 computed for baselines only.</p>
      </div>
      <MethodDetail d={d} r={r} isTop={r.prAuc === top[r.mission]} openPaper={openPaper} go={go} />
    </div>
  );
}
function MethodDetail({ d, r, isTop, openPaper, go }: { d: SiteData; r: Row; isTop: boolean; openPaper: (n: number) => void; go: (id: string) => void }) {
  const chance = d.pr[String(r.mission) as M].pos;
  const bar = (v: number) => `${Math.min(100, (v / 0.5) * 100)}%`;
  const vs = { exact: "Matches the notebook output", near: "Within rounding of the notebook", mixed: "Mixes two notebook runs", "not found": "No saved output found" }[r.verify.status] ?? r.verify.status;
  const hasCurve = d.pr[String(r.mission) as M].curves.some((c) => c.method.startsWith(r.method));
  return (
    <article key={r.id} className="wiv-card relative self-start" data-sel="true" aria-live="polite" aria-label={`Detail: ${r.label}`}>
      <span className="wiv-corners" aria-hidden="true"><i /><i /><i /><i /></span>
      <span className="wiv-label">{fam[r.family]} · Mission {r.mission} · {r.scoring}</span>
      <h3 className="wiv-title mt-1"><Scramble text={r.label} ms={500} /></h3>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {isTop && <StatusTag s="best" label={`Top PR-AUC · M${r.mission}`} solid />}
        {r.bold && <span className="wiv-badge">Best VAE · bold in paper</span>}
        <span className="wiv-badge is-quiet">Paper trend: {r.trend}</span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3">
        <div><dt className="wiv-label">PR-AUC</dt><dd className="wiv-num text-[26px] leading-tight">{r.prAuc.toFixed(3)}</dd></div>
        <div><dt className="wiv-label">ROC-AUC</dt><dd className="wiv-num text-[26px] leading-tight">{r.rocAuc.toFixed(3)}</dd></div>
        <div><dt className="wiv-label">{r.d ? "PCA d" : "K"}</dt><dd className="wiv-num text-[20px] leading-tight">{r.d ?? r.latentK ?? "—"}</dd></div>
        <div><dt className="wiv-label">Event F1</dt><dd className="wiv-num text-[20px] leading-tight">{r.eventF1?.toFixed(3) ?? "—"}</dd></div>
      </dl>
      <div className="mt-4 grid gap-1.5">
        <span className="wiv-label">PR-AUC against chance ({chance.toFixed(3)}) and the linear plateau ({d.plateau})</span>
        <div className="relative h-[10px] bg-[var(--bg)]">
          <span className="absolute inset-y-0 left-0 bg-[var(--ink)] transition-[width] duration-500" style={{ width: bar(r.prAuc) }} />
          <span className="absolute -inset-y-1 w-px bg-[var(--muted)]" style={{ left: bar(chance) }} />
          <span className="absolute -inset-y-1 w-0 border-l border-dashed border-[var(--ink)]" style={{ left: bar(d.plateau) }} />
        </div>
        <div className="wiv-caption flex justify-between"><span>0</span><span>{(r.prAuc / chance).toFixed(1)}× chance · {r.prAuc >= d.plateau ? "+" : "−"}{Math.abs(r.prAuc - d.plateau).toFixed(3)} vs plateau</span><span>0.5</span></div>
      </div>
      <p className="wiv-caption mt-3 border-t border-[var(--rime)] pt-3"><span className="text-[var(--ink)]">{r.verify.status === "exact" ? "✓" : r.verify.status === "not found" ? "○" : "◇"} {vs}.</span>{r.verify.detail ? ` ${r.verify.detail}` : ""}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <button type="button" className="wiv-btn min-h-[34px] px-3" onClick={() => openPaper(5)}>Table 1 · p.5</button>
        {r.method === "GMM" && <button type="button" className="wiv-btn min-h-[34px] px-3" onClick={() => go("glacier")}>BIC glacier<Icon n="arrow" size={12} /></button>}
        {hasCurve && <button type="button" className="wiv-btn min-h-[34px] px-3" onClick={() => go("threshold")}>PR curve<Icon n="arrow" size={12} /></button>}
      </div>
    </article>
  );
}

/* ====================================================================== */
/* 06 · threshold: PR curves + live precision / recall                       */
/* ====================================================================== */
function pointAt(c: Curve, pos: number, flag: number) {
  let best = c.pts[0], bd = Infinity;
  for (const p of c.pts) { const f = p[1] > 0 ? (p[0] * pos) / p[1] : 1; const dd = Math.abs(f - flag); if (dd < bd) { bd = dd; best = p; } }
  return best;
}
function Threshold({ d }: P) {
  const [m, setM] = useState<M>("1");
  const P_ = d.pr[m];
  const [ci, setCi] = useState(0);
  useEffect(() => setCi(Math.max(0, d.pr[m].curves.findIndex((x) => x.method.startsWith("GMM")))), [m, d]);
  const c = P_.curves[Math.min(ci, P_.curves.length - 1)];
  const [flag, setFlag] = useState(0.11);
  const [rr, pp] = pointAt(c, P_.pos, flag);
  const f1 = rr + pp > 0 ? (2 * rr * pp) / (rr + pp) : 0;
  const flagged = Math.round(flag * P_.n), tp = Math.round(rr * P_.pos * P_.n), fp = Math.max(0, flagged - tp);
  const [wref, W] = useWidth<HTMLDivElement>(560);
  const H = Math.round(Math.min(340, Math.max(220, W * 0.62))), L = 40, B = 30, T = 12, R = 12;
  const X = (r: number) => L + r * (W - L - R), Y = (p: number) => T + (1 - Math.min(1, p)) * (H - T - B);
  const bestF1 = () => { let b = c.pts[0], bf = 0; for (const qq of c.pts) { const f = qq[0] + qq[1] ? (2 * qq[0] * qq[1]) / (qq[0] + qq[1]) : 0; if (f > bf) { bf = f; b = qq; } } setFlag(Math.min(0.6, Math.max(0.005, (b[0] * P_.pos) / b[1]))); };
  const tag = (x: Curve) => (x.match === "exact" ? "= Table 1" : x.match === "partial" ? "Table 1 run, recomputed" : "saved run");
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div ref={wref} className="min-w-0">
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block h-auto w-full border border-[var(--rime)] bg-white" role="img"
          aria-label={`Precision-recall curves for Mission ${m}. Selected: ${c.method}. Operating point precision ${pp.toFixed(2)}, recall ${rr.toFixed(2)}.`}>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <g key={t}>
              <line x1={X(t)} x2={X(t)} y1={T} y2={H - B} stroke="#e3e8ee" />
              <line x1={L} x2={W - R} y1={Y(t)} y2={Y(t)} stroke="#e3e8ee" />
              <text x={X(t)} y={H - B + 16} textAnchor="middle" fontSize="10.5" fill="#56616f" style={MONO}>{t}</text>
              <text x={L - 6} y={Y(t) + 3} textAnchor="end" fontSize="10.5" fill="#56616f" style={MONO}>{t}</text>
            </g>
          ))}
          <line x1={L} x2={W - R} y1={Y(P_.pos)} y2={Y(P_.pos)} stroke="#56616f" strokeDasharray="2 3" />
          <text x={W - R - 4} y={Y(P_.pos) - 5} textAnchor="end" fontSize="10.5" fill="#56616f" style={MONO}>CHANCE {P_.pos.toFixed(3)}</text>
          {P_.curves.map((x, i) => i !== ci && <path key={x.id + x.method} d={"M" + x.pts.map(([r, p]) => `${X(r).toFixed(1)},${Y(p).toFixed(1)}`).join("L")} fill="none" stroke="#56616f" strokeOpacity=".55" strokeWidth="1" strokeDasharray={DASH[i % DASH.length]} />)}
          <path className="wiv-draw" pathLength={1} key={c.id + m} d={"M" + c.pts.map(([r, p]) => `${X(r).toFixed(1)},${Y(p).toFixed(1)}`).join("L")} fill="none" stroke="#111824" strokeWidth="1.8" />
          <line x1={X(rr)} x2={X(rr)} y1={Y(pp)} y2={H - B} stroke="#111824" strokeDasharray="2 2" />
          <line x1={L} x2={X(rr)} y1={Y(pp)} y2={Y(pp)} stroke="#111824" strokeDasharray="2 2" />
          <rect x={X(rr) - 5} y={Y(pp) - 5} width="10" height="10" fill="#fff" stroke="#111824" strokeWidth="1.5" />
          <text x={L} y={H - 4} fontSize="10.5" fill="#56616f" style={MONO}>RECALL →</text>
          <text x={W - R - 4} y={T + 11} textAnchor="end" fontSize="10.5" fill="#56616f" style={MONO}>PRECISION ↑</text>
        </svg>
      </div>
      <div className="grid min-w-0 content-start gap-4">
        <Segmented label="Mission" value={m} set={setM} options={missionOpts} />
        <label className="grid gap-1.5"><span className="wiv-label text-[var(--ink)]">Score curve</span>
          <select className="wiv-select" value={ci} onChange={(e) => setCi(+e.target.value)}>
            {P_.curves.map((x, i) => <option key={x.id + x.method} value={i}>{x.method} · PR-AUC {x.prAuc.toFixed(3)} · {tag(x)}</option>)}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="flex items-baseline justify-between gap-3"><span className="wiv-label text-[var(--ink)]">Alert on the top {(flag * 100).toFixed(1)}% of scores</span><span className="wiv-caption">{fmt(flagged)} steps</span></span>
          <input type="range" className="wiv-range" min={0.5} max={60} step={0.5} value={+(flag * 100).toFixed(1)} onChange={(e) => setFlag(+e.target.value / 100)}
            aria-valuetext={`Top ${(flag * 100).toFixed(1)} percent flagged, precision ${pp.toFixed(2)}, recall ${rr.toFixed(2)}`} />
        </label>
        <dl className="grid grid-cols-3 border border-[var(--rime)] bg-white">
          {([["Precision", pp], ["Recall", rr], ["F1", f1]] as const).map(([k, v], i) => (
            <div key={k} className={`px-3 py-2.5 ${i ? "border-l border-[var(--rime)]" : ""}`}><dt className="wiv-label">{k}</dt><dd className="wiv-num wiv-tick text-[22px] leading-tight">{v.toFixed(3)}</dd></div>
          ))}
        </dl>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="wiv-btn" onClick={bestF1}>Snap to best F1</button>
          <p className="wiv-caption flex-1" aria-live="polite">{fmt(tp)} true alarms, {fmt(fp)} false alarms in {fmt(P_.n)} test steps ({(P_.pos * 100).toFixed(1)}% anomalous).</p>
        </div>
        <p className="wiv-caption">Recomputed from saved score arrays. Only curves marked &ldquo;= Table 1&rdquo; equal a Table 1 figure; saved runs can differ from it. {c.note ?? ""}</p>
      </div>
    </div>
  );
}

/* ====================================================================== */
/* 07 · the paper: eleven pages floating in the field                        */
/* ====================================================================== */
export const PAGE_CAPTIONS = [
  "Title, abstract, introduction", "Dataset and problem setup", "Baselines · GMM · Fig. 1 PR curve", "The three VAEs",
  "Table 1 · results and discussion", "References", "Fig. 2–3 · timeline failure modes", "Fig. 4 · t-SNE of the test data",
  "Fig. 5 · KPCA sweep and PR curves", "Fig. 6 · PCA analysis and PR curves", "Fig. 7 · TransformerVAE latent maps",
];
const EVIDENCE: [string, number[]][] = [["Table 1 · every method, both missions", [5]], ["Timeline failure (Fig. 3)", [7]], ["PR curves (Fig. 1, Fig. 5)", [3, 9]], ["Latent maps (Fig. 7)", [11]]];
function PaperPlace() {
  const { openPaper } = useSite();
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <ol className="grid grid-cols-3 gap-x-3 gap-y-6 pt-2 min-[480px]:grid-cols-4 sm:grid-cols-6" aria-label="Pages">
        {PAGE_CAPTIONS.map((cap, i) => (
          <li key={i} style={{ transform: `translateY(${[0, 14, -4, 10, -8, 6][i % 6]}px)` }}>
            <button type="button" className="wiv-thumb relative w-full" onClick={() => openPaper(i + 1)} aria-label={`Open page ${i + 1}: ${cap}`} title={cap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/paper/pages/thumb-${pad(i + 1)}.jpg`} alt="" width={320} height={415} decoding="async" draggable={false} />
            </button>
            <span className="wiv-label mt-1.5 block tabular-nums">p.{pad(i + 1)}</span>
          </li>
        ))}
      </ol>
      <div className="grid content-start gap-4">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="wiv-btn" onClick={() => openPaper(1)}><Icon n="atlas" size={13} />Open the reader</button>
          <a className="wiv-btn" href={PDF} download>Download PDF<Icon n="down" size={12} /></a>
        </div>
        <div>
          <p className="wiv-label text-[var(--ink)]">The evidence, by page</p>
          <ul className="mt-1 border-t border-[var(--ink)]">
            {EVIDENCE.map(([t, ps]) => (
              <li key={t} className="flex items-center justify-between gap-3 border-b border-[var(--rime)] py-1.5">
                <span className="text-[12px]">{t}</span>
                <span className="flex gap-1">{ps.map((n) => <button key={n} type="button" className="wiv-btn min-h-[32px] px-2.5 text-[10.5px]" onClick={() => openPaper(n)} aria-label={`Open page ${n}`}>p.{n}</button>)}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="wiv-caption">11 pages · ← → or swipe to fly between them · + − or pinch to zoom · Esc closes.</p>
      </div>
    </div>
  );
}

/* ====================================================================== */
/* 08 · credits                                                              */
/* ====================================================================== */
function Credits() {
  const { openPaper } = useSite();
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="grid content-start gap-4">
        <p className="wiv-body max-w-[52ch]">This site is Hewitt&apos;s project: the design, the code, and every figure, redrawn from exported data. It explores a paper written with Rhea Madhogarhia.</p>
        <div className="flex flex-wrap gap-2">
          <a className="wiv-btn" href="/">← Hub</a>
          <a className="wiv-btn" href={PDF} download>Download PDF</a>
          <button type="button" className="wiv-btn is-ghost" onClick={() => openPaper(1)}>Read the paper</button>
        </div>
      </div>
      <dl className="grid content-start gap-4 text-[12.5px] leading-[1.6]">
        <div className="border-t border-[var(--ink)] pt-2"><dt className="wiv-label">The paper</dt>
          <dd><i>Uncovering Latent Structure in ESA Satellite Telemetry.</i> Rhea Madhogarhia &amp; Hewitt Watkins. TTIC 31220 Unsupervised Learning and Data Analysis, The University of Chicago / TTIC, Spring 2026.</dd></div>
        <div className="border-t border-[var(--rime)] pt-2"><dt className="wiv-label">Who did what</dt>
          <dd></dd></div>
        <div className="border-t border-[var(--rime)] pt-2"><dt className="wiv-label">Data</dt>
          <dd>ESA Anomaly Dataset (Kotowski et al., 2024; Andrzejewski et al., 2024), Missions 1 and 2. Numbers are Table 1 as printed; recomputed curves are labelled as such.</dd></div>
      </dl>
    </div>
  );
}
