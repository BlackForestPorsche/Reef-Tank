"use client";

import { toast } from "sonner";
import { HoldButton } from "@/components/hold-button";
import { EmptyState, LoadingGlance, ScreenHeader } from "@/components/status-bits";
import { useTank } from "@/lib/use-tank";
import type { FeedChannel, TankStatus } from "@/server/types";

const CHANNELS: { id: FeedChannel; title: string; blurb: string }[] = [
  { id: "A", title: "Feed A", blurb: "Feeding — gyre and skimmer pause" },
  { id: "B", title: "Feed B", blurb: "Water change" },
  { id: "C", title: "Feed C", blurb: "Maintenance" },
  { id: "D", title: "Feed D", blurb: "Custom Apex program" },
];

export default function FeedPage() {
  const { status, loading, error, setStatus } = useTank();

  async function run(id: FeedChannel | "cancel") {
    const res = await fetch(`/api/feed/${id}`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Feed failed");
      return;
    }
    setStatus(data as TankStatus);
    toast.success(id === "cancel" ? "Feed cancelled" : `Feed ${id} started`);
  }

  return (
    <div>
      <ScreenHeader status={status} kicker="Feed" />
      {loading && !status ? <LoadingGlance /> : null}
      {error && !status ? (
        <EmptyState title="Hub offline" detail={error} />
      ) : null}
      {status ? (
        <>
          {status.feed.active ? (
            <div className="mb-4 rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-4 py-4">
              <div className="text-xs tracking-widest text-cyan-200/70 uppercase">
                Running {status.feed.active}
              </div>
              <div className="mt-1 flex items-end justify-between">
                <div>
                  <div className="text-lg font-medium">{status.feed.label}</div>
                  <div className="text-xs text-white/50">
                    Apex owns the timers. This only starts or cancels the cycle.
                  </div>
                </div>
                <div className="font-mono text-3xl text-cyan-100">
                  {Math.floor(status.feed.remainingSec / 60)}:
                  {(status.feed.remainingSec % 60).toString().padStart(2, "0")}
                </div>
              </div>
            </div>
          ) : (
            <p className="mb-4 text-sm text-white/55">
              Hold a cycle, or click it twice, to start. Apex still owns the
              timers — pumps follow whatever you already programmed.
            </p>
          )}

          {!status.controlsEnabled ? (
            <div className="mb-4 rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
              Controls are locked. Turn on writes in Setup before feeding.
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            {CHANNELS.map((ch) => (
              <HoldButton
                key={ch.id}
                label={ch.title}
                hint={ch.blurb}
                active={status.feed.active === ch.id}
                disabled={!status.controlsEnabled}
                onConfirm={() => run(ch.id)}
              />
            ))}
          </div>

          {status.feed.active ? (
            <div className="mt-4">
              <HoldButton
                label="Cancel feed"
                hint="Hold or click twice to restore Auto"
                variant="danger"
                disabled={!status.controlsEnabled}
                onConfirm={() => run("cancel")}
              />
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
