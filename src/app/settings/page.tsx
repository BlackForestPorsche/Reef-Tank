"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { LoadingGlance, ScreenHeader } from "@/components/status-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FirmwarePush } from "@/components/firmware-push";
import { AdoptGlass } from "@/components/adopt-glass";
import { HelmOnline } from "@/components/helm-online";
import { APP_VERSION } from "@/lib/version";
import { useSettings, type PublicSettings } from "@/lib/use-tank";
import { useTank } from "@/lib/use-tank";
import type { DataSource, HubSettings } from "@/server/types";

export default function SettingsPage() {
  const { status } = useTank(5000);
  const { settings, save } = useSettings();

  return (
    <div>
      <ScreenHeader status={status} kicker="Setup" />
      {!settings ? <LoadingGlance /> : <SettingsForm settings={settings} save={save} />}
    </div>
  );
}

function SettingsForm({
  settings,
  save,
}: {
  settings: PublicSettings;
  save: (patch: Partial<HubSettings>) => Promise<PublicSettings>;
}) {
  const [tankName, setTankName] = useState(settings.tankName);
  const [source, setSource] = useState<DataSource>(settings.source);
  const [apexHost, setApexHost] = useState(settings.apexHost);
  const [apexUser, setApexUser] = useState(settings.apexUser);
  const [apexPassword, setApexPassword] = useState("");
  const [controlsEnabled, setControlsEnabled] = useState(settings.controlsEnabled);
  const [saving, setSaving] = useState(false);

  async function onSave() {
    setSaving(true);
    try {
      await save({
        tankName,
        source,
        apexHost,
        apexUser,
        apexPassword,
        controlsEnabled,
      });
      toast.success("Saved. Polling the new source.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4">
      <Field label="Tank name">
        <Input value={tankName} onChange={(e) => setTankName(e.target.value)} />
      </Field>

      <div>
        <Label className="mb-2 block">Data source</Label>
        <div className="grid grid-cols-2 gap-2">
          <SourceCard
            active={source === "mock"}
            title="Demo tank"
            detail="Safe. No livestock."
            onClick={() => setSource("mock")}
          />
          <SourceCard
            active={source === "apex"}
            title="Apex Local"
            detail="Same LAN as the controller."
            onClick={() => setSource("apex")}
          />
        </div>
      </div>

      {source === "apex" ? (
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/4 p-4">
          <Field label="Apex address">
            <Input
              placeholder="192.168.1.50"
              value={apexHost}
              onChange={(e) => setApexHost(e.target.value)}
            />
          </Field>
          <Field label="Username">
            <Input value={apexUser} onChange={(e) => setApexUser(e.target.value)} />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              placeholder={settings.apexPasswordSet ? "Stored on hub" : "Apex password"}
              value={apexPassword}
              onChange={(e) => setApexPassword(e.target.value)}
            />
          </Field>
        </div>
      ) : null}

      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/4 px-4 py-3">
        <div>
          <div className="text-sm font-medium">Allow controls</div>
          <div className="text-xs text-white/45">
            Feed and outlet writes. Leave off until you trust the live Apex path.
          </div>
        </div>
        <Switch checked={controlsEnabled} onCheckedChange={setControlsEnabled} />
      </div>

      <Button className="h-11 w-full" onClick={() => void onSave()} disabled={saving}>
        {saving ? "Saving…" : "Save connection"}
      </Button>

      <AccountCard />

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/4 px-4 py-4">
        <h2 className="mb-2 text-sm font-medium">Add Sightglass</h2>
        <AdoptGlass />
      </section>

      <div className="mt-8">
        <HelmOnline />
      </div>

      <div className="mt-8">
        <FirmwarePush />
      </div>

      <section className="mt-8 space-y-3">
        <h2 className="text-sm tracking-widest text-white/40 uppercase">Alpha</h2>
        <div className="grid grid-cols-2 gap-2">
          <SetupLink href="/demo" label="Demo hardware" detail="Fake Helm + Sightglass" />
          <SetupLink href="/android" label="Android preview" detail="Phone frame of the Compose app" />
          <SetupLink href="/kits" label="Demo kits" detail="Buy lists for Sightglass + Helm" />
          <SetupLink href="/hardware" label="Hardware" detail="Power, flash, and pair each SKU" />
          <SetupLink href="/notes" label="Release notes" detail={APP_VERSION} />
          <SetupLink href="/revision" label="Revision" detail="First glass" />
          <SetupLink href="/login" label="Sign in" detail="Helm account" />
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-sm tracking-widest text-white/40 uppercase">Dummy unboxing</h2>
        <div className="rounded-2xl border border-white/8 bg-white/4 p-4 text-sm leading-relaxed text-white/70">
          <p>
            Walk the customer path with no Pi and no glass. Same steps they will
            get: flash (Imager, not Linux), plug in, pair, Wi-Fi, account, adopt
            Sightglass units.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <a
              href="/hub"
              className="rounded-xl border border-teal-300/30 bg-teal-400/10 px-3 py-3 text-center text-teal-50"
            >
              Helm setup
            </a>
            <a
              href="/panel"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center"
            >
              Sightglass
            </a>
          </div>
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-sm tracking-widest text-white/40 uppercase">How this ships</h2>
        <div className="rounded-2xl border border-white/8 bg-white/4 p-4 text-sm leading-relaxed text-white/70">
          <p>
            <span className="font-medium text-white">Sightglass</span> — the product.
            USB-C, 4&quot; square, talks Apex on Wi-Fi even if Helm is off.
          </p>
          <p className="mt-3">
            <span className="font-medium text-white">Sightglass app</span> — setup,
            layouts, and control while you are on the tank’s LAN.
          </p>
          <p className="mt-3">
            <span className="font-medium text-white">Helm</span> — optional.
            This same Docker app on a Raspberry Pi (or HexOS) for history,
            extra tanks, and Helm online (alerts away from home — included,
            not a subscription). You do not put a Pi in the glass.
          </p>
        </div>
      </section>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function AccountCard() {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/auth/me", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return { user: null };
        return (await res.json()) as { user: { email: string } | null };
      })
      .then((data) => {
        if (cancelled) return;
        setEmail(data.user?.email ?? null);
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setEmail(null);
    toast.success("Signed out");
  }

  return (
    <section className="mt-8 space-y-3">
      <h2 className="text-sm tracking-widest text-white/40 uppercase">Helm account</h2>
      <div className="rounded-2xl border border-white/10 bg-white/4 px-4 py-4 text-sm">
        {!ready ? (
          <p className="text-white/45">Checking session…</p>
        ) : email ? (
          <>
            <div className="font-medium">{email}</div>
            <p className="mt-1 text-xs text-white/45">
              Lives on this Helm. Same login as the Sightglass app. Helm online
              queues alerts here; a relay later delivers them off the LAN.
            </p>
            <Button className="mt-3 h-10 w-full" variant="outline" onClick={() => void signOut()}>
              Sign out
            </Button>
          </>
        ) : (
          <>
            <p className="text-white/65">
              Sign in to start feed cycles and change outlets. Glance stays
              readable so Sightglass units can poll without a token.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                href="/login"
                className="rounded-xl border border-teal-300/30 bg-teal-400/10 px-3 py-2 text-center text-teal-50"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center"
              >
                Create account
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function SetupLink({
  href,
  label,
  detail,
}: {
  href: string;
  label: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/10 bg-white/4 px-3 py-3"
    >
      <div className="text-sm font-medium">{label}</div>
      <div className="text-[11px] text-white/45">{detail}</div>
    </Link>
  );
}

function SourceCard({
  active,
  title,
  detail,
  onClick,
}: {
  active: boolean;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-2xl border border-teal-300/40 bg-teal-400/10 px-3 py-3 text-left"
          : "rounded-2xl border border-white/10 bg-white/4 px-3 py-3 text-left"
      }
    >
      <div className="text-sm font-medium">{title}</div>
      <div className="text-[11px] text-white/45">{detail}</div>
    </button>
  );
}
