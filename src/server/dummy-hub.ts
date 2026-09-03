import type { DummyPanel, HubProvision, PairingChannel, ScannedNetwork } from "@/server/provision-types";

const SERIAL = "HELM-7F2A";

function freshPanels(): DummyPanel[] {
  return [];
}

let provision: HubProvision = emptyProvision();

function emptyProvision(): HubProvision {
  return {
    dummy: true,
    booted: false,
    paired: false,
    channel: null,
    serial: SERIAL,
    ssid: null,
    accountEmail: null,
    provisioned: false,
    panels: freshPanels(),
  };
}

export function getProvision(): HubProvision {
  return structuredClone(provision);
}

export function resetProvision(): HubProvision {
  provision = emptyProvision();
  return getProvision();
}

export function bootHub(): HubProvision {
  provision.booted = true;
  return getProvision();
}

export function pairHub(channel: PairingChannel): HubProvision {
  if (!provision.booted) throw new Error("Power the hub first.");
  provision.channel = channel;
  provision.paired = true;
  return getProvision();
}

export function setHubWifi(ssid: string): HubProvision {
  if (!provision.paired) throw new Error("Pair the hub first.");
  provision.ssid = ssid;
  return getProvision();
}

export function setHubAccount(email: string): HubProvision {
  if (!provision.ssid) throw new Error("Join Wi-Fi first.");
  provision.accountEmail = email;
  provision.provisioned = true;
  return getProvision();
}

export function scannedNetworks(): ScannedNetwork[] {
  return [
    { ssid: "Black-Reef", rssi: -41, secure: true },
    { ssid: "Black-Reef-IoT", rssi: -58, secure: true },
    { ssid: "Guest", rssi: -72, secure: false },
  ];
}

function codeFrom(id: string) {
  let n = 0;
  for (const c of id) n = (n + c.charCodeAt(0) * 17) % 10000;
  return n.toString().padStart(4, "0");
}

export function touchPanel(slot: string): DummyPanel {
  const id = slot === "2" ? "panel-cabinet" : "panel-tank";
  const existing = provision.panels.find((p) => p.id === id);
  if (existing) {
    existing.online = true;
    return { ...existing };
  }
  const panel: DummyPanel = {
    id,
    name: id === "panel-cabinet" ? "Cabinet Sightglass" : "Tank Sightglass",
    serial: id === "panel-cabinet" ? "SG-11C0" : "SG-A3F2",
    pairingCode: codeFrom(id),
    adopted: false,
    pairing: true,
    online: true,
  };
  provision.panels.push(panel);
  return { ...panel };
}

export function setPanelPairing(id: string, pairing: boolean): DummyPanel {
  const panel = provision.panels.find((p) => p.id === id);
  if (!panel) throw new Error("Unknown panel");
  panel.pairing = pairing;
  panel.online = true;
  return { ...panel };
}

export function adoptPanel(id: string): HubProvision {
  if (!provision.provisioned) throw new Error("Finish Helm setup first (or load the demo rack).");
  const panel = provision.panels.find((p) => p.id === id);
  if (!panel) throw new Error("Panel not in range. Open the dummy firmware and enter pairing.");
  if (!panel.pairing && !panel.adopted) {
    throw new Error("That panel is not in pairing mode.");
  }
  panel.adopted = true;
  panel.pairing = false;
  return getProvision();
}

export function adoptPanelByCode(raw: string): HubProvision {
  const code = raw.replace(/\D/g, "").padStart(4, "0").slice(-4);
  if (code.length !== 4) throw new Error("Enter the 4-digit code on the Sightglass.");
  const panel = provision.panels.find((p) => p.pairingCode === code);
  if (!panel) {
    throw new Error("No Sightglass with that code. Leave pairing up on the glass.");
  }
  return adoptPanel(panel.id);
}

export function pairingPanels(): DummyPanel[] {
  return provision.panels.filter((p) => p.pairing && !p.adopted).map((p) => ({ ...p }));
}

function makeGlass(id: string, name: string, serial: string, adopted: boolean, pairing: boolean): DummyPanel {
  return {
    id,
    name,
    serial,
    pairingCode: codeFrom(id),
    adopted,
    pairing,
    online: true,
  };
}

/** Demo mode: a provisioned Helm plus tank/cabinet glass and one pairing unit. */
export function seedDemo(): HubProvision {
  provision = {
    dummy: true,
    booted: true,
    paired: true,
    channel: "ap",
    serial: SERIAL,
    ssid: "Black-Reef",
    accountEmail: "demo@salty.local",
    provisioned: true,
    panels: [
      makeGlass("sg-tank", "Tank Sightglass", "SG-A3F2", true, false),
      makeGlass("sg-cabinet", "Cabinet Sightglass", "SG-11C0", true, false),
      makeGlass("sg-sump", "Sump Sightglass", "SG-9E01", false, true),
    ],
  };
  return getProvision();
}

export function addFakeHelm(): HubProvision {
  provision.booted = true;
  provision.paired = true;
  provision.channel = provision.channel ?? "ap";
  provision.ssid = provision.ssid ?? "Black-Reef";
  provision.serial = SERIAL;
  provision.provisioned = true;
  if (!provision.accountEmail) provision.accountEmail = "demo@salty.local";
  return getProvision();
}

export function addFakeSightglass(name?: string): DummyPanel {
  addFakeHelm();
  const n = provision.panels.length + 1;
  const id = `sg-demo-${n}`;
  const panel = makeGlass(
    id,
    name?.trim() || `Sightglass ${n}`,
    `SG-${(0x1000 + n * 17).toString(16).toUpperCase()}`,
    false,
    true,
  );
  provision.panels.push(panel);
  return { ...panel };
}
