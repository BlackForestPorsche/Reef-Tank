import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import type { Alert, TankStatus } from "@/server/types";

const DATA_DIR = join(process.cwd(), "data");
const STORE = join(DATA_DIR, "online.json");

export type OnlineState = "off" | "waiting" | "connected" | "error";

export type OnlineNotice = {
  id: string;
  alertId: string;
  level: Alert["level"];
  title: string;
  detail: string;
  createdAt: number;
  delivered: boolean;
  lastAttemptAt: number | null;
  error: string | null;
};

type Store = {
  enabled: boolean;
  relayUrl: string;
  deviceId: string;
  deviceToken: string;
  lastHeartbeatAt: number | null;
  lastError: string | null;
  notices: OnlineNotice[];
};

export type PublicOnline = {
  enabled: boolean;
  state: OnlineState;
  relaySet: boolean;
  deviceId: string;
  lastHeartbeatAt: number | null;
  lastError: string | null;
  queued: number;
  delivered: number;
  notices: Omit<OnlineNotice, "error">[];
  included: true;
  subscription: false;
};

let cache: Store | null = null;
let loopStarted = false;
let flushing = false;

function emptyStore(): Store {
  return {
    enabled: true,
    relayUrl: (process.env.HELM_RELAY_URL ?? "").replace(/\/$/, ""),
    deviceId: `HELM-${randomBytes(2).toString("hex").toUpperCase()}`,
    deviceToken: randomBytes(24).toString("hex"),
    lastHeartbeatAt: null,
    lastError: null,
    notices: [],
  };
}

function load(): Store {
  if (cache) return cache;
  mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(STORE)) {
    cache = emptyStore();
    persist();
    return cache;
  }
  try {
    const parsed = JSON.parse(readFileSync(STORE, "utf8")) as Partial<Store>;
    cache = { ...emptyStore(), ...parsed, notices: parsed.notices ?? [] };
  } catch {
    cache = emptyStore();
  }
  if (process.env.HELM_RELAY_URL && !cache.relayUrl) {
    cache.relayUrl = process.env.HELM_RELAY_URL.replace(/\/$/, "");
  }
  return cache;
}

function persist() {
  if (!cache) return;
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(STORE, JSON.stringify(cache, null, 2));
}

function stateOf(store: Store): OnlineState {
  if (!store.enabled) return "off";
  if (!store.relayUrl) return "waiting";
  if (store.lastError) return "error";
  if (store.lastHeartbeatAt) return "connected";
  return "waiting";
}

export function publicOnline(): PublicOnline {
  const store = load();
  const notices = store.notices.slice(-8).reverse().map(({ error: _e, ...n }) => n);
  return {
    enabled: store.enabled,
    state: stateOf(store),
    relaySet: store.relayUrl.length > 0,
    deviceId: store.deviceId,
    lastHeartbeatAt: store.lastHeartbeatAt,
    lastError: store.lastError,
    queued: store.notices.filter((n) => !n.delivered).length,
    delivered: store.notices.filter((n) => n.delivered).length,
    notices,
    included: true,
    subscription: false,
  };
}

export function updateOnline(patch: { enabled?: boolean; relayUrl?: string }) {
  const store = load();
  if (patch.enabled !== undefined) store.enabled = patch.enabled;
  if (patch.relayUrl !== undefined) {
    const raw = patch.relayUrl.trim().replace(/\/$/, "");
    if (raw && !/^https?:\/\//i.test(raw)) {
      throw new Error("Relay URL must start with https:// (http:// only for a local soak).");
    }
    store.relayUrl = raw;
    store.lastError = null;
    store.lastHeartbeatAt = null;
  }
  persist();
  void flushNotices();
  return publicOnline();
}

export function queueNotice(alert: Pick<Alert, "id" | "level" | "title" | "detail">) {
  const store = load();
  const open = store.notices.find((n) => n.alertId === alert.id && !n.delivered);
  if (open) return;
  store.notices.push({
    id: randomBytes(6).toString("hex"),
    alertId: alert.id,
    level: alert.level,
    title: alert.title,
    detail: alert.detail,
    createdAt: Date.now(),
    delivered: false,
    lastAttemptAt: null,
    error: null,
  });
  if (store.notices.length > 80) store.notices = store.notices.slice(-80);
  persist();
}

export function ingestStatus(status: TankStatus) {
  ensureOnlineLoop();
  if (!load().enabled) return;
  for (const alert of status.alerts) {
    if (alert.level === "warn" || alert.level === "alarm") {
      queueNotice(alert);
    }
  }
  if (status.stale || !status.connected) {
    queueNotice({
      id: "apex-stale",
      level: "alarm",
      title: "Apex unreachable",
      detail: status.alerts.find((a) => a.id === "apex-down")?.detail ?? "Glance is stale. Apex is not answering.",
    });
  }
}

export function queueTestNotice() {
  queueNotice({
    id: `test-${Date.now()}`,
    level: "info",
    title: "Helm online test",
    detail: "This would reach your phone once a relay is connected. Queued on this Helm.",
  });
  void flushNotices();
  return publicOnline();
}

export async function flushNotices() {
  if (flushing) return publicOnline();
  const store = load();
  if (!store.enabled) return publicOnline();
  const pending = store.notices.filter((n) => !n.delivered);
  if (!store.relayUrl) {
    store.lastError = null;
    persist();
    return publicOnline();
  }
  flushing = true;
  try {
    const res = await fetch(`${store.relayUrl}/v1/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${store.deviceToken}`,
      },
      body: JSON.stringify({
        deviceId: store.deviceId,
        version: "0.1.1-alpha",
        at: Date.now(),
        notices: pending,
      }),
      signal: AbortSignal.timeout(8000),
    });
    const body = (await res.json().catch(() => ({}))) as {
      accepted?: string[];
      error?: string;
    };
    const now = Date.now();
    if (!res.ok) {
      store.lastError = body.error ?? `Relay HTTP ${res.status}`;
      for (const n of pending) {
        n.lastAttemptAt = now;
        n.error = store.lastError;
      }
    } else {
      const accepted = new Set(body.accepted ?? pending.map((n) => n.id));
      for (const n of store.notices) {
        if (accepted.has(n.id)) {
          n.delivered = true;
          n.lastAttemptAt = now;
          n.error = null;
        }
      }
      store.lastHeartbeatAt = now;
      store.lastError = null;
    }
    persist();
  } catch (err) {
    store.lastError = err instanceof Error ? err.message : "Relay unreachable";
    persist();
  } finally {
    flushing = false;
  }
  return publicOnline();
}

export function ensureOnlineLoop() {
  if (loopStarted) return;
  loopStarted = true;
  const id = setInterval(() => {
    void flushNotices();
  }, 20_000);
  if (typeof id === "object" && "unref" in id) id.unref();
}

export function onlineHubSlice() {
  const pub = publicOnline();
  return {
    enabled: pub.enabled,
    state: pub.state,
    queued: pub.queued,
  };
}
