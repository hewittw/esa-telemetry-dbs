# Style: white-immersion · Whiteout · Crystalline · Instrumented

Igloo's glacial WebGL world merged with Rubin Skyviewer's deep pan/zoom, inverted into a white snowfield of data.
A cold, silent field you fly through. The data is the landscape, and the chrome is a thin HUD pinned to the corners.
Board: `/mood-boards/white-immersion`. References: `igloo`, `skyviewer`.

## Color roles (ratios measured, WCAG)
| Role | Name | Hex | On Whiteout | Note |
|---|---|---|---|---|
| background | Whiteout | `#F4F6F8` | n/a | Field; vignette to `#E3E8EE` at the edges |
| surface | Frost | `#FFFFFF` (glass: 72–93% + 12px blur) | 1.08:1 | Cards, HUD blocks, note panel. Always edged in Rime |
| border | Rime | `#D5DCE4` | 1.28:1 | 1px hairlines only; never carries meaning alone |
| muted text | Glacier | `#56616F` | 5.81:1 (6.30 on Frost, 5.11 on `#E3E8EE`) | Labels, captions, HUD keys |
| text | Ink | `#111824` | 16.43:1 (17.8 on Frost) | Body, values, icons, focus rings, selected fills |
| accent | Signal | `#2FE0E3` | 1.50:1, so **fill only** | Primary action (tour pill) with Ink text at 10.93:1 |
Rule: white on white has no contrast, so separation comes from Rime hairlines and Ink. Cyan is never text and never decoration.
Saturation budget: Signal covers about 1% of the view (the board measures its own tour pill live: 0.9% at 1440 × 900). Color is a rare event in a white field, never a wash.

## Type
- **Display:** Michroma 400, tracked +3–6%, caps. Mood name, section stamps, big numerals. Six words max.
- **HUD / body:** Martian Mono (variable). 300 at 10.5–11px tracked caps for HUD keys and labels; 400 at 13px/1.6 for notes;
  500 at 15px for note titles. Nothing above 500. Rendered HUD text never drops below 10px.

## Spacing and shape
- Spacing feel: sparse. Corner HUD sits 24px from the edges (12px on phones). Groups are 8–12px apart inside and 24px+ between.
- The field is an 8 × 4 grid of 700-unit cells. Objects get about 40% empty space around them.
- Corners: 0 on cards and panels (ice slabs). Fully round only on floating controls (44px, or 40px on phones) and the pill.
- Borders: 1px Rime. Shadow: one hairline plus a long cold drop (`0 40px 70px -50px rgba(61,69,88,.45)`), never a soft grey card shadow.

## Motion
- Ease `cubic-bezier(0.22, 1, 0.36, 1)` for UI at 160ms (hover/press) and 400–700ms (crystallize, panel in).
- Camera flights: 850–1900ms by distance, cubic in-out, with a zoom-out arc (a Skyviewer fly-to). Drag has inertia (0.93 decay).
- Scramble-in labels: 400–900ms, left to right. Data figures draw in once over about 1.8s when they get focus, then hold still.
- Ambient: wireframe shards drift at 0.15× camera parallax, and specks at 0.35×. Nothing loops fast. The world is silent.
- `prefers-reduced-motion`: flights become jumps, no inertia, no scramble, no draw-in, and the shards freeze.

## Texture
- Snowfield: the real anomaly-score timelines drawn as faint dotted drifts across the canvas, with labelled anomalies as Ink specks.
- Snow grain at about 3% density behind large white areas, never under text. Thin 1px wireframe shards at 16% Ink.

## Board contents (revised)
28 artifacts, 15 generated (✦) and 13 collected. Color: palette card ✦, Signal-in-use study ✦ (live coverage bar), meltwater saturation-budget photo. Texture: hoar frost, frost growth ✦, snow grain ✦, wireframe shard ✦. Only two website crops remain (floating round controls, corner-pinned HUD text); every note describes the design move and where it goes in the explorer, not the source's subject.

## Interaction model
- Pan (drag / one finger), zoom (wheel / pinch / ± circles), fit (0), coordinate-grid toggle, guided tour vs free explore.
- Tab or ← → steps through objects. Focus flies the camera, draws Ink corner brackets, and opens the note.
- First view: the camera opens close on the title, then pulls back to the field (skipped under reduced motion). Desktop fits the whole world; portrait screens fit its height so the outer columns run off the edges. A frosted hint chip (move glyph + "Drag · pinch · tap a card") holds until the first interaction.
- Notes never cover the object: a side panel on desktop and phone landscape, a bottom sheet with the object flown above it on phones and tablet portrait.

## Do
- Let the data be the landscape. Make the first view vast, then fly in.
- Label every icon control (aria-label + title). Keep HUD text as real DOM text.
- Use one cyan thing per screen, and only for the primary action.

## Don't
- Grey cards with soft shadows and 12px radius, or Inter. No purple, no glow, no gradients on surfaces.
- Cyan text on white (1.5:1). Muted text lighter than Glacier.
- Canvas-only text, scroll-jacking that hides content, or loaders that gate the first paint.

## Design system (`/design-systems/white-immersion`)
Files: `src/app/design-systems/white-immersion/` (page-scoped `wids.css`, every class `wids-`, wrapped in `@layer components` so Tailwind utilities still win).
- **Layout call:** a normal scroll document inside the immersive frame, not a full pan/zoom canvas. A UI library has to be scannable, linkable, keyboard-first and readable on a 320px phone, so the camera language moves into the frame: a fixed snowfield of our real score timelines (parallax 0.35/0.5/0.15), an Igloo corner HUD (section, item, Y, zoom, frame, mode), Skyviewer floating circles (prev/next section, atlas, coordinate grid), fly-to between sections with a field zoom-out arc, a guided tour (the one cyan pill) vs free explore, and an atlas that zooms out to every component. Real pan/zoom lives in the N06–N09 deep-zoom viewer, where it serves the data.
- **Added tokens:** `--press #E9EDF2` (pressed fill), `--dis #7B8794` (disabled text, 3.66:1 on Frost), `--fast 160ms`, `--slow 520ms`, skeleton `#E8EDF2`.
- **State recipe:** hover = inset 1px Ink · focus = 2px Ink ring, offset 3 · pressed = `--press` + 1px sink (or scale .94–.97) · selected = Ink fill / 4px Ink rail / corner brackets · disabled = dashed, `--dis`. A disabled primary loses its cyan.
- **Status:** shape + word, never color: ○ Nominal · ▲ Anomaly · ◇ Rare event · ✕ Comm. gap · ● Best.
- **Lines in charts:** method = dash pattern, not hue. SVG charts measure their container so 10.5px labels render at true size.
- **≥1800px:** the whole system is CSS-zoomed 1.14 (1.4 at ≥2300) so it reads at the same physical size.
- **Sections:** 01–06 handout · 07 Parts of an Interface (all slide elements, slide name + subtitle) · 08 Novel (Igloo, Skyviewer) · 09 Telemetry · L Lecture principles (L1–L9, ending with the one-screen system overview).
