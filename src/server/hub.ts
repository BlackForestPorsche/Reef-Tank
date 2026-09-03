import { fetchApexStatus, setApexOutlet, triggerApexFeed } from "@/server/apex/client";
import {
  getMockApexStatus,
  getMockExtras,
  mockCancelFeed,
  mockSetOutlet,
  mockStartFeed,
} from "@/server/apex/mock";
import { apexOutletPayload, normalizeApexStatus } from "@/server/apex/normalize";
import { getProvision } from "@/server/dummy-hub";
import { ingestStatus, onlineHubSlice } from "@/server/online";
import type { FeedChannel, HubSettings, OutletMode, TankStatus } from "@/server/types";

const CHANNEL_INDEX: Record<FeedChannel, number> = { A: 0, B: 1, C: 2, D: 3 };

let settings: HubSettings = {
  tankName: "Display Reef",
  source: "mock",
  apexHost: process.env.APEX_HOST ?? "",
  apexUser: process.env.APEX_USER ?? "admin",
  apexPassword: process.env.APEX_PASSWORD ?? "",
  controlsEnabled: true,
  tempUnit: "F",
};

let lastLive: { at: number; status: TankStatus } | null = null;

export function getSettings(): HubSettings {
  return { ...settings, apexPassword: settings.apexPassword };
}

export function publicSettings(): Omit<HubSettings, "apexPassword"> & {
  apexPasswordSet: boolean;
} {
  const { apexPassword, ...rest } = settings;
  return { ...rest, apexPasswordSet: apexPassword.length > 0 };
}

export function updateSettings(patch: Partial<HubSettings>) {
  const next = { ...settings };
  for (const [key, value] of Object.entries(patch) as [keyof HubSettings, HubSettings[keyof HubSettings]][]) {
    if (value !== undefined) {
      (next as Record<string, unknown>)[key] = value;
    }
  }
  settings = next;
  lastLive = null;
  return publicSettings();
}

function hubSnapshot() {
  const p = getProvision();
  return {
    dummy: p.dummy,
    provisioned: p.provisioned,
    serial: p.serial,
    ssid: p.ssid,
    accountEmail: p.accountEmail,
    panelsAdopted: p.panels.filter((x) => x.adopted).length,
    panels: p.panels.map((x) => ({
      id: x.id,
      name: x.name,
      serial: x.serial,
      adopted: x.adopted,
      pairing: x.pairing,
    })),
    online: onlineHubSlice(),
  };
}

function unreachableStatus(message: string): TankStatus {
  return {
    tankName: settings.tankName,
    source: "apex",
    connected: false,
    stale: true,
    updatedAt: lastLive?.at ?? 0,
    ageMs: lastLive ? Date.now() - lastLive.at : 0,
    probes: lastLive?.status.probes ?? [],
    outlets: lastLive?.status.outlets ?? [],
    feed: lastLive?.status.feed ?? {
      active: null,
      remainingSec: 0,
      totalSec: 0,
      label: "Idle",
    },
    lights: lastLive?.status.lights ?? [],
    room: lastLive?.status.room ?? {
      available: false,
      temperatureF: null,
      humidity: null,
      co2: null,
      voc: null,
    },
    alerts: [
      {
        id: "apex-down",
        level: "alarm",
        title: "Apex unreachable",
        detail: message,
      },
    ],
    history: lastLive?.status.history ?? [],
    controlsEnabled: settings.controlsEnabled,
    hub: lastLive?.status.hub ?? hubSnapshot(),
  };
}

export async function getTankStatus(): Promise<TankStatus> {
  if (settings.source === "mock") {
    const raw = getMockApexStatus();
    const extras = getMockExtras();
    const status = normalizeApexStatus({
      raw,
      tankName: settings.tankName,
      tempUnit: settings.tempUnit,
      controlsEnabled: settings.controlsEnabled,
      fetchedAt: Date.now(),
    });
    status.source = "mock";
    status.room = extras.room;
    status.history = extras.history;
    if (status.feed.active) {
      status.feed.totalSec = extras.feedTotal || status.feed.remainingSec;
    }
    const intensity = extras.lightIntensity;
    status.lights = status.lights.map((l) => ({
      ...l,
      intensity: l.on ? intensity : 0,
      schedule: "Ramp 08:00–21:00",
    }));
    if (extras.room.co2 && extras.room.co2 > 1100) {
      status.alerts.unshift({
        id: "room-co2",
        level: "warn",
        title: "Room CO₂ is high",
        detail: `${extras.room.co2} ppm — tank pH often sags when the room is stuffy. Pro panels measure this.`,
      });
    }
    status.hub = hubSnapshot();
    ingestStatus(status);
    return status;
  }

  if (!settings.apexHost) {
    const down = unreachableStatus("Set the Apex LAN address in Settings.");
    ingestStatus(down);
    return down;
  }

  try {
    const raw = await fetchApexStatus(
      settings.apexHost,
      settings.apexUser,
      settings.apexPassword,
    );
    const status = normalizeApexStatus({
      raw,
      tankName: settings.tankName,
      tempUnit: settings.tempUnit,
      controlsEnabled: settings.controlsEnabled,
      fetchedAt: Date.now(),
    });
    lastLive = { at: Date.now(), status };
    status.hub = hubSnapshot();
    ingestStatus(status);
    return status;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Apex poll failed";
    const down = unreachableStatus(message);
    ingestStatus(down);
    return down;
  }
}

function assertControls() {
  if (!settings.controlsEnabled) {
    throw new Error("Controls are locked. Enable writes in Settings before touching livestock equipment.");
  }
}

export async function startFeed(channel: FeedChannel) {
  assertControls();
  if (settings.source === "mock") {
    mockStartFeed(channel);
    return getTankStatus();
  }
  await triggerApexFeed(
    settings.apexHost,
    settings.apexUser,
    settings.apexPassword,
    CHANNEL_INDEX[channel],
  );
  return getTankStatus();
}

export async function cancelFeed() {
  assertControls();
  if (settings.source === "mock") {
    mockCancelFeed();
    return getTankStatus();
  }
  // Apex Local uses feed index 4 as cancel / none on many firmwares.
  await triggerApexFeed(
    settings.apexHost,
    settings.apexUser,
    settings.apexPassword,
    4,
  );
  return getTankStatus();
}

export async function setOutlet(id: string, mode: OutletMode) {
  assertControls();
  if (settings.source === "mock") {
    mockSetOutlet(id, mode);
    return getTankStatus();
  }
  const payload = apexOutletPayload(mode);
  await setApexOutlet(
    settings.apexHost,
    settings.apexUser,
    settings.apexPassword,
    id,
    payload.status,
  );
  return getTankStatus();
}

export { CHANNEL_INDEX };
