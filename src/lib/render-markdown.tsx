import type { ReactNode } from "react";

function inline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re =
    /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(text))) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      parts.push(
        <code key={key++} className="rounded bg-white/8 px-1 text-[13px] text-teal-100">
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        const href = link[2];
        const internal = href.startsWith("/") || href.endsWith(".md");
        const resolved =
          href === "kits.md"
            ? "/kits"
            : href.startsWith("../")
              ? `https://github.com/BlackForestPorsche/Reef-Tank/blob/main/${href.replace(/^\.\.\//, "")}`
              : href;
        parts.push(
          <a
            key={key++}
            href={resolved}
            className="text-teal-200 underline-offset-2 hover:underline"
            target={internal ? undefined : "_blank"}
            rel={internal ? undefined : "noreferrer"}
          >
            {link[1]}
          </a>,
        );
      }
    }
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function MarkdownDoc({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "---") {
      out.push(<hr key={key++} className="my-6 border-white/10" />);
      i += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const buf: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith("```")) {
        buf.push(lines[i]);
        i += 1;
      }
      i += 1;
      out.push(
        <pre
          key={key++}
          className="my-3 overflow-x-auto rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-[13px] leading-relaxed text-teal-50"
        >
          <code>{buf.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    if (line.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        const cells = lines[i]
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim());
        if (!cells.every((c) => /^:?-+:?$/.test(c))) rows.push(cells);
        i += 1;
      }
      const [head, ...body] = rows;
      out.push(
        <div key={key++} className="my-3 overflow-x-auto">
          <table className="w-full min-w-[20rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/15 text-white/50">
                {head?.map((c) => (
                  <th key={c} className="py-2 pr-3 font-medium">
                    {inline(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, ri) => (
                <tr key={ri} className="border-b border-white/8 align-top">
                  {row.map((c, ci) => (
                    <td key={ci} className="py-2 pr-3 text-white/70">
                      {inline(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (line.startsWith("# ")) {
      out.push(
        <h1 key={key++} className="mt-1 text-2xl font-semibold">
          {inline(line.slice(2))}
        </h1>,
      );
      i += 1;
      continue;
    }
    if (line.startsWith("## ")) {
      out.push(
        <h2 key={key++} className="mt-8 text-lg font-medium text-teal-100">
          {inline(line.slice(3))}
        </h2>,
      );
      i += 1;
      continue;
    }
    if (line.startsWith("### ")) {
      out.push(
        <h3 key={key++} className="mt-4 text-sm font-medium text-white/80">
          {inline(line.slice(4))}
        </h3>,
      );
      i += 1;
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i += 1;
        while (i < lines.length && (lines[i].startsWith("   ") || lines[i].startsWith("\t"))) {
          items[items.length - 1] += "\n" + lines[i].trim();
          i += 1;
        }
      }
      out.push(
        <ol key={key++} className="my-3 list-decimal space-y-1 pl-5 text-sm text-white/70">
          {items.map((item, idx) => (
            <li key={idx} className="whitespace-pre-wrap">
              {inline(item)}
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2));
        i += 1;
      }
      out.push(
        <ul key={key++} className="my-3 list-disc space-y-1 pl-5 text-sm text-white/70">
          {items.map((item, idx) => (
            <li key={idx}>{inline(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    if (line.trim() === "") {
      i += 1;
      continue;
    }

    out.push(
      <p key={key++} className="mt-2 text-sm leading-relaxed text-white/65">
        {inline(line)}
      </p>,
    );
    i += 1;
  }

  return <article className="pb-10">{out}</article>;
}
