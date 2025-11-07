# Monitoramento

## Métricas Críticas
- **Disponibilidade**: uptime da rota `/api/health-check` (usar `scripts/monitor.sh`).
- **Latência**: registrar `request_time` e `upstream_response_time` do Nginx para dashboards.
- **Erros 5xx**: alertar quando > 1% em 5 minutos.
- **Fila SendPulse/ASAAS**: monitorar endpoints `/api/reminders/**` e `/api/asaas/**`.
- **Uso de memória/CPU**: coletar via `node_exporter` ou `pm2 monit`.

## Alertas Recomendados
- Falha consecutiva em `scripts/health-check.sh` (>3 execuções).
- PM2 ou systemd reiniciando mais de 5 vezes em 10 minutos.
- Disco > 80% (`df -h`).
- Falha em webhooks (`/api/webhooks/*` retornando >= 400).

## Ferramentas
- Datadog (aplicativo) ou AWS CloudWatch para métricas/alertas.
- Grafana com Prometheus para dashboards customizados.
- Sentry (`SENTRY_DSN`) para rastrear exceções.
- LangSmith (`LANGCHAIN_*`) para monitorar conversas e custos de LLM.

## Logs Estruturados
- Nginx: `/var/log/nginx/svlentes.access.log` (formato `main` com `request_time`).
- Aplicação: `systemd` logs via `journalctl -u nextjs` ou `pm2 logs svlentes-next`.
- Scripts geram relatórios em `/tmp/svlentes-diagnostics` e `/var/log/svlentes/monitor.log`.

## Procedimentos
1. Executar `scripts/diagnose.sh` ao abrir incidente e anexar relatório.
2. Validar dashboards e alertas após cada deploy maior.
3. Registrar incidentes no runbook (`docs/PRODUCTION_RUNBOOK.md`).
4. Revisar métricas semanalmente para ajustes de capacidade.
