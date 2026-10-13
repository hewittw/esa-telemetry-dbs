import fs from "node:fs";
import path from "node:path";

// DESIGN_LOG.md is the single source of truth for /decisions. It uses a small, known subset of
// Markdown (## entries, bullets with one level of nesting, tables, **bold**, `code`, *em*), so a
// tiny parser beats adding a Markdown dependency.

export type Inline = { t: "text" | "b" | "code" | "em"; v: string }[];
export type Block =
  | { kind: "p"; inline: Inline }
  | { kind: "ul"; items: { inline: Inline; sub: Inline[] }[] }
  | { kind: "table"; head: Inline[]; rows: Inline[][] };
export type Entry = { date: string; title: string; blocks: Block[] };

export function inline(src: string): Inline {
  const out: Inline = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g;
  let last = 0;
  for (const m of src.matchAll(re)) {
    if (m.index! > last) out.push({ t: "text", v: src.slice(last, m.index) });
    const tok = m[0];
    if (tok.startsWith("**")) out.push({ t: "b", v: tok.slice(2, -2) });
    else if (tok.startsWith("`")) out.push({ t: "code", v: tok.slice(1, -1) });
    else out.push({ t: "em", v: tok.slice(1, -1) });
    last = m.index! + tok.length;
  }
  if (last < src.length) out.push({ t: "text", v: src.slice(last) });
  return out;
}

function parseBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (line.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        const cells = lines[i].split("|").slice(1, -1).map((c) => c.trim());
        if (!cells.every((c) => /^-+$/.test(c))) rows.push(cells);
        i++;
      }
      const [head, ...body] = rows;
      blocks.push({ kind: "table", head: head.map(inline), rows: body.map((r) => r.map(inline)) });
      continue;
    }
    if (line.startsWith("- ")) {
      // collect raw text first so **bold** spanning wrapped lines parses correctly
      const raw: { text: string; sub: string[] }[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("  "))) {
        const l = lines[i];
        if (l.startsWith("- ")) raw.push({ text: l.slice(2), sub: [] });
        else if (l.trim().startsWith("- ")) raw.at(-1)?.sub.push(l.trim().slice(2));
        else if (raw.length) {
          const it = raw.at(-1)!;
          if (it.sub.length) it.sub[it.sub.length - 1] += " " + l.trim();
          else it.text += " " + l.trim();
        }
        i++;
      }
      const items = raw.map((r) => ({ inline: inline(r.text), sub: r.sub.map(inline) }));
      blocks.push({ kind: "ul", items });
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !lines[i].startsWith("- ") && !lines[i].startsWith("|")) {
      para.push(lines[i].trim());
      i++;
    }
    blocks.push({ kind: "p", inline: inline(para.join(" ")) });
  }
  return blocks;
}

export function getLog(): Entry[] {
  const src = fs.readFileSync(path.join(process.cwd(), "DESIGN_LOG.md"), "utf8");
  const parts = src.split(/^## /m).slice(1);
  return parts.map((part) => {
    const [heading, ...rest] = part.split("\n");
    const [date, ...title] = heading.split(" · ");
    return { date: date.trim(), title: title.join(" · ").trim(), blocks: parseBlocks(rest) };
  });
}
