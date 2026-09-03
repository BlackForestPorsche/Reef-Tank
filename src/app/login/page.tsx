"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_VERSION } from "@/lib/version";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      toast.success("Signed in");
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="text-[11px] tracking-[0.18em] text-teal-300/80 uppercase">
        Sightglass {APP_VERSION}
      </p>
      <h1 className="mt-1 text-2xl font-semibold">Sign in</h1>
      <p className="mt-2 mb-6 text-sm text-white/55">
        Helm account. Lives on this box. Online viewing later uses the same login
        against this Helm URL.
      </p>
      <Label>Email</Label>
      <Input className="mt-1 mb-3" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Label>Password</Label>
      <Input
        className="mt-1 mb-4"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button className="h-11 w-full" disabled={busy} onClick={() => void submit()}>
        {busy ? "Signing in…" : "Sign in"}
      </Button>
      <Link href="/register" className="mt-4 block text-center text-sm text-teal-200">
        Create a Helm account
      </Link>
      <Link href="/demo" className="mt-2 block text-center text-sm text-white/45">
        No hardware? Load a demo rack
      </Link>
    </div>
  );
}
