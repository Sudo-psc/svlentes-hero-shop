# 🛡️ Guia de Implementação de Melhorias de Segurança

Este guia mostra como implementar as melhorias de segurança identificadas na auditoria.

---

## 📋 Índice

1. [Rate Limiting](#1-rate-limiting)
2. [Webhook Security](#2-webhook-security)
3. [Security Logger](#3-security-logger)
4. [CSP com Nonces](#4-csp-com-nonces)
5. [File Upload Validation](#5-file-upload-validation)
6. [CORS Configuration](#6-cors-configuration)
7. [Environment Variables](#7-environment-variables)

---

## 1. Rate Limiting

### Instalação (Produção com Redis)

```bash
npm install @upstash/ratelimit @upstash/redis
```

### Uso Básico

```typescript
// src/app/api/create-checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Aplicar rate limiting
  const identifier = getClientIdentifier(request)
  const rateLimitResult = checkRateLimit(identifier, RATE_LIMIT_CONFIGS.payment)

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: 'Você excedeu o limite de requisições. Tente novamente mais tarde.',
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
        },
      }
    )
  }

  // Continue com a lógica normal...
  try {
    // Sua lógica aqui
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### Configurações por Endpoint

```typescript
// APIs públicas sensíveis
checkRateLimit(identifier, RATE_LIMIT_CONFIGS.payment)    // 5 req/5min
checkRateLimit(identifier, RATE_LIMIT_CONFIGS.public)     // 10 req/min
checkRateLimit(identifier, RATE_LIMIT_CONFIGS.webhook)    // 100 req/min
checkRateLimit(identifier, RATE_LIMIT_CONFIGS.consultation) // 20 req/min
```

---

## 2. Webhook Security

### Implementação Segura do Webhook Asaas

```typescript
// src/app/api/webhooks/asaas/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { validateAsaasWebhook, ASAAS_ALLOWED_IPS } from '@/lib/webhook-security'
import { SecurityLogger } from '@/lib/security-logger'

export async function POST(request: NextRequest) {
  // Validar webhook com todas as verificações de segurança
  const validation = await validateAsaasWebhook(request, {
    allowedIPs: ASAAS_ALLOWED_IPS,
    webhookToken: process.env.ASAAS_WEBHOOK_TOKEN,
    validateTimestamp: true,
    maxAgeMs: 5 * 60 * 1000, // 5 minutos
  })

  if (!validation.valid) {
    SecurityLogger.security('Webhook validation failed', {
      errors: validation.errors,
      clientIP: validation.clientIP,
    })

    return NextResponse.json(
      {
        error: 'Unauthorized',
        details: validation.errors,
      },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()

    SecurityLogger.webhook('asaas', body.event, {
      paymentId: body.payment?.id,
      customerId: body.payment?.customer,
      status: body.payment?.status,
    })

    // Processar evento...
    switch (body.event) {
      case 'PAYMENT_RECEIVED':
        await handlePaymentReceived(body.payment)
        break
      // Outros eventos...
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    SecurityLogger.error('Webhook processing failed', error, {
      clientIP: validation.clientIP,
    })

    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    )
  }
}
```

### Configuração de IPs Permitidos

```bash
# .env.production
ASAAS_WEBHOOK_TOKEN=your-secure-random-token-here
```

**Gerar token seguro:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 3. Security Logger

### Uso do Logger Seguro

```typescript
import { SecurityLogger } from '@/lib/security-logger'

// Log de informação (dados sensíveis são automaticamente mascarados)
SecurityLogger.info('User created', {
  userId: '123',
  email: 'usuario@example.com',  // Será mascarado: us***@example.com
  cpf: '12345678901',             // Será mascarado: ***.***.01-**
  phone: '11987654321',           // Será mascarado: (11)****-****
})

// Log de pagamento
SecurityLogger.payment('succeeded', {
  paymentId: 'pay_123',
  customerId: 'cus_123',
  amount: 199.90,
  email: 'cliente@example.com',  // Mascarado automaticamente
})

// Log de webhook
SecurityLogger.webhook('stripe', 'payment.succeeded', {
  paymentId: 'pay_123',
  customerId: 'cus_123',
})

// Log de segurança
SecurityLogger.security('Unauthorized access attempt', {
  ip: '192.168.1.1',
  path: '/api/admin',
  method: 'POST',
})

// Log de erro
try {
  // Operação que pode falhar
} catch (error) {
  SecurityLogger.error('Operation failed', error, {
    userId: '123',
    operation: 'create_subscription',
  })
}
```

### Substituir Console.log em Webhooks

**Antes (INSEGURO):**
```typescript
console.log('CUSTOMER_DATA:', {
  email: customerEmail,
  cpf: customerCPF,
  creditCard: cardNumber,  // ❌ EXPÕE DADOS SENSÍVEIS!
})
```

**Depois (SEGURO):**
```typescript
SecurityLogger.info('Customer data processed', {
  customerId: customerId,
  email: customerEmail,      // ✅ Automaticamente mascarado
  cpf: customerCPF,          // ✅ Automaticamente mascarado
  creditCard: cardNumber,    // ✅ Automaticamente mascarado
})
```

---

## 4. CSP com Nonces

### Implementação de CSP Seguro

```typescript
// next.config.js
const crypto = require('crypto')

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' https://js.stripe.com https://sandbox.asaas.com",
              "style-src 'self' 'unsafe-inline'", // Next.js requer unsafe-inline para CSS
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.stripe.com https://api.asaas.com https://sandbox.asaas.com https://api.whatsapp.com",
              "frame-src 'self' https://js.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

---

## 5. File Upload Validation

### Validação Robusta de Arquivos

```typescript
// src/lib/file-validation.ts
export async function validatePrescriptionFile(file: File): Promise<{
  valid: boolean
  errors: string[]
}> {
  const errors: string[] = []

  // 1. Validar tamanho (5MB máximo)
  const MAX_SIZE = 5 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    errors.push('Arquivo muito grande. Tamanho máximo: 5MB')
  }

  // 2. Validar tipo MIME
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
  if (!ALLOWED_TYPES.includes(file.type)) {
    errors.push('Tipo de arquivo inválido. Apenas JPG, PNG ou PDF são permitidos')
  }

  // 3. Validar magic bytes (prevenir spoofing)
  try {
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    let validMagicBytes = false

    // PDF: %PDF (0x25 0x50 0x44 0x46)
    if (file.type === 'application/pdf') {
      validMagicBytes = bytes[0] === 0x25 && bytes[1] === 0x50 && 
                       bytes[2] === 0x44 && bytes[3] === 0x46
    }

    // JPEG: FF D8 FF
    if (file.type === 'image/jpeg') {
      validMagicBytes = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF
    }

    // PNG: 89 50 4E 47
    if (file.type === 'image/png') {
      validMagicBytes = bytes[0] === 0x89 && bytes[1] === 0x50 && 
                       bytes[2] === 0x4E && bytes[3] === 0x47
    }

    if (!validMagicBytes) {
      errors.push('Arquivo corrompido ou tipo inválido')
    }
  } catch (error) {
    errors.push('Erro ao validar arquivo')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Uso em componente
const handleFileUpload = async (file: File) => {
  const validation = await validatePrescriptionFile(file)
  
  if (!validation.valid) {
    setErrors(validation.errors)
    return
  }
  
  // Continuar com upload...
}
```

---

## 6. CORS Configuration

### Configuração Segura de CORS

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_ORIGINS = [
  'https://svlentes.shop',
  'https://www.svlentes.shop',
]

// Apenas para desenvolvimento local
if (process.env.NODE_ENV === 'development') {
  ALLOWED_ORIGINS.push('http://localhost:3000')
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const origin = request.headers.get('origin')

  // Verificar se a origem é permitida
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Max-Age', '86400')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  // Tratar preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: response.headers,
    })
  }

  return response
}

export const config = {
  matcher: '/api/:path*',
}
```

---

## 7. Environment Variables

### Variáveis de Ambiente Necessárias

```bash
# .env.production

# Node
NODE_ENV=production

# Application
NEXT_PUBLIC_APP_URL=https://svlentes.shop

# Security
SESSION_SECRET=your-secure-random-session-secret-here
CSRF_SECRET=your-secure-random-csrf-secret-here

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Webhooks
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
ASAAS_WEBHOOK_TOKEN=your-secure-random-token-here

# Payment APIs
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
ASAAS_ENV=production
ASAAS_API_KEY_PROD=$aact_prod_your_asaas_production_key

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your-sentry-auth-token

# Email
RESEND_API_KEY=re_your_resend_api_key

# WhatsApp
NEXT_PUBLIC_WHATSAPP_NUMBER=5511947038078
```

### Validação de Variáveis de Ambiente

```typescript
// src/lib/env.ts
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'ASAAS_WEBHOOK_TOKEN',
  'SESSION_SECRET',
] as const

export function validateEnvVars() {
  const missing = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  )

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    )
  }
}

// Chamar no início da aplicação
// src/app/layout.tsx
if (process.env.NODE_ENV === 'production') {
  validateEnvVars()
}
```

---

## 🚀 Checklist de Implementação

### Prioridade ALTA (Implementar Imediatamente)

- [ ] **Rate Limiting**
  - [ ] Instalar dependências: `@upstash/ratelimit` `@upstash/redis`
  - [ ] Configurar Upstash Redis (gratuito até 10k requisições/dia)
  - [ ] Aplicar rate limiting em `/api/create-checkout`
  - [ ] Aplicar rate limiting em `/api/schedule-consultation`
  - [ ] Aplicar rate limiting em `/api/privacy/data-request`

- [ ] **Webhook Security (Asaas)**
  - [ ] Adicionar variável `ASAAS_WEBHOOK_TOKEN` no Vercel
  - [ ] Implementar validação de IP whitelist
  - [ ] Implementar validação de timestamp
  - [ ] Testar webhook em sandbox

- [ ] **Security Logger**
  - [ ] Substituir `console.log` por `SecurityLogger` em webhooks
  - [ ] Verificar que dados sensíveis não aparecem em logs
  - [ ] Configurar Sentry para capturar logs de erro

### Prioridade MÉDIA (2 Semanas)

- [ ] **CSP Aprimorado**
  - [ ] Remover `unsafe-inline` e `unsafe-eval` do CSP
  - [ ] Implementar nonces para scripts inline (se necessário)
  - [ ] Testar que todas as funcionalidades ainda funcionam

- [ ] **File Upload Validation**
  - [ ] Implementar validação de magic bytes
  - [ ] Adicionar limite de tamanho de arquivo
  - [ ] Testar upload de diferentes tipos de arquivo

- [ ] **CORS Configuration**
  - [ ] Configurar CORS com whitelist de origens
  - [ ] Testar em produção
  - [ ] Documentar origens permitidas

### Prioridade BAIXA (1 Mês)

- [ ] **Monitoring**
  - [ ] Configurar Sentry para erro tracking
  - [ ] Implementar health checks robustos
  - [ ] Configurar alertas para falhas críticas

- [ ] **Documentation**
  - [ ] Documentar todas as APIs com OpenAPI
  - [ ] Criar guia de segurança para equipe
  - [ ] Documentar processo de resposta a incidentes

---

## 📚 Recursos Adicionais

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [Stripe Webhook Security](https://stripe.com/docs/webhooks/best-practices)
- [Upstash Rate Limiting](https://upstash.com/docs/redis/features/ratelimiting)

---

## ⚠️ Notas Importantes

1. **Nunca commitar secrets no código**
   - Use variáveis de ambiente
   - Adicione `.env*` no `.gitignore`

2. **Sempre validar entrada do usuário**
   - Usar Zod schemas
   - Sanitizar dados antes de processar

3. **Monitorar logs de segurança**
   - Revisar logs regularmente
   - Configurar alertas para eventos suspeitos

4. **Manter dependências atualizadas**
   - Executar `npm audit` regularmente
   - Atualizar dependências com vulnerabilidades

5. **Testar em staging antes de produção**
   - Todas as mudanças de segurança devem ser testadas
   - Verificar que não quebra funcionalidades existentes

---

**Última atualização:** 2025-10-13  
**Responsável:** Equipe de Segurança SV Lentes
