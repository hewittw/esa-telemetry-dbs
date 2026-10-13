import type { Metadata } from "next";
import Link from "next/link";
import { getLog, type Inline, type Block } from "@/lib/log";

export const metadata: Metadata = { title: "Design & Decisions" };

const ring = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900";

function Text({ v }: { v: Inline }) {
  return (
    <>
      {v.map((s, i) =>
        s.t === "b" ? (
          <strong key={i} className="font-medium text-neutral-900">{s.v}</strong>
        ) : s.t === "code" ? (
          <code key={i} className="rounded-[3px] bg-neutral-100 px-1 py-0.5 font-mono text-[0.85em] text-neutral-800">{s.v}</code>
        ) : s.t === "em" ? (
          <em key={i}>{s.v}</em>
        ) : (
          <span key={i}>{s.v}</span>
        ),
      )}
    </>
  );
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-4 text-[15px] leading-relaxed text-neutral-700">
      {blocks.map((b, i) =>
        b.kind === "p" ? (
          <p key={i}><Text v={b.inline} /></p>
        ) : b.kind === "ul" ? (
          <ul key={i} className="space-y-2.5">
            {b.items.map((it, j) => (
              <li key={j} className="flex gap-3">
                <span aria-hidden className="mt-[0.7em] h-px w-3 shrink-0 bg-neutral-400" />
                <div>
                  <Text v={it.inline} />
                  {it.sub.length > 0 && (
                    <ul className="mt-1.5 space-y-1.5 text-neutral-600">
                      {it.sub.map((s, k) => (
                        <li key={k} className="flex gap-2.5">
                          <span aria-hidden className="mt-[0.7em] h-px w-2 shrink-0 bg-neutral-300" />
                          <span><Text v={s} /></span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div key={i} className="overflow-x-auto rounded-md border border-neutral-200" tabIndex={0} role="region" aria-label="Table">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-[0.08em] text-neutral-500">
                <tr>{b.head.map((h, j) => <th key={j} className="px-4 py-2.5 font-medium"><Text v={h} /></th>)}</tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {b.rows.map((r, j) => (
                  <tr key={j}>{r.map((c, k) => <td key={k} className="px-4 py-2.5 align-top"><Text v={c} /></td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        ),
      )}
    </div>
  );
}

export default function Decisions() {
  const log = getLog();
  return (
    <main className="mx-auto w-full max-w-[1100px] px-6 pb-32 pt-10 md:px-10">
      <nav className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.16em] text-neutral-500">
        <Link href="/" className={`rounded-sm hover:text-neutral-900 ${ring}`}>← Hub</Link>
        <span>Design &amp; Decisions</span>
      </nav>

      <section aria-label="A note from the designer" className="mt-12 max-w-3xl border-l-2 border-neutral-900 pl-6">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-neutral-500">A note from the designer</p>
        <div className="mt-4 space-y-4 text-xl leading-relaxed text-neutral-800 md:text-[22px]">
          <p>
            Going in, I expected to want the most creative, edge-pushing science site I could make. The final site
            took a different form: a minimalist, architectural style. I&apos;ve come to think it&apos;s the least
            distracting way to present complex information well.
          </p>
          <p>
            I like the contrast between a quiet style and the intense concepts and findings it carries, and I find
            that restraint pairs well with the theory behind space. Crazy that it all started with the colors on{" "}
            <Link
              href="/mood-boards/refined-paper"
              className={`underline decoration-neutral-400 underline-offset-4 hover:decoration-neutral-900 ${ring}`}
            >
              my water bottle
            </Link>
            .
          </p>
        </div>
        <p className="mt-4 text-sm text-neutral-500">Hewitt Watkins</p>
      </section>

      <header className="mt-16 max-w-3xl">
        <h1 className="text-5xl font-semibold leading-[0.95] tracking-[-0.035em] md:text-6xl">
          Every choice, and why.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-neutral-600">
          The running design log for this project, in order: what we chose, what we rejected, where Hewitt pushed
          back on the agent, and the bugs the browser checks caught. Rendered directly from{" "}
          <code className="font-mono text-[0.9em]">DESIGN_LOG.md</code> in the repository.
        </p>
        <p className="mt-4 font-mono text-xs uppercase tracking-[0.16em] text-neutral-500">
          {log.length} entries · Designed &amp; built by Hewitt Watkins
        </p>
      </header>

      <ol className="mt-16 border-t border-neutral-200">
        {log.map((e, i) => (
          <li key={i} id={`d${i + 1}`} className="grid gap-4 border-b border-neutral-200 py-10 md:grid-cols-12">
            <div className="md:col-span-3">
              <p className="font-mono text-xs text-neutral-400">{String(i + 1).padStart(2, "0")}</p>
              <p className="mt-1 font-mono text-xs uppercase tracking-[0.12em] text-neutral-500">{e.date}</p>
            </div>
            <div className="md:col-span-9">
              <h2 className="text-xl font-medium tracking-tight">{e.title}</h2>
              <div className="mt-4"><Blocks blocks={e.blocks} /></div>
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
