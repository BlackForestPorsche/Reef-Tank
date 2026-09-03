import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { APP_VERSION } from "@/lib/version";
import { MarkdownDoc } from "@/lib/render-markdown";

export default async function HardwarePage() {
  const source = await readFile(
    path.join(process.cwd(), "docs/hardware.md"),
    "utf8",
  );

  return (
    <div>
      <p className="text-[11px] font-medium tracking-[0.18em] text-teal-300/80 uppercase">
        Alpha {APP_VERSION}
      </p>
      <MarkdownDoc source={source} />
      <p className="mt-8 text-xs text-white/40">
        Same text lives in{" "}
        <code className="text-white/60">docs/hardware.md</code>. Buy lists stay on{" "}
        <Link href="/kits" className="text-teal-200">
          Demo kits
        </Link>
        .
      </p>
      <Link href="/settings" className="mt-4 inline-block text-sm text-teal-200">
        Back to Setup
      </Link>
    </div>
  );
}
