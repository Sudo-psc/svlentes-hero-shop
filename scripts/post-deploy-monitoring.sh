#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://svlentes.shop}"
STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-}"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
RESEND_API_KEY="${RESEND_API_KEY:-}"
MONITORING_EMAIL_RECIPIENTS="${MONITORING_EMAIL_RECIPIENTS:-}"
N8N_WEBHOOK_URL="${N8N_WEBHOOK_URL:-}"
SSH_USER="${SSH_USER:-}"
SSH_HOST="${SSH_HOST:-}"
DEPLOY_PATH="${DEPLOY_PATH:-/root/svlentes-hero-shop}"
ERROR_THRESHOLD="${ERROR_THRESHOLD:-0.05}"
MONITOR_DURATION="${MONITOR_DURATION:-600}"
MONITOR_INTERVAL="${MONITOR_INTERVAL:-30}"

current_step=""

notify_slack() {
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local message="$1"
        curl -sS -X POST "$SLACK_WEBHOOK_URL" -H "Content-Type: application/json" -d "{\"text\":\"${message//\"/\\\"}\"}" >/dev/null || true
    fi
}

notify_email() {
    if [ -n "$RESEND_API_KEY" ] && [ -n "$MONITORING_EMAIL_RECIPIENTS" ]; then
        local subject="$1"
        local body="$2"
        local recipients
        recipients=$(python3 - <<'PY'
import os
import json
emails = [item.strip() for item in os.environ.get('MONITORING_EMAIL_RECIPIENTS', '').split(',') if item.strip()]
print(json.dumps(emails))
PY
        )
        curl -sS https://api.resend.com/emails \
            -H "Authorization: Bearer $RESEND_API_KEY" \
            -H "Content-Type: application/json" \
            -d "{\"from\":\"SVLentes Monitor <monitor@svlentes.com.br>\",\"to\":$recipients,\"subject\":\"${subject//\"/\\\"}\",\"text\":\"${body//\"/\\\"}\"}" >/dev/null || true
    fi
}

notify_n8n() {
    if [ -n "$N8N_WEBHOOK_URL" ]; then
        local payload="$1"
        curl -sS -X POST "$N8N_WEBHOOK_URL/monitoring-alert" -H "Content-Type: application/json" -d "$payload" >/dev/null || true
    fi
}

send_alerts() {
    local title="$1"
    local details="$2"
    notify_slack(":rotating_light: $title\n$details")
    notify_email("$title", "$details")
    notify_n8n "{\"title\":\"${title//\"/\\\"}\",\"details\":\"${details//\"/\\\"}\"}"
}

handle_failure() {
    local message="$1"
    send_alerts "$current_step" "$message"
    exit 1
}

check_endpoint() {
    local url="$1"
    current_step="Health check $url"
    if ! curl -fsS --retry 3 --retry-delay 3 "$url" >/dev/null; then
        handle_failure "Endpoint indisponível"
    fi
}

check_stripe() {
    current_step="Verificação Stripe"
    if [ -z "$STRIPE_SECRET_KEY" ]; then
        handle_failure "Chave Stripe ausente para monitoramento"
    fi
    local response
    response=$(curl -fsS https://api.stripe.com/v1/balance -u "$STRIPE_SECRET_KEY:" || true)
    if ! echo "$response" | python3 -c "import json,sys; data=json.load(sys.stdin); sys.exit(0 if 'available' in data else 1)"; then
        handle_failure "Falha ao consultar API Stripe"
    fi
}

run_synthetic_purchase() {
    current_step="Teste sintético de compra"
    local payload
    payload='{"planId":"basic","billingInterval":"monthly","billingType":"PIX","customerData":{"name":"Teste Monitoramento","email":"monitoramento+synthetic@svlentes.com.br","phone":"11999999999","cpfCnpj":"12345678901"},"metadata":{"syntheticTest":"true","source":"post-deploy-monitoring"}}'
    local response
    response=$(curl -fsS -X POST "$BASE_URL/api/create-checkout" -H "Content-Type: application/json" -d "$payload") || handle_failure "Falha na criação de checkout sintético"
    if ! echo "$response" | python3 -c "import json,sys; data=json.load(sys.stdin); sys.exit(0 if data.get('success') else 1)"; then
        handle_failure "Resposta inválida no checkout sintético"
    fi
}

monitor_error_rate() {
    current_step="Monitoramento taxa de erro"
    local start
    start=$(date +%s)
    while true; do
        local now
        now=$(date +%s)
        if [ $((now - start)) -ge "$MONITOR_DURATION" ]; then
            break
        fi
        local response
        response=$(curl -fsS "$BASE_URL/api/monitoring/performance") || handle_failure "Falha ao obter métricas de performance"
        local error_rate
        error_rate=$(python3 -c "import json,sys; data=json.load(sys.stdin); print(data.get('metrics', {}).get('errorRate', 0.0))" <<<"$response")
        if python3 - "$error_rate" "$ERROR_THRESHOLD" <<'PY'
import sys
try:
    error_rate=float(sys.argv[1])
    threshold=float(sys.argv[2])
except ValueError:
    sys.exit(0)
sys.exit(0 if error_rate>threshold else 1)
PY
        then
            if rollback_deployment; then
                handle_failure "Taxa de erro ${error_rate} acima do limite ${ERROR_THRESHOLD}. Rollback executado."
            else
                handle_failure "Taxa de erro ${error_rate} acima do limite ${ERROR_THRESHOLD}. Rollback indisponível."
            fi
        fi
        sleep "$MONITOR_INTERVAL"
    done
}

rollback_deployment() {
    if [ -z "$SSH_USER" ] || [ -z "$SSH_HOST" ]; then
        return 1
    fi
    if ssh "$SSH_USER@$SSH_HOST" "set -e; cd $DEPLOY_PATH; if [ ! -f .last-deploy-commit ]; then exit 1; fi; TARGET=\$(cat .last-deploy-commit); git fetch origin; git reset --hard \$TARGET; npm ci --production=false; npm run build; systemctl restart svlentes-nextjs"; then
        notify_slack(":warning: Rollback executado automaticamente")
        return 0
    fi
    return 1
}

main() {
    check_endpoint "$BASE_URL/api/health-check"
    check_endpoint "$BASE_URL/api/monitoring/performance"
    check_endpoint "$BASE_URL/api/monitoring/errors"
    check_endpoint "$BASE_URL/api/monitoring/alerts"
    check_stripe
    run_synthetic_purchase
    monitor_error_rate
    current_step="Monitoramento pós-deploy"
    notify_slack(":white_check_mark: Monitoramento pós-deploy concluído sem incidentes")
}

main
