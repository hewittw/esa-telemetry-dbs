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
        <ul className="mt-8 grid gap-4 sm:grid-cols-3">
          {boards.map((b, i) => (
            <li key={b.slug}>
              <Link
                href={`/design-systems/${b.slug}`}
                className={`group flex h-full flex-col justify-between rounded-lg border border-neutral-200 px-5 py-5 transition-colors hover:border-neutral-900 active:scale-[0.99] ${ring}`}
              >
                <div>
                  <p className="font-mono text-xs text-neutral-400">0{i + 1}</p>
                  <p className="mt-1 text-[15px] font-medium tracking-tight group-hover:underline">{b.name}</p>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                    Color · type · spacing · components in every state · Parts of an Interface · lecture principles ·
                    novel and telemetry components
                  </p>
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <div className="flex gap-1" aria-hidden>
                    {b.palette.slice(0, 6).map((c) => (
                      <span key={c.hex} className="h-3 w-3 rounded-full ring-1 ring-black/10" style={{ background: c.hex }} />
                    ))}
                  </div>
                  <span aria-hidden className="text-neutral-400 transition-transform group-hover:translate-x-1">→</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-20">
        <SectionHead n="03" title="The Site" note="Three finished finals, one per style" />
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { b: intenseSpace, href: "/telemetry", tag: "Final · agent's pick" },
            { b: refinedPaper, href: "/finalists/refined-paper", tag: "Final" },
            { b: whiteImmersion, href: "/finalists/white-immersion", tag: "Final" },
          ].map(({ b, href, tag }, i) => (
            <li key={href}>
              <Link
                href={href}
                className={`group flex h-full flex-col justify-between rounded-lg border border-neutral-900 px-5 py-5 transition-colors hover:bg-neutral-900 hover:text-white active:scale-[0.99] ${ring}`}
              >
                <div>
                  <p className="font-mono text-xs text-neutral-500 group-hover:text-neutral-300">
                    0{i + 1} · {tag}
                  </p>
                  <p className="mt-2 text-[17px] font-medium tracking-tight">{b.name}</p>
                </div>
                <span className="mt-6 text-sm">Open the explorer →</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-10 grid gap-8 md:grid-cols-12">
          <div className="md:col-span-7">
            <h3 className="text-sm font-medium">Our pick, and why</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-neutral-700">
              <strong className="font-medium text-neutral-900">{intenseSpace.name}.</strong> An ML recruiter gets the
              finding in one look, and the instrument aesthetic reads as engineering rigor; research peers get every
              number on real data, with a link to the page of the paper that backs it. All three were finished to the
              same standard so the final choice can be made side by side.
            </p>
            <h3 className="mt-6 text-sm font-medium">The browser check</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-neutral-700">
              Every page was opened in a headless, logged-out browser at 11 screen sizes, from a 320px phone to a
              2560px display, in Chromium and in WebKit (Safari&apos;s engine). Each interaction was run by mouse,
              keyboard, and touch, and contrast was measured. The bugs those checks caught are listed on the{" "}
              <Link href="/decisions" className={`underline underline-offset-4 hover:text-neutral-900 ${ring}`}>
                decisions page
              </Link>
              .
            </p>
          </div>
          <div className="md:col-span-5">
            <h3 className="text-sm font-medium">Earlier candidate versions</h3>
            <ul className="mt-3 divide-y divide-neutral-200 border-y border-neutral-200">
              {boards.map((b) => (
                <li key={b.slug}>
                  <Link href={`/versions/${b.slug}`} className={`group flex items-center justify-between gap-4 py-3 text-sm ${ring}`}>
                    <span className="group-hover:underline">{b.name}</span>
                    <span className="font-mono text-xs text-neutral-500">first build →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
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

      <section className="mt-20">
        <SectionHead n="04" title="Design & Decisions" note="Every choice, what we rejected, and why" />
        <Link
          href="/decisions"
          className={`mt-6 inline-flex rounded-full border border-neutral-900 px-5 py-2 text-sm transition-colors hover:bg-neutral-900 hover:text-white active:scale-[0.97] ${ring}`}
        >
          Read the decision log →
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
