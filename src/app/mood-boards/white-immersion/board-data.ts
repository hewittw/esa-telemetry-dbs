// Artifact list for the white-immersion board. Shared by the server page and the client stage.
// Order = guided-tour order = keyboard (Tab / arrow) order.

export type Kind = "photo" | "type" | "color" | "texture" | "interface" | "data";

export type GenKey =
  | "ridges" | "display" | "mono" | "controls" | "palette" | "frost" | "facets"
  | "hierarchy" | "hud" | "scramble" | "bic" | "zoom" | "grain" | "shards" | "signal";

export type Artifact = {
  id: string;
  short: string; // label shown under the card in the field
  title: string;
  kind: Kind;
  generated: boolean;
  take: string;
  where: string;
  leave: string;
  // collected
  src?: string;
  alt?: string;
  imgW?: number;
  imgH?: number;
  credit?: string;
  creditUrl?: string;
  // generated
  gen?: GenKey;
  w: number; // world width
  h: number; // world height
};

const IMG = "/mood-boards/white-immersion/";

function photo(
  a: Omit<Artifact, "generated" | "w" | "h" | "src"> & { file: string; maxW?: number },
): Artifact {
  const ratio = a.imgW! / a.imgH!;
  let w = a.maxW ?? 500;
  let h = w / ratio;
  if (h > 420) { h = 420; w = h * ratio; }
  const { file, maxW: _m, ...rest } = a;
  void _m;
  return { ...rest, src: IMG + file, generated: false, w: Math.round(w), h: Math.round(h) };
}

function gen(a: Omit<Artifact, "generated">): Artifact {
  return { ...a, generated: true };
}

export const ARTIFACTS: Artifact[] = [
  photo({
    id: "spt", short: "One-value horizon", kind: "photo", file: "south-pole-telescope.jpg", imgW: 1400, imgH: 1050,
    title: "Ground and sky at one value",
    alt: "A radio telescope dish and its grey building on a flat snowfield, sky and ground nearly the same pale value.",
    take: "Figure and ground separated by value alone: one pale value for everything, and a single dark mass as the only contrast.",
    where: "The explorer's hero: the Whiteout field, with the score chart as the one Ink object on it.",
    leave: "The teal cast in the upper sky. Our whites stay neutral-cold, never green.",
    credit: "Christopher Michel, CC BY 4.0, via Wikimedia Commons",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Amundsen%E2%80%93Scott_South_Pole_Station_07.jpg",
  }),
  gen({
    id: "ridges", short: "Score ridges", kind: "data", gen: "ridges", w: 520, h: 380,
    title: "Stacked hairline ridgelines",
    take: "Our six anomaly-score timelines, 1,500 bins each, stacked as 0.9px Ink ridges. A Frost fill under each line hides the one behind it, and labelled anomalies become 1.4px ticks.",
    where: "The scrubbable timeline section: one mission's ridges at a time, swapped with a tab.",
    leave: "All six at once on a phone. Two ridges at most below 600px.",
  }),
  photo({
    id: "melt", short: "Saturation budget", kind: "color", file: "meltwater-field.jpg", imgW: 1400, imgH: 933,
    title: "One saturated hue, a sliver of the frame",
    alt: "Satellite view straight down onto a white ice sheet, with small scattered pools of vivid blue meltwater joined by thin blue channels.",
    take: "Color as a rare event. The field is near-white and the only saturated pixels are small and scattered, so the eye goes straight to them.",
    where: "Signal's budget in the explorer: the tour pill and nothing else. Once cyan covers more than a sliver of the screen, it stops pointing at anything.",
    leave: "The deep ultramarine. Our one hue is Signal cyan, always a fill carrying Ink text.",
    credit: "NASA Earth Observatory (EO-1 ALI), via NASA Image Library",
    creditUrl: "https://images.nasa.gov/details/GSFC_20171208_Archive_e000112",
  }),
  gen({
    id: "display", short: "Display face", kind: "type", gen: "display", w: 520, h: 300,
    title: "Michroma: wide display caps",
    take: "Wide, squared capitals in one weight, tracked +4%. The width does the work that bold does in other systems.",
    where: "The one-sentence finding, section stamps (01 / 02), and big metric numerals.",
    leave: "Anything longer than about six words, and any lowercase.",
  }),
  gen({
    id: "mono", short: "HUD mono", kind: "type", gen: "mono", w: 480, h: 320,
    title: "Martian Mono: the HUD face",
    take: "Weight 300 at 11px in tracked caps for readouts, and 400 at 13–14px for notes. Tabular figures, so ticking numbers never jitter.",
    where: "Every readout, axis, legend, and coordinate, plus the notes you are reading now.",
    leave: "Weights above 500. Heavy mono reads as terminal cosplay, not instrument.",
  }),
  photo({
    id: "rubin", short: "Small in vast", kind: "photo", file: "rubin-snow.jpg", imgW: 1400, imgH: 778,
    title: "One small object in a vast field",
    alt: "Aerial view of a small white observatory building on a snow-covered mountain ridge under a blue sky.",
    take: "Scale through emptiness: one small object with a lot of quiet around it. The roughly 40% empty space around every card here comes from this.",
    where: "The explorer's default zoom, pulled back far enough that the field feels vast before you fly in.",
    leave: "The saturated blue sky.",
    credit: "NOIRLab/NSF/AURA, CC BY 4.0, via Wikimedia Commons",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Snow_at_Rubin_Observatory_(IMG_2842-CC).jpg",
  }),
  photo({
    id: "sky-controls", short: "Floating circles", kind: "interface", file: "crop-sky-controls.jpg", imgW: 1131, imgH: 1400, maxW: 340,
    title: "Floating round controls, grouped by job",
    alt: "Interface crop: a column of round charcoal buttons (compass, markers, grid, zoom in, zoom out) floating over a dark point field, in two groups with a gap between.",
    take: "Round controls floating straight over the content with no toolbar behind them, stacked in two groups (view tools, then zoom) split by one clear gap.",
    where: "Zoom, fit, and grid down the explorer's right edge, 44px each.",
    leave: "The charcoal fill and the unlabelled glyphs. Ours are frosted white with Ink strokes, a tooltip, and an aria-label.",
    credit: "Screenshot crop, via skyviewer.app", creditUrl: "https://skyviewer.app/explorer",
  }),
  gen({
    id: "controls", short: "Frost controls", kind: "interface", gen: "controls", w: 500, h: 300,
    title: "Frosted circular controls, all states",
    take: "44px frosted circles: rest, hover (Ink ring), focus (offset ring), pressed (inset), selected (Ink fill), and disabled (dashed).",
    where: "Every explorer control, including this board's own HUD on the right.",
    leave: "Meaning carried by the icon alone. Each circle has a tooltip and an aria-label.",
  }),
  gen({
    id: "palette", short: "Palette", kind: "color", gen: "palette", w: 520, h: 360,
    title: "Whiteout palette with measured contrast",
    take: "Five near-whites, one Ink, and Signal cyan. Every ratio on the card is computed from the hex values, not typed in.",
    where: "The design system's color roles. Signal marks the primary action and nothing else.",
    leave: "Cyan text on white (1.5:1). Cyan is always a fill carrying Ink text.",
  }),
  photo({
    id: "frost", short: "Hoar frost", kind: "texture", file: "hoar-frost.jpg", imgW: 1400, imgH: 788,
    title: "Needles growing along one axis",
    alt: "Macro photo of hoar-frost ice crystals, translucent blue-white needles growing upward against a dark background.",
    take: "Structure appearing out of nothing: thin needles that all grow in one direction from a base line.",
    where: "The crystallize transition: figures grow in from their data points instead of fading in.",
    leave: "The black background. We keep only the crystal.",
    credit: "W.carter, CC BY-SA 4.0, via Wikimedia Commons",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Hoar_frost_ice_crystals_in_Tuntorp_11.jpg",
  }),
  gen({
    id: "frost-gen", short: "Frost growth", kind: "texture", gen: "frost", w: 420, h: 340,
    title: "Frost growth (generative)",
    take: "Six-fold dendrites that grow branch by branch over about two seconds, then hold still.",
    where: "The loading state for figures: frost grows while data streams in, then the chart resolves on top.",
    leave: "Running forever. It grows once and stops, because the world is silent.",
  }),
  gen({
    id: "facets", short: "GMM facets", kind: "data", gen: "facets", w: 440, h: 400,
    title: "Mixture components as crystal facets",
    take: "The 21 Mission 1 mixture components from our run: facet angle is the mixture weight and shade is the anomaly rate.",
    where: "The latent-structure section: one crystal per method, with facets you can hover.",
    leave: "Gradients and glow. Flat greys with 1px Ink seams only.",
  }),
  photo({
    id: "annunciator", short: "Label tiles", kind: "type", file: "annunciator-panel.jpg", imgW: 1400, imgH: 662,
    title: "Two-line caps on identical tiles",
    alt: "A grey metal panel holding a grid of 24 identical rectangular indicator tiles, each with a short two-line all-caps label.",
    take: "Short caps labels, two lines at most, centered on identical tiles in a strict grid. The word carries the state; the tile only frames it.",
    where: "Status badges in the explorer (NOMINAL, ANOMALY, COMM GAP): a word plus a shape in a Rime-edged slab, never a colored dot alone.",
    leave: "The stencil sans and the beige-grey cast. Our labels are Martian Mono 300 on Frost.",
    credit: "Steve Jurvetson, CC BY 2.0, via Wikimedia Commons",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Apollo_Command_Module_Master_Caution_%26_Event_Annunciator_Panel_%E2%80%94_with_the_Infamous_%22Main_Bus_B_Undervolt%22_Alarm_of_Apollo_13_(53839889630).jpg",
  }),
  photo({
    id: "alma", short: "Repeated forms", kind: "photo", file: "alma-snow.jpg", imgW: 1400, imgH: 935,
    title: "Identical forms in a row",
    alt: "Several identical white radio antennas standing in snow on a high plateau under a bright sun.",
    take: "Repetition reads as rigor: identical forms, the same orientation, even spacing.",
    where: "The method comparison: five identical method cards in a row, M1 and M2 side by side.",
    leave: "The lens flare and the deep-blue sky.",
    credit: "S. Otarola/ESO, CC BY 4.0, via Wikimedia Commons",
    creditUrl: "https://commons.wikimedia.org/wiki/File:ALMA_in_the_snow_(Snow-CC).jpg",
  }),
  gen({
    id: "hierarchy", short: "Channel crystal", kind: "data", gen: "hierarchy", w: 420, h: 420,
    title: "Channel hierarchy as a snowflake",
    take: "Mission 1's real structure (76 channels in 18 groups in 4 subsystems) drawn as a radial crystal with three line weights and three dot sizes.",
    where: "The main finding, 18–29 group-level modes rather than 4–5 subsystems. The arms show why.",
    leave: "Channel names printed on the flake. They appear on hover only.",
  }),
  gen({
    id: "hud", short: "Corner HUD", kind: "interface", gen: "hud", w: 500, h: 300,
    title: "Bracketed corner readout",
    take: "Corner brackets around key–value rows of mono readouts that tick while the view moves. Muted keys on the left, Ink values on the right.",
    where: "The explorer's four corners: mission, channel count, timestep, and anomaly rate.",
    leave: "Made-up telemetry. Every number comes from our data.",
  }),
  photo({
    id: "igloo-hud", short: "Corner text", kind: "interface", file: "crop-igloo-hud.jpg", imgW: 1400, imgH: 875,
    title: "Text pinned to the corners",
    alt: "Interface crop of a top-left corner: an outlined wordmark above small white bars of mono text, over a grey snowy scene.",
    take: "A small outlined wordmark and short mono bars pinned to one corner. They frame the scene and leave its center empty.",
    where: "This board's HUD and the explorer's chrome: titles and coordinates in the corners, data in the middle.",
    leave: "Text drawn into the canvas, where a screen reader cannot reach it. Our HUD is real DOM text.",
    credit: "Screenshot crop, via igloo.inc", creditUrl: "https://igloo.inc",
  }),
  gen({
    id: "scramble", short: "Scramble label", kind: "interface", gen: "scramble", w: 500, h: 240,
    title: "Scramble-in label",
    take: "Labels resolve from noise character by character in about 600ms, left to right, like a readout locking on.",
    where: "Section labels and metric values, the first time each enters view.",
    leave: "Scrambling body text, or anything under reduced motion (it just appears).",
  }),
  photo({
    id: "deep-field", short: "Specks on white", kind: "photo", file: "deep-field-inverted.jpg", imgW: 1362, imgH: 1400, maxW: 400,
    title: "Dense specks on white, inverted",
    alt: "A deep-space photograph with its colors inverted and desaturated: thousands of tiny dark specks on a white field.",
    take: "Thousands of dark specks on white. The field is dense but still calm, because every mark is tiny and the same weight.",
    where: "The point field of the latent map, and this board's own background.",
    leave: "The color fringes. We desaturated it to keep it cold.",
    credit: "NASA, ESA, and STScI (inverted by us), via NASA Image Library",
    creditUrl: "https://images.nasa.gov/details/PIA12110",
  }),
  gen({
    id: "bic", short: "BIC glacier", kind: "data", gen: "bic", w: 520, h: 320,
    title: "Model-selection curve as a glacier profile",
    take: "Our real BIC sweep (K = 2–30) for both missions, drawn as a cross-section. The valley floor marks the chosen K: 21 for M1, 29 for M2. Solid vs dashed, not two hues.",
    where: "The model-selection beat: why 18–29, not 4–5.",
    leave: "Raw BIC numbers on the axis. Show the shape and the selected K.",
  }),
  gen({
    id: "signal", short: "Signal in use", kind: "color", gen: "signal", w: 520, h: 340,
    title: "Signal cyan: one fill per screen",
    take: "The accent at true size in a slice of the explorer: one cyan pill with Ink text, everything else Ink on Frost. The bar measures how much of your screen the board's own pill covers, live.",
    where: "The explorer's primary action, 'Guided tour', and nothing else.",
    leave: "Cyan text, cyan chart lines, and a second cyan fill on the same screen.",
  }),
  gen({
    id: "zoom", short: "Zoom ladder", kind: "interface", gen: "zoom", w: 420, h: 320,
    title: "Zoom ladder and scale bar (live)",
    take: "A thin tick ladder for the current zoom, plus a scale bar in data units. This one is live: it tracks your zoom.",
    where: "The explorer HUD, bottom right: 'zoom 0.42×' and a timestep scale bar.",
    leave: "A slider you have to grab. It is an indicator. Zoom with the circles or the wheel.",
  }),
  photo({
    id: "iceberg", short: "Faceted slab", kind: "photo", file: "iceberg-sea-ice.jpg", imgW: 1400, imgH: 663,
    title: "A hard-edged slab on a flat plane",
    alt: "Aerial photo of a white faceted iceberg frozen into flat, cracked sea ice, casting a soft blue shadow.",
    take: "A faceted object resting on a flat plane: cards as slabs with square corners and one edge line.",
    where: "The card shape for method cards and these artifacts: 0 radius and a 1px Rime edge.",
    leave: "The blue shadow. Our shadow is one cold-grey hairline plus a long, faint drop.",
    credit: "NASA / Operation IceBridge, via NASA Image Library",
    creditUrl: "https://images.nasa.gov/details/GSFC_20171208_Archive_e001605",
  }),
  gen({
    id: "grain", short: "Snow grain", kind: "texture", gen: "grain", w: 420, h: 300,
    title: "Snow-grain texture",
    take: "Sparse cold-grey grain at about 3% density, so a flat white still feels like a surface.",
    where: "Behind every large white surface at very low opacity, never under text.",
    leave: "Visible noise. If you notice the grain, it is too strong.",
  }),
  photo({
    id: "cleanroom", short: "Clinical grid", kind: "photo", file: "goddard-cleanroom.jpg", imgW: 1400, imgH: 509,
    title: "All white, all on a grid",
    alt: "Panorama of a white high-bay clean room: white floor, white walls, and grey test stands set out in a grid.",
    take: "Clinical white with everything on a grid and nothing decorative. Grey stands are the only mid-tones.",
    where: "The design system's surfaces: Whiteout floor, Frost panels, and Rime hairlines.",
    leave: "The fluorescent green tint.",
    credit: "NASA Goddard Space Flight Center, via NASA Image Library",
    creditUrl: "https://images.nasa.gov/details/GSFC_20171208_Archive_e002175",
  }),
  gen({
    id: "shards", short: "Facet shard", kind: "texture", gen: "shards", w: 400, h: 340,
    title: "Wireframe shard (3D)",
    take: "A slowly turning wireframe icosahedron in hairline Ink, with no fill or shading. Back edges drop to 25%.",
    where: "Section dividers and the 404 / empty state.",
    leave: "Spinning fast or constantly. It turns once every 20 seconds and pauses when not in focus.",
  }),
  photo({
    id: "shelf", short: "Threshold edge", kind: "photo", file: "ice-shelf-edge.jpg", imgW: 1400, imgH: 1050, maxW: 460,
    title: "The line where structure stops",
    alt: "Aerial photo of an ice-shelf edge: a bright ridged ice sheet on the right meeting dark water and broken floes on the left.",
    take: "A hard edge between bright texture and a dark flat: a ready-made picture of a decision threshold.",
    where: "The threshold line on the score and PR views. Above it is ice, below it is water.",
    leave: "The deep blue sea as a color. We keep it as a grey value.",
    credit: "NASA / Operation IceBridge, via NASA Image Library",
    creditUrl: "https://images.nasa.gov/details/GSFC_20171208_Archive_e001609",
  }),
  photo({
    id: "balloon", short: "Held still", kind: "photo", file: "mcmurdo-balloon.jpg", imgW: 1400, imgH: 1050, maxW: 460,
    title: "One soft form, held still",
    alt: "A tall white balloon, partly inflated, held upright on a flat ice shelf with a snow-capped mountain behind.",
    take: "One soft white form held perfectly still against a busy ground. Calm comes from a single subject.",
    where: "The end of the guided tour and the closing 'Read the paper' moment: one quiet object, then stop.",
    leave: "The vehicles and the saturated sky.",
    credit: "NASA, via NASA Image Library",
    creditUrl: "https://images.nasa.gov/details/GSFC_20171208_Archive_e001811",
  }),
];

export const KIND_LABEL: Record<Kind, string> = {
  photo: "Photo", type: "Type", color: "Color", texture: "Texture", interface: "Interface", data: "Data art",
};

// Field layout: an 8 × 4 grid of 700-unit cells around a central title block.
// The inner ring (12 cells) is toured clockwise first, then the outer ring (16 cells).
export const CELL = 700;
export function layout(): { x: number; y: number }[] {
  const cells: { c: number; r: number; ring: number; ang: number }[] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 8; c++) {
      if ((c === 3 || c === 4) && (r === 1 || r === 2)) continue; // title
      const ring = c >= 2 && c <= 5 ? 0 : 1;
      const x = (c - 3.5) * CELL, y = (r - 1.5) * CELL;
      // angle from top-left going clockwise
      let ang = Math.atan2(y, x) + Math.PI * 0.75;
      if (ang < 0) ang += Math.PI * 2;
      if (ang >= Math.PI * 2) ang -= Math.PI * 2;
      cells.push({ c, r, ring, ang });
    }
  }
  cells.sort((a, b) => a.ring - b.ring || a.ang - b.ang);
  return cells.map(({ c, r }, i) => {
    // deterministic jitter so the field doesn't read as a spreadsheet
    const jx = Math.sin(i * 12.9898) * 70;
    const jy = Math.cos(i * 78.233) * 60;
    return { x: Math.round((c - 3.5) * CELL + jx), y: Math.round((r - 1.5) * CELL + jy) };
  });
}

export const WORLD = { minX: -3000, maxX: 3000, minY: -1500, maxY: 1500 };

// WCAG relative-luminance contrast, used to print real ratios on the palette card.
function lum(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
export function contrast(a: string, b: string) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

export const PALETTE = [
  { name: "Whiteout", role: "background", hex: "#F4F6F8" },
  { name: "Frost", role: "surface", hex: "#FFFFFF" },
  { name: "Rime", role: "border", hex: "#D5DCE4" },
  { name: "Glacier", role: "muted text", hex: "#56616F" },
  { name: "Ink", role: "text", hex: "#111824" },
  { name: "Signal", role: "accent (fill only)", hex: "#2FE0E3" },
];
