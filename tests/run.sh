#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.."; pwd)"
echo "Open http://localhost:8765/tests/tests.html in your browser."
echo "Run a server in $ROOT (e.g. python3 -m http.server 8765) if not already running."
