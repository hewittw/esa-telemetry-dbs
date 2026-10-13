"use client";
// ✦ Agent-generated artifacts. Each renders at its world size and animates only while active
// (selected / toured), so the field stays still and silent until you look at something.
import { useEffect, useRef, useState } from "react";
import type { GenKey } from "./board-data";
import { PALETTE, contrast } from "./board-data";
import type { BoardData } from "./load-data";
import s from "./cls";

type P = { active: boolean; reduced: boolean; data: BoardData; w: number; h: number };

const INK = "#111824";
const MUTED = "#56616F";
const RIME = "#D5DCE4";
const GLYPHS = "▖▗▘▙▚▛▜▝▞▟░▒/\\<>=+-01";

export function useScramble(text: string, run: boolean, reduced: boolean, ms = 650) {
  const [out, setOut] = useState(text);
  useEffect(() => {
    if (!run || reduced) { setOut(text); return; }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      const fixed = Math.floor(p * text.length);
      setOut(
        text.split("").map((ch, i) =>
          i < fixed || ch === " " || ch === "·" ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0],
        ).join(""),
      );
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, run, reduced, ms]);
  return out;
}

function Caption({ left, right, w, h }: { left: string; right?: string; w: number; h: number }) {
  return (
    <g>
      <text x={18} y={h - 14} className={s.svgLabel}>{left}</text>
      {right && <text x={w - 18} y={h - 14} textAnchor="end" className={s.svgLabel}>{right}</text>}
    </g>
  );
}

/* ---------- data: ridges ---------- */
function Ridges({ active, data, w, h }: P) {
  const n = data.ridges.length;
  const top = 34, gap = (h - 70) / n, amp = 58, x0 = 128;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`h-full w-full ${active ? s.draw : ""}`} role="img"
      aria-label="Six anomaly-score timelines drawn as stacked ridgelines, with labelled anomaly spans marked as dark ticks.">
      {data.ridges.map((r, ri) => {
        const base = top + gap * (ri + 1) + 6;
        const pts = r.v.map((v, i) => [x0 + (i / (r.v.length - 1)) * (w - x0 - 18), base - v * amp] as const);
        const d = "M" + pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("L");
        return (
          <g key={r.label}>
            <path d={`${d}L${w - 18},${base + 4}L${x0},${base + 4}Z`} fill="#fff" />
            <path d={d} fill="none" stroke={INK} strokeWidth={0.9} pathLength={1} className={s.line} />
            {pts.map((p, i) => r.a[i] ? <line key={i} x1={p[0]} x2={p[0]} y1={base + 1} y2={base + 6} stroke={INK} strokeWidth={1.4} /> : null)}
            <text x={18} y={base} className={s.svgTiny}>{r.label.replace("HierarchicalVAE", "HVAE").replace("TransformerVAE", "TVAE")}</text>
          </g>
        );
      })}
      <text x={18} y={20} className={s.svgLabel}>median score · 1,500 bins · ▮ anomaly</text>
    </svg>
  );
}

/* ---------- data: GMM facets ---------- */
function Facets({ active, data, w, h }: P) {
  const cx = w / 2, cy = h / 2 - 8, R = Math.min(w, h) * 0.4;
  const total = data.facets.reduce((a, f) => a + f.w, 0);
  const maxRate = Math.max(...data.facets.map((f) => f.rate));
  let a0 = -Math.PI / 2;
  const P2 = (a: number, r: number) => `${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`h-full w-full ${active ? s.spinIn : ""}`} role="img"
      aria-label={`Crystal of ${data.gmmK} facets, one per GMM component; facet angle is the mixture weight and shade is the anomaly rate.`}>
      {data.facets.map((f, i) => {
        const span = (f.w / total) * Math.PI * 2;
        const a1 = a0 + span, am = a0 + span / 2;
        const r = R * (0.62 + 0.38 * (1 - f.rate / maxRate));
        const shade = Math.round(246 - (f.rate / maxRate) * 120);
        const poly = `${cx},${cy} ${P2(a0, r * 0.94)} ${P2(am, r)} ${P2(a1, r * 0.94)}`;
        const lbl = P2(am, r + 14).split(",");
        a0 = a1;
        return (
          <g key={i}>
            <polygon points={poly} fill={`rgb(${shade},${shade + 3},${Math.min(255, shade + 8)})`} stroke={INK} strokeWidth={0.7} strokeLinejoin="round" />
            <text x={lbl[0]} y={lbl[1]} textAnchor="middle" dominantBaseline="middle" className={s.svgTiny}>{i}</text>
          </g>
        );
      })}
      <Caption w={w} h={h} left={`M1 GMM · K=${data.gmmK}`} right={`ARI vs groups ${data.ariGroups}`} />
    </svg>
  );
}

/* ---------- data: channel hierarchy ---------- */
function Hierarchy({ active, data, w, h }: P) {
  const cx = w / 2, cy = h / 2 - 6;
  const nCh = data.hierarchy.reduce((a, s) => a + s.groups.reduce((x, y) => x + y, 0), 0);
  let k = 0;
  const lines: React.ReactNode[] = [];
  const dots: React.ReactNode[] = [];
  data.hierarchy.forEach((sub, si) => {
    const subCh = sub.groups.reduce((x, y) => x + y, 0);
    const sa = ((k + subCh / 2) / nCh) * Math.PI * 2 - Math.PI / 2;
    const sx = cx + Math.cos(sa) * 56, sy = cy + Math.sin(sa) * 56;
    lines.push(<line key={`s${si}`} x1={cx} y1={cy} x2={sx} y2={sy} stroke={INK} strokeWidth={1.2} />);
    dots.push(<rect key={`sd${si}`} x={sx - 4} y={sy - 4} width={8} height={8} fill={INK} transform={`rotate(45 ${sx} ${sy})`} />);
    sub.groups.forEach((g, gi) => {
      const ga = ((k + g / 2) / nCh) * Math.PI * 2 - Math.PI / 2;
      const gx = cx + Math.cos(ga) * 118, gy = cy + Math.sin(ga) * 118;
      lines.push(<line key={`g${si}-${gi}`} x1={sx} y1={sy} x2={gx} y2={gy} stroke={INK} strokeWidth={0.8} />);
      dots.push(<circle key={`gd${si}-${gi}`} cx={gx} cy={gy} r={3.2} fill="#fff" stroke={INK} strokeWidth={1} />);
      for (let c = 0; c < g; c++) {
        const ca = ((k + c + 0.5) / nCh) * Math.PI * 2 - Math.PI / 2;
        const r = 170 + (c % 2) * 6;
        const x = cx + Math.cos(ca) * r, y = cy + Math.sin(ca) * r;
        lines.push(<line key={`c${k + c}`} x1={gx} y1={gy} x2={x} y2={y} stroke={MUTED} strokeWidth={0.45} />);
        dots.push(<circle key={`cd${k + c}`} cx={x} cy={y} r={1.6} fill={INK} />);
      }
      k += g;
    });
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`h-full w-full ${active ? s.spinIn : ""}`} role="img"
      aria-label={`Mission 1 channel hierarchy as a radial crystal: ${data.nChannels} channels, ${data.nGroups} groups, 4 subsystems.`}>
      <g>{lines}</g><g>{dots}</g>
      <Caption w={w} h={h} left={`M1 · ${data.nChannels} ch · ${data.nGroups} groups`} right="4 subsystems" />
    </svg>
  );
}

/* ---------- data: BIC glacier ---------- */
function Bic({ active, data, w, h }: P) {
  const x0 = 28, x1 = w - 28, y0 = 48, y1 = h - 56;
  const kx = (k: number) => x0 + ((k - 2) / 28) * (x1 - x0);
  const path = (pts: { k: number; v: number }[], lift: number) =>
    "M" + pts.map((p) => `${kx(p.k).toFixed(1)},${(y0 + lift + p.v * (y1 - y0 - lift)).toFixed(1)}`).join("L");
  const m1 = path(data.bic.m1, 0), m2 = path(data.bic.m2, 26);
  // BIC is lower = better, so the selected K is the valley floor; draw it inverted (valley at bottom).
  const inv = (d: string) => d;
  const min1 = data.bic.m1.find((p) => p.k === data.bic.k1)!;
  const min2 = data.bic.m2.find((p) => p.k === data.bic.k2)!;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`h-full w-full ${active ? s.draw : ""}`} role="img"
      aria-label={`GMM BIC sweeps for K from 2 to 30. Selected K is ${data.bic.k1} for Mission 1 and ${data.bic.k2} for Mission 2.`}>
      <path d={`${inv(m1)}L${x1},${y0 - 20}L${x0},${y0 - 20}Z`} fill="#E9EDF2" />
      <path d={inv(m1)} fill="none" stroke={INK} strokeWidth={1.2} pathLength={1} className={s.line} />
      <path d={inv(m2)} fill="none" stroke={MUTED} strokeWidth={0.9} strokeDasharray="3 3" />
      {[[data.bic.k1, min1.v, 0, "M1 K=" + data.bic.k1], [data.bic.k2, min2.v, 26, "M2 K=" + data.bic.k2]].map(([k, v, lift, l]) => {
        const x = kx(k as number), y = y0 + (lift as number) + (v as number) * (y1 - y0 - (lift as number));
        return (
          <g key={l as string}>
            <line x1={x} x2={x} y1={y} y2={h - 40} stroke={INK} strokeWidth={0.7} />
            <circle cx={x} cy={y} r={3.5} fill="#fff" stroke={INK} />
            <text x={x} y={h - 28} textAnchor="middle" className={s.svgLabel}>{l as string}</text>
          </g>
        );
      })}
      {[2, 5, 10, 15, 20, 25, 30].map((k) => (
        <text key={k} x={kx(k)} y={y0 - 26} textAnchor="middle" className={s.svgTiny}>{k}</text>
      ))}
      <text x={x0} y={20} className={s.svgLabel}>BIC vs K · solid M1 · dashed M2</text>
      <text x={x0 + 4} y={y1 - 4} className={s.svgTiny}>4–5 subsystems ←</text>
    </svg>
  );
}

/* ---------- type ---------- */
function Display({ active, reduced }: P) {
  const t = useScramble("WHITEOUT", active, reduced, 700);
  return (
    <div className="flex h-full flex-col justify-between p-6">
      <div className="font-[family-name:var(--wi-mono)] text-[11px] font-light uppercase tracking-[0.14em] text-[var(--wi-muted)]">Display · Michroma 400 · +4%</div>
      <div className="font-[family-name:var(--wi-display)] text-[52px] leading-none tracking-[0.04em] text-[var(--wi-ink)]" aria-label="Whiteout">{t}</div>
      <div className="font-[family-name:var(--wi-display)] text-[17px] leading-snug tracking-[0.04em] text-[var(--wi-ink)]">18–29 MODES, NOT 4–5</div>
      <div className="font-[family-name:var(--wi-display)] text-[13px] tracking-[0.06em] text-[var(--wi-muted)]">ABCDEFGHIJKLM 0123456789 · PR-AUC 0.384</div>
    </div>
  );
}

function Mono() {
  return (
    <div className="flex h-full flex-col justify-between p-6 font-[family-name:var(--wi-mono)] text-[var(--wi-ink)]">
      <div className="text-[11px] font-light uppercase tracking-[0.14em] text-[var(--wi-muted)]">HUD · Martian Mono 300 / 400</div>
      <div className="text-[40px] font-extralight leading-none tracking-tight">ch_041</div>
      <div className="space-y-1.5">
        <div className="text-[11px] font-light uppercase tracking-[0.14em]">300 · 11px · MISSION 1 · 76 CH · T+2,521,579</div>
        <div className="text-[13px] font-normal">400 · 13px · GMM (K=21) flags 11.1% of timesteps.</div>
        <div className="text-[14px] font-medium">500 · 14px · Event F1 0.661</div>
      </div>
    </div>
  );
}

/* ---------- color ---------- */
function Palette() {
  const bg = PALETTE[0].hex;
  return (
    <div className="grid h-full grid-cols-3 grid-rows-2 gap-px bg-[var(--wi-rime)]">
      {PALETTE.map((c) => {
        const dark = c.name === "Ink" || c.name === "Glacier";
        const fg = dark ? "#FFFFFF" : "#111824";
        const vsBg = contrast(c.hex, bg);
        return (
          <div key={c.hex} className="flex flex-col justify-between p-3.5 font-[family-name:var(--wi-mono)]" style={{ background: c.hex, color: fg }}>
            <div>
              <div className="text-[13px] font-normal">{c.name}</div>
              <div className="text-[10.5px] font-light uppercase tracking-[0.1em]" style={{ opacity: 0.9 }}>{c.role}</div>
            </div>
            <div className="text-[11px] font-light leading-snug">
              <div>{c.hex}</div>
              <div>{vsBg.toFixed(2)}:1 on Whiteout</div>
              <div>{contrast(c.hex, fg).toFixed(1)}:1 w/ {dark ? "Frost" : "Ink"} text</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- color in use ---------- */
function Signal({ data }: P) {
  // live: how much of the current view the board's one cyan thing (the tour pill) covers
  const [pct, setPct] = useState<number | null>(null);
  useEffect(() => {
    const measure = () => {
      const pill = [...document.querySelectorAll<HTMLElement>("button.wi-pill")].find((el) => !el.closest(".wi-card"));
      if (!pill) { setPct(null); return; }
      const r = pill.getBoundingClientRect();
      setPct((r.width * r.height * 100) / (window.innerWidth * window.innerHeight));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const v = data.ridges[1]?.v ?? [];
  const line = v.map((y, i) => `${((i / (v.length - 1)) * 300).toFixed(1)},${(30 - y * 26).toFixed(1)}`).join(" ");
  const SIG = PALETTE[5].hex;
  const label = "whitespace-nowrap font-[family-name:var(--wi-mono)] text-[10.5px] font-light uppercase tracking-[0.1em] text-[var(--wi-ink)]";
  return (
    <div className="flex h-full flex-col justify-between p-6 font-[family-name:var(--wi-mono)]">
      <div className="flex justify-between text-[11px] font-light uppercase tracking-[0.14em] text-[var(--wi-muted)]">
        <span>Signal in use · one fill per screen</span><span>{SIG}</span>
      </div>
      {/* a slice of the explorer at true size */}
      <div className="relative h-[124px] border border-[var(--wi-rime)] bg-[var(--wi-bg)]" aria-hidden="true">
        <div className="absolute left-3 top-2.5 text-[10.5px] font-light uppercase tracking-[0.1em] text-[var(--wi-muted)]">M1 · GMM · score</div>
        <svg viewBox="0 0 300 32" preserveAspectRatio="none" className="absolute left-3 right-14 top-8 h-[38px] w-[calc(100%-68px)]">
          <polyline points={line} fill="none" stroke={INK} strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="absolute right-3 top-2.5 flex flex-col gap-1.5">
          {["+", "−"].map((g) => (
            <span key={g} className="grid h-8 w-8 place-items-center rounded-full border border-[var(--wi-rime)] bg-white text-[14px] text-[var(--wi-ink)]">{g}</span>
          ))}
        </div>
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2">
          <span className="inline-flex h-8 items-center whitespace-nowrap rounded-full border border-[var(--wi-ink)] px-3 text-[10.5px] uppercase tracking-[0.1em] text-[var(--wi-ink)]">● Free explore</span>
          <span className="inline-flex h-8 items-center whitespace-nowrap rounded-full px-3.5 text-[10.5px] font-medium uppercase tracking-[0.1em] text-[var(--wi-ink)]" style={{ background: SIG }}>▶ Guided tour</span>
        </div>
      </div>
      <div>
        <div className="relative h-1.5 w-full border border-[var(--wi-rime)] bg-white" aria-hidden="true">
          <span className="absolute inset-y-0 left-0" style={{ width: `${Math.max(1.2, pct ?? 1)}%`, background: SIG }} />
        </div>
        <div className="mt-2 flex justify-between text-[11px] font-light text-[var(--wi-ink)]">
          <span>{pct === null ? "≈1% of the view" : `${pct.toFixed(1)}% of this view (live)`}</span>
          <span>Ink on Signal {contrast(INK, SIG).toFixed(2)}:1</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 border-t border-[var(--wi-rime)] pt-3">
        <div className="flex items-center gap-2">
          <span className="block h-3.5 w-3.5 shrink-0" style={{ background: SIG }} aria-hidden="true" />
          <span className={label}>✕ Text {contrast(SIG, PALETTE[0].hex).toFixed(2)}:1</span>
        </div>
        <div className="flex items-center gap-2">
          <svg width="22" height="12" viewBox="0 0 22 12" aria-hidden="true" className="shrink-0"><polyline points="0,10 6,4 11,8 16,2 22,6" fill="none" stroke={SIG} strokeWidth="1.6" /></svg>
          <span className={label}>✕ Chart lines</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex shrink-0 gap-0.5" aria-hidden="true"><i className="block h-2.5 w-3.5 rounded-full" style={{ background: SIG }} /><i className="block h-2.5 w-3.5 rounded-full" style={{ background: SIG }} /></span>
          <span className={label}>✕ Two fills</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- interface ---------- */
function Controls() {
  const states = [
    { l: "rest", c: "" }, { l: "hover", c: s.cHover }, { l: "focus", c: s.cFocus },
    { l: "pressed", c: s.cPress }, { l: "selected", c: s.cSel }, { l: "disabled", c: s.cDis },
  ];
  return (
    <div className="flex h-full flex-col justify-between p-6">
      <div className="font-[family-name:var(--wi-mono)] text-[11px] font-light uppercase tracking-[0.14em] text-[var(--wi-muted)]">Floating control · 44px · six states</div>
      <div className="grid grid-cols-6 gap-2">
        {states.map((st) => (
          <div key={st.l} className="flex flex-col items-center gap-3">
            <span className={`${s.circle} ${st.c}`} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.3" /></svg>
            </span>
            <span className="font-[family-name:var(--wi-mono)] text-[10.5px] font-light uppercase tracking-[0.08em] text-[var(--wi-muted)]">{st.l}</span>
          </div>
        ))}
      </div>
      <div className="font-[family-name:var(--wi-mono)] text-[12px] text-[var(--wi-ink)]">Frost fill 72% + blur 12px · Rime hairline · Ink glyph</div>
    </div>
  );
}

function Hud({ active, reduced, data }: P) {
  const [t, setT] = useState(2521579);
  useEffect(() => {
    if (!active || reduced) return;
    const id = setInterval(() => setT((v) => (v + 487) % data.hud.m1Test), 90);
    return () => clearInterval(id);
  }, [active, reduced, data.hud.m1Test]);
  const row = "flex justify-between gap-6";
  return (
    <div className="relative h-full p-5 font-[family-name:var(--wi-mono)] text-[11px] font-light uppercase tracking-[0.12em] text-[var(--wi-ink)]">
      <span className={`${s.bracket} left-3 top-3`} /><span className={`${s.bracket} right-3 top-3 rotate-90`} />
      <span className={`${s.bracket} bottom-3 right-3 rotate-180`} /><span className={`${s.bracket} bottom-3 left-3 -rotate-90`} />
      <div className="flex h-full flex-col justify-between px-3 py-2">
        <div className={row}><span className="text-[var(--wi-muted)]">Mission</span><span>01 · ESA</span></div>
        <div className={row}><span className="text-[var(--wi-muted)]">Channels</span><span>{data.hud.m1Channels} / M2 {data.hud.m2Channels}</span></div>
        <div className={row}><span className="text-[var(--wi-muted)]">Timestep</span><span className="tabular-nums">T+{t.toLocaleString("en-US")}</span></div>
        <div className={row}><span className="text-[var(--wi-muted)]">Anomalous</span><span>{(data.hud.m1Pos * 100).toFixed(1)}% of test</span></div>
        <div className={row}><span className="text-[var(--wi-muted)]">Status</span><span>{active ? "● live" : "○ idle"}</span></div>
      </div>
    </div>
  );
}

function Scramble({ active, reduced }: P) {
  const a = useScramble("LATENT STRUCTURE", active, reduced, 900);
  const b = useScramble("18–29 MODES · M1 / M2", active, reduced, 1300);
  return (
    <div className="flex h-full flex-col justify-center gap-4 p-6">
      <div className="font-[family-name:var(--wi-mono)] text-[11px] font-light uppercase tracking-[0.14em] text-[var(--wi-muted)]">Scramble-in · 650ms · decodes left to right</div>
      <div className="inline-flex w-fit bg-[var(--wi-ink)] px-3 py-2 font-[family-name:var(--wi-mono)] text-[22px] font-light tracking-[0.1em] text-white" aria-label="Latent structure">{a}</div>
      <div className="font-[family-name:var(--wi-mono)] text-[15px] tracking-[0.1em] text-[var(--wi-ink)]" aria-label="18 to 29 modes, Mission 1 and Mission 2">{b}</div>
    </div>
  );
}

function Zoom() {
  const ticks = [0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.4, 1.6, 1.8];
  return (
    <div className="relative flex h-full gap-6 p-6">
      <div className="relative h-full w-10 border-l border-[var(--wi-ink)]">
        {ticks.map((t) => (
          <div key={t} className="absolute left-0 flex items-center gap-1.5" style={{ bottom: `${((t - 0.2) / 1.6) * 100}%` }}>
            <span className="block h-px w-2.5 bg-[var(--wi-ink)]" />
            <span className="font-[family-name:var(--wi-mono)] text-[10px] font-light text-[var(--wi-muted)]">{t.toFixed(1)}</span>
          </div>
        ))}
        <div className={s.zoomMarker} />
      </div>
      <div className="flex flex-1 flex-col justify-between">
        <div className="font-[family-name:var(--wi-mono)] text-[11px] font-light uppercase tracking-[0.14em] text-[var(--wi-muted)]">Zoom · live from this board</div>
        <div data-zoom-readout="" className="font-[family-name:var(--wi-display)] text-[44px] leading-none text-[var(--wi-ink)]" aria-hidden="true">0.30×</div>
        <div>
          <div className="mb-1.5 flex h-2 w-[200px] border-x border-b border-[var(--wi-ink)]" />
          <div className="font-[family-name:var(--wi-mono)] text-[11px] font-light text-[var(--wi-ink)]">200 units = 2 × 10⁵ timesteps</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- canvas textures ---------- */
function useCanvas(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => boolean | void,
  w: number, h: number, animate: boolean,
) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = w * dpr; c.height = h * dpr;
    const ctx = c.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!animate) { draw(ctx, w, h, 1e9); return; }
    let raf = 0; const t0 = performance.now();
    const loop = (now: number) => { const done = draw(ctx, w, h, now - t0); if (!done) raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [draw, w, h, animate]);
  return ref;
}

function rng(seed: number) {
  return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
}

function frostDraw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.clearRect(0, 0, w, h);
  const r = rng(7);
  const p = Math.min(1, t / 2200);
  const seeds = [[0.3, 0.38, 70], [0.7, 0.6, 92], [0.55, 0.2, 40], [0.2, 0.78, 48], [0.86, 0.22, 34]];
  ctx.strokeStyle = INK; ctx.lineCap = "round";
  const arm = (x: number, y: number, a: number, len: number, depth: number) => {
    const L = len * p;
    const ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L;
    ctx.lineWidth = Math.max(0.4, depth * 0.45);
    ctx.globalAlpha = 0.35 + depth * 0.15;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
    if (depth <= 0) return;
    const n = 3 + ((r() * 2) | 0);
    for (let i = 1; i <= n; i++) {
      const f = i / (n + 1);
      const bx = x + Math.cos(a) * L * f, by = y + Math.sin(a) * L * f;
      const bl = len * (1 - f) * 0.5;
      arm(bx, by, a + Math.PI / 3, bl, depth - 1);
      arm(bx, by, a - Math.PI / 3, bl, depth - 1);
    }
  };
  for (const [sx, sy, sz] of seeds) {
    for (let k = 0; k < 6; k++) arm(sx * w, sy * h, (k * Math.PI) / 3 + 0.2, sz, 2);
  }
  ctx.globalAlpha = 1;
  return p >= 1;
}

function grainDraw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.fillStyle = "#F4F6F8"; ctx.fillRect(0, 0, w, h);
  const r = rng(11 + Math.floor(t / 120));
  for (let i = 0; i < w * h * 0.03; i++) {
    const v = r();
    ctx.fillStyle = v < 0.5 ? "rgba(17,24,36,0.22)" : "rgba(86,97,111,0.16)";
    ctx.fillRect(r() * w, r() * h, v < 0.08 ? 1.6 : 1, v < 0.08 ? 1.6 : 1);
  }
  // one swatch of the grain at the 3% we'd actually ship
  ctx.fillStyle = "rgba(244,246,248,0.86)"; ctx.fillRect(w * 0.55, h * 0.12, w * 0.38, h * 0.5);
  ctx.strokeStyle = RIME; ctx.strokeRect(w * 0.55 + 0.5, h * 0.12 + 0.5, w * 0.38, h * 0.5);
  ctx.fillStyle = INK; ctx.font = "300 11px var(--wi-mono-face), monospace";
  ctx.fillText("x10 for visibility", 16, h - 16);
  ctx.fillText("as shipped", w * 0.55 + 10, h * 0.12 + 20);
  return t > 6000;
}

// icosahedron vertices / edges
const PHI = (1 + Math.sqrt(5)) / 2;
const V = [[-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0], [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI], [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1]];
const E: [number, number][] = [];
for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) {
  const d = Math.hypot(V[i][0] - V[j][0], V[i][1] - V[j][1], V[i][2] - V[j][2]);
  if (Math.abs(d - 2) < 0.01) E.push([i, j]);
}
function shardDraw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.clearRect(0, 0, w, h);
  const a = (t === 1e9 ? 0.6 : t / 20000 * Math.PI * 2) + 0.6, b = 0.42;
  const pr = V.map(([x, y, z]) => {
    const x1 = x * Math.cos(a) - z * Math.sin(a), z1 = x * Math.sin(a) + z * Math.cos(a);
    const y1 = y * Math.cos(b) - z1 * Math.sin(b), z2 = y * Math.sin(b) + z1 * Math.cos(b);
    const s2 = 78 / (1 + z2 * 0.08);
    return [w / 2 + x1 * s2, h / 2 - 8 + y1 * s2, z2];
  });
  for (const [i, j] of E) {
    const z = (pr[i][2] + pr[j][2]) / 2;
    ctx.strokeStyle = INK; ctx.globalAlpha = z > 0 ? 0.85 : 0.25; ctx.lineWidth = z > 0 ? 1 : 0.6;
    ctx.beginPath(); ctx.moveTo(pr[i][0], pr[i][1]); ctx.lineTo(pr[j][0], pr[j][1]); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  pr.forEach((p) => { ctx.fillStyle = "#fff"; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(p[0], p[1], 2, 0, 7); ctx.fill(); ctx.stroke(); });
  return false;
}

function CanvasArt({ draw, w, h, animate, label }: { draw: Parameters<typeof useCanvas>[0]; w: number; h: number; animate: boolean; label: string }) {
  const ref = useCanvas(draw, w, h, animate);
  return <canvas ref={ref} role="img" aria-label={label} style={{ width: w, height: h }} className="block" />;
}

export function Generated({ k, ...p }: P & { k: GenKey }) {
  const anim = p.active && !p.reduced;
  switch (k) {
    case "ridges": return <Ridges {...p} />;
    case "facets": return <Facets {...p} />;
    case "hierarchy": return <Hierarchy {...p} />;
    case "bic": return <Bic {...p} />;
    case "display": return <Display {...p} />;
    case "mono": return <Mono />;
    case "palette": return <Palette />;
    case "signal": return <Signal {...p} />;
    case "controls": return <Controls />;
    case "hud": return <Hud {...p} />;
    case "scramble": return <Scramble {...p} />;
    case "zoom": return <Zoom />;
    case "frost": return <CanvasArt draw={frostDraw} w={p.w} h={p.h} animate={anim} label="Generative frost: six-fold dendrite crystals in thin ink lines on white." />;
    case "grain": return <CanvasArt draw={grainDraw} w={p.w} h={p.h} animate={anim} label="Snow-grain texture: sparse cold-grey specks on a near-white field, magnified, with a panel showing the shipped strength." />;
    case "shards": return <CanvasArt draw={shardDraw} w={p.w} h={p.h} animate={anim} label="A wireframe icosahedron drawn in hairline ink, slowly rotating." />;
  }
}
