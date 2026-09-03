"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdoptGlass } from "@/components/adopt-glass";
import type { DummyPanel, HubProvision, PairingChannel, ScannedNetwork } from "@/server/provision-types";

type Step =
  | "welcome"
  | "flash"
  | "power"
  | "pair"
  | "wifi"
  | "account"
  | "adopt"
  | "done";

export default function HubSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [busy, setBusy] = useState(false);
  const [provision, setProvision] = useState<HubProvision | null>(null);
  const [networks, setNetworks] = useState<ScannedNetwork[]>([]);
  const [channel, setChannel] = useState<PairingChannel>("ble");
  const [ssid, setSsid] = useState("Black-Reef");
  const [wifiPass, setWifiPass] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/hub", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { provision: HubProvision; networks: ScannedNetwork[] }) => {
        if (cancelled) return;
        setProvision(data.provision);
        setNetworks(data.networks);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (step !== "adopt") return;
    const id = window.setInterval(() => {
      void fetch("/api/hub", { cache: "no-store" })
        .then((res) => res.json())
        .then((data: { provision: HubProvision; networks: ScannedNetwork[] }) => {
          setProvision(data.provision);
          setNetworks(data.networks);
        });
    }, 1500);
    return () => window.clearInterval(id);
  }, [step]);

  async function post(body: Record<string, unknown>, delay = 900) {
    setBusy(true);
    await wait(delay);
    try {
      const res = await fetch("/api/hub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setProvision(data as HubProvision);
      return data as HubProvision;
    } finally {
      setBusy(false);
    }
  }

  async function createHubAccount() {
    setBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not create account");
      await post({ action: "account", email }, 400);
      setStep("adopt");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create account");
      setBusy(false);
    }
  }

  const pairing = provision?.panels.filter((p) => p.pairing && !p.adopted) ?? [];
  const adopted = provision?.panels.filter((p) => p.adopted) ?? [];

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col px-5 py-8">
      <p className="text-[11px] font-medium tracking-[0.2em] text-teal-300/80 uppercase">
        Salty Electronics · Helm
      </p>
      <p className="mt-1 text-xs text-white/40">Dummy walkthrough — no Pi, no Linux</p>

      {step === "welcome" ? (
        <Pane
          title="Plug it in. Pair the phone. Done."
          body="Helm is a black box. Nobody SSHs, nobody types apt, nobody sees Linux. You flash a card once, or buy it pre-flashed. After that it is USB-C and this app."
        >
          <ol className="mb-6 space-y-2 text-sm text-white/65">
            <li>1. Flash the SD with Raspberry Pi Imager — pick Helm.</li>
            <li>2. Plug Helm into power. It makes its own Bluetooth / setup Wi-Fi.</li>
            <li>3. This app puts it on your network, creates your account, adopts Sightglass units.</li>
          </ol>
          <Button className="h-11 w-full" onClick={() => setStep("flash")}>
            Set up Helm
          </Button>
          <Link href="/settings" className="mt-4 block text-center text-sm text-white/45">
            Back
          </Link>
        </Pane>
      ) : null}

      {step === "flash" ? (
        <Pane
          title="Flash the SD card"
          body="On a computer, open Raspberry Pi Imager → Choose OS → Helm. Write. Eject. That image already has Sightglass, Docker, and first-boot pairing. There is no terminal."
        >
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/4 p-4 text-sm text-white/65">
            Dummy: pretend the card is written. A real Helm ships with this image, or a customer downloads one file and flashes it like a Steam Deck recovery.
          </div>
          <Button className="h-11 w-full" onClick={() => setStep("power")}>
            Card is flashed
          </Button>
        </Pane>
      ) : null}

      {step === "power" ? (
        <Pane
          title="Plug Helm in"
          body="USB-C on the back. Wait for the white LED to breathe. It is advertising Bluetooth and, as a fallback, a Wi-Fi named Helm-7F2A."
        >
          <Button
            className="h-11 w-full"
            disabled={busy}
            onClick={() => void post({ action: "boot" }, 1100).then(() => setStep("pair"))}
          >
            {busy ? "Waiting for LED…" : "I plugged it in"}
          </Button>
        </Pane>
      ) : null}

      {step === "pair" ? (
        <Pane
          title="Pair this phone"
          body="Bluetooth is the easy path — you stay on home Wi-Fi. If BLE is blocked, join Helm’s own Wi-Fi for a minute, then come back."
        >
          <div className="mb-4 grid grid-cols-2 gap-2">
            <Choice
              active={channel === "ble"}
              title="Bluetooth"
              detail="Recommended"
              onClick={() => setChannel("ble")}
            />
            <Choice
              active={channel === "ap"}
              title="Helm Wi-Fi"
              detail="Helm-7F2A"
              onClick={() => setChannel("ap")}
            />
          </div>
          <Button
            className="h-11 w-full"
            disabled={busy}
            onClick={() =>
              void post({ action: "pair", channel }, 1400).then(() => setStep("wifi"))
            }
          >
            {busy ? "Pairing…" : channel === "ble" ? "Pair over Bluetooth" : "Join setup Wi-Fi"}
          </Button>
        </Pane>
      ) : null}

      {step === "wifi" ? (
        <Pane
          title="Put Helm on your network"
          body="Helm needs the tank LAN so it can talk to Apex and the screens. Your phone already did the pairing — this is just the house Wi-Fi."
        >
          <div className="mb-4 space-y-2">
            {networks.map((n) => (
              <button
                key={n.ssid}
                type="button"
                onClick={() => setSsid(n.ssid)}
                className={
                  ssid === n.ssid
                    ? "flex w-full items-center justify-between rounded-xl border border-teal-300/40 bg-teal-400/10 px-3 py-3 text-left"
                    : "flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/4 px-3 py-3 text-left"
                }
              >
                <span className="text-sm">{n.ssid}</span>
                <span className="text-[11px] text-white/40">{n.rssi} dBm</span>
              </button>
            ))}
          </div>
          <Label>Password</Label>
          <Input
            className="mt-1 mb-4"
            type="password"
            value={wifiPass}
            onChange={(e) => setWifiPass(e.target.value)}
            placeholder="Wi-Fi password"
          />
          <Button
            className="h-11 w-full"
            disabled={busy}
            onClick={() => void post({ action: "wifi", ssid }, 1600).then(() => setStep("account"))}
          >
            {busy ? "Joining…" : `Join ${ssid}`}
          </Button>
        </Pane>
      ) : null}

      {step === "account" ? (
        <Pane
          title="Your Helm account"
          body="This lives on Helm, not a Linux login and not a required cloud. Same email on another phone can be invited later."
        >
          <Label>Email</Label>
          <Input
            className="mt-1 mb-3"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@home"
          />
          <Label>Password</Label>
          <Input
            className="mt-1 mb-4"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Helm password"
          />
          <Button
            className="h-11 w-full"
            disabled={busy || !email || password.length < 8}
            onClick={() => void createHubAccount()}
          >
            {busy ? "Saving…" : "Create account"}
          </Button>
        </Pane>
      ) : null}

      {step === "adopt" ? (
        <Pane
          title="Adopt screens"
          body="ESP32 panels use the same idea: plug in USB-C, they show a pairing code. No flashing tools for customers — we ship them programmed, or they use the same Imager-style installer."
        >
          <a
            href="/panel"
            target="_blank"
            rel="noreferrer"
            className="mb-4 block rounded-2xl border border-dashed border-teal-300/30 bg-teal-400/8 px-4 py-3 text-sm text-teal-100"
          >
            Open dummy panel firmware →
            <div className="mt-1 text-xs text-white/50">
              New tab. That 4&quot; square is the ESP32. Type the code below.
            </div>
          </a>
          <div className="mb-4">
            <AdoptGlass
              onAdopted={() =>
                void fetch("/api/hub", { cache: "no-store" })
                  .then((res) => res.json())
                  .then((data: { provision: HubProvision }) => setProvision(data.provision))
              }
            />
          </div>

          {pairing.length === 0 && adopted.length === 0 ? (
            <p className="mb-4 text-sm text-white/45">
              Waiting for a panel in pairing mode…
            </p>
          ) : null}

          <div className="mb-4 space-y-2">
            {pairing.map((p) => (
              <PanelRow
                key={p.id}
                panel={p}
                action="Adopt"
                busy={busy}
                onClick={() =>
                  void post({ action: "adopt", panelId: p.id }, 700)
                    .then(() => toast.success(`${p.name} adopted`))
                    .catch((err: Error) => toast.error(err.message))
                }
              />
            ))}
            {adopted.map((p) => (
              <PanelRow key={p.id} panel={p} action="Adopted" />
            ))}
          </div>

          <Button
            className="h-11 w-full"
            onClick={() => setStep("done")}
            disabled={adopted.length === 0}
          >
            {adopted.length === 0 ? "Adopt at least one screen" : "Finish"}
          </Button>
        </Pane>
      ) : null}

      {step === "done" ? (
        <Pane
          title="Helm is a black box now"
          body={`${provision?.accountEmail ?? "You"} · ${provision?.ssid ?? "LAN"} · ${adopted.length} screen${adopted.length === 1 ? "" : "s"}. The Pi never showed a desktop. The panel never asked for a compiler.`}
        >
          <Button className="h-11 w-full" onClick={() => router.push("/")}>
            Open Glance
          </Button>
          <Button
            variant="outline"
            className="mt-3 h-11 w-full"
            onClick={() => window.open("/panel", "_blank")}
          >
            Open adopted panel
          </Button>
        </Pane>
      ) : null}
    </div>
  );
}

function wait(ms: number) {
  return new Promise((r) => window.setTimeout(r, ms));
}

function Pane({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 mb-6 text-sm leading-relaxed text-white/55">{body}</p>
      {children}
    </div>
  );
}

function Choice({
  active,
  title,
  detail,
  onClick,
}: {
  active: boolean;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-2xl border border-teal-300/40 bg-teal-400/10 px-3 py-3 text-left"
          : "rounded-2xl border border-white/10 bg-white/4 px-3 py-3 text-left"
      }
    >
      <div className="text-sm font-medium">{title}</div>
      <div className="text-[11px] text-white/45">{detail}</div>
    </button>
  );
}

function PanelRow({
  panel,
  action,
  busy,
  onClick,
}: {
  panel: DummyPanel;
  action: string;
  busy?: boolean;
  onClick?: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/4 px-4 py-3">
      <div>
        <div className="text-sm font-medium">{panel.name}</div>
        <div className="text-[11px] text-white/40">
          {panel.serial} · code {panel.pairingCode}
        </div>
      </div>
      {onClick ? (
        <Button size="sm" disabled={busy} onClick={onClick}>
          {action}
        </Button>
      ) : (
        <span className="text-xs text-teal-200">{action}</span>
      )}
    </div>
  );
}
