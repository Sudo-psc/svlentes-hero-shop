#!/bin/bash

set -euo pipefail

INTERVAL="${INTERVAL:-300}"
HEALTH_URL="${HEALTH_URL:-https://svlentes.com.br/api/health-check}"
PORT="${PORT:-5000}"
NODE_SERVICE="${NODE_SERVICE:-nextjs}"
NGINX_SERVICE="${NGINX_SERVICE:-nginx}"
OUTPUT="${OUTPUT:-/var/log/svlentes/monitor.log}"
mkdir -p "$(dirname "${OUTPUT}")"

echo "Starting SV Lentes monitor loop (interval: ${INTERVAL}s)" | tee -a "${OUTPUT}"

while true; do
    TIMESTAMP="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    if "$(dirname "$0")/health-check.sh" --url "${HEALTH_URL}" --port "${PORT}" --node-service "${NODE_SERVICE}" --nginx-service "${NGINX_SERVICE}" --once; then
        echo "${TIMESTAMP} [OK] Health check passed" | tee -a "${OUTPUT}"
    else
        echo "${TIMESTAMP} [ALERT] Health check failed" | tee -a "${OUTPUT}"
    fi
    sleep "${INTERVAL}"
done
