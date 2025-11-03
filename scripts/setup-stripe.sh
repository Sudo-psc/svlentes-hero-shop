#!/bin/bash
# Stripe Configuration Setup Script
# Author: Dr. Philipe Saraiva Cruz
# Created: 2025-11-02

set -e  # Exit on error

echo "🔐 Stripe Configuration Setup"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to prompt for input
prompt_input() {
    local var_name=$1
    local prompt_text=$2
    local is_secret=${3:-false}

    echo -e "${YELLOW}${prompt_text}${NC}"

    if [ "$is_secret" = true ]; then
        read -s value
        echo ""  # New line after secret input
    else
        read value
    fi

    echo "$value"
}

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ .env.local não encontrado!${NC}"
    echo "Criando .env.local a partir de .env.local.example..."

    if [ -f .env.local.example ]; then
        cp .env.local.example .env.local
    else
        touch .env.local
    fi
fi

echo "📝 Configurando chaves Stripe..."
echo ""

# Prompt for Stripe keys
echo -e "${GREEN}Teste (Sandbox) ou Produção?${NC}"
echo "1) Teste (Sandbox)"
echo "2) Produção"
read -p "Escolha (1 ou 2): " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo -e "${YELLOW}🧪 Modo TESTE selecionado${NC}"
    echo "Obtenha suas chaves em: https://dashboard.stripe.com/test/apikeys"
    echo ""

    STRIPE_SECRET=$(prompt_input "STRIPE_SECRET_KEY" "Cole sua Secret Key (sk_test_...)" true)
    STRIPE_PUBLIC=$(prompt_input "STRIPE_PUBLISHABLE_KEY" "Cole sua Publishable Key (pk_test_...)")
    STRIPE_WEBHOOK=$(prompt_input "STRIPE_WEBHOOK_SECRET" "Cole seu Webhook Secret (whsec_...)" true)

elif [ "$choice" = "2" ]; then
    echo ""
    echo -e "${RED}⚠️  Modo PRODUÇÃO selecionado${NC}"
    echo "Obtenha suas chaves em: https://dashboard.stripe.com/apikeys"
    echo ""

    STRIPE_SECRET=$(prompt_input "STRIPE_SECRET_KEY" "Cole sua Secret Key (sk_live_...)" true)
    STRIPE_PUBLIC=$(prompt_input "STRIPE_PUBLISHABLE_KEY" "Cole sua Publishable Key (pk_live_...)")
    STRIPE_WEBHOOK=$(prompt_input "STRIPE_WEBHOOK_SECRET" "Cole seu Webhook Secret (whsec_...)" true)
else
    echo -e "${RED}❌ Opção inválida!${NC}"
    exit 1
fi

# Update .env.local
echo ""
echo "📝 Atualizando .env.local..."

# Remove old Stripe keys
sed -i '/^STRIPE_SECRET_KEY=/d' .env.local
sed -i '/^NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=/d' .env.local
sed -i '/^STRIPE_WEBHOOK_SECRET=/d' .env.local

# Add new Stripe keys
cat >> .env.local << EOF

# Stripe Payment Integration (Updated: $(date +%Y-%m-%d))
STRIPE_SECRET_KEY=${STRIPE_SECRET}
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLIC}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK}
EOF

echo -e "${GREEN}✅ Chaves Stripe configuradas com sucesso!${NC}"
echo ""

# Validate keys
echo "🔍 Validando chaves..."

if [[ $STRIPE_SECRET == sk_test_* ]]; then
    echo -e "${YELLOW}⚠️  Secret Key é de TESTE${NC}"
elif [[ $STRIPE_SECRET == sk_live_* ]]; then
    echo -e "${GREEN}✅ Secret Key é de PRODUÇÃO${NC}"
else
    echo -e "${RED}❌ Secret Key inválida!${NC}"
    exit 1
fi

if [[ $STRIPE_PUBLIC == pk_test_* ]]; then
    echo -e "${YELLOW}⚠️  Publishable Key é de TESTE${NC}"
elif [[ $STRIPE_PUBLIC == pk_live_* ]]; then
    echo -e "${GREEN}✅ Publishable Key é de PRODUÇÃO${NC}"
else
    echo -e "${RED}❌ Publishable Key inválida!${NC}"
    exit 1
fi

if [[ $STRIPE_WEBHOOK == whsec_* ]]; then
    echo -e "${GREEN}✅ Webhook Secret válido${NC}"
else
    echo -e "${RED}❌ Webhook Secret inválido!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Configuração concluída!${NC}"
echo ""
echo "📋 Próximos Passos:"
echo "1. Gere e aplique a migração Prisma:"
echo "   npx prisma migrate dev --name add_stripe_fields"
echo ""
echo "2. Reinicie o servidor de desenvolvimento:"
echo "   npm run dev"
echo ""
echo "3. Configure o webhook no Stripe Dashboard:"
echo "   URL: https://svlentes.com.br/api/webhooks/stripe"
echo "   Eventos: customer.subscription.*, invoice.payment_*, checkout.session.completed"
echo ""
echo "4. Teste a integração acessando:"
echo "   https://svlentes.com.br/planos"
echo ""
