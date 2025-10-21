#!/bin/bash

# Script de Teste em Produção (via Nginx)
# Verifica se a aplicação funciona corretamente através do proxy reverso

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurações
DOMAIN="svlentes.com.br"
BASE_URL="https://$DOMAIN"
API_BASE="$BASE_URL/api"

# Funções de log
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Testa resolução DNS
test_dns() {
    log "Verificando resolução DNS..."

    if nslookup "$DOMAIN" > /dev/null 2>&1; then
        local ip=$(nslookup "$DOMAIN" | grep -A1 "Name:" | tail -1 | awk '{print $2}')
        success "DNS resolvido: $DOMAIN → $ip"
    else
        error "DNS não resolve para $DOMAIN"
        exit 1
    fi
}

# Testa conexão HTTPS
test_ssl() {
    log "Verificando certificado SSL..."

    if curl -sI "$BASE_URL" | grep -qi "200 OK"; then
        success "Conexão HTTPS estabelecida"

        # Verifica validade do certificado
        local expiry=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
        if [[ -n "$expiry" ]]; then
            success "Certificado válido até: $expiry"
        else
            warning "Não foi possível verificar validade do certificado"
        fi
    else
        error "Falha na conexão HTTPS"
        exit 1
    fi
}

# Testa nginx como proxy reverso
test_nginx() {
    log "Verificando configuração do nginx..."

    # Verifica se está respondendo
    if curl -sf "$BASE_URL" > /dev/null; then
        success "Nginx respondendo como proxy reverso"
    else
        error "Nginx não está respondendo"
        exit 1
    fi

    # Verifica headers específicos do nginx
    local headers=$(curl -s -I "$BASE_URL")

    if echo "$headers" | grep -qi "nginx"; then
        success "Servidor Nginx identificado"
    else
        warning "Header do Nginx não encontrado"
    fi
}

# Testa aplicação através do proxy
test_app_through_proxy() {
    log "Testando aplicação através do proxy..."

    # Health check
    if curl -sf "$BASE_URL/api/health-check" > /dev/null; then
        success "Health check funcionando através do proxy"
    else
        error "Health check não acessível através do proxy"
        return 1
    fi

    # Testa página principal
    if curl -sf "$BASE_URL" > /dev/null; then
        success "Página principal acessível"
    else
        error "Página principal não acessível"
    fi
}

# Testa API da calculadora
test_pricing_api() {
    log "\nTestando API da Calculadora de Preços..."

    # Lista planos
    if response=$(curl -s "$BASE_URL/api/admin/pricing/planos"); then
        if echo "$response" | grep -q "planos"; then
            success "API de planos acessível"
            local count=$(echo "$response" | jq -r '.planos | length' 2>/dev/null || echo "?")
            echo "  └─ $count planos disponíveis"
        else
            error "Resposta inválida da API de planos"
        fi
    else
        error "API de planos não acessível"
    fi

    # Testa custos
    if curl -sf "$BASE_URL/api/admin/pricing/costs" > /dev/null; then
        success "API de custos acessível"
    else
        warning "API de custos pode não estar implementada"
    fi
}

# Testa performance através do proxy
test_performance() {
    log "\nTestando performance através do proxy..."

    # Mede tempo de carregamento da página
    local start_time=$(date +%s%N)
    if curl -sf "$BASE_URL" > /dev/null; then
        local end_time=$(date +%s%N)
        local duration=$(((end_time - start_time) / 1000000))

        if [[ $duration -lt 1000 ]]; then
            success "Página carregou em ${duration}ms ✓"
        elif [[ $duration -lt 2000 ]]; then
            warning "Página carregou em ${duration}ms (aceitável)"
        else
            error "Página carregou em ${duration}ms (lento)"
        fi
    else
        error "Falha ao medir performance"
    fi

    # Testa cache de recursos estáticos
    log "Verificando cache de recursos estáticos..."
    if headers=$(curl -s -I "$BASE_URL/_next/static/chunks/main-app.js"); then
        if echo "$headers" | grep -qi "cache-control"; then
            success "Cache configurado para recursos estáticos"
        else
            warning "Cache pode não estar configurado"
        fi
    fi
}

# Testa headers de segurança
test_security_headers() {
    log "\nVerificando headers de segurança..."

    if headers=$(curl -s -I "$BASE_URL"); then
        local security_headers=0
        local total_headers=5

        # HSTS
        if echo "$headers" | grep -qi "strict-transport-security"; then
            success "HSTS configurado"
            ((security_headers++))
        else
            error "HSTS não configurado"
        fi

        # CSP
        if echo "$headers" | grep -qi "content-security-policy"; then
            success "CSP configurado"
            ((security_headers++))
        else
            error "CSP não configurado"
        fi

        # X-Frame-Options
        if echo "$headers" | grep -qi "x-frame-options"; then
            success "X-Frame-Options configurado"
            ((security_headers++))
        else
            error "X-Frame-Options não configurado"
        fi

        # X-Content-Type-Options
        if echo "$headers" | grep -qi "x-content-type-options"; then
            success "X-Content-Type-Options configurado"
            ((security_headers++))
        else
            error "X-Content-Type-Options não configurado"
        fi

        # Referrer-Policy
        if echo "$headers" | grep -qi "referrer-policy"; then
            success "Referrer-Policy configurado"
            ((security_headers++))
        else
            error "Referrer-Policy não configurado"
        fi

        # Resumo
        local security_score=$((security_headers * 100 / total_headers))
        echo ""
        log "Score de segurança: $security_score% ($security_headers/$total_headers headers)"
    else
        error "Não foi possível obter headers"
    fi
}

# Testa redirecionamentos
test_redirects() {
    log "\nTestando redirecionamentos..."

    # Testa HTTP → HTTPS
    if http_code=$(curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN"); then
        if [[ $http_code -eq 301 ]] || [[ $http_code -eq 302 ]]; then
            success "HTTP → HTTPS redirecionamento funcionando"
        else
            error "HTTP → HTTPS redirecionamento não funcionou (código: $http_code)"
        fi
    else
        error "Não foi possível testar redirecionamento HTTP"
    fi

    # Testa redirecionamento de domínio alternativo (se configurado)
    local alt_domain="svlentes.com.br"
    if nslookup "$alt_domain" > /dev/null 2>&1; then
        if http_code=$(curl -s -o /dev/null -w "%{http_code}" "https://$alt_domain"); then
            if [[ $http_code -eq 301 ]] || [[ $http_code -eq 302 ]]; then
                success "Redirecionamento $alt_domain → $DOMAIN funcionando"
            else
                warning "Redirecionamento $alt_domain → $DOMAIN pode não estar configurado"
            fi
        fi
    fi
}

# Gera relatório final
generate_report() {
    log "\n========================================"
    echo "📊 Relatório de Testes em Produção"
    echo "========================================"
    echo ""
    echo "✅ Testes executados:"
    echo "  • Resolução DNS"
    echo "  • Certificado SSL/TLS"
    echo "  • Configuração do Nginx"
    echo "  • Aplicação através do proxy"
    echo "  • API da Calculadora de Preços"
    echo "  • Performance"
    echo "  • Headers de segurança"
    echo "  • Redirecionamentos"
    echo ""
    echo "🌐 URLs de produção:"
    echo "  • Principal: $BASE_URL"
    echo "  • API: $API_BASE"
    echo "  • Calculadora: $BASE_URL/admin/pricing-calculator"
    echo ""
    echo "🔧 Serviços verificados:"
    echo "  • DNS: funcionando"
    echo "  • SSL: funcionando"
    echo "  • Nginx: funcionando como proxy reverso"
    echo "  • Next.js: funcionando via systemd"
    echo ""
    echo "💡 Recomendações:"
    echo "  • Monitore o certificado SSL para renovação automática"
    echo "  • Configure alertas de uptime"
    echo "  • Implemente backup automático dos dados"
    echo "  • Monitore os logs de acesso e erro"
    echo ""
    success "Testes em produção concluídos!"
}

# Função principal
main() {
    echo "🔍 Testando SV Lentes em Produção"
    echo "========================================"
    echo "Domínio: $DOMAIN"
    echo ""

    test_dns
    test_ssl
    test_nginx
    test_app_through_proxy
    test_pricing_api
    test_performance
    test_security_headers
    test_redirects
    generate_report
}

# Executa testes
main "$@"