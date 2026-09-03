import { requireUser } from "@/server/auth";
import {
  flushNotices,
  publicOnline,
  queueTestNotice,
  updateOnline,
} from "@/server/online";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(publicOnline());
}

export async function PUT(request: Request) {
  try {
    requireUser(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign in required.";
    return Response.json({ error: message }, { status: 401 });
  }
  const body = (await request.json()) as { enabled?: boolean; relayUrl?: string };
  try {
    return Response.json(updateOnline(body));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Save failed";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    requireUser(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign in required.";
    return Response.json({ error: message }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as { action?: string };
  if (body.action === "flush") {
    return Response.json(await flushNotices());
  }
  return Response.json(queueTestNotice());
}
