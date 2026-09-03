import { getTankStatus } from "@/server/hub";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getTankStatus();
  return Response.json(status);
}
