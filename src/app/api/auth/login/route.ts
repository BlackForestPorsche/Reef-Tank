import { login, sessionCookie } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const result = login(body.email ?? "", body.password ?? "");
    return Response.json(result, {
      headers: { "Set-Cookie": sessionCookie(result.token) },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed";
    return Response.json({ error: message }, { status: 401 });
  }
}
