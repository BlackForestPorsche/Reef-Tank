import {
  adoptPanel,
  bootHub,
  getProvision,
  pairHub,
  resetProvision,
  scannedNetworks,
  setHubAccount,
  setHubWifi,
} from "@/server/dummy-hub";
import type { PairingChannel } from "@/server/provision-types";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    provision: getProvision(),
    networks: scannedNetworks(),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: string;
    channel?: PairingChannel;
    ssid?: string;
    email?: string;
    panelId?: string;
  };
  try {
    switch (body.action) {
      case "boot":
        return Response.json(bootHub());
      case "pair":
        if (body.channel !== "ble" && body.channel !== "ap") {
          return Response.json({ error: "Choose Bluetooth or Hub Wi-Fi." }, { status: 400 });
        }
        return Response.json(pairHub(body.channel));
      case "wifi":
        if (!body.ssid) return Response.json({ error: "Pick a network." }, { status: 400 });
        return Response.json(setHubWifi(body.ssid));
      case "account":
        if (!body.email) return Response.json({ error: "Enter an email." }, { status: 400 });
        return Response.json(setHubAccount(body.email));
      case "adopt":
        if (!body.panelId) return Response.json({ error: "Pick a panel." }, { status: 400 });
        return Response.json(adoptPanel(body.panelId));
      case "reset":
        return Response.json(resetProvision());
      default:
        return Response.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Hub action failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
