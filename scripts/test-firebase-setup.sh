#!/bin/bash

# ============================================================================
# Teste de Configuração Firebase
# ============================================================================
# Valida configurações do Firebase Web SDK e Admin SDK
# ============================================================================

set -e

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

CHECK="✓"
CROSS="✗"
WARN="⚠"

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           TESTE DE CONFIGURAÇÃO FIREBASE                      ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================================
# 1. VERIFICAR .env.local
# ============================================================================
echo -e "${CYAN}1. Verificando arquivo .env.local...${NC}"

if [ ! -f .env.local ]; then
  echo -e "${RED}${CROSS} Arquivo .env.local não encontrado!${NC}"
  exit 1
fi

echo -e "${GREEN}${CHECK} Arquivo .env.local encontrado${NC}"
echo ""

# ============================================================================
# 2. VERIFICAR FIREBASE WEB SDK (Cliente)
# ============================================================================
echo -e "${CYAN}2. Verificando Firebase Web SDK (Cliente)...${NC}"

MISSING_WEB_VARS=()

# Verificar variáveis NEXT_PUBLIC_FIREBASE_*
if ! grep -q "NEXT_PUBLIC_FIREBASE_API_KEY=" .env.local || grep -q "NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDEMOKEY" .env.local; then
  MISSING_WEB_VARS+=("NEXT_PUBLIC_FIREBASE_API_KEY")
fi

if ! grep -q "NEXT_PUBLIC_FIREBASE_PROJECT_ID=" .env.local || grep -q "NEXT_PUBLIC_FIREBASE_PROJECT_ID=svlentes-demo" .env.local; then
  MISSING_WEB_VARS+=("NEXT_PUBLIC_FIREBASE_PROJECT_ID")
fi

if ! grep -q "NEXT_PUBLIC_FIREBASE_APP_ID=" .env.local || grep -q "NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012" .env.local; then
  MISSING_WEB_VARS+=("NEXT_PUBLIC_FIREBASE_APP_ID")
fi

if [ ${#MISSING_WEB_VARS[@]} -gt 0 ]; then
  echo -e "${RED}${CROSS} Variáveis não configuradas:${NC}"
  for var in "${MISSING_WEB_VARS[@]}"; do
    echo -e "  - ${YELLOW}$var${NC}"
  done
  echo ""
  echo -e "${YELLOW}Configure as variáveis no .env.local com valores do Firebase Console${NC}"
  echo -e "${YELLOW}Veja: docs/FIREBASE_SERVICE_ACCOUNT_SETUP.md${NC}"
else
  echo -e "${GREEN}${CHECK} Firebase Web SDK configurado${NC}"
  
  # Mostrar valores (seguros de expor)
  PROJECT_ID=$(grep "NEXT_PUBLIC_FIREBASE_PROJECT_ID=" .env.local | cut -d'=' -f2)
  API_KEY_PREFIX=$(grep "NEXT_PUBLIC_FIREBASE_API_KEY=" .env.local | cut -d'=' -f2 | cut -c1-12)
  
  echo -e "  ${CYAN}Project ID:${NC} ${PROJECT_ID}"
  echo -e "  ${CYAN}API Key:${NC} ${API_KEY_PREFIX}..."
fi

echo ""

# ============================================================================
# 3. VERIFICAR FIREBASE ADMIN SDK (Servidor)
# ============================================================================
echo -e "${CYAN}3. Verificando Firebase Admin SDK (Servidor)...${NC}"

if grep -q "FIREBASE_SERVICE_ACCOUNT_KEY=" .env.local; then
  SA_KEY=$(grep "FIREBASE_SERVICE_ACCOUNT_KEY=" .env.local | cut -d'=' -f2-)
  
  # Remover aspas
  SA_KEY=$(echo $SA_KEY | tr -d "'\"")
  
  # Verificar se ainda é demo
  if [[ $SA_KEY == *"svlentes-demo"* ]] || [[ $SA_KEY == *"DEMO_KEY"* ]]; then
    echo -e "${RED}${CROSS} Service Account ainda é DEMO!${NC}"
    echo ""
    echo -e "${YELLOW}Você precisa:${NC}"
    echo -e "  1. Gerar nova service account no Firebase Console"
    echo -e "  2. Substituir FIREBASE_SERVICE_ACCOUNT_KEY no .env.local"
    echo -e "  3. Ver: ${CYAN}docs/FIREBASE_SERVICE_ACCOUNT_SETUP.md${NC}"
    echo ""
  else
    # Tentar parsear JSON
    if echo "$SA_KEY" | jq . >/dev/null 2>&1; then
      echo -e "${GREEN}${CHECK} Service Account configurada${NC}"
      
      # Extrair informações seguras
      PROJECT_ID=$(echo "$SA_KEY" | jq -r '.project_id')
      CLIENT_EMAIL=$(echo "$SA_KEY" | jq -r '.client_email')
      
      echo -e "  ${CYAN}Project ID:${NC} ${PROJECT_ID}"
      echo -e "  ${CYAN}Client Email:${NC} ${CLIENT_EMAIL}"
      
      # Verificar se project_id corresponde
      WEB_PROJECT_ID=$(grep "NEXT_PUBLIC_FIREBASE_PROJECT_ID=" .env.local | cut -d'=' -f2)
      
      if [ "$PROJECT_ID" != "$WEB_PROJECT_ID" ]; then
        echo -e "${YELLOW}${WARN} Project IDs não correspondem!${NC}"
        echo -e "  Web SDK: ${WEB_PROJECT_ID}"
        echo -e "  Admin SDK: ${PROJECT_ID}"
      else
        echo -e "${GREEN}${CHECK} Project IDs correspondem${NC}"
      fi
      
      # Verificar se é a service account comprometida
      if [[ $CLIENT_EMAIL == *"firebase-adminsdk-fbsvc@svlentes"* ]]; then
        echo ""
        echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║  🚨  CRITICAL: SERVICE ACCOUNT COMPROMETIDA DETECTADA!  🚨     ║${NC}"
        echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${RED}Esta service account foi EXPOSTA PUBLICAMENTE 2 VEZES!${NC}"
        echo -e "${RED}Private keys expostas:${NC}"
        echo -e "${RED}  1. d75e6515d4ee70a0c402d6d63eac305b4412e4da${NC}"
        echo -e "${RED}  2. 4f3e0f4ce348e99da76ce0ce7ca4d239afbf822c${NC}"
        echo ""
        echo -e "${RED}⚠️  VOCÊ DEVE DELETAR (não apenas revogar) ESTA SERVICE ACCOUNT!${NC}"
        echo ""
        echo -e "${YELLOW}AÇÕES URGENTES:${NC}"
        echo -e "  1. Acesse: ${CYAN}https://console.firebase.google.com/project/svlentes/settings/serviceaccounts/adminsdk${NC}"
        echo -e "  2. DELETAR (não revogar): ${YELLOW}firebase-adminsdk-fbsvc@svlentes.iam.gserviceaccount.com${NC}"
        echo -e "  3. Criar NOVA service account com nome diferente (ex: svlentes-admin-nov-2025)"
        echo -e "  4. Atualizar .env.local com a NOVA chave"
        echo -e "  5. Ler: ${CYAN}docs/SECURITY_ALERT_FIREBASE.md${NC}"
        echo ""
        echo -e "${RED}NÃO CONTINUE USANDO ESTA CHAVE - DADOS EM RISCO!${NC}"
        echo ""
        exit 1
      fi
      
    else
      echo -e "${RED}${CROSS} JSON inválido na FIREBASE_SERVICE_ACCOUNT_KEY${NC}"
      echo -e "${YELLOW}Verifique o formato do JSON no .env.local${NC}"
    fi
  fi
else
  echo -e "${RED}${CROSS} FIREBASE_SERVICE_ACCOUNT_KEY não encontrada${NC}"
  echo -e "${YELLOW}Adicione a variável ao .env.local${NC}"
fi

echo ""

# ============================================================================
# 4. VERIFICAR .gitignore
# ============================================================================
echo -e "${CYAN}4. Verificando segurança (.gitignore)...${NC}"

GITIGNORE_OK=true

if [ -f .gitignore ]; then
  if ! grep -q "firebase-adminsdk.*\.json" .gitignore; then
    echo -e "${YELLOW}${WARN} .gitignore não protege arquivos firebase-adminsdk*.json${NC}"
    GITIGNORE_OK=false
  fi
  
  if ! grep -q "\.env\.local" .gitignore; then
    echo -e "${YELLOW}${WARN} .gitignore não protege .env.local${NC}"
    GITIGNORE_OK=false
  fi
  
  if [ "$GITIGNORE_OK" = true ]; then
    echo -e "${GREEN}${CHECK} .gitignore configurado corretamente${NC}"
  else
    echo ""
    echo -e "${YELLOW}Adicione ao .gitignore:${NC}"
    echo -e "  ${CYAN}.env.local${NC}"
    echo -e "  ${CYAN}*firebase-adminsdk*.json${NC}"
    echo -e "  ${CYAN}.firebase-keys/${NC}"
  fi
else
  echo -e "${RED}${CROSS} .gitignore não encontrado${NC}"
fi

echo ""

# ============================================================================
# 5. VERIFICAR HISTÓRICO GIT
# ============================================================================
echo -e "${CYAN}5. Verificando histórico do Git...${NC}"

if git log --all --full-history -S "BEGIN PRIVATE KEY" 2>/dev/null | grep -q "BEGIN PRIVATE KEY"; then
  echo -e "${RED}${CROSS} CRÍTICO: Private keys encontradas no histórico do Git!${NC}"
  echo ""
  echo -e "${RED}Você DEVE limpar o histórico do Git!${NC}"
  echo -e "${YELLOW}Use BFG Repo Cleaner ou git filter-branch${NC}"
  echo ""
else
  echo -e "${GREEN}${CHECK} Nenhuma private key no histórico (ótimo!)${NC}"
fi

echo ""

# ============================================================================
# RESULTADO FINAL
# ============================================================================
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                      RESULTADO DO TESTE                        ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

ALL_OK=true

if [ ${#MISSING_WEB_VARS[@]} -gt 0 ]; then
  ALL_OK=false
fi

if grep -q "svlentes-demo\|DEMO_KEY" .env.local; then
  ALL_OK=false
fi

if [ "$ALL_OK" = true ]; then
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}✅ FIREBASE CONFIGURADO CORRETAMENTE!${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "${CYAN}Próximos passos:${NC}"
  echo -e "  1. ${YELLOW}npm run build${NC}"
  echo -e "  2. ${YELLOW}npm run start${NC}"
  echo -e "  3. Testar autenticação Firebase"
  echo ""
else
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}⚠️  CONFIGURAÇÃO INCOMPLETA${NC}"
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "${CYAN}Corrija os problemas acima e execute novamente:${NC}"
  echo -e "  ${YELLOW}./scripts/test-firebase-setup.sh${NC}"
  echo ""
  echo -e "${CYAN}Documentação:${NC}"
  echo -e "  ${YELLOW}docs/FIREBASE_SERVICE_ACCOUNT_SETUP.md${NC}"
  echo ""
fi
