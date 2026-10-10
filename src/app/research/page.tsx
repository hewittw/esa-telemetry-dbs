import type { Metadata } from "next";
import Link from "next/link";
import { getStudies } from "@/lib/research";
import { StudyGrid } from "./study-grid";

export const metadata: Metadata = { title: "Research: 15 Reference Studies" };

export default function ResearchIndex() {
  const studies = getStudies();
  return (
    <main className="mx-auto w-full max-w-[1320px] px-6 pb-32 pt-10 md:px-10">
      <nav className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.16em] text-neutral-500">
        <Link href="/" className="rounded-sm hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900">
          ← Hub
        </Link>
        <span>00 · Research</span>
      </nav>

      <header className="mt-20 grid gap-8 md:mt-28 md:grid-cols-12">
        <h1 className="text-5xl font-semibold leading-[0.95] tracking-[-0.035em] md:col-span-7 md:text-7xl">
          Fifteen sites,
          <br />
          studied before
          <br />
          we design.
        </h1>
        <div className="max-w-md self-end text-[15px] leading-relaxed text-neutral-600 md:col-span-4 md:col-start-9">
          <p>
            Each study pulls out one site&apos;s palette, type, layout, and motion, and names what we&apos;d
            take for our telemetry explorer and what we&apos;d leave. Our three mood boards are remixed from these.
          </p>
          <p className="mt-4 font-mono text-xs text-neutral-400">
            Captured headless at 1440 / 390 px · {studies.length} studies
          </p>
        </div>
      </header>

      <StudyGrid studies={studies} />
    </main>
  );
}
