"use client";

import { useCallback, useEffect, useState } from "react";
import type { HubSettings, TankStatus } from "@/server/types";

export function useTank(intervalMs = 2000) {
  const [status, setStatus] = useState<TankStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function pull() {
      try {
        const res = await fetch("/api/status", { cache: "no-store" });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = (await res.json()) as TankStatus;
        if (cancelled) return;
        setStatus(data);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Helm unreachable");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const id = window.setInterval(() => {
      void pull();
    }, intervalMs);
    void pull();
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [intervalMs]);

  return { status, error, loading, setStatus };
}

export type PublicSettings = Omit<HubSettings, "apexPassword"> & {
  apexPasswordSet: boolean;
};

export function useSettings() {
  const [settings, setSettings] = useState<PublicSettings | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: PublicSettings) => {
        if (!cancelled) setSettings(data);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = useCallback(async (patch: Partial<HubSettings>) => {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error((data as { error?: string }).error ?? "Save failed");
    }
    setSettings(data as PublicSettings);
    return data as PublicSettings;
  }, []);

  return { settings, save };
}
