import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";
import "../../design-systems/refined-paper/rpd.css";
import "./rps.css";
import results from "../../../../content/results.json";
import { getBic, getLongest, getPr, getTable1 } from "../../design-systems/refined-paper/data";
import { Site, type Ch, type Prov } from "./site";

const serif = Newsreader({ subsets: ["latin"], axes: ["opsz"], style: ["normal", "italic"], variable: "--rp-serif-face" });
const sans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--rp-sans-face" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--rp-mono-face" });

export const metadata: Metadata = {
  title: "Latent structure in ESA satellite telemetry · Hewitt Watkins",
  description: "ESA telemetry has latent structure at the operational-group level (18–29 modes), not the subsystem level (4–5), and that multi-modality is why global detectors fail.",
};

/** Both missions' channels, as filed by ESA: channel → subsystem → operational group. */
type Hier = Record<"m1" | "m2", { subsystems: { subsystem: string; groups: { group: number; channels: { channel: string }[] }[] }[] }>;
function channels(): Record<1 | 2, Ch[]> {
  const f = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content/figures-data/channel-hierarchy.json"), "utf8")) as Hier;
  const take = (m: "m1" | "m2") => f[m].subsystems.flatMap((s) => s.groups.flatMap((g) => g.channels.map((c) => ({ id: +c.channel.replace("channel_", ""), s: s.subsystem.replace("subsystem_", ""), g: g.group }))));
  return { 1: take("m1"), 2: take("m2") };
}

/** Table 1 provenance, from results.json's verification fields: Verified / Near / Recomputed / Not saved. */
function provenance(): Record<string, Prov> {
  const out: Record<string, Prov> = {};
  for (const r of results.table1.rows) {
    const v = r.verification as { status: string; prAuc?: number; detail?: string };
    if (v.status === "exact") out[r.label] = { s: "verified", note: "Matches the executed notebook." };
    else if (v.status === "near") out[r.label] = { s: "near", note: `The notebook prints ${v.prAuc}.` };
    else if (v.status === "mixed") out[r.label] = { s: "recomputed", note: "K and metrics come from two saved runs." };
    else out[r.label] = { s: "unsaved", note: "The report's run isn't saved in the repo." };
  }
  return out;
}

export default function RefinedPaperFinal() {
  return (
    <div className={`rpd-root rps-root ${serif.variable} ${sans.variable} ${mono.variable}`}>
      <Site data={{ rows: getTable1(), prov: provenance(), pr: getPr(), bic: getBic(), twin: getLongest(), ch: channels() }} />
    </div>
  );
}
