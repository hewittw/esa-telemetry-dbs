// Agent-generated artifacts (✦). Server components: plain SVG + HTML built from our data.
import type { bicSweeps, channelTree, hudSpark, prBundle, table1 } from "./data";
import { BlurFocus } from "./blur-focus";

export const MONO = "font-(family-name:--font-is-mono)";
export const DOT = "font-(family-name:--font-is-dot)";

/* ---------- contrast ---------- */
function lum(hex: string) {
  const c = hex.replace("#", "").match(/.{2}/g)!.map((x) => parseInt(x, 16) / 255);
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string) {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

/* ---------- 03 · Doto numerals ---------- */
export function DotoNumerals({ t }: { t: ReturnType<typeof table1> }) {
  return (
    <div className="flex h-full flex-col justify-between gap-3 p-5 pb-4">
      <p className={`${MONO} text-[10px] uppercase tracking-[0.2em] text-(--is-steel)`}>[ PR-AUC · {t.best.method} · M{t.best.mission} ]</p>
      <p className={`${DOT} text-[clamp(60px,6vw,92px)] font-semibold leading-[0.8] text-(--is-frost)`}>
        {t.best.prAuc.toFixed(3)}
      </p>
      <dl className={`${MONO} grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] uppercase tracking-[0.12em]`}>
        {t.others.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-2 border-t border-(--is-line) pt-1.5">
            <dt className="truncate text-(--is-steel)">{r.method.replace("HierarchicalVAE", "HVAE").replace("TransformerVAE", "TVAE")} M{r.mission}</dt>
            <dd className={`${DOT} text-[15px] font-semibold text-(--is-frost)`}>{r.prAuc.toFixed(3)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ---------- 06 · Palette ---------- */
const SWATCHES: { name: string; hex: string; role: string; ground?: boolean }[] = [
  { ground: true, name: "Void", hex: "#0A0B0D", role: "Background" },
  { ground: true, name: "Charcoal", hex: "#333333", role: "Fiber field" },
  { ground: true, name: "Panel", hex: "#121316", role: "Surface" },
  { name: "Frost", hex: "#CFD9E0", role: "Text" },
  { name: "Steel", hex: "#8C979F", role: "Muted" },
  { ground: true, name: "Hairline", hex: "#2E3135", role: "Border" },
  { name: "Fiber Green", hex: "#37FD08", role: "Accent · primary" },
  { name: "Fault Magenta", hex: "#E04FD6", role: "Anomaly signal" },
  { name: "Survey Teal", hex: "#4BCFE0", role: "Data outline" },
];
export function Palette() {
  return (
    <div className="grid h-full grid-cols-3 gap-px bg-(--is-line)">
      {SWATCHES.map((s) => {
        const onVoid = contrast(s.hex, "#0A0B0D");
        const ink = lum(s.hex) > 0.18 ? "#0A0B0D" : "#CFD9E0";
                return (
          <div key={s.hex} className={`${MONO} flex min-h-24 flex-col justify-between p-2.5 text-[9.5px] uppercase leading-tight tracking-[0.08em]`} style={{ background: s.hex, color: ink }}>
            <span>{s.name}</span>
            <span>
              {s.hex}
              <br />
              {s.role}
              <br />
              {s.ground ? `Frost ${contrast("#CFD9E0", s.hex).toFixed(1)}:1` : `${onVoid.toFixed(1)}:1 on void`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- 09 · Display specimen ---------- */
export function DisplaySpecimen() {
  return (
    <div className="flex h-full flex-col justify-between gap-5 p-5">
      <div className="flex items-start justify-between">
        <span className="text-[clamp(88px,9vw,132px)] font-semibold leading-[0.8] tracking-[-0.05em] text-(--is-frost)">Aa</span>
        <span className={`${MONO} text-right text-[10px] uppercase leading-relaxed tracking-[0.16em] text-(--is-steel)`}>
          Host Grotesk
          <br />
          300 · 500 · 600
        </span>
      </div>
      <p className="text-[28px] font-semibold leading-[1] tracking-[-0.03em] text-(--is-frost)">
        Engineer the <span className="text-(--is-steel)">latent.</span>
      </p>
      <p className="text-[17px] font-light uppercase leading-[1.05] tracking-[0.01em] text-(--is-frost)">
        <span className="block pl-[2.2em]">Structure lives at</span>
        <span className="block">the group level</span>
      </p>
    </div>
  );
}

/* ---------- 12 · Mono label specimen ---------- */
export function MonoSpecimen() {
  return (
    <div className={`${MONO} flex h-full flex-col justify-between gap-4 p-5 uppercase`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] tracking-[0.1em] text-(--is-frost)">
        <span>Finding</span>
        <span>Methods</span>
        <span>Missions</span>
        <span className="rounded-[3px] bg-(--is-frost) px-2 py-1 text-(--is-void)">Read paper</span>
      </div>
      <p className="text-[10px] tracking-[0.42em] text-(--is-steel)">Select a mission to compare</p>
      <p className="text-[11px] normal-case tracking-[0.02em] text-(--is-steel)">ESA Mission 1 · 76 ch · one reading / 30 s · Fragment Mono</p>
    </div>
  );
}

/* ---------- 10 · Channel hierarchy as steered fiber ---------- */
export function ChannelTree({ tree }: { tree: ReturnType<typeof channelTree> }) {
  const W = 600;
  const top = 34;
  const mid = 236;
  const bot = 392;
  const chX = (i: number) => 18 + (i / (tree.nChannels - 1)) * (W - 36);
  const gX = (i: number) => 40 + (i / (tree.groups.length - 1)) * (W - 80);
  const sX = (i: number) => 90 + (i / (tree.subsystems.length - 1)) * (W - 180);
  const paths: { d: string; key: string }[] = [];
  let c = 0;
  tree.groups.forEach((g, gi) => {
    for (let k = 0; k < g.channels; k++, c++) {
      const x0 = chX(c);
      const x1 = gX(gi);
      paths.push({ key: `c${c}`, d: `M${x0} ${top} C${x0} ${top + 120} ${x1} ${mid - 110} ${x1} ${mid}` });
    }
  });
  return (
    <svg viewBox={`0 0 ${W} 430`} className="h-full w-full" role="img" aria-label="Mission 1 channel hierarchy drawn as steered fibers: 76 channels curve into 18 operational groups, which merge into 4 subsystems.">
      <g className={`${MONO}`} fontSize="10" letterSpacing="1.6" fill="#8C979F">
        <text x="18" y="18">76 CHANNELS</text>
        <text x={W - 18} y="18" textAnchor="end">ESA MISSION 1</text>
        <text x="18" y={mid - 14}>18 GROUPS</text>
        <text x={W - 18} y={mid - 14} textAnchor="end" fill="#4BCFE0">GMM K* = 21 ≈ GROUPS</text>
        <text x="18" y={bot + 30}>4 SUBSYSTEMS</text>
        <text x={W - 18} y={bot + 30} textAnchor="end">ARI vs subsystems 0.047</text>
      </g>
      <g fill="none" stroke="#CFD9E0" strokeWidth="0.8" strokeOpacity="0.55">
        {paths.map((p, i) => (
          <path key={p.key} d={p.d} pathLength={1} className="is-draw" style={{ animationDelay: `${(i % 19) * 40}ms` }} />
        ))}
      </g>
      <g fill="none" stroke="#37FD08" strokeOpacity="0.8">
        {tree.groups.map((g, gi) => {
          const x0 = gX(gi);
          const x1 = sX(g.subsystem);
          return (
            <path key={gi} d={`M${x0} ${mid} C${x0} ${mid + 90} ${x1} ${bot - 80} ${x1} ${bot}`} strokeWidth={0.6 + g.channels * 0.35} pathLength={1} className="is-draw" style={{ animationDelay: `${600 + gi * 50}ms` }} />
          );
        })}
      </g>
      {tree.groups.map((g, gi) => (
        <rect key={gi} x={gX(gi) - 2.5} y={mid - 2.5} width="5" height="5" fill="#CFD9E0" />
      ))}
      {tree.subsystems.map((s, i) => (
        <g key={s.name}>
          <rect x={sX(i) - 4} y={bot - 4} width="8" height="8" fill="#37FD08" />
          <text x={sX(i)} y={bot + 14} textAnchor="middle" fontSize="9" fill="#CFD9E0" className={MONO} letterSpacing="1">
            {s.name} · {s.n}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ---------- 14 · Controls ---------- */
export function Controls() {
  const states = ["Rest", "Hover", "Focus", "Pressed", "Disabled"] as const;
  const stateCls: Record<(typeof states)[number], string> = {
    Rest: "border-(--is-line) text-(--is-frost)",
    Hover: "border-(--is-frost) text-(--is-frost)",
    Focus: "border-(--is-line) text-(--is-frost) outline-2 outline-offset-2 outline-(--is-frost)",
    Pressed: "border-(--is-frost) bg-(--is-charcoal) text-(--is-frost)",
    Disabled: "border-(--is-line) text-[#5B636A]",
  };
  return (
    <div aria-hidden className={`${MONO} flex h-full flex-col justify-between gap-4 p-5 text-[11px] uppercase tracking-[0.12em]`}>
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center gap-2 rounded-[3px] bg-(--is-fiber) px-3.5 py-2.5 text-(--is-void)">Explore the latent map <span>→</span></span>
        <span className="rounded-[3px] border border-(--is-line) px-3.5 py-2.5 text-(--is-frost)">[ Read the paper ]</span>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex rounded-[3px] border border-(--is-line) p-0.5">
          <span className="px-3 py-1.5 text-(--is-steel)">M1</span>
          <span className="rounded-[2px] bg-(--is-frost) px-3 py-1.5 text-(--is-void)">M2</span>
        </span>
        <span className="rounded-full border border-(--is-teal) px-3 py-1.5 text-(--is-teal)">● Generative</span>
        <span className="rounded-full border border-(--is-line) px-3 py-1.5 text-(--is-steel)">Parametric</span>
        <span className="rounded-full border border-(--is-line) px-3 py-1.5 text-(--is-steel)">Baseline</span>
      </div>
      <div className="grid grid-cols-5 gap-1.5 text-[8.5px] tracking-[0.08em]">
        {states.map((s) => (
          <div key={s} className="flex flex-col gap-1.5">
            <span className={`whitespace-nowrap rounded-[3px] border px-1 py-1.5 text-center ${stateCls[s]}`}>Sort ↓</span>
            <span className="text-center text-(--is-steel)">{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- 16 · BIC as a light trace ---------- */
export function BicTrace({ bic }: { bic: ReturnType<typeof bicSweeps> }) {
  const x = (k: number) => 44 + ((k - 2) / 28) * 528;
  const y = (v: number) => 30 + (1 - v) * 190;
  const line = (pts: { k: number; v: number }[]) => pts.map((p, i) => `${i ? "L" : "M"}${x(p.k).toFixed(1)} ${y(p.v).toFixed(1)}`).join(" ");
  const series = [
    { id: "m1", label: "M1", color: "#CFD9E0", ...bic.m1 },
    { id: "m2", label: "M2", color: "#4BCFE0", ...bic.m2 },
  ];
  return (
    <svg viewBox="0 0 600 270" className="h-full w-full" role="img" aria-label={`GMM BIC sweeps over K = 2 to 30. Mission 1 bottoms out at K = ${bic.m1.selectedK}, Mission 2 at K = ${bic.m2.selectedK}, near the operational-group counts, far above the 4 to 5 subsystems.`}>
      <defs>
        <filter id="is-glow" x="-10%" y="-30%" width="120%" height="160%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>
      <g stroke="#2E3135" strokeWidth="1">
        {[4, 5, 18, 29].map((k) => (
          <line key={k} x1={x(k)} x2={x(k)} y1="24" y2="226" strokeDasharray="2 4" />
        ))}
        <line x1="44" x2="572" y1="226" y2="226" />
      </g>
      {series.map((s) => (
        <g key={s.id}>
          <path d={line(s.points)} fill="none" stroke={s.color} strokeWidth="5" opacity="0.35" filter="url(#is-glow)" />
          <path d={line(s.points)} fill="none" stroke={s.color} strokeWidth="1.4" pathLength={1} className="is-draw is-draw-slow" />
          <rect x={x(s.selectedK) - 3} y={y(0) - 3} width="6" height="6" fill={s.color} />
        </g>
      ))}
      <g className={MONO} fontSize="10" letterSpacing="1.4" fill="#8C979F">
        <text x="44" y="16">BIC (NORMALISED) · GMM SWEEP K = 2–30</text>
        <text x={x(4.5)} y="246" textAnchor="middle">SUBSYS 4–5</text>
        <text x={x(18)} y="246" textAnchor="middle">GROUPS 18</text>
        <text x={x(29)} y="246" textAnchor="middle">29</text>
        <text x={x(21)} y={y(0) - 12} textAnchor="middle" fill="#CFD9E0">M1 K*={bic.m1.selectedK}</text>
        <text x={x(29) - 6} y={y(0) - 26} textAnchor="end" fill="#4BCFE0">M2 K*={bic.m2.selectedK}</text>
      </g>
    </svg>
  );
}

/* ---------- 20 · HUD readout ---------- */
export function Hud({ spark }: { spark: ReturnType<typeof hudSpark> }) {
  const rows: [string, string][] = [
    ["MSN", "02"],
    ["CH", "100"],
    ["FS", "0.056 HZ"],
    ["TS", "3,062,401"],
    ["K*", "29"],
    ["PR", "0.390"],
    ["ROC", "0.764"],
  ];
  const d = spark.map((p, i) => `${i ? "L" : "M"}${(i / (spark.length - 1)) * 300} ${46 - p.s * 40}`).join(" ");
  return (
    <div className={`${MONO} relative flex h-full flex-col justify-between gap-4 p-5 text-[11px] uppercase tracking-[0.14em]`}>
      <span aria-hidden className="is-corners pointer-events-none absolute inset-3" />
      <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-(--is-steel)">{k}:</dt>
            <dd className="text-(--is-frost)">{v}</dd>
          </div>
        ))}
        <dt className="text-(--is-steel)">STAT:</dt>
        <dd className="text-(--is-fiber)">
          LIVE<span className="is-blink">▌</span>
        </dd>
      </dl>
      <svg viewBox="0 0 300 50" preserveAspectRatio="none" className="h-12 w-full" role="img" aria-label="Sparkline of the Mission 2 GMM anomaly score across the test set, magenta ticks at labelled faults.">
        {spark.map((p, i) => (p.a > 0.5 ? <rect key={i} x={(i / (spark.length - 1)) * 300 - 1} y="0" width="2" height="50" fill="#E04FD6" opacity="0.55" /> : null))}
        <path d={d} fill="none" stroke="#CFD9E0" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

/* ---------- 22 · PR curves as a fiber bundle ---------- */
export function PrBundle({ curves }: { curves: ReturnType<typeof prBundle> }) {
  const S = 360;
  const px = (r: number) => 30 + r * (S - 44);
  const py = (p: number) => 14 + (1 - p) * (S - 50);
  const best = curves.filter((c) => c.inTable).sort((a, b) => b.prAuc - a.prAuc)[0];
  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="h-full w-full" role="img" aria-label={`All 16 saved Mission 2 precision-recall curves drawn as fibers; the best saved Table 1 run, ${best.method} at ${best.prAuc.toFixed(3)} average precision, is highlighted in teal.`}>
      <g stroke="#2E3135">
        <line x1="30" x2={S - 14} y1={py(0)} y2={py(0)} />
        <line x1="30" x2="30" y1="14" y2={py(0)} />
      </g>
      <g fill="none">
        {curves.map((c) => (
          <path
            key={c.id}
            d={c.points.map(([r, p], i) => `${i ? "L" : "M"}${px(r).toFixed(1)} ${py(p).toFixed(1)}`).join(" ")}
            stroke={c === best ? "#4BCFE0" : "#CFD9E0"}
            strokeOpacity={c === best ? 1 : c.inTable ? 0.6 : 0.22}
            strokeWidth={c === best ? 1.8 : 0.9}
          />
        ))}
      </g>
      <rect x={px(0.005)} y={py(1)} width={px(0.16) - px(0.005)} height={py(0.62) - py(1)} fill="none" stroke="#4BCFE0" strokeWidth="1" />
      <g className={MONO} fontSize="9" letterSpacing="1.2" fill="#8C979F">
        <text x={px(0.005)} y={py(0.62) + 14} fill="#4BCFE0">[ HIGH-PRECISION AOI ]</text>
        <text x="30" y={S - 10}>RECALL →</text>
        <text x={S - 14} y={S - 10} textAnchor="end">M2 · 16 SAVED RUNS</text>
      </g>
    </svg>
  );
}

/* ---------- 18 · Blur to focus ---------- */
export function BlurTile() {
  return (
    <div className="flex h-full flex-col justify-between gap-3 p-5">
      <p className={`${MONO} text-[10px] uppercase tracking-[0.2em] text-(--is-steel)`}>[ Score &gt; τ<sub>99</sub> ]</p>
      <p className="text-[clamp(40px,4.4vw,64px)] font-semibold uppercase leading-none tracking-[-0.03em] text-(--is-frost)">
        <BlurFocus word="Anomaly" />
      </p>
      <p className={`${MONO} text-[10px] uppercase tracking-[0.2em] text-(--is-steel)`}>GMM M1 · 96.3% precision at τ99</p>
    </div>
  );
}

/* ---------- 24 · Grain + scanline texture ---------- */
export function Grain() {
  return (
    <div className="relative h-full overflow-hidden bg-(--is-charcoal)">
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        <filter id="is-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0.81  0 0 0 0 0.85  0 0 0 0 0.88  0 0 0 0.55 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#is-noise)" opacity="0.5" />
      </svg>
      <div aria-hidden className="is-scan absolute inset-0" />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_90%_at_30%_20%,transparent_30%,#0A0B0D_100%)]" />
      <p className={`${MONO} absolute bottom-4 left-4 text-[10px] uppercase tracking-[0.2em] text-(--is-frost)`}>Grain 0.85 · scan 3 px</p>
    </div>
  );
}

/* ---------- 25 · Registration grid ---------- */
export function RegGrid() {
  return (
    <div className="is-regdots relative h-full p-5">
      <div className="is-corners relative flex h-full flex-col justify-between border border-(--is-line) p-4">
        <p className={`${MONO} text-[10px] uppercase leading-relaxed tracking-[0.16em] text-(--is-steel)`}>
          Fig. 03 /<br />Latent map
        </p>
        <p className={`${MONO} self-end text-[10px] uppercase tracking-[0.16em] text-(--is-frost)`}>12 col · 4 px marks</p>
      </div>
    </div>
  );
}
