# Scripts de Deploy e Teste - SV Lentes

Este diretório contém scripts para automação de deploy e testes da aplicação SV Lentes.

## Scripts Disponíveis

### 1. `deploy.sh` - Script de Deploy Automatizado

Script principal para deploy da aplicação em produção com backup automático e verificações.

#### Uso
```bash
# Deploy completo com testes
sudo ./scripts/deploy.sh

# Deploy sem testes (mais rápido)
sudo ./scripts/deploy.sh --skip-tests

# Simular deploy (dry-run)
sudo ./scripts/deploy.sh --dry-run

# Verificar ajuda
./scripts/deploy.sh --help
```

#### Funcionalidades
- ✅ Verificação de dependências (Node.js 18+, npm, nginx, systemctl)
- ✅ Backup automático dos arquivos e configurações
- ✅ Execução de testes automatizados
- ✅ Build da aplicação para produção
- ✅ Gerenciamento do serviço systemd
- ✅ Health checks pós-deploy
- ✅ Limpeza de backups antigos
- ✅ Log detalhado do processo

#### Estrutura de Backup
```
/root/svlentes-hero-shop/backups/
├── backup-20250120-143022/
│   ├── src/                 # Código fonte
│   ├── public/              # Arquivos estáticos
│   ├── .next/               # Build anterior
│   ├── package*.json        # Dependências
│   ├── next.config.js       # Config Next.js
│   └── svlentes-nextjs.service # Serviço systemd
```

### 2. `test-pricing-calculator.sh` - Testes da Calculadora

Script para testar localmente a funcionalidade da calculadora de preços.

#### Uso
```bash
# Executar todos os testes
./scripts/test-pricing-calculator.sh
```

#### Testes Realizados
- ✅ Health check da aplicação
- ✅ CRUD de planos via API
- ✅ Cálculos financeiros
- ✅ Interface da calculadora
- ✅ Performance (latência < 500ms)
- ✅ Verificações de segurança básicas

#### Pré-requisitos
- Aplicação rodando em `http://localhost:3000`
- Serviço `svlentes-nextjs` ativo

### 3. `test-production.sh` - Testes em Produção

Script para testar a aplicação através do nginx em produção.

#### Uso
```bash
# Testar ambiente de produção
./scripts/test-production.sh
```

#### Testes Realizados
- ✅ Resolução DNS
- ✅ Certificado SSL/TLS
- ✅ Configuração do Nginx
- ✅ Aplicação via proxy reverso
- ✅ API da calculadora
- ✅ Performance em produção
- ✅ Headers de segurança (HSTS, CSP, etc.)
- ✅ Redirecionamentos (HTTP→HTTPS)

## Fluxo de Deploy Recomendado

### 1. Deploy Local (Desenvolvimento)
```bash
# 1. Teste local
./scripts/test-pricing-calculator.sh

# 2. Deploy em produção
sudo ./scripts/deploy.sh

# 3. Verifique produção
./scripts/test-production.sh
```

### 2. Rollback (se necessário)
```bash
# Encontre o backup mais recente
ls -la /root/svlentes-hero-shop/backups/

# Restaure manualmente se necessário
sudo systemctl stop svlentes-nextjs
sudo cp -r /root/svlentes-hero-shop/backups/backup-<timestamp>/.next /root/svlentes-hero-shop/
sudo systemctl start svlentes-nextjs
```

## Configuração

### Variáveis de Ambiente

As seguintes variáveis são usadas pelos scripts:

```bash
# Diretórios
APP_DIR="/root/svlentes-hero-shop"
BACKUP_DIR="/root/svlentes-hero-shop/backups"

# Serviços
SERVICE_NAME="svlentes-nextjs"
DOMAIN="svlentes.shop"

# Logs
LOG_FILE="/var/log/deploy-svlentes.log"
```

### Permissões

Os scripts exigem:
- `deploy.sh`: Executar como root (sudo)
- `test-*.sh`: Pode executar como usuário normal

## Solução de Problemas

### Deploy Falhou

1. **Verifique logs do deploy**:
   ```bash
   tail -f /var/log/deploy-svlentes.log
   ```

2. **Verifique logs do serviço**:
   ```bash
   journalctl -u svlentes-nextjs -n 50
   ```

3. **Verifique logs do nginx**:
   ```bash
   tail -f /var/log/nginx/error.log
   ```

4. **Verifique status dos serviços**:
   ```bash
   systemctl status svlentes-nextjs
   systemctl status nginx
   ```

### Aplicação Não Responde

1. **Verifique se o serviço está ativo**:
   ```bash
   ps aux | grep next
   ```

2. **Verifique se a porta está em uso**:
   ```bash
   netstat -tlnp | grep :3000
   ```

3. **Teste health check local**:
   ```bash
   curl http://localhost:3000/api/health-check
   ```

### Problemas de SSL

1. **Verifique validade do certificado**:
   ```bash
   certbot certificates
   ```

2. **Renove se expirado**:
   ```bash
   certbot renew --force-renewal
   systemctl reload nginx
   ```

3. **Teste conexão HTTPS**:
   ```bash
   openssl s_client -connect svlentes.shop:443 -servername svlentes.shop
   ```

## Monitoramento

### Logs Importantes
- **Deploy**: `/var/log/deploy-svlentes.log`
- **Aplicação**: `journalctl -u svlentes-nextjs -f`
- **Nginx**: `/var/log/nginx/svlentes.shop.access.log`
- **Erros Nginx**: `/var/log/nginx/error.log`

### Comandos Úteis
```bash
# Ver últimos deploys
ls -la /root/svlentes-hero-shop/backups/

# Monitorar serviço em tempo real
journalctl -u svlentes-nextjs -f

# Testar API manualmente
curl -X GET https://svlentes.shop/api/health-check

# Verificar uso de memória
systemctl status svlentes-nextjs

# Recarregar configuração nginx sem downtime
systemctl reload nginx
```

## Segurança

### Implementado
- ✅ HTTPS com HSTS
- ✅ Headers de segurança (CSP, X-Frame-Options, etc.)
- ✅ Backup automático antes do deploy
- ✅ Validação de dependências
- ✅ Health checks pós-deploy

### Recomendações
- 📌 Configure monitoramento de uptime
- 📌 Implemente alertas por email/SMS
- 📌 Use firewall para restringir acesso
- 📌 Faça backups externos regulares
- 📌 Documente qualquer alteração manual

## Suporte

Em caso de problemas:
1. Verifique os logs indicados acima
2. Consulte a documentação em `/root/svlentes-hero-shop/CLAUDE.md`
3. Verifique o status dos serviços principais
4. Use os scripts de teste para diagnóstico