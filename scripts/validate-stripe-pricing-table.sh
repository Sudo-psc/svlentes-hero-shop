#!/bin/bash

# Script de Validação Pós-Deploy do Stripe Pricing Table
# Execute após fazer rebuild e restart do servidor

echo "🔍 Validação Stripe Pricing Table - svlentes.com.br/planos"
echo "========================================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar Headers do Servidor
echo "📡 1. Verificando Headers HTTP..."
HEADERS=$(curl -sI https://svlentes.com.br/planos)

# Verificar Permissions-Policy
if echo "$HEADERS" | grep -i "permissions-policy" | grep -q "payment="; then
    PAYMENT_POLICY=$(echo "$HEADERS" | grep -i "permissions-policy" | grep -o 'payment=[^,;]*')
    
    if echo "$PAYMENT_POLICY" | grep -q 'payment=()'; then
        echo -e "${RED}❌ ERRO: payment ainda está bloqueado!${NC}"
        echo "   Header encontrado: $PAYMENT_POLICY"
        echo "   Ação: Verifique se o rebuild foi executado corretamente"
    elif echo "$PAYMENT_POLICY" | grep -q 'stripe.com'; then
        echo -e "${GREEN}✅ Payment API está permitido para Stripe${NC}"
        echo "   $PAYMENT_POLICY"
    else
        echo -e "${YELLOW}⚠️  Payment configurado, mas sem Stripe explícito${NC}"
        echo "   $PAYMENT_POLICY"
    fi
else
    echo -e "${YELLOW}⚠️  Permissions-Policy header não encontrado${NC}"
fi

echo ""

# 2. Verificar CSP
echo "📡 2. Verificando Content-Security-Policy..."
if echo "$HEADERS" | grep -qi "content-security-policy"; then
    CSP=$(echo "$HEADERS" | grep -i "content-security-policy")
    
    if echo "$CSP" | grep -q "js.stripe.com"; then
        echo -e "${GREEN}✅ CSP permite js.stripe.com${NC}"
    else
        echo -e "${RED}❌ CSP NÃO permite js.stripe.com${NC}"
    fi
    
    if echo "$CSP" | grep -q "api.stripe.com"; then
        echo -e "${GREEN}✅ CSP permite api.stripe.com${NC}"
    else
        echo -e "${YELLOW}⚠️  CSP pode não permitir api.stripe.com${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  CSP header não encontrado${NC}"
fi

echo ""

# 3. Verificar conectividade com Stripe
echo "🌐 3. Testando conectividade com Stripe..."

if curl -s --max-time 5 https://js.stripe.com/v3/ > /dev/null; then
    echo -e "${GREEN}✅ js.stripe.com/v3/ alcançável${NC}"
else
    echo -e "${RED}❌ Não foi possível alcançar js.stripe.com/v3/${NC}"
fi

if curl -s --max-time 5 https://js.stripe.com/v3/pricing-table.js > /dev/null; then
    PRICING_TABLE_SIZE=$(curl -sI https://js.stripe.com/v3/pricing-table.js | grep -i content-length | awk '{print $2}' | tr -d '\r')
    if [ ! -z "$PRICING_TABLE_SIZE" ] && [ "$PRICING_TABLE_SIZE" -gt 1000 ]; then
        echo -e "${GREEN}✅ pricing-table.js alcançável (${PRICING_TABLE_SIZE} bytes)${NC}"
    else
        echo -e "${YELLOW}⚠️  pricing-table.js pode estar retornando conteúdo vazio${NC}"
    fi
else
    echo -e "${RED}❌ Não foi possível alcançar pricing-table.js${NC}"
fi

echo ""

# 4. Instruções para validação manual no navegador
echo "🖥️  4. Validação Manual no Navegador"
echo "======================================"
echo ""
echo "Execute no DevTools Console da página /planos:"
echo ""
echo -e "${YELLOW}// Verificar elemento Stripe${NC}"
echo "document.querySelector('stripe-pricing-table');"
echo ""
echo -e "${YELLOW}// Verificar Permissions Policy${NC}"
echo "fetch(window.location.href, {method: 'HEAD'})"
echo "  .then(r => r.headers.get('permissions-policy'))"
echo "  .then(p => console.log('Permissions-Policy:', p));"
echo ""
echo -e "${YELLOW}// Verificar window.Stripe${NC}"
echo "typeof window.Stripe;"
echo ""
echo -e "${YELLOW}// Verificar erros no console${NC}"
echo "console.log('Erros:', window.__errs || []);"
echo ""

# 5. Checklist
echo "✅ Checklist Pós-Deploy"
echo "======================="
echo "[ ] 1. Rebuild executado com sucesso (npm run build)"
echo "[ ] 2. Servidor reiniciado (pm2 restart ou npm start)"
echo "[ ] 3. Cache do navegador limpo (Cmd+Shift+R)"
echo "[ ] 4. Permissions-Policy permite payment para Stripe"
echo "[ ] 5. CSP permite js.stripe.com e api.stripe.com"
echo "[ ] 6. <stripe-pricing-table> aparece no DOM"
echo "[ ] 7. Nenhum erro 503 no console"
echo "[ ] 8. Preços do Stripe são exibidos corretamente"
echo ""

echo "🎯 Resultado Final"
echo "=================="
if echo "$HEADERS" | grep -i "permissions-policy" | grep "payment=" | grep -q "stripe.com"; then
    echo -e "${GREEN}✅ CONFIGURAÇÃO CORRETA!${NC}"
    echo "O Stripe Pricing Table deve funcionar agora."
    echo ""
    echo "Se ainda houver problemas:"
    echo "1. Limpe o cache do navegador (Cmd+Shift+R)"
    echo "2. Teste em janela anônima"
    echo "3. Verifique o console do navegador por erros"
else
    echo -e "${RED}❌ CONFIGURAÇÃO INCORRETA!${NC}"
    echo "O header Permissions-Policy ainda não está correto."
    echo ""
    echo "Ações necessárias:"
    echo "1. Verifique se o rebuild foi executado"
    echo "2. Verifique se o código foi commitado e deployed"
    echo "3. Reinicie o servidor completamente"
    echo "4. Execute este script novamente"
fi

echo ""
echo "📝 Log completo salvo em: /tmp/stripe-validation.log"
echo "$HEADERS" > /tmp/stripe-validation.log

exit 0
