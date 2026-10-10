import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudies, getStudy } from "@/lib/research";

export function generateStaticParams() {
  return getStudies().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata(props: PageProps<"/research/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const s = getStudy(slug);
  return { title: s ? `Study: ${s.name}` : "Study" };
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-neutral-200 py-10 md:grid-cols-12">
      <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-neutral-500 md:col-span-3">
        {n} · {title}
      </h2>
      <div className="md:col-span-9">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3 text-[15px] leading-relaxed text-neutral-800">
      {items.map((t) => (
        <li key={t} className="flex gap-3">
          <span aria-hidden className="mt-[0.6em] h-px w-3 shrink-0 bg-neutral-400" />
          <span className={t.startsWith("(inferred)") ? "text-neutral-500" : ""}>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function StudyPage(props: PageProps<"/research/[slug]">) {
  const { slug } = await props.params;
  const all = getStudies();
  const s = getStudy(slug);
  if (!s) notFound();
  const i = all.findIndex((x) => x.slug === slug);
  const prev = all[(i - 1 + all.length) % all.length];
  const next = all[(i + 1) % all.length];
  const [hero, ...rest] = s.screenshots;
  const desk = rest.filter((r) => !r.src.includes("mobile"));
  const mobile = s.screenshots.find((r) => r.src.includes("mobile"));

  return (
    <main className="mx-auto w-full max-w-[1320px] px-6 pb-32 pt-10 md:px-10">
      <nav className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.16em] text-neutral-500">
        <Link href="/research" className="rounded-sm hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900">
          ← All studies
        </Link>
        <span>
          Study {String(i + 1).padStart(2, "0")} / {all.length}
        </span>
      </nav>

      <header className="mt-16 grid gap-6 md:grid-cols-12">
        <div className="md:col-span-8">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-neutral-500">{s.category}</p>
          <h1 className="mt-3 text-5xl font-semibold tracking-[-0.035em] md:text-7xl">{s.name}</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-neutral-600">{s.oneLine}</p>
        </div>
        <div className="flex flex-col items-start gap-4 self-end md:col-span-4 md:items-end">
          <p className="font-mono text-sm text-neutral-500">{s.moodWords.join(" · ")}</p>
          <a
            href={s.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 active:scale-[0.97]"
          >
            Visit site ↗
          </a>
        </div>
      </header>

      {hero && (
        <figure className="mt-14">
          <div className="overflow-hidden rounded-lg ring-1 ring-neutral-200">
            <Image src={hero.src} alt={hero.caption} width={1440} height={900} priority sizes="(min-width: 1320px) 1240px, 100vw" />
          </div>
          <figcaption className="mt-3 font-mono text-xs text-neutral-500">{hero.caption}</figcaption>
        </figure>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-12">
        {desk.map((d) => (
          <figure key={d.src} className="md:col-span-5">
            <div className="overflow-hidden rounded-lg ring-1 ring-neutral-200">
              <Image src={d.src} alt={d.caption} width={1440} height={900} sizes="(min-width: 768px) 40vw, 100vw" />
            </div>
            <figcaption className="mt-3 font-mono text-xs text-neutral-500">{d.caption}</figcaption>
          </figure>
        ))}
        {mobile && (
          <figure className="md:col-span-2">
            <div className="mx-auto max-w-[220px] overflow-hidden rounded-[22px] ring-1 ring-neutral-200">
              <Image src={mobile.src} alt={mobile.caption} width={780} height={1688} sizes="220px" />
            </div>
            <figcaption className="mt-3 font-mono text-xs text-neutral-500">{mobile.caption}</figcaption>
          </figure>
        )}
      </div>

      <div className="mt-20">
        <Section n="01" title="Palette">
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {s.palette.map((c) => (
              <li key={c.hex + c.role}>
                <div className="aspect-square rounded-md ring-1 ring-black/10" style={{ background: c.hex }} />
                <p className="mt-2 font-mono text-xs text-neutral-900">{c.hex.toUpperCase()}</p>
                <p className="text-xs font-medium text-neutral-700">{c.role}</p>
                <p className="mt-0.5 text-xs leading-snug text-neutral-500">{c.note}</p>
              </li>
            ))}
          </ul>
        </Section>
        <Section n="02" title="Type">
          <ul className="divide-y divide-neutral-100">
            {s.type.map((t) => (
              <li key={t.family + t.role} className="grid gap-1 py-3 first:pt-0 sm:grid-cols-[180px_1fr]">
                <p>
                  <span className="font-medium">{t.family}</span>{" "}
                  <span className="font-mono text-xs text-neutral-500">{t.role}</span>
                </p>
                <p className="text-sm leading-relaxed text-neutral-600">{t.note}</p>
              </li>
            ))}
          </ul>
        </Section>
        <Section n="03" title="Layout">
          <List items={s.layout} />
        </Section>
        <Section n="04" title="Motion">
          <List items={s.motion} />
        </Section>
        <Section n="05" title="Interactions">
          <List items={s.interactions} />
        </Section>
        <Section n="06" title="Take">
          <List items={s.steal} />
        </Section>
        <Section n="07" title="Leave">
          <List items={s.leave} />
        </Section>
      </div>

      <nav className="mt-10 grid grid-cols-2 gap-6 border-t border-neutral-200 pt-8 text-sm">
        <Link href={`/research/${prev.slug}`} className="group rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900">
          <span className="font-mono text-xs uppercase tracking-[0.16em] text-neutral-500">← Previous</span>
          <span className="mt-1 block text-lg font-medium group-hover:underline">{prev.name}</span>
        </Link>
        <Link href={`/research/${next.slug}`} className="group rounded-sm text-right focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900">
          <span className="font-mono text-xs uppercase tracking-[0.16em] text-neutral-500">Next →</span>
          <span className="mt-1 block text-lg font-medium group-hover:underline">{next.name}</span>
        </Link>
      </nav>
    </main>
  );
}
