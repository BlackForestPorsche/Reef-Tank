# Hardware instructions (alpha 0.1.1)

Salty Electronics · one page per piece. Buy lists stay in [kits.md](kits.md). This file is how you actually power, flash, and pair each SKU.

Customers never see Linux, never open PlatformIO, never SSH. These steps are for **you** (garage / factory). After flash, a customer only plugs in USB-C.

Version: **0.1.1-alpha**.

---

## 0. No hardware yet

Walk the product before any board lands.

1. `npm install && npm run dev`
2. Open [http://127.0.0.1:43180/demo](http://127.0.0.1:43180/demo)
3. **Load demo rack** — fake Helm `HELM-7F2A` plus tank, cabinet, and sump Sightglass
4. Glance, Helm setup (`/hub`), dummy glass (`/panel`)

Same buttons live on the Android app (Sign in → “No hardware? Load a demo rack”).

---

## 1. Laptop Helm (valid until a Pi restocks)

Helm is this Next.js app. A laptop is a legal Helm for alpha.

**What you need**

- This repo
- Node 22+
- The tank LAN (same Wi-Fi as Apex later)

**Do this**

```bash
cd Reef-Tank   # or wherever you cloned
npm install
cp .env.example .env
# optional later: APEX_HOST, APEX_USER, APEX_PASSWORD, HELM_AUTH_SECRET
npm run dev
```

- UI: `http://127.0.0.1:43180` on the laptop
- Phone on the same LAN: `http://<laptop-lan-ip>:43180`
- Android emulator: `http://10.0.2.2:43180`

Create the first Helm account on `/register`. First user is owner. Glance stays public so glass can poll `/api/status` without a token.

Docker instead of `npm run dev`:

```bash
cp .env.example .env
docker compose up --build
```

Same port `43180`. Accounts persist in `./data`.

---

## 2. Helm — Raspberry Pi 5 (or Pi 4 2GB+)

Optional Pro box. History, remote, extra tanks, firmware push. **No Pi in the glass. No Pi Zero. No Yocto.**

**What you need**

| Piece | Why |
|---|---|
| Raspberry Pi 5 **1GB** (or 2GB) | Official $45 for 1GB. Sold-out 5s: a Pi 4 **2GB+** is a valid Helm. $100 for a 2GB Pi 5 is not a fair board price. |
| Official **27W USB-C** PSU | Required on Pi 5. Cheap bricks brown out. |
| 32 GB high-endurance microSD | Helm writes history. |
| Vented Pi 5 case | Black box. |
| Ethernet optional | Same LAN as Apex is enough. |

Watch [rpilocator.com](https://rpilocator.com). Notify PiShop / CanaKit.

**Flash once**

1. Raspberry Pi Imager → **Raspberry Pi OS Lite (64-bit)**.
2. Enable SSH for this one flash only. Hostname `helm` is fine.
3. Write the card. Seat it. Plug the official USB-C PSU.
4. SSH in once and copy this repo:

   ```bash
   scp -r . pi@<helm-lan>:/home/pi/sightglass
   sudo bash /home/pi/sightglass/hub-image/install.sh
   ```

5. The script installs Docker, `helm.service`, SoftAP `Helm-XXXX`, the OTA watcher, writes `/etc/helm-version`, then **disables SSH**.

Factory soak (keep SSH): `sudo HELM_KEEP_SSH=1 bash install.sh`.

**First boot pairing**

- SoftAP `Helm-XXXX` (last four hex of eth/wlan MAC).
- Phone: stay on home Wi-Fi if BLE is up later; for alpha, join Helm Wi-Fi or use the laptop LAN URL.
- Open `http://<helm-lan>:43180` → create account → adopt glass.

If the AP does not come up: phone app pointed at the LAN IP. Details: [hub-image/README.md](../hub-image/README.md).

**Do not**

- Put a Pi in the Sightglass
- Use a Pi Zero (512 MB)
- Start a custom OS

---

## 3. Sightglass — Guition / Sunton 4848S040 (production pin map)

The screen we intend to sell. 4" 480×480, no mains relays.

**Buy the right SKU**

- Factory model **ESP32-4848S040C_I**
- Listing words: **no relay / without relay / Type-C only**
- Skip 1-way, 3-way, 86-box, AC 110/220
- Listings: [AliExpress A](https://www.aliexpress.com/item/1005006494689995.html) · [B](https://www.aliexpress.com/item/1005006335587633.html) · [GUITION store](https://www.aliexpress.com/store/1102410813)

**Power**

- 5V USB-C, **5V 2A brick**, data-capable cable
- No battery in sold units

**Flash (you, not the customer)**

```bash
# USB-C into the glass. UART is usually CH340, not native CDC.
cd panel
./scripts/flash-panel.sh
```

Or from repo root: `./scripts/flash-panel.sh`.

Default PlatformIO env is ArduinoJson-only (SoftAP / poll / OTA compile without LVGL). Glass paint: env `esp32-s3-panel-lvgl`. Pin map: [panel/docs/4848S040.md](../panel/docs/4848S040.md).

**First boot**

1. Plug USB-C. SoftAP `Sightglass-XXXX` (last 4 hex of STA MAC).
2. Join that SSID. Captive portal `http://192.168.4.1`.
3. Enter house Wi-Fi, Helm URL (`http://192.168.1.10:43180` default), optional Apex host.
4. Pairing code is 4 digits from the same MAC. Adopt it on Helm (`/hub`) or the app.
5. Hold GPIO0 ~3 s to re-enter pairing.

Until a board is on the bench, dummy glass is `/panel`.

---

## 4. Sightglass — Waveshare ESP32-S3-Touch-LCD-4 V2 (Amazon Prime alpha)

The board on order this week. Same 4" 480×480 idea. **Not pin-compatible with 4848S040.**

**Buy**

- [Amazon B0F221MSH7](https://www.amazon.com/Waveshare-ESP32-S3-4inchCapacitive-Dual-Core-Bluetooth/dp/B0F221MSH7) ~$45 Prime
- Official: [waveshare.com/esp32-s3-touch-lcd-4.htm](https://www.waveshare.com/esp32-s3-touch-lcd-4.htm)

**Power**

- 5V USB-C, **5V 2A brick + data cable**
- Battery header exists — **leave empty** on sold units. Battery later = demo only, never “tank UPS.”

**What works on first flash vs what needs a second profile**

| Works now | Needs Waveshare pin / IO-expander profile |
|---|---|
| SoftAP `Sightglass-XXXX` | LVGL glance (expect a white screen until that profile) |
| Captive portal | GT911-style touch on this PCB |
| Helm poll + Apex fallback | TCA9554 / CH32 expander GPIO |
| HTTP OTA | |

**When the box lands**

1. Serial + portal first. Confirm SSID and pairing code on USB serial.
2. Do not declare the glass dead if LVGL is white — that is the missing Waveshare profile.
3. I²C on this board is enough for Sightglass Pro (SCD40 + SGP41). Almost no spare raw GPIO.

---

## 5. Sightglass Pro — room sensors

SCD40 (CO₂ / RH / temp) + SGP41 (VOC) on the glass I²C bus.

- Waveshare: use the board I²C. That is enough.
- Guition: same idea once the I²C pins are confirmed on the no-relay SKU.
- Demo tank already fakes room CO₂ so Glance can show the pH story.
- Do not ship Adafruit breakouts in a sold unit.

---

## 6. Neptune Apex (life support stays on Apex)

Sightglass reads **Apex Local** on the LAN. Not Fusion cloud.

1. Helm Setup → **Apex Local** → controller IP (example `192.168.1.50`), user, password.
2. Soak read-only first. Glance must go stale / alarm if Apex is unreachable — never a frozen happy dashboard.
3. Turn **Allow controls** on only after that soak. Feed and outlet writes then need a signed-in Helm account.
4. Feed = hold or two-tap. Apex stays life-support.

Mock / demo source never talks to equipment.

---

## 7. Android phone (Sightglass app)

Native Kotlin Compose. Same Helm API as the website. Not a WebView.

**Build**

```bash
cd android
./gradlew :app:assembleDebug
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`. Open the `android/` folder in Android Studio (API 26+). Application id: `com.saltyelectronics.sightglass`.

**Point it at Helm**

| Where the phone is | Helm URL |
|---|---|
| Emulator, Helm on the same PC | `http://10.0.2.2:43180` |
| Phone on the Pi Helm LAN | `http://<pi-lan>:43180` |
| Phone, Helm on the laptop | `http://<laptop-lan>:43180` |

Same email/password as the website. Demo rack is on the Sign in screen.

---

## 8. Power and cables (every SKU)

| SKU | Power | Notes |
|---|---|---|
| Sightglass (either board) | 5V 2A USB-C brick + data cable | PSU not in the sold box (same as InSight). |
| Helm Pi 5 | Official 27W USB-C | Non-negotiable. |
| Helm Pi 4 | Official USB-C PSU for that Pi | Laptop USB ports are not a Helm supply. |
| Laptop Helm | The laptop | Fine for alpha. |

---

## 9. Livestock rules (all hardware)

- Mock never talks to equipment
- Live writes need Allow controls + signed-in account
- Unreachable Apex = alarm
- Stale UI must never look healthy
- Battery on the Waveshare is not a tank UPS
