# Sightglass

Always-on reef glance from **Salty Electronics**: **Sightglass** on the tank, the **Sightglass** phone app, and optional **Helm** in the cabinet.

Built for a Neptune Apex (Apex Local on your LAN — not Fusion cloud). Demo mode seeds a fake Helm and Sightglass units so you can walk the product before any board lands.

**Version: 0.1.1-alpha** (“First glass”). Release notes live at `/notes`. Revision at `/revision`. Same payload at `GET /api/version`.

## What you get in this slice

- LAN website: glance, feed A–D (hold or click twice), outlets Off/Auto/On, AI lights, Apex setup
- Helm accounts (SQLite on the box): register, login, session cookie + bearer token
- Native Kotlin / Compose Android client against the same API
- Demo mode: `/demo` and the Android Demo screen add fake Helm + Sightglass hardware
- Demo kit shopping lists (`/kits`, [docs/kits.md](docs/kits.md))
- Per-SKU hardware instructions (`/hardware`, [docs/hardware.md](docs/hardware.md))
- Dummy unboxing: [Helm setup](/hub) and [Sightglass](/panel)
- Helm installer (`hub-image/install.sh`) — Imager Lite, then black box
- ESP32 SoftAP pairing firmware (`panel/`) + `panel/scripts/flash-panel.sh`
- App-pushed firmware: Helm Docker rebuild on the Pi, ESP32 HTTP OTA from staged `data/firmware/panel.bin`

Sightglass is the product. Helm is not required for a single tank on home Wi-Fi. Run Helm on a Pi when you want history, remote alerts, or more than one tank.

Customers never see Linux, never open PlatformIO, never SSH.

## Run the website locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43180](http://127.0.0.1:43180). Start on **Demo tank**.

Create a Helm account on `/register` (first user is owner). Feed and outlet writes require that session. Glance stays readable so Sightglass units can poll `/api/status` without a token.

No hardware: [Demo rack](http://127.0.0.1:43180/demo), [Helm](http://127.0.0.1:43180/hub), [Sightglass](http://127.0.0.1:43180/panel).

When you are ready for the real Apex: Setup → Apex Local → controller IP, then turn **Allow controls** on only after a read-only soak.

Buy parts: [docs/kits.md](docs/kits.md). Power, flash, and pair: [docs/hardware.md](docs/hardware.md). How we ship and price SKUs: [docs/go-to-market.md](docs/go-to-market.md).

## Android

See [android/README.md](android/README.md). Emulator default Helm URL is `http://10.0.2.2:43180`. On a phone use `http://<helm-lan-ip>:43180`. Same email/password as the website. Application id: `com.saltyelectronics.sightglass`.

```bash
cd android
./gradlew :app:assembleDebug
```

## Helm (optional Pro)

```bash
cp .env.example .env
# optional: APEX_HOST, APEX_USER, APEX_PASSWORD, HELM_AUTH_SECRET
docker compose up --build
```

Same UI on port `43180`. Accounts persist in `./data`.

For a real Pi: Raspberry Pi Imager → **Lite 64-bit** → once, `sudo bash hub-image/install.sh`. SSH is then disabled. Details: [hub-image/README.md](hub-image/README.md).

Do not start a custom OS for this.

## Sightglass (ESP32)

See [panel/README.md](panel/README.md). Hardware target is a 4" 480×480 ESP32-S3 (Guition / Sunton 4848S040, no-relay). You flash with `panel/scripts/flash-panel.sh`. First boot SoftAP is `Sightglass-XXXX`. Helm SoftAP is `Helm-XXXX`.

Until glass lands, the dummy firmware is `/panel`.

## Online later

Open this same Helm URL from anywhere (Tailscale, Cloudflare Tunnel). Same accounts. No second user database in this slice.

## Livestock safety

- Mock source never talks to equipment
- Live writes require **Allow controls** and a signed-in Helm account
- Feed starts are hold-to-confirm (or two taps)
- Unreachable Apex is an alarm, not a frozen happy dashboard
- Stale UI must never look healthy

## Clone this repo

GitHub (canonical): [github.com/BlackForestPorsche/Reef-Tank](https://github.com/BlackForestPorsche/Reef-Tank)

```bash
git clone https://github.com/BlackForestPorsche/Reef-Tank.git
cd Reef-Tank
npm install
npm run dev
```

Also on Origin (private): [black-forest-automotive/sightglass](https://cursor.com/codebase/black-forest-automotive/sightglass). Visibility is private; change that in settings on that page.

Origin CLI is macOS, Linux, and WSL only — not PowerShell. On Windows, run this in WSL:

```bash
# Run in WSL (Origin CLI is not available in PowerShell)
# Install the Origin CLI
curl -fsSL https://downloads.cursor.com/origin/install.sh | sh

# Sign in (also sets up git credentials)
origin auth login

# Clone the repository
origin repo clone black-forest-automotive/sightglass
```

If `origin` is not found after install, persist `~/.local/bin` on PATH in WSL (bash):

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

Origin CLI docs: [cursor.com/docs/origin/cli](https://cursor.com/docs/origin/cli)

## Repo

| Path | Role |
|---|---|
| `src/app` | Sightglass website, kits, notes, revision, dummy Helm/glass |
| `src/server` | Helm, mock Apex, live Apex, SQLite accounts |
| `android/` | Kotlin Compose pocket client |
| `panel/` | Sightglass ESP32 firmware |
| `hub-image/` | Pi Imager + install.sh |
| `docs/kits.md` | Demo BOM buy lists |
| `docs/hardware.md` | Per-SKU power, flash, and pair steps |
| `docs/go-to-market.md` | Sell prices |
| `fixtures/` | Captured Apex JSON |
| `docker-compose.yml` | Pi / HexOS Helm |
