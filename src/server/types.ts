export type DataSource = "mock" | "apex";

export type ProbeKind =
  | "temp"
  | "ph"
  | "salinity"
  | "alk"
  | "ca"
  | "mg"
  | "orp"
  | "other";

export type ProbeBand = "ok" | "warn" | "alarm" | "stale";

export type Probe = {
  id: string;
  name: string;
  kind: ProbeKind;
  value: number | null;
  unit: string;
  display: string;
  band: ProbeBand;
};

export type OutletMode = "off" | "auto" | "on";

export type Outlet = {
  id: string;
  name: string;
  mode: OutletMode;
  running: boolean;
  device: "return" | "gyre" | "light" | "skimmer" | "heater" | "other";
  detail?: string;
};

export type FeedChannel = "A" | "B" | "C" | "D";

export type FeedStatus = {
  active: FeedChannel | null;
  remainingSec: number;
  totalSec: number;
  label: string;
};

export type LightChannel = {
  id: string;
  name: string;
  intensity: number;
  schedule: string;
  on: boolean;
};

export type RoomSensors = {
  available: boolean;
  temperatureF: number | null;
  humidity: number | null;
  co2: number | null;
  voc: number | null;
};

export type AlertLevel = "info" | "warn" | "alarm";

export type Alert = {
  id: string;
  level: AlertLevel;
  title: string;
  detail: string;
};

export type HistoryPoint = {
  t: number;
  temp: number;
  ph: number;
};

export type TankStatus = {
  tankName: string;
  source: DataSource;
  connected: boolean;
  stale: boolean;
  updatedAt: number;
  ageMs: number;
  probes: Probe[];
  outlets: Outlet[];
  feed: FeedStatus;
  lights: LightChannel[];
  room: RoomSensors;
  alerts: Alert[];
  history: HistoryPoint[];
  controlsEnabled: boolean;
  hub: {
    dummy: boolean;
    provisioned: boolean;
    serial: string;
    ssid: string | null;
    accountEmail: string | null;
    panelsAdopted: number;
    panels: { id: string; name: string; serial: string; adopted: boolean; pairing: boolean }[];
    online: {
      enabled: boolean;
      state: "off" | "waiting" | "connected" | "error";
      queued: number;
    };
  };
};

export type HubSettings = {
  tankName: string;
  source: DataSource;
  apexHost: string;
  apexUser: string;
  apexPassword: string;
  controlsEnabled: boolean;
  tempUnit: "F" | "C";
};

export type OutletCommand = {
  mode: OutletMode;
};
