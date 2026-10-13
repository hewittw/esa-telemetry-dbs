import type { Metadata } from "next";
import Link from "next/link";
import { Martian_Mono, Michroma } from "next/font/google";
import "../../mood-boards/white-immersion/board.css";
import "./wids.css";
import { loadBoardData } from "../../mood-boards/white-immersion/load-data";
import { loadDS } from "./data";
import { ToastProvider } from "./kit";
import { Frame } from "./shell";
import { ColorSection, ComponentsSection, PartsSection, SpaceSection, StatesSection, TypeSection, UiStatesSection } from "./standard";
import { NovelSection } from "./novel";
import { TelemetrySection } from "./telemetry";
import { HeroReadout } from "./hero";
import { PrinciplesSection } from "./principles";

const mono = Martian_Mono({ subsets: ["latin"], variable: "--wi-mono", display: "swap" });
const display = Michroma({ subsets: ["latin"], weight: "400", variable: "--wi-display", display: "swap" });

export const metadata: Metadata = {
  title: "Whiteout · Crystalline · Instrumented · Design System",
  description: "The White Immersion design system: tokens, every component in every state, Igloo and Skyviewer novel components, and telemetry components on our ESA findings.",
};

export default function WhiteImmersionDS() {
  const d = loadDS();
  const field = loadBoardData();
  return (
    <div className={`wi-root wids-root ${mono.variable} ${display.variable} min-h-dvh w-full`}>
      <ToastProvider>
        <Frame field={field}>
          <header className="pt-8 sm:pt-14">
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/" className="wids-btn">← Hub</Link>
              <Link href="/mood-boards/white-immersion" className="wids-btn">Mood board →</Link>
            </div>
            <p className="wids-label wids-backing mt-12 sm:mt-16">Design system · built from the white-immersion mood board · Igloo × Skyviewer, inverted</p>
            <h1 className="wids-display mt-4 text-[21px] leading-[1.1] tracking-[0.04em] min-[360px]:text-[25px] min-[400px]:text-[30px] sm:text-[46px] lg:text-[56px]">
              <span className="wids-backing block">Whiteout ·</span>
              <span className="wids-backing block">Crystalline ·</span>
              <span className="wids-backing block">Instrumented</span>
              <span className="wids-backing mt-2 block text-[var(--muted)]">· Design System</span>
            </h1>
            <p className="wids-backing mt-6 max-w-[62ch] text-[13px] leading-[1.7]">
              A cold, silent white field you fly through. The data is the landscape: every speck drifting behind this page is a real anomaly score from {d.title.replace("Uncovering ", "our paper on ")}. The chrome is a thin HUD pinned to the corners, and one cyan pill, the guided tour, is the only accent.
            </p>
            <HeroReadout counts={{ standard: 30, novel: 9, telemetry: 9 }} />
          </header>
          <ColorSection />
          <TypeSection />
          <SpaceSection />
          <ComponentsSection d={d} />
          <StatesSection />
          <UiStatesSection d={d} />
          <PartsSection d={d} />
          <NovelSection d={d} />
          <TelemetrySection d={d} />
          <PrinciplesSection d={d} />
          <footer className="mt-28 border-t border-[var(--rime)] pt-6">
            <p className="wids-caption wids-backing">End of field. Data: ESA-ADB Missions 1 and 2 · Table 1 and figures from Madhogarhia &amp; Watkins, TTIC 31220. Nothing on this page is saved.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/" className="wids-btn">← Hub</Link>
              <Link href="/mood-boards/white-immersion" className="wids-btn">Mood board →</Link>
            </div>
          </footer>
        </Frame>
      </ToastProvider>
    </div>
  );
}
