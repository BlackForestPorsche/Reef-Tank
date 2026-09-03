"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_VERSION } from "@/lib/version";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create account");
      toast.success("Account created. You own this Helm.");
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Register failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="text-[11px] tracking-[0.18em] text-teal-300/80 uppercase">
        Sightglass {APP_VERSION}
      </p>
      <h1 className="mt-1 text-2xl font-semibold">Create account</h1>
      <p className="mt-2 mb-6 text-sm text-white/55">
        First account on a Helm is the owner. Not a Linux user. Password at least
        8 characters.
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
        {busy ? "Creating…" : "Create account"}
      </Button>
      <Link href="/login" className="mt-4 block text-center text-sm text-teal-200">
        Already have an account
      </Link>
    </div>
  );
}
