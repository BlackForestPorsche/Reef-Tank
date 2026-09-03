import { tokenFromRequest, userFromToken } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = userFromToken(tokenFromRequest(request));
  if (!user) return Response.json({ user: null }, { status: 401 });
  return Response.json({ user });
}
