# Demo kits (alpha shopping lists)

These are **buy lists for assembling one Sightglass and one Helm** so you can demo when glass lands. They are not a store, not MAP, and not what a customer sees at checkout.

Street MAP later stays in [go-to-market.md](go-to-market.md): Sightglass **$149**, Helm **$149**. Parts below are garage COGS.

Listings rotate. Search the exact SKU if a link goes stale. Same lists render on the Hub at `/kits`.

Version: **0.1.1-alpha**.

---

## Sightglass (~$40–55 parts)

| Part | Why | Search | Shop |
|---|---|---|---|
| ESP32-S3 4" 480×480 (Guition / Sunton **4848S040**, no relay) | The screen. Factory model **ESP32-4848S040C_I**. Not on Amazon. On AliExpress pick **no relay / without relay / Type-C only** — never 1-way, 3-way, 86-box, or AC 110/220. | `ESP32-S3-4848S040 no relay` | [AliExpress search](https://www.aliexpress.com/w/wholesale-ESP32-S3-4848S040.html) · [listing A](https://www.aliexpress.com/item/1005006494689995.html) · [listing B](https://www.aliexpress.com/item/1005006335587633.html) · [GUITION store](https://www.aliexpress.com/store/1102410813) · [factory page](https://www.guition.com/esp32-display-module/4-inch-esp32s3-display-module) |
| Waveshare **ESP32-S3-Touch-LCD-4 V2** | Amazon Prime alpha glass. Same 4" 480×480, no mains relays. Different PCB (IO expander) — OTA/SoftAP work; LVGL needs a Waveshare profile. | `Waveshare ESP32-S3-Touch-LCD-4 V2` | [Amazon B0F221MSH7](https://www.amazon.com/Waveshare-ESP32-S3-4inchCapacitive-Dual-Core-Bluetooth/dp/B0F221MSH7) · [Waveshare official](https://www.waveshare.com/esp32-s3-touch-lcd-4.htm) |
| USB-C cable 1.5 m | Panel power. | `USB-C cable 5ft 1.5m` | [Amazon](https://www.amazon.com/s?k=usb-c+cable+5ft) |
| 5V 2A USB-C brick | InSight does not include a PSU; we do the same. Any 10 W brick. | `USB-C 5V 2A power adapter` | [Amazon](https://www.amazon.com/s?k=usb-c+5v+2a+power+adapter) |

Print the stand / bezel / mag plate here in PETG or ASA. Flash with `panel/scripts/flash-panel.sh` — customers never open PlatformIO.

Do **not** put a Raspberry Pi in the panel.

---

## Helm (~$80–100 parts)

| Part | Why | Search | Shop |
|---|---|---|---|
| Raspberry Pi 5 **1GB** (or 2GB if 1GB is gone) | Helm brain. Official $45 for 1GB. **Not a Pi Zero** — 512 MB is too small. | `Raspberry Pi 5 1GB` | [raspberrypi.com](https://www.raspberrypi.com/products/raspberry-pi-5/) |
| Official **27W USB-C** PSU | Pi 5 browns out on cheap bricks. | `Raspberry Pi 27W USB-C Power Supply` | [raspberrypi.com](https://www.raspberrypi.com/products/27w-power-supply/) |
| 32 GB high-endurance microSD | Helm writes history. Endurance cards fail less than generic SD. | `SanDisk High Endurance 32GB microSD` | [Amazon](https://www.amazon.com/s?k=sandisk+high+endurance+32gb+microsd) |
| Pi 5 case | Black box. Official or any vented Pi 5 case until we print our own. | `Raspberry Pi 5 official case` | [raspberrypi.com](https://www.raspberrypi.com/products/raspberry-pi-5-case/) |

Flash Raspberry Pi OS Lite 64-bit with Imager, then run `hub-image/install.sh` once. SSH is disabled after that. See [../hub-image/README.md](../hub-image/README.md).

---

## What you do vs what a customer does

| You (alpha / factory) | Customer |
|---|---|
| Buy these SKUs | Buy a finished Sightglass or Helm |
| `flash-panel.sh` / `install.sh` | Plug in USB-C |
| Keep a soak unit with `HELM_KEEP_SSH=1` | Never see Linux |

Online viewing later is this same Helm URL through a tunnel — not a second catalog.
