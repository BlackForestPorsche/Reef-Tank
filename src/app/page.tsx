"use client";

import { featuredProbes, AlertStrip, LoadingGlance, ProbeCard, ScreenHeader } from "@/components/status-bits";
import { AdoptGlass } from "@/components/adopt-glass";
import { Sparkline } from "@/components/sparkline";
import { useTank } from "@/lib/use-tank";
import type { Outlet, TankStatus } from "@/server/types";

export default function GlancePage() {
  const { status, error, loading } = useTank();

  return (
    <div>
      <ScreenHeader status={status} kicker="Glance" />
      {loading && !status ? <LoadingGlance /> : null}
      {error && !status ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-6 text-sm">
          Cannot reach Helm. Start Sightglass, then retry.
          <div className="mt-2 text-white/50">{error}</div>
        </div>
      ) : null}
      {status ? <GlanceBody status={status} /> : null}
    </div>
  );
}

function GlanceBody({ status }: { status: TankStatus }) {
  const probes = featuredProbes(status);
  const extras = status.probes.filter((p) => !probes.includes(p));
  const returnPump = status.outlets.find((o) => o.device === "return");
  const gyre = status.outlets.find((o) => o.device === "gyre");
  const lightsOn = status.lights.filter((l) => l.on).length;

  return (
    <>
      <AlertStrip alerts={status.alerts} />

      {!status.hub.provisioned ? (
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/4 px-4 py-3">
          <div className="mb-2 text-[11px] tracking-widest text-white/40 uppercase">
            Add Sightglass
          </div>
          <AdoptGlass />
          <p className="mt-2 text-[11px] text-white/35">
            Need a Helm first?{" "}
            <a href="/demo" className="text-teal-200">
              Load demo rack
            </a>{" "}
            or{" "}
            <a href="/hub" className="text-teal-200">
              Helm setup
            </a>
            .
          </p>
        </div>
      ) : null}

      {status.hub.provisioned ? (
        <div className="mb-4 rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm">
          <div className="text-[11px] tracking-widest text-white/40 uppercase">
            {status.hub.dummy ? "Demo Helm" : "Helm"}
          </div>
          <div className="mt-0.5 font-medium">
            {status.hub.accountEmail ?? status.hub.serial} · {status.hub.ssid}
          </div>
          <div className="text-[11px] text-white/45">
            {status.hub.panelsAdopted} Sightglass
            {status.hub.panelsAdopted === 1 ? "" : " units"} adopted
            {status.hub.dummy ? " · demo rack" : ""}
            {" · online "}
            {status.hub.online.state === "connected"
              ? "connected"
              : status.hub.online.state === "waiting"
                ? "waiting for relay"
                : status.hub.online.state === "error"
                  ? "relay error"
                  : "off"}
            {status.hub.online.queued
              ? ` · ${status.hub.online.queued} queued`
              : ""}
          </div>
          {status.hub.panels.length > 0 ? (
            <ul className="mt-2 space-y-1 text-xs text-white/50">
              {status.hub.panels.map((p) => (
                <li key={p.id}>
                  {p.name} · {p.serial}
                  {p.pairing ? " · pairing" : p.adopted ? " · adopted" : ""}
                </li>
              ))}
            </ul>
          ) : null}
          {status.hub.dummy ? (
            <a href="/demo" className="mt-2 inline-block text-xs text-teal-200">
              Manage demo hardware
            </a>
          ) : null}
          <div className="mt-3 border-t border-white/8 pt-3">
            <AdoptGlass />
          </div>
        </div>
      ) : null}

      {status.feed.active ? (
        <div className="mb-4 rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-4 py-3">
          <div className="text-xs tracking-widest text-cyan-200/80 uppercase">
            Feed {status.feed.active}
          </div>
          <div className="mt-1 flex items-end justify-between">
            <div className="text-lg font-medium">{status.feed.label}</div>
            <div className="font-mono text-2xl text-cyan-100">
              {formatClock(status.feed.remainingSec)}
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        {probes.map((p) => (
          <ProbeCard key={p.id} probe={p} />
        ))}
      </div>

      <section className="mt-4 grid grid-cols-3 gap-2">
        <EquipChip label="Return" outlet={returnPump} />
        <EquipChip label="Gyre" outlet={gyre} />
        <div className="rounded-2xl border border-white/8 bg-white/4 px-3 py-3">
          <div className="text-[10px] tracking-widest text-white/40 uppercase">Lights</div>
          <div className="mt-1 text-sm font-medium">
            {lightsOn}/{status.lights.length || 0}
          </div>
          <div className="text-[11px] text-white/40">AI on schedule</div>
        </div>
      </section>

      {status.history.length > 2 ? (
        <section className="mt-4 rounded-2xl border border-white/8 bg-white/4 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium">pH · last hours</div>
            <div className="text-[11px] text-teal-200/70">Helm</div>
          </div>
          <Sparkline
            values={status.history.map((h) => h.ph)}
            className="h-14 text-teal-300"
          />
          <p className="mt-2 text-[11px] leading-relaxed text-white/40">
            History lives on Helm. Helm online (included) queues Apex/glass
            alerts for a relay you connect later. Fusion already does Apex-on-phone.
          </p>
        </section>
      ) : null}

      {status.room.available ? (
        <section className="mt-3 grid grid-cols-4 gap-2">
          <RoomStat label="Room" value={`${status.room.temperatureF?.toFixed(0)}°`} />
          <RoomStat label="RH" value={`${status.room.humidity}%`} />
          <RoomStat label="CO₂" value={`${status.room.co2}`} />
          <RoomStat label="VOC" value={`${status.room.voc}`} />
        </section>
      ) : (
        <p className="mt-4 text-center text-[11px] text-white/35">
          Room CO₂ / VOC arrive with a Pro panel. Demo tank fakes them so you can
          see the pH story.
        </p>
      )}

      {extras.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {extras.map((p) => (
            <div
              key={p.id}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
            >
              {p.name} {p.display}
              {p.unit ? ` ${p.unit}` : ""}
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}

function EquipChip({ label, outlet }: { label: string; outlet?: Outlet }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/4 px-3 py-3">
      <div className="text-[10px] tracking-widest text-white/40 uppercase">{label}</div>
      <div className="mt-1 text-sm font-medium">
        {outlet ? (outlet.running ? "On" : "Off") : "—"}
      </div>
      <div className="text-[11px] capitalize text-white/40">
        {outlet?.mode ?? "not seen"}
      </div>
    </div>
  );
}

function RoomStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/4 px-2 py-2 text-center">
      <div className="text-[10px] text-white/40">{label}</div>
      <div className="font-mono text-sm">{value}</div>
    </div>
  );
}

function formatClock(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
