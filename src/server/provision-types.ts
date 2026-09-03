export type PairingChannel = "ble" | "ap";

export type DummyPanel = {
  id: string;
  name: string;
  serial: string;
  pairingCode: string;
  adopted: boolean;
  pairing: boolean;
  online: boolean;
};

export type HubProvision = {
  dummy: boolean;
  booted: boolean;
  paired: boolean;
  channel: PairingChannel | null;
  serial: string;
  ssid: string | null;
  accountEmail: string | null;
  provisioned: boolean;
  panels: DummyPanel[];
};

export type ScannedNetwork = {
  ssid: string;
  rssi: number;
  secure: boolean;
};
