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
Imagery: real mission hardware and night scenes (NASA), each with a mono source caption (Planet).

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
