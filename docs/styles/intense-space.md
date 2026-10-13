# Intense Space · "Charged · Fibrous · Instrumented"

Board: `/mood-boards/intense-space`. Remixes ICOMAT (dominant), Helion, Planet, NASA's Eyes.
A deep-space control room drawn in steered fiber: charcoal void, real telemetry strands, bracketed mono readouts.

## Color roles (contrast measured, WCAG 2.x)
| Role | Name | Hex | Contrast |
|---|---|---|---|
| Background | Void | `#0A0B0D` | Frost on it 13.7:1 |
| Surface | Panel | `#121316` | Frost 13.0:1, Steel 6.2:1 |
| Art field | Charcoal | `#333333` | Frost 8.8:1 (Steel only 4.2:1, so no Steel text here) |
| Text | Frost | `#CFD9E0` | 13.7:1 on Void |
| Muted | Steel | `#8C979F` | 6.6:1 on Void |
| Border | Hairline | `#2E3135` | 1px, decorative (1.5:1) |
| Accent (primary action only) | Fiber Green | `#37FD08` | Void text on it 14.3:1 |
| Anomaly signal | Fault Magenta | `#E04FD6` | 5.9:1 on Void |
| Data outline / highlight | Survey Teal | `#4BCFE0` | 10.6:1 on Void |

Green is the accent: the primary button, plus the single "live" mark in a readout. Magenta means a labelled fault, nothing else.
Teal outlines one region or highlights one series. Always pair color with a word (`■ labelled fault`, `● Generative`).
Color budget (board artifact 07): magenta's area is set by the data, so a strip shows magenta only as far as each slice is
labelled fault (M1 11.1%, M2 4.7% of test steps). Per view: one teal outline region, one green primary action.

## Type
- **Display / heading / body:** Host Grotesk (Lay Grotesk stand-in). Display 600, -4.5% tracking, 0.9 leading, sentence case.
  Section openers in 300 ALL CAPS with the first line stepped in (Helion). Body 16px/1.45, 400.
- **Label:** Fragment Mono (Akkurat Mono stand-in), 10–11px caps, 0.12–0.16em tracking; overlines 0.42em (NASA Eyes).
- **Callout numerals:** Doto (dot-matrix), 600, for the few headline metrics only (e.g. PR-AUC 0.438). Never for body.
- Scale: 112 / 34 / 28 / 16 / 13 / 11 / 10 px.

## Spacing and shape
- 12-column grid, 12px gutter, row unit `clamp(76px, 5.28vw, 101px)` (76px at 1440, scales to 101px at 1920); page max width 1920px,
  so 2560 screens get even void margins instead of a stretched mosaic. 4px registration squares mark the columns.
- The mosaic only applies at xl (1280px+) with a fine pointer. Below xl, and on any touch screen, tiles stack in 1–2 columns and
  each note sits in flow beneath its piece, never overlaid on it.
- Figure labels render at 10px or more on screen: SVG figures carry two label sets (a short 26-unit set for phone-width tiles,
  the full 11–12.5-unit set from 768px up), with a Panel-colored halo where a label crosses a trace.
- More space between groups (40–80px) than inside a panel (16–20px padding).
- Corners: 2–3px on panels and buttons; full round only for filter chips.
- Borders: 1px Hairline panels with 4px corner ticks, like a drawing sheet. **No drop shadows.** Depth comes from Void → Panel → Charcoal.

## Motion
- UI: 200–300ms, `cubic-bezier(0.2, 0.7, 0.1, 1)` (fast out, long settle), no bounce.
- Reveals: notes slide up 12px and fade in 300ms (mouse only; hiding is instant); SVG traces draw in over 1.6–2.6s.
- Signature: word-by-word scroll brightness (read = Frost, unread = 42%; once lit, words stay lit so a fast scroller never sees a dimmed finding); per-letter blur-to-focus (14px → 0, 140ms stagger);
  generative fiber field driven by real anomaly scores, shearing sideways, with a Pause control.
- `prefers-reduced-motion`: canvas draws one static frame, traces render drawn, blur and blink stop, text is fully lit.

## Texture
Fine fractal grain plus 3px scanlines over Charcoal, vignetted to Void, behind heroes only. Dot grid (18px) for figure frames.
Physical references stand in for most website crops: a CSIRO micrograph of fibres drawn into one strand (the FiberField and
channel-tree convergence), NASA hardware panels (a lamp grid of short engraved caps; an overhead switch panel with red only
on guarded switches). Imagery is real mission hardware and night scenes (NASA), each with a mono source caption.
The board keeps just two website crops (an art-field hero with a low-left headline, and a half-blurred headline).

## Do
- Draw every line from real data (one strand = one slice of the test set; one path = one ESA channel).
- Bracket instrument tags: `[ M1 · GMM K=21 ]`, `[ Read the paper ]`.
- Number entry points 01–05 in mono with hairline rules.
- Show every control state: rest, hover (border → Frost), focus (2px Frost outline, 2–3px offset), pressed (Charcoal fill), disabled.

## Don't
- Green or magenta body text, or gradients between them (reads as glitch art).
- Decorative random strands, stock space wallpaper, or drop shadows.
- Scroll-jacking or blank canvases before JS: render static SVG first, then animate.
- More than one loud color in one figure.

## Design system (`/design-systems/intense-space`)
Built from this board: same fonts (Host Grotesk 300–600, Fragment Mono, Doto 600), the board's `.is-root` tokens and
`board.css` (corner ticks, registration dots, scanlines, draw-in), and its `FiberField` canvas. Page-scoped extras live in
`ds.css` with an `isd-` prefix.
- **Color roles, extended:** Magenta also marks a failed UI state (error toast, invalid input, "Couldn't load"), always with ■
  and a word. Teal marks selected filter chips, the highlighted series and AOI boxes. Selected segmented / pressed toggles
  invert to Frost fill with Void text (13.7:1). Disabled text `#5F676E` (exempt, 3.4:1).
- **Measured text pairs:** Frost/Void 13.74, Frost/Panel 12.96, Frost/Charcoal 8.82, Steel/Void 6.60, Steel/Panel 6.23,
  Void/Green 14.27, Teal/Void 10.60, Teal/Panel 10.00, Magenta/Void 5.87, Magenta/Panel 5.54. Steel/Charcoal 4.24 is banned.
- **Type roles:** Display 600 clamp(42–112) / 0.9 / −4.5% · Opener 300 caps clamp(34–60), first line stepped 1.6em ·
  Heading 600 24 / 1.05 · Body 400 16 / 1.45 · Caption 13 Steel · Label mono 11 caps 0.14em · Overline mono 10 caps 0.42em ·
  Mono data 13 · Numeral Doto 600, three per view at most.
- **States:** hover → border/text Frost; focus-visible → 2px Frost outline, 2px offset (1px inside fields/segmented);
  pressed → Charcoal fill + 1px drop; selected → Frost fill (segmented, toggles, list rows get a 2px Frost left bar),
  Teal outline (chips); disabled → Hairline border, `#5F676E` text, not-allowed cursor.
- **Charts:** marks in SVG with non-scaling strokes; every label is HTML (never under 10px), axis names sit under the frame.
- **Motion:** 200ms controls, 300ms reveals/accordion/toast, 260ms dialog rise, 4.2s toast life with a draining hairline,
  5s per step in the mechanism explainer (Pause + Skip), all off or static under reduced motion.
- **Provenance:** Table 1 is the source of truth. A PR curve drawn from saved scores carries its own AP and says where it stands:
  `✓ AP 0.390 · matches Table 1`, or `△ AP 0.452 recomputed from saved scores · Table 1: 0.438` (HVAE and TVAE on M2).
  Event counts name their source (`ESA-ADB anomaly_types.csv`: M1 118 + 78 + 4 = 200, M2 613 + 31 = 644).
- **Layout:** panels in a row share a height, so each panel anchors its last group to the bottom (`mt-auto`) and fills
  the space with real content, never padding. Novel and Telemetry go 2-up at md (768) for the narrow panels
  (readout + blur, tags + mechanism, mission switcher + method card); charts stay full width.
- **Fiber canvases:** the hero and N.01 each run a FiberField, but it pauses whenever off-screen (IntersectionObserver),
  so only one animates at a time.
- **Two kinds of "best", never one word for both:** `◆ Top PR-AUC · M1` (Teal) = highest PR-AUC of every Table 1 row on that
  mission (GMM 0.384 on M1, TVAE 0.438 on M2). `◇ Best VAE · M1 (paper bold)` (Frost) = Table 1's own bold, best among the
  three VAEs only (TVAE 0.335 on M1, TVAE 0.438 on M2). Other systems that badge TVAE as "Best M1" are using the second meaning.
- **Parts of an Interface:** the slide's 16 tiles / 18 elements in the slide's order, each titled with the slide's name and
  subtitle ("Toast · Material: snackbar. It goes away."), drawn in this system and linked to the live, every-state version.
- **Principles (section L):** the Week 2 lecture rebuilt on our Mission 2 "Today" phone: L.01 four hierarchy levers ·
  L.02 Louder vs Quieter · L.03 type roles with leader lines · L.04 color roles (pick a swatch → Teal outline on its uses) ·
  L.05 accent everywhere vs one accent · L.06 five edges vs one (guides toggle) · L.07 ambiguous vs clear mini page with an
  affordance overlay (Teal = clickable, Steel = false affordance) · L.08 this system vs an arcade counter-example, with a
  recruiter/peer toggle · L.09 the full system on one screen in the handout's 1–6 layout, closing the page.
- **Captions describe the borrowed design move, not the source company:** "Novel · from iCOMAT" stays as the attribution,
  but the spec line says what was borrowed (e.g. "a draggable before/after split that shows one set of lines in two arrangements").
