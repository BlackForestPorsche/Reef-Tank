"use client";

import Link from "next/link";
import { APP_VERSION } from "@/lib/version";

const PANEL = [
  {
    name: "Guition / Sunton ESP32-S3-4848S040 (no relay)",
    why: "The screen we flash. Factory model ESP32-4848S040C_I. Not sold on Amazon. On the listing pick no relay / without relay / Type-C only — skip 1-way, 3-way, 86-box, and any AC 110/220 option.",
    search: "ESP32-S3-4848S040 no relay",
    href: "https://www.aliexpress.com/item/1005006494689995.html",
    shop: "AliExpress",
  },
  {
    name: "Same board — GUITION official store + second listing",
    why: "If the first listing moved: official store, second known item, or wholesale search. Factory page is ESP32-4848S040C_I (display only).",
    search: "GUITION ESP32-4848S040C_I",
    href: "https://www.aliexpress.com/store/1102410813",
    shop: "AliExpress",
  },
  {
    name: "Waveshare ESP32-S3-Touch-LCD-4 V2 (Amazon Prime)",
    why: "Yes for alpha glass: 4\" 480×480, capacitive, no mains relays, ships from Amazon. Different PCB than 4848S040 (IO expander) — SoftAP, Hub poll, and OTA work; LVGL pin map is a second board profile. ~$45.",
    search: "Waveshare ESP32-S3-Touch-LCD-4 V2",
    href: "https://www.amazon.com/Waveshare-ESP32-S3-4inchCapacitive-Dual-Core-Bluetooth/dp/B0F221MSH7",
    shop: "Amazon",
  },
  {
    name: "USB-C cable 1.5 m",
    why: "Panel power. Any decent cable.",
    search: "USB-C cable 5ft 1.5m",
    href: "https://www.amazon.com/s?k=usb-c+cable+5ft",
    shop: "Amazon",
  },
  {
    name: "5V 2A USB-C brick",
    why: "InSight does not include a PSU; we do the same. Any 10W brick.",
    search: "USB-C 5V 2A power adapter",
    href: "https://www.amazon.com/s?k=usb-c+5v+2a+power+adapter",
    shop: "Amazon",
  },
];

const HUB = [
  {
    name: "Raspberry Pi 5 1GB (or 2GB)",
    why: "Hub brain. Official $45 for 1GB. Do not use Pi Zero — 512 MB is too small.",
    search: "Raspberry Pi 5 1GB",
    href: "https://www.raspberrypi.com/products/raspberry-pi-5/",
    shop: "Raspberry Pi",
  },
  {
    name: "Official 27W USB-C PSU",
    why: "Pi 5 is picky. Use the official supply.",
    search: "Raspberry Pi 27W USB-C Power Supply",
    href: "https://www.raspberrypi.com/products/27w-power-supply/",
    shop: "Raspberry Pi",
  },
  {
    name: "32 GB high-endurance microSD",
    why: "Hub writes history. Endurance cards fail less than generic SD.",
    search: "SanDisk High Endurance 32GB microSD",
    href: "https://www.amazon.com/s?k=sandisk+high+endurance+32gb+microsd",
    shop: "Amazon",
  },
  {
    name: "Pi 5 case",
    why: "Black box. Official or any vented Pi 5 case until we print our own.",
    search: "Raspberry Pi 5 official case",
    href: "https://www.raspberrypi.com/products/raspberry-pi-5-case/",
    shop: "Raspberry Pi",
  },
];

export default function KitsPage() {
  return (
    <div>
      <p className="text-[11px] font-medium tracking-[0.18em] text-teal-300/80 uppercase">
        Alpha {APP_VERSION}
      </p>
      <h1 className="mt-1 text-2xl font-semibold">Demo kits</h1>
      <p className="mt-2 mb-6 text-sm text-white/55">
        Parts to assemble one Sightglass and one Helm for your alpha. These are buy
        links for you — not a store. Search the exact SKU if a listing moved.
      </p>
      <Kit title="Sightglass" items={PANEL} />
      <Kit title="Helm" items={HUB} />
      <p className="mt-6 text-xs text-white/40">
        Print the stand in PETG/ASA. Power, flash, and pair steps:{" "}
        <Link href="/hardware" className="text-teal-200">
          Hardware instructions
        </Link>
        . Flash with{" "}
        <code className="text-white/60">panel/scripts/flash-panel.sh</code> and{" "}
        <code className="text-white/60">hub-image/install.sh</code>. MAP later:
        Sightglass $149, Helm $149.
      </p>
      <Link href="/settings" className="mt-4 inline-block text-sm text-teal-200">
        Back to Setup
      </Link>
    </div>
  );
}

function Kit({
  title,
  items,
}: {
  title: string;
  items: typeof PANEL;
}) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-sm tracking-widest text-white/40 uppercase">{title}</h2>
      <div className="space-y-2">
        {items.map((item) => (
          <a
            key={item.name}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className="block rounded-2xl border border-white/10 bg-white/4 px-4 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="font-medium">{item.name}</div>
              <div className="text-[11px] text-teal-200/80">{item.shop}</div>
            </div>
            <div className="mt-1 text-xs text-white/50">{item.why}</div>
            <div className="mt-1 text-[11px] text-white/35">Search: {item.search}</div>
          </a>
        ))}
      </div>
    </section>
  );
}
