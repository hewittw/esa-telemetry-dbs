# Refined paper: Lucid · Patient · Inked

Board: `/mood-boards/refined-paper` (28 artifacts, 14 ✦; only two web crops, Ciechanowski and Distill, kept for one UI move each). Built from Ciechanowski (GPS), R2D3, Distill (t-SNE, Activation Atlas),
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
Physical references on the board: backlit laid paper (fine laid lines, wide faint chain lines) for the ground, and
loose vermilion pigment for the accent's body, pulled toward brick to hold 5.8:1 with white text.

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

## Design system (`/design-systems/refined-paper`)
Built from this board's tokens, unchanged; files in `src/app/design-systems/refined-paper/` (class prefix `rpd-`).
- Extra tokens the components needed: Mount `#FBF8F2` (card/field fill), Ink-soft `#45403A` (ink hover),
  accent hover `#962F10` / press `#7E2609`, accent wash `#F6E3D6` (the highlighted diagram node),
  error wash `#F7EDE8`, lift `0 18px 40px −24px rgb(33 31 27 / .45)`.
- Status words: sage = verified/improve (✓), ochre = near/mixed (!), oxblood = error/not saved/regress (✕),
  always colour + icon + word. Vermilion is never an error colour.
- Focus: `outline 2px solid Ink, offset 2px` on every control (`focus-visible` only).
- Disabled: edge turns dashed, text Pencil. Selected: Parchment fill + Ink edge (chips add a tick).
- Switch is a 40×22 paper-cut rectangle (3px), not a pill; round only for transport, thumbs, radios.
- Every state in the section-5 matrix renders from the live control's own class string with `data-s` forcing the state.
- Measured: lowest text pairing in use is Graphite on Paper 4.79:1; Pencil on Parchment 4.83:1; body 14.73:1.
- Sideways scrollers (the pairing table, the state matrix): only when the content overflows, a mono hint line
  ("Swipe sideways for more →", then "← Swipe back · End") above, and a 3px ink hairline under it that tracks the
  scroll position. The first column stays pinned. The region is focusable, so arrow keys scroll it too.
- Phone/tablet index: the sticky ≡ Contents menu also lists the current section's components (4.1…, N1…, T1…),
  so any component on a ~40k-px phone page is two taps away.
- Title ornaments: the "·" between the three mood words are Graphite (4.79:1), not Rule-strong (1.94:1).
- Data honesty: an AP taken from an earlier saved run is shown as "saved AP" or with an asterisk, and the
  Table 1 number sits beside it.
- Principles (section L, `principles.tsx`): the week 2 lecture rebuilt on our Mission 2 TransformerVAE "Today"
  screen. Phone mockups are ink-hairline devices (20px corners, an illustration, not a control) with the 3px
  stacked-card offset; every comparison renders the same `Today` component so only one variable changes.
  L1 size/weight/contrast/position · L2 louder vs quieter · L3 type roles with ink leader lines · L4 colour roles
  traced on the screen (+ greyscale: don't use colour alone) · L5 accent everywhere vs one · L6 alignment guides
  in dashed oxblood · L7 ambiguous vs clear affordances (dashed ink = clickable, dashed oxblood + "not a link" =
  false affordance; drawn with ::after so it never fights the focus ring) · L8 this style vs gamified candy, per
  reader (recruiter skimming / peer inspecting) · L9 the handout's 1–6 overview in a browser frame, top of page.
  Below sm, paired phones show one at a time behind a segmented control.
- Parts of an interface: a contact sheet of all 18 slide elements (slide name + subtitle), inert thumbnails
  from the live class strings, each tile linking to its full specimen.
- Best vs highest: Table 1's "Best M1" tag is the best VAE (the paper bolds it). Say "Best VAE on M1"; mark the
  highest PR-AUC per mission with an ink diamond (GMM 0.384 on M1, TransformerVAE 0.438 on M2).
