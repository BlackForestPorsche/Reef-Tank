import { hello, getOta, requestUpdate } from "@/server/ota";
import { requireUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(getOta());
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      target?: "hub" | "panel" | "all";
      kind?: "panel" | "hub";
      id?: string;
      version?: string;
      action?: string;
    };
    if (body.action === "hello" && body.kind && body.id && body.version) {
      return Response.json(hello(body.kind, body.id, body.version));
    }
    const user = requireUser(request);
    const target = body.target;
    if (target !== "hub" && target !== "panel" && target !== "all") {
      return Response.json({ error: "target must be hub, panel, or all" }, { status: 400 });
    }
    return Response.json(requestUpdate(target, user.email));
  } catch (err) {
    const message = err instanceof Error ? err.message : "OTA failed";
    const code = (err as Error & { status?: number }).status === 401 ? 401 : 400;
    return Response.json({ error: message }, { status: code });
  }
}
