#!/usr/bin/env bash
# Host-side Helm OTA. Triggered by helm-update.path when the app writes
# /opt/helm/data/update-request. Customers never run this.
set -euo pipefail

OPT_DIR="${HELM_OPT:-${REEFDECK_OPT:-/opt/helm}}"
REQUEST="${OPT_DIR}/data/update-request"
RESULT="${OPT_DIR}/data/update-result.json"
LOG_TAG="helm-update"

log() {
  echo "${LOG_TAG}: $*"
  logger -t "${LOG_TAG}" "$*" 2>/dev/null || true
}

fail() {
  mkdir -p "$(dirname "${RESULT}")"
  printf '{"ok":false,"error":%s,"at":%s}\n' "$(python3 -c "import json,sys; print(json.dumps(sys.argv[1]))" "$*")" "$(date +%s000)" >"${RESULT}"
  log "failed: $*"
  exit 0
}

if [[ "${EUID}" -ne 0 ]]; then
  fail "run as root"
fi

cd "${OPT_DIR}" || fail "missing ${OPT_DIR}"
mkdir -p "${OPT_DIR}/data"

if [[ -d "${OPT_DIR}/.git" ]]; then
  log "git pull"
  git pull --ff-only || fail "git pull failed"
fi

COMPOSE=(docker compose)
if ! docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
fi

log "compose build"
"${COMPOSE[@]}" up -d --remove-orphans --build || fail "docker compose failed"

VERSION="$(tr -d '[:space:]' <"${OPT_DIR}/VERSION" 2>/dev/null || echo unknown)"
printf '{"ok":true,"version":"%s","at":%s}\n' "${VERSION}" "$(date +%s000)" >"${RESULT}"
rm -f "${REQUEST}"
log "applied ${VERSION}"
