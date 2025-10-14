# SV Lentes - Landing Page

## Overview
Landing page para assinaturas de lentes de contato da SV Lentes com sistema de pagamento integrado ao ASAAS.

## Projeto Migrado de Vercel para Replit
Este projeto foi migrado do Vercel para o Replit em 05/10/2025. A migração incluiu:
- Configuração para rodar no ambiente Replit (porta 5000, bind 0.0.0.0)
- Remoção do header X-Frame-Options que bloqueava o preview no iframe do Replit
- Migração do sistema de pagamento de Stripe para ASAAS

## Tecnologias
- Next.js 15.5.4
- React 18.3.1
- TypeScript
- Tailwind CSS
- ASAAS API v3 (pagamentos)
- Framer Motion (animações)
- Zod (validação)

## Sistema de Pagamentos - ASAAS

### Configuração
O projeto usa ASAAS para processar pagamentos com suporte a:
- **Boleto bancário**
- **PIX** (com QR Code)
- **Cartão de crédito**
- **Assinaturas recorrentes** (mensal/anual)

### Variáveis de Ambiente Necessárias
```env
# ASAAS Configuration (OBRIGATÓRIO - use Replit Secrets)
ASAAS_ENV=sandbox                    # ou "production"
ASAAS_API_KEY_SANDBOX=<sua_chave>   # Chave de API do ambiente sandbox
ASAAS_API_KEY_PROD=<sua_chave>      # Chave de API do ambiente produção

# ASAAS Webhook Security (RECOMENDADO)
ASAAS_WEBHOOK_TOKEN=<token_secreto>  # Token para autenticar webhooks

# Outras configurações opcionais
NEXT_PUBLIC_WHATSAPP_NUMBER=553399898026
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**IMPORTANTE**: As chaves da API ASAAS devem ser armazenadas APENAS no Replit Secrets, nunca no código ou arquivos `.env` commitados.

### URLs das APIs
- **Sandbox (Testes)**: https://sandbox.asaas.com/api/v3
- **Produção**: https://api.asaas.com/v3

### Estrutura de Arquivos ASAAS
```
src/
├── lib/
│   └── asaas.ts                    # Cliente ASAAS com funções principais
├── app/api/
│   ├── asaas/
│   │   └── create-payment/
│   │       └── route.ts            # API para criar pagamentos
│   └── webhooks/
│       └── asaas/
│           └── route.ts            # Webhook handler para notificações
└── types/
    └── asaas.ts                    # TypeScript types para ASAAS API
```

### Fluxo de Pagamento
1. Usuário seleciona plano no `SubscriptionFlow`
2. POST para `/api/asaas/create-payment` cria cliente e pagamento/assinatura
3. Usuário é redirecionado para URL de pagamento ASAAS
4. ASAAS envia notificações via webhook para `/api/webhooks/asaas`
5. Webhook processa eventos (PAYMENT_RECEIVED, PAYMENT_CONFIRMED, etc.)

### Webhooks ASAAS
Configure a URL do webhook no painel ASAAS:
```
https://<seu-dominio-replit>/api/webhooks/asaas
```

**Segurança do Webhook:**
1. No painel do ASAAS, configure um token de autenticação personalizado
2. Adicione este token como `ASAAS_WEBHOOK_TOKEN` nos Replit Secrets
3. O ASAAS enviará este token no header `asaas-access-token` de cada requisição
4. Nossa API validará o token antes de processar eventos

Eventos suportados:
- `PAYMENT_CREATED` - Pagamento criado
- `PAYMENT_RECEIVED` - Pagamento recebido
- `PAYMENT_CONFIRMED` - Pagamento confirmado
- `PAYMENT_OVERDUE` - Pagamento vencido
- `PAYMENT_REFUNDED` - Pagamento reembolsado

## Comandos

### Desenvolvimento
```bash
npm run dev           # Inicia servidor dev na porta 5000
```

### Produção
```bash
npm run build        # Build para produção
npm start            # Inicia servidor produção na porta 5000
```

### Testes
```bash
npm test             # Testes unitários com Jest
npm run test:e2e     # Testes E2E com Playwright
```

## Configuração do Replit

### Workflow
O projeto está configurado com um workflow chamado "Server" que executa:
```bash
npm run dev
```

### Deploy
Configurado para deployment autoscale:
- **Build**: `npm run build`
- **Run**: `npm start`
- Porta: 5000

## Estrutura do Projeto
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── assinatura/        # Página de assinatura
│   └── ...
├── components/            # Componentes React
│   ├── subscription/      # Fluxo de assinatura
│   ├── ui/               # Componentes UI
│   └── ...
├── lib/                   # Utilitários e integrações
│   ├── asaas.ts          # Cliente ASAAS
│   ├── stripe.ts         # Cliente Stripe (deprecado)
│   └── ...
├── types/                 # TypeScript types
└── data/                  # Dados estáticos

Backend/
└── ASAAS.postman.api.json # Documentação API ASAAS (Postman)
```

## Referências
- [Documentação ASAAS](https://docs.asaas.com/reference/comece-por-aqui)
- [API Postman Collection](Backend/ASAAS.postman.api.json)
- [Next.js Docs](https://nextjs.org/docs)

## Notas Importantes
- O projeto está configurado para rodar na porta 5000 (obrigatório no Replit)
- Servidor bind em 0.0.0.0 para permitir acesso externo
- X-Frame-Options removido para funcionar no iframe do Replit
- ASAAS configurado por padrão no ambiente sandbox para testes

## Últimas Alterações (06/10/2025)

### Correções de Deploy
- ✅ Corrigido erro de variáveis de ambiente no build
  - ASAAS client agora é lazy-initialized
  - Rotas API marcadas como `force-dynamic`
  - Build não requer secrets durante compilação
- ✅ Corrigido erro React.Children.only em `/lentes-diarias`
  - Removido `asChild` de botões problemáticos
- ✅ Corrigido erro de useSearchParams Suspense
  - Páginas com useSearchParams marcadas como dinâmicas
  - Layouts criados com `export const dynamic = 'force-dynamic'`

### Alterações Anteriores (05/10/2025)
- ✅ Migrado de Vercel para Replit
- ✅ Sistema de pagamento migrado de Stripe para ASAAS
- ✅ Configurações de porta e host ajustadas (5000, 0.0.0.0)
- ✅ Headers HTTP ajustados para Replit
- ✅ API keys ASAAS configuradas (sandbox e produção)
- ✅ Webhook handler ASAAS implementado com autenticação
- ✅ SubscriptionFlow atualizado para ASAAS
- ✅ Webhook testado com token `saraiva-vision-123`
