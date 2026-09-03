import { register, sessionCookie } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const result = register(body.email ?? "", body.password ?? "");
    return Response.json(result, {
      headers: { "Set-Cookie": sessionCookie(result.token) },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Register failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
