import Image from "next/image";
import Link from "next/link";
import type { MoodBoardMeta } from "@/lib/mood-board-types";
import { board as intenseSpace } from "./mood-boards/intense-space/meta";
import { board as refinedPaper } from "./mood-boards/refined-paper/meta";
import { board as whiteImmersion } from "./mood-boards/white-immersion/meta";

// The hub: the submitted URL. Neutral on purpose; the final site (the Lucid Essay) is featured in 03.
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
        Three visual directions, three design systems, and one final site that brings the paper{" "}
        <em>Uncovering Latent Structure in ESA Satellite Telemetry</em> to life.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
        <Link
          href="/lucid/essay"
          className={`inline-flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-neutral-700 active:scale-[0.97] ${ring}`}
        >
          Open the final site <span aria-hidden>→</span>
        </Link>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-neutral-500">
          Designed &amp; built by Hewitt Watkins
        </p>
      </div>

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

      <section className="mt-20" aria-labelledby="site">
        <SectionHead n="03" title="The Final Site" note={`In the style Hewitt picked: ${refinedPaper.name}`} />
        <span id="site" className="sr-only">The Final Site</span>
        <Link
          href="/lucid/essay"
          className={`group mt-8 grid overflow-hidden rounded-xl border border-neutral-900 transition-shadow hover:shadow-[0_18px_50px_-24px_rgba(0,0,0,0.45)] active:scale-[0.995] md:grid-cols-12 ${ring}`}
        >
          <div className="relative aspect-[16/9] overflow-hidden border-b border-neutral-900 bg-neutral-100 md:col-span-7 md:aspect-auto md:min-h-[360px] md:border-b-0 md:border-r">
            <Image
              src="/site/essay-hero.jpg"
              alt="The final site's opening: the paper's title beside an ink line drawing of a satellite"
              fill
              sizes="(min-width: 768px) 700px, 100vw"
              className="object-cover object-left-top transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              priority
            />
          </div>
          <div className="flex flex-col justify-between gap-8 p-6 md:col-span-5 md:p-8">
            <div>
              <p className="inline-flex rounded-full bg-neutral-900 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-white">
                Final site
              </p>
              <h3 className="mt-5 text-3xl font-semibold leading-[1.05] tracking-[-0.025em] md:text-4xl">
                The Essay
              </h3>
              <p className="mt-2 font-mono text-xs text-neutral-500">{refinedPaper.name} · /lucid/essay</p>
              <p className="mt-4 text-[15px] leading-relaxed text-neutral-700">
                The paper as one paced long read: who it&apos;s for and why the data matters, then the data, the
                methods, the results and the conclusions, with interactive figures placed exactly where the text
                needs them. It ends with the paper itself in a page reader, with a PDF download.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-[15px] font-medium">
              <span className="group-hover:underline">Open the final site</span>
              <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
            </span>
          </div>
        </Link>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium">Our pick, and why</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-neutral-700">
              <strong className="font-medium text-neutral-900">{refinedPaper.name}.</strong> The paper is the subject, so
              the site reads like a beautifully typeset journal page: a serif for the argument, ink-blue and ochre plot
              lines named by matching words in the text, and one vermilion action. Of three iterations in that style,
              the <strong className="font-medium text-neutral-900">Essay</strong> won: a researcher meeting this work for
              the first time learns it in order, in one voice, and can check every number against the page of the
              paper that backs it.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium">The browser check</h3>
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
      <section className="mt-20" aria-labelledby="other">
        <SectionHead n="05" title="Other Iterations" note="Not the final site; kept to show the process" />
        <span id="other" className="sr-only">Other Iterations</span>
        <div className="mt-8 grid gap-10 md:grid-cols-3">
          <div>
            <h3 className="text-sm font-medium">The other two {refinedPaper.name} iterations</h3>
            <ul className="mt-3 divide-y divide-neutral-200 border-y border-neutral-200">
              {[
                { t: "B · The Paper, Alive", d: "The paper's own sections, with margin notes", href: "/lucid/paper" },
                { t: "C · The Explainer", d: "Context first, plain titles, a glossary", href: "/lucid/explainer" },
              ].map((v) => (
                <li key={v.href}>
                  <Link href={v.href} className={`group flex items-center justify-between gap-4 py-3 text-sm ${ring}`}>
                    <span>
                      <span className="block group-hover:underline">{v.t}</span>
                      <span className="block text-neutral-500">{v.d}</span>
                    </span>
                    <span aria-hidden className="font-mono text-xs text-neutral-500">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium">Earlier finals, one per style</h3>
            <ul className="mt-3 divide-y divide-neutral-200 border-y border-neutral-200">
              {[
                { b: intenseSpace, href: "/telemetry" },
                { b: refinedPaper, href: "/finalists/refined-paper" },
                { b: whiteImmersion, href: "/finalists/white-immersion" },
              ].map(({ b, href }) => (
                <li key={href}>
                  <Link href={href} className={`group flex items-center justify-between gap-4 py-3 text-sm ${ring}`}>
                    <span className="group-hover:underline">{b.name}</span>
                    <span className="font-mono text-xs text-neutral-500">final →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium">First builds, one per style</h3>
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

      <section className="mt-20" aria-labelledby="about">
        <SectionHead n="—" title="About this site" note="Authorship" />
        <div id="about" className="mt-6 grid gap-6 text-[15px] leading-relaxed text-neutral-700 md:grid-cols-2">
          <p>
            This site is <strong className="font-medium text-neutral-900">Hewitt Watkins&apos;s project</strong>:
            the research, the three mood boards, the three design systems, and the final site were directed,
            designed, and built by Hewitt for MPCS 51238 <em>Design, Build, Ship</em> (UChicago, Autumn 2026).
          </p>
          <p className="text-neutral-600">
            The paper it presents was written for TTIC 31220 (Spring 2026) by Rhea Madhogarhia and Hewitt
            Watkins.
          </p>
        </div>
      </section>
    </main>
  );
}
