# Production Runbook

## Problemas Comuns e Soluções

### 502 Bad Gateway
**Sintomas:** Página exibe 502, logs do Nginx mostram `upstream prematurely closed connection`.  
**Diagnóstico:**
1. `sudo systemctl status nextjs` para confirmar se o processo está ativo.
2. `sudo journalctl -u nextjs -n 100 --no-pager` para procurar stack traces.
3. `curl -fsSL https://svlentes.com.br/api/health-check` para validar resposta da aplicação.
4. `sudo tail -n 50 /var/log/nginx/svlentes.error.log` para erros de proxy.
**Solução:**
1. Reiniciar processo: `sudo systemctl restart nextjs` (ou `pm2 restart svlentes-next`).
2. Garantir que a porta 5000 esteja livre: `sudo ss -tlnp | grep 5000`.
3. Se o build falhou, executar `scripts/deploy.sh rollback` para voltar ao último release íntegro.
**Prevenção:**
- Executar `npm run build` e `scripts/test-local.sh` antes de implantar.  
- Monitorar métricas de CPU/RAM com `scripts/monitor.sh`.

### 504 Gateway Timeout
**Sintomas:** API retorna 504 após 1-2 minutos, especialmente em rotas ASAAS/SendPulse.  
**Diagnóstico:**
1. `sudo journalctl -u nextjs -n 100` e filtrar por `[timeout]`.
2. Verificar o tempo configurado no Nginx (`proxy_read_timeout` em `nginx/production.conf`).
3. Checar conectividade externa: `curl -I https://api.asaas.com`.  
**Solução:**
1. Revisar integrações externas e confirmar se o ASAAS/SendPulse está operacional.
2. Ajustar `proxy_read_timeout` temporariamente em `/etc/nginx/nginx.conf` se necessário.
3. Reexecutar requisição via `scripts/health-check.sh --url https://svlentes.com.br/api/health-check --once`.
**Prevenção:**
- Configurar alertas de latência (ver `docs/MONITORING.md`).
- Implementar retentativas com `fetch`/`axios` no backend.

### Alto Uso de Memória
**Sintomas:** `pm2` reiniciando workers, `systemd` reporta `Out of memory`.  
**Diagnóstico:**
1. `free -h` para inspecionar uso total.  
2. `pm2 monit` ou `ps -eo pid,cmd,%mem --sort=-%mem | head` para identificar culpados.  
3. `npx next telemetry disable` para reduzir overhead, se ainda não feito.  
**Solução:**
1. Aumentar swap temporária: `sudo fallocate -l 2G /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`.
2. Habilitar modo cluster com PM2 (já previsto em `ecosystem.config.js`).
3. Limitar memória via PM2 (`max_memory_restart: '1G'`).
**Prevenção:**
- Executar builds com `NODE_OPTIONS=--max-old-space-size=2048`.
- Usar `scripts/monitor.sh` para observar tendências.

### Erros de Build
**Sintomas:** `npm run build` falha durante o deploy.  
**Diagnóstico:**
1. Rodar localmente `npm run build` para reproduzir.  
2. Revisar `./.next/trace` ou logs de build no pipeline.  
3. Conferir variáveis de ambiente exigidas (ver `.env.example`).
**Solução:**
1. Ajustar variáveis ausentes (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, etc.).
2. Atualizar dependências quebradas com `npm install pacote@versao`.  
3. Se necessário, executar `scripts/deploy.sh rollback`.
**Prevenção:**
- Validar com `scripts/test-local.sh` antes de enviar para produção.  
- Executar `npm run lint` e `npm run test` na CI/CD.

### Webhooks SendPulse/ASAAS
**Sintomas:** Eventos não chegam, fila de mensagens atrasada.  
**Diagnóstico:**
1. Checar `src/app/api/webhooks/...` no Next.js e logs do endpoint.
2. `sudo tail -n 50 /var/log/nginx/svlentes.access.log | grep /api/webhooks`.
3. Validar secrets (`SENDPULSE_WEBHOOK_SECRET`, `ASAAS_WEBHOOK_TOKEN`).
**Solução:**
1. Regenerar tokens nos respectivos painéis e atualizar `.env.production`.
2. Garantir que `Content-Security-Policy` permite domínios dos provedores.
3. Reexecutar `scripts/diagnose.sh` para anexar ao chamado de suporte.
**Prevenção:**
- Usar `docs/SECURITY.md` para revisar configurações de webhook.
- Habilitar monitoramento de filas com `docs/MONITORING.md`.

### Falha no Login do Assinante
**Sintomas:** Usuários recebem erro ao autenticar, dashboards indisponíveis.  
**Diagnóstico:**
1. Confirmar integridade do Firebase (`scripts/diagnose.sh` exibe variáveis mascaradas).  
2. Verificar logs da rota `/api/assinante/auth` no Next.js.  
3. Revisar `NEXT_PUBLIC_AUTH_CACHE_KEY` e caches do navegador.
**Solução:**
1. Resetar tokens de serviço do Firebase Admin.
2. Limpar cookies e storage via script `scripts/diagnose.sh` (recomendação ao usuário).  
3. Verificar se o relógio do servidor está sincronizado (`timedatectl status`).
**Prevenção:**
- Implantar `npm run test:resilience` periodicamente.  
- Monitorar métricas de autenticação (ver `docs/MONITORING.md`).
