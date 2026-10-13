# Lucid iterations: spec (from Hewitt, 2026-10-13 ~12:20; due 5:30 PM CDT)

Hewitt picked **Lucid · Patient · Inked** (refined-paper). Three new versions iterate on `/finalists/refined-paper`,
each trying to **use UI to bring the paper to life** for **a researcher who knows nothing about the project.
That researcher is the grader.** Explain more than before; there's room. Stay strictly in the Lucid mood board
and design system (`src/app/mood-boards/refined-paper`, `src/app/design-systems/refined-paper`, `docs/styles/refined-paper.md`).

## The same opening in all three (required)
1. **Hero:** the paper's title, *Uncovering Latent Structure in ESA Satellite Telemetry*, as the H1. A **fine ink line
   drawing of a satellite** (drawn in SVG, in the palette, a generic satellite because the dataset anonymises the
   missions) **to the left**, optionally with a slow, quiet orbit or draw-in. **Underneath:** one short sentence on
   the paper's goal. Authors + course line. The one vermilion action ("Read the paper").
   NOT a finding-as-headline; the finding moves to Results / Conclusions.
2. **First section, explaining the context, in this order:**
   - This was a machine-learning project for TTIC 31220 *Unsupervised Learning and Data Analysis* (UChicago/TTIC, Spring 2026).
   - What ESA is (the European Space Agency, Europe's space agency, which operates satellites and mission control).
   - What satellite telemetry is (sensor channels, e.g. voltages, temperatures, rotation rates, streamed continuously).
   - Where the data came from: the **ESA Anomaly Dataset** (Kotowski et al. 2024; Andrzejewski et al. 2024), two real
     ESA missions, anonymised.
   - Why it's novel: the first large-scale public satellite-telemetry benchmark with per-channel, per-timestep anomaly
     labels annotated by ESA engineers.
   - **The gap:** Kotowski et al. showed existing unsupervised detectors keep producing false alarms on it, but left
     open *why*. This paper asks what latent structure underlies the telemetry, and whether that explains the
     failures (Q1, Q2).
3. Then the paper's arc, section by section: Dataset & setup → Methods → Results → Conclusions → the paper itself
   (the reader + Download PDF). **The interactive figures are SUBSECTIONS inside these main paper sections**, not
   free-floating sections of their own.

## Titles
Section and figure titles must mean something to a newcomer. No insider shorthand as a title (bad: "Telemetry's
structure sits at the level of operational groups"; bad: "S1 4 gr"). Use plain, specific titles ("What the data
looks like", "How many operating modes does the data contain?"), and gloss every term at first use.

## Copy rules
- Every fact comes from `content/report.md` (the paper) or is general knowledge stated plainly (what ESA is).
  Accuracy rules (verifiers found these errors before):
  - Claim group-level **granularity**, not that the structure "lives in" or matches the groups.
  - 0.322 is the **linear** plateau. The M1 VAEs land close to it (0.293–0.335; only TransformerVAE, 0.335, edges
    above); GMM is 0.384 on M1; the VAEs lead M2 (0.414–0.438). Never say "mode-aware models clear it" for M1.
  - Multi-modality is "the fundamental bottleneck for all global models".
  - Two-run rows are "Mixed".
  - Page chips match the page images (p1 = abstract + §1 + Q1/Q2; p2 = §2 + §3 K-Means/PCA; p3 = KPCA + Fig 1 + §4 GMM;
    p4 = VAEs + start of §6; p5 = Table 1 + §7; p7 = Fig 3; p9 = Fig 5; p11 = Fig 7).
- Clear, plain, generous enough to teach, but no filler or marketing. Prefer one good sentence to three.

## Keep (all already working in the seed)
One vermilion action per view; one global mission control; page chips → reader; Table 1 with provenance; the
reader + Download PDF; draw-in motion (never half-drawn; reduced motion = final); the authorship footer
("Designed & built by Hewitt Watkins"; the paper citation Rhea Madhogarhia & Hewitt Watkins; who did what); the 9 design
requirements; all 11 screen sizes; states on every control; contrast ≥ 4.5:1.

## The three versions (each tries to do the above *best*, in its own way)
- **A · The Essay** (`/lucid/essay`): one beautifully paced long read in the Ciechanowski/Distill tradition. Prose and
  figures interleave; figures sit inline exactly where the text needs them, with colour-keyed words tying text to plots.
- **B · The Paper, Alive** (`/lucid/paper`): mirrors the paper's own structure (Abstract · 1 Introduction · 2 Dataset and
  Problem Setup · 3 Baseline Methods · 4 GMM · 5 VAEs · 6 Results and Discussion · 7 Conclusions), like an annotated
  journal page. The interactive figures replace or accompany the paper's static figures inside their sections, with
  margin notes and a sticky section rail.
- **C · The Explainer** (`/lucid/explainer`): a better version of the current finalist. Same components, but
  restructured for a newcomer: the context section first, plain titles, a short "what you'll learn" line, a glossary,
  and every result explained in one plain sentence before its figure.
