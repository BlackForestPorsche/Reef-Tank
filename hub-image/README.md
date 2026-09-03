# Helm image (alpha 0.1.1)

Salty Electronics · optional Pro box for Sightglass.

This folder is what **you** (factory / demo builds) run **once**. After that, re-flash the card if it dies. Do not put a Raspberry Pi in the glass — Helm is the only Pi SKU. Stock Raspberry Pi OS Lite + Docker is enough. Do **not** start Yocto or a custom distro for this.

## Alpha demo units (one script, then black box)

1. Raspberry Pi Imager → **Raspberry Pi OS Lite (64-bit)**.
2. Enable SSH for this one flash only.
3. Set hostname if you want (`helm` is fine).
4. Boot the Pi. SSH in once.
5. Copy this repo onto the card:

   ```bash
   scp -r . pi@<helm>:/home/pi/sightglass
   ```

6. Install:

   ```bash
   sudo bash /home/pi/sightglass/hub-image/install.sh
   ```

7. Wait until the script finishes. It installs Docker, compose, `helm.service`, the SoftAP helper, the **OTA path unit**, writes `/etc/helm-version`, then **stops and disables SSH**.

Factory soak: `sudo HELM_KEEP_SSH=1 bash install.sh`.

## First-boot pairing

SoftAP **`Helm-XXXX`** (last four hex of eth/wlan MAC). `wifi-ap.sh` uses NetworkManager only. If the AP does not come up: Sightglass app on the LAN.

| Path | Role |
|---|---|
| `/opt/helm` | Compose, `.env`, image source |
| `/opt/helm/data` | Accounts, OTA flags, staged `firmware/panel.bin` |
| `/etc/systemd/system/helm.service` | `docker compose up` on boot |
| `/usr/local/lib/helm/update.sh` | Host OTA (app-pushed) |
| `/etc/systemd/system/helm-update.path` | Watches `data/update-request` |
| `/usr/local/lib/helm/wifi-ap.sh` | Best-effort SoftAP |
| `/etc/helm-version` | `0.1.1-alpha` |
