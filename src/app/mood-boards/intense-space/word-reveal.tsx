"use client";

import { useEffect, useRef, useState } from "react";

// iCOMAT-style statement: words brighten one by one as the tile moves up the viewport.
export function WordReveal({ text, lead }: { text: string; lead: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = text.split(" ");
  const [lit, setLit] = useState(words.length);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let best = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the paragraph's top hits 90% of the viewport, 1 by the time it reaches 55%.
      // Progress only ever grows: once read, the sentence stays lit, so a fast scroller
      // (or a still screenshot taken after scrolling) never sees a half-dimmed finding.
      const p = Math.min(1, Math.max(0, (vh * 0.9 - r.top) / (vh * 0.35)));
      best = Math.max(best, Math.round(p * words.length));
      setLit(best);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [words.length]);

  return (
    <p ref={ref} className="text-[clamp(22px,2.3vw,34px)] font-medium leading-[1.08] tracking-[-0.02em]" aria-label={`${lead} ${text}`}>
      <span aria-hidden className="text-(--is-steel)">{lead} </span>
      {words.map((w, i) => (
        <span
          key={i}
          aria-hidden
          className="transition-[color,opacity] duration-300 ease-out"
          style={{ color: "var(--is-frost)", opacity: i < lit ? 1 : 0.42 }}
        >
          {w}{" "}
        </span>
      ))}
    </p>
  );
}
