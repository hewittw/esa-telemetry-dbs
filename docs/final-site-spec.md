FINAL ADDENDUM (the user's last instructions before going offline; overrides anything that conflicts)

The user won't give feedback until all three finals are done, so make them PERFECT. Tomorrow they pick one.

1. NARRATIVE STRUCTURE (required, in this order, as the page's sections and nav):
   01 Background: the problem (satellites stream dozens of sensor channels; engineers watch them by hand or with
      thresholds; Kotowski et al. 2024 showed unsupervised detectors on the ESA benchmark keep raising false alarms
      but didn't explain why), the data (ESA Missions 1 and 2: channels, subsystems vs operational groups, anomaly
      labels), and the question (Q1: is there latent structure aligned with subsystems? Q2: does learning it improve
      detection?).
   02 What we did: the methods in order of richness (K-Means → PCA → Nystroem-KPCA → GMM with BIC → three VAEs:
      Capacity, Hierarchical, Transformer), and how they're scored (PR-AUC, because anomalies are rare).
   03 Results: Table 1 and the key figures (structure at the group level: K* = 21/29 vs 4–5 subsystems and 18/29
      groups; linear plateau at 0.322; GMM 0.384 on M1; TransformerVAE 0.438 on M2; why global detectors fail:
      the timeline/failure mode).
   04 Conclusions: the takeaways from Section 7 of the paper (the structure is at operational-group granularity;
      richer models help; the bottleneck is multi-modality: each mode has its own normal; future work: temporal
      models, cross-mission).
   05 The paper: the actual paper in the in-style reader (page images), plus Download PDF.
   The hero above 01 states the one-sentence finding and holds the single primary action.

2. AS LITTLE WRITING AS POSSIBLE: every line of copy must come from or closely paraphrase content/report.md (the
   paper). No marketing copy, no restating, no "instructions" prose. Figures and numbers carry the story; text is
   labels, one short lead per section (≤ 25 words), and a ≤ 12-word caption per figure. Cut anything that doesn't help.
   Gloss jargon in ≤ 6 words where it first appears (e.g. "PR-AUC · precision–recall area").

3. STICK TO THE MOOD BOARD AND DESIGN SYSTEM of this style: same fonts, tokens, components, states, textures, and
   motion. Use the design system's components rather than inventing new looks.

4. THE ASSIGNMENT'S DESIGN ELEMENTS AND WHERE THINGS SIT ON THE PAGE MATTER MOST. Visual hierarchy (what's first,
   second, third); placement (the primary action top-left/hero, nav at top, consistent left edge, related things
   grouped, more space between sections than inside); a small purposeful palette; few type sizes used consistently;
   contrast ≥ 4.5:1; obvious affordances; every control with hover/focus/pressed/selected/disabled; simplicity.
   Lay out every section on the same grid with the same rhythm. Check placement at 390 and 1440 especially.

5. Keep everything already required (report viewer + Download PDF; authorship footer "Designed & built by Hewitt
   Watkins" with the accurate paper citation; data honesty; one global mission control; accent audit; page chips;
   guided tour; draw-in motion; all 11 screen sizes; full interaction testing).

6. FINISH COMPLETELY and verify (matrix, interactions, Tab walk, contrast, accent audit, tsc) before reporting.
