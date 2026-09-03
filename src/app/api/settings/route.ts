import { publicSettings, updateSettings } from "@/server/hub";
import { requireUser } from "@/server/auth";
import type { HubSettings } from "@/server/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(publicSettings());
}

export async function PUT(request: Request) {
  try {
    requireUser(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign in required.";
    return Response.json({ error: message }, { status: 401 });
  }
  const body = (await request.json()) as Partial<HubSettings>;
  const next = updateSettings({
    tankName: body.tankName,
    source: body.source,
    apexHost: body.apexHost,
    apexUser: body.apexUser,
    apexPassword:
      body.apexPassword && body.apexPassword.length > 0
        ? body.apexPassword
        : undefined,
    controlsEnabled: body.controlsEnabled,
    tempUnit: body.tempUnit,
  });
  return Response.json(next);
}
