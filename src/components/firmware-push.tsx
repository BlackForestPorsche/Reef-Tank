"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type OtaPayload = {
  version: string;
  hub: {
    current: string;
    target: string;
    status: string;
    lastError: string | null;
    hostUpdater?: boolean;
    binaryPresent?: boolean;
  };
  panel: {
    current: string;
    target: string;
    status: string;
    lastError: string | null;
    binaryPresent: boolean;
    url: string;
  };
  devices: { id: string; kind: string; version: string; seenAt: number }[];
};

export function FirmwarePush() {
  const [ota, setOta] = useState<OtaPayload | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function pull() {
      const res = await fetch("/api/ota", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as OtaPayload;
      if (!cancelled) setOta(data);
    }
    void pull();
    const id = window.setInterval(() => void pull(), 4000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  async function push(target: "hub" | "panel" | "all") {
    setBusy(target);
    try {
      const res = await fetch("/api/ota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Push failed");
      setOta(data as OtaPayload);
      toast.success(
        target === "hub"
          ? "Helm update queued. The Pi pulls and rebuilds Docker."
          : target === "panel"
            ? "Sightglass update queued. Adopted screens pull on the next poll."
            : "Helm and Sightglass queued.",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Push failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm tracking-widest text-white/40 uppercase">Firmware push</h2>
      <div className="rounded-2xl border border-white/10 bg-white/4 px-4 py-4 text-sm">
        <p className="text-white/65">
          Signed-in owners push from the website or Android. Helm writes a
          flag the Pi host script watches. Sightglass units poll{" "}
          <code className="text-white/50">/api/ota/manifest</code> and HTTP-update
          when a <code className="text-white/50">panel.bin</code> is staged.
        </p>
        <dl className="mt-3 space-y-2">
          <Row
            label="Helm"
            value={`${ota?.hub.current ?? "…"} · ${ota?.hub.status ?? "checking"}`}
          />
          <Row
            label="Panels"
            value={`${ota?.panel.status ?? "checking"}${ota?.panel.binaryPresent ? "" : " · no .bin staged"}`}
          />
        </dl>
        {ota?.hub.lastError ? (
          <p className="mt-2 text-xs text-amber-200">{ota.hub.lastError}</p>
        ) : null}
        {ota?.panel.lastError ? (
          <p className="mt-2 text-xs text-amber-200">{ota.panel.lastError}</p>
        ) : null}
        {ota?.devices.length ? (
          <ul className="mt-3 space-y-1 text-xs text-white/45">
            {ota.devices.map((d) => (
              <li key={`${d.kind}-${d.id}`}>
                {d.kind} {d.id} · {d.version}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-xs text-white/40">No devices have checked in yet.</p>
        )}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Button
            className="h-10"
            disabled={busy !== null}
            onClick={() => void push("hub")}
          >
            {busy === "hub" ? "…" : "Helm"}
          </Button>
          <Button
            className="h-10"
            variant="outline"
            disabled={busy !== null}
            onClick={() => void push("panel")}
          >
            {busy === "panel" ? "…" : "Panels"}
          </Button>
          <Button
            className="h-10"
            variant="outline"
            disabled={busy !== null}
            onClick={() => void push("all")}
          >
            {busy === "all" ? "…" : "Both"}
          </Button>
        </div>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-white/45">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
