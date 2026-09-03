"use client";

import { useEffect, useState } from "react";
import {
  LayoutGrid,
  Fish,
  Droplets,
  Lightbulb,
  MoreHorizontal,
} from "lucide-react";
import type { DummyPanel, HubProvision } from "@/server/provision-types";
import type { TankStatus } from "@/server/types";

type Tab = "glance" | "feed" | "outlets" | "lights" | "more" | "demo" | "login";

const TABS: { id: Tab; label: string; icon: typeof LayoutGrid }[] = [
  { id: "glance", label: "Glance", icon: LayoutGrid },
  { id: "feed", label: "Feed", icon: Fish },
  { id: "outlets", label: "Outlets", icon: Droplets },
  { id: "lights", label: "Lights", icon: Lightbulb },
  { id: "more", label: "More", icon: MoreHorizontal },
];

export default function AndroidPreviewPage() {
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("demo@salty.local");
  const [password, setPassword] = useState("demopass12");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [status, setStatus] = useState<TankStatus | null>(null);
  const [provision, setProvision] = useState<HubProvision | null>(null);

  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    async function pull() {
      const [s, d] = await Promise.all([
        fetch("/api/status", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/demo", { cache: "no-store" }).then((r) => r.json()),
      ]);
      if (cancelled) return;
      setStatus(s as TankStatus);
      setProvision((d as { provision: HubProvision }).provision);
    }
    void pull();
    const id = window.setInterval(() => void pull(), 2000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [signedIn]);

  async function seedAndEnter() {
    setBusy(true);
    setError(null);
    try {
      await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed" }),
      });
      const reg = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!reg.ok) {
        const login = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!login.ok) {
          const body = await login.json();
          throw new Error(body.error ?? "Sign in failed");
        }
      }
      setSignedIn(true);
      setTab("demo");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function login() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Sign in failed");
      setSignedIn(true);
      setTab("glance");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function demo(action: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      setProvision(data.provision as HubProvision);
    } finally {
      setBusy(false);
    }
  }

  const showBar = signedIn && tab !== "login";

  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-950 px-4 py-6">
      <p className="mb-3 text-center text-[11px] tracking-widest text-white/35 uppercase">
        Android Sightglass · same Helm API · no emulator in this environment
      </p>
      <div className="relative w-full max-w-[390px] overflow-hidden rounded-[2.4rem] border-[10px] border-zinc-800 bg-[#07131c] shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
        <div className="flex items-center justify-between px-6 pt-3 text-[10px] text-white/45">
          <span>9:41</span>
          <span className="h-4 w-24 rounded-full bg-black" />
          <span>5G · 84%</span>
        </div>
        <div className="h-[640px] overflow-y-auto px-4 pb-2 pt-3">
          {tab === "login" || !signedIn ? (
            <LoginFace
              email={email}
              password={password}
              busy={busy}
              error={error}
              onEmail={setEmail}
              onPassword={setPassword}
              onLogin={() => void login()}
              onDemo={() => void seedAndEnter()}
            />
          ) : tab === "demo" ? (
            <DemoFace
              provision={provision}
              busy={busy}
              onSeed={() => void demo("seed")}
              onHelm={() => void demo("add-helm")}
              onGlass={() => void demo("add-sightglass")}
              onClear={() => void demo("clear")}
            />
          ) : tab === "more" ? (
            <MoreFace email={email} onDemo={() => setTab("demo")} />
          ) : (
            <GlanceLike tab={tab} status={status} />
          )}
        </div>
        {showBar ? (
          <div className="grid grid-cols-5 border-t border-white/10 bg-[#07131c] px-1 pb-3 pt-2">
            {TABS.map((item) => {
              const active =
                item.id === "more"
                  ? tab === "more" || tab === "demo"
                  : tab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`flex flex-col items-center gap-1 py-1 text-[10px] ${
                    active ? "text-teal-200" : "text-white/40"
                  }`}
                >
                  <Icon className="size-5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
      <p className="mt-4 max-w-[390px] text-center text-xs text-white/40">
        This is the Kotlin Compose app, drawn in a phone frame. On a real phone
        you open the <code>android/</code> folder in Android Studio and{" "}
        <code>./gradlew :app:assembleDebug</code>. Same buttons: Sign in → No
        hardware? Load a demo rack.
      </p>
    </div>
  );
}

function LoginFace({
  email,
  password,
  busy,
  error,
  onEmail,
  onPassword,
  onLogin,
  onDemo,
}: {
  email: string;
  password: string;
  busy: boolean;
  error: string | null;
  onEmail: (v: string) => void;
  onPassword: (v: string) => void;
  onLogin: () => void;
  onDemo: () => void;
}) {
  return (
    <div className="pt-6">
      <p className="text-[11px] font-medium tracking-[0.2em] text-teal-300/80 uppercase">
        Sightglass 0.1.1-alpha
      </p>
      <h1 className="mt-2 text-[28px] font-semibold text-[#F0FBFF]">Sign in</h1>
      <p className="mt-2 text-sm text-[#8BA3B0]">
        Helm account. Lives on this box. Same login as the website.
      </p>
      <Field label="Helm URL" value="http://10.0.2.2:43180" readOnly />
      <p className="mt-1 text-[11px] text-[#8BA3B0]">
        Emulator default is 10.0.2.2. On a phone use http://192.168.x.x:43180
      </p>
      <Field label="Email" value={email} onChange={onEmail} />
      <Field label="Password" value={password} onChange={onPassword} password />
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      <button
        type="button"
        disabled={busy}
        onClick={onLogin}
        className="mt-5 h-11 w-full rounded-xl bg-teal-400/20 text-sm font-medium text-teal-50"
      >
        {busy ? "Signing in…" : "Log in"}
      </button>
      <button type="button" className="mt-3 w-full text-sm text-teal-200">
        Create a Helm account
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onDemo}
        className="mt-2 w-full text-sm text-[#8BA3B0]"
      >
        No hardware? Load a demo rack
      </button>
    </div>
  );
}

function DemoFace({
  provision,
  busy,
  onSeed,
  onHelm,
  onGlass,
  onClear,
}: {
  provision: HubProvision | null;
  busy: boolean;
  onSeed: () => void;
  onHelm: () => void;
  onGlass: () => void;
  onClear: () => void;
}) {
  const glasses = provision?.panels ?? [];
  return (
    <div>
      <p className="text-[11px] font-medium tracking-[0.2em] text-teal-300/80 uppercase">
        Salty Electronics · Demo
      </p>
      <h1 className="mt-1 text-[26px] font-semibold text-[#F0FBFF]">Fake hardware</h1>
      <p className="mt-2 text-sm text-[#8BA3B0]">
        No Pi and no glass required. Seed a Helm and Sightglass units, then walk
        Glance, adopt, and firmware push. Same API as the website.
      </p>
      <Btn onClick={onSeed}>{busy ? "Working…" : "Load demo rack"}</Btn>
      <Btn onClick={onHelm}>Add fake Helm</Btn>
      <Btn onClick={onGlass}>Add Sightglass</Btn>
      <Btn onClick={onClear}>Clear</Btn>
      <div className="mt-4 rounded-2xl bg-white/[0.04] px-4 py-3">
        <div className="text-[11px] tracking-widest text-white/40 uppercase">Helm</div>
        {provision?.provisioned ? (
          <>
            <div className="mt-1 font-medium">
              {provision.serial} · {provision.ssid}
            </div>
            <div className="text-xs text-[#8BA3B0]">
              {provision.accountEmail} · SoftAP Helm-{provision.serial.slice(-4)}
            </div>
          </>
        ) : (
          <p className="mt-1 text-sm text-[#8BA3B0]">No Helm in demo yet.</p>
        )}
      </div>
      <div className="mt-3 space-y-2">
        {glasses.map((p) => (
          <Glass key={p.id} panel={p} />
        ))}
      </div>
    </div>
  );
}

function MoreFace({ email, onDemo }: { email: string; onDemo: () => void }) {
  return (
    <div>
      <p className="text-[11px] tracking-widest text-white/40 uppercase">More</p>
      <p className="mt-2 text-sm text-[#8BA3B0]">{email}</p>
      <button
        type="button"
        onClick={onDemo}
        className="mt-4 w-full rounded-2xl bg-white/[0.04] px-4 py-3 text-left"
      >
        <div className="font-medium">Demo hardware</div>
        <div className="text-xs text-[#8BA3B0]">Fake Helm + Sightglass</div>
      </button>
      <div className="mt-3 rounded-2xl bg-white/[0.04] px-4 py-3">
        <div className="font-medium">Native console</div>
        <p className="mt-1 text-sm text-[#8BA3B0]">
          Jetpack Compose talking to the Helm API. This is not a wrapped PWA.
        </p>
      </div>
    </div>
  );
}

function GlanceLike({ tab, status }: { tab: Tab; status: TankStatus | null }) {
  if (!status) {
    return <p className="pt-8 text-sm text-[#8BA3B0]">Talking to Helm…</p>;
  }
  if (tab === "feed") {
    return (
      <div>
        <Kicker>Feed</Kicker>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(["A", "B", "C", "D"] as const).map((ch) => (
            <div
              key={ch}
              className={
                status.feed.active === ch
                  ? "rounded-2xl bg-teal-400/20 py-8 text-center text-2xl"
                  : "rounded-2xl bg-white/[0.04] py-8 text-center text-2xl text-white/70"
              }
            >
              {ch}
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-sm text-[#8BA3B0]">
          Two-tap confirm on the real app. Hardware is hold.
        </p>
      </div>
    );
  }
  if (tab === "outlets") {
    return (
      <div>
        <Kicker>Outlets</Kicker>
        <div className="mt-3 space-y-2">
          {status.outlets.map((o) => (
            <div key={o.id} className="rounded-2xl bg-white/[0.04] px-4 py-3">
              <div className="font-medium">{o.name}</div>
              <div className="text-xs capitalize text-[#8BA3B0]">
                {o.mode} · {o.running ? "running" : "off"}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (tab === "lights") {
    return (
      <div>
        <Kicker>Lights</Kicker>
        <div className="mt-3 space-y-2">
          {status.lights.map((l) => (
            <div key={l.id} className="rounded-2xl bg-white/[0.04] px-4 py-3">
              <div className="font-medium">{l.name}</div>
              <div className="text-xs text-[#8BA3B0]">
                {l.intensity}% · {l.schedule}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  const featured = ["temp", "ph", "salinity", "alk"]
    .map((k) => status.probes.find((p) => p.kind === k))
    .filter(Boolean);
  return (
    <div>
      <Kicker>Glance</Kicker>
      <div className="mt-1 text-xl font-semibold">{status.tankName}</div>
      <div className="text-sm text-teal-300">
        {status.connected && !status.stale ? "Live" : "Stale"}
      </div>
      {status.hub.provisioned ? (
        <div className="mt-3 rounded-2xl bg-white/[0.04] px-4 py-3 text-sm">
          <div className="text-[11px] tracking-widest text-white/40 uppercase">
            {status.hub.dummy ? "Demo Helm" : "Helm"}
          </div>
          <div className="font-medium">
            {status.hub.accountEmail ?? status.hub.serial} · {status.hub.ssid}
          </div>
          <div className="text-xs text-[#8BA3B0]">
            {status.hub.panelsAdopted} Sightglass units adopted
          </div>
        </div>
      ) : null}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {featured.map((p) =>
          p ? (
            <div key={p.id} className="rounded-2xl bg-white/[0.04] px-3 py-3">
              <div className="text-[10px] tracking-widest text-white/40 uppercase">
                {p.name}
              </div>
              <div className="font-mono text-3xl text-teal-100">
                {p.display}
                <span className="ml-1 font-sans text-xs text-white/35">{p.unit}</span>
              </div>
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}

function Kicker({ children }: { children: string }) {
  return (
    <p className="text-[11px] tracking-widest text-teal-300/80 uppercase">{children}</p>
  );
}

function Field({
  label,
  value,
  onChange,
  password,
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  password?: boolean;
  readOnly?: boolean;
}) {
  return (
    <label className="mt-3 block">
      <span className="text-[11px] text-[#8BA3B0]">{label}</span>
      <input
        readOnly={readOnly}
        type={password ? "password" : "text"}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-[#F0FBFF] outline-none"
      />
    </label>
  );
}

function Btn({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 h-11 w-full rounded-xl bg-teal-400/15 text-sm text-teal-50"
    >
      {children}
    </button>
  );
}

function Glass({ panel }: { panel: DummyPanel }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] px-4 py-3">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{panel.name}</span>
        <span className="text-[11px] text-teal-200">
          {panel.adopted ? "Adopted" : panel.pairing ? "Pairing" : "Idle"}
        </span>
      </div>
      <div className="mt-1 text-xs text-[#8BA3B0]">
        {panel.serial} · code {panel.pairingCode}
      </div>
    </div>
  );
}
