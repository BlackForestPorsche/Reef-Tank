import type {
  Alert,
  FeedChannel,
  FeedStatus,
  LightChannel,
  Outlet,
  OutletMode,
  Probe,
  ProbeBand,
  ProbeKind,
  TankStatus,
} from "@/server/types";
import type { ApexInput, ApexOutput, ApexStatus } from "@/server/apex/types";

const FEED_CHANNELS: FeedChannel[] = ["A", "B", "C", "D"];

function parseNumber(value: string | undefined): number | null {
  if (value == null || value === "" || value === "NA") return null;
  const n = Number.parseFloat(value.replace(/[^\d.+-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function classifyKind(name: string, type: string): ProbeKind {
  const hay = `${name} ${type}`.toLowerCase();
  if (hay.includes("temp") || hay.includes("tmp")) return "temp";
  if (hay.includes("ph") || hay.includes("pH".toLowerCase())) return "ph";
  if (hay.includes("cond") || hay.includes("sal") || hay.includes("ppt"))
    return "salinity";
  if (hay.includes("alk") || hay.includes("kh")) return "alk";
  if (/\bca\b/.test(hay) || hay.includes("calcium")) return "ca";
  if (/\bmg\b/.test(hay) || hay.includes("magnesium")) return "mg";
  if (hay.includes("orp") || hay.includes("redox")) return "orp";
  return "other";
}

function unitFor(kind: ProbeKind, tempUnit: "F" | "C"): string {
  switch (kind) {
    case "temp":
      return `°${tempUnit}`;
    case "ph":
      return "";
    case "salinity":
      return "ppt";
    case "alk":
      return "dKH";
    case "ca":
    case "mg":
      return "ppm";
    case "orp":
      return "mV";
    default:
      return "";
  }
}

function bandFor(kind: ProbeKind, value: number | null): ProbeBand {
  if (value == null) return "stale";
  switch (kind) {
    case "temp":
      if (value < 74 || value > 82) return "alarm";
      if (value < 76 || value > 80) return "warn";
      return "ok";
    case "ph":
      if (value < 7.7 || value > 8.5) return "alarm";
      if (value < 7.9 || value > 8.35) return "warn";
      return "ok";
    case "salinity":
      if (value < 32 || value > 37) return "alarm";
      if (value < 34 || value > 36) return "warn";
      return "ok";
    case "alk":
      if (value < 6.5 || value > 11) return "alarm";
      if (value < 7.5 || value > 9.5) return "warn";
      return "ok";
    default:
      return "ok";
  }
}

function formatProbe(kind: ProbeKind, value: number | null): string {
  if (value == null) return "—";
  switch (kind) {
    case "temp":
      return value.toFixed(1);
    case "ph":
      return value.toFixed(2);
    case "salinity":
      return value.toFixed(1);
    case "alk":
      return value.toFixed(1);
    case "ca":
    case "mg":
    case "orp":
      return Math.round(value).toString();
    default:
      return value.toFixed(1);
  }
}

function outletMode(status0: string): { mode: OutletMode; running: boolean } {
  const s = status0.toUpperCase();
  if (s === "ON" || s === "AON" || s === "AUTO") {
    if (s === "ON") return { mode: "on", running: true };
    if (s === "AON" || s === "AUTO") return { mode: "auto", running: true };
  }
  if (s === "AOF" || s === "AOFF") return { mode: "auto", running: false };
  if (s === "OFF") return { mode: "off", running: false };
  if (s.startsWith("A")) return { mode: "auto", running: s.includes("ON") };
  return { mode: "auto", running: false };
}

function classifyOutlet(
  name: string,
): Outlet["device"] {
  const hay = name.toLowerCase();
  if (hay.includes("return") || hay.includes("vortex") || hay.includes("vectra"))
    return "return";
  if (hay.includes("gyre") || hay.includes("jebao") || hay.includes("wave"))
    return "gyre";
  if (hay.includes("light") || hay.includes("hydra") || hay.includes("ai "))
    return "light";
  if (hay.includes("skim")) return "skimmer";
  if (hay.includes("heat")) return "heater";
  return "other";
}

function mapInput(input: ApexInput, tempUnit: "F" | "C"): Probe {
  const kind = classifyKind(input.name, input.type);
  const value = parseNumber(input.value);
  return {
    id: input.did,
    name: input.name,
    kind,
    value,
    unit: unitFor(kind, tempUnit),
    display: formatProbe(kind, value),
    band: bandFor(kind, value),
  };
}

function mapOutput(output: ApexOutput): Outlet {
  const { mode, running } = outletMode(output.status?.[0] ?? "");
  const device = classifyOutlet(output.name);
  return {
    id: output.did,
    name: output.name,
    mode,
    running,
    device,
    detail: running ? "Running" : mode === "off" ? "Forced off" : "Standby",
  };
}

function mapFeed(raw: ApexStatus["feed"]): FeedStatus {
  const name = String(raw?.name ?? "").toUpperCase();
  const activeIdx = Number(raw?.active ?? 0);
  const time = Number(raw?.time ?? 0);
  let channel: FeedChannel | null = null;
  if (FEED_CHANNELS.includes(name as FeedChannel)) channel = name as FeedChannel;
  else if (activeIdx >= 1 && activeIdx <= 4) channel = FEED_CHANNELS[activeIdx - 1];
  const remaining = Number.isFinite(time) ? Math.max(0, time) : 0;
  const labels: Record<FeedChannel, string> = {
    A: "Feeding",
    B: "Water change",
    C: "Maintenance",
    D: "Custom",
  };
  return {
    active: remaining > 0 ? channel : null,
    remainingSec: remaining,
    totalSec: remaining > 0 ? Math.max(remaining, 60) : 0,
    label: channel ? labels[channel] : "Idle",
  };
}

function mapLights(outlets: Outlet[]): LightChannel[] {
  return outlets
    .filter((o) => o.device === "light")
    .map((o) => ({
      id: o.id,
      name: o.name,
      intensity: o.running ? 70 : 0,
      schedule: o.mode === "auto" ? "Apex schedule" : "Manual",
      on: o.running,
    }));
}

function alertsFrom(probes: Probe[], connected: boolean, stale: boolean): Alert[] {
  const alerts: Alert[] = [];
  if (!connected) {
    alerts.push({
      id: "apex-down",
      level: "alarm",
      title: "Apex unreachable",
      detail: "The panel must not look healthy with old numbers. Check LAN and credentials.",
    });
    return alerts;
  }
  if (stale) {
    alerts.push({
      id: "stale",
      level: "warn",
      title: "Stale readings",
      detail: "Last good poll is older than 15 seconds.",
    });
  }
  for (const probe of probes) {
    if (probe.band === "alarm") {
      alerts.push({
        id: `alarm-${probe.id}`,
        level: "alarm",
        title: `${probe.name} out of range`,
        detail: `${probe.display} ${probe.unit}`.trim(),
      });
    } else if (probe.band === "warn") {
      alerts.push({
        id: `warn-${probe.id}`,
        level: "warn",
        title: `${probe.name} approaching limit`,
        detail: `${probe.display} ${probe.unit}`.trim(),
      });
    }
  }
  return alerts;
}

export function normalizeApexStatus(opts: {
  raw: ApexStatus;
  tankName: string;
  tempUnit: "F" | "C";
  controlsEnabled: boolean;
  fetchedAt: number;
}): TankStatus {
  const probes = (opts.raw.inputs ?? []).map((i) => mapInput(i, opts.tempUnit));
  const outlets = (opts.raw.outputs ?? []).map(mapOutput);
  const feed = mapFeed(opts.raw.feed);
  const connected = true;
  const ageMs = Date.now() - opts.fetchedAt;
  const stale = ageMs > 15_000;
  return {
    tankName: opts.tankName || opts.raw.system?.hostname || "Reef",
    source: "apex",
    connected,
    stale,
    updatedAt: opts.fetchedAt,
    ageMs,
    probes,
    outlets,
    feed,
    lights: mapLights(outlets),
    room: {
      available: false,
      temperatureF: null,
      humidity: null,
      co2: null,
      voc: null,
    },
    alerts: alertsFrom(probes, connected, stale),
    history: [],
    controlsEnabled: opts.controlsEnabled,
    hub: {
      dummy: true,
      provisioned: false,
      serial: "",
      ssid: null,
      accountEmail: null,
      panelsAdopted: 0,
      panels: [],
    },
  };
}

export function apexOutletPayload(mode: OutletMode): { status: [string, string, string, string] } {
  const map: Record<OutletMode, string> = {
    off: "OFF",
    on: "ON",
    auto: "AUTO",
  };
  return { status: [map[mode], "", "OK", ""] };
}
