#!/usr/bin/env bash
# Helm alpha installer. Run once on Raspberry Pi OS Lite (64-bit).
# After success, SSH is disabled on purpose.
set -euo pipefail

VERSION="0.1.1-alpha"
OPT_DIR="/opt/helm"
UNIT_NAME="helm.service"
AP_UNIT_NAME="helm-wifi-ap.service"
UPDATE_UNIT="helm-update.service"
UPDATE_PATH="helm-update.path"
AP_INSTALL="/usr/local/lib/helm/wifi-ap.sh"
UPDATE_INSTALL="/usr/local/lib/helm/update.sh"
VERSION_FILE="/etc/helm-version"
KEEP_SSH="${HELM_KEEP_SSH:-${REEFDECK_KEEP_SSH:-0}}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log() { echo "helm-install: $*"; }
die() { echo "helm-install: $*" >&2; exit 1; }

if [[ "${EUID}" -ne 0 ]]; then
  die "run as root: sudo bash install.sh"
fi

export DEBIAN_FRONTEND=noninteractive

need_bin() { command -v "$1" >/dev/null 2>&1; }

apt_install() {
  apt-get update -y
  apt-get install -y --no-install-recommends "$@"
}

SOURCE=""
if [[ -n "${1:-}" ]]; then
  SOURCE="$(cd "$1" && pwd)"
elif [[ -f "${SCRIPT_DIR}/../docker-compose.yml" ]]; then
  SOURCE="$(cd "${SCRIPT_DIR}/.." && pwd)"
elif [[ -f "${OPT_DIR}/docker-compose.yml" ]]; then
  SOURCE="${OPT_DIR}"
elif [[ -n "${HELM_GIT_URL:-${REEFDECK_GIT_URL:-}}" ]]; then
  need_bin git || apt_install ca-certificates git
  CLONE_DIR="$(mktemp -d /tmp/helm-src.XXXXXX)"
  GIT_URL="${HELM_GIT_URL:-${REEFDECK_GIT_URL}}"
  log "cloning ${GIT_URL}"
  git clone --depth 1 "${GIT_URL}" "${CLONE_DIR}"
  SOURCE="${CLONE_DIR}"
else
  die "no source: copy this repo onto the Pi or set HELM_GIT_URL"
fi

[[ -f "${SOURCE}/docker-compose.yml" ]] || die "docker-compose.yml missing in ${SOURCE}"

need_bin curl || apt_install ca-certificates curl
need_bin rsync || apt_install rsync || true

if ! need_bin docker || ! docker compose version >/dev/null 2>&1; then
  log "installing docker"
  if ! curl -fsSL https://get.docker.com | sh; then
    apt_install docker.io docker-compose-v2 || apt_install docker.io docker-compose
  fi
fi
need_bin docker || die "docker is not installed"
systemctl enable docker.service
systemctl start docker.service

COMPOSE=(docker compose)
if ! docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
fi

mkdir -p "${OPT_DIR}/data/firmware"
if [[ "${SOURCE}" != "${OPT_DIR}" ]]; then
  log "syncing source → ${OPT_DIR}"
  if need_bin rsync; then
    rsync -a --exclude '.git/' --exclude 'node_modules/' --exclude '.next/' --exclude '.env' \
      "${SOURCE}/" "${OPT_DIR}/"
  else
    cp -a "${SOURCE}/." "${OPT_DIR}/"
    rm -rf "${OPT_DIR}/node_modules" "${OPT_DIR}/.next"
  fi
fi

if [[ ! -f "${OPT_DIR}/.env" ]]; then
  if [[ -f "${OPT_DIR}/.env.example" ]]; then
    cp "${OPT_DIR}/.env.example" "${OPT_DIR}/.env"
  else
    printf 'APEX_HOST=\nAPEX_USER=admin\nAPEX_PASSWORD=\nHELM_AUTH_SECRET=change-me-on-the-hub\n' >"${OPT_DIR}/.env"
  fi
fi

install -m 0644 "${SCRIPT_DIR}/${UNIT_NAME}" "/etc/systemd/system/${UNIT_NAME}"
if [[ "${COMPOSE[0]}" == "docker-compose" ]]; then
  COMPOSE_BIN="$(command -v docker-compose)"
  sed -i \
    -e "s|^ExecStart=.*|ExecStart=${COMPOSE_BIN} up -d --remove-orphans --build|" \
    -e "s|^ExecStop=.*|ExecStop=${COMPOSE_BIN} stop|" \
    "/etc/systemd/system/${UNIT_NAME}"
fi

mkdir -p /usr/local/lib/helm
install -m 0755 "${SCRIPT_DIR}/wifi-ap.sh" "${AP_INSTALL}"
install -m 0755 "${SCRIPT_DIR}/update.sh" "${UPDATE_INSTALL}"
install -m 0644 "${SCRIPT_DIR}/${UPDATE_UNIT}" "/etc/systemd/system/${UPDATE_UNIT}"
install -m 0644 "${SCRIPT_DIR}/${UPDATE_PATH}" "/etc/systemd/system/${UPDATE_PATH}"

cat >"/etc/systemd/system/${AP_UNIT_NAME}" <<EOF
[Unit]
Description=Helm first-boot SoftAP (best effort)
After=NetworkManager.service network-online.target
Wants=NetworkManager.service

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=${AP_INSTALL}

[Install]
WantedBy=multi-user.target
EOF

systemctl set-default multi-user.target
systemctl daemon-reload
systemctl enable "${UNIT_NAME}"
systemctl enable "${AP_UNIT_NAME}"
systemctl enable "${UPDATE_PATH}"

log "starting Helm (first compose build can take several minutes)"
systemctl start "${UNIT_NAME}"
systemctl start "${AP_UNIT_NAME}" || log "SoftAP oneshot returned non-zero (use Sightglass app on LAN)"
systemctl start "${UPDATE_PATH}" || true

printf '%s\n' "${VERSION}" >"${VERSION_FILE}"
log "wrote ${VERSION_FILE}: ${VERSION}"

if [[ "${KEEP_SSH}" == "1" ]]; then
  log "HELM_KEEP_SSH=1: leaving ssh enabled"
else
  log "disabling SSH (intended — this unit is now a black box)"
  systemctl disable --now ssh.socket >/dev/null 2>&1 || true
  systemctl disable --now ssh.service >/dev/null 2>&1 || true
  systemctl disable --now sshd.service >/dev/null 2>&1 || true
fi

log "Helm ${VERSION} ready. Sightglass UI on :43180. App can push Helm + glass firmware."
