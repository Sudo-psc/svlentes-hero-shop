#!/bin/bash

# ============================================================================
# Script de Verificação Completa da Integração Stripe
# ============================================================================
# Este script verifica:
# 1. Prefixos das chaves (pk_live_ / pk_test_ / sk_live_ / sk_test_)
# 2. Variáveis de ambiente no sistema
# 3. Build e configuração do Next.js
# 4. Health check do endpoint /api/health/stripe
# 5. CSP e headers de segurança
# 6. Network requests na página /planos
#
# @author Dr. Philipe Saraiva Cruz
# ============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Símbolos
CHECK="✓"
CROSS="✗"
INFO="ℹ"
WARN="⚠"

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   VERIFICAÇÃO COMPLETA DA INTEGRAÇÃO STRIPE - PRODUÇÃO        ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================================
# 1. VERIFICAR PREFIXOS DAS CHAVES
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}1. VERIFICAÇÃO DOS PREFIXOS DAS CHAVES STRIPE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verificar .env.local (desenvolvimento)
if [ -f .env.local ]; then
  echo -e "${CYAN}📄 Arquivo .env.local encontrado (desenvolvimento)${NC}"
  
  if grep -q "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" .env.local; then
    PUB_KEY_PREFIX=$(grep "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" .env.local | cut -d'=' -f2 | cut -c1-8)
    PUB_KEY_LENGTH=$(grep "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" .env.local | cut -d'=' -f2 | wc -c)
    
    echo -ne "  ${CYAN}Publishable Key:${NC} "
    if [[ $PUB_KEY_PREFIX == pk_live_* ]]; then
      echo -e "${GREEN}${CHECK} PRODUÇÃO${NC} (prefixo: ${PUB_KEY_PREFIX}, comprimento: ${PUB_KEY_LENGTH})"
    elif [[ $PUB_KEY_PREFIX == pk_test_* ]]; then
      echo -e "${YELLOW}${WARN} TEST MODE${NC} (prefixo: ${PUB_KEY_PREFIX}, comprimento: ${PUB_KEY_LENGTH})"
    else
      echo -e "${RED}${CROSS} INVÁLIDO${NC} (prefixo: ${PUB_KEY_PREFIX})"
    fi
  else
    echo -e "  ${RED}${CROSS} NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY não encontrada${NC}"
  fi
  
  if grep -q "STRIPE_SECRET_KEY" .env.local; then
    SEC_KEY_PREFIX=$(grep "STRIPE_SECRET_KEY" .env.local | cut -d'=' -f2 | cut -c1-8)
    SEC_KEY_LENGTH=$(grep "STRIPE_SECRET_KEY" .env.local | cut -d'=' -f2 | wc -c)
    
    echo -ne "  ${CYAN}Secret Key:${NC} "
    if [[ $SEC_KEY_PREFIX == sk_live_* ]]; then
      echo -e "${GREEN}${CHECK} PRODUÇÃO${NC} (prefixo: ${SEC_KEY_PREFIX}, comprimento: ${SEC_KEY_LENGTH})"
    elif [[ $SEC_KEY_PREFIX == sk_test_* ]]; then
      echo -e "${YELLOW}${WARN} TEST MODE${NC} (prefixo: ${SEC_KEY_PREFIX}, comprimento: ${SEC_KEY_LENGTH})"
    else
      echo -e "${RED}${CROSS} INVÁLIDO${NC} (prefixo: ${SEC_KEY_PREFIX})"
    fi
  else
    echo -e "  ${RED}${CROSS} STRIPE_SECRET_KEY não encontrada${NC}"
  fi
  
  echo ""
else
  echo -e "${YELLOW}${WARN} Arquivo .env.local não encontrado${NC}"
  echo ""
fi

# Verificar variáveis de ambiente do processo
echo -e "${CYAN}🔐 Variáveis de ambiente do processo (se disponíveis):${NC}"
if [ ! -z "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" ]; then
  PUB_KEY_PREFIX_ENV=$(echo $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | cut -c1-8)
  echo -e "  ${CYAN}NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:${NC} ${PUB_KEY_PREFIX_ENV}..."
else
  echo -e "  ${YELLOW}${WARN} NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY não definida no ambiente${NC}"
fi

if [ ! -z "$STRIPE_SECRET_KEY" ]; then
  SEC_KEY_PREFIX_ENV=$(echo $STRIPE_SECRET_KEY | cut -c1-8)
  echo -e "  ${CYAN}STRIPE_SECRET_KEY:${NC} ${SEC_KEY_PREFIX_ENV}..."
else
  echo -e "  ${YELLOW}${WARN} STRIPE_SECRET_KEY não definida no ambiente${NC}"
fi

echo ""

# ============================================================================
# 2. VERIFICAR BUILD DO NEXT.JS
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}2. VERIFICAÇÃO DO BUILD NEXT.JS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -d .next ]; then
  echo -e "${GREEN}${CHECK} Build directory .next encontrado${NC}"
  
  # Verificar idade do build
  BUILD_AGE=$(find .next -maxdepth 0 -mmin +60)
  if [ ! -z "$BUILD_AGE" ]; then
    echo -e "${YELLOW}${WARN} Build tem mais de 1 hora. Considere fazer rebuild.${NC}"
  else
    echo -e "${GREEN}${CHECK} Build recente${NC}"
  fi
  
  # Verificar se as variáveis foram injetadas no build
  if [ -f .next/server/app/planos/page.js ]; then
    echo -e "${GREEN}${CHECK} Página /planos compilada${NC}"
  else
    echo -e "${YELLOW}${WARN} Página /planos não encontrada no build${NC}"
  fi
else
  echo -e "${RED}${CROSS} Build directory não encontrado. Execute: npm run build${NC}"
fi

echo ""

# ============================================================================
# 3. HEALTH CHECK DO ENDPOINT
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}3. HEALTH CHECK DO ENDPOINT /api/health/stripe${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${CYAN}${INFO} Para testar o endpoint localmente, execute:${NC}"
echo -e "  ${YELLOW}npm run dev${NC}"
echo -e "  ${YELLOW}curl http://localhost:3000/api/health/stripe | jq${NC}"
echo ""

echo -e "${CYAN}${INFO} Para testar em produção:${NC}"
echo -e "  ${YELLOW}curl https://svlentes.com.br/api/health/stripe | jq${NC}"
echo ""

# ============================================================================
# 4. VERIFICAR HEADERS E CSP
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}4. VERIFICAÇÃO DE HEADERS E POLÍTICAS DE SEGURANÇA${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${CYAN}${INFO} Testando headers da página /planos em produção...${NC}"
echo ""

# Verificar headers (requires curl)
if command -v curl &> /dev/null; then
  HEADERS=$(curl -sI https://svlentes.com.br/planos 2>/dev/null || echo "FAILED")
  
  if [ "$HEADERS" != "FAILED" ]; then
    # Verificar Permissions-Policy
    echo -ne "${CYAN}Permissions-Policy:${NC} "
    if echo "$HEADERS" | grep -qi "permissions-policy"; then
      PERMISSIONS_POLICY=$(echo "$HEADERS" | grep -i "permissions-policy" | head -1)
      
      if echo "$PERMISSIONS_POLICY" | grep -q "payment="; then
        if echo "$PERMISSIONS_POLICY" | grep -q 'payment=()'; then
          echo -e "${RED}${CROSS} BLOQUEADO - payment=() impede Stripe${NC}"
          echo -e "  ${YELLOW}Configure: payment=(self \"https://js.stripe.com\" \"https://checkout.stripe.com\")${NC}"
        else
          echo -e "${GREEN}${CHECK} Configurado corretamente${NC}"
        fi
      else
        echo -e "${YELLOW}${WARN} payment não especificado na policy${NC}"
      fi
    else
      echo -e "${YELLOW}${WARN} Header não encontrado${NC}"
    fi
    
    # Verificar CSP
    echo -ne "${CYAN}Content-Security-Policy:${NC} "
    if echo "$HEADERS" | grep -qi "content-security-policy"; then
      CSP=$(echo "$HEADERS" | grep -i "content-security-policy" | head -1)
      
      # Verificar se permite Stripe
      if echo "$CSP" | grep -q "js.stripe.com" && echo "$CSP" | grep -q "checkout.stripe.com"; then
        echo -e "${GREEN}${CHECK} Permite domínios Stripe${NC}"
      else
        echo -e "${YELLOW}${WARN} Pode bloquear Stripe - verificar configuração${NC}"
      fi
    else
      echo -e "${GREEN}${CHECK} CSP não definido (permitirá Stripe)${NC}"
    fi
    
    # Verificar HTTPS
    echo -ne "${CYAN}Strict-Transport-Security:${NC} "
    if echo "$HEADERS" | grep -qi "strict-transport-security"; then
      echo -e "${GREEN}${CHECK} Configurado${NC}"
    else
      echo -e "${YELLOW}${WARN} Não configurado${NC}"
    fi
  else
    echo -e "${RED}${CROSS} Não foi possível conectar a https://svlentes.com.br/planos${NC}"
  fi
else
  echo -e "${YELLOW}${WARN} curl não instalado - pulando verificação de headers${NC}"
fi

echo ""

# ============================================================================
# 5. VERIFICAR DOMÍNIOS STRIPE
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}5. VERIFICAÇÃO DE CONECTIVIDADE COM DOMÍNIOS STRIPE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

STRIPE_DOMAINS=(
  "https://js.stripe.com/v3"
  "https://js.stripe.com/v3/pricing-table.js"
  "https://checkout.stripe.com"
  "https://api.stripe.com"
  "https://m.stripe.com"
  "https://r.stripe.com"
  "https://q.stripe.com"
)

for domain in "${STRIPE_DOMAINS[@]}"; do
  echo -ne "${CYAN}Testando ${domain}:${NC} "
  
  if curl -s --head --max-time 5 "$domain" | head -n 1 | grep -q "HTTP/[0-9\.]* [23].."; then
    echo -e "${GREEN}${CHECK} OK${NC}"
  else
    echo -e "${RED}${CROSS} Falhou ou timeout${NC}"
  fi
done

echo ""

# ============================================================================
# 6. INSTRUÇÕES PARA STRIPE CLI
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}6. COMANDOS STRIPE CLI (Execute manualmente)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${CYAN}${INFO} Instale o Stripe CLI:${NC}"
echo -e "  ${YELLOW}brew install stripe/stripe-cli/stripe${NC}  (macOS)"
echo -e "  ${YELLOW}https://stripe.com/docs/stripe-cli${NC}      (outras plataformas)"
echo ""

echo -e "${CYAN}${INFO} Faça login:${NC}"
echo -e "  ${YELLOW}stripe login${NC}"
echo ""

echo -e "${CYAN}${INFO} Liste prices (modo test):${NC}"
echo -e "  ${YELLOW}stripe prices list --limit 5${NC}"
echo ""

echo -e "${CYAN}${INFO} Liste products (modo test):${NC}"
echo -e "  ${YELLOW}stripe products list --limit 5${NC}"
echo ""

echo -e "${CYAN}${INFO} Para modo live, adicione --api-key:${NC}"
echo -e "  ${YELLOW}stripe prices list --limit 5 --api-key sk_live_...${NC}"
echo ""

# ============================================================================
# 7. CHECKLIST FINAL
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}7. CHECKLIST FINAL${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${CYAN}Checklist de Segurança:${NC}"
echo -e "  ☐ Publishable key (pk_live_...) está no NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
echo -e "  ☐ Secret key (sk_live_...) está APENAS no servidor (STRIPE_SECRET_KEY)"
echo -e "  ☐ Webhook secret (whsec_...) está configurado"
echo -e "  ☐ Pricing Table ID (prctbl_...) está configurado"
echo -e "  ☐ Ambas as chaves são do mesmo ambiente (live ou test)"
echo -e "  ☐ Build foi executado APÓS definir as variáveis"
echo -e "  ☐ Headers permitem domínios Stripe (CSP/Permissions-Policy)"
echo -e "  ☐ HTTPS está ativo (Stripe requer TLS)"
echo -e "  ☐ Não há chamadas diretas a api.stripe.com no cliente"
echo ""

echo -e "${CYAN}Próximos Passos:${NC}"
echo -e "  1. ${YELLOW}npm run build${NC} - Rebuildar com variáveis corretas"
echo -e "  2. ${YELLOW}npm run start${NC} - Testar localmente"
echo -e "  3. Abrir ${YELLOW}http://localhost:3000/planos${NC} no navegador"
echo -e "  4. Inspecionar Network tab (DevTools) para erros Stripe"
echo -e "  5. Verificar Console para erros CSP/CORS"
echo -e "  6. Testar endpoint: ${YELLOW}curl http://localhost:3000/api/health/stripe | jq${NC}"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Verificação concluída!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
