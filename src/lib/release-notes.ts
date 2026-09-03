export type ReleaseNote = {
  version: string;
  date: string;
  title: string;
  highlights: string[];
};

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: "0.1.1-alpha",
    date: "2026-09-02",
    title: "First glass",
    highlights: [
      "Sightglass website on Helm with demo reef, Apex Local adapter, feed and outlets.",
      "Dummy Helm unboxing: Imager, plug in, pair, Wi-Fi, account, adopt Sightglass units.",
      "Dummy Sightglass 4\" firmware at /panel for pairing and glance.",
      "Demo mode: seed fake Helm + Sightglass hardware from the site or the Android app.",
      "Demo kit shopping lists for a base Sightglass and Helm so hardware can be ordered.",
      "Helm accounts: register, login, session cookie and bearer token for Android.",
      "Native Android Sightglass client (alpha) against the same LAN API.",
      "Helm install script and Sightglass pairing firmware for when boards land.",
      "App-pushed firmware: Helm Docker rebuild on the Pi, ESP32 HTTP OTA from staged panel.bin.",
    ],
  },
];
