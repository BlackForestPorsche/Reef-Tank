import type { ApexStatus } from "@/server/apex/types";

function basicAuth(user: string, password: string) {
  return `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;
}

async function apexFetch(
  host: string,
  user: string,
  password: string,
  path: string,
  init?: RequestInit,
) {
  const base = host.replace(/\/$/, "");
  const url = `${base.startsWith("http") ? base : `http://${base}`}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: basicAuth(user, password),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Apex ${res.status} ${path}${text ? `: ${text.slice(0, 180)}` : ""}`);
  }
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("json")) return res.json();
  return null;
}

export async function fetchApexStatus(
  host: string,
  user: string,
  password: string,
): Promise<ApexStatus> {
  return apexFetch(host, user, password, "/rest/status") as Promise<ApexStatus>;
}

export async function setApexOutlet(
  host: string,
  user: string,
  password: string,
  did: string,
  status: [string, string, string, string],
) {
  await apexFetch(host, user, password, `/rest/status/outputs/${encodeURIComponent(did)}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export async function triggerApexFeed(
  host: string,
  user: string,
  password: string,
  index: number,
) {
  await apexFetch(host, user, password, `/rest/status/feed/${index}`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}
