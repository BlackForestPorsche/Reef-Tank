#!/usr/bin/env bash
# Factory / you. Customers never run this.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec "$ROOT/panel/scripts/flash-panel.sh" "$@"
