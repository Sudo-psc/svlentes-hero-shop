#!/bin/bash

echo "🔍 Testando Conexão com n8n..."
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Teste 1: Verificar se n8n está rodando
echo "1️⃣ Verificando se n8n está rodando..."
if docker ps | grep -q "n8n"; then
    echo -e "${GREEN}✅ n8n container está rodando${NC}"
    CONTAINER_ID=$(docker ps | grep n8n | awk '{print $1}')
    echo "   Container ID: $CONTAINER_ID"
else
    echo -e "${RED}❌ n8n container não encontrado${NC}"
    echo "   Execute: docker-compose up -d n8n"
    exit 1
fi
echo ""

# Teste 2: Health check
echo "2️⃣ Testando health endpoint..."
HEALTH=$(curl -s http://localhost:5678/healthz)
if [ "$HEALTH" = '{"status":"ok"}' ]; then
    echo -e "${GREEN}✅ n8n está saudável: $HEALTH${NC}"
else
    echo -e "${RED}❌ n8n não responde corretamente${NC}"
    echo "   Resposta: $HEALTH"
fi
echo ""

# Teste 3: API Key
echo "3️⃣ Verificando autenticação API..."
if [ -f .env ]; then
    source .env
    if [ -n "$N8N_API_KEY" ]; then
        echo -e "${GREEN}✅ API Key configurada no .env${NC}"
        echo "   Testing API..."
        RESPONSE=$(curl -s -H "X-N8N-API-KEY: $N8N_API_KEY" http://localhost:5678/api/v1/workflows)
        if echo "$RESPONSE" | grep -q "data"; then
            echo -e "${GREEN}✅ API Key válida e funcionando!${NC}"
            echo "   Resposta: ${RESPONSE:0:100}..."
        else
            echo -e "${RED}❌ API Key inválida ou sem permissões${NC}"
            echo "   Resposta: $RESPONSE"
        fi
    else
        echo -e "${YELLOW}⚠️  API Key não configurada no .env${NC}"
        echo "   Configure: N8N_API_KEY=sua_chave_aqui"
    fi
else
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado${NC}"
    echo "   Copie .env.example para .env e configure"
fi
echo ""

# Teste 4: MCP Build
echo "4️⃣ Verificando build do MCP Server..."
if [ -f "dist/index.js" ]; then
    echo -e "${GREEN}✅ MCP Server compilado${NC}"
    echo "   Arquivo: dist/index.js"
else
    echo -e "${RED}❌ MCP Server não compilado${NC}"
    echo "   Execute: npm run build"
fi
echo ""

# Teste 5: Acessibilidade web
echo "5️⃣ Verificando interface web..."
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5678)
if [ "$WEB_STATUS" = "200" ] || [ "$WEB_STATUS" = "302" ]; then
    echo -e "${GREEN}✅ Interface web acessível em http://localhost:5678${NC}"
    echo "   Status HTTP: $WEB_STATUS"
else
    echo -e "${RED}❌ Interface web não acessível${NC}"
    echo "   Status HTTP: $WEB_STATUS"
fi
echo ""

# Resumo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "n8n URL: http://localhost:5678"
echo "n8n API: http://localhost:5678/api/v1"
echo ""
echo "🔑 Próximos passos:"
echo "1. Acesse http://localhost:5678 e faça login"
echo "2. Vá em Settings → API → Create API Key"
echo "3. Cole a chave no arquivo .env"
echo "4. Execute este script novamente para validar"
echo ""
