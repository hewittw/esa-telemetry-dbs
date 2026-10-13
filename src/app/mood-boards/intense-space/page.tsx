import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Doto, Fragment_Mono, Host_Grotesk } from "next/font/google";
import "./board.css";
import { board } from "./meta";
import { aoiWindows, bicSweeps, channelTree, faultShare, fiberStrands, hudSpark, prBundle, table1 } from "./data";
import { FiberField } from "./fiber-field";
import { WordReveal } from "./word-reveal";
import {
  AoiStrip,
  BicTrace,
  BlurTile,
  ChannelTree,
  ColorBudget,
  Controls,
  DisplaySpecimen,
  DotoNumerals,
  Grain,
  Hud,
  MONO,
  MonoSpecimen,
  Palette,
  PrBundle,
  RegGrid,
} from "./pieces";

const display = Host_Grotesk({ subsets: ["latin"], variable: "--font-is-display", weight: ["300", "500", "600"] });
const mono = Fragment_Mono({ subsets: ["latin"], variable: "--font-is-mono", weight: "400" });
const dot = Doto({ subsets: ["latin"], variable: "--font-is-dot" });

export const metadata: Metadata = {
  title: `Mood board · ${board.name}`,
  description: board.summary,
};

type Kind = "photo" | "type" | "color" | "texture" | "interface";
type Note = { take: string; where: string; leave: string };
type Artifact = {
  title: string;
  kind: Kind;
  gen?: boolean;
  /** lg footprint on the 12-col grid: [cols, rows] */
  size: keyof typeof SIZE;
  /** below xl (and on touch screens): an aspect ratio, or "" for natural height */
  m?: string;
  wide?: boolean;
  credit?: string;
  note: Note;
} & ({ img: string; alt: string; pos?: string; fit?: "contain" } | { body: React.ReactNode });

// literal class strings so Tailwind sees them
const SIZE = {
  "8x6": "xl:pointer-fine:col-span-8 xl:pointer-fine:row-span-6",
  "6x5": "xl:pointer-fine:col-span-6 xl:pointer-fine:row-span-5",
  "6x4": "xl:pointer-fine:col-span-6 xl:pointer-fine:row-span-4",
  "6x3": "xl:pointer-fine:col-span-6 xl:pointer-fine:row-span-3",
  "6x2": "xl:pointer-fine:col-span-6 xl:pointer-fine:row-span-2",
  "5x4": "xl:pointer-fine:col-span-5 xl:pointer-fine:row-span-4",
  "4x5": "xl:pointer-fine:col-span-4 xl:pointer-fine:row-span-5",
  "4x4": "xl:pointer-fine:col-span-4 xl:pointer-fine:row-span-4",
  "4x3": "xl:pointer-fine:col-span-4 xl:pointer-fine:row-span-3",
  "4x2": "xl:pointer-fine:col-span-4 xl:pointer-fine:row-span-2",
  "3x5": "xl:pointer-fine:col-span-3 xl:pointer-fine:row-span-5",
  "3x4": "xl:pointer-fine:col-span-3 xl:pointer-fine:row-span-4",
  "3x3": "xl:pointer-fine:col-span-3 xl:pointer-fine:row-span-3",
  "3x2": "xl:pointer-fine:col-span-3 xl:pointer-fine:row-span-2",
  "8x2": "xl:pointer-fine:col-span-8 xl:pointer-fine:row-span-2",
  "9x2": "xl:pointer-fine:col-span-9 xl:pointer-fine:row-span-2",
} as const;

function Tile({ a, n }: { a: Artifact; n: number }) {
  const id = `is-note-${n}`;
  const idx = String(n).padStart(2, "0");
  return (
    <figure
      tabIndex={0}
      aria-labelledby={`${id}-t`}
      aria-describedby={id}
      className={`group is-corners relative flex flex-col overflow-hidden rounded-[2px] border border-(--is-line) bg-(--is-panel) transition-colors duration-300 hover:border-[#4a4f55] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-(--is-frost) ${SIZE[a.size]} ${a.wide ? "md:col-span-2" : ""}`}
    >
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className={`relative min-h-0 flex-none xl:pointer-fine:flex-1 ${a.m ?? ""} xl:pointer-fine:aspect-auto ${"fit" in a && a.fit === "contain" ? "bg-black" : ""}`}>
          {"img" in a ? (
            <Image
              src={a.img}
              alt={a.alt}
              fill
              sizes="(min-width: 1024px) 50vw, (min-width: 768px) 50vw, 100vw"
              className={`is-photo group-hover:scale-[1.03] group-focus:scale-[1.03] ${a.fit === "contain" ? "object-contain p-4 max-xl:p-0 pointer-coarse:p-0" : "object-cover"}`}
              style={{ objectPosition: a.pos ?? "center" }}
            />
          ) : (
            a.body
          )}
        </div>
        {/* note: on mouse/trackpad it slides over the piece on hover or keyboard focus;
            on touch screens and below xl it sits in flow beneath the piece so it never covers it */}
        <div
          id={id}
          className="absolute inset-x-0 bottom-0 z-10 max-h-full translate-y-3 overflow-auto bg-(--is-void)/94 p-4 opacity-0 backdrop-blur-md duration-300 ease-(--is-ease) group-hover:transition-[opacity,translate] group-focus:transition-[opacity,translate] group-focus-within:transition-[opacity,translate] group-hover:translate-y-0 group-hover:opacity-100 group-focus:translate-y-0 group-focus:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 motion-reduce:translate-y-0 motion-reduce:transition-none pointer-coarse:static pointer-coarse:flex-1 max-xl:flex-1 pointer-coarse:max-h-none pointer-coarse:translate-y-0 pointer-coarse:border-t pointer-coarse:border-(--is-line) pointer-coarse:bg-(--is-void) pointer-coarse:opacity-100 pointer-coarse:backdrop-blur-none max-xl:static max-xl:max-h-none max-xl:translate-y-0 max-xl:border-t max-xl:border-(--is-line) max-xl:bg-(--is-void) max-xl:opacity-100 max-xl:backdrop-blur-none"
        >
          <dl className="grid grid-cols-[3.6rem_1fr] gap-x-3 gap-y-2 text-[13px] leading-snug">
            <dt className={`${MONO} pt-px text-[10px] uppercase tracking-[0.16em] text-(--is-fiber)`}>Take</dt>
            <dd className="text-(--is-frost)">{a.note.take}</dd>
            <dt className={`${MONO} pt-px text-[10px] uppercase tracking-[0.16em] text-(--is-steel)`}>Goes</dt>
            <dd className="text-(--is-frost)">{a.note.where}</dd>
            <dt className={`${MONO} pt-px text-[10px] uppercase tracking-[0.16em] text-(--is-fault)`}>Leave</dt>
            <dd className="text-(--is-frost)">{a.note.leave}</dd>
          </dl>
        </div>
      </div>
      <figcaption className={`${MONO} relative z-10 flex items-center gap-3 border-t border-(--is-line) bg-(--is-panel) px-3 py-2 text-[10px] uppercase tracking-[0.14em]`}>
        <span className="text-(--is-steel)">[ {idx} ]</span>
        <span id={`${id}-t`} className="min-w-0 flex-1 truncate text-(--is-frost)">
          {a.title}
        </span>
        <span className="hidden shrink-0 text-(--is-steel) sm:inline">{a.credit ?? a.kind}</span>
        {a.gen ? (
          <span className="shrink-0 text-(--is-fiber)" aria-label="generated by the agent" title="generated by your agent">
            ✦
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}

export default function IntenseSpaceBoard() {
  const fiber = fiberStrands();
  const t1 = table1();
  const P = "/mood-boards/intense-space/";

  const artifacts: Artifact[] = [
    {
      title: "Fiber field · real scores",
      kind: "texture",
      gen: true,
      size: "8x6",
      m: "aspect-[4/5] md:aspect-[16/10]",
      wide: true,
      credit: "Our data",
      body: (
        <div className="absolute inset-0 bg-(--is-charcoal)">
          <FiberField strands={fiber.strands} />
          <p className={`${MONO} pointer-events-none absolute bottom-4 right-4 rounded-[2px] bg-(--is-void)/85 px-2.5 py-1.5 text-[10px] uppercase leading-relaxed tracking-[0.16em] text-(--is-frost)`}>
            [ {fiber.strands.length} strands · {fiber.perStrand.toLocaleString("en-US")} timesteps each ]
            <br />
            <span className="text-(--is-fault)">■</span> labelled fault <span className="ml-2 text-(--is-fiber)">■</span> GMM score
          </p>
        </div>
      ),
      note: {
        take: "A full-bleed generative field where every strand is one slice of the M1 test set: brightness is the score, magenta marks labelled faults, and the whole field shears slowly sideways.",
        where: "Explorer hero, behind the one-sentence finding, with a Pause control top-right and the legend chip bottom-right.",
        leave: "Random decorative strands. If a line can't be traced to a measurement, it doesn't ship.",
      },
    },
    {
      title: "Art field, headline low-left",
      kind: "interface",
      size: "4x3",
      m: "aspect-[3/2]",
      credit: "via icomat.co.uk",
      img: P + "via-icomat-fiber-hero.jpg",
      alt: "Crop of the ICOMAT homepage hero: thin green and magenta vertical lines on charcoal, with a two-line white headline in the bottom-left corner.",
      pos: "left bottom",
      note: {
        take: "Generative art owns about 70% of the frame; a two-line semibold headline sits in the bottom-left corner at roughly 1/8 of the frame height.",
        where: "The explorer's first viewport: FiberField full-bleed, our finding anchored low-left.",
        leave: "An even split of green and magenta strands. Ours stay Frost and green, with magenta only where a fault is.",
      },
    },
    {
      title: "Dot-matrix numerals",
      kind: "type",
      gen: true,
      size: "4x3",
      credit: "Doto",
      body: <DotoNumerals t={t1} />,
      note: {
        take: "Doto 600 for the one number that matters, at about 6× the label size, with the runners-up in a hairline-ruled 2-column list.",
        where: "Results headline metric and the method detail panel. Three Doto numbers per view at most.",
        leave: "Dot-matrix for body copy or long tables. It's a callout face only.",
      },
    },
    {
      title: "Word-by-word finding",
      kind: "interface",
      gen: true,
      size: "6x4",
      credit: "Scroll reveal",
      body: (
        <div className="flex h-full flex-col justify-between gap-6 p-6">
          <p className={`${MONO} text-[10px] uppercase tracking-[0.2em] text-(--is-steel)`}>[ Scroll ] the finding brightens as you read</p>
          <WordReveal
            lead="The finding."
            text="ESA telemetry has real latent structure at the operational-group level, 18 to 29 modes, not the subsystem level of 4 to 5. That multi-modality is why global detectors fail."
          />
        </div>
      ),
      note: {
        take: "Scroll-scrubbed brightness: words you've read go Frost, upcoming words wait at 42%, and once lit they stay lit. The lead-in stays Steel.",
        where: "The statement paragraph between the hero and the method comparison, capped near 26 words per line.",
        leave: "Scroll-jacking. The page scrolls normally and the text reads fine without motion.",
      },
    },
    {
      title: "Tiers facing one wall",
      kind: "photo",
      size: "3x4",
      m: "aspect-[4/3]",
      credit: "NASA",
      img: P + "nasa-apollo7-mission-control.jpg",
      alt: "Mission Control in Houston, 1968: tiered rows of consoles with small monitors, all facing a wall of large projected plots.",
      pos: "30% center",
      note: {
        take: "Tiered rows of small screens, all facing one large shared display: one big figure, many small readouts.",
        where: "Method comparison: one full-width PR figure on top, method cards in a row beneath it.",
        leave: "The beige surfaces and knob skeuomorphism.",
      },
    },
    {
      title: "Palette · contrast",
      kind: "color",
      gen: true,
      size: "3x4",
      credit: "WCAG",
      body: <Palette />,
      note: {
        take: "Three dark grounds, Frost text, one green accent, magenta for faults, teal for outlines. Every ratio is computed from the hex values.",
        where: "Design-system color roles and the token table.",
        leave: "Green or magenta body text, and any gradient between them.",
      },
    },
    {
      title: "Color budget · fault share",
      kind: "color",
      gen: true,
      size: "6x2",
      m: "",
      wide: true,
      credit: "Our data",
      body: <ColorBudget f={faultShare()} />,
      note: {
        take: "The data sets magenta's area: each slice fills only as far as it is labelled fault, 11.1% on M1 and 4.7% on M2.",
        where: "Timeline legends and the mission toggle; one teal box, one green action.",
        leave: "Magenta as decoration. No fault, no magenta.",
      },
    },
    {
      title: "Converging feeds",
      kind: "photo",
      size: "3x4",
      m: "aspect-[4/3]",
      credit: "NASA",
      img: P + "nasa-msfc-fiber-placement.jpg",
      alt: "A white automated fiber placement robot with a ring of composite tow spools feeding one head, an engineer standing beside it for scale.",
      pos: "65% center",
      note: {
        take: "A ring of identical feeds converging on one head: radial repetition that resolves to a single point.",
        where: "The composition behind the 76 → 18 → 4 figure: many identical lines resolving into a few.",
        leave: "The busy floor; crop tight to the head and spools.",
      },
    },
    {
      title: "Display · Host Grotesk",
      kind: "type",
      gen: true,
      size: "3x4",
      credit: "Type",
      body: <DisplaySpecimen />,
      note: {
        take: "Semibold sentence case at −4.5% tracking for claims; light all-caps with the first line stepped in 2.2em for section openers.",
        where: "Display, headings and body across the explorer.",
        leave: "Bold all-caps. Caps stay light, and claims stay in sentence case.",
      },
    },
    {
      title: "76 → 18 → 4 · steered channels",
      kind: "interface",
      gen: true,
      size: "6x5",
      m: "aspect-[600/430]",
      wide: true,
      credit: "Our data",
      body: (
        <div className="absolute inset-0 p-4">
          <ChannelTree tree={channelTree()} />
        </div>
      ),
      note: {
        take: "Hierarchy drawn as steered fiber: 76 hairlines curve into 18 nodes, and those merge into 4 green bundles weighted by channel count. Paths draw in over 1.6s.",
        where: "The 'where does the structure live' figure, with K* marked in teal against the group row.",
        leave: "Curves as ornament. Each path is one ESA channel and its true group.",
      },
    },
    {
      title: "One light source on black",
      kind: "photo",
      size: "3x3",
      m: "aspect-[3/2]",
      credit: "NASA",
      img: P + "nasa-rs25-night-test.jpg",
      alt: "An engine test stand at night, lit gold, with a huge plume of steam reflected in dark water.",
      pos: "70% center",
      note: {
        take: "All the luminance in one place, mirrored once, with everything else close to black.",
        where: "Anomaly moments on the timeline: one bright event while the rest of the strip stays low.",
        leave: "The warm gold. Our heat is magenta, and it's rationed.",
      },
    },
    {
      title: "Fragment Mono labels",
      kind: "type",
      gen: true,
      size: "3x3",
      credit: "Type",
      body: <MonoSpecimen />,
      note: {
        take: "10–11px mono caps at 0.1em for nav and captions, opened up to 0.42em for overlines, with a Frost-filled tag for the active item.",
        where: "Nav, figure captions, axis labels and bracket tags.",
        leave: "Mono paragraphs. It's for labels only.",
      },
    },
    {
      title: "AOI windows · numbered",
      kind: "interface",
      gen: true,
      size: "6x3",
      m: "",
      wide: true,
      credit: "Our data",
      body: <AoiStrip aoi={aoiWindows()} />,
      note: {
        take: "Thin teal boxes outline the five highest windows on one Frost trace, numbered 01–05 in mono, with a hairline-ruled index beneath that tells you honestly whether each one hits a labelled fault.",
        where: "The evidence strip: each numbered window deep-links to its detail view, and the index doubles as keyboard entry points.",
        leave: "Filled highlight bands. An outline marks the region without hiding the trace.",
      },
    },
    {
      title: "Controls · bracketed states",
      kind: "interface",
      gen: true,
      size: "6x3",
      credit: "UI",
      body: <Controls />,
      note: {
        take: "Green fill on the primary action only; everything else is a hairline or a bracketed mono tag, with five visible states.",
        where: "Mission toggle, method filter chips, sort, and the primary CTA.",
        leave: "Pills for everything, and accent-colored secondary buttons.",
      },
    },
    {
      title: "Hairline over a dense field",
      kind: "photo",
      size: "3x3",
      m: "aspect-[3/2]",
      credit: "NASA",
      img: P + "nasa-iss-aurora-city-lights.jpg",
      alt: "Night view from orbit: a thin green aurora along the horizon above dense orange points of city light.",
      note: {
        take: "One thin luminous line running over thousands of small points: a single highlighted series above a dense scatter.",
        where: "Latent t-SNE map: one teal cluster lifted over Frost dots at low opacity.",
        leave: "The orange cast.",
      },
    },
    {
      title: "BIC sweep · light trace",
      kind: "interface",
      gen: true,
      size: "6x4",
      m: "aspect-[600/270]",
      wide: true,
      credit: "Our data",
      body: (
        <div className="absolute inset-0 px-4 py-2">
          <BicTrace bic={bicSweeps()} />
        </div>
      ),
      note: {
        take: "Two traces with a soft 4px glow under a crisp 1.4px line, drawn in over 2.6s; a square marker lands on each minimum.",
        where: "Parametric section: 'how many modes are there?'",
        leave: "A gridline on every tick. Four dashed references are enough.",
      },
    },
    {
      title: "HUD readout · M2",
      kind: "interface",
      gen: true,
      size: "3x4",
      credit: "Our data",
      body: <Hud spark={hudSpark()} />,
      note: {
        take: "A key:value readout in two mono columns, framed with 4px corner ticks, with a sparkline and a blinking live cursor.",
        where: "Method detail panel header, and the mission stats in the toggle.",
        leave: "Green body text. Only the live status gets the accent.",
      },
    },
    {
      title: "PR fiber bundle",
      kind: "interface",
      gen: true,
      size: "3x4",
      m: "aspect-square",
      credit: "Our data",
      body: (
        <div className="absolute inset-0 p-3">
          <PrBundle curves={prBundle()} />
        </div>
      ),
      note: {
        take: "Every saved run as a faint fiber; the best one in Survey Teal at 1.8px, with an outlined high-precision region.",
        where: "Compare-methods figure. Hovering a fiber lifts it.",
        leave: "Sixteen legend colors. One highlight, and the rest stay Frost.",
      },
    },
    {
      title: "Cool grey under low light",
      kind: "photo",
      size: "3x3",
      m: "aspect-[3/2]",
      credit: "NASA",
      img: P + "nasa-iss-moonlit-array.jpg",
      alt: "A gridded solar array lit silver-blue by moonlight against black, above a faint line of airglow.",
      pos: "center 40%",
      note: {
        take: "A gridded surface in silver-blue on black: cool neutrals carry the whole frame, with no warm tones anywhere.",
        where: "Reference for Frost and Steel. Panels and borders stay cool grey, never warm.",
        leave: "A frame that's only black. Pair it with data.",
      },
    },
    {
      title: "Half in focus",
      kind: "type",
      size: "3x3",
      m: "aspect-[152/46]",
      credit: "via planet.com",
      img: P + "via-planet-undetected-hero.jpg",
      fit: "contain",
      alt: "Crop of a bold white all-caps headline on black, its first two letters blurred and faded and the rest sharp, above a two-line light subhead.",
      note: {
        take: "Focus as meaning: the out-of-focus letters are the 'not yet' state, and sharpness is the arrival.",
        where: "Anomaly labels as the timeline scrubs past a fault, and the hero keyword.",
        leave: "The geometric display face. Our blur runs on Host Grotesk.",
      },
    },
    {
      title: "Blur to focus",
      kind: "type",
      gen: true,
      size: "3x3",
      credit: "Motion",
      body: <BlurTile />,
      note: {
        take: "Letters resolve from a 14px blur, 140ms apart, ease-out, so the word arrives the way a detection does.",
        where: "The hero keyword and anomaly callouts. Static and sharp under reduced motion.",
        leave: "Looping it anywhere someone is trying to read.",
      },
    },
    {
      title: "Lamp grid, short caps",
      kind: "type",
      size: "3x4",
      m: "aspect-[8/7]",
      credit: "NASA",
      img: P + "nasa-dsky-f8.jpg",
      alt: "An Apollo-era display and keyboard unit: a grid of rectangular warning lamps engraved with short all-caps labels, a numeric readout window, and square keys.",
      pos: "center",
      note: {
        take: "A fixed grid of cells, each with a short engraved caps label; state shows by which cell lights, never by rewording it. Square keys with one- or two-word labels.",
        where: "The method status grid (fixed cells, the active one lit Frost) and the keyboard shortcuts for the mission toggle.",
        leave: "The bevels and screws. Keep the grid and the labels, and drop the hardware.",
      },
    },
    {
      title: "Red only where it's guarded",
      kind: "color",
      size: "4x3",
      m: "aspect-[2/1]",
      credit: "NASA",
      img: P + "nasa-atlantis-flight-deck.jpg",
      alt: "An orbiter's overhead flight-deck panels: hundreds of grey toggle switches in labelled rows, with red reserved for the few guarded switches.",
      pos: "center 30%",
      note: {
        take: "Hundreds of controls on one grey, with red kept for the few guarded switches: color rationed by consequence.",
        where: "The rule behind our accents: green for the one primary action, magenta only for faults, grey for everything else.",
        leave: "The blue patches. They break the one-neutral rule.",
      },
    },
    {
      title: "Repeated units, one axis",
      kind: "photo",
      size: "6x2",
      m: "aspect-[3/1] md:aspect-[9/2]",
      wide: true,
      credit: "NASA/JPL-Caltech",
      img: P + "nasa-dsn-madrid-array.jpg",
      alt: "Several large dish antennas at night, all pointed the same way, lit against a dark sky.",
      pos: "center 50%",
      note: {
        take: "Identical units, all aligned to one shared direction: repetition that reads as a system.",
        where: "Small multiples for M1 and M2, sharing one baseline and one scale.",
        leave: "The wide landscape. Crop to the units.",
      },
    },
    {
      title: "Parallel streaks into black",
      kind: "texture",
      size: "6x2",
      m: "aspect-[9/2]",
      wide: true,
      credit: "NASA/JPL-Caltech/SSI",
      img: P + "nasa-cassini-edge-of-night.jpg",
      alt: "Thin bright parallel streaks of a planet's rings crossing diagonally into darkness.",
      note: {
        take: "A gradient made of lines, not fills: thin parallel streaks fading out on a diagonal.",
        where: "The divider band between findings and evidence, drawn as strands rather than a fill.",
        leave: "Using it as a hero. It supports; it doesn't lead.",
      },
    },
    {
      title: "Fibres into one strand",
      kind: "texture",
      size: "3x4",
      m: "aspect-square",
      credit: "CSIRO",
      img: P + "csiro-nanotube-yarn.jpg",
      alt: "Electron micrograph in greyscale: a fan of thousands of fine parallel fibres drawn off an edge and converging into a single thin strand.",
      pos: "70% center",
      note: {
        take: "Thousands of hairlines converging to one line under raking light; each strand is faint, and the bundle gets brighter as it tightens.",
        where: "Physical reference for FiberField and the channel tree: strand opacity rises as lines bundle.",
        leave: "The grey micrograph ground. Ours is flat Void.",
      },
    },
    {
      title: "Grain + scanlines",
      kind: "texture",
      gen: true,
      size: "4x3",
      m: "aspect-[3/2]",
      credit: "Texture",
      body: <Grain />,
      note: {
        take: "Fine fractal noise and 3px scanlines over charcoal, vignetted to void.",
        where: "Behind the hero and section openers only, at low opacity.",
        leave: "Texture under charts or text blocks.",
      },
    },
    {
      title: "Registration grid",
      kind: "texture",
      gen: true,
      size: "4x3",
      m: "aspect-[3/2] md:aspect-[3/1]",
      wide: true,
      credit: "Texture",
      body: <RegGrid />,
      note: {
        take: "An 18px dot grid plus 4px corner ticks, so each figure is framed like a drawing sheet.",
        where: "The frame for every chart card on the results page.",
        leave: "Heavy borders. Ticks and hairlines only.",
      },
    },
  ];

  const ORDER = [
    "Fiber field · real scores", "Art field, headline low-left", "Dot-matrix numerals",
    "Word-by-word finding", "Tiers facing one wall", "Palette · contrast",
    "Color budget · fault share", "Converging feeds", "Display · Host Grotesk",
    "76 → 18 → 4 · steered channels", "One light source on black", "Fragment Mono labels",
    "AOI windows · numbered", "Controls · bracketed states",
    "BIC sweep · light trace", "HUD readout · M2", "PR fiber bundle",
    "Hairline over a dense field", "Cool grey under low light", "Half in focus", "Blur to focus",
    "Lamp grid, short caps", "Fibres into one strand", "Parallel streaks into black", "Repeated units, one axis",
    "Red only where it's guarded", "Grain + scanlines", "Registration grid",
  ];
  artifacts.sort((a, b) => ORDER.indexOf(a.title) - ORDER.indexOf(b.title));

  const collected = artifacts.filter((a) => !a.gen).length;
  const generated = artifacts.length - collected;
  const credits = artifacts.map((a, i) => ({ a, n: i + 1 })).filter(({ a }) => !a.gen);

  return (
    <main className={`${display.variable} ${mono.variable} ${dot.variable} is-root min-h-screen w-full`}>
      {/* top bar */}
      <header className={`${MONO} sticky top-0 z-30 border-b border-(--is-line) bg-(--is-void)/85 backdrop-blur-md`}>
        <div className="mx-auto flex h-12 max-w-[1920px] items-center justify-between gap-4 px-4 text-[11px] uppercase tracking-[0.16em] sm:px-6">
          <Link
            href="/"
            className="rounded-[2px] px-1 py-1 text-(--is-frost) transition-colors duration-200 hover:text-(--is-fiber) active:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--is-frost)"
          >
            ← Hub
          </Link>
          <span className="hidden text-(--is-steel) md:inline">[ Mood board · Intense space ]</span>
          <span className="text-(--is-steel)">{artifacts.length} artifacts</span>
        </div>
      </header>

      <div className="mx-auto max-w-[1920px] px-4 sm:px-6">
        {/* registration marks on the 12-col rhythm */}
        <div aria-hidden className="mt-6 hidden h-1 grid-cols-12 gap-3 lg:grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="h-1 w-1 bg-(--is-steel)" />
          ))}
        </div>

        {/* title block */}
        <section className="grid gap-8 pb-10 pt-10 lg:grid-cols-12 lg:gap-3 lg:pb-12 lg:pt-14">
          <div className="lg:col-span-8">
            <p className={`${MONO} mb-5 text-[10px] uppercase tracking-[0.42em] text-(--is-steel)`}>Mood · ESA telemetry findings</p>
            <h1 className="text-[clamp(40px,7.4vw,112px)] font-semibold leading-[0.9] tracking-[-0.045em] text-(--is-frost)">
              Charged <span className="text-(--is-steel)">·</span> Fibrous <span className="text-(--is-steel)">·</span>
              <br />
              <span className="font-light uppercase tracking-[-0.02em]">Instrumented</span>
            </h1>
          </div>
          <div className="flex flex-col justify-end gap-5 lg:col-span-4">
            <p className="max-w-[46ch] text-[16px] leading-[1.45] text-(--is-frost)">{board.summary}</p>
            <div className={`${MONO} flex flex-col gap-2 border-t border-(--is-line) pt-4 text-[11px] uppercase tracking-[0.12em]`}>
              <p className="text-(--is-frost)">
                {artifacts.length} artifacts: photos, type, color, texture, and interface pieces
              </p>
              <p className="text-(--is-steel)">
                {collected} collected · {generated} generated · <span className="text-(--is-fiber)">✦</span> generated by your agent
              </p>
              <p className="text-(--is-steel)">
                <span className="max-xl:hidden pointer-coarse:hidden">Hover or focus any piece for its note</span>
                <span className="hidden max-xl:inline pointer-coarse:inline">Each piece&apos;s note sits beneath it</span>
              </p>
            </div>
          </div>
        </section>

        {/* mosaic */}
        <section aria-label="Mood board artifacts" className="grid grid-cols-1 gap-3 md:grid-flow-dense md:grid-cols-2 xl:pointer-fine:grid-flow-dense xl:pointer-fine:auto-rows-[clamp(76px,5.28vw,101px)] xl:pointer-fine:grid-cols-12">
          {artifacts.map((a, i) => (
            <Tile key={a.title} a={a} n={i + 1} />
          ))}
        </section>

        {/* credits */}
        <section aria-labelledby="is-credits" className="mt-20 grid gap-6 border-t border-(--is-line) pb-24 pt-8 lg:grid-cols-12 lg:gap-3">
          <h2 id="is-credits" className={`${MONO} text-[10px] uppercase tracking-[0.42em] text-(--is-steel) lg:col-span-3`}>
            Credits
          </h2>
          <ol className="lg:col-span-9">
            {credits.map(({ a, n }) => (
              <li key={n} className="grid grid-cols-[3rem_1fr] gap-3 border-b border-(--is-line) py-3 text-[13px] leading-snug sm:grid-cols-[3rem_1fr_auto]">
                <span className={`${DOTCLS} text-[18px] font-semibold leading-none text-(--is-steel)`}>{String(n).padStart(2, "0")}</span>
                <span className="text-(--is-frost)">
                  {a.title} <span className="text-(--is-steel)">· {CREDITS[a.title]?.detail}</span>
                </span>
                <a
                  href={CREDITS[a.title]?.href}
                  className={`${MONO} col-start-2 rounded-[2px] text-[11px] uppercase tracking-[0.12em] text-(--is-frost) underline decoration-(--is-line) underline-offset-4 transition-colors duration-200 hover:decoration-(--is-frost) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--is-frost) sm:col-start-3`}
                >
                  {a.credit} ↗
                </a>
              </li>
            ))}
          </ol>
          <p className={`${MONO} text-[11px] uppercase leading-relaxed tracking-[0.12em] text-(--is-steel) lg:col-span-9 lg:col-start-4`}>
            NASA imagery is public domain (NASA media guidelines). The CSIRO micrograph is CC BY 3.0. The two website crops are reference screenshots for study only. ✦ pieces are drawn in code from our
            exported figure data and Table 1 of Madhogarhia &amp; Watkins.
          </p>
        </section>
      </div>
    </main>
  );
}

const DOTCLS = "font-(family-name:--font-is-dot)";

const CREDITS: Record<string, { detail: string; href: string }> = {
  "Art field, headline low-left": { detail: "ICOMAT homepage hero, screenshot crop", href: "https://www.icomat.co.uk" },
  "Tiers facing one wall": { detail: "NASA/JSC, S68-49301, 1968", href: "https://images.nasa.gov/details/S68-49301" },
  "Converging feeds": { detail: "NASA/MSFC, MSFC-1501218, 2015", href: "https://images.nasa.gov/details/MSFC-1501218" },
  "One light source on black": { detail: "NASA/SSC, SSC-2015-00064, 2015", href: "https://images.nasa.gov/details/SSC-2015-00064" },
  "Hairline over a dense field": { detail: "NASA/JSC, ISS Expedition 29, iss029e012564, 2011", href: "https://images.nasa.gov/details/iss029e012564" },
  "Cool grey under low light": { detail: "NASA/JSC, ISS Expedition 73, iss073e0039722, 2025", href: "https://images.nasa.gov/details/iss073e0039722" },
  "Half in focus": { detail: "Planet homepage hero, screenshot crop", href: "https://www.planet.com" },
  "Lamp grid, short caps": { detail: "NASA/Dennis Taylor, EC96-43408-1, 1996, public domain, via Wikimedia Commons", href: "https://commons.wikimedia.org/wiki/File:Apollo_display_and_keyboard_unit_(DSKY)_used_on_F-8_DFBW_DVIDS683588.jpg" },
  "Red only where it's guarded": { detail: "NASA/KSC, KSC-2011-8368, 2011", href: "https://images.nasa.gov/details/KSC-2011-8368" },
  "Repeated units, one axis": { detail: "NASA/JPL-Caltech, PIA26147, 2024", href: "https://images.nasa.gov/details/PIA26147" },
  "Parallel streaks into black": { detail: "NASA/JPL-Caltech/Space Science Institute, PIA17199", href: "https://images.nasa.gov/details/PIA17199" },
  "Fibres into one strand": { detail: "CSIRO ScienceImage 1074, 2005, CC BY 3.0, cropped and greyscaled, via Wikimedia Commons", href: "https://commons.wikimedia.org/wiki/File:CSIRO_ScienceImage_1074_Carbon_nanotubes_being_spun_to_form_a_yarn.jpg" },
};
