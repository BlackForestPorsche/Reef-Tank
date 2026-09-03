import { hello, panelManifest } from "@/server/ota";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  const id = url.searchParams.get("id");
  const version = url.searchParams.get("version");
  if (kind === "panel" && id && version) {
    hello("panel", id, version);
  }
  return Response.json(panelManifest(request.url));
}
