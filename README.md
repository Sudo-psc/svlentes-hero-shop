# SVlentes - Landing Page

Landing page para assinatura de lentes de contato com acompanhamento médico especializado.

**Domínio de Produção**: [svlentes.com.br](https://svlentes.com.br)  
**n8n Automation**: [saraivavision-n8n.cloud](https://saraivavision-n8n.cloud)  
**Reverse Proxy**: Caddy 2.10.2 (HTTPS automático)

## 🚀 Tecnologias

- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS v4** - Framework CSS utilitário
- **Stripe** - Gateway de pagamento internacional (Cartão de Crédito, PIX, Boleto)
- **Zod** - Validação de schemas
- **React Hook Form** - Gerenciamento de formulários
- **Framer Motion** - Animações
- **Playwright** - Testes E2E

## 📋 Pré-requisitos

- Node.js 18+
- npm (gerenciador de pacotes padrão do projeto)
- Conta no Stripe (para pagamentos - [stripe.com](https://www.stripe.com))

## 🛠️ Instalação

1. Clone o repositório
```bash
git clone <repository-url>
cd svlentes-hero-shop
```

2. Instale as dependências
```bash
npm install
```

3. Configure as variáveis de ambiente
```bash
cp .env.local.example .env.local
```

4. Edite o arquivo `.env.local` com suas chaves do Stripe e outras configurações:
```bash
# Stripe Payment Gateway
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Application URLs
NEXT_PUBLIC_APP_URL=https://svlentes.com.br
NEXTAUTH_URL=https://svlentes.com.br
```

5. Execute o projeto em desenvolvimento
```bash
npm run dev
```

6. Abra [http://localhost:3000](http://localhost:3000) no seu navegador

7. Execute as verificações locais antes de enviar alterações
```bash
npm run lint
npm run test
npm run build
npm run kluster_code_review_auto
```

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router do Next.js
├── components/
│   ├── ui/                # Componentes base
│   ├── layout/            # Header, Footer, etc.
│   ├── sections/          # Seções da landing page
│   ├── forms/             # Formulários
│   └── trust/             # Elementos de confiança
├── lib/                   # Utilitários e configurações
├── data/                  # Dados estáticos
└── types/                 # Definições TypeScript
```

## 🎯 Funcionalidades

- [x] Estrutura base Next.js 15 com App Router
- [x] Configuração Tailwind CSS v4
- [x] Tipagem TypeScript completa
- [x] Hero Section com formulário de leads
- [x] Seção de planos e preços
- [x] Integração com Stripe (Cartão de Crédito, PIX, Boleto)
- [x] Calculadora de economia
- [x] FAQ interativo
- [x] Sistema de testes (Jest + Playwright)
- [x] Animações com Framer Motion
- [x] LGPD compliance (política de privacidade)

## 🔧 Scripts Disponíveis

- `npm run dev` - Executa em modo desenvolvimento
- `npm run build` - Gera build de produção
- `npm run start` - Executa build de produção
- `npm run lint` - Executa linting
- `npm run test` - Roda a suíte de testes
- `npm run kluster_code_review_auto` - Executa a verificação automática Kluster

## 📝 Especificações

Este projeto segue as especificações detalhadas em:
- `.kiro/specs/landing-page-assinatura-lentes/requirements.md`
- `.kiro/specs/landing-page-assinatura-lentes/design.md`
- `.kiro/specs/landing-page-assinatura-lentes/tasks.md`

## 👨‍⚕️ Médico Responsável

**Dr. Philipe Saraiva Cruz**  
CRM: 65.870  
Especialidade: Oftalmologia

## 📞 Contato

- WhatsApp: +55 33 99860-1427
- Email: saraivavision@gmail.com
- Site: https://svlentes.shop

## 📄 Licença

Este projeto é propriedade privada da SVlentes.