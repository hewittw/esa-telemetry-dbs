"use client";
import { useEffect, useState } from "react";
import { Icon, Scramble } from "./kit";
import { useShell } from "./shell";

// Inventory counted from the page itself, so the numbers can't drift from what is built.
export function HeroReadout({ counts }: { counts: { standard: number; novel: number; telemetry: number } }) {
  const { openAtlas, flyTo } = useShell();
  const [c, setC] = useState(counts);
  useEffect(() => {
    const codes = [...document.querySelectorAll<HTMLElement>("[data-wids-item]")].map((e) => e.dataset.widsItem!);
    setC({
      standard: codes.filter((x) => /^[CP]\d/.test(x)).length,
      novel: codes.filter((x) => /^N\d\d$/.test(x)).length,
      telemetry: codes.filter((x) => /^T\d/.test(x)).length,
    });
  }, []);
  const cells: [string, number, string][] = [["Standard", c.standard, "components"], ["Novel", c.novel, "from Igloo + Skyviewer"], ["Telemetry", c.telemetry, "on our data"]];
  return (
    <div className="mt-10 grid gap-6">
      <dl className="wids-glass grid max-w-[640px] grid-cols-3">
        {cells.map(([k, v, s], i) => (
          <div key={k} className={`px-3 py-3 sm:px-5 sm:py-4 ${i ? "border-l border-[var(--rime)]" : ""}`}>
            <dt className="wids-label">{k}</dt>
            <dd className="wids-num mt-1 text-[28px] leading-none sm:text-[40px]"><Scramble text={String(v).padStart(2, "0")} k={v} ms={700} /></dd>
            <dd className="wids-caption mt-1.5 hidden min-[420px]:block">{s}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="wids-btn" onClick={openAtlas}><Icon n="fit" size={13} />Open the atlas</button>
        <button type="button" className="wids-btn is-ghost" onClick={() => flyTo("color")}>Start at 01 · Color <Icon n="down" size={12} /></button>
      </div>
      <p className="wids-caption wids-backing max-w-[62ch]">Scroll as normal, or let the cyan tour fly you through all ten sections. The atlas zooms out to every component at once. Tab reaches every control, and each one shows a 2px Ink ring.</p>
    </div>
  );
}
