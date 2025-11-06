# Checklist de Validação

## Pré-Deploy
- [ ] Dependências instaladas (`npm ci`)
- [ ] Build sem erros (`npm run build`)
- [ ] Testes unitários executados (`npm run test`)
- [ ] Testes de resiliência/integração conforme necessário (`npm run test:resilience` / `npm run test:integration`)
- [ ] `scripts/test-local.sh` executado e aprovado
- [ ] Variáveis de ambiente revisadas (`.env.production` baseado em `.env.production.template`)
- [ ] `npm run security:audit` sem falhas críticas
- [ ] Plano de rollback validado (`scripts/deploy.sh rollback` em staging)

## Deploy
- [ ] `scripts/deploy.sh production` executado sem erros
- [ ] Logs monitorados durante o deploy (`journalctl -fu nextjs`)
- [ ] `scripts/health-check.sh --once` retornou sucesso

## Pós-Deploy
- [ ] Homepage (`/`) respondendo com status 200
- [ ] Área do assinante (`/area-assinante/dashboard`) acessível
- [ ] Endpoint `/api/health-check` retorna `200` com `status: ok`
- [ ] Webhooks recebendo eventos (verificar ASAAS, SendPulse, Stripe)
- [ ] SSL válido e sem warnings (`curl -I https://svlentes.com.br`)
- [ ] Métricas de monitoramento ativas (`docs/MONITORING.md`)
- [ ] Sem erros críticos em `journalctl -u nextjs` ou `/var/log/nginx/svlentes.error.log`
- [ ] Runbook atualizado se houve incidentes (`docs/PRODUCTION_RUNBOOK.md`)
