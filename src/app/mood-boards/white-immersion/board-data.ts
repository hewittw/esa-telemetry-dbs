// Artifact list for the white-immersion board. Shared by the server page and the client stage.
// Order = guided-tour order = keyboard (Tab / arrow) order.

export type Kind = "photo" | "type" | "color" | "texture" | "interface" | "data";

export type GenKey =
  | "ridges" | "display" | "mono" | "controls" | "palette" | "frost" | "facets"
  | "hierarchy" | "hud" | "scramble" | "bic" | "zoom" | "grain" | "shards";

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
    id: "spt", short: "Whiteout horizon", kind: "photo", file: "south-pole-telescope.jpg", imgW: 1400, imgH: 1050,
    title: "Telescope at the South Pole, in whiteout",
    alt: "A radio telescope dish and its grey building at Amundsen–Scott South Pole Station on a flat snowfield, sky and ground nearly the same pale value.",
    take: "Ground and sky at one value, with the instrument as the only dark mass. That single-value horizon is our page background.",
    where: "Hero: the finding sits on this horizon, and the telemetry chart is the only dark object on it.",
    leave: "The teal cast in the upper sky. Our whites stay neutral-cold, never green.",
    credit: "Christopher Michel, CC BY 4.0, via Wikimedia Commons",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Amundsen%E2%80%93Scott_South_Pole_Station_07.jpg",
  }),
  gen({
    id: "ridges", short: "Score ridges", kind: "data", gen: "ridges", w: 520, h: 380,
    title: "Anomaly scores as ice ridges",
    take: "Six real score timelines (M1 K-Means, GMM, HVAE · M2 GMM, HVAE, TVAE), 1,500 bins each, drawn as stacked wireframe ridges. Labelled anomaly spans are the darker ticks.",
    where: "The scrubbable anomaly timeline: scroll pulls the ridges forward one mission at a time.",
    leave: "Six ridges at once on a phone. Show two and let the reader swap.",
  }),
  photo({
    id: "igloo-shards", short: "Wireframe shards", kind: "interface", file: "crop-igloo-shards.jpg", imgW: 1400, imgH: 875,
    title: "Igloo: wireframe shards over snow",
    alt: "Crop of the Igloo website: thin white wireframe triangles drifting over a grey snow ridge and the edge of a rendered igloo.",
    take: "Thin 1px wireframe shards drifting over the scene, as if the air were crystallizing.",
    where: "The ambient layer of the explorer, at 20% ink, drifting at half the camera's speed.",
    leave: "The density. Igloo uses hundreds; we keep a dozen so the data stays the subject.",
    credit: "Screenshot crop, via igloo.inc", creditUrl: "https://igloo.inc",
  }),
  gen({
    id: "display", short: "Display face", kind: "type", gen: "display", w: 520, h: 300,
    title: "Michroma: the display face",
    take: "Wide, squared techno capitals like Igloo's wordmark, but readable. One weight, tracked +4%.",
    where: "The one-sentence finding, section stamps (01 / 02), and big metric numerals.",
    leave: "Anything longer than about six words, and lowercase body text.",
  }),
  gen({
    id: "mono", short: "HUD mono", kind: "type", gen: "mono", w: 480, h: 320,
    title: "Martian Mono: the HUD face",
    take: "Weight 300 for HUD readouts at 11px, tracked caps. Weight 400 at 13–14px for notes and captions.",
    where: "Every readout, axis, legend, coordinate, and the notes you are reading now.",
    leave: "Weights above 500. Heavy mono reads as terminal cosplay, not instrument.",
  }),
  photo({
    id: "rubin", short: "Rubin, snow", kind: "photo", file: "rubin-snow.jpg", imgW: 1400, imgH: 778,
    title: "Rubin Observatory after snowfall",
    alt: "Aerial view of the Vera C. Rubin Observatory, a small white building on a snow-covered Andean ridge under a blue sky.",
    take: "Scale: a small white instrument inside vast white terrain. One object, a lot of quiet around it.",
    where: "The default zoom of the explorer: zoomed out far enough that the field feels vast.",
    leave: "The saturated blue sky.",
    credit: "NOIRLab/NSF/AURA, CC BY 4.0, via Wikimedia Commons",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Snow_at_Rubin_Observatory_(IMG_2842-CC).jpg",
  }),
  photo({
    id: "sky-controls", short: "Floating circles", kind: "interface", file: "crop-sky-controls.jpg", imgW: 1131, imgH: 1400, maxW: 340,
    title: "Skyviewer: floating circular controls",
    alt: "Crop of the Rubin Skyviewer: a column of round charcoal buttons (globe, markers, grid, zoom in, zoom out) floating over a star field.",
    take: "48px circles floating over the data and grouped by job. No toolbar, no panel.",
    where: "The zoom, fit, and grid controls down the explorer's right edge.",
    leave: "The charcoal fill and unlabelled glyphs. Ours are frosted white with ink strokes and real labels.",
    credit: "Screenshot crop, via skyviewer.app (Rubin Observatory)", creditUrl: "https://skyviewer.app/explorer",
  }),
  gen({
    id: "controls", short: "Frost controls", kind: "interface", gen: "controls", w: 500, h: 300,
    title: "Frosted circular controls, all states",
    take: "44px frosted circles: rest, hover (ink ring), focus (offset ring), pressed (inset), selected (ink fill), disabled (dashed).",
    where: "Every explorer control, including this board's own HUD on the right.",
    leave: "Icon-only meaning. Each circle carries a tooltip and an aria-label.",
  }),
  gen({
    id: "palette", short: "Palette", kind: "color", gen: "palette", w: 520, h: 360,
    title: "Whiteout palette with contrast",
    take: "Five near-whites and one ink, plus one signal cyan. Ratios are measured against Whiteout.",
    where: "Design-system color roles. Cyan only marks the primary action and the context pill.",
    leave: "Cyan text on white (1.5:1). Cyan is always a fill carrying ink text.",
  }),
  photo({
    id: "frost", short: "Hoar frost", kind: "texture", file: "hoar-frost.jpg", imgW: 1400, imgH: 788,
    title: "Hoar-frost crystals",
    alt: "Macro photo of hoar-frost ice crystals, translucent blue-white needles growing upward against a dark background.",
    take: "Structure appearing out of nothing: needles that grow along one axis.",
    where: "The crystallize transition: figures grow in from their data points rather than fading in.",
    leave: "The black background. We only keep the crystal.",
    credit: "W.carter, CC BY-SA 4.0, via Wikimedia Commons",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Hoar_frost_ice_crystals_in_Tuntorp_11.jpg",
  }),
  gen({
    id: "frost-gen", short: "Frost growth", kind: "texture", gen: "frost", w: 420, h: 340,
    title: "Frost growth (generative)",
    take: "Six-fold dendrites that grow branch by branch in about two seconds, then hold still.",
    where: "Loading state for figures: frost grows while data streams, then the chart resolves on top.",
    leave: "Running forever. It grows once and stops, because the world is silent.",
  }),
  gen({
    id: "facets", short: "GMM facets", kind: "data", gen: "facets", w: 440, h: 400,
    title: "GMM K=21 as crystal facets",
    take: "The 21 M1 mixture components from our run: facet angle = mixture weight, shade = anomaly rate.",
    where: "The latent-structure section: one crystal per method, with facets you can hover.",
    leave: "Gradients and glow. Flat greys with 1px ink seams, as in Igloo's block joints.",
  }),
  photo({
    id: "igloo-nodes", short: "Numbered nodes", kind: "interface", file: "crop-igloo-nodes.jpg", imgW: 1400, imgH: 1067, maxW: 460,
    title: "Igloo: numbered nodes on the blocks",
    alt: "Crop of the Igloo website: grey snow blocks lifting apart, with small numbered nodes (32, 33, 47, 22) joined by thin white lines.",
    take: "Small numbered nodes joined by 1px lines, laid directly on the objects they label.",
    where: "Labelling GMM components and channel groups on the latent map, with no legend box.",
    leave: "The heavy stone texture of the blocks.",
    credit: "Screenshot crop, via igloo.inc", creditUrl: "https://igloo.inc",
  }),
  photo({
    id: "alma", short: "ALMA array", kind: "photo", file: "alma-snow.jpg", imgW: 1400, imgH: 935,
    title: "ALMA antennas in snow",
    alt: "Several white ALMA radio antennas standing in snow on the Chajnantor plateau under a bright sun.",
    take: "An array of identical white instruments: repetition reads as rigor.",
    where: "The method comparison: five identical method cards in a row, M1 and M2 side by side.",
    leave: "The lens flare and the dramatic deep-blue sky.",
    credit: "S. Otarola/ESO, CC BY 4.0, via Wikimedia Commons",
    creditUrl: "https://commons.wikimedia.org/wiki/File:ALMA_in_the_snow_(Snow-CC).jpg",
  }),
  gen({
    id: "hierarchy", short: "Channel crystal", kind: "data", gen: "hierarchy", w: 420, h: 420,
    title: "Channel hierarchy as a snowflake",
    take: "Mission 1's real structure: 76 channels in 18 groups in 4 subsystems, drawn as a radial crystal.",
    where: "The finding: 18–29 group-level modes, not 4–5 subsystems. The arms show why.",
    leave: "Channel names on the flake. Reveal them on hover only.",
  }),
  gen({
    id: "hud", short: "Corner HUD", kind: "interface", gen: "hud", w: 500, h: 300,
    title: "Corner HUD readout",
    take: "Bracketed corner blocks of live mono readouts that tick while the view moves.",
    where: "The four corners of the explorer: mission, channel count, timestep, anomaly rate.",
    leave: "Fake telemetry. Every number is from our data.",
  }),
  photo({
    id: "igloo-hud", short: "Igloo HUD", kind: "interface", file: "crop-igloo-hud.jpg", imgW: 1400, imgH: 875,
    title: "Igloo: corner wordmark and HUD",
    alt: "Crop of the Igloo website's top-left corner: an outlined IGLOO wordmark above small white bars of scrambled mono text.",
    take: "Text pinned to the corners as framing, leaving the center to the scene.",
    where: "This board's own HUD, and the explorer's chrome.",
    leave: "Canvas-rendered glyphs a screen reader cannot read. Our HUD is real DOM text.",
    credit: "Screenshot crop, via igloo.inc", creditUrl: "https://igloo.inc",
  }),
  gen({
    id: "scramble", short: "Scramble label", kind: "interface", gen: "scramble", w: 500, h: 240,
    title: "Scramble-in label",
    take: "Labels resolve from noise, character by character, in about 600ms, like telemetry locking on.",
    where: "Section labels and metric values the first time they enter view.",
    leave: "Scrambling body text, or anything under reduced motion (it just appears).",
  }),
  photo({
    id: "deep-field", short: "Inverted deep field", kind: "photo", file: "deep-field-inverted.jpg", imgW: 1362, imgH: 1400, maxW: 400,
    title: "Hubble deep field, inverted",
    alt: "The Hubble Ultra Deep Field with its colors inverted and desaturated: thousands of galaxies as dark specks on a white field.",
    take: "Galaxies as dark specks on white: the snowfield of data. This is Skyviewer turned inside out.",
    where: "The point field of the latent map and this board's own background.",
    leave: "The color fringes. We desaturated to keep it cold.",
    credit: "NASA, ESA, and STScI (inverted by us), via NASA Image Library",
    creditUrl: "https://images.nasa.gov/details/PIA12110",
  }),
  gen({
    id: "bic", short: "BIC glacier", kind: "data", gen: "bic", w: 520, h: 320,
    title: "BIC sweep as a glacier profile",
    take: "The real GMM BIC sweep (K = 2–30) for both missions as a glacier cross-section. The valley floor is the chosen K: 21 for M1, 29 for M2.",
    where: "The model-selection beat: why 18–29, not 4–5.",
    leave: "Raw BIC numbers on the axis. Show the shape and the selected K.",
  }),
  photo({
    id: "sky-pill", short: "Cyan pill", kind: "interface", file: "crop-sky-pill.jpg", imgW: 1400, imgH: 219,
    title: "Skyviewer: the single cyan context pill",
    alt: "Crop of the Rubin Skyviewer: a cyan pill banner reading 'You are looking at about one tenth of Rubin's field of view' over a star field.",
    take: "One cyan pill as the only saturated thing on screen, giving scale in a sentence.",
    where: "This board's tour button, and the explorer's primary action: 'Viewing 3 of 76 channels'.",
    leave: "The tiny dismiss × as the only control. Ours is a full-size button.",
    credit: "Screenshot crop, via skyviewer.app (Rubin Observatory)", creditUrl: "https://skyviewer.app/explorer",
  }),
  gen({
    id: "zoom", short: "Zoom ladder", kind: "interface", gen: "zoom", w: 420, h: 320,
    title: "Zoom ladder and scale bar (live)",
    take: "A thin tick ladder showing the current zoom, plus a scale bar in data units. This one is live: it tracks your zoom.",
    where: "Explorer HUD, bottom right: 'zoom 0.42×' and a timestep scale bar.",
    leave: "A slider you have to grab. It is an indicator. Zoom with the circles or the wheel.",
  }),
  photo({
    id: "iceberg", short: "Iceberg slab", kind: "photo", file: "iceberg-sea-ice.jpg", imgW: 1400, imgH: 663,
    title: "Iceberg locked in sea ice",
    alt: "Aerial photo of a white faceted iceberg frozen into flat, cracked sea ice, casting a soft blue shadow.",
    take: "Faceted objects resting on a flat plane: cards as hard-edged slabs with one shadow line.",
    where: "Card shape for method cards and these artifacts: square corners and a 1px rime edge.",
    leave: "The blue shadow. Our shadows are a single cold-grey hairline.",
    credit: "NASA / Operation IceBridge, via NASA Image Library",
    creditUrl: "https://images.nasa.gov/details/GSFC_20171208_Archive_e001605",
  }),
  gen({
    id: "grain", short: "Snow grain", kind: "texture", gen: "grain", w: 420, h: 300,
    title: "Snow-grain texture",
    take: "Sparse cold-grey grain at about 3% density, so flat white still feels like a surface.",
    where: "Behind every white surface at very low opacity, never over text.",
    leave: "Visible noise. If you notice the grain, it is too strong.",
  }),
  photo({
    id: "cleanroom", short: "Clean room", kind: "photo", file: "goddard-cleanroom.jpg", imgW: 1400, imgH: 509,
    title: "Goddard high-bay clean room",
    alt: "Panorama of NASA Goddard's white high-bay clean room: white floor, white walls, and grey test stands in a grid.",
    take: "Clinical white with everything on a grid, and nothing decorative.",
    where: "The design system's surfaces: Whiteout floor, Frost panels, Rime hairlines.",
    leave: "The fluorescent green tint.",
    credit: "NASA Goddard Space Flight Center, via NASA Image Library",
    creditUrl: "https://images.nasa.gov/details/GSFC_20171208_Archive_e002175",
  }),
  gen({
    id: "shards", short: "Facet shard", kind: "texture", gen: "shards", w: 400, h: 340,
    title: "Wireframe shard (3D)",
    take: "A slowly turning wireframe icosahedron, hairline ink, with no fill or shading.",
    where: "Section dividers and the 404 / empty state.",
    leave: "Spinning fast or constantly. It turns once per 20 seconds and pauses off-focus.",
  }),
  photo({
    id: "shelf", short: "Ice-shelf edge", kind: "photo", file: "ice-shelf-edge.jpg", imgW: 1400, imgH: 1050, maxW: 460,
    title: "Ice-shelf edge, Antarctic Peninsula",
    alt: "Aerial photo of an ice shelf edge: a bright ridged ice sheet on the right meeting dark water and broken floes on the left.",
    take: "The line where structure stops: a natural picture of a decision threshold.",
    where: "The threshold line on the score and PR views. Above it, ice; below it, water.",
    leave: "The deep blue sea as a color. We keep it as a grey value.",
    credit: "NASA / Operation IceBridge, via NASA Image Library",
    creditUrl: "https://images.nasa.gov/details/GSFC_20171208_Archive_e001609",
  }),
  photo({
    id: "balloon", short: "Balloon, McMurdo", kind: "photo", file: "mcmurdo-balloon.jpg", imgW: 1400, imgH: 1050, maxW: 460,
    title: "Scientific balloon awaiting launch, McMurdo",
    alt: "A tall white NASA scientific balloon, partly inflated, held on the ice shelf at McMurdo with Mount Erebus behind.",
    take: "One soft white form held perfectly still before release.",
    where: "The end of the guided tour and the site's closing 'Read the paper' moment.",
    leave: "The trucks and the saturated sky.",
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
