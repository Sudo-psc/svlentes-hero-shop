#!/bin/bash

# ============================================================================
# Script de Teste Pós-Configuração Stripe
# ============================================================================
# Execute após configurar .env.local e fazer build
#
# Uso: ./scripts/test-stripe-setup.sh
# ============================================================================

set -e

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Símbolos
CHECK="✓"
CROSS="✗"
WARN="⚠"

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           TESTE DE CONFIGURAÇÃO STRIPE - RÁPIDO               ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================================
# 1. VERIFICAR ARQUIVO .env.local
# ============================================================================
echo -e "${CYAN}1. Verificando arquivo .env.local...${NC}"

if [ ! -f .env.local ]; then
  echo -e "${RED}${CROSS} Arquivo .env.local não encontrado!${NC}"
  echo ""
  echo -e "${YELLOW}Crie o arquivo com:${NC}"
  echo -e "  cp .env.production.template .env.local"
  echo -e "  nano .env.local"
  echo ""
  exit 1
fi

echo -e "${GREEN}${CHECK} Arquivo .env.local encontrado${NC}"

# Verificar se as variáveis Stripe estão definidas
MISSING_VARS=()

if ! grep -q "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=" .env.local || grep -q "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY={{" .env.local; then
  MISSING_VARS+=("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY")
fi

if ! grep -q "STRIPE_SECRET_KEY=" .env.local || grep -q "STRIPE_SECRET_KEY={{" .env.local; then
  MISSING_VARS+=("STRIPE_SECRET_KEY")
fi

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo -e "${RED}${CROSS} Variáveis não configuradas:${NC}"
  for var in "${MISSING_VARS[@]}"; do
    echo -e "  - ${YELLOW}$var${NC}"
  done
  echo ""
  echo -e "${YELLOW}Configure as variáveis no .env.local com valores reais do Dashboard Stripe${NC}"
  exit 1
fi

echo -e "${GREEN}${CHECK} Variáveis Stripe configuradas${NC}"

# Verificar prefixos
PUB_KEY=$(grep "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=" .env.local | cut -d'=' -f2)
SEC_KEY=$(grep "STRIPE_SECRET_KEY=" .env.local | cut -d'=' -f2)

echo ""
echo -e "${CYAN}Verificando prefixos das chaves:${NC}"

# Publishable Key
if [[ $PUB_KEY == pk_live_* ]]; then
  echo -e "  ${GREEN}${CHECK} Publishable Key: PRODUÇÃO (pk_live_...)${NC}"
elif [[ $PUB_KEY == pk_test_* ]]; then
  echo -e "  ${YELLOW}${WARN} Publishable Key: TEST (pk_test_...)${NC}"
else
  echo -e "  ${RED}${CROSS} Publishable Key: INVÁLIDO${NC}"
  exit 1
fi

# Secret Key
if [[ $SEC_KEY == sk_live_* ]]; then
  echo -e "  ${GREEN}${CHECK} Secret Key: PRODUÇÃO (sk_live_...)${NC}"
elif [[ $SEC_KEY == sk_test_* ]]; then
  echo -e "  ${YELLOW}${WARN} Secret Key: TEST (sk_test_...)${NC}"
else
  echo -e "  ${RED}${CROSS} Secret Key: INVÁLIDO${NC}"
  exit 1
fi

# Verificar se ambas são do mesmo ambiente
PUB_ENV=$(echo $PUB_KEY | cut -d'_' -f2)
SEC_ENV=$(echo $SEC_KEY | cut -d'_' -f2)

if [ "$PUB_ENV" != "$SEC_ENV" ]; then
  echo ""
  echo -e "${RED}${CROSS} ERRO: Chaves de ambientes diferentes!${NC}"
  echo -e "  Publishable: ${PUB_ENV}"
  echo -e "  Secret: ${SEC_ENV}"
  echo ""
  echo -e "${YELLOW}Use chaves do MESMO ambiente (ambas test ou ambas live)${NC}"
  exit 1
fi

echo -e "${GREEN}${CHECK} Ambas as chaves do ambiente: ${PUB_ENV}${NC}"

# ============================================================================
# 2. VERIFICAR BUILD
# ============================================================================
echo ""
echo -e "${CYAN}2. Verificando build do Next.js...${NC}"

if [ ! -d .next ]; then
  echo -e "${YELLOW}${WARN} Diretório .next não encontrado${NC}"
  echo -e "${CYAN}Executando build...${NC}"
  npm run build || {
    echo -e "${RED}${CROSS} Build falhou!${NC}"
    exit 1
  }
  echo -e "${GREEN}${CHECK} Build concluído${NC}"
else
  echo -e "${GREEN}${CHECK} Build encontrado${NC}"
  
  # Verificar idade do build
  BUILD_AGE=$(find .next -maxdepth 0 -mmin +60 2>/dev/null || echo "")
  if [ ! -z "$BUILD_AGE" ]; then
    echo -e "${YELLOW}${WARN} Build tem mais de 1 hora${NC}"
    echo -e "${CYAN}Recomenda-se fazer rebuild: npm run build${NC}"
  else
    echo -e "${GREEN}${CHECK} Build recente${NC}"
  fi
fi

# ============================================================================
# 3. VERIFICAR SE SERVIDOR ESTÁ RODANDO
# ============================================================================
echo ""
echo -e "${CYAN}3. Verificando servidor...${NC}"

# Verificar se porta 3000 está em uso
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo -e "${GREEN}${CHECK} Servidor rodando na porta 3000${NC}"
  
  # Testar health check
  echo ""
  echo -e "${CYAN}4. Testando endpoint /api/health/stripe...${NC}"
  
  HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health/stripe 2>/dev/null || echo '{"status":"error"}')
  HEALTH_STATUS=$(echo $HEALTH_RESPONSE | grep -o '"status":"[^"]*"' | cut -d':' -f2 | tr -d '"')
  
  if [ "$HEALTH_STATUS" == "healthy" ]; then
    echo -e "${GREEN}${CHECK} Health check: HEALTHY${NC}"
    
    # Mostrar detalhes
    ENVIRONMENT=$(echo $HEALTH_RESPONSE | grep -o '"environment":"[^"]*"' | cut -d':' -f2 | tr -d '"')
    echo -e "  Ambiente: ${CYAN}$ENVIRONMENT${NC}"
    
    # Verificar warnings
    WARNINGS=$(echo $HEALTH_RESPONSE | grep -o '"warnings":\[[^\]]*\]')
    if [ ! -z "$WARNINGS" ] && [ "$WARNINGS" != '"warnings":[]' ]; then
      echo -e "${YELLOW}${WARN} Warnings detectados:${NC}"
      echo "$HEALTH_RESPONSE" | jq -r '.warnings[]' 2>/dev/null || echo "  (Use jq para ver detalhes)"
    fi
    
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ CONFIGURAÇÃO STRIPE OK!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${CYAN}Próximos passos:${NC}"
    echo -e "  1. Abrir: ${YELLOW}http://localhost:3000/planos${NC}"
    echo -e "  2. DevTools → Network → Filtrar 'stripe'"
    echo -e "  3. Verificar Console para erros"
    echo ""
    echo -e "${CYAN}Health check completo:${NC}"
    echo -e "  ${YELLOW}curl http://localhost:3000/api/health/stripe | jq${NC}"
    echo ""
    
  elif [ "$HEALTH_STATUS" == "degraded" ]; then
    echo -e "${YELLOW}${WARN} Health check: DEGRADED${NC}"
    echo ""
    echo -e "${YELLOW}Warnings:${NC}"
    echo "$HEALTH_RESPONSE" | jq -r '.warnings[]' 2>/dev/null || echo "  (Use jq para ver detalhes)"
    echo ""
    echo -e "${CYAN}Revise as configurações e corrija os warnings.${NC}"
    
  else
    echo -e "${RED}${CROSS} Health check: ERROR${NC}"
    echo ""
    echo -e "${RED}Resposta:${NC}"
    echo "$HEALTH_RESPONSE" | jq . 2>/dev/null || echo "$HEALTH_RESPONSE"
    echo ""
    exit 1
  fi
  
else
  echo -e "${YELLOW}${WARN} Servidor não está rodando${NC}"
  echo ""
  echo -e "${CYAN}Iniciando servidor...${NC}"
  echo -e "${YELLOW}Execute em outro terminal: npm run start${NC}"
  echo ""
  echo -e "${CYAN}Após iniciar, execute este script novamente:${NC}"
  echo -e "  ${YELLOW}./scripts/test-stripe-setup.sh${NC}"
  echo ""
fi

echo ""
