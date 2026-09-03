import { getVersionInfo } from "@/lib/version";
import { RELEASE_NOTES } from "@/lib/release-notes";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ ...getVersionInfo(), notes: RELEASE_NOTES });
}
