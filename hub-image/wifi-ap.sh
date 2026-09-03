#!/usr/bin/env bash
# Helm first-boot SoftAP (best effort).
# SSID: Helm-XXXX  — XXXX = last 4 hex digits of eth/wlan MAC.
set -euo pipefail

LOG_TAG="helm-ap"
FALLBACK="pairing: use Sightglass app on LAN for alpha if AP not up"
CON_NAME="helm-ap"

log() {
  echo "${LOG_TAG}: $*"
  logger -t "${LOG_TAG}" "$*" 2>/dev/null || true
}

fallback() {
  log "${FALLBACK}"
  if [[ -n "${1:-}" ]]; then
    log "reason: $*"
  fi
  exit 0
}

mac_suffix() {
  local iface mac compact
  for iface in wlan0 eth0 end0 enp1s0; do
    if [[ -r "/sys/class/net/${iface}/address" ]]; then
      mac="$(tr -d '[:space:]' <"/sys/class/net/${iface}/address")"
      compact="${mac//:/}"
      compact="${compact//-/}"
      if ((${#compact} >= 4)); then
        printf '%s\n' "${compact: -4}" | tr -d '[:lower:]' | tr '[:lower:]' '[:upper:]'
        return 0
      fi
    fi
  done
  return 1
}

if ! command -v nmcli >/dev/null 2>&1; then
  fallback "nmcli not installed"
fi

if ! nmcli -t -f RUNNING general >/dev/null 2>&1; then
  fallback "NetworkManager is not running"
fi

suffix="$(mac_suffix || true)"
if [[ -z "${suffix}" ]]; then
  fallback "no MAC found"
fi

SSID="Helm-${suffix}"
WIFI_DEV=""
for iface in wlan0 wlan1; do
  if [[ -d "/sys/class/net/${iface}" ]]; then
    WIFI_DEV="${iface}"
    break
  fi
done
if [[ -z "${WIFI_DEV}" ]]; then
  fallback "no wlan interface"
fi

state="$(nmcli -t -f DEVICE,STATE,CONNECTION device status 2>/dev/null | awk -F: -v d="${WIFI_DEV}" '$1==d {print $2}' || true)"
if [[ "${state}" == "connected" ]]; then
  current="$(nmcli -t -f DEVICE,CONNECTION device status 2>/dev/null | awk -F: -v d="${WIFI_DEV}" '$1==d {print $2}' || true)"
  if [[ "${current}" != "${CON_NAME}" ]]; then
    fallback "${WIFI_DEV} already on LAN (${current:-connected})"
  fi
fi

if nmcli -t -f GENERAL.STATE connection show "${CON_NAME}" >/dev/null 2>&1; then
  if nmcli connection up "${CON_NAME}" >/dev/null 2>&1; then
    log "SoftAP up: ${SSID}"
    exit 0
  fi
fi

nmcli connection delete "${CON_NAME}" >/dev/null 2>&1 || true
if ! nmcli connection add \
  type wifi \
  ifname "${WIFI_DEV}" \
  con-name "${CON_NAME}" \
  autoconnect yes \
  ssid "${SSID}" \
  802-11-wireless.mode ap \
  802-11-wireless.band bg \
  ipv4.method shared \
  ipv6.method ignore >/dev/null 2>&1; then
  fallback "nmcli could not create AP ${SSID}"
fi

if nmcli connection up "${CON_NAME}" >/dev/null 2>&1; then
  log "SoftAP up: ${SSID} on ${WIFI_DEV}"
  exit 0
fi

nmcli connection delete "${CON_NAME}" >/dev/null 2>&1 || true
fallback "nmcli failed to bring up ${SSID}"
