// The hub: the submitted URL. Placeholder structure until a style is picked.
const sections = [
  {
    n: 1,
    title: "Mood Boards",
    note: "Three directions, 25–30 artifacts each.",
    links: [] as { label: string; href: string }[],
  },
  {
    n: 2,
    title: "Design Systems",
    note: "Each one built from its mood board.",
    links: [] as { label: string; href: string }[],
  },
  {
    n: 3,
    title: "The Site",
    note: "Uncovering latent structure in ESA satellite telemetry.",
    links: [] as { label: string; href: string }[],
  },
];

export default function Hub() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-24">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
        Design, Build, Ship · Assignment 2
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">ESA Telemetry</h1>

      <ol className="mt-16 divide-y divide-neutral-200 border-y border-neutral-200">
        {sections.map((s) => (
          <li key={s.n} className="flex gap-6 py-8">
            <span className="font-mono text-sm text-neutral-400">0{s.n}</span>
            <div>
              <h2 className="text-lg font-medium">{s.title}</h2>
              <p className="mt-1 text-sm text-neutral-600">{s.note}</p>
              {s.links.length === 0 && (
                <p className="mt-3 text-sm text-neutral-400">In progress</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
