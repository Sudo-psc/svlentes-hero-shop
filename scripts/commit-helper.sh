#!/bin/bash

# Script auxiliar para criar commits seguindo Conventional Commits
# Uso: ./scripts/commit-helper.sh

set -e

echo "🚀 Assistente de Commit - Conventional Commits"
echo "================================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Tipos de commit
echo "${BLUE}Selecione o tipo de commit:${NC}"
echo ""
echo "  1) feat      - Nova funcionalidade"
echo "  2) fix       - Correção de bug"
echo "  3) docs      - Apenas documentação"
echo "  4) style     - Formatação de código"
echo "  5) refactor  - Refatoração"
echo "  6) perf      - Melhoria de performance"
echo "  7) test      - Testes"
echo "  8) build     - Sistema de build"
echo "  9) ci        - CI/CD"
echo " 10) chore     - Outras mudanças"
echo ""

read -p "Digite o número (1-10): " type_num

case $type_num in
  1) TYPE="feat";;
  2) TYPE="fix";;
  3) TYPE="docs";;
  4) TYPE="style";;
  5) TYPE="refactor";;
  6) TYPE="perf";;
  7) TYPE="test";;
  8) TYPE="build";;
  9) TYPE="ci";;
  10) TYPE="chore";;
  *) echo "${RED}Opção inválida!${NC}"; exit 1;;
esac

echo ""
echo "${GREEN}Tipo selecionado: ${TYPE}${NC}"
echo ""

# Escopo (opcional)
read -p "Escopo (opcional, ex: auth, api, ui): " SCOPE

if [ ! -z "$SCOPE" ]; then
  SCOPE="($SCOPE)"
fi

# Breaking change
read -p "Este é um breaking change? (s/N): " BREAKING

if [ "$BREAKING" = "s" ] || [ "$BREAKING" = "S" ]; then
  BREAKING_FLAG="!"
  BREAKING_FOOTER="\n\nBREAKING CHANGE: "
  read -p "Descreva o breaking change: " BREAKING_DESC
  BREAKING_FOOTER="${BREAKING_FOOTER}${BREAKING_DESC}"
else
  BREAKING_FLAG=""
  BREAKING_FOOTER=""
fi

# Descrição
echo ""
read -p "Descrição curta (máx 100 caracteres): " DESCRIPTION

if [ -z "$DESCRIPTION" ]; then
  echo "${RED}Descrição é obrigatória!${NC}"
  exit 1
fi

# Corpo (opcional)
echo ""
echo "Corpo do commit (opcional, Enter para pular, Ctrl+D para finalizar):"
BODY=$(cat)

# Issues relacionadas
echo ""
read -p "Issues relacionadas (ex: #123, #456): " ISSUES

# Montar mensagem
MESSAGE="${TYPE}${SCOPE}${BREAKING_FLAG}: ${DESCRIPTION}"

if [ ! -z "$BODY" ]; then
  MESSAGE="${MESSAGE}\n\n${BODY}"
fi

if [ ! -z "$BREAKING_FOOTER" ]; then
  MESSAGE="${MESSAGE}${BREAKING_FOOTER}"
fi

if [ ! -z "$ISSUES" ]; then
  MESSAGE="${MESSAGE}\n\nCloses ${ISSUES}"
fi

# Preview
echo ""
echo "${YELLOW}Preview do commit:${NC}"
echo "================================================"
echo -e "$MESSAGE"
echo "================================================"
echo ""

read -p "Confirmar commit? (S/n): " CONFIRM

if [ "$CONFIRM" = "n" ] || [ "$CONFIRM" = "N" ]; then
  echo "${RED}Commit cancelado.${NC}"
  exit 1
fi

# Fazer commit
echo -e "$MESSAGE" | git commit -F -

echo ""
echo "${GREEN}✅ Commit criado com sucesso!${NC}"
echo ""
echo "Comandos úteis:"
echo "  git log --oneline -1  - Ver último commit"
echo "  git push              - Enviar para o repositório"
echo ""
