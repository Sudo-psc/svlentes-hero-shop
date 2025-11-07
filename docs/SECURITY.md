# Guia de Segurança

## Headers e Proteções
- `nginx/production.conf` inclui `Content-Security-Policy`, `HSTS`, `X-Frame-Options`, `X-Content-Type-Options`, `Permissions-Policy`.
- Garanta que redirecionamentos de www/HTTP → HTTPS estejam ativos.
- Atualize listas de domínios confiáveis na CSP quando integrar novas ferramentas.

## Rate Limiting
- `limit_req` (20 req/s com burst 40) protege APIs sensíveis.
- Ajuste por rota caso necessário adicionando regras em `/etc/nginx/conf.d/custom/`.

## Proteção de Webhooks
- Use `SENDPULSE_WEBHOOK_SECRET`, `ASAAS_WEBHOOK_TOKEN`, `STRIPE_WEBHOOK_SECRET` para validar assinaturas.
- Configure IP allowlist nas plataformas quando disponível.

## Gestão de Secrets
- Armazene `.env.production` em um cofre (AWS Secrets Manager, Doppler, Vault).
- Nunca commit secrets; use placeholders `{{SECRET}}` nos templates.
- Rotacione chaves trimestralmente ou após incidentes.

## Dependências
- Execute `npm run security:audit` mensalmente.
- Use `npm run security:deps-check` antes de cada release.
- Monitorar changelog de `next`, `react`, `prisma`, `firebase`, `sendpulse` para patches críticos.

## Acesso ao Servidor
- Crie usuário `svlentes` sem shell interativo; use SSH com chaves.
- Habilite `ufw` com portas 22, 80, 443 (e 5000 apenas interna se necessário).
- Sincronize horário (`timedatectl set-ntp true`).

## LGPD e Dados Sensíveis
- `ENCRYPTION_KEY` e `MEDICAL_KEY` protegem dados de saúde; mantenha chaves separadas.
- Acesse dados médicos apenas via rotas autenticadas (`/api/assinante/**`).
- Audite logs (`/api/admin/audit/route.ts`) regularmente.

## Backup e Recuperação
- `scripts/deploy.sh` gera tarball dos releases anteriores.
- Armazene backups em bucket S3 com versionamento habilitado.
- Teste `scripts/deploy.sh rollback` trimestralmente.
