#!/usr/bin/env bash
# Factory jig. Not for customers.
set -euo pipefail
cd "$(dirname "$0")/.."
pio run -e esp32-s3-panel -t upload
