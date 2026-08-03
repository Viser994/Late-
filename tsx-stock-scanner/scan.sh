#!/usr/bin/env bash
# TSX Stock Scanner - shell launcher
# Usage: ./scan.sh [command] [options]

set -euo pipefail
cd "$(dirname "$0")"
exec python3 main.py "$@"
