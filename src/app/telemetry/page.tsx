import type { Metadata } from "next";
import { Doto, Fragment_Mono, Host_Grotesk } from "next/font/google";
import "../mood-boards/intense-space/board.css";
import "../design-systems/intense-space/ds.css";
import "./site.css";
import { bicSweeps, curves, headline, strands, tableRows, timelines, tree } from "../design-systems/intense-space/data";
import { Site } from "./site";

const display = Host_Grotesk({ subsets: ["latin"], variable: "--font-is-display", weight: ["300", "400", "500", "600"] });
const mono = Fragment_Mono({ subsets: ["latin"], variable: "--font-is-mono", weight: "400" });
const dot = Doto({ subsets: ["latin"], variable: "--font-is-dot", weight: ["600"] });

export const metadata: Metadata = {
  title: "Latent structure in ESA satellite telemetry · Hewitt Watkins",
  description:
    "An interactive findings explorer: ESA telemetry has real latent structure at the operational-group level (18–29 modes), not the subsystem level (4–5), and that multi-modality is why global detectors fail.",
};

export default function IntenseSpaceSite() {
  const data = {
    rows: tableRows(),
    curves: curves(),
    tl: timelines(),
    bic: bicSweeps(),
    tree: tree(),
    strands: { 1: strands(1), 2: strands(2) },
    ari: { sub: headline.ariSub, group: headline.ariGroup },
  };
  return (
    <div className={`${display.variable} ${mono.variable} ${dot.variable} is-root min-h-screen w-full`}>
      <Site data={data} />
    </div>
  );
}
