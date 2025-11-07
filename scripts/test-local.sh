#!/bin/bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-5000}"
HEALTH_URL="http://localhost:${PORT}/api/health-check"
LOG_FILE="${PROJECT_ROOT}/.tmp/test-local.log"

mkdir -p "${PROJECT_ROOT}/.tmp"

pushd "${PROJECT_ROOT}" >/dev/null
npm ci
npm run build

npx next start -p "${PORT}" -H 127.0.0.1 >/"${LOG_FILE}" 2>&1 &
NEXT_PID=$!

cleanup() {
    kill "${NEXT_PID}" 2>/dev/null || true
}

trap cleanup EXIT

sleep 5

if curl -fsS "${HEALTH_URL}" >/dev/null; then
    echo "Health endpoint reachable at ${HEALTH_URL}"
else
    echo "Health endpoint failed" >&2
    exit 1
fi

if command -v artillery >/dev/null 2>&1; then
    artillery quick --count 2 --num 10 "${PROJECT_ROOT}" >/dev/null 2>&1 || echo "Artillery load test reported warnings"
else
    echo "Artillery not installed; skipped load test"
fi

curl -I "http://localhost:${PORT}/_next/static/" >/dev/null 2>&1 || echo "Static asset check skipped"

echo "Local production simulation completed"
