import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Doto, Fragment_Mono, Host_Grotesk } from "next/font/google";
import "./board.css";
import { board } from "./meta";
import { bicSweeps, channelTree, fiberStrands, hudSpark, prBundle, table1 } from "./data";
import { FiberField } from "./fiber-field";
import { WordReveal } from "./word-reveal";
import {
  BicTrace,
  BlurTile,
  ChannelTree,
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
      title: "Fiber field · M1 GMM scores",
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
        take: "One strand per slice of the Mission 1 test set: brightness is the GMM score against its local baseline, faults burn magenta, the field shears like steered tow.",
        where: "Hero of the site, behind the one-sentence finding, with a pause control.",
        leave: "Random glitch strands. Every line must be a real measurement.",
      },
    },
    {
      title: "Fiber hero",
      kind: "photo",
      size: "4x3",
      m: "aspect-[3/2]",
      credit: "via icomat.co.uk",
      img: P + "via-icomat-fiber-hero.jpg",
      alt: "Crop of the ICOMAT homepage: vivid green and magenta vertical fiber lines on charcoal behind the headline Engineer Without Limits.",
      pos: "left bottom",
      note: {
        take: "Charcoal field, vertical strands, a headline anchored bottom-left with 70% of the frame left to the art.",
        where: "Hero composition and the site's opening viewport.",
        leave: "The trademark-heavy marketing headline and the even green/magenta mix.",
      },
    },
    {
      title: "Dot-matrix numerals · Table 1",
      kind: "type",
      gen: true,
      size: "4x3",
      credit: "Doto",
      body: <DotoNumerals t={t1} />,
      note: {
        take: "Doto for the few numbers that matter: the best PR-AUC per mission, read like an instrument display.",
        where: "Results headline figures and the method detail panel.",
        leave: "Dot-matrix for body copy or long tables; it is a callout face only.",
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
        take: "Scroll-scrubbed brightness: read words go Frost, upcoming words wait at 42%, and once lit they stay lit.",
        where: "The statement paragraph between the hero and the method comparison.",
        leave: "Scroll-jacking. The page scrolls normally and the text is readable without motion.",
      },
    },
    {
      title: "Mission Control, Apollo 7",
      kind: "photo",
      size: "3x4",
      m: "aspect-[4/3]",
      credit: "NASA",
      img: P + "nasa-apollo7-mission-control.jpg",
      alt: "Mission Control in Houston on the first day of Apollo 7, 1968: rows of consoles with small monitors facing a wall of projected plots.",
      pos: "30% center",
      note: {
        take: "Rows of consoles all facing one plot wall: many channels, one shared picture.",
        where: "Mood for the method comparison grid, where every method faces the same data.",
        leave: "Beige retro nostalgia and skeuomorphic knobs.",
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
        take: "Void and charcoal grounds, Frost text, one green accent, magenta only for faults, teal only for outlined data regions.",
        where: "Design-system color roles; ratios are computed from the hex values.",
        leave: "Green or magenta on body text, and any gradients between them.",
      },
    },
    {
      title: "Word reveal, live",
      kind: "type",
      size: "6x2",
      m: "aspect-[5/1]",
      wide: true,
      credit: "via icomat.co.uk",
      img: P + "via-icomat-word-reveal.jpg",
      alt: "Crop of ICOMAT's dark 'How we operate' paragraph mid-reveal: bright grey words followed by dimmed upcoming words.",
      pos: "left center",
      note: {
        take: "48px statement set edge to edge, with the read/unread split visible mid-sentence.",
        where: "Reference for the finding paragraph's size and the dim alpha.",
        leave: "The full-bleed width on desktop; cap our measure near 26 words per line.",
      },
    },
    {
      title: "Automated fiber placement",
      kind: "photo",
      size: "3x4",
      m: "aspect-[4/3]",
      credit: "NASA",
      img: P + "nasa-msfc-fiber-placement.jpg",
      alt: "NASA Marshall's automated fiber placement robot, a white arm with a ring of composite tow spools, beside an engineer for scale.",
      pos: "65% center",
      note: {
        take: "Real hardware that lays steered fiber: the physical source of the strand metaphor.",
        where: "Methods intro image, captioned with the tool and source.",
        leave: "Factory-floor clutter; crop tight to the head and spools.",
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
        take: "A Lay-Grotesk-like grotesk: semibold sentence case for claims, light all-caps with a stepped indent for section openers.",
        where: "Display, headings and body across the site.",
        leave: "Bold all-caps shouting; caps stay light (Helion), claims stay sentence case (ICOMAT).",
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
        take: "The real channel hierarchy as steered fibers: channels curve into groups, groups merge into subsystems.",
        where: "The 'where does the structure live' figure, with GMM's K* marked against the groups.",
        leave: "Decorative curves; each path is one ESA channel and its true group.",
      },
    },
    {
      title: "RS-25 night test",
      kind: "photo",
      size: "3x3",
      m: "aspect-[3/2]",
      credit: "NASA",
      img: P + "nasa-rs25-night-test.jpg",
      alt: "An RS-25 engine hot-fire test at night at Stennis Space Center: a tower lit gold, a huge plume of steam reflected in the water.",
      pos: "70% center",
      note: {
        take: "Contained energy in the dark: one hot light source against a black field.",
        where: "Tone for anomaly moments; the one bright event on a dark timeline.",
        leave: "The warm gold palette; our heat is magenta.",
      },
    },
    {
      title: "Mono labels · Fragment Mono",
      kind: "type",
      gen: true,
      size: "3x3",
      credit: "Type",
      body: <MonoSpecimen />,
      note: {
        take: "Akkurat-like mono, 10–11px caps for nav and captions; wide 0.42em tracking for overlines (NASA Eyes).",
        where: "Nav, figure captions, axis labels, bracket tags.",
        leave: "Mono for paragraphs. Labels only.",
      },
    },
    {
      title: "Lab hero, light caps",
      kind: "photo",
      size: "6x3",
      m: "aspect-[11/6]",
      credit: "via helionenergy.com",
      img: P + "via-helion-lab-hero.jpg",
      alt: "Crop of Helion's homepage: a technician in a helmet facing the fusion machine, under the light all-caps headline Fusion built to power our world.",
      pos: "center bottom",
      note: {
        take: "Light all-caps over real lab footage, first line stepped in.",
        where: "Section openers: 'Methods', 'Missions', 'Evidence'.",
        leave: "A hero with no subhead; ours always says what the model does.",
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
        take: "Green fill only on the primary action; everything else is a hairline or a bracketed mono tag, with five visible states.",
        where: "Mission toggle, method filter chips, sort, and the primary CTA.",
        leave: "Pill-shaped everything and accent-colored secondary buttons.",
      },
    },
    {
      title: "Aurora over city lights",
      kind: "photo",
      size: "3x3",
      m: "aspect-[3/2]",
      credit: "NASA",
      img: P + "nasa-iss-aurora-city-lights.jpg",
      alt: "Night view from the International Space Station: a green aurora along the horizon above dense orange city lights.",
      note: {
        take: "Thin green light along a dark limb above thousands of points: signal over a dense field.",
        where: "Background mood for the latent t-SNE map.",
        leave: "The orange sodium cast.",
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
        take: "The real BIC curves as glowing traces; the minimum lands at the group count, not the subsystem count.",
        where: "Parametric section: 'how many modes are there?'",
        leave: "Gridlines on every tick; four dashed references are enough.",
      },
    },
    {
      title: "Undetected, half in focus",
      kind: "type",
      size: "3x3",
      m: "aspect-[152/46]",
      credit: "via planet.com",
      img: P + "via-planet-undetected-hero.jpg",
      fit: "contain",
      alt: "Crop of Planet's hero on black: the word UNDETECTED with UN blurred and faded and DETECTED sharp, over the line Decision advantage with rapid change detection.",
      note: {
        take: "Blur as meaning: out of focus means not yet detected.",
        where: "Anomaly labels as the timeline scrubs past a fault.",
        leave: "The cookie banner and the corporate geometric face.",
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
        take: "Letters resolve from 14px blur, 140ms apart, ease-out; the word arrives the way a detection does.",
        where: "The hero keyword and anomaly callouts. Static and sharp under reduced motion.",
        leave: "Looping it anywhere a reader is trying to read.",
      },
    },
    {
      title: "AOI slab",
      kind: "interface",
      size: "6x2",
      m: "aspect-[110/29]",
      credit: "via planet.com",
      img: P + "via-planet-aoi-slab.jpg",
      alt: "Crop of Planet's isometric slab of Washington State imagery with thin teal rectangles outlining areas of interest.",
      note: {
        take: "Thin teal outlines boxing regions of interest on a tilted data slab.",
        where: "Boxing detected anomaly windows on the long channel strip.",
        leave: "Satellite photo texture; our slab is a telemetry strip.",
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
        take: "Terminal-style key:value readout with corner ticks and a live score sparkline.",
        where: "Method detail panel header; mission stats in the toggle.",
        leave: "Green body text; only the live status takes the accent.",
      },
    },
    {
      title: "Webb mirrors, cleanroom",
      kind: "photo",
      size: "3x4",
      m: "aspect-[3/2]",
      credit: "NASA",
      img: P + "nasa-webb-mirror-cleanroom.jpg",
      alt: "Technicians in white cleanroom suits inspecting gold James Webb Space Telescope flight mirror segments.",
      pos: "60% center",
      note: {
        take: "Clinical precision: white suits, controlled light, one gold surface.",
        where: "The rigor note: 'what we verified against the notebooks'.",
        leave: "The gold; it fights Frost and Teal.",
      },
    },
    {
      title: "PR curves · fiber bundle",
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
        take: "Every saved M2 run as a faint fiber, the best one in Survey Teal with an outlined high-precision region.",
        where: "Compare-methods figure; hover a fiber to lift it.",
        leave: "Sixteen legend colors. One highlight, the rest Frost.",
      },
    },
    {
      title: "Deep Space Network, Madrid",
      kind: "photo",
      size: "3x4",
      m: "aspect-[4/3]",
      credit: "NASA/JPL-Caltech",
      img: P + "nasa-dsn-madrid-array.jpg",
      alt: "Six Deep Space Network dish antennas at the Madrid complex at night, lit against a dark sky.",
      pos: "center 60%",
      note: {
        take: "An array listening in the dark: many receivers, one downlink. The telemetry's origin story.",
        where: "Missions section image, with an exact source caption.",
        leave: "Wide landscape; crop to the dishes.",
      },
    },
    {
      title: "Numbered entry points",
      kind: "interface",
      size: "4x3",
      m: "aspect-[84/40]",
      credit: "via science.nasa.gov",
      img: P + "via-nasa-eyes-numbered.jpg",
      alt: "Crop of NASA's Eyes landing page: a numbered list 01 to 03 in mono numerals with hairline rules between rows.",
      pos: "left top",
      note: {
        take: "Mono 01–05 numerals and hairline rules: a 'try this' list.",
        where: "The 'Explore the evidence' list, each row deep-linking to one anomaly.",
        leave: "The white background and red arrow badges.",
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
        take: "Fine noise and 3px scanlines over charcoal, vignetted to void.",
        where: "Behind hero and section openers only, at low opacity.",
        leave: "Texture under charts or text blocks.",
      },
    },
    {
      title: "Registration grid",
      kind: "texture",
      gen: true,
      size: "4x3",
      m: "aspect-[3/2]",
      credit: "Texture",
      body: <RegGrid />,
      note: {
        take: "Dot grid plus 4px corner ticks: each figure framed like a drawing sheet.",
        where: "Frame for every chart card on the results page.",
        leave: "Heavy borders; ticks and hairlines only.",
      },
    },
    {
      title: "Cassini · edge of the night",
      kind: "photo",
      size: "6x2",
      m: "aspect-[9/2]",
      wide: true,
      credit: "NASA/JPL-Caltech/SSI",
      img: P + "nasa-cassini-edge-of-night.jpg",
      alt: "Cassini view of Saturn's rings as thin bright streaks crossing into darkness at the planet's night side.",
      note: {
        take: "Rings as natural fibers: parallel bright lines fading into black.",
        where: "Section divider band between findings and evidence.",
        leave: "Using it as a literal hero; it supports, it doesn't lead.",
      },
    },
    {
      title: "Moonlit solar array",
      kind: "photo",
      size: "3x3",
      m: "aspect-[3/2]",
      credit: "NASA",
      img: P + "nasa-iss-moonlit-array.jpg",
      alt: "A space station solar array lit silver-blue by moonlight above Earth's faint airglow.",
      pos: "center 40%",
      note: {
        take: "Cool blue-grey light on a gridded panel: the Frost tone in the real world.",
        where: "Mood for the design system's cool neutrals.",
        leave: "The black-only frame; pair it with data.",
      },
    },
  ];

  const ORDER = [
    "Fiber field · M1 GMM scores", "Fiber hero", "Dot-matrix numerals · Table 1",
    "Word-by-word finding", "Mission Control, Apollo 7", "Palette · contrast",
    "Word reveal, live", "Automated fiber placement", "Display · Host Grotesk",
    "76 → 18 → 4 · steered channels", "RS-25 night test", "Mono labels · Fragment Mono",
    "Lab hero, light caps", "Controls · bracketed states",
    "BIC sweep · light trace", "HUD readout · M2", "PR curves · fiber bundle",
    "Aurora over city lights", "Moonlit solar array", "Undetected, half in focus", "Blur to focus",
    "AOI slab", "Webb mirrors, cleanroom", "Deep Space Network, Madrid", "Cassini · edge of the night",
    "Numbered entry points", "Grain + scanlines", "Registration grid",
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
            NASA imagery is public domain (NASA media guidelines). Website crops are reference screenshots for study only. ✦ pieces are drawn in code from our
            exported figure data and Table 1 of Madhogarhia &amp; Watkins.
          </p>
        </section>
      </div>
    </main>
  );
}

const DOTCLS = "font-(family-name:--font-is-dot)";

const CREDITS: Record<string, { detail: string; href: string }> = {
  "Fiber hero": { detail: "ICOMAT homepage hero, screenshot crop", href: "https://www.icomat.co.uk" },
  "Mission Control, Apollo 7": { detail: "NASA/JSC, S68-49301, 1968", href: "https://images.nasa.gov/details/S68-49301" },
  "Word reveal, live": { detail: "ICOMAT 'How we operate' section, screenshot crop", href: "https://www.icomat.co.uk" },
  "Automated fiber placement": { detail: "NASA/MSFC, MSFC-1501218, 2015", href: "https://images.nasa.gov/details/MSFC-1501218" },
  "RS-25 night test": { detail: "NASA/SSC, SSC-2015-00064, 2015", href: "https://images.nasa.gov/details/SSC-2015-00064" },
  "Lab hero, light caps": { detail: "Helion Energy homepage hero, screenshot crop", href: "https://www.helionenergy.com" },
  "Aurora over city lights": { detail: "NASA/JSC, ISS Expedition 29, iss029e012564, 2011", href: "https://images.nasa.gov/details/iss029e012564" },
  "Undetected, half in focus": { detail: "Planet homepage hero, screenshot crop", href: "https://www.planet.com" },
  "AOI slab": { detail: "Planet homepage, Washington mosaic slab, screenshot crop", href: "https://www.planet.com" },
  "Webb mirrors, cleanroom": { detail: "NASA/GSFC, GSFC_20171208_Archive_e001653", href: "https://images.nasa.gov/details/GSFC_20171208_Archive_e001653" },
  "Deep Space Network, Madrid": { detail: "NASA/JPL-Caltech, PIA26147, 2024", href: "https://images.nasa.gov/details/PIA26147" },
  "Numbered entry points": { detail: "NASA's Eyes landing page, screenshot crop", href: "https://science.nasa.gov/eyes/" },
  "Cassini · edge of the night": { detail: "NASA/JPL-Caltech/Space Science Institute, PIA17199", href: "https://images.nasa.gov/details/PIA17199" },
  "Moonlit solar array": { detail: "NASA/JSC, ISS Expedition 73, iss073e0039722, 2025", href: "https://images.nasa.gov/details/iss073e0039722" },
};
