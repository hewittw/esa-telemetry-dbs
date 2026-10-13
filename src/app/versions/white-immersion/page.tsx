import type { Metadata } from "next";
import { Martian_Mono, Michroma } from "next/font/google";
import "./wiv.css";
import { loadSite } from "./data";
import { Site } from "./site";

const mono = Martian_Mono({ subsets: ["latin"], variable: "--wi-mono", display: "swap" });
const display = Michroma({ subsets: ["latin"], weight: "400", variable: "--wi-display", display: "swap" });

export const metadata: Metadata = {
  title: "Latent structure in ESA telemetry · White immersion",
  description: "ESA satellite telemetry has latent structure at the operational-group level (18–29 modes), not the subsystem level (4–5). An explorable white field of the evidence. Designed & built by Hewitt Watkins.",
};

export default function WhiteImmersionSite() {
  const d = loadSite();
  return (
    <div className={`wiv-root ${mono.variable} ${display.variable} w-full`}>
      <Site d={d} />
    </div>
  );
}
