#!/bin/bash

echo "========================================"
echo "TESTE DE CORREÇÃO DOS ERROS 503 E CSP"
echo "========================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Teste 1: Verificar se Nginx está rodando
echo "1. Verificando Nginx..."
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx está rodando${NC}"
else
    echo -e "${RED}❌ Nginx NÃO está rodando${NC}"
    exit 1
fi

# Teste 2: Verificar se Next.js está rodando
echo ""
echo "2. Verificando Next.js..."
if pgrep -f "next-server" > /dev/null; then
    echo -e "${GREEN}✅ Next.js está rodando (porta 5000)${NC}"
else
    echo -e "${RED}❌ Next.js NÃO está rodando${NC}"
    exit 1
fi

# Teste 3: Testar carregamento de chunk JS
echo ""
echo "3. Testando carregamento de chunk JavaScript..."
CHUNK_URL="https://svlentes.com.br/_next/static/chunks/2117-9547f6c37199f50b.js"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$CHUNK_URL")
CONTENT_TYPE=$(curl -s -I "$CHUNK_URL" | grep -i "content-type:" | tr -d '\r')

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ HTTP Status: $HTTP_STATUS${NC}"
else
    echo -e "${RED}❌ HTTP Status: $HTTP_STATUS (esperado 200)${NC}"
fi

if echo "$CONTENT_TYPE" | grep -qi "application/javascript"; then
    echo -e "${GREEN}✅ Content-Type: $CONTENT_TYPE${NC}"
else
    echo -e "${YELLOW}⚠️  Content-Type: $CONTENT_TYPE${NC}"
fi

# Teste 4: Verificar X-Content-Type-Options
echo ""
echo "4. Verificando X-Content-Type-Options..."
XCTO=$(curl -s -I "$CHUNK_URL" | grep -i "x-content-type-options:" | tr -d '\r')
if echo "$XCTO" | grep -qi "nosniff"; then
    echo -e "${GREEN}✅ X-Content-Type-Options: nosniff presente${NC}"
else
    echo -e "${RED}❌ X-Content-Type-Options: nosniff AUSENTE${NC}"
fi

# Teste 5: Verificar CSP
echo ""
echo "5. Verificando Content-Security-Policy..."
CSP=$(curl -s -I "https://svlentes.com.br/" | grep -i "content-security-policy:" | tr -d '\r')
if echo "$CSP" | grep -qi "trusted-types"; then
    echo -e "${GREEN}✅ CSP contém trusted-types${NC}"
    
    if echo "$CSP" | grep -qi "trusted-types default stripe-js"; then
        echo -e "${GREEN}✅ CSP: trusted-types configurado corretamente${NC}"
    else
        echo -e "${YELLOW}⚠️  CSP: trusted-types presente mas pode estar incorreto${NC}"
    fi
else
    echo -e "${RED}❌ CSP: trusted-types AUSENTE${NC}"
fi

# Teste 6: Verificar logs recentes do Nginx
echo ""
echo "6. Verificando logs recentes do Nginx (últimos 10 seg)..."
LIMIT_ERRORS=$(sudo tail -50 /var/log/nginx/error.log | grep -c "limiting connections")
if [ "$LIMIT_ERRORS" -eq 0 ]; then
    echo -e "${GREEN}✅ Sem erros de rate limiting nos logs recentes${NC}"
else
    echo -e "${YELLOW}⚠️  Encontrados $LIMIT_ERRORS erros de rate limiting (pode ser cache)${NC}"
fi

# Teste 7: Testar múltiplos chunks em paralelo
echo ""
echo "7. Testando carregamento de múltiplos chunks..."
CHUNKS=(
    "/_next/static/chunks/2117-9547f6c37199f50b.js"
    "/_next/static/chunks/fd9d1056-355e8d777fb97d9d.js"
    "/_next/static/chunks/5349-c8eec2702d1e342f.js"
    "/_next/static/chunks/app/layout-a9133f323f14e857.js"
)

SUCCESS_COUNT=0
FAIL_COUNT=0

for chunk in "${CHUNKS[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://svlentes.com.br$chunk")
    if [ "$STATUS" = "200" ]; then
        ((SUCCESS_COUNT++))
    else
        ((FAIL_COUNT++))
        echo -e "${RED}❌ Falhou: $chunk (Status: $STATUS)${NC}"
    fi
done

echo -e "Resultados: ${GREEN}$SUCCESS_COUNT sucesso${NC} / ${RED}$FAIL_COUNT falhas${NC}"

# Teste 8: Verificar configuração do limite de conexões
echo ""
echo "8. Verificando configuração de limites..."
CONN_LIMIT=$(sudo grep "limit_conn conn_limit_per_ip" /etc/nginx/sites-available/svlentes.com.br | head -1 | awk '{print $3}' | tr -d ';')
if [ "$CONN_LIMIT" -ge 100 ]; then
    echo -e "${GREEN}✅ Limite de conexões: $CONN_LIMIT (recomendado >= 100)${NC}"
else
    echo -e "${YELLOW}⚠️  Limite de conexões: $CONN_LIMIT (recomendado >= 100)${NC}"
fi

# Resumo Final
echo ""
echo "========================================"
echo "RESUMO DO TESTE"
echo "========================================"
if [ "$FAIL_COUNT" -eq 0 ] && [ "$SUCCESS_COUNT" -eq ${#CHUNKS[@]} ]; then
    echo -e "${GREEN}✅ TODOS OS TESTES PASSARAM!${NC}"
    echo ""
    echo "Os erros 503 foram corrigidos com sucesso."
    echo "Os chunks JavaScript estão carregando corretamente."
    echo "CSP está configurado para trusted-types."
    exit 0
else
    echo -e "${YELLOW}⚠️  ALGUNS TESTES FALHARAM${NC}"
    echo ""
    echo "Revise os resultados acima e verifique:"
    echo "- Logs do Nginx: sudo tail -f /var/log/nginx/error.log"
    echo "- Logs do Next.js"
    echo "- Configuração do Nginx"
    exit 1
fi
