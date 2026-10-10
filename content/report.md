# Uncovering Latent Structure in ESA Satellite Telemetry

*Presented as a final project for TTIC 31220*

**Rhea Madhogarhia & Hewitt Watkins**
TTIC 31220 — Unsupervised Learning and Data Analysis
The University of Chicago / TTIC
{rheamad, hwatkins}@uchicago.edu

<!-- Source: tticfinalreportrheahewitt (10).pdf (11 pages). Text transcribed verbatim (including original typos/grammar); only layout converted to Markdown. Figures are represented by their captions. -->

---

## Abstract

Spacecraft engineers today monitor 76+ sensor channels manually or with threshold alarms—an approach that is error-prone and demands large teams. Kotowski et al. (2024) showed that existing unsupervised anomaly detection methods consistently produce false alarms on the ESA satellite benchmark, but left open the question of *why*. We run five progressively richer unsupervised methods—K-Means, PCA, Nystroem-KPCA, GMM, and three VAE architectures—on two ESA satellite missions to ask: does the telemetry contain latent structure aligned with known operational subsystems, and does learning that structure improve detection? We find that real, compressible latent structure exists but is multi-modal and mode-specific. Linear methods plateau at PR-AUC = 0.322 (ROC-AUC ≈ 0.62); kernel centroid distance marginally exceeds this at 0.334, but with high sensitivity to hyperparameters and collapsing reconstruction score (0.164 PR-AUC). GMM reaches 0.384 PR-AUC on Mission 1, and the best VAE reaches 0.438 PR-AUC on Mission 2. Crucially, BIC-selected complexity recovers operational *group*-level granularity (K=21 and K=29) rather than coarse subsystem-level (4 and 5). The fundamental bottleneck for all global models is the multi-modal data topology: each operational mode has its own normality baseline, and anomalies scatter across all modes with no single outlier zone.

---

## 1 Introduction

Modern satellites continuously produce vast amounts of sensor data. A satellite's onboard instruments—measuring voltages, temperatures, rotation rates, signal strengths, and more—generate readings across dozens to hundreds of *channels* simultaneously, at sub-minute cadence, over years of operation. The European Space Agency (ESA) engineers monitoring this data must detect *anomalies*: timesteps where something has gone wrong, as opposed to ordinary healthy variation. This is fundamentally difficult because channels are highly correlated (for example, a power fluctuation could affect thermal, attitude control, and communications sensors simultaneously, the satellite's operational mode or state shifts continuously across orbit phases and eclipse windows, and genuine faults (which are rare relative to the total data volume).

The ESA Anomaly Dataset (Kotowski et al., 2024; Andrzejewski et al., 2024) is the first large-scale, publicly available satellite telemetry benchmark with per-channel, per-timestep anomaly labels annotated by ESA engineers. Kotowski et al. (2024) benchmarked a range of existing unsupervised detectors and showed that all produce persistent false alarms—but their work left open the structural question: *what latent organization actually underlies the telemetry, and does that structure explain why detectors fail?*

Our project takes that diagnostic question seriously. We ask: (Q1) Does ESA satellite telemetry contain a consistent latent structure aligned with known operational subsystems, and (Q2) can learning that structure improve unsupervised anomaly detection? Our baseline methods—K-Means, PCA, and Nystroem-KPCA—serve as a structural proof of concept, establishing whether latent structure exists at all, before committing to more expressive generative models (GMM, VAEs). Their failure modes directly motivate and justify the methods that follow.

**Division of labor.** Rhea implemented the baseline experiments (K-Means, PCA, Nystroem-KPCA) and wrote the abstract and Sections 1–3, 6, 7. Hewitt implemented the GMM and VAE experiments and wrote Sections 2, 4–7.

---

## 2 Dataset and Problem Setup

**What is satellite telemetry?** A satellite records measurements from onboard sensors continuously. Each *channel* is one sensor's time series. A *subsystem* is a physically coherent group of spacecraft components (e.g., power management, attitude control); ESA further subdivides each subsystem into finer-grained operational *groups* (e.g. battery charging). Anomaly detection means identifying timesteps where sensor readings indicate something is going wrong—detection is hard because what counts as "normal" depends on the current operational mode. A reading that is normal during an eclipse maneuver may be anomalous during routine orbit.

**ESA Anomaly Dataset** (Kotowski et al., 2024; Andrzejewski et al., 2024). We use Missions 1 and 2: two distinct real ESA satellites with engineer-annotated anomaly labels. Each anomaly label is an ESA engineer annotation marking a timestep as either a genuine system fault (hardware or software failure requiring intervention) or a rare operational event (an unusual but still-operational condition that deviates from routine behavior without indicating a true failure). Mission 1: 76 anonymous channels, 7.4M training timesteps at 0.033 Hz (one reading per ∼30 seconds), 4 subsystems, 18 operational groups. Mission 2: 100 channels, 3.1M training timesteps at 0.056 Hz, 5 subsystems, 29 groups. Mission 1 anomalies are genuine system faults; Mission 2 labels are ≈95% rare operational events rather than true failures. We treat the two missions separately throughout.

**Train / validation / test split (baselines).** The ESA-ADB benchmark defines a temporal 50/50 split for both mission 1 and mission 2. For baseline methods (K-means, PCA, KPCA), we further split the training data 80/20 temporally for model fitting and hyperparameter validation with scaler fit exclusively on the 80% train portion. Our GMM trains on 800K randomly sampled subset drawn from the full training set; BIC-based component selection uses only this sample with no access to test data. The VAEs use a 90/10 temporal split of the training data, with the scaler fit on the 90% training portion only. The 10% holdout set is used for loss signal validation and early stopping. All reported metrics are evaluated on the ESA-ADB test set.

**Evaluation.** Because anomalies are rare (∼10% of Mission 1 timesteps), ROC-AUC is overly optimistic under class imbalance. We report PR-AUC (average precision) as the primary point-wise metric, supplemented by ROC-AUC and, for baseline testing, an event-wise F1 score that counts whether each contiguous anomaly *segment* was caught at the best operating threshold (Hundman et al., 2018)—a fairer measure of operational utility than purely point-wise scoring.

---

## 3 Baseline Methods: K-Means, PCA, and Nystroem-KPCA

To establish structural properties and baseline performance before deploying generative models, we evaluate K-Means, PCA, and Nystroem-KPCA.

**K-Means: Global Clustering.** We sweep K = 2–10 using MiniBatch K-Means. Both silhouette score (0.388) and validation PR-AUC peak at K = 2, rather than the four hypothesized engineering subsystems. The raw feature space geometrically favors a binary split. At K = 2, test PR-AUC reaches 0.322. Analysis of the longest continuous fault reveals a core failure mode: the centroid-distance score spikes sharply at fault onset, but quickly collapses to near zero. Because it is a global model, K-Means simply reassigns the stable anomalous regime to the nearest normal cluster.

**PCA: Linear Compression and Latent Topology.** PCA reveals the telemetry is highly compressible, with d = 33 components retaining 95% of the variance and PC1 displaying near-uniform absolute loadings (CV = 0.006) across channels. However, anomaly detection via reconstruction error or centroid distance in this PCA space yields identical performance (PR-AUC = 0.322). To understand why these global scores plateau, we project the data via t-SNE (Figure 1b). The topology reveals a fragmented archipelago of 10–15 distinct operational modes, with anomalies scattered across nearly every island. There is no single "anomalous zone."

**Nystroem-KPCA: Non-Linear Boundaries.** To test if a non-linear decision boundary better isolates these scattered anomalies, we apply Nystroem-approximated KPCA with an RBF kernel. While centroid distance yields a marginal, fragile improvement (PR-AUC = 0.334), feature-space reconstruction collapses (PR-AUC = 0.164). This confirms that the primary detection bottleneck is not the linearity of the model, but the fundamental assumption of a single global normality baseline. The data's multi-modal topology explicitly requires the local density and generative models explored next.

> **Figure 1:** Baseline Anomaly Detection on Mission 1 (see Figure 2 in Appendix for Silhouette and PCA Loadings Plots).
> (a) K-Means PR curve. (b) t-SNE of PCA-reduced test data.

---

## 4 Parametric Discovery Methods: GMM

Unlike K-Means, which assumes spherical equal-sized clusters and requires K to be pre-specified, a full-covariance GMM fits ellipsoidal correlated clusters and selects K via BIC, directly testing how many operational modes the data contains and whether that count matches the engineering hierarchy.

**Setup.** We first remove constant channels (M1: 8 channels, M2: 33 channels), then apply StandardScaler followed by PCA to 30 components, retaining 99.1% of training variance for Mission 1 and 91.0% for Mission 2. As full-covariance GMMs are numerically unstable in high dimensions, PCA-30 makes the EM covariance estimates tractable while preserving all early signal strength.

**Component selection.** We sweep K ∈ {2, . . . , 20} and select the minimizer of BIC, which penalizes model complexity and favors the K that best explains the data without overfitting. BIC selection reveals the number of distinct operating modes the telemetry naturally decomposes into. Comparing this K against the known subsystem count (M1: 4, M2: 5) and operational group count (M1: 18, M2: 29) tells us whether parametric unsupervised discovery aligns with either level of the engineering hierarchy.

**Anomaly detection.** At test time, the anomaly score for each timestep is its negative log-likelihood (NLL) under the fitted mixture: timesteps that fall in low-density regions of the learned operating-state distribution receive high scores. Any test timestep whose NLL exceeds the 99th percentile of training NLL scores is flagged as an anomaly—in other words, if a point is less likely under the fitted mixture than 99% of normal training points, it is treated as anomalous. The full test set is scored through this StandardScaler → PCA → GMM.

---

## 5 Generative Discovery Methods: VAE

**Shared Setup.** All three VAE models share the same training protocol. Channels are standardized and split 90/10 temporally (scaler fit on the 90% portion only; 10% holdout used for early stopping). The 90/10 split maximizes pure-nominal windows after filtering: only windows where every timestep is nominal (y = 0) enter training, so the model learns a density over clean telemetry and anomalous windows are out-of-distribution at test time. We train on sliding windows of W = 32 timesteps (≈16 minutes at M1 cadence). Three anomaly scores are evaluated: **Reconstruction MSE** (|x̂ − x|² per window), **Negative ELBO** (reconstruction loss plus KL divergence), and **GMM-OOD** (negative log-likelihood of the encoded mean µ under a GMM fit post-hoc on training latent codes). We report all three and select the best per model by validation PR-AUC.

**CapacityVAE (Conv1D + Denoising).** The encoder is a three-layer Conv1D network with feature maps [64, 128, 256] and stride-2 down-sampling at each layer, followed by a linear projection to µ and log σ². The decoder mirrors this with transposed convolutions. Training inputs are corrupted with Gaussian noise (σ = 0.1) while reconstruction targets remain the clean windows; this denoising formulation is intended to improve robustness to sensor noise. The loss uses capacity control to prevent KL collapse (Burgess et al., 2018):

$$\mathcal{L} = \mathbb{E}_{q_\phi(z|x)}\left[\lVert \hat{x} - x_{clean} \rVert^2\right] + \gamma \cdot \left|\mathrm{KL}(q_\phi(z|x) \,\Vert\, p(z)) - C(t)\right| \qquad (1)$$

where C(t) = C_max · min(1, t/t_warmup) increases from 0 to C_max = 50 natural units over the first 40 epochs (γ = 10). Rather than penalizing KL divergence directly as in a standard β-VAE, the capacity term penalizes deviation from a target information budget: if the model uses too little latent capacity (KL collapse) or too much (posterior explosion), the loss increases. This encourages the encoder to learn a structured, informative latent space without degenerating in either direction.

**HierarchicalVAE.** Using the same Conv1D convolutional feature extractor, the latent space is decomposed into a 16-dimensional *global* code z_g and a 16-dimensional *local* code z_l (Sønderby et al., 2016). z_g is obtained by average-pooling the temporal feature maps into a single summary vector capturing the satellite's overall operating state, while z_l flattens all feature maps to retain fine-grained within-window deviations. Together they separately represent what mode the spacecraft is in (z_g) and how the current window deviates from that mode (z_l). The decoder takes the concatenation [z_g, z_l]. The hierarchical design lets us ask whether z_g encodes subsystem-level structure more strongly than z_l. We use β-VAE objective loss + KL warm-up (Burgess et al., 2018):

$$\mathcal{L} = \mathbb{E}\left[\lVert \hat{x} - x \rVert^2\right] + \beta(t) \cdot \left(\mathrm{KL}(q(z_g|x) \,\Vert\, p(z_g)) + \mathrm{KL}(q(z_l|x) \,\Vert\, p(z_l))\right) \qquad (2)$$

where β(t) increases from 0 to β = 1 over the first 20 epochs.

**TransformerVAE.** (Wang et al., 2022) The encoder replaces the convolutional feature extractor with a Transformer: each of the W = 32 timesteps is projected to a 128-dimensional vector with a learned positional embedding added, a learnable `[CLS]` token is prepended, and three layers of multi-head self-attention (4 heads, feedforward dimension 512) process all 33 tokens simultaneously. The `[CLS]` output is mapped to µ and log σ²; the decoder is identical to CapacityVAE. The key motivation is global context: unlike convolutional filters which aggregate locally, each timestep can attend directly to every other timestep in the window, capturing long-range dependencies across the full 16-minute window. The loss uses the same capacity-controlled objective as CapacityVAE:

$$\mathcal{L} = \mathbb{E}_{q_\phi(z|x)}\left[\lVert \hat{x} - x \rVert^2\right] + \gamma \cdot \left|\mathrm{KL}(q_\phi(z|x) \,\Vert\, p(z)) - C(t)\right| \qquad (3)$$

with C_max = 25 natural units, γ = 50, and warm-up = 60 epochs (transformers generally take longer to converge).

---

## 6 Results and Discussion

Table 1 summarizes all methods with numbers grounded in executed notebook outputs.

**The data has real, compressible latent structure (Q1: yes).** For Mission 1, d = 33 principal components retained 95% of the variance, while the first principal component exhibited nearly uniform absolute loadings across a coherent channel group (CV = 0.006), revealing a shared latent structure recovered without supervision. For Gaussian mixture modeling, PCA on a telemetry subsample showed that 30 components retained 99.1% of Mission 1 variance and 91.0% of Mission 2 variance, indicating that both datasets occupy low-dimensional manifolds despite their high raw dimensionality. Moreover, GMM model selection using BIC and VAE latent-space silhouette analysis independently converged on a group-level granularity of approximately 18–29 modes. The consistency of these estimates across missions and model families provides strong evidence that the underlying low-dimensional structure is both real and recoverable without labels.

**Table 1:** Point-wise and event-wise performance across all methods. *Note: GMM and VAE use different fitting protocols from the 80/20 baseline split—see Sections 4 and 5. Results have been updated since poster presentation.*

| Method | Scoring | PR-AUC | ROC-AUC | Ev. F1 | Trend |
|---|---|---:|---:|---:|---|
| K-Means (M1, K = 2) | Centroid dist. | 0.322 | 0.620 | 0.661 | Baseline |
| PCA Recon (M1, d = 33) | Recon. MSE | 0.322 | 0.623 | 0.501 | Neutral |
| PCA + K-Means (M1) | Centroid dist. | 0.317 | 0.612 | 0.576 | Neutral |
| Nystroem-KPCA Dist (M1) | Centroid dist. | 0.334 | 0.611 | 0.661 | +0.012 ↑ |
| Nystroem-KPCA Feat-Recon (M1) | Recon. (feat.) | 0.164 | 0.605 | 0.314 | Regress ↓ |
| GMM (M1, K = 21) | Neg. log-lik. | 0.384 | 0.692 | — | Improve ↑ |
| GMM (M2, K = 29) | Neg. log-lik. | 0.390 | 0.764 | — | Improve ↑ |
| CapacityVAE (M1, lat. K = 5) | GMM-OOD | 0.305 | 0.640 | — | Regress ↓ |
| HierarchicalVAE (M1, lat. K = 2) | GMM-OOD | 0.293 | 0.591 | — | Regress ↓ |
| TransformerVAE (M1, lat. K = 16) | GMM-OOD | **0.335** | **0.628** | — | Best M1 |
| CapacityVAE (M2, lat. K = 16) | Neg. ELBO | 0.414 | 0.719 | — | Improve ↑ |
| HierarchicalVAE (M2, lat. K = 28) | Recon. MSE | 0.434 | 0.739 | — | Improve ↑ |
| TransformerVAE (M2, lat. K = 18) | Neg. ELBO | **0.438** | **0.749** | — | Best M2 |

*(In the original the table is divided into three blocks by horizontal rules: baselines / GMM / VAEs. Bold as in the original.)*

**The structure is not subsystem-aligned, but likely resembles the amount of satellite sensor groups.** For Mission 1, K-Means silhouette peaks at K = 2 in raw space; the 4-subsystem structure does not appear as 4 tight geometric blobs. t-SNE reveals a fragmented archipelago of operational modes/groupings of sensors. Every unsupervised complexity selector finds group-level (18–29), not subsystem-level (4–5), granularity. Turning to GMM analysis, we see that GMM BIC selects K = 21 for M1 and K = 29 for M2. Considering M1 has 18 defined groups and M2 has 29 defined groups, this suggests that GMM's flexible density modeling naturally recovers near sensor-group-level granularity of the satellite operations. Additionally, we see the strongest classification performance from VAEs that recover a latent K much higher than the number of defined subsystems. For M1 TransformerVAE recovers a latent K = 16; for M2 TransformerVAE recovers a latent K = 18. Both recovered latent Ks fall between the subsystem count and the group count, suggesting that VAE's latent space captures an intermediate operational granularity; one that is coarser than individual sensor groups but also finer than engineering subsystems. This may reflect a true, hidden latent topology that sits behind the operations of these satellites. In this middle ground, we believe it is possible latent space is capturing collections of sensors that repeatedly co-activate together to support specific operational behaviors. These behaviors are likely less complex than an action a complete subsystem would perform, but require the coordinated efforts of multiple sensor groups to achieve an operational objective.

**Richer models improve detection; anomaly type determines which works best.** The optimal GMM used 21 local density components and achieved a PR-AUC of 0.384. On Mission 1 fault detection, it outperformed all VAE models (ROC-AUC 0.692 versus 0.628). However, on Mission 2 rare-event detection, the VAEs achieved higher precision-recall performance (PR-AUC 0.438 versus 0.390). This pattern suggests that GMMs excel at modeling and detecting deviations within known operating regimes, while VAEs are more effective at identifying novel or out-of-distribution behavior.

---

## 7 Conclusions and Future Work

ESA satellite telemetry contains latent structure at the operational *group* level (18–29 modes), not the coarse subsystem level (4–5). Every unsupervised complexity selector we tried converged on this intermediate granularity across both missions. GMM and VAEs improve over linear baselines, especially on Mission 2, but the root bottleneck persists: anomalies are mode-specific and temporally structured in ways static global models cannot fully capture. Future directions include temporal models (LSTM-VAE, HMM) to capture per-mode dynamics, and cross-mission generalization—three shared subsystems across both missions offer a direct test of whether the discovered structure is satellite-specific or fundamental to spacecraft operations. In future iterations of the datasets, we suggest labeling what each channel is measuring and its physical units, as well as the channel's expected nominal operating range. With this additional information, the intermediate latent structure we observed could be explored within the context of the satellite's intended system performance.

---

## Acknowledgments

We thank the TTIC 31220 course staff for feedback throughout the project.

---

## References

- Jacek Andrzejewski, Bogdan Ruszczak, Jakub Nalepa, Daniel Lakey, Peter Collins, Aybike Kolmas, Mauro Bartesaghi, Jose Martínez-Heras, and Gabriele De Canio. ESA anomaly dataset, 2024. URL https://doi.org/10.5281/zenodo.12528696.
- Christopher P. Burgess, Irina Higgins, Arka Pal, Loic Matthey, Nick Watters, Guillaume Desjardins, and Alexander Lerchner. Understanding disentangling in β-VAE. *arXiv preprint*, 2018. doi: https://doi.org/10.48550/arXiv.1804.03599.
- Ian Goodfellow, Yoshua Bengio, and Aaron Courville. *Deep Learning*. MIT Press, 2016. URL http://www.deeplearningbook.org.
- Kyle Hundman, Valentino Constantinou, Christopher Laporte, Ian Colwell, and Tom Soderstrom. Detecting spacecraft anomalies using LSTMs and nonparametric dynamic thresholding. In *Proceedings of the 24th ACM SIGKDD International Conference on Knowledge Discovery & Data Mining*, pp. 387–395, 2018. doi: 10.1145/3219819.3219845.
- Diederik P Kingma and Max Welling. Auto-encoding variational bayes. *arXiv preprint arXiv:1312.6114*, 2013. doi: https://doi.org/10.48550/arXiv.1312.6114.
- Krzysztof Kotowski, Christoph Haskamp, Jacek Andrzejewski, Bogdan Ruszczak, Jakub Nalepa, Daniel Lakey, Peter Collins, Aybike Kolmas, Mauro Bartesaghi, Jose Martinez-Heras, and Gabriele De Canio. European Space Agency benchmark for anomaly detection in satellite telemetry. *arXiv preprint*, 2024. doi: 10.48550/arXiv.2406.17826.
- Krzysztof Kotowski, Christoph Haskamp, Jacek Andrzejewski, Bogdan Ruszczak, Jakub Nalepa, Daniel Lakey, and Gabriele De Canio. European Space Agency dataset and benchmark for anomaly detection in real-world time series, 2025. URL https://openreview.net/forum?id=FYEGPuUrpo.
- Daniel Lakey and Tim Schlippe. A comparison of deep learning architectures for spacecraft anomaly detection. In *2024 IEEE Aerospace Conference*, pp. 1–11. IEEE, 2024. doi: https://doi.org/10.1109/AERO58975.2024.10521015.
- Jing Lu, Yan Fang, Shuai Fan, and Xin Wu. Self-supervised intelligent autoencoder with multi-scale convolutional contrastive learning for multivariate anomaly detection. *Journal of Intelligent & Fuzzy Systems*, pp. 18758967251407728, 2025. doi: 10.1177/18758967251407728.
- Casper Kaae Sønderby, Tapani Raiko, Lars Maaløe, Søren Kaae Sønderby, and Ole Winther. Ladder variational autoencoders. *Advances in Neural Information Processing Systems*, 29, 2016. doi: https://doi.org/10.48550/arXiv.1602.02282.
- Laurens van der Maaten and Geoffrey Hinton. Visualizing data using t-SNE. *Journal of Machine Learning Research*, 9(86):2579–2605, 2008. URL http://jmlr.org/papers/v9/vandermaaten08a.html.
- Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, and Illia Polosukhin. Attention is all you need. *Advances in Neural Information Processing Systems*, 30, 2017. URL https://proceedings.neurips.cc/paper_files/paper/2017/file/3f5ee243547dee91fbd053c1c4a845aa-Paper.pdf.
- Xixuan Wang, Dechang Pi, Xiangyan Zhang, Hao Liu, and Chang Guo. Variational transformer-based anomaly detection approach for multivariate time series. *Measurement*, 191:110791, 2022. ISSN 0263-2241. doi: https://doi.org/10.1016/j.measurement.2022.110791. URL https://www.sciencedirect.com/science/article/pii/S0263224122000914.
- Christopher K. I. Williams and Matthias Seeger. Using the Nyström method to speed up kernel machines. In *Advances in Neural Information Processing Systems*, volume 13. MIT Press, 2001. URL https://proceedings.neurips.cc/paper_files/paper/2000/file/19de10adbaa1b2ee13f77f679fa1483a-Paper.pdf.

---

## Appendix A: Supplementary Figures

> **Figure 2:** Mission 1 Telemetry: K-Means Silhouette and Principal Component Loadings.
> (a) Silhouette and val PR-AUC vs. K. (b) Absolute PC1 loadings.

> **Figure 3:** Timeline failure modes. Both global methods are effectively blind to the persistent anomalous state once the satellite settles into it.
> (a) K-Means alarm score over the longest test anomaly (116,061 timesteps, ≈967 hours, starting 2009-05-25). Spike at onset, then collapse: the model re-assigns the persistent anomalous state to a cluster.
> (b) PCA reconstruction error over the same window. Flat throughout: the anomaly lies in directions that PCA's normal-variance components do not represent.

> **Figure 4:** t-SNE on raw 76D (left) vs. PCA-33D (right), both perplexity=30. The fragmented operational-mode topology is qualitatively identical in both inputs, confirming the multi-modal structure is intrinsic to the data and not an artifact of PCA pre-processing.

> **Figure 5:** Nystroem-KPCA sensitivity analysis and test results.
> (a) Nystroem-KPCA validation PR-AUC sweep (n_components=300). Only γ = 0.1/n performs above the baseline; higher bandwidths collapse. Best: pca_dim=5, val PR-AUC=0.208.
> (b) KPCA test-set PR curves. Centroid distance (0.334) marginally beats the baseline; feature-space reconstruction (0.164) collapses.

> **Figure 6:** Additional PCA analysis.
> (a) PCA scatter: PC1 vs. PC2. Full range (left) is dominated by extreme outliers; clipped (right) reveals anomalies forming a distinct sub-PC2 region in the bulk.
> (b) PCA pipeline PR curves. Reconstruction error and K-Means in PCA space both match the raw K-Means baseline.

> **Figure 7:** TransformerVAE Latent Space Structure on Mission 1 and Mission 2.
> (a) t-SNE of TransformerVAE latent space on Mission 1, colored by K-Means cluster (K=16). 16 distinct operational modes emerge, sitting close to the 18-group levels of the ESA engineering hierarchy.
> (b) t-SNE of TransformerVAE latent space on Mission 2, colored by K-Means cluster (K=18). 18 operational modes emerge, which is well above the 5-subsystem level but below the 29-group level.

---

<!-- Editorial addendum (not part of the report text): labels legible inside the report's figure images. -->
### Labels legible inside the report figures

These come from the figure images in the PDF. They are not saved data.

- Fig. 1a: title "Alarm Accuracy vs. Catch Rate (point-wise)"; legend "K-Means (PR-AUC=0.322)".
- Fig. 1b: title "Non-Linear Map of Operations (t-SNE on PCA-33D, perplexity=30)"; legend Normal / Anomaly.
- Fig. 2a: title "Choosing K: geometry (silhouette) vs. detection (val PR-AUC)"; legend "Silhouette (geometry)", "Selected K=2", "4 subsystems (M1)", "Validation PR-AUC (detection)"; K = 2–10.
- Fig. 2b: title "What Drives the Primary Pattern? (PC1 Loadings – absolute values)"; annotation "Range: [0.1685, 0.1753], CV = 0.006".
- Fig. 3a: title "Model Sensitivity During a Test Anomaly Event (longest segment, 116061 timesteps)"; legend "Alarm Score", "True Anomaly".
- Fig. 3b: title "Reconstruction Error During Subsystem Event"; legend "Recon Error", "True Anomaly".
- Fig. 5a: title "Choosing the number of components (n_components=300)"; series gamma = 0.1/n, 0.5/n, 1.0/n, 2.0/n; x = pca_dim ∈ {5, 10, 15, 25, 40}; "chosen dim=5".
- Fig. 5b: title "Precision-Recall: Nyström-KPCA"; legend "KPCA Dist (PR-AUC=0.334)", "KPCA Feat-Recon (PR-AUC=0.164)".
- Fig. 6a: titles "Top 2 Principal Components (full range)" and "(99th-pct clipped)".
- Fig. 6b: title "Precision-Recall (PCA pipeline)"; legend "PCA Recon (PR-AUC=0.322)", "PCA+KMeans (PR-AUC=0.317)".
- Fig. 7: panel titles "K-Means (K=16)" and "K-Means (K=18)".
