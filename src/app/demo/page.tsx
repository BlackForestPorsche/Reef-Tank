"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdoptGlass } from "@/components/adopt-glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DummyPanel, HubProvision } from "@/server/provision-types";

export default function DemoPage() {
  const [provision, setProvision] = useState<HubProvision | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function pull() {
      const res = await fetch("/api/demo", { cache: "no-store" });
      const data = (await res.json()) as { provision: HubProvision };
      if (!cancelled) setProvision(data.provision);
    }
    void pull();
    const id = window.setInterval(() => void pull(), 2500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  async function run(action: string, extra: Record<string, string> = {}) {
    setBusy(true);
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Demo action failed");
      setProvision(data.provision as HubProvision);
      toast.success(
        action === "seed"
          ? "Demo Helm + three Sightglass units loaded"
          : action === "add-helm"
            ? "Fake Helm online"
            : action === "add-sightglass"
              ? "Fake Sightglass in pairing"
              : "Demo hardware cleared",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const glasses = provision?.panels ?? [];

  return (
    <div>
      <p className="text-[11px] tracking-[0.18em] text-teal-300/80 uppercase">
        Salty Electronics · Demo
      </p>
      <h1 className="mt-1 text-2xl font-semibold">Fake hardware</h1>
      <p className="mt-2 mb-6 text-sm text-white/55">
        No Pi and no glass required. Seed a Helm and Sightglass units, then
        walk Glance, adopt, and firmware push. Same API the Android app uses.
      </p>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <Button className="h-11" disabled={busy} onClick={() => void run("seed")}>
          Load demo rack
        </Button>
        <Button
          className="h-11"
          variant="outline"
          disabled={busy}
          onClick={() => void run("add-helm")}
        >
          Add fake Helm
        </Button>
        <Button
          className="h-11"
          variant="outline"
          disabled={busy}
          onClick={() => void run("add-sightglass", { name })}
        >
          Add Sightglass
        </Button>
        <Button
          className="h-11"
          variant="outline"
          disabled={busy}
          onClick={() => void run("clear")}
        >
          Clear
        </Button>
      </div>
      <Input
        className="mb-6"
        placeholder="Optional Sightglass name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <section className="mb-4 rounded-2xl border border-white/10 bg-white/4 px-4 py-4 text-sm">
        <div className="text-[11px] tracking-widest text-white/40 uppercase">Helm</div>
        {provision?.provisioned ? (
          <>
            <div className="mt-1 font-medium">
              {provision.serial} · {provision.ssid}
            </div>
            <div className="text-xs text-white/45">
              {provision.accountEmail} · SoftAP would be Helm-
              {provision.serial.slice(-4)}
            </div>
          </>
        ) : (
          <p className="mt-1 text-white/45">No Helm in demo yet.</p>
        )}
      </section>

      <section className="mb-6 rounded-2xl border border-white/10 bg-white/4 px-4 py-4">
        <div className="mb-2 text-[11px] tracking-widest text-white/40 uppercase">
          Adopt from the glass
        </div>
        <AdoptGlass
          onAdopted={() =>
            void fetch("/api/demo", { cache: "no-store" })
              .then((res) => res.json())
              .then((data: { provision: HubProvision }) => setProvision(data.provision))
          }
        />
      </section>

      <section className="space-y-2">
        {glasses.length === 0 ? (
          <p className="text-sm text-white/45">No Sightglass units. Seed the rack or add one.</p>
        ) : (
          glasses.map((p) => <GlassRow key={p.id} panel={p} />)
        )}
      </section>

      <div className="mt-6 flex flex-wrap gap-3 text-sm text-teal-200">
        <Link href="/">Glance</Link>
        <Link href="/hub">Helm setup</Link>
        <Link href="/panel">Dummy Sightglass</Link>
        <Link href="/settings">Setup</Link>
      </div>
    </div>
  );
}

function GlassRow({ panel }: { panel: DummyPanel }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-sm">
      <div className="flex justify-between gap-3">
        <div className="font-medium">{panel.name}</div>
        <div className="text-[11px] text-teal-200/80">
          {panel.adopted ? "Adopted" : panel.pairing ? "Pairing" : "Idle"}
        </div>
      </div>
      <div className="mt-1 text-xs text-white/45">
        {panel.serial} · code {panel.pairingCode} · SSID Sightglass-
        {panel.serial.slice(-4)}
      </div>
    </div>
  );
}
