"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdoptGlass({
  onAdopted,
}: {
  onAdopted?: (name: string) => void;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function adopt() {
    setBusy(true);
    try {
      const res = await fetch("/api/hub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "adopt-code", code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Adopt failed");
      const match = (data.panels as { pairingCode: string; name: string }[] | undefined)?.find(
        (p) => p.pairingCode === code.replace(/\D/g, "").padStart(4, "0").slice(-4),
      );
      toast.success(`${match?.name ?? "Sightglass"} adopted`);
      setCode("");
      onAdopted?.(match?.name ?? "Sightglass");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Adopt failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-xs text-white/50">Pairing code from the glass</label>
      <div className="flex gap-2">
        <Input
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={4}
          placeholder="1781"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
          className="font-mono text-lg tracking-[0.3em]"
        />
        <Button
          className="h-11 shrink-0"
          disabled={busy || code.length !== 4}
          onClick={() => void adopt()}
        >
          {busy ? "Adopting…" : "Adopt"}
        </Button>
      </div>
      <p className="text-[11px] text-white/40">
        Same 4 digits on the Sightglass. Helm setup must be done first, or load
        the demo rack.
      </p>
    </div>
  );
}
