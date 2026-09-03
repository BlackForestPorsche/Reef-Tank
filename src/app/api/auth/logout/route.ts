import { clearSessionCookie, logout, tokenFromRequest } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  logout(tokenFromRequest(request));
  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": clearSessionCookie() } },
  );
}
