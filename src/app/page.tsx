import Image from "next/image";
import Link from "next/link";
import type { MoodBoardMeta } from "@/lib/mood-board-types";
import { board as intenseSpace } from "./mood-boards/intense-space/meta";
import { board as refinedPaper } from "./mood-boards/refined-paper/meta";
import { board as whiteImmersion } from "./mood-boards/white-immersion/meta";

// The hub: the submitted URL. Neutral on purpose until the final style is picked.
const boards: MoodBoardMeta[] = [intenseSpace, refinedPaper, whiteImmersion];

const ring =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900";

function SectionHead({ n, title, note }: { n: string; title: string; note: string }) {
  return (
    <div className="flex flex-col gap-1 border-t border-neutral-200 pt-6 sm:flex-row sm:items-baseline sm:justify-between">
      <h2 className="text-xl font-medium tracking-tight">
        <span className="mr-3 font-mono text-sm text-neutral-400">{n}</span>
        {title}
      </h2>
      <p className="text-sm text-neutral-500">{note}</p>
    </div>
  );
}

function MoodBoardCard({ b, i }: { b: MoodBoardMeta; i: number }) {
  return (
    <li>
      <Link href={`/mood-boards/${b.slug}`} className={`group block rounded-lg ${ring}`}>
        <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-neutral-100 ring-1 ring-neutral-200">
          <Image
            src={b.preview}
            alt={`Preview of the ${b.name} mood board`}
            fill
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
            className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        </div>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-neutral-400">0{i + 1}</p>
            <h3 className="mt-1 text-lg font-medium tracking-tight group-hover:underline">{b.name}</h3>
          </div>
          <span aria-hidden className="mt-5 text-neutral-400 transition-transform group-hover:translate-x-1">
            →
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">{b.summary}</p>
        <div className="mt-3 flex items-center justify-between gap-4">
          <div className="flex gap-1" aria-hidden>
            {b.palette.slice(0, 6).map((c) => (
              <span key={c.hex} className="h-3 w-6 rounded-[2px] ring-1 ring-black/10" style={{ background: c.hex }} />
            ))}
          </div>
          <p className="font-mono text-xs text-neutral-500">
            {b.artifactCount} artifacts · {b.generatedCount} ✦
          </p>
        </div>
      </Link>
    </li>
  );
}

export default function Hub() {
  return (
    <main className="mx-auto w-full max-w-[1240px] px-6 pb-32 pt-16 md:px-10">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-500">
        Design, Build, Ship · Assignment 2 · UI/UX &amp; Visual Design
      </p>
      <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-[0.95] tracking-[-0.035em] md:text-7xl">
        ESA Telemetry
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-neutral-600">
        Three visual directions for an interactive explorer of the paper{" "}
        <em>Uncovering Latent Structure in ESA Satellite Telemetry</em>.
      </p>
      <p className="mt-4 font-mono text-xs uppercase tracking-[0.16em] text-neutral-500">
        Designed &amp; built by Hewitt Watkins
      </p>

      <section className="mt-20" aria-labelledby="mb">
        <SectionHead n="01" title="Mood Boards" note="Three directions, 28 artifacts each" />
        <span id="mb" className="sr-only">Mood Boards</span>
        <ol className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((b, i) => (
            <MoodBoardCard key={b.slug} b={b} i={i} />
          ))}
        </ol>
      </section>

      <section className="mt-20">
        <SectionHead n="02" title="Design Systems" note="Each one built from its mood board" />
        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {boards.map((b) => (
            <li key={b.slug} className="rounded-lg border border-dashed border-neutral-300 px-5 py-4">
              <p className="text-sm font-medium">{b.name}</p>
              <p className="mt-1 text-sm text-neutral-400">In progress</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-20">
        <SectionHead n="03" title="The Site" note="In the style we pick" />
        <p className="mt-6 text-sm text-neutral-400">In progress</p>
      </section>

      <section className="mt-20">
        <SectionHead n="00" title="Research" note="Where the three directions came from" />
        <Link
          href="/research"
          className={`mt-6 inline-flex rounded-full border border-neutral-900 px-5 py-2 text-sm transition-colors hover:bg-neutral-900 hover:text-white active:scale-[0.97] ${ring}`}
        >
          Fifteen reference studies →
        </Link>
      </section>
      <section className="mt-20" aria-labelledby="about">
        <SectionHead n="—" title="About this site" note="Authorship" />
        <div id="about" className="mt-6 grid gap-6 text-[15px] leading-relaxed text-neutral-700 md:grid-cols-2">
          <p>
            This site is <strong className="font-medium text-neutral-900">Hewitt Watkins&apos;s project</strong>:
            the research, the three mood boards, the three design systems, and the explorer were directed,
            designed, and built by Hewitt for MPCS 51238 <em>Design, Build, Ship</em> (UChicago, Autumn 2026).
          </p>
          <p className="text-neutral-600">
            The paper it presents was written for TTIC 31220 (Spring 2026) by Rhea Madhogarhia and Hewitt
            Watkins. Hewitt implemented the GMM and VAE experiments; Rhea implemented the K-Means, PCA, and
            Kernel PCA baselines.
          </p>
        </div>
      </section>
    </main>
  );
}
