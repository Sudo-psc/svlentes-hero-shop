#!/bin/bash

# ============================================================================
# Verificação Remota de Variáveis Stripe em Produção
# ============================================================================
# Execute este script no SERVIDOR DE PRODUÇÃO via SSH
#
# Uso:
#   ssh user@svlentes.com.br
#   bash <(curl -s https://raw.githubusercontent.com/Sudo-psc/svlentes-hero-shop/master/scripts/check-production-stripe.sh)
#
# Ou copie este arquivo para o servidor e execute:
#   ./check-production-stripe.sh
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
echo -e "${CYAN}║     VERIFICAÇÃO STRIPE - SERVIDOR DE PRODUÇÃO                 ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================================
# 1. DETECTAR TIPO DE DEPLOY
# ============================================================================
echo -e "${CYAN}1. Detectando tipo de deploy...${NC}"

DEPLOY_TYPE="unknown"

if command -v docker &> /dev/null && docker ps &> /dev/null; then
  DEPLOY_TYPE="docker"
  echo -e "${GREEN}${CHECK} Docker detectado${NC}"
elif systemctl list-units --type=service | grep -q "svlentes"; then
  DEPLOY_TYPE="systemd"
  echo -e "${GREEN}${CHECK} Systemd service detectado${NC}"
elif [ -d /var/www/svlentes-hero-shop ]; then
  DEPLOY_TYPE="traditional"
  echo -e "${GREEN}${CHECK} Deploy tradicional detectado${NC}"
else
  echo -e "${YELLOW}${WARN} Tipo de deploy não identificado${NC}"
fi

echo ""

# ============================================================================
# 2. VERIFICAR VARIÁVEIS DE AMBIENTE
# ============================================================================
echo -e "${CYAN}2. Verificando variáveis de ambiente...${NC}"

case $DEPLOY_TYPE in
  docker)
    echo -e "${CYAN}Verificando variáveis no Docker...${NC}"
    
    # Listar containers
    CONTAINERS=$(docker ps --format "{{.Names}}" | grep -E "svlentes|app|web" | head -1)
    
    if [ -z "$CONTAINERS" ]; then
      echo -e "${RED}${CROSS} Nenhum container encontrado${NC}"
      exit 1
    fi
    
    echo -e "${GREEN}${CHECK} Container encontrado: ${CONTAINERS}${NC}"
    echo ""
    
    # Verificar variáveis Stripe
    echo -e "${CYAN}Variáveis STRIPE no container:${NC}"
    docker exec $CONTAINERS env | grep -i STRIPE | while read line; do
      KEY=$(echo $line | cut -d'=' -f1)
      VALUE=$(echo $line | cut -d'=' -f2)
      
      # Mostrar apenas prefixo da chave
      if [[ $KEY == *"KEY"* ]] || [[ $KEY == *"SECRET"* ]]; then
        PREFIX=$(echo $VALUE | cut -c1-8)
        LENGTH=${#VALUE}
        echo -e "  ${CYAN}${KEY}:${NC} ${PREFIX}... (${LENGTH} chars)"
        
        # Validar prefixo
        if [[ $VALUE == pk_live_* ]]; then
          echo -e "    ${GREEN}${CHECK} Prefixo válido: PRODUÇÃO (pk_live_)${NC}"
        elif [[ $VALUE == pk_test_* ]]; then
          echo -e "    ${YELLOW}${WARN} Prefixo: TEST MODE (pk_test_)${NC}"
        elif [[ $VALUE == sk_live_* ]]; then
          echo -e "    ${GREEN}${CHECK} Prefixo válido: PRODUÇÃO (sk_live_)${NC}"
        elif [[ $VALUE == sk_test_* ]]; then
          echo -e "    ${YELLOW}${WARN} Prefixo: TEST MODE (sk_test_)${NC}"
        elif [[ $VALUE == whsec_* ]]; then
          echo -e "    ${GREEN}${CHECK} Webhook secret válido${NC}"
        elif [[ $VALUE == prctbl_* ]]; then
          echo -e "    ${GREEN}${CHECK} Pricing Table ID válido${NC}"
        else
          echo -e "    ${RED}${CROSS} Prefixo inválido${NC}"
        fi
      else
        echo -e "  ${CYAN}${KEY}:${NC} ${VALUE}"
      fi
    done
    ;;
    
  systemd)
    echo -e "${CYAN}Verificando variáveis no Systemd...${NC}"
    
    SERVICE=$(systemctl list-units --type=service | grep svlentes | awk '{print $1}' | head -1)
    
    if [ -z "$SERVICE" ]; then
      echo -e "${RED}${CROSS} Service não encontrado${NC}"
      exit 1
    fi
    
    echo -e "${GREEN}${CHECK} Service encontrado: ${SERVICE}${NC}"
    echo ""
    
    # Verificar variáveis de ambiente
    echo -e "${CYAN}Variáveis no systemd:${NC}"
    sudo systemctl show $SERVICE | grep -i Environment= | grep -i STRIPE
    ;;
    
  traditional)
    echo -e "${CYAN}Verificando arquivos .env...${NC}"
    
    if [ -f /var/www/svlentes-hero-shop/.env.production ]; then
      echo -e "${GREEN}${CHECK} Arquivo .env.production encontrado${NC}"
      echo ""
      echo -e "${CYAN}Variáveis STRIPE:${NC}"
      grep -i STRIPE /var/www/svlentes-hero-shop/.env.production | while read line; do
        KEY=$(echo $line | cut -d'=' -f1)
        VALUE=$(echo $line | cut -d'=' -f2)
        PREFIX=$(echo $VALUE | cut -c1-8)
        LENGTH=${#VALUE}
        echo -e "  ${CYAN}${KEY}:${NC} ${PREFIX}... (${LENGTH} chars)"
      done
    else
      echo -e "${RED}${CROSS} Arquivo .env.production não encontrado${NC}"
    fi
    ;;
    
  *)
    echo -e "${RED}${CROSS} Não foi possível detectar o ambiente${NC}"
    exit 1
    ;;
esac

echo ""

# ============================================================================
# 3. TESTAR HEALTH CHECK
# ============================================================================
echo -e "${CYAN}3. Testando health check...${NC}"

HEALTH_URL="https://svlentes.com.br/api/health/stripe"

if command -v curl &> /dev/null; then
  HEALTH_RESPONSE=$(curl -s $HEALTH_URL 2>/dev/null || echo '{"status":"error"}')
  
  if command -v jq &> /dev/null; then
    echo ""
    echo -e "${CYAN}Resposta do health check:${NC}"
    echo "$HEALTH_RESPONSE" | jq .
    
    STATUS=$(echo $HEALTH_RESPONSE | jq -r '.status')
    
    if [ "$STATUS" == "healthy" ]; then
      echo ""
      echo -e "${GREEN}${CHECK} Health check: HEALTHY${NC}"
    elif [ "$STATUS" == "degraded" ]; then
      echo ""
      echo -e "${YELLOW}${WARN} Health check: DEGRADED${NC}"
      echo ""
      echo -e "${YELLOW}Warnings:${NC}"
      echo "$HEALTH_RESPONSE" | jq -r '.warnings[]'
    else
      echo ""
      echo -e "${RED}${CROSS} Health check: ERROR${NC}"
    fi
  else
    echo ""
    echo -e "${CYAN}Resposta do health check (instale jq para formatação):${NC}"
    echo "$HEALTH_RESPONSE"
  fi
else
  echo -e "${YELLOW}${WARN} curl não instalado - pulando teste${NC}"
fi

echo ""

# ============================================================================
# 4. VERIFICAR LOGS (se disponível)
# ============================================================================
echo -e "${CYAN}4. Logs recentes (últimas 50 linhas)...${NC}"

case $DEPLOY_TYPE in
  docker)
    echo ""
    docker logs --tail 50 $CONTAINERS | grep -i stripe || echo -e "${YELLOW}${WARN} Nenhum log Stripe encontrado${NC}"
    ;;
    
  systemd)
    echo ""
    sudo journalctl -u $SERVICE -n 50 --no-pager | grep -i stripe || echo -e "${YELLOW}${WARN} Nenhum log Stripe encontrado${NC}"
    ;;
    
  traditional)
    if [ -f /var/log/svlentes/app.log ]; then
      tail -50 /var/log/svlentes/app.log | grep -i stripe || echo -e "${YELLOW}${WARN} Nenhum log Stripe encontrado${NC}"
    else
      echo -e "${YELLOW}${WARN} Arquivo de log não encontrado${NC}"
    fi
    ;;
esac

echo ""

# ============================================================================
# 5. INSTRUÇÕES FINAIS
# ============================================================================
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                      RESULTADO DA VERIFICAÇÃO                  ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${CYAN}Comandos úteis:${NC}"
echo ""

case $DEPLOY_TYPE in
  docker)
    echo -e "${YELLOW}Ver variáveis completas:${NC}"
    echo -e "  docker exec $CONTAINERS env | grep STRIPE"
    echo ""
    echo -e "${YELLOW}Ver logs completos:${NC}"
    echo -e "  docker logs -f $CONTAINERS"
    echo ""
    echo -e "${YELLOW}Reiniciar container:${NC}"
    echo -e "  docker compose restart $CONTAINERS"
    ;;
    
  systemd)
    echo -e "${YELLOW}Ver variáveis completas:${NC}"
    echo -e "  sudo systemctl show $SERVICE | grep Environment="
    echo ""
    echo -e "${YELLOW}Ver logs completos:${NC}"
    echo -e "  sudo journalctl -u $SERVICE -f"
    echo ""
    echo -e "${YELLOW}Reiniciar service:${NC}"
    echo -e "  sudo systemctl restart $SERVICE"
    ;;
esac

echo ""
echo -e "${CYAN}Testar página:${NC}"
echo -e "  ${YELLOW}https://svlentes.com.br/planos${NC}"
echo ""
echo -e "${CYAN}Verificar health check:${NC}"
echo -e "  ${YELLOW}curl https://svlentes.com.br/api/health/stripe | jq${NC}"
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Verificação concluída!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
