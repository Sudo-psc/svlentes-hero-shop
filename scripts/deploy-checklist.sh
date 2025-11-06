#!/bin/bash

# =============================================================================
# SV Lentes - Deploy Checklist Preventivo
# Script para validar todos os aspectos antes do deploy em produção
# =============================================================================

set -e  # Falhar em qualquer erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
CHECKS_TOTAL=0
CHECKS_PASSED=0
CHECKS_FAILED=0

# Funções de logging
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((CHECKS_PASSED++))
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    ((CHECKS_FAILED++))
}

log_section() {
    echo -e "\n${BLUE}🔍 $1${NC}"
    echo "================================================================================"
}

# Função principal de verificação
run_check() {
    local check_name="$1"
    local check_command="$2"
    local expected_result="$3"

    ((CHECKS_TOTAL++))
    log_info "Verificando: $check_name"

    if eval "$check_command" > /dev/null 2>&1; then
        log_success "$check_name"
        return 0
    else
        log_error "$check_name - $expected_result"
        return 1
    fi
}

# Função de verificação de arquivo
check_file_exists() {
    local file="$1"
    local description="$2"

    run_check "$description" "test -f '$file'" "Arquivo não encontrado: $file"
}

# Função de verificação de diretório
check_dir_exists() {
    local dir="$1"
    local description="$2"

    run_check "$description" "test -d '$dir'" "Diretório não encontrado: $dir"
}

# Início do checklist
echo -e "\n${BLUE}🚀 SV Lentes - Deploy Checklist Preventivo${NC}"
echo "================================================================================"
echo "Data: $(date)"
echo "Branch: $(git branch --show-current 2>/dev/null || echo 'N/A')"
echo "Commit: $(git rev-parse --short HEAD 2>/dev/null || echo 'N/A')"
echo

# 1. Verificações de Ambiente
log_section "1. 📋 Ambiente e Build"

run_check "Node.js versão >= 20" "node --version | grep -E 'v[2-9][0-9]+'"
run_check "npm versão >= 8" "npm --version | grep -E '[89]\.'"
run_check "Variáveis de ambiente críticas" "test -f .env.local && grep -q 'NEXT_PUBLIC_APP_URL' .env.local"
run_check "Database URL configurado" "test -n '$DATABASE_URL'"

# 2. Verificações de Dependências
log_section "2. 📦 Dependências e Segurança"

run_check "Instalar dependências" "npm install --silent"
run_check "Auditoria de segurança (moderate)" "npm audit --audit-level=moderate"
run_check "Build sem erros TypeScript" "npm run build --silent"
run_check "Lint sem erros críticos" "npm run lint --silent"

# 3. Verificações de Arquivos Estáticos
log_section "3. 🖼️ Assets e Recursos Estáticos"

check_file_exists "public/logo_animado.gif" "Logo animado GIF"
check_file_exists "public/logo.png" "Logo PNG principal"
check_file_exists "public/Hero2.webp" "Imagem Hero 2"
check_file_exists "public/Hero3.webp" "Imagem Hero 3"
check_file_exists "public/icones/drphilipe_perfil.webp" "Foto Dr. Philipe WebP"
check_file_exists "public/icones/drphilipe_perfil.jpeg" "Foto Dr. Philipe JPEG"

# Verificação de favicons
check_file_exists "public/favicon.ico" "Favicon ICO"
check_file_exists "public/favicon-16x16.png" "Favicon 16x16"
check_file_exists "public/favicon-32x32.png" "Favicon 32x32"
check_file_exists "public/android-chrome-192x192.png" "Favicon 192x192"
check_file_exists "public/android-chrome-512x512.png" "Favicon 512x512"

# Verificação de links simbólicos
run_check "Links simbólicos de favicons" "test -L public/favicon-192.png -a -L public/favicon-512.png"

# 4. Verificações de API e Endpoints
log_section "4. 🔌 APIs e Endpoints"

check_file_exists "src/app/api/config/route.ts" "Endpoint /api/config"
check_file_exists "src/app/api/health-check/route.ts" "Endpoint de health check"
check_file_exists "src/app/api/webhooks/asaas/route.ts" "Webhook Asaas"
check_file_exists "src/app/api/webhooks/sendpulse/route.ts" "Webhook SendPulse"

# Verificação de imports críticos
run_check "Imports do useSubscription" "grep -q 'import.*useSubscription' src/hooks/useSubscription.ts"
run_check "Configuração CSP válida" "grep -q 'script-src.*self.*unsafe-inline.*unsafe-eval' next.config.js"

# 5. Verificações de Testes
log_section "5. 🧪 Qualidade e Testes"

run_check "Testes unitários" "npm test --silent --watchAll=false"
run_check "Testes de resiliência" "npm run test:resilience --silent"
run_check "Type checking" "npx tsc --noEmit --silent"

# 6. Verificações de Performance
log_section "6. ⚡ Performance e Otimização"

if [ -d ".next" ]; then
    run_check "Tamanho do bundle < 5MB" "test $(du -sh .next 2>/dev/null | cut -f1 | sed 's/M//' | sed 's/,/./' | awk '{print int($1)}') -lt 5120"
    run_check "Assets otimizados presentes" "test -d .next/static"
fi

# 7. Verificações de Segurança
log_section "7. 🛡️ Segurança e Compliance"

run_check "Cabeçalhos de segurança configurados" "grep -q 'Content-Security-Policy' next.config.js"
run_check "Variáveis sensíveis não no commit" "! git log --oneline -n 5 | grep -qi 'password\|secret\|key'"
run_check "Permissões de arquivos seguras" "find . -name '*.env*' -type f -exec chmod 600 {} \;"

# 8. Verificações de Deploy
log_section "8. 🚀 Preparação para Deploy"

run_check "Serviço systemd configurado" "systemctl list-units --all | grep -q svlentes-nextjs"
run_check "Nginx configurado" "test -f /etc/nginx/sites-available/svlentes.com.br"
run_check "SSL certificado válido" "test -d /etc/letsencrypt/live/svlentes.com.br"

# 9. Verificação de Backup
log_section "9. 💾 Backup e Recuperação"

run_check "Backup do código atualizado" "git status --porcelain | wc -l"
run_check "Logs de deploy acessíveis" "test -w /var/log"

# Resumo final
echo
echo "================================================================================"
log_section "📊 Resumo do Checklist"

echo -e "Total de verificações: ${BLUE}$CHECKS_TOTAL${NC}"
echo -e "Verificações passadas: ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Verificações falhadas: ${RED}$CHECKS_FAILED${NC}"

# Taxa de sucesso
if [ $CHECKS_TOTAL -gt 0 ]; then
    SUCCESS_RATE=$((CHECKS_PASSED * 100 / CHECKS_TOTAL))
    echo -e "Taxa de sucesso: ${BLUE}${SUCCESS_RATE}%${NC}"
fi

# Decisão sobre deploy
echo
if [ $CHECKS_FAILED -eq 0 ]; then
    log_success "🎉 Todas as verificações passaram! Deploy seguro para prosseguir."
    echo -e "\n${GREEN}Comandos para deploy:${NC}"
    echo "  npm run build"
    echo "  systemctl restart svlentes-nextjs"
    echo "  curl -I https://svlentes.com.br"
    exit 0
elif [ $CHECKS_FAILED -le 2 ]; then
    log_warning "⚠️ Poucas falhas detectadas. Verifique manualmente antes do deploy."
    echo -e "\n${YELLOW}Comandos para deploy (após correções):${NC}"
    echo "  npm run build"
    echo "  systemctl restart svlentes-nextjs"
    echo "  curl -I https://svlentes.com.br"
    exit 1
else
    log_error "🚨 Múltiplas falhas críticas detectadas. NÃO faça deploy!"
    echo -e "\n${RED}Corrija os problemas acima e execute o checklist novamente.${NC}"
    exit 2
fi