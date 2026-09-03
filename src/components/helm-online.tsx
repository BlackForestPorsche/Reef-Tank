"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

type OnlineNotice = {
  id: string;
  title: string;
  detail: string;
  level: string;
  createdAt: number;
  delivered: boolean;
};

type OnlineStatus = {
  enabled: boolean;
  state: "off" | "waiting" | "connected" | "error";
  relaySet: boolean;
  deviceId: string;
  lastHeartbeatAt: number | null;
  lastError: string | null;
  queued: number;
  delivered: number;
  notices: OnlineNotice[];
};

const LABEL: Record<OnlineStatus["state"], string> = {
  off: "Off — local LAN only",
  waiting: "Waiting for a relay",
  connected: "Connected to relay",
  error: "Relay error",
};

export function HelmOnline() {
  const [online, setOnline] = useState<OnlineStatus | null>(null);
  const [relayUrl, setRelayUrl] = useState("");
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const res = await fetch("/api/online", { cache: "no-store" });
    const data = (await res.json()) as OnlineStatus;
    setOnline(data);
  }

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 8000);
    return () => window.clearInterval(id);
  }, []);

  async function save(patch: { enabled?: boolean; relayUrl?: string }) {
    setSaving(true);
    try {
      const res = await fetch("/api/online", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Save failed");
      setOnline(data as OnlineStatus);
      toast.success("Helm online saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function test() {
    try {
      const res = await fetch("/api/online", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Sign in required.");
      setOnline(data as OnlineStatus);
      toast.success("Test alert queued on this Helm");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in required");
    }
  }

  if (!online) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/4 px-4 py-4 text-sm text-white/45">
        Checking Helm online…
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-2xl border border-white/10 bg-white/4 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Helm online</h2>
          <p className="mt-1 text-xs leading-relaxed text-white/50">
            Included with the box — not a subscription. Helm watches Apex and
            Sightglass on the LAN, then queues alerts. A relay you add later
            delivers them to the phone off house Wi-Fi. Apex writes never leave
            this network.
          </p>
        </div>
        <Switch
          checked={online.enabled}
          onCheckedChange={(enabled) => void save({ enabled })}
        />
      </div>

      <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-xs">
        <div className="font-medium text-teal-100">{LABEL[online.state]}</div>
        <div className="mt-1 text-white/45">
          Device {online.deviceId}
          {online.queued ? ` · ${online.queued} waiting` : ""}
          {online.delivered ? ` · ${online.delivered} handed to relay` : ""}
        </div>
        {online.lastError ? (
          <div className="mt-1 text-rose-200/80">{online.lastError}</div>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-white/50">Relay URL (later)</label>
        <Input
          placeholder="https://relay.example.com"
          value={relayUrl}
          onChange={(e) => setRelayUrl(e.target.value)}
        />
        <p className="text-[11px] text-white/40">
          Leave empty until you have a broker. Env <code>HELM_RELAY_URL</code>{" "}
          also works. Protocol: <code>POST /v1/ingest</code>.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          className="h-10"
          variant="outline"
          disabled={saving}
          onClick={() => void save({ relayUrl })}
        >
          {saving ? "Saving…" : "Save relay"}
        </Button>
        <Button className="h-10" variant="outline" onClick={() => void test()}>
          Queue test alert
        </Button>
      </div>

      {online.notices.length > 0 ? (
        <ul className="space-y-1.5 text-xs text-white/55">
          {online.notices.map((n) => (
            <li key={n.id}>
              <span className={n.delivered ? "text-teal-200/80" : "text-amber-100/80"}>
                {n.delivered ? "sent" : "queued"}
              </span>
              {" · "}
              {n.title}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[11px] text-white/35">
          No alerts queued. Demo tank high CO₂ and a live Apex drop will show here.
        </p>
      )}
    </section>
  );
}
