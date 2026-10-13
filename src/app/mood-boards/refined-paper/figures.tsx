// ✦ Generated artifacts drawn in SVG from our real data (server-rendered).
import type { PrSeries } from "./data";
import { InView } from "./interactive";

const line = (pts: [number, number][], x: (v: number) => number, y: (v: number) => number) =>
  pts.map((p, i) => `${i ? "L" : "M"}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join("");

/* ------------------------------------------------------------------ palette */
export const PALETTE = [
  { role: "Background", name: "Paper", hex: "#F6F2EA", fg: "#211F1B", ratio: "—" },
  { role: "Surface", name: "Parchment", hex: "#ECE6D8", fg: "#211F1B", ratio: "13.2 ink" },
  { role: "Text", name: "Ink", hex: "#211F1B", fg: "#F6F2EA", ratio: "14.7:1" },
  { role: "Muted", name: "Pencil", hex: "#69625A", fg: "#F6F2EA", ratio: "5.4:1" },
  { role: "Border", name: "Rule", hex: "#D9D1C1", fg: "#211F1B", ratio: "hairline" },
  { role: "Accent", name: "Vermilion", hex: "#B0401C", fg: "#FFFFFF", ratio: "5.2:1" },
];

export function PaletteCard() {
  return (
    <div className="bg-[var(--paper)] p-4">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[3px] border border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-3">
        {PALETTE.map((c) => (
          <div key={c.hex} className="flex aspect-[4/3] flex-col justify-between p-3" style={{ background: c.hex, color: c.fg }}>
            <span className="rp-sans text-[11px] font-medium tracking-wide uppercase opacity-80">{c.role}</span>
            <span>
              <span className="rp-serif block text-[17px] leading-tight">{c.name}</span>
              <span className="rp-mono block text-[11px] tabular-nums">{c.hex}</span>
              <span className="rp-mono block text-[10px] tabular-nums opacity-80">{c.ratio}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        {[
          ["Prussian", "#2D5B88"],
          ["Ochre", "#8C5E10"],
          ["Sage", "#4F7350"],
          ["Graphite", "#716A5F"],
        ].map(([n, h]) => (
          <span key={h} className="rp-mono flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
            <span className="inline-block h-[2px] w-5" style={{ background: h }} />
            {n} {h}
          </span>
        ))}
      </div>
      <p className="rp-sans mt-1 text-[11px] text-[var(--muted)]">Ratios against Paper. Plot inks are for lines and the words that name them.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ type */
export function TypePairing() {
  return (
    <div className="bg-[var(--paper)] px-5 py-6">
      <p className="rp-mono text-[11px] text-[var(--muted)]">Newsreader · opsz 6–72</p>
      <p className="rp-serif mt-1 text-[52px] leading-[0.95] font-light tracking-[-0.02em] text-[var(--ink)]">
        Latent <i className="font-normal">structure</i>
      </p>
      <p className="rp-serif mt-3 text-[17px] leading-[1.55] text-[var(--ink)]">
        Real modes live at the operational-group level, not the subsystem level.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[var(--rule)] pt-4">
        <div>
          <p className="rp-mono text-[11px] text-[var(--muted)]">IBM Plex Sans</p>
          <p className="rp-sans mt-1 text-[15px] font-medium text-[var(--ink)]">Mission 1 · Mission 2</p>
        </div>
        <div>
          <p className="rp-mono text-[11px] text-[var(--muted)]">IBM Plex Mono</p>
          <p className="rp-mono mt-1 text-[14px] tabular-nums text-[var(--ink)]">PR-AUC 0.384</p>
        </div>
      </div>
    </div>
  );
}

const SCALE = [
  { role: "Display", spec: "Newsreader 300 · 72/72 · −2%", cls: "rp-serif text-[44px] leading-none font-light tracking-[-0.02em]", s: "18 to 29 modes" },
  { role: "Heading", spec: "Newsreader 450 · 32/37", cls: "rp-serif text-[26px] leading-tight font-[450]", s: "Five method families" },
  { role: "Body", spec: "Newsreader 400 · 19/30", cls: "rp-serif text-[17px] leading-[1.6]", s: "GMM selects K = 21 on Mission 1." },
  { role: "Label", spec: "Plex Sans 500 · 13/17", cls: "rp-sans text-[13px] font-medium", s: "Sort by PR-AUC" },
  { role: "Caption", spec: "Plex Sans 400 · 12/17", cls: "rp-sans text-[12px] text-[var(--muted)]", s: "Figure 3. Anomaly score, Mission 1." },
  { role: "Numeral", spec: "Plex Mono 400 · 12 · tabular", cls: "rp-mono text-[12px] tabular-nums", s: "0.322  0.384  0.438" },
];

export function TypeScale() {
  return (
    <div className="divide-y divide-[var(--rule)] bg-[var(--paper)] px-5 py-2">
      {SCALE.map((t) => (
        <div key={t.role} className="py-3">
          <div className="rp-sans flex justify-between gap-3 text-[11px] text-[var(--muted)]">
            <span className="font-medium tracking-wide uppercase">{t.role}</span>
            <span className="rp-mono text-right">{t.spec}</span>
          </div>
          <p className={`${t.cls} mt-1 text-[var(--ink)]`}>{t.s}</p>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ color-keyed prose */
export function ColorKeyedProse({ gmm, kmeans, positiveRate }: { gmm: PrSeries; kmeans: PrSeries; positiveRate: number }) {
  const W = 320, H = 180, L = 26, R = 8, T = 8, B = 22;
  const x = (v: number) => L + v * (W - L - R);
  const y = (v: number) => T + (1 - v) * (H - T - B);
  return (
    <div className="bg-[var(--paper)] px-5 py-5">
      <p className="rp-serif text-[17px] leading-[1.65] text-[var(--ink)]">
        Past a recall of 0.2, the <b className="font-semibold text-[var(--prussian)]">mixture model</b> keeps more precision than{" "}
        <b className="font-semibold text-[var(--ochre)]">K-Means</b>: 0.37 against 0.19 at recall 0.4. Both sink toward the{" "}
        <b className="font-semibold text-[var(--graphite-ink)]">11% positive rate</b>.
      </p>
      <InView className="mt-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Precision-recall curves on Mission 1: GMM in blue above K-Means in ochre past recall 0.2, both approaching the 11 percent positive rate.">
          <line x1={x(0)} x2={x(1)} y1={y(positiveRate)} y2={y(positiveRate)} stroke="var(--graphite)" strokeDasharray="2 3" />
          <path className="rp-line" pathLength={1} d={line(kmeans.points, x, y)} fill="none" stroke="var(--ochre)" strokeWidth="1.5" />
          <path className="rp-line rp-delay" pathLength={1} d={line(gmm.points, x, y)} fill="none" stroke="var(--prussian)" strokeWidth="1.6" />
          <line x1={x(0)} x2={x(1)} y1={y(0)} y2={y(0)} stroke="var(--ink)" strokeWidth="0.75" />
          <line x1={x(0)} x2={x(0)} y1={y(0)} y2={y(1)} stroke="var(--ink)" strokeWidth="0.75" />
          <text x={x(1)} y={H - 6} textAnchor="end" fontSize="9" className="rp-mono" fill="var(--muted)">recall →</text>
          <text x={L - 4} y={y(1) + 4} textAnchor="end" fontSize="9" className="rp-mono" fill="var(--muted)">1</text>
          <text x={L - 4} y={y(0) + 3} textAnchor="end" fontSize="9" className="rp-mono" fill="var(--muted)">0</text>
        </svg>
      </InView>
      <p className="rp-sans mt-1 text-[11px] text-[var(--muted)]">Mission 1 test set, saved scores. K-Means here is the K = 8 run.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ anomaly timeline (wide) */
export function AnomalyTimeline({ bins, segments, nSegments, nTest }: { bins: [number, number, number][]; segments: [number, number][]; nSegments: number; nTest: number }) {
  const W = 1200, H = 210, L = 0, R = 0, T = 8, B = 2;
  // Scores are heavy-tailed (median 41, max 3e8), so plot log10 and clip the top 2%.
  const lg = (v: number) => Math.log10(Math.max(v, 0.5));
  const meds = bins.map((b) => lg(b[1])).sort((a, b) => a - b);
  const maxes = bins.map((b) => lg(b[2])).sort((a, b) => a - b);
  const lo = meds[0];
  const top = maxes[Math.floor(maxes.length * 0.98)];
  const x = (v: number) => L + v * (W - L - R);
  const y = (v: number) => T + (1 - (Math.min(lg(v), top) - lo) / (top - lo)) * (H - T - B);
  const med = bins.map((b, i) => `${i ? "L" : "M"}${x(b[0]).toFixed(1)},${y(b[1]).toFixed(1)}`).join("");
  const env =
    bins.map((b, i) => `${i ? "L" : "M"}${x(b[0]).toFixed(1)},${y(b[2]).toFixed(1)}`).join("") +
    [...bins].reverse().map((b) => `L${x(b[0]).toFixed(1)},${y(b[1]).toFixed(1)}`).join("") + "Z";
  return (
    <InView>
      <p className="rp-mono mb-1 text-[11px] text-[var(--muted)]">log score</p>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-[180px] w-full md:h-auto" role="img" aria-label={`GMM anomaly score across the Mission 1 test set, ${nTest.toLocaleString("en-US")} timesteps, with ${nSegments} labelled anomaly segments shaded.`}>
        {segments.map(([a, b]) => (
          <rect key={a} x={x(a)} width={Math.max(1, x(b) - x(a))} y={T - 6} height={H - T - B + 6} fill="var(--band)" />
        ))}
        <path d={env} fill="var(--rule)" opacity="0.55" className="rp-rise" />
        <path className="rp-line rp-slow" pathLength={1} d={med} fill="none" stroke="var(--ink)" strokeWidth="1.1" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="var(--ink)" strokeWidth="0.75" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="rp-mono mt-1 flex justify-between text-[11px] tabular-nums text-[var(--muted)]">
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <span key={v} className={v === 0.25 || v === 0.75 ? "hidden sm:inline" : ""}>{((v * nTest) / 1e6).toFixed(2)}M</span>
        ))}
      </div>
      <p className="rp-sans mt-1 text-right text-[11px] text-[var(--muted)]">test timestep</p>
    </InView>
  );
}

/* ------------------------------------------------------------------ small multiples (wide) */
export function SmallMultiples({ series, positiveRate }: { series: PrSeries[]; positiveRate: number }) {
  const W = 260, H = 200, L = 26, R = 8, T = 10, B = 24;
  const x = (v: number) => L + v * (W - L - R);
  const y = (v: number) => T + (1 - v) * (H - T - B);
  return (
    <InView className="grid grid-cols-1 gap-x-6 gap-y-8 min-[440px]:grid-cols-2 lg:grid-cols-4">
      {series.map((s, i) => (
        <div key={s.key}>
          <div className="flex items-baseline justify-between gap-2 border-b border-[var(--rule)] pb-1.5">
            <span className="rp-serif min-w-0 truncate text-[17px] text-[var(--ink)]">{s.label}</span>
            <span className="rp-mono shrink-0 text-[11px] tabular-nums text-[var(--muted)]">AP {s.ap.toFixed(3)}</span>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" role="img" aria-label={`${s.label} precision-recall curve on Mission 2, ${s.scoring} score, average precision ${s.ap.toFixed(3)}.`}>
            {[0.25, 0.5, 0.75].map((g) => (
              <line key={g} x1={x(0)} x2={x(1)} y1={y(g)} y2={y(g)} stroke="var(--rule)" strokeWidth="0.5" />
            ))}
            <line x1={x(0)} x2={x(1)} y1={y(positiveRate)} y2={y(positiveRate)} stroke="var(--graphite)" strokeDasharray="2 3" />
            <path className="rp-line" style={{ transitionDelay: `${i * 140}ms` }} pathLength={1} d={line(s.points, x, y)} fill="none" stroke="var(--prussian)" strokeWidth="1.5" />
            <line x1={x(0)} x2={x(1)} y1={y(0)} y2={y(0)} stroke="var(--ink)" strokeWidth="0.75" />
            <line x1={x(0)} x2={x(0)} y1={y(0)} y2={y(1)} stroke="var(--ink)" strokeWidth="0.75" />
            {i === 0 && (
              <>
                <text x={L - 5} y={y(1) + 4} textAnchor="end" fontSize="10" className="rp-mono" fill="var(--muted)">1</text>
                <text x={L - 5} y={y(0) + 3} textAnchor="end" fontSize="10" className="rp-mono" fill="var(--muted)">0</text>
              </>
            )}
            <text x={x(1)} y={H - 6} textAnchor="end" fontSize="10" className="rp-mono" fill="var(--muted)">recall</text>
          </svg>
          <p className="rp-sans text-[11px] text-[var(--muted)]">{s.scoring}</p>
        </div>
      ))}
    </InView>
  );
}

/* ------------------------------------------------------------------ GMM node diagram */
type Graph = {
  subsystems: string[];
  comps: { id: number; weight: number; anomalyRate: number; subsystems: { s: string; share: number }[]; groups: { g: string; share: number }[] }[];
  groupIds: string[];
};

export function GmmNodeDiagram({ subsystems, comps, groupIds }: Graph) {
  const W = 560, H = 360;
  const accent = comps.reduce((a, b) => (b.anomalyRate > a.anomalyRate ? b : a)).id;
  const spread = (n: number, i: number, pad = 52) => pad + (i * (W - pad * 2)) / Math.max(1, n - 1);
  const sx = (s: string) => spread(subsystems.length, subsystems.indexOf(s), 90);
  const cx = (i: number) => spread(comps.length, i);
  const gx = (g: string) => spread(groupIds.length, groupIds.indexOf(g), 40);
  const yS = 318, yC = 190, yG = 58;
  const edge = (x1: number, y1: number, x2: number, y2: number) => `M${x1},${y1} C${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}`;
  const Node = ({ x, y, w, label, sub, hot }: { x: number; y: number; w: number; label: string; sub?: string; hot?: boolean }) => (
    <g>
      <rect x={x - w / 2 + 3} y={y - 15 + 3} width={w} height={30} rx="2" fill="var(--paper)" stroke={hot ? "var(--accent)" : "var(--oxblood)"} strokeWidth="0.75" />
      <rect x={x - w / 2} y={y - 15} width={w} height={30} rx="2" fill={hot ? "#F6E3D6" : "var(--parchment)"} stroke={hot ? "var(--accent)" : "var(--oxblood)"} strokeWidth={hot ? 1.25 : 0.75} />
      <text x={x} y={sub ? y - 1 : y + 4} textAnchor="middle" fontSize="11" className="rp-sans" fontWeight={500} fill="var(--ink)">{label}</text>
      {sub && <text x={x} y={y + 10} textAnchor="middle" fontSize="8.5" className="rp-mono" fill={hot ? "var(--accent-ink)" : "var(--muted)"}>{sub}</text>}
    </g>
  );
  return (
    <InView>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`GMM components on Mission 1 drawn as a diagram: four subsystems feed the six heaviest components, which map onto operational groups. Component ${accent} is highlighted; its anomaly rate is highest.`}>
        <defs>
          <marker id="rp-arrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L6,3 L0,6z" fill="var(--oxblood)" /></marker>
          <marker id="rp-arrow-hot" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L6,3 L0,6z" fill="var(--accent)" /></marker>
        </defs>
        {comps.flatMap((c, i) => {
          const hot = c.id === accent;
          return [
            ...c.subsystems.map((s) => (
              <path key={`s${c.id}-${s.s}`} className="rp-line" pathLength={1} d={edge(sx(s.s), yS - 16, cx(i), yC + 20)} fill="none" stroke={hot ? "var(--accent)" : "var(--oxblood)"} strokeOpacity={hot ? 1 : 0.25 + s.share * 0.6} strokeWidth={hot ? 1.5 : 0.5 + s.share * 1.5} markerEnd={`url(#${hot ? "rp-arrow-hot" : "rp-arrow"})`} />
            )),
            ...c.groups.map((g) => (
              <path key={`g${c.id}-${g.g}`} className="rp-line rp-delay" pathLength={1} d={edge(cx(i), yC - 16, gx(g.g), yG + 20)} fill="none" stroke={hot ? "var(--accent)" : "var(--oxblood)"} strokeOpacity={hot ? 1 : 0.25 + g.share * 0.6} strokeWidth={hot ? 1.5 : 0.5 + g.share * 1.5} markerEnd={`url(#${hot ? "rp-arrow-hot" : "rp-arrow"})`} />
            )),
          ];
        })}
        {groupIds.map((g) => <Node key={g} x={gx(g)} y={yG} w={40} label={`G${g}`} hot={comps.find((c) => c.id === accent)?.groups.some((x) => x.g === g)} />)}
        {comps.map((c, i) => <Node key={c.id} x={cx(i)} y={yC} w={60} label={`C${c.id}`}  hot={c.id === accent} />)}
        {subsystems.map((s) => <Node key={s} x={sx(s)} y={yS} w={52} label={`S${s}`} />)}
        <text x={8} y={yG - 28} className="rp-mono" fill="var(--muted)">groups</text>
        <text x={8} y={yC - 28} className="rp-mono" fill="var(--muted)">components</text>
        <text x={8} y={yS - 26} className="rp-mono" fill="var(--muted)">subsystems</text>
      </svg>
    </InView>
  );
}

/* ------------------------------------------------------------------ texture */
export function PaperGrain() {
  return (
    <div className="bg-[var(--paper)] p-4" role="img" aria-label="Paper grain texture shown amplified on the left and at true strength on the right, above a set of hairline rules.">
      <svg viewBox="0 0 320 130" className="w-full" aria-hidden>
        <defs>
          <filter id="rp-grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="7" />
            <feColorMatrix values="0 0 0 0 0.13  0 0 0 0 0.12  0 0 0 0 0.10  0 0 0 0.9 0" />
          </filter>
        </defs>
        <rect x="0" y="0" width="156" height="130" rx="2" fill="#F6F2EA" />
        <rect x="0" y="0" width="156" height="130" filter="url(#rp-grain)" opacity="0.35" />
        <rect x="164" y="0" width="156" height="130" rx="2" fill="#F6F2EA" stroke="var(--rule)" strokeWidth="0.5" />
        <rect x="164" y="0" width="156" height="130" filter="url(#rp-grain)" opacity="0.045" />
      </svg>
      <div className="rp-mono mt-1.5 grid grid-cols-2 gap-2 text-[10.5px] text-[var(--muted)]">
        <span>grain × 8, to see it</span>
        <span>grain 4.5%, as used</span>
      </div>
      <svg viewBox="0 0 320 48" className="mt-4 w-full" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1="0" x2="320" y1={4 + i * 13} y2={4 + i * 13} stroke={i === 0 ? "var(--ink)" : "var(--rule-strong)"} strokeWidth={[0.75, 1, 0.5, 0.5][i]} strokeDasharray={i === 3 ? "1 3" : undefined} />
        ))}
      </svg>
      <p className="rp-mono mt-1 text-[10.5px] text-[var(--muted)]">ink 0.75 · rule 1 · hair 0.5 · dotted guide</p>
    </div>
  );
}

/* ------------------------------------------------------------------ breakout grid + caption */
export function BreakoutGrid() {
  const bars = (y: number, n: number) => Array.from({ length: n }, (_, i) => <rect key={y + i} x="110" y={y + i * 9} width={i === n - 1 ? 120 : 180} height="3" rx="1" fill="var(--rule-strong)" />);
  return (
    <div className="bg-[var(--paper)] p-4">
      <svg viewBox="0 0 400 300" className="w-full" role="img" aria-label="Layout diagram: a narrow text column, a figure that breaks out wider than the column, and a full-bleed band.">
        <rect x="0.5" y="0.5" width="399" height="299" fill="none" stroke="var(--rule)" />
        {bars(18, 4)}
        <rect x="60" y="62" width="280" height="62" fill="var(--parchment)" stroke="var(--oxblood)" strokeWidth="0.6" />
        <path d="M70,110 C110,100 130,74 170,82 S240,104 330,72" fill="none" stroke="var(--prussian)" strokeWidth="1.2" />
        <text x="66" y="74" fontSize="8" className="rp-mono" fill="var(--muted)">figure 1080</text>
        {bars(136, 3)}
        <rect x="0.5" y="170" width="399" height="54" fill="var(--ink)" />
        <text x="10" y="184" fontSize="8" className="rp-mono" fill="#CFC7B8">full bleed, once per page</text>
        {bars(236, 4)}
        <line x1="110" x2="290" y1="10" y2="10" stroke="var(--accent)" strokeWidth="0.75" />
        <text x="200" y="7" textAnchor="middle" fontSize="7.5" className="rp-mono" fill="var(--accent-ink)">text 680</text>
      </svg>
      <p className="rp-sans mt-3 border-t border-[var(--rule)] pt-2 text-[12px] leading-[1.45] text-[var(--muted)]">
        <span className="font-semibold text-[var(--ink)]">Figure 3.</span> Anomaly score over the Mission 1 test set. Bands mark the 89 labelled segments; the line is the median per bin.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ primary action */
const primary =
  "rp-sans inline-flex items-center gap-2 rounded-[3px] bg-[var(--accent)] px-4 py-2.5 text-[14px] font-medium text-white transition-[background-color,transform] duration-200 ease-out hover:bg-[#962F10] active:translate-y-px active:bg-[#7E2609] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)] disabled:cursor-not-allowed disabled:bg-[var(--rule)] disabled:text-[var(--muted)]";

export function PrimaryAction() {
  return (
    <div className="bg-[var(--paper)] px-5 py-6">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={primary}>
          Read the paper <span aria-hidden>→</span>
        </button>
        <button type="button" className="rp-sans rounded-[3px] px-2 py-2.5 text-[14px] font-medium text-[var(--ink)] underline decoration-[var(--rule-strong)] underline-offset-4 transition-colors duration-200 hover:decoration-[var(--ink)] active:text-[var(--muted)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]">
          Explore the latent map
        </button>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-[var(--rule)] pt-4 sm:grid-cols-4">
        {[
          ["Rest", "bg-[var(--accent)] text-white"],
          ["Hover", "bg-[#962F10] text-white"],
          ["Pressed", "bg-[#7E2609] text-white translate-y-px"],
          ["Disabled", "bg-[var(--rule)] text-[var(--muted)]"],
        ].map(([n, c]) => (
          <div key={n}>
            <span aria-hidden className={`rp-sans block rounded-[3px] px-2 py-1.5 text-center text-[12px] font-medium ${c}`}>Read</span>
            <span className="rp-mono mt-1 block text-[10px] text-[var(--muted)]">{n}</span>
          </div>
        ))}
      </div>
      <p className="rp-sans mt-3 text-[11px] text-[var(--muted)]">Vermilion appears once per view. Tab here to see the focus ring.</p>
    </div>
  );
}
