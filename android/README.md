# Sightglass Android

Native Kotlin Jetpack Compose client for Helm. Same Helm account and LAN API as the website. Alpha `0.1.1-alpha` (versionName / versionCode 11). Application id: `com.saltyelectronics.sightglass`.

## Open in Android Studio

1. Open the `android/` folder as a Gradle project (not the repo root).
2. Let Android Studio sync the Gradle wrapper (8.9) and the Android Gradle Plugin 8.7.3.
3. Use a device or emulator with API 26+.

## Build

From this directory:

```bash
./gradlew assembleDebug
```

The debug APK lands at `app/build/outputs/apk/debug/app-debug.apk`.

## Point the app at Helm

Helm listens on port **43180**.

| Where you run the phone | Helm URL |
|---|---|
| Android emulator, Helm on the same machine | `http://10.0.2.2:43180` (default) |
| Physical phone on the same LAN as a Pi Helm | `http://<pi-lan>:43180` |
| Physical phone, Helm on your laptop | `http://<laptop-lan>:43180` |

Sign in (or create the first Helm owner account) with the same email and password as the website. The token stays on the phone.

## Demo mode

On Sign in, tap **No hardware? Load a demo rack**. That seeds a fake Helm (`HELM-7F2A`) and three Sightglass units through `POST /api/demo`. More → Demo hardware can add extra glass or clear the rack. Glance then shows the demo Helm card.

## What this client does

- Glance — huge temp / pH / salinity / alk, Live / Stale / Offline chip, alerts, feed banner
- Feed — channels A–D, two-tap confirm, cancel while a cycle is running
- Outlets — Off / Auto / On, confirm before forcing On
- Lights — read-only AI channels
- Setup — Helm URL, signed-in email, logout, firmware push, version
- Demo — fake Helm + Sightglass hardware
- About — release notes and revision from `GET /api/version`

No WebView. If Helm is unreachable, Glance says so instead of painting a healthy tank.
