import { requireUser } from "@/server/auth";
import { cancelFeed, startFeed } from "@/server/hub";
import type { FeedChannel } from "@/server/types";

export const dynamic = "force-dynamic";

const CHANNELS: FeedChannel[] = ["A", "B", "C", "D"];

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  try {
    requireUser(request);
    if (id === "cancel") {
      const status = await cancelFeed();
      return Response.json(status);
    }
    const channel = id.toUpperCase() as FeedChannel;
    if (!CHANNELS.includes(channel)) {
      return Response.json({ error: "Unknown feed channel" }, { status: 400 });
    }
    const status = await startFeed(channel);
    return Response.json(status);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Feed failed";
    const code = (err as Error & { status?: number }).status === 401 ? 401 : 400;
    return Response.json({ error: message }, { status: code });
  }
}
