#!/bin/bash

set -euo pipefail

REPORT_DIR="/tmp/svlentes-diagnostics"
TIMESTAMP="$(date +%Y%m%d%H%M%S)"
REPORT_FILE="${REPORT_DIR}/diagnostic-${TIMESTAMP}.log"
NODE_SERVICE="nextjs"
NGINX_SERVICE="nginx"
PM2_PROCESS="svlentes-next"

mkdir -p "${REPORT_DIR}"

echo "SV Lentes Diagnostic Report - ${TIMESTAMP}" | tee "${REPORT_FILE}"

echo "\n## Service Status" | tee -a "${REPORT_FILE}"
if systemctl is-active --quiet "${NODE_SERVICE}"; then
    systemctl status "${NODE_SERVICE}" --no-pager | tee -a "${REPORT_FILE}"
else
    echo "${NODE_SERVICE} service is not active" | tee -a "${REPORT_FILE}"
fi

if systemctl is-active --quiet "${NGINX_SERVICE}"; then
    systemctl status "${NGINX_SERVICE}" --no-pager | tee -a "${REPORT_FILE}"
else
    echo "${NGINX_SERVICE} service is not active" | tee -a "${REPORT_FILE}"
fi

if command -v pm2 >/dev/null 2>&1; then
    echo "\n## PM2 Processes" | tee -a "${REPORT_FILE}"
    pm2 jlist | tee -a "${REPORT_FILE}"
fi

echo "\n## Listening Ports" | tee -a "${REPORT_FILE}"
ss -tulpn | grep -E ':(80|443|5000) ' | tee -a "${REPORT_FILE}" || echo "Nenhuma porta 80/443/5000 aberta" | tee -a "${REPORT_FILE}"

echo "\n## Recent Logs" | tee -a "${REPORT_FILE}"
journalctl -u "${NODE_SERVICE}" -n 50 --no-pager | tee -a "${REPORT_FILE}"
journalctl -u "${NGINX_SERVICE}" -n 50 --no-pager | tee -a "${REPORT_FILE}"

if [[ -f /var/log/nginx/svlentes.error.log ]]; then
    echo "\n### Nginx Error Log (tail 50)" | tee -a "${REPORT_FILE}"
    tail -n 50 /var/log/nginx/svlentes.error.log | tee -a "${REPORT_FILE}"
fi

if [[ -f /var/log/nginx/svlentes.access.log ]]; then
    echo "\n### Nginx Access Log (tail 50)" | tee -a "${REPORT_FILE}"
    tail -n 50 /var/log/nginx/svlentes.access.log | tee -a "${REPORT_FILE}"
fi

echo "\n## Resource Utilization" | tee -a "${REPORT_FILE}"
uptime | tee -a "${REPORT_FILE}"
free -m | tee -a "${REPORT_FILE}"
ps -eo pid,ppid,cmd,%mem,%cpu --sort=-%mem | head -n 15 | tee -a "${REPORT_FILE}"

echo "\n## Disk Usage" | tee -a "${REPORT_FILE}"
df -h | tee -a "${REPORT_FILE}"

echo "\n## Environment Snapshot" | tee -a "${REPORT_FILE}"
if [[ -f /var/www/svlentes-hero-shop/shared/.env ]]; then
    grep -v '^#' /var/www/svlentes-hero-shop/shared/.env | sed 's/=.*$/=<redacted>/' | tee -a "${REPORT_FILE}"
fi

echo "Diagnostic output saved to ${REPORT_FILE}" | tee -a "${REPORT_FILE}"
