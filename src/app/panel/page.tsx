"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { DummyPanel, HubProvision } from "@/server/provision-types";
import type { Probe, TankStatus } from "@/server/types";

function PanelInner() {
  const slot = useSearchParams().get("slot") ?? "1";
  const [panel, setPanel] = useState<DummyPanel | null>(null);
  const [hub, setHub] = useState<HubProvision | null>(null);
  const [status, setStatus] = useState<TankStatus | null>(null);
  const [page, setPage] = useState<"home" | "feed">("home");

  useEffect(() => {
    let cancelled = false;
    async function pull() {
      const [pRes, sRes] = await Promise.all([
        fetch(`/api/panel?slot=${slot}`, { cache: "no-store" }),
        fetch("/api/status", { cache: "no-store" }),
      ]);
      const pData = (await pRes.json()) as { panel: DummyPanel; hub: HubProvision };
      if (cancelled) return;
      setPanel(pData.panel);
      setHub(pData.hub);
      setStatus((await sRes.json()) as TankStatus);
    }
    const id = window.setInterval(() => {
      void pull();
    }, 2000);
    void pull();
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [slot]);

  async function setPairing(pairing: boolean) {
    await fetch("/api/panel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slot, pairing }),
    });
    const res = await fetch(`/api/panel?slot=${slot}`, { cache: "no-store" });
    const pData = (await res.json()) as { panel: DummyPanel; hub: HubProvision };
    setPanel(pData.panel);
    setHub(pData.hub);
  }

  const probes = pick(status);
  const adopted = Boolean(panel?.adopted);
  const pairing = Boolean(panel?.pairing && !panel?.adopted);

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-black px-4 py-6">
      <p className="mb-3 text-center text-[11px] tracking-widest text-white/35 uppercase">
        Dummy Sightglass firmware · true 4&quot; 480×480
      </p>
      <div className="relative aspect-square w-full max-w-[480px] overflow-hidden rounded-[36px] border-[12px] border-zinc-900 shadow-[0_0_80px_rgba(13,148,136,0.14)]">
        <div className="flex h-full flex-col bg-[#07131c] p-7 text-white">
          {pairing || !adopted ? (
            <PairingFace
              panel={panel}
              onPair={() => void setPairing(true)}
            />
          ) : page === "feed" ? (
            <FeedFace status={status} onHome={() => setPage("home")} />
          ) : (
            <HomeFace
              status={status}
              probes={probes}
              hub={hub}
              onFeed={() => setPage("feed")}
            />
          )}
        </div>
      </div>
      <div className="mt-4 flex max-w-[320px] flex-col gap-2 text-center text-xs text-white/45">
        <p>
          Customers never open PlatformIO. They plug USB-C in. First boot is this
          pairing screen. Helm adopts it.
        </p>
        <div className="flex justify-center gap-2">
          <a className="underline decoration-white/20" href="/panel?slot=1">
            Tank Sightglass
          </a>
          <a className="underline decoration-white/20" href="/panel?slot=2">
            Cabinet Sightglass
          </a>
          <a className="underline decoration-white/20" href="/hub">
            Helm setup
          </a>
        </div>
      </div>
    </div>
  );
}

function PairingFace({
  panel,
  onPair,
}: {
  panel: DummyPanel | null;
  onPair: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPair}
      className="flex h-full flex-col items-center justify-center text-center"
    >
      <div className="text-[10px] tracking-[0.25em] text-teal-300/80 uppercase">
        Pairing
      </div>
      <div className="mt-3 font-mono text-6xl tracking-[0.2em] text-white">
        {panel?.pairingCode ?? "••••"}
      </div>
      <div className="mt-3 text-sm text-white/50">{panel?.serial}</div>
      <div className="mt-8 max-w-[16rem] text-sm leading-relaxed text-white/40">
        Plug in. Leave this up. On Helm type this code: Glance, Demo, or Helm
        setup → Adopt. Tap here if pairing was turned off.
      </div>
    </button>
  );
}

function HomeFace({
  status,
  probes,
  hub,
  onFeed,
}: {
  status: TankStatus | null;
  probes: Probe[];
  hub: HubProvision | null;
  onFeed: () => void;
}) {
  const stale = !status?.connected || status.stale;
  const top = status?.alerts[0];
  return (
    <button type="button" onClick={onFeed} className="flex h-full flex-col text-left">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs tracking-widest text-white/40 uppercase">
            {status?.tankName ?? "Reef"}
          </div>
          <div className={`text-sm ${stale ? "text-amber-300" : "text-teal-300"}`}>
            {stale ? "Stale" : "Live"}
            {hub?.provisioned ? " · Helm" : ""}
          </div>
        </div>
        <div className="text-xs text-white/35">swipe feed</div>
      </div>
      {top ? (
        <div
          className={
            top.level === "alarm"
              ? "mt-3 rounded-xl bg-rose-500/20 px-3 py-2 text-sm text-rose-50"
              : "mt-3 rounded-xl bg-amber-500/15 px-3 py-2 text-sm text-amber-50"
          }
        >
          {top.title}
        </div>
      ) : (
        <div className="mt-3 rounded-xl bg-teal-400/10 px-3 py-2 text-sm text-teal-100">
          Quiet
        </div>
      )}
      <div className="mt-4 grid flex-1 grid-cols-2 gap-4">
        {probes.map((p) => (
          <div key={p.id}>
            <div className="text-[11px] tracking-widest text-white/35 uppercase">
              {p.name}
            </div>
            <div
              className={`font-mono text-[2.15rem] leading-none ${
                p.band === "alarm"
                  ? "text-rose-300"
                  : p.band === "warn"
                    ? "text-amber-300"
                    : stale
                      ? "text-white/40"
                      : "text-teal-200"
              }`}
            >
              {p.display}
              <span className="ml-1 font-sans text-xs text-white/35">
                {p.unit}
              </span>
            </div>
          </div>
        ))}
      </div>
    </button>
  );
}

function FeedFace({
  status,
  onHome,
}: {
  status: TankStatus | null;
  onHome: () => void;
}) {
  return (
    <button type="button" onClick={onHome} className="flex h-full flex-col">
      <div className="text-[10px] tracking-widest text-white/40 uppercase">Feed</div>
      <div className="mt-2 grid flex-1 grid-cols-2 gap-2">
        {(["A", "B", "C", "D"] as const).map((ch) => {
          const on = status?.feed.active === ch;
          return (
            <div
              key={ch}
              className={
                on
                  ? "flex items-center justify-center rounded-xl bg-teal-400/25 text-lg"
                  : "flex items-center justify-center rounded-xl bg-white/6 text-lg text-white/70"
              }
            >
              {ch}
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-center font-mono text-xl text-teal-100">
        {status?.feed.active
          ? `${status.feed.active} ${Math.floor(status.feed.remainingSec / 60)}:${(status.feed.remainingSec % 60)
              .toString()
              .padStart(2, "0")}`
          : "Hold a letter on hardware"}
      </div>
    </button>
  );
}

function pick(status: TankStatus | null): Probe[] {
  if (!status) return [];
  const order = ["temp", "ph", "salinity", "alk"] as const;
  const out: Probe[] = [];
  for (const k of order) {
    const p = status.probes.find((x) => x.kind === k);
    if (p) out.push(p);
  }
  return out.slice(0, 4);
}

export default function PanelPage() {
  return (
    <Suspense fallback={<div className="min-h-full bg-black" />}>
      <PanelInner />
    </Suspense>
  );
}
