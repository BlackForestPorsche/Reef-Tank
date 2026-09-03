"use client";

import type { Alert, Probe, TankStatus } from "@/server/types";
import { cn } from "@/lib/utils";

export function ScreenHeader({
  status,
  kicker,
}: {
  status: TankStatus | null;
  kicker?: string;
}) {
  const age = status ? Math.round(status.ageMs / 1000) : null;
  return (
    <header className="mb-5 flex items-start justify-between gap-3">
      <div>
        <p className="text-[11px] font-medium tracking-[0.18em] text-teal-300/80 uppercase">
          {kicker ?? "Sightglass"}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {status?.tankName ?? "Connecting"}
        </h1>
      </div>
      <Freshness status={status} age={age} />
    </header>
  );
}

function Freshness({
  status,
  age,
}: {
  status: TankStatus | null;
  age: number | null;
}) {
  const ok = status?.connected && !status.stale;
  return (
    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-right">
      <div
        className={cn(
          "text-[11px] font-medium tracking-wide",
          !status
            ? "text-white/40"
            : ok
              ? "text-teal-300"
              : "text-amber-300",
        )}
      >
        {!status ? "…" : !status.connected ? "Offline" : status.stale ? "Stale" : "Live"}
      </div>
      <div className="text-[10px] text-white/40">
        {status?.source === "mock" ? "Demo tank" : "Apex Local"}
        {age != null && status?.connected ? ` · ${age}s` : ""}
      </div>
    </div>
  );
}

export function AlertStrip({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="mb-4 rounded-2xl border border-teal-400/15 bg-teal-400/8 px-4 py-3 text-sm text-teal-100/90">
        Life support looks quiet. No alarms.
      </div>
    );
  }
  const top = alerts[0];
  const tone =
    top.level === "alarm"
      ? "border-rose-400/30 bg-rose-500/15 text-rose-50"
      : top.level === "warn"
        ? "border-amber-400/30 bg-amber-500/12 text-amber-50"
        : "border-sky-400/25 bg-sky-500/12 text-sky-50";
  return (
    <div className={cn("mb-4 rounded-2xl border px-4 py-3", tone)}>
      <div className="text-sm font-medium">{top.title}</div>
      <div className="mt-0.5 text-xs text-white/70">{top.detail}</div>
      {alerts.length > 1 ? (
        <div className="mt-2 text-[11px] text-white/50">
          +{alerts.length - 1} more
        </div>
      ) : null}
    </div>
  );
}

export function ProbeCard({ probe }: { probe: Probe }) {
  const tone =
    probe.band === "alarm"
      ? "text-rose-300"
      : probe.band === "warn"
        ? "text-amber-300"
        : "text-white";
  return (
    <div className="rounded-2xl border border-white/8 bg-white/4 px-3 py-4">
      <div className="text-[11px] tracking-widest text-white/45 uppercase">
        {probe.name}
      </div>
      <div className={cn("mt-1 font-mono text-3xl leading-none tracking-tight", tone)}>
        {probe.display}
        <span className="ml-1 text-sm font-sans text-white/35">{probe.unit}</span>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 px-4 py-10 text-center">
      <div className="text-base font-medium">{title}</div>
      <div className="mt-1 text-sm text-white/50">{detail}</div>
    </div>
  );
}

export function LoadingGlance() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-16 rounded-2xl bg-white/6" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-2xl bg-white/6" />
        <div className="h-24 rounded-2xl bg-white/6" />
        <div className="h-24 rounded-2xl bg-white/6" />
        <div className="h-24 rounded-2xl bg-white/6" />
      </div>
    </div>
  );
}

export function featuredProbes(status: TankStatus): Probe[] {
  const order = ["temp", "ph", "salinity", "alk"] as const;
  const picked: Probe[] = [];
  for (const kind of order) {
    const p = status.probes.find((x) => x.kind === kind);
    if (p) picked.push(p);
  }
  if (picked.length < 4) {
    for (const p of status.probes) {
      if (picked.length >= 4) break;
      if (!picked.includes(p)) picked.push(p);
    }
  }
  return picked;
}
