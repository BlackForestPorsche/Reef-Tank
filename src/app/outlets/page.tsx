"use client";

import { toast } from "sonner";
import { EmptyState, LoadingGlance, ScreenHeader } from "@/components/status-bits";
import { Button } from "@/components/ui/button";
import { useTank } from "@/lib/use-tank";
import { cn } from "@/lib/utils";
import type { Outlet, OutletMode, TankStatus } from "@/server/types";

const MODES: { id: OutletMode; label: string }[] = [
  { id: "off", label: "Off" },
  { id: "auto", label: "Auto" },
  { id: "on", label: "On" },
];

export default function OutletsPage() {
  const { status, loading, error, setStatus } = useTank();

  async function setMode(outlet: Outlet, mode: OutletMode) {
    if (mode === outlet.mode) return;
    const res = await fetch(`/api/outlets/${encodeURIComponent(outlet.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Outlet failed");
      return;
    }
    setStatus(data as TankStatus);
    toast.success(`${outlet.name} → ${mode}`);
  }

  return (
    <div>
      <ScreenHeader status={status} kicker="Outlets" />
      {loading && !status ? <LoadingGlance /> : null}
      {error && !status ? <EmptyState title="Hub offline" detail={error} /> : null}
      {status && status.outlets.length === 0 ? (
        <EmptyState
          title="No outlets yet"
          detail="Connect Apex Local in Setup, or stay on the demo tank."
        />
      ) : null}
      {status ? (
        <div className="space-y-3">
          {!status.controlsEnabled ? (
            <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm">
              Writes are locked. Auto is the safe default on Apex.
            </div>
          ) : (
            <p className="text-sm text-white/55">
              Off and On override Apex. Auto gives the program back. Livestock-critical
              outlets should live in Auto.
            </p>
          )}
          {status.outlets.map((outlet) => (
            <div
              key={outlet.id}
              className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{outlet.name}</div>
                  <div className="text-[11px] text-white/40">
                    {outlet.detail} · {outlet.device}
                  </div>
                </div>
                <span
                  className={cn(
                    "mt-0.5 size-2 rounded-full",
                    outlet.running ? "bg-teal-300" : "bg-white/20",
                  )}
                />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-black/25 p-1">
                {MODES.map((m) => (
                  <Button
                    key={m.id}
                    variant="ghost"
                    size="sm"
                    disabled={!status.controlsEnabled}
                    onClick={() => void setMode(outlet, m.id)}
                    className={cn(
                      "h-8 rounded-lg text-xs",
                      outlet.mode === m.id
                        ? m.id === "off"
                          ? "bg-rose-500/25 text-rose-100"
                          : m.id === "on"
                            ? "bg-amber-400/25 text-amber-50"
                            : "bg-teal-400/25 text-teal-50"
                        : "text-white/55",
                    )}
                  >
                    {m.label}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
