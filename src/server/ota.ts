import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { APP_VERSION } from "@/lib/version";

const DATA = join(process.cwd(), "data");
const STATE = join(DATA, "ota.json");
const REQUEST = join(DATA, "update-request");
const RESULT = join(DATA, "update-result.json");
const PANEL_BIN = join(DATA, "firmware", "panel.bin");

export type OtaStatus = "idle" | "pending" | "updating" | "applied" | "failed";

export type DeviceHello = {
  id: string;
  kind: "panel" | "hub";
  version: string;
  seenAt: number;
};

export type OtaState = {
  hub: {
    target: string;
    status: OtaStatus;
    lastError: string | null;
    requestedAt: number | null;
    appliedAt: number | null;
  };
  panel: {
    target: string;
    status: OtaStatus;
    lastError: string | null;
    requestedAt: number | null;
    appliedAt: number | null;
    binaryPresent: boolean;
  };
  devices: DeviceHello[];
};

function empty(): OtaState {
  return {
    hub: {
      target: APP_VERSION,
      status: "idle",
      lastError: null,
      requestedAt: null,
      appliedAt: null,
    },
    panel: {
      target: APP_VERSION,
      status: "idle",
      lastError: null,
      requestedAt: null,
      appliedAt: null,
      binaryPresent: existsSync(PANEL_BIN),
    },
    devices: [],
  };
}

function load(): OtaState {
  mkdirSync(DATA, { recursive: true });
  if (!existsSync(STATE)) return empty();
  try {
    const parsed = JSON.parse(readFileSync(STATE, "utf8")) as OtaState;
    parsed.panel.binaryPresent = existsSync(PANEL_BIN);
    return parsed;
  } catch {
    return empty();
  }
}

function save(state: OtaState) {
  mkdirSync(DATA, { recursive: true });
  state.panel.binaryPresent = existsSync(PANEL_BIN);
  writeFileSync(STATE, JSON.stringify(state, null, 2));
}

function ingestHostResult(state: OtaState) {
  if (!existsSync(RESULT)) return;
  try {
    const result = JSON.parse(readFileSync(RESULT, "utf8")) as {
      ok?: boolean;
      error?: string;
      version?: string;
      at?: number;
    };
    if (result.ok) {
      state.hub.status = "applied";
      state.hub.lastError = null;
      state.hub.appliedAt = result.at ?? Date.now();
    } else {
      state.hub.status = "failed";
      state.hub.lastError = result.error ?? "Host updater failed";
    }
    unlinkSync(RESULT);
    save(state);
  } catch {
    /* leave pending */
  }
}

export function getOta() {
  const state = load();
  ingestHostResult(state);
  if (existsSync(REQUEST) && state.hub.status === "pending") {
    state.hub.status = "updating";
  }
  return {
    version: APP_VERSION,
    hub: {
      current: APP_VERSION,
      ...state.hub,
      hostUpdater:
        existsSync("/usr/local/lib/helm/update.sh") ||
        existsSync("/usr/local/lib/reefdeck/update.sh") ||
        existsSync(join(process.cwd(), "hub-image", "update.sh")),
    },
    panel: {
      current: APP_VERSION,
      ...state.panel,
      url: "/api/ota/panel.bin",
    },
    devices: state.devices,
  };
}

export function panelManifest(requestUrl: string) {
  const state = load();
  const origin = new URL(requestUrl).origin;
  return {
    kind: "panel" as const,
    version: state.panel.target || APP_VERSION,
    pending: state.panel.status === "pending" || state.panel.status === "updating",
    url: `${origin}/api/ota/panel.bin`,
    binaryPresent: existsSync(PANEL_BIN),
  };
}

export function panelBinaryPath() {
  return existsSync(PANEL_BIN) ? PANEL_BIN : null;
}

export function requestUpdate(target: "hub" | "panel" | "all", by: string) {
  const state = load();
  const now = Date.now();
  if (target === "hub" || target === "all") {
    state.hub.target = APP_VERSION;
    state.hub.status = "pending";
    state.hub.lastError = null;
    state.hub.requestedAt = now;
    mkdirSync(DATA, { recursive: true });
    writeFileSync(
      REQUEST,
      JSON.stringify({ version: APP_VERSION, at: now, by, target: "hub" }),
    );
  }
  if (target === "panel" || target === "all") {
    state.panel.target = APP_VERSION;
    state.panel.status = existsSync(PANEL_BIN) ? "pending" : "failed";
    state.panel.lastError = existsSync(PANEL_BIN)
      ? null
      : "No panel.bin staged. Drop a factory .bin at data/firmware/panel.bin, then push again.";
    state.panel.requestedAt = now;
  }
  save(state);
  return getOta();
}

export function hello(kind: "panel" | "hub", id: string, version: string) {
  const state = load();
  const next: DeviceHello = { id, kind, version, seenAt: Date.now() };
  state.devices = [
    next,
    ...state.devices.filter((d) => !(d.id === id && d.kind === kind)),
  ].slice(0, 24);
  if (kind === "panel" && version === state.panel.target && state.panel.status !== "idle") {
    state.panel.status = "applied";
    state.panel.appliedAt = Date.now();
    state.panel.lastError = null;
  }
  if (kind === "hub" && version === state.hub.target) {
    state.hub.status = "applied";
    state.hub.appliedAt = Date.now();
  }
  save(state);
  return getOta();
}
