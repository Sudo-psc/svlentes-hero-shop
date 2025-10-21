#!/bin/bash

# Script de Teste da Calculadora de Preços
# Verifica se todos os endpoints da calculadora estão funcionando

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurações
BASE_URL="http://localhost:3000"
API_BASE="$BASE_URL/api/admin/pricing"

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

# Testa se a aplicação está no ar
check_app_running() {
    log "Verificando se a aplicação está no ar..."

    if curl -sf "$BASE_URL/api/health-check" > /dev/null; then
        success "Aplicação está respondendo"
    else
        error "Aplicação não está respondendo em $BASE_URL"
        error "Inicie a aplicação com: npm run start"
        exit 1
    fi
}

# Testa endpoints da API
test_api_endpoints() {
    log "\nTestando endpoints da API..."

    # Testa listagem de planos
    log "Testando GET /api/admin/pricing/planos..."
    if response=$(curl -s "$API_BASE/planos"); then
        if echo "$response" | grep -q "planos"; then
            success "Endpoint de planos funcionando"
            echo "  └─ $(echo "$response" | jq -r '.planos | length' 2>/dev/null || echo "N") planos encontrados"
        else
            error "Resposta inesperada do endpoint de planos"
        fi
    else
        error "Falha ao acessar endpoint de planos"
    fi

    # Testa endpoint de custos
    log "Testando GET /api/admin/pricing/costs..."
    if curl -sf "$API_BASE/costs" > /dev/null; then
        success "Endpoint de custos funcionando"
    else
        warning "Endpoint de custos não respondeu (pode não estar implementado)"
    fi

    # Testa criação de plano (POST)
    log "Testando POST /api/admin/pricing/planos..."
    local test_plan='{
        "nome": "Plano Teste",
        "categoria": "basico",
        "ciclo": "mensal",
        "precoBase": 99.90,
        "ativo": true,
        "custos": {
            "taxaProcessamento": 2.99,
            "custoParcelamento": 1.5,
            "embalagens": 8.50,
            "exames": 50,
            "administrativo": 150,
            "insumos": 35,
            "operacional": 80
        },
        "beneficios": [
            {
                "id": "benef1",
                "descricao": "Lentes diárias",
                "custo": 60,
                "frequencia": "mensal",
                "incluido": true
            }
        ]
    }'

    if response=$(curl -s -X POST "$API_BASE/planos" \
        -H "Content-Type: application/json" \
        -d "$test_plan"); then
        if echo "$response" | grep -q "id"; then
            success "Criação de plano funcionando"
            local plano_id=$(echo "$response" | jq -r '.id' 2>/dev/null)

            # Testa atualização do plano
            log "Testando PUT /api/admin/pricing/planos/$plano_id..."
            if curl -sf -X PUT "$API_BASE/planos/$plano_id" \
                -H "Content-Type: application/json" \
                -d '{"nome": "Plano Teste Atualizado"}' > /dev/null; then
                success "Atualização de plano funcionando"
            else
                warning "Atualização de plano não respondeu"
            fi

            # Testa exclusão do plano
            log "Testando DELETE /api/admin/pricing/planos/$plano_id..."
            if curl -sf -X DELETE "$API_BASE/planos/$plano_id" > /dev/null; then
                success "Exclusão de plano funcionando"
            else
                warning "Exclusão de plano não respondeu"
            fi
        else
            error "Falha ao criar plano"
        fi
    else
        error "Falha na requisição POST para planos"
    fi
}

# Testa cálculos da calculadora
test_calculations() {
    log "\nTestando cálculos da calculadora..."

    # Testa cálculo de margem
    log "Testando cálculo de margem..."
    if curl -sf "$API_BASE/calculate" \
        -X POST \
        -H "Content-Type: application/json" \
        -d '{
            "precoVenda": 100,
            "custoTotal": 75
        }' > /dev/null; then
        success "Cálculo de margem funcionando"
    else
        warning "Endpoint de cálculo não encontrado"
    fi

    # Testa formatação de moeda
    log "Testando formatação BRL..."
    # Verifica se a API retorna valores formatados corretamente
    if response=$(curl -s "$API_BASE/planos"); then
        if echo "$response" | grep -q "R\$"; then
            success "Formatação BRL aplicada"
        else
            warning "Formatação BRL não encontrada na resposta"
        fi
    fi
}

# Testa página da calculadora no navegador
test_frontend() {
    log "\nTestando interface da calculadora..."

    # Verifica se a página da calculadora carrega
    if curl -sf "$BASE_URL/admin/pricing-calculator" > /dev/null; then
        success "Página da calculadora carrega"

        # Verifica se contém elementos esperados
        if response=$(curl -s "$BASE_URL/admin/pricing-calculator"); then
            if echo "$response" | grep -q "Calculadora de Preços"; then
                success "Título da página encontrado"
            else
                warning "Título da página não encontrado"
            fi

            if echo "$response" | grep -q "React"; then
                success "Componentes React carregados"
            else
                warning "Pode haver problema com SSR"
            fi
        fi
    else
        error "Página da calculadora não carrega"
    fi
}

# Testa performance
test_performance() {
    log "\nTestando performance..."

    # Mede tempo de resposta da API
    local start_time=$(date +%s%N)
    if curl -sf "$API_BASE/planos" > /dev/null; then
        local end_time=$(date +%s%N)
        local duration=$(((end_time - start_time) / 1000000))

        if [[ $duration -lt 500 ]]; then
            success "API respondeu em ${duration}ms ✓"
        elif [[ $duration -lt 1000 ]]; then
            warning "API respondeu em ${duration}ms (aceitável)"
        else
            error "API respondeu em ${duration}ms (lento)"
        fi
    else
        error "Falha ao medir performance da API"
    fi
}

# Verifica permissões e segurança
test_security() {
    log "\nVerificando segurança..."

    # Verifica se endpoints sensíveis exigem autenticação
    if response=$(curl -s "$API_BASE/planos"); then
        if echo "$response" | grep -q "admin"; then
            warning "Endpoint pode estar acessível sem autenticação"
        else
            success "Endpoint parece exigir autenticação"
        fi
    fi

    # Verifica headers de segurança
    if headers=$(curl -s -I "$BASE_URL"); then
        if echo "$headers" | grep -qi "x-frame-options"; then
            success "X-Frame-Options presente"
        else
            warning "X-Frame-Options ausente"
        fi

        if echo "$headers" | grep -qi "content-security-policy"; then
            success "CSP presente"
        else
            warning "CSP ausente"
        fi
    fi
}

# Gera relatório final
generate_report() {
    log "\n========================================"
    echo "📊 Relatório de Testes - Calculadora de Preços"
    echo "========================================"
    echo ""
    echo "✅ Testes executados:"
    echo "  • Health check da aplicação"
    echo "  • Endpoints da API (CRUD de planos)"
    echo "  • Cálculos financeiros"
    echo "  • Interface da calculadora"
    echo "  • Performance"
    echo "  • Verificações de segurança"
    echo ""
    echo "🔗 URLs testadas:"
    echo "  • Aplicação: $BASE_URL"
    echo "  • API Planos: $API_BASE/planos"
    echo "  • Calculadora: $BASE_URL/admin/pricing-calculator"
    echo ""
    echo "💡 Recomendações:"
    echo "  • Configure autenticação para os endpoints admin"
    echo "  • Monitore a performance regularmente"
    echo "  • Implemente rate limiting para proteção"
    echo ""
    success "Testes concluídos!"
}

# Função principal
main() {
    echo "🧪 Testando Calculadora de Preços - SV Lentes"
    echo "========================================"

    check_app_running
    test_api_endpoints
    test_calculations
    test_frontend
    test_performance
    test_security
    generate_report
}

# Executa testes
main "$@"