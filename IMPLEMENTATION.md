# Como Aplicar as Soluções no Servidor

## Passo 1: Preparação
1. Conectar no VPS com usuário privilegiado (`ssh svlentes@servidor`).
2. Atualizar pacotes: `sudo apt update && sudo apt upgrade -y`.
3. Instalar dependências essenciais:
   ```bash
   sudo apt install -y nginx rsync tar curl git
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs build-essential
   ```
4. Criar estrutura de diretórios:
   ```bash
   sudo mkdir -p /var/www/svlentes-hero-shop/{releases,shared,shared/logs,shared/backups}
   sudo chown -R www-data:www-data /var/www/svlentes-hero-shop
   ```

## Passo 2: Deploy de Configurações
1. Copiar arquivos novos do repositório:
   ```bash
   sudo cp nginx/production.conf /etc/nginx/nginx.conf
   sudo cp systemd/nextjs.service /etc/systemd/system/nextjs.service
   sudo mkdir -p /etc/nginx/conf.d/custom
   ```
2. Provisionar `.env`:
   ```bash
   cp .env.production.template .env.production
   # editar substituindo {{PLACEHOLDER}}
   sudo cp .env.production /var/www/svlentes-hero-shop/shared/.env
   sudo chown www-data:www-data /var/www/svlentes-hero-shop/shared/.env
   chmod 640 /var/www/svlentes-hero-shop/shared/.env
   ```
3. Sincronizar release inicial:
   ```bash
   rsync -a --exclude=.git ./ /var/www/svlentes-hero-shop/releases/${USER}-manual/
   cd /var/www/svlentes-hero-shop/releases/${USER}-manual
   npm ci --omit=dev
   npm run build
   ln -sfn /var/www/svlentes-hero-shop/releases/${USER}-manual /var/www/svlentes-hero-shop/shared/current
   ```
4. Ativar serviços:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now nextjs.service
   sudo systemctl status nextjs.service
   sudo nginx -t && sudo systemctl reload nginx
   ```

## Passo 3: Validação
1. Executar `./scripts/health-check.sh --url https://svlentes.com.br/api/health-check --once`.
2. Rodar `./scripts/diagnose.sh` e revisar relatório em `/tmp/svlentes-diagnostics`.
3. Validar acesso HTTP/HTTPS via navegador e `curl -I https://svlentes.com.br`.
4. Conferir logs (`journalctl -u nextjs -n 50`, `tail -n 50 /var/log/nginx/svlentes.error.log`).

## Passo 4: Monitoramento
1. Agendar monitoramento contínuo (opcional):
   ```bash
   sudo tee /etc/systemd/system/svlentes-monitor.service <<'UNIT'
   [Unit]
   Description=SV Lentes Monitor Loop
   After=network.target

   [Service]
   Type=simple
   User=www-data
   ExecStart=/bin/bash /var/www/svlentes-hero-shop/shared/current/scripts/monitor.sh
   Restart=always

   [Install]
   WantedBy=multi-user.target
   UNIT
   sudo systemctl daemon-reload
   sudo systemctl enable --now svlentes-monitor.service
   ```
2. Conectar `scripts/monitor.sh` a um sistema de alertas (Datadog, Slack webhook) conforme orientado em `docs/MONITORING.md`.
3. Registrar incidentes e ações no `docs/PRODUCTION_RUNBOOK.md`.
