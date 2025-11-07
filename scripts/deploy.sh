#!/bin/bash

set -euo pipefail

APP_NAME="svlentes-hero-shop"
SERVICE_NAME="nextjs"
PM2_PROCESS_NAME="svlentes-next"
NODE_PORT=5000
RELEASES_DIR="/var/www/${APP_NAME}/releases"
SHARED_DIR="/var/www/${APP_NAME}/shared"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENVIRONMENT="${1:-staging}"
TIMESTAMP="$(date +%Y%m%d%H%M%S)"
RELEASE_PATH="${RELEASES_DIR}/${TIMESTAMP}"
LOCK_FILE="${SHARED_DIR}/deploy.lock"
HEALTH_ENDPOINT="https://svlentes.com.br/api/health-check"

log() {
    local level="$1"
    local message="$2"
    printf '%s [%s] %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "${level}" "${message}"
}

abort() {
    log "ERROR" "$1"
    exit 1
}

ensure_prerequisites() {
    log "INFO" "Validating prerequisites"

    command -v node >/dev/null 2>&1 || abort "Node.js is required"
    command -v npm >/dev/null 2>&1 || abort "npm is required"
    command -v rsync >/dev/null 2>&1 || abort "rsync is required"
    command -v tar >/dev/null 2>&1 || abort "tar is required"

    local node_major
    node_major="$(node -p "process.versions.node.split('.') [0]")"
    if (( node_major < 20 )); then
        abort "Node.js 20+ is required"
    fi

    mkdir -p "${RELEASES_DIR}" "${SHARED_DIR}/logs" "${SHARED_DIR}/backups"
}

acquire_lock() {
    if [[ -f "${LOCK_FILE}" ]]; then
        abort "Deployment already in progress (lock file present)"
    fi
    echo "${TIMESTAMP}" > "${LOCK_FILE}"
}

release_lock() {
    rm -f "${LOCK_FILE}"
}

load_env_file() {
    local env_file
    case "${ENVIRONMENT}" in
        production)
            env_file="${REPO_ROOT}/.env.production"
            ;;
        staging)
            env_file="${REPO_ROOT}/.env.staging"
            ;;
        *)
            env_file="${REPO_ROOT}/.env.${ENVIRONMENT}"
            ;;
    esac

    if [[ ! -f "${env_file}" ]]; then
        abort "Environment file ${env_file} not found"
    fi

    log "INFO" "Using environment file ${env_file}"
    set -a
    # shellcheck disable=SC1090
    source "${env_file}"
    set +a
}

run_prechecks() {
    log "INFO" "Running project validations"
    pushd "${REPO_ROOT}" >/dev/null
    npm ci --include=dev
    npm run lint
    npm run test -- --watchAll=false || abort "Unit tests failed"
    npm run build
    popd >/dev/null
}

create_backup() {
    if [[ -L "${SHARED_DIR}/current" ]]; then
        local current_release
        current_release="$(readlink -f "${SHARED_DIR}/current")"
        if [[ -d "${current_release}" ]]; then
            local backup_file
            backup_file="${SHARED_DIR}/backups/${TIMESTAMP}.tar.gz"
            log "INFO" "Creating backup ${backup_file}"
            tar -czf "${backup_file}" -C "${current_release}" .
        fi
    fi
}

publish_release() {
    log "INFO" "Publishing release ${RELEASE_PATH}"
    rsync -a --delete "${REPO_ROOT}/" "${RELEASE_PATH}/"
    rm -rf "${RELEASE_PATH}/.git" "${RELEASE_PATH}/node_modules"
    pushd "${RELEASE_PATH}" >/dev/null
    npm ci --omit=dev
    npm run build
    ln -sfn "${SHARED_DIR}/logs" "${RELEASE_PATH}/logs"
    if [[ ! -f "${SHARED_DIR}/.env" ]]; then
        abort "Expected shared environment file at ${SHARED_DIR}/.env"
    fi
    ln -sfn "${SHARED_DIR}/.env" "${RELEASE_PATH}/.env.production"
    popd >/dev/null
    ln -sfn "${RELEASE_PATH}" "${SHARED_DIR}/current"
}

reload_process_manager() {
    if command -v pm2 >/dev/null 2>&1; then
        log "INFO" "Reloading PM2 process"
        pm2 startOrReload "${REPO_ROOT}/ecosystem.config.js" --only "${PM2_PROCESS_NAME}" || pm2 restart "${PM2_PROCESS_NAME}" || true
        pm2 save || true
    else
        log "INFO" "Reloading systemd service ${SERVICE_NAME}"
        sudo systemctl daemon-reload
        sudo systemctl restart "${SERVICE_NAME}.service"
    fi
}

verify_services() {
    log "INFO" "Running post-deploy health verification"
    if ! "${REPO_ROOT}/scripts/health-check.sh" --once --url "${HEALTH_ENDPOINT}" --port "${NODE_PORT}"; then
        abort "Health check failed"
    fi
}

rollback_release() {
    local previous_backup
    previous_backup="$(ls -1 "${SHARED_DIR}/backups" | sort -r | sed -n '2p')"
    if [[ -z "${previous_backup}" ]]; then
        abort "No backup available for rollback"
    fi

    local target_dir
    target_dir="${RELEASES_DIR}/rollback-${TIMESTAMP}"
    mkdir -p "${target_dir}"
    tar -xzf "${SHARED_DIR}/backups/${previous_backup}" -C "${target_dir}"
    ln -sfn "${target_dir}" "${SHARED_DIR}/current"
    reload_process_manager
    verify_services
}

cleanup_releases() {
    log "INFO" "Cleaning up old releases"
    ls -1dt "${RELEASES_DIR}"/* | tail -n +6 | xargs -r rm -rf
    ls -1t "${SHARED_DIR}/backups" | tail -n +8 | xargs -r -I {} rm -f "${SHARED_DIR}/backups/{}"
}

main() {
    case "${ENVIRONMENT}" in
        rollback)
            ensure_prerequisites
            acquire_lock
            rollback_release
            release_lock
            return
            ;;
        staging|production)
            ;;
        *)
            abort "Unsupported environment: ${ENVIRONMENT}"
            ;;
    esac

    ensure_prerequisites
    acquire_lock

    trap release_lock EXIT

    load_env_file
    run_prechecks
    create_backup
    publish_release
    reload_process_manager
    verify_services
    cleanup_releases

    log "INFO" "Deployment completed successfully"
}

main "$@"
