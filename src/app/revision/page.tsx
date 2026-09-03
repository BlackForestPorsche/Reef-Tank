import { FirmwarePush } from "@/components/firmware-push";
import { RELEASE_NOTES } from "@/lib/release-notes";
import { getVersionInfo } from "@/lib/version";

export default function RevisionPage() {
  const v = getVersionInfo();
  return (
    <div>
      <p className="text-[11px] tracking-[0.18em] text-teal-300/80 uppercase">
        Revision
      </p>
      <h1 className="mt-1 font-mono text-3xl">{v.version}</h1>
      <p className="mt-2 text-sm text-white/55">
        {v.codename} · {v.channel} · released {v.released}
      </p>
      <dl className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/4 px-4 py-4 text-sm">
        <Row label="Revision" value={v.revision} />
        <Row label="Channel" value={v.channel} />
        <Row label="Website" value="Sightglass on Helm :43180" />
        <Row label="Android" value="com.saltyelectronics.sightglass · same API" />
        <Row label="Sightglass FW" value="ESP32-S3 4848S040 + Waveshare 4&quot; V2" />
        <Row label="Helm image" value="Pi OS Lite + install.sh + OTA" />
      </dl>
      <div className="mt-6">
        <FirmwarePush />
      </div>
      <p className="mt-6 text-xs text-white/40">
        Latest notes: {RELEASE_NOTES[0]?.title}. Push Hub or panels from here
        or Setup. Same buttons on Android.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-white/45">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
