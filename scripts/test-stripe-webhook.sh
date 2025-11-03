#!/bin/bash
# Script de Teste do Webhook Stripe
# Verifica se o endpoint está respondendo corretamente

echo "🧪 Testando Webhook do Stripe..."
echo "================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Endpoint do webhook
WEBHOOK_URL="https://svlentes.com.br/api/webhooks/stripe"

# Teste 1: Verificar se endpoint responde
echo "📡 Teste 1: Verificando se endpoint está acessível..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$WEBHOOK_URL")

if [ "$HTTP_STATUS" == "405" ]; then
    echo -e "${GREEN}✅ Endpoint acessível (405 Method Not Allowed é esperado para GET)${NC}"
else
    echo -e "${RED}❌ Endpoint retornou status: $HTTP_STATUS${NC}"
    echo "   Esperado: 405 (apenas POST é permitido)"
fi

echo ""

# Teste 2: POST sem signature (deve falhar com 400)
echo "📡 Teste 2: Testando POST sem signature..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d '{"type": "test"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" == "400" ] || [ "$HTTP_CODE" == "503" ]; then
    echo -e "${GREEN}✅ Endpoint rejeita requisições sem signature (código $HTTP_CODE)${NC}"
    echo "   Resposta: $BODY"
else
    echo -e "${RED}❌ Comportamento inesperado. Código: $HTTP_CODE${NC}"
    echo "   Resposta: $BODY"
fi

echo ""

# Teste 3: Verificar variáveis de ambiente
echo "🔧 Teste 3: Verificando configuração..."

if [ -f ".env.local" ]; then
    if grep -q "STRIPE_SECRET_KEY=sk_live" .env.local; then
        echo -e "${GREEN}✅ STRIPE_SECRET_KEY configurado (produção)${NC}"
    elif grep -q "STRIPE_SECRET_KEY=sk_test" .env.local; then
        echo -e "${YELLOW}⚠️  STRIPE_SECRET_KEY configurado (teste)${NC}"
    else
        echo -e "${RED}❌ STRIPE_SECRET_KEY não configurado ou inválido${NC}"
    fi

    if grep -q "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live" .env.local; then
        echo -e "${GREEN}✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY configurado (produção)${NC}"
    elif grep -q "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test" .env.local; then
        echo -e "${YELLOW}⚠️  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY configurado (teste)${NC}"
    else
        echo -e "${RED}❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY não configurado ou inválido${NC}"
    fi

    if grep -q "STRIPE_WEBHOOK_SECRET=whsec_" .env.local; then
        echo -e "${GREEN}✅ STRIPE_WEBHOOK_SECRET configurado${NC}"
    else
        echo -e "${RED}❌ STRIPE_WEBHOOK_SECRET não configurado${NC}"
        echo "   ${YELLOW}Configure seguindo o guia: claudedocs/STRIPE_WEBHOOK_SETUP_GUIDE_2025-11-03.md${NC}"
    fi
else
    echo -e "${RED}❌ Arquivo .env.local não encontrado${NC}"
fi

echo ""

# Teste 4: Verificar logs recentes
echo "📋 Teste 4: Verificando logs recentes do serviço..."
if journalctl -u svlentes-nextjs -n 10 --no-pager | grep -i "stripe" > /dev/null; then
    echo -e "${GREEN}✅ Serviço está ativo e processando eventos Stripe${NC}"
    echo "   Últimas linhas relacionadas ao Stripe:"
    journalctl -u svlentes-nextjs -n 20 --no-pager | grep -i "stripe" | tail -3
else
    echo -e "${YELLOW}⚠️  Nenhum evento Stripe nos logs recentes${NC}"
    echo "   Isso é normal se não houve atividade recente"
fi

echo ""
echo "================================"
echo "📊 Resumo dos Testes"
echo "================================"
echo ""
echo "Para configurar o webhook no Stripe Dashboard:"
echo "1. Acesse: https://dashboard.stripe.com/webhooks"
echo "2. Adicione endpoint: $WEBHOOK_URL"
echo "3. Selecione os eventos: checkout.session.completed, customer.subscription.*, invoice.payment_*"
echo "4. Copie o Webhook Secret e adicione em .env.local"
echo "5. Reinicie: systemctl restart svlentes-nextjs"
echo ""
echo "Documentação completa: claudedocs/STRIPE_WEBHOOK_SETUP_GUIDE_2025-11-03.md"
