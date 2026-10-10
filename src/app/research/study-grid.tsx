"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CATEGORIES, type Study } from "@/lib/research-types";

const FILTERS = ["All", ...CATEGORIES] as const;

export function StudyGrid({ studies }: { studies: Study[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const shown = filter === "All" ? studies : studies.filter((s) => s.category === filter);

  return (
    <section className="mt-20">
      <div role="toolbar" aria-label="Filter studies" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = f === "All" ? studies.length : studies.filter((s) => s.category === f).length;
          const on = f === filter;
          return (
            <button
              key={f}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(f)}
              className="rounded-full border border-neutral-300 px-4 py-2 text-sm text-neutral-700 transition-colors duration-150 hover:border-neutral-900 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 active:scale-[0.97] aria-pressed:border-neutral-900 aria-pressed:bg-neutral-900 aria-pressed:text-white"
            >
              {f} <span className="ml-1 font-mono text-xs opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <p className="mt-16 text-neutral-500">No studies in this category yet.</p>
      ) : (
        <ol className="mt-10 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/research/${s.slug}`}
                className="group block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-neutral-100 ring-1 ring-neutral-200">
                  <Image
                    src={s.screenshots[0]?.src ?? ""}
                    alt={`${s.name} homepage, desktop`}
                    fill
                    sizes="(min-width: 1024px) 420px, (min-width: 640px) 50vw, 100vw"
                    className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                </div>
                <div className="mt-4 flex items-baseline justify-between gap-4">
                  <h2 className="text-lg font-medium tracking-tight">
                    <span className="mr-2 font-mono text-xs text-neutral-400">
                      {String(studies.indexOf(s) + 1).padStart(2, "0")}
                    </span>
                    {s.name}
                  </h2>
                  <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.12em] text-neutral-500">
                    {s.category}
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{s.oneLine}</p>
                <div className="mt-3 flex gap-1" aria-hidden>
                  {s.palette.slice(0, 6).map((c) => (
                    <span
                      key={c.hex + c.role}
                      className="h-3 w-6 rounded-[2px] ring-1 ring-black/10"
                      style={{ background: c.hex }}
                    />
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
