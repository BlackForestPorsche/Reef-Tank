"use client";

import { EmptyState, LoadingGlance, ScreenHeader } from "@/components/status-bits";
import { useTank } from "@/lib/use-tank";
import { cn } from "@/lib/utils";

export default function LightsPage() {
  const { status, loading, error } = useTank();

  return (
    <div>
      <ScreenHeader status={status} kicker="Lights" />
      {loading && !status ? <LoadingGlance /> : null}
      {error && !status ? <EmptyState title="Hub offline" detail={error} /> : null}
      {status && status.lights.length === 0 ? (
        <EmptyState
          title="No lights on Apex"
          detail="If Hydras run on Apex MXM or 0–10V, they show up here. Direct AI LAN control is a later adapter."
        />
      ) : null}
      {status ? (
        <div className="space-y-3">
          <p className="text-sm text-white/55">
            Sightglass does not replace the AI schedule. It shows what Apex already
            believes, and lets you force an outlet if you must.
          </p>
          {status.lights.map((light) => (
            <div
              key={light.id}
              className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{light.name}</div>
                  <div className="text-[11px] text-white/40">{light.schedule}</div>
                </div>
                <div
                  className={cn(
                    "text-sm",
                    light.on ? "text-amber-200" : "text-white/40",
                  )}
                >
                  {light.on ? "On" : "Off"}
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/40">
                <div
                  className="h-full rounded-full bg-linear-to-r from-amber-200 to-sky-300"
                  style={{ width: `${light.intensity}%` }}
                />
              </div>
              <div className="mt-1 text-right font-mono text-xs text-white/45">
                {light.intensity}%
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
