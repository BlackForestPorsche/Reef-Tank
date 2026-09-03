import { requireUser } from "@/server/auth";
import { setOutlet } from "@/server/hub";
import type { OutletMode } from "@/server/types";

export const dynamic = "force-dynamic";

const MODES: OutletMode[] = ["off", "auto", "on"];

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  try {
    requireUser(request);
    const body = (await request.json()) as { mode?: OutletMode };
    if (!body.mode || !MODES.includes(body.mode)) {
      return Response.json({ error: "mode must be off, auto, or on" }, { status: 400 });
    }
    const status = await setOutlet(id, body.mode);
    return Response.json(status);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Outlet failed";
    const code = (err as Error & { status?: number }).status === 401 ? 401 : 400;
    return Response.json({ error: message }, { status: code });
  }
}
