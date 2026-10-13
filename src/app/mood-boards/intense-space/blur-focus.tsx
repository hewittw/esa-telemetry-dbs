// Planet's blur-to-focus reveal, per letter, on a loop (pure CSS, so it ships as static HTML).
export function BlurFocus({ word }: { word: string }) {
  return (
    <span className="is-blurword inline-flex" aria-label={word}>
      {word.split("").map((ch, i) => (
        <span key={i} aria-hidden style={{ animationDelay: `${i * 140}ms` }}>
          {ch}
        </span>
      ))}
    </span>
  );
}
