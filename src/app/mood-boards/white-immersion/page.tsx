import type { Metadata } from "next";
import { Martian_Mono, Michroma } from "next/font/google";
import { Immersion } from "./immersion";
import { loadBoardData } from "./load-data";
import s from "./cls";
import "./board.css";

// HUD + notes: a thin, wide mono. Display: a squared techno face in the spirit of Igloo's wordmark.
const mono = Martian_Mono({ subsets: ["latin"], variable: "--wi-mono", display: "swap" });
const display = Michroma({ subsets: ["latin"], weight: "400", variable: "--wi-display", display: "swap" });

export const metadata: Metadata = {
  title: "Mood board: Whiteout · Crystalline · Instrumented",
  description: "An explorable white snowfield of 28 artifacts: Igloo's glacial HUD world merged with Rubin Skyviewer's deep zoom.",
};

export default function WhiteImmersionBoard() {
  const data = loadBoardData();
  return (
    <main className={`${s.root} ${mono.variable} ${display.variable} min-h-dvh`}>
      <Immersion data={data} />
    </main>
  );
}
