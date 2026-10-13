# Refined paper: Lucid · Patient · Inked

Board: `/mood-boards/refined-paper`. Built from Ciechanowski (GPS), R2D3, Distill (t-SNE, Activation Atlas),
Anthropic's transformer-circuits, and Apple's pacing. The paper as a well-made journal page: light, literate, exact.

## Color roles (contrast measured against Paper #F6F2EA)
| Role | Name | Hex | Contrast | Job |
|---|---|---|---|---|
| Background | Paper | `#F6F2EA` | — | Page ground, with grain at 4.5% |
| Surface | Parchment | `#ECE6D8` | ink on it 13.2:1 | Diagram nodes, selected chips, quiet panels |
| Text | Ink | `#211F1B` | 14.7:1 | Body, headings, axes, primary strokes |
| Muted | Pencil | `#69625A` | 5.4:1 | Captions, labels, tick numerals |
| Border | Rule | `#D9D1C1` (strong `#B9AF9C`) | hairline | 1px rules, card edges, gridlines |
| Accent | Vermilion | `#B0401C` | 5.2:1; white on it 5.8:1 | Primary action only, plus the single highlighted path in a figure |

Plot inks name lines and the matching words in prose, never controls: Prussian `#2D5B88` (6.4:1),
Ochre `#8C5E10` (5.1:1), Sage `#4F7350` (4.8:1), Graphite `#716A5F` (4.8:1). Anomaly band `#E8DCC2`.
Diagram edges: Oxblood `#6A3E35`.

## Type
- **Newsreader** (serif, optical sizes) for prose and headings. **IBM Plex Sans** for UI labels and captions.
  **IBM Plex Mono** (tabular) for numbers, ticks and code. No other faces.
- Display: Newsreader 300, 72/72, −2% (hero up to 140px, −3%). Heading: Newsreader 450, 32/37.
- Body: Newsreader 400, 19/30, 680px measure. Label: Plex Sans 500, 13/17.
- Caption: Plex Sans 400, 12/17, Pencil, with "Figure n." in 600 Ink. Numeral: Plex Mono 400, 11–12, tabular.
- Sentence case everywhere; small uppercase only for mono eyebrows (tracking +8%).

## Space, shape, layers
- Apple pacing: big quiet gaps between groups (96–144px), tight inside a group (8–16px).
- Grid: a 680px text column; figures break out to 1080; one full-bleed band per page at most.
- Corners 2–3px (paper-cut, not pill). Round only for transport buttons and slider thumbs.
- Borders: 1px Rule; 0.75px Ink for axes. No drop shadows on cards; only a soft lift (0 18px 40px −24px, ink at 45%) on
  popovers and notes. Diagram nodes get a 3px offset "stacked card" outline.

## Motion
- 200ms ease-out for control states; 300ms cubic-bezier(.22,.61,.36,1) for reveals; no bounce.
- Figures draw their lines in once when they enter view (1.6–2.4s, same curve). Never loop, never autoplay.
- Object constancy: a ghost of the full curve stays while a step player scrubs, so marks keep their place.
- `prefers-reduced-motion`: everything renders in its final state; transitions drop to 1ms.

## Texture
Fractal-noise paper grain at 4.5%; hairline rules at four weights (ink 0.75, rule 1, hair 0.5, dotted guide).
If you can see the grain, it's too strong.

## Do
- Write the legend in the sentence: colour the noun the same as its line.
- Small multiples on shared axes rather than one overloaded chart.
- Every control: rest, hover (parchment fill or darker ink), focus-visible (2px Ink ring, 2px offset), pressed, disabled.
- Notes and asides: hover/focus reveal on desktop; on phones, tablets and touch, a "Note +" button opens them in flow
  under the caption, never over the content.
- Label any figure drawn from a run that is not the exact Table 1 run, and give the Table 1 number beside it.
- Credit Rhea Madhogarhia and cite Table 1 with a bracketed chip.

## Don't
- No white page with gray cards, no indigo, no gradients, no glassy panels.
- No vermilion on chips, links, or default chart lines.
- No neon anomaly highlights, no dark mode by default, no scroll-jacking.
- No third typeface or all-caps headlines.
