import type { Metadata } from "next";
import { Doto, Fragment_Mono, Host_Grotesk } from "next/font/google";
import "../mood-boards/intense-space/board.css";
import "../design-systems/intense-space/ds.css";
import "./site.css";
import results from "../../../content/results.json";
import { bicSweeps, curves, strands, tableRows, timelines, tree } from "../design-systems/intense-space/data";
import { Site, type Prov } from "./site";

const display = Host_Grotesk({ subsets: ["latin"], variable: "--font-is-display", weight: ["300", "400", "500", "600"] });
const mono = Fragment_Mono({ subsets: ["latin"], variable: "--font-is-mono", weight: "400" });
const dot = Doto({ subsets: ["latin"], variable: "--font-is-dot", weight: ["600"] });

export const metadata: Metadata = {
  title: "Latent structure in ESA satellite telemetry · Hewitt Watkins",
  description:
    "An interactive findings explorer: ESA telemetry has real latent structure at the operational-group level (18–29 modes), not the subsystem level (4–5), and that multi-modality is why global detectors fail.",
};

// Table 1 provenance, straight from results.json's verification fields (cross-checked against
// the notebooks and saved score files): Verified / Near / Recomputed / Not saved.
function provenance(c: ReturnType<typeof curves>): Record<string, Prov> {
  const out: Record<string, Prov> = {};
  for (const r of results.table1.rows) {
    const v = r.verification as { status: string; scores?: string | null; prAuc?: number };
    const curve = c.list.find((x) => x.table1 === r.label);
    if (v.status === "exact")
      out[r.label] = { s: "verified", note: v.scores ? "Matches the executed notebook, and its saved scores redraw the same curve." : "Matches the executed notebook output. Its score arrays weren't saved." };
    else if (v.status === "near") out[r.label] = { s: "near", note: `The notebook prints ${v.prAuc}, which rounds to ${v.prAuc?.toFixed(3)}, not ${r.prAuc.toFixed(3)}.` };
    else if (v.status === "mixed")
      out[r.label] = { s: "recomputed", note: `Table 1 combines two runs. Our curve, recomputed from the saved run's scores, gives AP ${curve ? curve.prAuc.toFixed(3) : "n/a"}.` };
    else out[r.label] = { s: "unsaved", note: "The report's run isn't saved in the repo, so it can't be re-checked." };
  }
  return out;
}

export default function TelemetrySite() {
  const c = curves();
  const data = {
    rows: tableRows(),
    curves: c,
    tl: timelines(),
    bic: bicSweeps(),
    tree: tree(),
    strands: { 1: strands(1), 2: strands(2) },
    prov: provenance(c),
  };
  return (
    <div className={`${display.variable} ${mono.variable} ${dot.variable} is-root min-h-screen w-full`}>
      <Site data={data} />
    </div>
  );
}
