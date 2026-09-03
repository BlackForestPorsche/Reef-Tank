import { getProvision, setPanelPairing, touchPanel } from "@/server/dummy-hub";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const slot = new URL(request.url).searchParams.get("slot") ?? "1";
  const panel = touchPanel(slot);
  return Response.json({
    panel,
    hub: getProvision(),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { slot?: string; pairing?: boolean };
  const slot = body.slot ?? "1";
  const panel = touchPanel(slot);
  try {
    const next = setPanelPairing(panel.id, body.pairing ?? true);
    return Response.json({ panel: next, hub: getProvision() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Panel failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
