"use client";
// The places, in the paper's order: finding · 01 Background · 02 What we did · 03 Results (four places) ·
// 04 Conclusions · 05 The paper · About. Copy is drawn from content/report.md; one global mission drives every figure.
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Curve, Hier, Row, SiteData } from "./data";
import { Circle, Icon, Scramble, Segmented, StatusTag, fmt, pad, useReduced, useWidth } from "./kit";
import { useSite } from "./site";

type M = "1" | "2";
type P = { d: SiteData; seen: boolean };
const MONO = { fontFamily: "var(--wi-mono)" } as const;
const DASH = ["", "5 3", "1.5 2.5", "8 3 2 3", "3 3", "10 4"];
const short = (m: string) => m.replace("HierarchicalVAE", "HVAE").replace("TransformerVAE", "TVAE").replace("CapacityVAE", "CapVAE").replace("Nystroem-KPCA", "KPCA");
const fam: Record<string, string> = { baseline: "Baselines", parametric: "GMM", generative: "VAEs" };
export const PDF = "/paper/esa-telemetry-latent-structure.pdf";
const INK = "#111824", GLACIER = "#56616f", RIME = "#d5dce4";

/* colour keys: operational groups = Ink, solid (as in every plot); subsystems = Glacier, dashed */
export const G = ({ children }: { children: React.ReactNode }) => <span className="wiv-keyG">{children}</span>;
export const S = ({ children }: { children: React.ReactNode }) => <span className="wiv-keyS">{children}</span>;

export function Body({ id, d, seen }: { id: string } & P) {
  const p = { d, seen };
  switch (id) {
    case "finding": return <Finding {...p} />;
    case "background": return <Background {...p} />;
    case "methods": return <Methods {...p} />;
    case "structure": return <Structure {...p} />;
    case "table": return <Compare {...p} />;
    case "failure": return <Failure {...p} />;
    case "threshold": return <Threshold {...p} />;
    case "conclusions": return <Conclusions {...p} />;
    case "paper": return <PaperPlace />;
    case "about": return <About />;
    default: return null;
  }
}

/* ====================================================================== */
/* the finding (hero): the sentence first, one cyan action, quiet numerals  */
/* ====================================================================== */
function Finding({ d }: P) {
  const { openPaper, tour, touring } = useSite();
  const m1 = d.missions["1"], m2 = d.missions["2"];
  const cells: { k: React.ReactNode; v: string }[] = [
    { k: <S>Subsystems</S>, v: `${m1.subsystems} · ${m2.subsystems}` },
    { k: <G>Operational groups</G>, v: `${m1.groups} · ${m2.groups}` },
    { k: "GMM BIC K*", v: `${m1.k} · ${m2.k}` },
    { k: "Linear plateau", v: d.plateau.toFixed(3) },
  ];
  return (
    <div className="flex flex-col">
      <p className="wiv-label">ESA satellite telemetry · Madhogarhia &amp; Watkins · TTIC 31220 · 2026</p>
      <h1 id="finding-h" tabIndex={-1} className="wiv-display wiv-hero mt-5">
        Latent structure lives in <G>18–29 operational groups</G>, <span className="text-[var(--muted)]">not <S>4–5 subsystems</S>.</span>
      </h1>
      <p className="wiv-lead mt-5 max-w-[46ch]">Each mode has its own normal. That multi-modality is why global detectors fail.</p>
      <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
        <button type="button" className="wiv-pill" data-primary onClick={tour} aria-pressed={touring}
          aria-label={touring ? "Stop the guided tour" : "Take the guided tour, one minute"}>
          <Icon n={touring ? "pause" : "play"} size={12} />
          <span>{touring ? "Stop the tour" : <>Take the tour<span className="hidden min-[360px]:inline"> · 1 min</span></>}</span>
        </button>
        <button type="button" className="wiv-link wiv-textBtn" onClick={() => openPaper(1)}>Read the paper</button>
        <a className="wiv-link wiv-textBtn" href={PDF} download>Download PDF</a>
      </div>
      <dl className="mt-9 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-[var(--rime)] pt-4 lg:grid-cols-4">
        {cells.map((c, i) => (
          <div key={i}>
            <dt className="wiv-label">{c.k}</dt>
            <dd className="mt-1 flex items-baseline gap-2"><span className="wiv-num whitespace-nowrap text-[18px] leading-tight">{c.v}</span><span className="wiv-label">{i < 3 ? "M1 · M2" : "PR-AUC"}</span></dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ====================================================================== */
/* 01 · background: channels → groups → subsystems, the data, the question */
/* ====================================================================== */
const seeded = (seed: number) => { let s = seed; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; };
const q = (n: number) => Math.round(n * 10) / 10;
function crystalLayout(h: Hier, W: number, H: number) {
  const groups = h.flatMap((s, si) => s.groups.map((g) => ({ si, id: g.group, n: g.channels.length, chans: g.channels })));
  const G_ = groups.length, S_ = h.length;
  const rnd = seeded(31);
  const cols = Math.max(3, Math.round(Math.sqrt((G_ * W) / H))), rows = Math.ceil(G_ / cols);
  const cw = W / cols, ch = (H - 44) / rows;
  const g1 = groups.map((_, i) => ({ x: q(cw * ((i % cols) + 0.5) + (rnd() - 0.5) * cw * 0.3), y: q(34 + ch * (Math.floor(i / cols) + 0.5) + (rnd() - 0.5) * ch * 0.25) }));
  const subs = h.map((s, i) => {
    const a = (i / S_) * Math.PI * 2 - Math.PI / 2 + 0.5;
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
    };
  }));
  const ring1 = groups.map((g) => Math.min(Math.min(cw, ch) * 0.3, 5 + g.n * 1.3) + 6);
  const subR = subs.map((_, si) => Math.max(26, ...groups.map((g, gi) => (g.si === si ? Math.hypot(g2[gi].x - subs[si].x, g2[gi].y - subs[si].y) + 3 + g.n * 0.55 + 12 : 0))));
  return { groups, subs, g1, g2, chans, ring1, subR };
}

function Background({ d, seen }: P) {
  const { m } = useSite();
  const [lv, setLv] = useState<"0" | "1" | "2">("0");
  useEffect(() => { if (!seen) return; const t = window.setTimeout(() => setLv((l) => (l === "0" ? "1" : l)), 900); return () => window.clearTimeout(t); }, [seen]);
  const [wref, W] = useWidth<HTMLDivElement>(540);
  const H = Math.round(Math.min(380, Math.max(280, W * 0.66)));
  const h = d.hier[m];
  const L = useMemo(() => crystalLayout(h, W, H), [h, W, H]);
  const M_ = d.missions[m];
  const level = +lv;
  const cap = [
    <>{M_.channels} channels, each one sensor&apos;s time series.</>,
    <><G>{M_.groups} operational groups</G>, e.g. battery charging.</>,
    <><S>{M_.subsystems} subsystems</S>, e.g. power management.</>,
  ][level];
  const st = (p: { x: number; y: number }) => ({ transform: `translate(${p.x}px, ${p.y}px)` });
  const facts: [string, string][] = [
    ["Channels", String(M_.channels)], ["Training steps", M_.train], ["Cadence", m === "1" ? "1 per ~30 s" : "0.056 Hz"],
    ["Labels", m === "1" ? "Genuine faults" : "≈95% rare events"],
  ];
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <figure className="m-0 grid content-start gap-2">
        <div ref={wref} className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block h-auto w-full border border-[var(--rime)] bg-[radial-gradient(110%_100%_at_50%_45%,#fff_0%,#f4f6f8_70%,#e9edf2_100%)]" role="img"
            aria-label={`Mission ${m}: ${M_.channels} channels at the ${["channel", "group", "subsystem"][level]} level.`}>
            {L.subs.map((s, i) => {
              const r = L.subR[i];
              const pts = Array.from({ length: 6 }, (_, k) => { const a = (k / 6) * Math.PI * 2 + i * 0.4; return `${q(s.x + Math.cos(a) * r)},${q(s.y + Math.sin(a) * r * 0.86)}`; }).join(" ");
              return (
                <g key={`s${m}${i}`} className="wiv-fade" opacity={level === 2 ? 1 : 0}>
                  <polygon points={pts} fill="rgba(255,255,255,.7)" stroke={GLACIER} strokeWidth="1" strokeDasharray="4 3" />
                  <text x={Math.min(W - 8, Math.max(8, s.x))} y={Math.max(14, s.y - r * 0.86 - 9)} textAnchor="middle" fontSize="10.5" fill={GLACIER} style={{ ...MONO, letterSpacing: ".08em" }}>{s.name.toUpperCase().replace("SUBSYSTEM", "SUBSYS.")} · {s.nG} GR</text>
                </g>
              );
            })}
            {L.groups.map((g, gi) => (
              <g key={`g${m}${gi}`} className="wiv-speck" style={st(level === 2 ? L.g2[gi] : L.g1[gi])} opacity={level === 0 ? 0 : 1}>
                <circle r={level === 2 ? 3 + g.n * 0.55 + 3 : L.ring1[gi]} fill="none" stroke={level === 1 ? INK : RIME} strokeWidth="1" />
                {level === 1 && <text y={-L.ring1[gi] - 4} textAnchor="middle" fontSize="10.5" fill={GLACIER} style={MONO}>{pad(g.id)}</text>}
              </g>
            ))}
            {L.chans.map((c, i) => (
              <rect key={`c${m}${i}`} className="wiv-speck" x={-1.6} y={-1.6} width={3.2} height={3.2} fill={c.target ? INK : GLACIER} style={st(level === 0 ? c.p0 : level === 1 ? c.p1 : c.p2)} />
            ))}
          </svg>
          <div className="wiv-hud pointer-events-none absolute left-2.5 top-2"><span className="wiv-backing block">M{m} · {["Channels", "Operational groups", "Subsystems"][level]} · {[M_.channels, M_.groups, M_.subsystems][level]}</span></div>
        </div>
        <figcaption className="wiv-caption" aria-live="polite">{cap}</figcaption>
      </figure>

      <div className="grid min-w-0 content-start gap-5">
        <div className="grid gap-1.5">
          <span className="wiv-label text-[var(--ink)]">Group the channels by</span>
          <Segmented label="Level of the engineering hierarchy" value={lv} set={setLv} options={[
            { v: "0", label: "Channel" }, { v: "1", label: "Group" }, { v: "2", label: "Subsystem" },
          ]} />
        </div>
        <dl className="grid grid-cols-2 border border-[var(--rime)] bg-white">
          {facts.map(([k, v], i) => (
            <div key={k} className={`px-3 py-2 ${i % 2 ? "border-l border-[var(--rime)]" : ""} ${i > 1 ? "border-t border-[var(--rime)]" : ""}`}>
              <dt className="wiv-label">{k}</dt><dd className="text-[13px]">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="border-t border-[var(--ink)] pt-3">
          <p className="wiv-label text-[var(--ink)]">The question</p>
          <ol className="mt-2 grid gap-2.5">
            <li className="grid grid-cols-[34px_1fr] items-baseline"><span className="wiv-num text-[15px]">Q1</span><span className="wiv-body">Is there latent structure aligned with known <S>subsystems</S>?</span></li>
            <li className="grid grid-cols-[34px_1fr] items-baseline"><span className="wiv-num text-[15px]">Q2</span><span className="wiv-body">Does learning that structure improve detection?</span></li>
          </ol>
        </div>
      </div>
    </div>
  );
}

/* ====================================================================== */
/* 02 · what we did: five progressively richer methods                      */
/* ====================================================================== */
const LADDER = [
  { n: "K-Means", a: "One set of global clusters", s: "Centroid distance" },
  { n: "PCA", a: "A linear subspace", s: "Reconstruction error" },
  { n: "Nystroem-KPCA", a: "A non-linear kernel boundary", s: "Centroid dist. · recon." },
  { n: "GMM · K by BIC", a: "K local modes, each its own normal", s: "Neg. log-likelihood" },
  { n: "VAEs · Capacity, Hierarchical, Transformer", a: "A learned latent space", s: "ELBO · recon. · GMM-OOD" },
];
function Methods({ d }: P) {
  return (
    <div className="grid gap-6">
      <ol className="grid gap-2" aria-label="Methods, in order of richness">
        {LADDER.map((r, i) => (
          <li key={r.n} className="wiv-rung" style={{ "--step": i } as React.CSSProperties}>
            <span className="wiv-num text-[15px] text-[var(--muted)]">{pad(i + 1)}</span>
            <span className="min-w-0">
              <span className="wiv-title block text-[14px]">{r.n}</span>
              <span className="wiv-caption block">Assumes {r.a.toLowerCase()}</span>
            </span>
            <span className="wiv-label hidden text-right sm:block">{r.s}</span>
          </li>
        ))}
      </ol>
      <dl className="grid gap-4 border-t border-[var(--ink)] pt-3 sm:grid-cols-3">
        <div><dt className="wiv-label text-[var(--ink)]">Scored by PR-AUC</dt><dd className="wiv-caption mt-1">Precision–recall area. Anomalies are rare, so ROC-AUC flatters.</dd></div>
        <div><dt className="wiv-label text-[var(--ink)]">Chance level</dt><dd className="wiv-caption mt-1">The anomaly rate: {d.pr["1"].pos.toFixed(3)} (M1), {d.pr["2"].pos.toFixed(3)} (M2).</dd></div>
        <div><dt className="wiv-label text-[var(--ink)]">Split</dt><dd className="wiv-caption mt-1">ESA-ADB temporal 50/50; models fit on training data only.</dd></div>
      </dl>
    </div>
  );
}

/* ====================================================================== */
/* 03 · results: structure (BIC glacier + where each K lands)               */
/* ====================================================================== */
function Structure({ d }: P) {
  const { m } = useSite();
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
      <Glacier d={d} m={m} />
      <KRuler d={d} m={m} />
    </div>
  );
}

function KRuler({ d, m }: { d: SiteData; m: M }) {
  const [ref, W] = useWidth<HTMLDivElement>(360);
  const M_ = d.missions[m];
  const marks = d.rows.filter((r) => r.mission === +m && r.latentK !== null).map((r) => ({ name: short(r.method), k: r.latentK!, bic: r.method === "GMM" }))
    .sort((a, b) => a.k - b.k);
  const L = 70, R = 22, T = 30, RH = 22, H = T + marks.length * RH + 8;
  const X = (k: number) => L + (k / 31) * (W - L - R);
  return (
    <figure ref={ref} className="m-0 grid content-start gap-2">
      <p className="wiv-label text-[var(--ink)]">Where each K lands · M{m}</p>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block h-auto w-full" role="img"
        aria-label={`K per method on Mission ${m}: ${marks.map((x) => `${x.name} ${x.k}`).join(", ")}. Subsystems ${M_.subsystems}, groups ${M_.groups}.`}>
        {[0, 10, 20, 30].map((k) => <text key={k} x={X(k)} y={11} textAnchor="middle" fontSize="10.5" fill={GLACIER} style={MONO}>{k}</text>)}
        <line x1={X(0)} x2={X(31)} y1={17} y2={17} stroke={RIME} />
        <line x1={X(M_.subsystems)} x2={X(M_.subsystems)} y1={17} y2={H} stroke={GLACIER} strokeDasharray="3 3" />
        <line x1={X(M_.groups)} x2={X(M_.groups)} y1={17} y2={H} stroke={INK} />
        {marks.map((x, i) => {
          const y = T + i * RH + 12;
          return (
            <g key={x.name}>
              <text x={0} y={y + 3.5} fontSize="10.5" fill={INK} style={MONO}>{x.name}</text>
              <line x1={X(0)} x2={X(x.k)} y1={y} y2={y} stroke={RIME} />
              <rect x={X(x.k) - 4} y={y - 4} width="8" height="8" fill={x.bic ? INK : "#fff"} stroke={INK} />
              <text x={X(x.k) + 8} y={y + 3.5} fontSize="10.5" fill={GLACIER} style={MONO}>{x.k}</text>
            </g>
          );
        })}
      </svg>
      <figcaption className="wiv-caption">■ GMM BIC K* · □ VAE latent K. Lines: <S>{M_.subsystems} subsystems</S>, <G>{M_.groups} groups</G>.</figcaption>
    </figure>
  );
}

function Glacier({ d, m }: { d: SiteData; m: M }) {
  const sw = d.bic[m], M_ = d.missions[m];
  const [k, setK] = useState(M_.k);
  useEffect(() => setK(d.missions[m].k), [m, d]);
  const [wref, W] = useWidth<HTMLDivElement>(560);
  const H = W < 520 ? 230 : 270, L = 16, R = 16, T = 40, B = 34;
  const ks = sw.map((p) => p.k), bs = sw.map((p) => p.bic);
  const k0 = Math.min(...ks), k1 = Math.max(...ks), b0 = Math.min(...bs), b1 = Math.max(...bs);
  const X = (x: number) => q(L + ((x - k0) / (k1 - k0)) * (W - L - R));
  const Y = (b: number) => q(T + 14 + (1 - (b - b0) / (b1 - b0)) * (H - T - B - 14));
  const surf = sw.map((p) => `${X(p.k)},${Y(p.bic)}`).join(" L");
  const ice = `M${X(k0)},${H - B} L${surf} L${X(k1)},${H - B} Z`;
  const cur = sw.find((p) => p.k === k) ?? sw[0], best = sw.find((p) => p.k === M_.k)!;
  const dB = cur.bic - best.bic;
  const zone = k < M_.subsystems ? "below subsystem scale" : k <= M_.subsystems + 1 ? "subsystem scale" : k < M_.groups - 3 ? "between the two" : k <= M_.groups + 3 ? "group scale" : "past the group count";
  const cid = `wiv-ice-${m}`;
  const narrow = W < 520;
  return (
    <figure className="m-0 grid content-start gap-3">
      <div ref={wref}>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block h-auto w-full border border-[var(--rime)] bg-[linear-gradient(#ffffff,#f4f6f8)]" role="group"
          aria-label={`BIC against K for Mission ${m}, K ${k0} to ${k1}. The minimum is K* = ${M_.k}. Subsystems ${M_.subsystems}, groups ${M_.groups}.`}>
          <defs><clipPath id={cid}><path d={ice} /></clipPath></defs>
          <path d={ice} fill="#eef2f6" />
          <g clipPath={`url(#${cid})`} fill="none" stroke="#ffffff" strokeWidth="1.2">
            {[9, 18, 30, 46, 66].map((o) => <path key={o} d={`M${sw.map((p) => `${X(p.k)},${Y(p.bic) + o}`).join(" L")}`} strokeDasharray={o > 20 ? "3 4" : undefined} />)}
          </g>
          <path className="wiv-draw" pathLength={1} d={`M${surf}`} fill="none" stroke={INK} strokeWidth="1.4" />
          <line x1={L} x2={W - R} y1={H - B + 0.5} y2={H - B + 0.5} stroke={GLACIER} />
          <line x1={X(M_.subsystems)} x2={X(M_.subsystems)} y1={T - 18} y2={H - B} stroke={GLACIER} strokeDasharray="3 3" />
          <text x={X(M_.subsystems) + 5} y={T - 8} fontSize="10.5" fill={GLACIER} style={MONO}>{M_.subsystems} {narrow ? "SUBS." : "SUBSYSTEMS"}</text>
          <line x1={X(Math.min(M_.groups, k1))} x2={X(Math.min(M_.groups, k1))} y1={T - 18} y2={H - B} stroke={INK} />
          <text x={X(Math.min(M_.groups, k1)) - 5} y={T - 8} textAnchor="end" fontSize="10.5" fill={INK} style={MONO}>{M_.groups} {narrow ? "GR." : "GROUPS"}</text>
          {(() => { const fx = X(M_.k), left = M_.k > k1 - 6, fy = T + 4; return (<>
            <line x1={fx} x2={fx} y1={fy} y2={Y(best.bic)} stroke={INK} />
            <path d={`M${fx},${fy} l${left ? -14 : 14},5 l${left ? 14 : -14},5 Z`} fill={INK} />
            <text x={fx + (left ? -18 : 18)} y={fy + 9} textAnchor={left ? "end" : "start"} fontSize="10.5" fill={INK} style={MONO}>K* = {M_.k}{narrow ? "" : " · BIC MIN."}</text>
          </>); })()}
          {sw.map((p) => (
            <g key={p.k}>
              <rect x={X(p.k) - (W - L - R) / (k1 - k0) / 2} y={T - 20} width={(W - L - R) / (k1 - k0)} height={H - T + 20} fill="transparent" className="cursor-pointer" onClick={() => setK(p.k)} />
              <rect x={X(p.k) - (p.k === k ? 4.5 : 2)} y={Y(p.bic) - (p.k === k ? 4.5 : 2)} width={p.k === k ? 9 : 4} height={p.k === k ? 9 : 4} fill={p.k === k ? "#fff" : INK} stroke={INK} pointerEvents="none" />
              {((narrow ? p.k % 5 === 0 && Math.abs(p.k - M_.k) > 1 : p.k % 4 === 0 && Math.abs(p.k - M_.k) > 1) || p.k === M_.k) && <text x={X(p.k)} y={H - B + 18} textAnchor="middle" fontSize="10.5" fill={p.k === M_.k ? INK : GLACIER} style={MONO} pointerEvents="none">{p.k}</text>}
            </g>
          ))}
          <line x1={X(k)} x2={X(k)} y1={T - 18} y2={H - B} stroke={INK} strokeWidth=".8" pointerEvents="none" />
        </svg>
      </div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <label className="grid gap-1">
          <span className="wiv-label text-[var(--ink)]">Components · K = {k}</span>
          <input type="range" className="wiv-range" min={k0} max={k1} value={k} onChange={(e) => setK(+e.target.value)}
            aria-valuetext={`K ${k}, ${dB === 0 ? "the BIC minimum" : `BIC ${(dB / 1e6).toFixed(2)} million above the minimum`}, ${zone}`} />
        </label>
        <dl className="grid grid-cols-2 border border-[var(--rime)] bg-white" aria-live="polite">
          <div className="px-3 py-1.5"><dt className="wiv-label">BIC vs K*</dt><dd className="wiv-tick text-[13px]">{dB === 0 ? "minimum" : `+${(dB / 1e6).toFixed(2)}M`}</dd></div>
          <div className="border-l border-[var(--rime)] px-3 py-1.5"><dt className="wiv-label">K = {k} is</dt><dd className="text-[13px]">{zone}</dd></div>
        </dl>
      </div>
      <figcaption className="wiv-caption">Full-covariance GMM on PCA-30; lower BIC is better. Notebook sweep K = {k0}–{k1}.</figcaption>
    </figure>
  );
}

/* ====================================================================== */
/* 03 · results: Table 1 live, with provenance and a method detail          */
/* ====================================================================== */
type Key = "label" | "prAuc" | "rocAuc" | "eventF1";
export const PROV: Record<string, { w: string; i: string; note: (r: Row) => string }> = {
  exact: { w: "Verified", i: "✓", note: () => "Matches the executed notebook output." },
  near: { w: "Near", i: "≈", note: (r) => r.verify.detail ?? "Within rounding of the notebook." },
  mixed: { w: "Recomputed", i: "↻", note: (r) => r.verify.detail ?? "Table 1 combines two notebook runs." },
  "not found": { w: "Not saved", i: "○", note: () => "The report's run isn't saved, so it can't be re-checked." },
};
const prov = (r: Row) => PROV[r.verify.status] ?? PROV["not found"];
function Compare({ d }: P) {
  const { m } = useSite();
  const avail: string[] = useMemo(() => [...new Set<string>(d.rows.filter((r) => r.mission === +m).map((r) => r.family))], [d, m]);
  const [fams, setFams] = useState<string[]>(["baseline", "parametric", "generative"]);
  const [key, setKey] = useState<Key>("prAuc");
  const [dir, setDir] = useState<1 | -1>(-1);
  const topRow = (mm: M) => d.rows.filter((r) => r.mission === +mm).reduce((a, b) => (b.prAuc > a.prAuc ? b : a));
  const [sel, setSel] = useState(topRow(m).id);
  useEffect(() => { setSel(topRow(m).id); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [m]);
  const top = topRow(m).prAuc;
  const rows = useMemo(() => d.rows.filter((r) => r.mission === +m && fams.includes(r.family)).sort((a, b) => {
    const av = a[key], bv = b[key];
    if (av === null) return 1; if (bv === null) return -1;
    return (typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number)) * dir;
  }), [d, m, fams, key, dir]);
  const r = d.rows.find((x) => x.id === sel && x.mission === +m) ?? topRow(m);
  const th = (k: Key, label: string, right = false, wide = false) => (
    <th scope="col" aria-sort={key === k ? (dir === 1 ? "ascending" : "descending") : "none"} className={`py-0 font-normal ${right ? "text-right" : "text-left"} ${wide ? "max-sm:hidden" : ""}`}>
      <button type="button" className={`wiv-sort ${right ? "flex-row-reverse" : ""}`}
        onClick={() => { if (key === k) setDir(dir === 1 ? -1 : 1); else { setKey(k); setDir(k === "label" ? 1 : -1); } }}>
        {label}<span aria-hidden="true" className={key === k ? "" : "opacity-50"}>{key === k ? (dir === 1 ? "↑" : "↓") : "↕"}</span>
      </button>
    </th>
  );
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
      <div className="grid min-w-0 content-start gap-3">
        <div role="group" aria-label="Method family" className="flex flex-wrap gap-1.5">
          {(["baseline", "parametric", "generative"] as const).map((f) => {
            const on = fams.includes(f), none = !avail.includes(f);
            return (
              <button key={f} type="button" className="wiv-chip" aria-pressed={on && !none} disabled={none || (on && fams.filter((x) => avail.includes(x)).length === 1)}
                title={none ? "Baselines were run on Mission 1 only" : undefined}
                onClick={() => setFams(on ? fams.filter((x) => x !== f) : [...fams, f])}>
                <span className="wiv-chipMark" aria-hidden="true">{on && !none && <Icon n="check" size={10} />}</span>{fam[f]}{none ? " · M1 only" : ""}
              </button>
            );
          })}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11.5px] sm:min-w-[460px]">
            <caption className="sr-only">Table 1, Mission {m}. Sort with the column buttons; choose a row to see its detail.</caption>
            <thead><tr className="border-b border-[var(--ink)]">{th("label", "Method")}{th("prAuc", "PR-AUC", true)}{th("rocAuc", "ROC", true, true)}{th("eventF1", "Ev. F1", true, true)}<th scope="col" className="wiv-label px-1.5 text-left font-normal text-[var(--ink)]">Source</th></tr></thead>
            <tbody>
              {rows.map((x: Row) => {
                const pv = prov(x);
                return (
                  <tr key={x.id} className="wiv-tr" data-sel={x.id === r.id} onClick={() => setSel(x.id)}>
                    <td className="py-0 pr-1">
                      <button type="button" className="flex min-h-[32px] w-full items-center gap-2 pl-2.5 text-left" aria-pressed={x.id === r.id} onClick={(e) => { e.stopPropagation(); setSel(x.id); }}>
                        <span className="min-w-0 sm:truncate">{x.label.replace(/ \(M\d,?\s?/, " (").replace(" ()", "").replace("()", "")}</span>
                        {x.prAuc === top && <span className="wiv-label shrink-0 text-[var(--ink)]">● Top</span>}
                      </button>
                    </td>
                    <td className={`wiv-tick px-1.5 text-right ${x.bold ? "font-medium" : ""}`}>{x.prAuc.toFixed(3)}</td>
                    <td className={`wiv-tick px-1.5 text-right max-sm:hidden ${x.bold ? "font-medium" : ""}`}>{x.rocAuc.toFixed(3)}</td>
                    <td className="wiv-tick px-1.5 text-right max-sm:hidden">{x.eventF1?.toFixed(3) ?? "—"}</td>
                    <td className="whitespace-nowrap px-1.5 text-[11px]"><span aria-hidden="true">{pv.i}</span> {pv.w}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="wiv-caption">● Top = highest PR-AUC. Medium weight = bold in the paper. — = not computed.</p>
      </div>
      <MethodDetail d={d} r={r} isTop={r.prAuc === top} />
    </div>
  );
}
function MethodDetail({ d, r, isTop }: { d: SiteData; r: Row; isTop: boolean }) {
  const { openPaper, go } = useSite();
  const chance = d.pr[String(r.mission) as M].pos;
  const bar = (v: number) => `${Math.min(100, (v / 0.5) * 100)}%`;
  const pv = prov(r);
  const hasCurve = d.pr[String(r.mission) as M].curves.some((c) => c.method.startsWith(r.method));
  return (
    <article className="wiv-card relative self-start" data-sel="true" aria-live="polite" aria-label={`Detail: ${r.label}`}>
      <span className="wiv-corners" aria-hidden="true"><i /><i /><i /><i /></span>
      <span className="wiv-label">{fam[r.family]} · M{r.mission} · {r.scoring}</span>
      <h3 className="wiv-title mt-1"><Scramble text={r.label} ms={500} /></h3>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {isTop && <StatusTag s="best" label={`Top PR-AUC · M${r.mission}`} solid />}
        {r.bold && <span className="wiv-badge">Best VAE · bold in paper</span>}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-2">
        <div><dt className="wiv-label">PR-AUC</dt><dd className="wiv-num text-[22px] leading-tight">{r.prAuc.toFixed(3)}</dd></div>
        <div><dt className="wiv-label">ROC-AUC</dt><dd className="wiv-num text-[22px] leading-tight">{r.rocAuc.toFixed(3)}</dd></div>
      </dl>
      <div className="mt-4 grid gap-1.5">
        <div className="relative h-[8px] bg-[var(--bg)]" aria-hidden="true">
          <span className="absolute inset-y-0 left-0 bg-[var(--ink)] transition-[width] duration-500" style={{ width: bar(r.prAuc) }} />
          <span className="absolute -inset-y-1 w-px bg-[var(--muted)]" style={{ left: bar(chance) }} />
          <span className="absolute -inset-y-1 w-0 border-l border-dashed border-[var(--ink)]" style={{ left: bar(d.plateau) }} />
        </div>
        <p className="wiv-caption">{(r.prAuc / chance).toFixed(1)}× chance ({chance.toFixed(3)}) · {r.prAuc >= d.plateau ? "+" : "−"}{Math.abs(r.prAuc - d.plateau).toFixed(3)} vs the {d.plateau} plateau</p>
      </div>
      <p className="wiv-caption mt-3 border-t border-[var(--rime)] pt-3"><span className="text-[var(--ink)]">{pv.i} {pv.w}.</span> {pv.note(r)}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <button type="button" className="wiv-pchip" onClick={() => openPaper(5)} aria-label="Open Table 1 in the paper, page 5">p.5<Icon n="arrow" size={11} /></button>
        {hasCurve && <button type="button" className="wiv-btn min-h-[34px] px-3" onClick={() => go("threshold")}>Its PR curve<Icon n="arrow" size={12} /></button>}
      </div>
    </article>
  );
}

/* ====================================================================== */
/* 03 · results: why global detectors fail (the longest Mission 1 fault)    */
/* ====================================================================== */
function Failure({ d }: P) {
  const reduced = useReduced();
  const Lg = d.longest, S_ = Lg.strips, n = S_[0].v.length;
  const [f, setF] = useState(Math.round(n * (Lg.a + 0.04)));
  const [play, setPlay] = useState(false);
  useEffect(() => {
    if (!play) return;
    const id = window.setInterval(() => setF((x) => { if (x >= n - 1) { setPlay(false); return x; } return x + 1; }), reduced ? 120 : 30);
    return () => window.clearInterval(id);
  }, [play, n, reduced]);
  const [wref, W] = useWidth<HTMLDivElement>(900);
  const SH = W < 560 ? 58 : 66;
  const a = Lg.a * W, b = Lg.b * W;
  const frac = (f + 0.5) / n;
  const step = Lg.winStart + Math.round(frac * Lg.winLen);
  const segA = Lg.winStart + Math.round(Lg.a * Lg.winLen);
  const hrs = ((step - segA) * 30) / 3600;
  const inside = frac >= Lg.a && frac <= Lg.b;
  const km = S_[0], gm = S_[1];
  const i0 = Math.ceil(Lg.a * n), i1 = Math.floor(Lg.b * n);
  const thrL = gm.threshold ? Math.log10(gm.threshold) : 0;
  const above = gm.v.slice(i0, i1).filter((x) => x[0] > thrL).length / Math.max(1, i1 - i0);
  const big = (x: number) => (x >= 1e4 ? `${fmt(Math.round(x / 1000))}K` : x >= 100 ? fmt(Math.round(x)) : x.toFixed(1));
  const ticks = (W < 560 ? [0, 400, 800] : [-200, 0, 200, 400, 600, 800, 1000]).map((hh) => ({ hh, x: ((segA + (hh * 3600) / 30 - Lg.winStart) / Lg.winLen) * W })).filter((t) => t.x > 4 && t.x < W - 4);
  const note = (s: typeof km, i: number) => i === 1 && s.threshold ? `above its alarm line ${Math.round(above * 100)}% of the fault` : `peak ×${big(s.peak / s.nominal)} · last third ×${(s.late / s.nominal).toFixed(1)}`;
  return (
    <figure className="m-0 grid gap-4">
      <div ref={wref} className="relative grid gap-2">
        <span className="wiv-hud block">▲ Labelled fault · {fmt(Lg.timesteps)} steps · ≈{Lg.hours} h · from {Lg.start}</span>
        {S_.map((s, si) => {
          const Y = (v: number) => q(4 + (1 - (v - s.lo) / (s.hi - s.lo || 1)) * (SH - 8));
          const med = "M" + s.v.map((p, i) => `${q((i / (n - 1)) * W)},${Y(p[0])}`).join("L");
          const mx = "M" + s.v.map((p, i) => `${q((i / (n - 1)) * W)},${Y(p[1])}`).join("L");
          const nowV = Math.pow(10, s.v[f][0]);
          return (
            <div key={s.method}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <span className="wiv-label text-[var(--ink)]">{s.method} · {s.scoring}</span>
                <span className="wiv-hud wiv-tick text-[var(--muted)]">{note(s, si)} · <span className="text-[var(--ink)]">now ×{big(nowV / s.nominal)}</span></span>
              </div>
              <svg viewBox={`0 0 ${W} ${SH}`} width={W} height={SH} className="block h-auto w-full border border-[var(--rime)] bg-white" aria-hidden="true">
                <rect x={a} width={b - a} y={0} height={SH} fill={INK} opacity=".06" />
                <rect x={a} width={b - a} y={0} height={2} fill={INK} />
                <line x1={0} x2={W} y1={Y(Math.log10(s.nominal))} y2={Y(Math.log10(s.nominal))} stroke={GLACIER} strokeDasharray="1.5 3" />
                {s.threshold && <line x1={0} x2={W} y1={Y(Math.log10(s.threshold))} y2={Y(Math.log10(s.threshold))} stroke={INK} strokeDasharray="6 3" />}
                <path d={mx} fill="none" stroke={GLACIER} strokeWidth=".7" opacity=".55" />
                <path className="wiv-draw" pathLength={1} d={med} fill="none" stroke={INK} strokeWidth="1.2" />
                <line x1={frac * W} x2={frac * W} y1={0} y2={SH} stroke={INK} strokeWidth="1.2" />
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
          aria-label="Scrub through the fault" aria-valuetext={`${inside ? `${Math.round(hrs)} hours into the fault` : hrs < 0 ? `${Math.round(-hrs)} hours before onset` : "after the fault"}. K-Means ×${(Math.pow(10, km.v[f][0]) / km.nominal).toFixed(1)} of nominal, GMM ${Math.pow(10, gm.v[f][0]) > (gm.threshold ?? 0) ? "above" : "below"} its alarm line.`} />
        {inside ? <StatusTag s="anomaly" label={`In fault · ${Math.round(hrs)} h`} solid /> : <StatusTag s="nominal" label={hrs < 0 ? `${Math.round(-hrs)} h before` : "After fault"} />}
      </div>
      <figcaption className="wiv-caption">Saved scores, log scale. Paper Fig. 3 plots K = 2 K-Means, unsaved.</figcaption>
    </figure>
  );
}

/* ====================================================================== */
/* 03 · results: set the alarm (PR curves + live precision / recall)        */
/* ====================================================================== */
function pointAt(c: Curve, pos: number, flag: number) {
  let best = c.pts[0], bd = Infinity;
  for (const p of c.pts) { const f = p[1] > 0 ? (p[0] * pos) / p[1] : 1; const dd = Math.abs(f - flag); if (dd < bd) { bd = dd; best = p; } }
  return best;
}
function Threshold({ d }: P) {
  const { m } = useSite();
  const P_ = d.pr[m];
  const [ci, setCi] = useState(0);
  useEffect(() => setCi(Math.max(0, d.pr[m].curves.findIndex((x) => x.method.startsWith("GMM")))), [m, d]);
  const c = P_.curves[Math.min(ci, P_.curves.length - 1)];
  const [flag, setFlag] = useState(0.11);
  const [rr, pp] = pointAt(c, P_.pos, flag);
  const f1 = rr + pp > 0 ? (2 * rr * pp) / (rr + pp) : 0;
  const flagged = Math.round(flag * P_.n), tp = Math.round(rr * P_.pos * P_.n), fp = Math.max(0, flagged - tp);
  const [wref, W] = useWidth<HTMLDivElement>(520);
  const H = Math.round(Math.min(320, Math.max(220, W * 0.6))), L = 40, B = 30, T = 12, R = 12;
  const X = (r: number) => L + r * (W - L - R), Y = (p: number) => T + (1 - Math.min(1, p)) * (H - T - B);
  const bestF1 = () => { let b = c.pts[0], bf = 0; for (const qq of c.pts) { const f = qq[0] + qq[1] ? (2 * qq[0] * qq[1]) / (qq[0] + qq[1]) : 0; if (f > bf) { bf = f; b = qq; } } setFlag(Math.min(0.6, Math.max(0.005, (b[0] * P_.pos) / b[1]))); };
  const tag = (x: Curve) => (x.match === "exact" ? "= Table 1" : x.match === "partial" ? "Table 1 run, recomputed" : "saved run");
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <figure ref={wref} className="m-0 grid min-w-0 content-start gap-2">
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block h-auto w-full border border-[var(--rime)] bg-white" role="img"
          aria-label={`Precision-recall curves, Mission ${m}. Selected ${c.method}: precision ${pp.toFixed(2)}, recall ${rr.toFixed(2)}.`}>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <g key={t}>
              <line x1={X(t)} x2={X(t)} y1={T} y2={H - B} stroke="#e3e8ee" />
              <line x1={L} x2={W - R} y1={Y(t)} y2={Y(t)} stroke="#e3e8ee" />
              <text x={X(t)} y={H - B + 16} textAnchor="middle" fontSize="10.5" fill={GLACIER} style={MONO}>{t}</text>
              <text x={L - 6} y={Y(t) + 3} textAnchor="end" fontSize="10.5" fill={GLACIER} style={MONO}>{t}</text>
            </g>
          ))}
          <line x1={L} x2={W - R} y1={Y(P_.pos)} y2={Y(P_.pos)} stroke={GLACIER} strokeDasharray="2 3" />
          <text x={W - R - 4} y={Y(P_.pos) - 5} textAnchor="end" fontSize="10.5" fill={GLACIER} style={MONO}>CHANCE {P_.pos.toFixed(3)}</text>
          {P_.curves.map((x, i) => i !== ci && <path key={x.id + x.method} d={"M" + x.pts.map(([r, p]) => `${X(r).toFixed(1)},${Y(p).toFixed(1)}`).join("L")} fill="none" stroke={GLACIER} strokeOpacity=".55" strokeWidth="1" strokeDasharray={DASH[i % DASH.length]} />)}
          <path className="wiv-draw" pathLength={1} key={c.id + m} d={"M" + c.pts.map(([r, p]) => `${X(r).toFixed(1)},${Y(p).toFixed(1)}`).join("L")} fill="none" stroke={INK} strokeWidth="1.8" />
          <line x1={X(rr)} x2={X(rr)} y1={Y(pp)} y2={H - B} stroke={INK} strokeDasharray="2 2" />
          <line x1={L} x2={X(rr)} y1={Y(pp)} y2={Y(pp)} stroke={INK} strokeDasharray="2 2" />
          <rect x={X(rr) - 5} y={Y(pp) - 5} width="10" height="10" fill="#fff" stroke={INK} strokeWidth="1.5" />
          <text x={L} y={H - 4} fontSize="10.5" fill={GLACIER} style={MONO}>RECALL →</text>
          <text x={W - R - 4} y={T + 11} textAnchor="end" fontSize="10.5" fill={GLACIER} style={MONO}>PRECISION ↑</text>
        </svg>
        <figcaption className="wiv-caption">Recomputed from saved scores; only &ldquo;= Table 1&rdquo; runs match Table 1.</figcaption>
      </figure>
      <div className="grid min-w-0 content-start gap-4">
        <label className="grid gap-1.5"><span className="wiv-label text-[var(--ink)]">Score curve · M{m}</span>
          <select className="wiv-select" value={ci} onChange={(e) => setCi(+e.target.value)}>
            {P_.curves.map((x, i) => <option key={x.id + x.method} value={i}>{x.method} · {x.prAuc.toFixed(3)} · {tag(x)}</option>)}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="flex items-baseline justify-between gap-3"><span className="wiv-label text-[var(--ink)]">Alarm on the top {(flag * 100).toFixed(1)}%</span><span className="wiv-caption">{fmt(flagged)} steps</span></span>
          <input type="range" className="wiv-range" min={0.5} max={60} step={0.5} value={+(flag * 100).toFixed(1)} onChange={(e) => setFlag(+e.target.value / 100)}
            aria-valuetext={`Top ${(flag * 100).toFixed(1)} percent flagged, precision ${pp.toFixed(2)}, recall ${rr.toFixed(2)}`} />
        </label>
        <dl className="grid grid-cols-3 border border-[var(--rime)] bg-white">
          {([["Precision", pp], ["Recall", rr], ["F1", f1]] as const).map(([k, v], i) => (
            <div key={k} className={`px-3 py-2 ${i ? "border-l border-[var(--rime)]" : ""}`}><dt className="wiv-label">{k}</dt><dd className="wiv-num wiv-tick text-[18px] leading-tight">{v.toFixed(3)}</dd></div>
          ))}
        </dl>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="wiv-btn" onClick={bestF1}>Snap to best F1</button>
          <p className="wiv-caption flex-1" aria-live="polite">{fmt(tp)} true, {fmt(fp)} false alarms.</p>
        </div>
      </div>
    </div>
  );
}

/* ====================================================================== */
/* 04 · conclusions (paper §6–7)                                            */
/* ====================================================================== */
function Conclusions({ d }: P) {
  const gmm1 = d.rows.find((r) => r.method === "GMM" && r.mission === 1)!;
  const tv2 = d.rows.find((r) => r.method === "TransformerVAE" && r.mission === 2)!;
  const items: { k: string; t: React.ReactNode; s: string }[] = [
    { k: "Q1", t: <>Yes, at <G>operational-group</G> level: 18–29 modes, <S>not 4–5</S>.</>, s: "Every complexity selector converged, on both missions." },
    { k: "Q2", t: <>Richer models help: {gmm1.prAuc.toFixed(3)} (GMM, M1), {tv2.prAuc.toFixed(3)} (TVAE, M2).</>, s: `Against the ${d.plateau} linear plateau.` },
    { k: "Why", t: <>Each mode has its own normal; anomalies scatter across all modes.</>, s: "Static global models can't capture it." },
    { k: "Next", t: <>Temporal models (LSTM-VAE, HMM) and cross-mission tests.</>, s: "Three subsystems are shared across both missions." },
  ];
  return (
    <ol className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
      {items.map((it) => (
        <li key={it.k} className="grid grid-cols-[64px_minmax(0,1fr)] items-baseline gap-3 border-t border-[var(--ink)] pt-3">
          <span className="wiv-num text-[18px]">{it.k}</span>
          <span><span className="wiv-lead block">{it.t}</span><span className="wiv-caption mt-1 block">{it.s}</span></span>
        </li>
      ))}
    </ol>
  );
}

/* ====================================================================== */
/* 05 · the paper                                                           */
/* ====================================================================== */
export const PAGE_CAPTIONS = [
  "Title, abstract, introduction", "Dataset and problem setup", "Baselines · GMM · Fig. 1 PR curve", "The three VAEs",
  "Table 1 · results · conclusions", "References", "Fig. 2–3 · timeline failure modes", "Fig. 4 · t-SNE of the test data",
  "Fig. 5 · KPCA sweep and PR curves", "Fig. 6 · PCA analysis and PR curves", "Fig. 7 · TransformerVAE latent maps",
];
const EVIDENCE: [string, number[]][] = [["Table 1 · every method", [5]], ["Timeline failure · Fig. 3", [7]], ["PR curves · Fig. 1, 5", [3, 9]], ["Latent maps · Fig. 7", [11]]];
function PaperPlace() {
  const { openPaper } = useSite();
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <ol className="grid grid-cols-3 gap-x-3 gap-y-5 min-[480px]:grid-cols-4 sm:grid-cols-6" aria-label="Pages">
        {PAGE_CAPTIONS.map((cap, i) => (
          <li key={i}>
            <button type="button" className="wiv-thumb relative w-full" onClick={() => openPaper(i + 1)} aria-label={`Open page ${i + 1}: ${cap}`} title={cap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/paper/pages/thumb-${pad(i + 1)}.jpg`} alt="" width={320} height={415} decoding="async" loading="lazy" draggable={false} />
            </button>
            <span className="wiv-label mt-1.5 block tabular-nums">p.{pad(i + 1)}</span>
          </li>
        ))}
      </ol>
      <div className="grid content-start gap-5">
        <div>
          <p className="wiv-title"><i>Uncovering Latent Structure in ESA Satellite Telemetry</i></p>
          <p className="wiv-caption mt-1">Rhea Madhogarhia &amp; Hewitt Watkins · TTIC 31220 · Spring 2026 · 11 pages</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="wiv-btn" onClick={() => openPaper(1)}><Icon n="atlas" size={13} />Open the reader</button>
          <a className="wiv-btn" href={PDF} download><Icon n="down" size={12} />Download PDF</a>
        </div>
        <div>
          <p className="wiv-label text-[var(--ink)]">Pages that back a finding</p>
          <ul className="mt-1 border-t border-[var(--ink)]">
            {EVIDENCE.map(([t, ps]) => (
              <li key={t} className="flex items-center justify-between gap-3 border-b border-[var(--rime)] py-1.5">
                <span className="text-[12px]">{t}</span>
                <span className="flex gap-1">{ps.map((n) => <button key={n} type="button" className="wiv-pchip" onClick={() => openPaper(n)} aria-label={`Open page ${n}`}>p.{n}<Icon n="arrow" size={11} /></button>)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ====================================================================== */
/* about: authorship + citation                                             */
/* ====================================================================== */
function About() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="grid content-start gap-4">
        <p className="wiv-lead max-w-[44ch]">This site is Hewitt&apos;s project: the design, the code, and every figure, redrawn from the paper&apos;s saved results.</p>
        <Link className="wiv-link wiv-textBtn w-fit" href="/">← Back to the hub</Link>
      </div>
      <dl className="grid content-start gap-4 text-[12.5px] leading-[1.6]">
        <div className="border-t border-[var(--ink)] pt-2"><dt className="wiv-label">The paper</dt>
          <dd>Rhea Madhogarhia &amp; Hewitt Watkins. <i>Uncovering Latent Structure in ESA Satellite Telemetry.</i> TTIC 31220, Unsupervised Learning and Data Analysis, Spring 2026.</dd></div>
        <div className="border-t border-[var(--rime)] pt-2"><dt className="wiv-label">Who did what</dt>
          <dd></dd></div>
        <div className="border-t border-[var(--rime)] pt-2"><dt className="wiv-label">Data</dt>
          <dd>ESA Anomaly Dataset (Kotowski et al., 2024), Missions 1 and 2. Numbers are Table 1 as printed.</dd></div>
      </dl>
    </div>
  );
}
