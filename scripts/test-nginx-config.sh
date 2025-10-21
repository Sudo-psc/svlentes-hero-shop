#!/bin/bash

# Script para testar a configuração do Nginx
# Valida sintaxe, SSL, e configurações de resiliência

set -e

echo "🔍 Testando configuração do Nginx..."
echo "=================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir status
print_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        exit 1
    fi
}

# Função para imprimir info
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Função para imprimir warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "1️⃣ Verificando sintaxe da configuração..."
nginx -t
print_status "Sintaxe da configuração está correta"

echo ""
echo "2️⃣ Verificando configurações SSL..."

# Verificar se certificados existem
if [ -f "/etc/letsencrypt/live/svlentes.com.br/fullchain.pem" ]; then
    echo -e "${GREEN}✅ Certificado SSL svlentes.com.br encontrado${NC}"

    # Verificar validade do certificado
    EXPIRY_DATE=$(openssl x509 -in /etc/letsencrypt/live/svlentes.com.br/fullchain.pem -noout -enddate | cut -d= -f2)
    EXPIRY_TIMESTAMP=$(date -d "$EXPIRY_DATE" +%s)
    CURRENT_TIMESTAMP=$(date +%s)
    DAYS_LEFT=$(( ($EXPIRY_TIMESTAMP - $CURRENT_TIMESTAMP) / 86400 ))

    if [ $DAYS_LEFT -gt 30 ]; then
        echo -e "${GREEN}✅ Certificado válido por $DAYS_LEFT dias${NC}"
    elif [ $DAYS_LEFT -gt 7 ]; then
        print_warning "Certificado expira em $DAYS_LEFT dias (renovar em breve)"
    else
        print_warning "Certificado expira em $DAYS_LEFT dias (renovação urgente!)"
    fi
else
    print_warning "Certificado SSL svlentes.com.br não encontrado"
fi

if [ -f "/etc/letsencrypt/live/svlentes.shop/fullchain.pem" ]; then
    echo -e "${GREEN}✅ Certificado SSL svlentes.shop encontrado${NC}"

    EXPIRY_DATE=$(openssl x509 -in /etc/letsencrypt/live/svlentes.shop/fullchain.pem -noout -enddate | cut -d= -f2)
    EXPIRY_TIMESTAMP=$(date -d "$EXPIRY_DATE" +%s)
    CURRENT_TIMESTAMP=$(date +%s)
    DAYS_LEFT=$(( ($EXPIRY_TIMESTAMP - $CURRENT_TIMESTAMP) / 86400 ))

    if [ $DAYS_LEFT -gt 30 ]; then
        echo -e "${GREEN}✅ Certificado válido por $DAYS_LEFT dias${NC}"
    else
        print_warning "Certificado expira em $DAYS_LEFT dias"
    fi
else
    print_warning "Certificado SSL svlentes.shop não encontrado"
fi

echo ""
echo "3️⃣ Verificando módulos do Nginx..."

# Verificar se módulos necessários estão carregados
if nginx -V 2>&1 | grep -q "http_stub_status_module"; then
    echo -e "${GREEN}✅ Módulo stub_status carregado${NC}"
else
    print_warning "Módulo stub_status não encontrado (afeta nginx_status)"
fi

if nginx -V 2>&1 | grep -q "http_limit_req_module"; then
    echo -e "${GREEN}✅ Módulo limit_req carregado${NC}"
else
    print_warning "Módulo limit_req não encontrado (afeta rate limiting)"
fi

if nginx -V 2>&1 | grep -q "http_ssl_module"; then
    echo -e "${GREEN}✅ Módulo SSL carregado${NC}"
else
    echo -e "${RED}❌ Módulo SSL não encontrado${NC}"
    exit 1
fi

if nginx -V 2>&1 | grep -q "http_gzip_module"; then
    echo -e "${GREEN}✅ Módulo gzip carregado${NC}"
else
    print_warning "Módulo gzip não encontrado (afeta compressão)"
fi

echo ""
echo "4️⃣ Verificando configurações de resiliência..."

# Verificar se o Next.js está rodando
if curl -s -f http://localhost:5000/api/health-check > /dev/null; then
    echo -e "${GREEN}✅ Next.js responder em localhost:5000${NC}"

    # Testar health check
    HEALTH_RESPONSE=$(curl -s http://localhost:5000/api/health-check)
    if echo "$HEALTH_RESPONSE" | grep -q "healthy\|status"; then
        echo -e "${GREEN}✅ Health check endpoint funcionando${NC}"
    else
        print_warning "Health check endpoint respondeu mas formato inesperado"
    fi
else
    print_warning "Next.js não está respondendo em localhost:5000"
    echo "   Inicie o serviço: systemctl start svlentes-nextjs"
fi

# Verificar portas
echo ""
echo "5️⃣ Verificando portas..."

if netstat -tlnp | grep -q ":80.*nginx"; then
    echo -e "${GREEN}✅ Nginx escutando na porta 80${NC}"
else
    print_warning "Nginx não está escutando na porta 80"
fi

if netstat -tlnp | grep -q ":443.*nginx"; then
    echo -e "${GREEN}✅ Nginx escutando na porta 443${NC}"
else
    print_warning "Nginx não está escutando na porta 443"
fi

if netstat -tlnp | grep -q ":5000.*node"; then
    echo -e "${GREEN}✅ Next.js escutando na porta 5000${NC}"
else
    print_warning "Next.js não está escutando na porta 5000"
fi

echo ""
echo "6️⃣ Verificando configurações de segurança..."

# Testar cabeçalhos de segurança
echo "Testando cabeçalhos HTTPS..."
SECURITY_HEADERS=$(curl -s -I https://svlentes.com.br 2>/dev/null || echo "")

if echo "$SECURITY_HEADERS" | grep -q "Strict-Transport-Security"; then
    echo -e "${GREEN}✅ HSTS header presente${NC}"
else
    print_warning "HSTS header não encontrado"
fi

if echo "$SECURITY_HEADERS" | grep -q "X-Frame-Options"; then
    echo -e "${GREEN}✅ X-Frame-Options header presente${NC}"
else
    print_warning "X-Frame-Options header não encontrado"
fi

if echo "$SECURITY_HEADERS" | grep -q "X-Content-Type-Options"; then
    echo -e "${GREEN}✅ X-Content-Type-Options header presente${NC}"
else
    print_warning "X-Content-Type-Options header não encontrado"
fi

echo ""
echo "7️⃣ Testando endpoints críticos..."

# Testar endpoints importantes
test_endpoint() {
    local url="$1"
    local name="$2"

    echo -n "   Testando $name... "
    if curl -s -f -m 10 "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ OK${NC}"
    else
        echo -e "${RED}❌ FALHA${NC}"
        return 1
    fi
}

test_endpoint "https://svlentes.com.br" "Homepage"
test_endpoint "https://svlentes.com.br/api/health-check" "Health Check API"
test_endpoint "https://svlentes.com.br/nginx_health" "Nginx Health"

echo ""
echo "8️⃣ Verificando logs e configurações de sistema..."

# Verificar se os logs existem e são graváveis
if [ -f "/var/log/nginx/svlentes.com.br.access.log" ]; then
    echo -e "${GREEN}✅ Access log existe${NC}"
    if [ -w "/var/log/nginx/svlentes.com.br.access.log" ]; then
        echo -e "${GREEN}✅ Access log é gravável${NC}"
    else
        print_warning "Access log não é gravável"
    fi
else
    print_warning "Access log não existe"
fi

if [ -f "/var/log/nginx/svlentes.com.br.error.log" ]; then
    echo -e "${GREEN}✅ Error log existe${NC}"
    if [ -w "/var/log/nginx/svlentes.com.br.error.log" ]; then
        echo -e "${GREEN}✅ Error log é gravável${NC}"
    else
        print_warning "Error log não é gravável"
    fi
else
    print_warning "Error log não existe"
fi

# Verificar status do serviço Nginx
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Serviço Nginx está ativo${NC}"
else
    print_warning "Serviço Nginx não está ativo"
fi

if systemctl is-enabled --quiet nginx; then
    echo -e "${GREEN}✅ Serviço Nginx está habilitado para iniciar no boot${NC}"
else
    print_warning "Serviço Nginx não está habilitado para iniciar no boot"
fi

echo ""
echo "9️⃣ Resumo da configuração de resiliência..."

# Analisar configurações específicas de resiliência
echo -e "${BLUE}Analisando configurações de resiliência implementadas:${NC}"

# Verificar upstream
if grep -q "upstream nextjs_backend" /etc/nginx/sites-available/svlentes.com.br; then
    echo -e "${GREEN}✅ Load balancing upstream configurado${NC}"
else
    print_warning "Load balancing upstream não configurado"
fi

# Verificar rate limiting
if grep -q "limit_req_zone" /etc/nginx/sites-available/svlentes.com.br; then
    echo -e "${GREEN}✅ Rate limiting configurado${NC}"
else
    print_warning "Rate limiting não configurado"
fi

# Verificar timeouts
if grep -q "proxy_next_upstream" /etc/nginx/sites-available/svlentes.com.br; then
    echo -e "${GREEN}✅ Retry e fallback configurados${NC}"
else
    print_warning "Retry e fallback não configurados"
fi

# Verificar cache
if grep -q "gzip on" /etc/nginx/sites-available/svlentes.com.br; then
    echo -e "${GREEN}✅ Compressão gzip configurada${NC}"
else
    print_warning "Compressão gzip não configurada"
fi

# Verificar fallback page
if grep -q "@fallback_page" /etc/nginx/sites-available/svlentes.com.br; then
    echo -e "${GREEN}✅ Página de fallback configurada${NC}"
else
    print_warning "Página de fallback não configurada"
fi

# Verificar health check dedicado
if grep -q "location /api/health-check" /etc/nginx/sites-available/svlentes.com.br; then
    echo -e "${GREEN}✅ Health check dedicado configurado${NC}"
else
    print_warning "Health check dedicado não configurado"
fi

echo ""
echo "🎉 Teste concluído!"
echo "=================================="

# Resumo final
echo -e "${GREEN}✅ Configuração do Nginx validada com sucesso${NC}"
echo -e "${BLUE}📊 Sistema otimizado para resiliência e performance${NC}"
echo ""
echo "📋 Comandos úteis:"
echo "   • Recarregar Nginx: systemctl reload nginx"
echo "   • Reiniciar Nginx: systemctl restart nginx"
echo "   • Verificar status: systemctl status nginx"
echo "   • Verificar logs: journalctl -u nginx -f"
echo "   • Testar config: nginx -t"
echo ""
echo "🔗 Endpoints de monitoramento:"
echo "   • Health Check: https://svlentes.com.br/api/health-check"
echo "   • Nginx Health: https://svlentes.com.br/nginx_health"
echo "   • Server Status: https://svlentes.com.br/nginx_status (interno)"
echo ""
echo -e "${YELLOW}💡 Dicas adicionais:${NC}"
echo "   • Monitore os logs regularmente para detectar problemas"
echo "   • Configure alertas para taxas de erro altas"
echo "   • Teste a página de fallback desabilitando o Next.js"
echo "   • Verifique a renovação automática dos certificados SSL"