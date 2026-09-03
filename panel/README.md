# Sightglass ESP32 firmware

Salty Electronics tank glass. Target: 4" 480×480 ESP32-S3 (Guition / Sunton 4848S040 no-relay, plus Waveshare ESP32-S3-Touch-LCD-4 V2 as an alpha board).

Customers never open PlatformIO. You flash once with `panel/scripts/flash-panel.sh`. First boot is a SoftAP and a pairing code.

## First boot

1. **No NVS Wi-Fi** — SoftAP `Sightglass-XXXX` (XXXX = last 4 hex digits of the STA MAC). Captive portal at `http://192.168.4.1`. Form + `POST /wifi` JSON (`ssid`, `password`, optional `hub`, `apexHost`). Default Helm URL: `http://192.168.1.10:43180`. Pairing code is 4 decimal digits from the same MAC bytes. Printed on Serial; painted on glass only if `esp32-s3-panel-lvgl` inits.
2. After join, the glass polls Helm `GET /api/status` every 2 s. If Helm is down it may poll Apex `/rest/status` for numbers only — never a frozen happy dashboard.
3. Hold GPIO0 ~3 s to re-enter pairing.

| SoftAP SSID | `Sightglass-XXXX` (last 4 hex of MAC) |

Default PlatformIO env is ArduinoJson-only so factory builds compile without LVGL. Optional env `esp32-s3-panel-lvgl` paints pairing + glance on 4848S040 glass.

Until a board lands, the dummy firmware is the website `/panel`.
