import { readFileSync } from "node:fs";
import { panelBinaryPath } from "@/server/ota";

export const dynamic = "force-dynamic";

export async function GET() {
  const path = panelBinaryPath();
  if (!path) {
    return Response.json(
      { error: "No panel.bin staged. Factory: copy the PlatformIO .bin to data/firmware/panel.bin" },
      { status: 404 },
    );
  }
  const buf = readFileSync(path);
  return new Response(buf, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(buf.length),
      "Content-Disposition": "attachment; filename=sightglass.bin",
      "Cache-Control": "no-store",
    },
  });
}
