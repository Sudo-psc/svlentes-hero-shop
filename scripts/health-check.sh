#!/bin/bash

set -euo pipefail

URL="http://localhost:5000/api/health-check"
PORT=5000
NODE_SERVICE="nextjs"
NGINX_SERVICE="nginx"
ONCE=false

print_usage() {
    cat <<USAGE
Usage: $0 [--url URL] [--port PORT] [--node-service SERVICE] [--nginx-service SERVICE] [--once]
USAGE
}

log() {
    local level="$1"
    local message="$2"
    printf '%s [%s] %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "${level}" "${message}"
}

check_service() {
    local service="$1"
    if systemctl is-active --quiet "${service}"; then
        log "INFO" "Service ${service} is active"
    else
        log "ERROR" "Service ${service} is not active"
        return 1
    fi
}

check_port() {
    if ss -tln | grep -q ":${PORT} "; then
        log "INFO" "Port ${PORT} is listening"
    else
        log "ERROR" "Port ${PORT} is not listening"
        return 1
    fi
}

check_http() {
    if curl -fsS --max-time 10 "${URL}" >/dev/null; then
        log "INFO" "HTTP endpoint reachable: ${URL}"
    else
        log "ERROR" "HTTP health-check failed for ${URL}"
        return 1
    fi
}

check_resources() {
    local load
    load="$(cut -d ' ' -f1 /proc/loadavg)"
    local mem
    mem="$(free -m | awk '/Mem:/ { printf "%s/%sMB", $3, $2 }')"
    log "INFO" "System load: ${load}, memory usage: ${mem}"
}

run_checks() {
    local status=0
    check_service "${NODE_SERVICE}" || status=1
    check_service "${NGINX_SERVICE}" || status=1
    check_port || status=1
    check_http || status=1
    check_resources
    return ${status}
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --url)
            URL="$2"
            shift 2
            ;;
        --port)
            PORT="$2"
            shift 2
            ;;
        --node-service)
            NODE_SERVICE="$2"
            shift 2
            ;;
        --nginx-service)
            NGINX_SERVICE="$2"
            shift 2
            ;;
        --once)
            ONCE=true
            shift
            ;;
        --help|-h)
            print_usage
            exit 0
            ;;
        *)
            print_usage
            exit 1
            ;;
    esac
done

if [[ "${ONCE}" == true ]]; then
    run_checks
    exit $?
fi

while true; do
    run_checks || log "ERROR" "Health check failed"
    sleep 60
done
