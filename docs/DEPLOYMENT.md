# Procedimento de Deploy

## Pré-requisitos
- Ubuntu 22.04 LTS (ou compatível) com acesso sudo
- Node.js >= 20 e npm >= 10 instalados globalmente
- Nginx com módulos Brotli (ou ajuste `nginx/production.conf` para remover carregamento)
- Certificados TLS válidos em `/etc/letsencrypt/live/svlentes.com.br/`
- Diretórios padronizados:
  - Releases: `/var/www/svlentes-hero-shop/releases`
  - Shared: `/var/www/svlentes-hero-shop/shared`
- Services opcionais:
  - `pm2` (caso use PM2 ao invés de systemd)
  - `systemd` com o unit `nextjs.service`

## Deploy Inicial
1. **Preparar servidor**
   ```bash
   sudo adduser --system --group svlentes
   sudo mkdir -p /var/www/svlentes-hero-shop/{releases,shared,shared/logs,shared/backups}
   sudo chown -R svlentes:svlentes /var/www/svlentes-hero-shop
   ```
2. **Instalar dependências**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs nginx rsync tar
   ```
3. **Copiar arquivos de configuração**
   ```bash
   sudo cp nginx/production.conf /etc/nginx/nginx.conf
   sudo cp systemd/nextjs.service /etc/systemd/system/nextjs.service
   sudo mkdir -p /etc/nginx/conf.d/custom
   sudo nginx -t && sudo systemctl reload nginx
   ```
4. **Configurar variáveis**
   ```bash
   cp .env.production.template .env.production
   # substituir placeholders {{...}}
   sudo cp .env.production /var/www/svlentes-hero-shop/shared/.env
   sudo chown svlentes:svlentes /var/www/svlentes-hero-shop/shared/.env
   ```
5. **Sincronizar repositório**
   ```bash
   rsync -a --exclude=.git ./ /var/www/svlentes-hero-shop/releases/initial/
   ```
6. **Instalar dependências de produção**
   ```bash
   cd /var/www/svlentes-hero-shop/releases/initial
   npm ci --omit=dev
   npm run build
   ln -sfn /var/www/svlentes-hero-shop/releases/initial /var/www/svlentes-hero-shop/shared/current
   ```
7. **Iniciar serviço**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now nextjs.service
   sudo systemctl status nextjs.service
   ```
8. **Validar**
   ```bash
   ./scripts/health-check.sh --url https://svlentes.com.br/api/health-check --once
   ```

## Deploy de Atualização
1. `git pull` no repositório local.
2. Atualizar `.env.production` conforme necessário.
3. Executar testes locais:
   ```bash
   npm run lint
   npm run test
   ./scripts/test-local.sh
   ```
4. Aplicar deploy remoto:
   ```bash
   ./scripts/deploy.sh production
   ```
5. Confirmar saúde do serviço:
   ```bash
   ./scripts/health-check.sh --url https://svlentes.com.br/api/health-check --once
   ```
6. Revisar logs:
   ```bash
   journalctl -u nextjs -n 50
   tail -n 50 /var/log/nginx/svlentes.error.log
   ```

## Rollback
1. Rodar script dedicado:
   ```bash
   ./scripts/deploy.sh rollback
   ```
2. Validar saúde novamente via `scripts/health-check.sh`.
3. Se necessário, restaurar banco/dados a partir dos snapshots documentados pelo time de dados.

## Verificação Pós-Deploy
- `curl -I https://svlentes.com.br` retorna `200` e cabeçalhos de segurança.
- Dashboard do assinante acessível (`/area-assinante/dashboard`).
- Endpoints críticos respondendo: `/api/health-check`, `/api/create-checkout`, `/api/assinante/subscription`.
- Webhooks registrando eventos (consultar `src/app/api/webhooks/*`).
- Logs sem erros críticos (`journalctl -u nextjs`, `/var/log/nginx/svlentes.error.log`).
