# content/ — ESA telemetry project data for the website

Extracted (read-only) from `/Users/school/Documents/UChicago/UsupervisedLearning/project/`.
The source of truth is the final report, `tticfinalreportrheahewitt (10).pdf`. No raw telemetry was copied, and no models were re-run. All numbers in `figures-data/` were either parsed from printed notebook outputs or computed cheaply (sorting and binning) from saved score arrays.
Generator script: `export.py` (kept in the agent scratchpad and not part of this folder; it can be re-created on request).

## Files

| File | What it is | Source |
|---|---|---|
| `report.md` | Verbatim transcription of the report: abstract, sections 1–7, equations, Table 1 with caption and notes, all figure captions, acknowledgments, references. A clearly marked addendum lists the labels legible inside the figure images. | PDF (pdftotext + visual check) |
| `results.json` | Table 1 as rows (`method, label, family, mission, latentK, d, scoring, prAuc, rocAuc, eventF1, trend`), each with a `verification` block that cross-checks it against notebooks/npz. Also `headline` facts: channels, timesteps, sample rates, subsystem/group counts, splits, PCA 33 = 95%, BIC K = 21/29, KPCA settings, VAE hyperparameters. | PDF; verification from notebooks |
| `figures-data/pr-curves-m1.json`, `pr-curves-m2.json` | PR curves (`points: [[recall, precision], ...]`, ~750 pts each) for every saved score array: GMM, HVAE, and earlier CapacityVAE/TransformerVAE runs, plus the K=8 K-Means run (M1). `table1` on each curve shows whether it corresponds to a Table 1 row (`exact` or `partial`). | `*.npz` score arrays |
| `figures-data/score-timelines-m1.json`, `-m2.json` | Anomaly score over the full test set, 1,500 bins: `[startIndex, median, max, anomalyFraction]`, plus every anomaly segment `[start, end)` (M1: 89, M2: 355). Series: M1 K-Means K=8, GMM, HVAE GMM-OOD; M2 GMM, HVAE Recon, TransformerVAE Neg-ELBO (earlier run). | npz |
| `figures-data/longest-anomaly-m1.json` | Zoom on the longest M1 test anomaly (indices 2,521,579–2,637,640 = 116,061 timesteps, matching the Fig. 3 caption), with a 20% margin either side, 1,200 bins. Series: K-Means K=8, GMM, HVAE. | npz |
| `figures-data/computed-metrics.json` | PR-AUC and ROC-AUC recomputed from every saved score array (33 rows). All of them match the values printed in the notebooks. | npz |
| `figures-data/gmm-bic-sweeps.json` | BIC (and AIC for M1) for K = 2–30, for M1 and M2. `final` = the 800K-sample run used in the report (argmin 21 / 29). `legacy` = the 100K run (26 / 30). | GMM notebook outputs |
| `figures-data/gmm-components-m1.json` | The 21 M1 GMM components: weight, anomaly rate, counts by dominant subsystem (4) and dominant group (17 present). | GMM notebook outputs |
| `figures-data/vae-latent-sweeps.json` | For each VAE run and mission: K-Means silhouette vs K (K = 2–30; one run 2–20), best K, latent GMM K, ARI vs subsystems/groups, all three scores' ROC/PR-AUC, TransformerVAE attention entropy. `usedInReport` maps each run to Table 1. | VAE notebook outputs |
| `figures-data/tvae-threshold-analysis.json` | Best-percentile threshold F1/precision/recall (earliest TransformerVAE run). | `adjusted_thresholds/*.csv` |
| `figures-data/channel-hierarchy.json` | Channel → group → subsystem tree with physical unit and target flag. M1: 76 / 18 / 4. M2: 100 / 29 / 5. | `ESA-Mission{1,2}/channels.csv` (metadata) |
| `figures-data/anomaly-catalogue.json` | Event counts by category, dimensionality, locality, length, and class; duration statistics (hours) by category. | `anomaly_types.csv` + EDA notebook outputs |
| `figures-original/` | 99 PNGs copied from `plots/`, `parametric_discovery/results/`, and `generative_discovery/results/*`. Filenames are the source path with `/` replaced by `__`. These are mostly earlier runs, not the figures in the report. | as named |
| `figures-original/notebook-embedded/` | 37 PNGs pulled out of the notebooks that produced report numbers (run_notebooks_2 VAEs, final GMM notebook) and the early PCA/K-Means notebooks. Includes the report's Fig. 7 t-SNE (`03_vae_transformer__4___cell17/31`). | notebook outputs |

Score arrays are indexed by test timestep. Absolute timestamps were not exported, because the 7 GB test CSVs appear to be cloud-evicted and the read stalled. Cadence per the report: M1 ≈ 30 s and M2 0.056 Hz. The Fig. 3 anomaly starts 2009-05-25. VAE scores contain extreme outliers (up to ~1e32), so use log scales.

## Report figures and their data status

| Report figure | Data here? |
|---|---|
| Fig 1a K-Means PR curve (K=2, 0.322) | **Missing.** Only the K=8 run (PR 0.3306) is in `pr-curves-m1.json`. |
| Fig 1b, Fig 4 t-SNE of raw/PCA test data | **Missing.** No coordinates were saved. |
| Fig 2a silhouette + val PR-AUC vs K (K=2–10) | **Missing.** The report run is not in the repo. (An old 76-channel sweep printed silhouette 0.9746 at K=2, which does not match 0.388.) |
| Fig 2b PC1 absolute loadings | **Missing.** Only the range [0.1685, 0.1753] and CV 0.006 from the figure. |
| Fig 3a/3b timelines over the longest anomaly | **Partial.** Same segment, but GMM/HVAE/K=8 K-Means scores, not the report's K=2 K-Means or PCA recon. |
| Fig 5a KPCA gamma × pca_dim sweep | **Missing.** Only best = pca_dim 5, val PR 0.208. |
| Fig 5b KPCA PR curves | **Missing.** `03_nystroem_kpca.ipynb` was never executed and `kpca_kmeans_results.npz` does not exist. |
| Fig 6a PC1 vs PC2 scatter | **Missing** (image only: `plots__02_pca_scatter.png`, from an earlier run). |
| Fig 6b PCA PR curves (0.322 / 0.317) | **Missing** (`plots__02_pca_pr_curves.png` shows the earlier 0.331 / 0.334 run). |
| Fig 7 TransformerVAE latent t-SNE (K=16 / K=18) | **Missing** as data. Image only (notebook-embedded). Its silhouette-vs-K sweeps *are* in `vae-latent-sweeps.json` (`tvae_report`). |
| PCA scree / cumulative variance | **Missing** as data. Report: d=33 at 95%. The EDA notebook printed 80/90/95% at 22/33/42 PCs on a 200K sample. |
| GMM BIC curves (no figure in report) | Available: `gmm-bic-sweeps.json`. |

## Discrepancies between the report and other files (the report wins)

1. **Baselines cannot be verified.** No saved output reproduces K-Means 0.322 / silhouette 0.388, PCA 0.322 / 0.317, KPCA 0.334 / 0.164, or any event-F1 value. The repo's baseline notebooks are earlier variants (K=8, no 80/20 split; PR 0.3306 / 0.3309 / 0.3344).
2. **HierarchicalVAE M2 row mixes two runs.** "lat. K = 28" is from `run_notebooks/02_vae_hierarchical_(2)` (Recon PR 0.4501 / ROC 0.7403). PR 0.434 / ROC 0.739 are from `run_notebooks_2/02_vae_hierarchical_(3)`, whose latent K = 18.
3. **TransformerVAE M2 row mixes two runs.** K=18 and PR 0.438 come from `run_notebooks_2/03_vae_transformer_(4)`, whose ROC = 0.7381. ROC 0.749 matches the earlier `run_notebooks/03_(3)` (K=15, PR 0.4518).
4. **CapacityVAE M1 PR-AUC.** The notebook gives 0.3037, which rounds to 0.304; the report says 0.305.
5. **GMM PCA variance.** The report says 99.1% (M1) / 91.0% (M2). The final 800K run printed 99.8% / 90.3%; 91.0% is from the older 100K run.
6. **GMM K sweep.** The report says K ∈ {2,…,20}, but the notebook swept 2–30. The selected K=21 lies outside the stated range.
7. **M2 constant channels.** The report says 33 were removed; the notebooks say 17 (100 → 83 active). M1: 8 in both.
8. **RESULTS_SUMMARY.md is stale.** It reports GMM K=26/30 and ROC 0.6662/0.7702 (100K run), VAE latent K=6/2/3 for M1, and "simpler methods win". These are superseded by the report.
9. **Saved VAE score arrays mostly predate the report.** Only `02_run1/hvae_m1_scores.npz` exactly matches a Table 1 VAE row. The report's CapacityVAE and TransformerVAE runs (run_notebooks_2) saved no scores.
10. **ARI "groups".** The VAE notebooks label group ARI as "(17)". M1 has 18 groups, but one group (group 2, all-constant channels) has no dominant timesteps.
