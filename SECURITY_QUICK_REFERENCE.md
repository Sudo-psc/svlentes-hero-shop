# 🔒 Referência Rápida de Segurança - SV Lentes

Guia rápido para desenvolvedores aplicarem as melhores práticas de segurança.

---

## 🚀 Quick Start

### 1. Rate Limiting em Nova API

```typescript
// src/app/api/minha-api/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Aplicar rate limiting
  const identifier = getClientIdentifier(request)
  const result = checkRateLimit(identifier, RATE_LIMIT_CONFIGS.public)
  
  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Too Many Requests' },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString()
        }
      }
    )
  }
  
  // Sua lógica aqui...
}
```

---

### 2. Logger Seguro

```typescript
import { SecurityLogger } from '@/lib/security-logger'

// ✅ CERTO - Dados sensíveis mascarados automaticamente
SecurityLogger.info('User registered', {
  userId: '123',
  email: 'user@example.com',  // Mascarado automaticamente
  cpf: '12345678901',          // Mascarado automaticamente
})

// ❌ ERRADO - Expõe dados sensíveis
console.log('User registered:', { email, cpf })
```

---

### 3. Validação de Entrada (Zod)

```typescript
import { z } from 'zod'

// Definir schema
const formSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(10).max(15),
})

// Validar
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = formSchema.parse(body)
    
    // Usar 'validated' ao invés de 'body'
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { errors: error.errors },
        { status: 400 }
      )
    }
  }
}
```

---

### 4. Webhook Seguro

```typescript
import { validateAsaasWebhook, ASAAS_ALLOWED_IPS } from '@/lib/webhook-security'
import { SecurityLogger } from '@/lib/security-logger'

export async function POST(request: NextRequest) {
  // Validar webhook
  const validation = await validateAsaasWebhook(request, {
    allowedIPs: ASAAS_ALLOWED_IPS,
    webhookToken: process.env.ASAAS_WEBHOOK_TOKEN,
    validateTimestamp: true,
  })
  
  if (!validation.valid) {
    SecurityLogger.security('Webhook validation failed', {
      errors: validation.errors,
    })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Processar webhook...
}
```

---

## 🛡️ Comandos Úteis

### Verificar Vulnerabilidades
```bash
npm audit
npm audit --production  # Apenas dependências de produção
npm audit fix           # Corrigir automaticamente
```

### TypeScript Check
```bash
npx tsc --noEmit
```

### Lint
```bash
npm run lint
npm run lint -- --fix
```

### Tests
```bash
npm test
npm run test:coverage
npm run test:e2e
```

---

## 📋 Checklist de PR

Antes de abrir um Pull Request, verifique:

- [ ] `npm audit` sem vulnerabilidades críticas
- [ ] `npx tsc --noEmit` sem erros
- [ ] `npm run lint` sem erros
- [ ] Tests passando (`npm test`)
- [ ] Rate limiting aplicado (se API pública)
- [ ] SecurityLogger usado (não console.log)
- [ ] Validação de entrada implementada (Zod)
- [ ] Dados sensíveis não aparecem em logs
- [ ] Secrets não estão hardcoded
- [ ] Documentação atualizada

---

## 🚨 Quando Alertar Segurança

Reportar imediatamente se encontrar:

- ⚠️ Secrets hardcoded no código
- ⚠️ Dados de usuário expostos em logs
- ⚠️ APIs sem rate limiting
- ⚠️ Validação de entrada faltando
- ⚠️ Vulnerabilidades críticas em dependências
- ⚠️ Acesso não autorizado a recursos
- ⚠️ Dados sensíveis em URLs
- ⚠️ CSP bloqueando funcionalidades

**Contato de Segurança:** saraivavision@gmail.com

---

## 💡 Boas Práticas

### DO ✅

- ✅ Validar TODAS as entradas do usuário
- ✅ Usar SecurityLogger ao invés de console.log
- ✅ Mascarar dados sensíveis em logs
- ✅ Aplicar rate limiting em APIs públicas
- ✅ Usar HTTPS para todas as comunicações
- ✅ Manter dependências atualizadas
- ✅ Revisar código antes de commitar
- ✅ Testar mudanças localmente

### DON'T ❌

- ❌ Nunca commitar secrets (.env, API keys)
- ❌ Nunca logar senhas ou tokens
- ❌ Nunca confiar em validação client-side apenas
- ❌ Nunca expor stack traces em produção
- ❌ Nunca usar `dangerouslySetInnerHTML` sem sanitizar
- ❌ Nunca ignorar warnings de segurança
- ❌ Nunca desabilitar TypeScript strict mode
- ❌ Nunca fazer deploy sem testar

---

## 🔑 Variáveis de Ambiente

### Desenvolvimento (.env.local)
```bash
# Usar valores de teste
STRIPE_SECRET_KEY=sk_test_...
ASAAS_API_KEY_SANDBOX=...
ASAAS_ENV=sandbox
```

### Produção (Vercel)
```bash
# Configurar no dashboard do Vercel
STRIPE_SECRET_KEY=sk_live_...
ASAAS_API_KEY_PROD=...
ASAAS_ENV=production
ASAAS_WEBHOOK_TOKEN=...
```

**Nunca:**
- Commitar arquivos `.env*`
- Compartilhar secrets por email/chat
- Usar secrets de produção em dev

---

## 📚 Recursos

- [Documentação Completa](./SECURITY_QUALITY_AUDIT.md)
- [Guia de Implementação](./SECURITY_IMPLEMENTATION_GUIDE.md)
- [Checklist de Segurança](./SECURITY_CHECKLIST.md)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)

---

## 🆘 Suporte

**Dúvidas sobre segurança?**
- Email: saraivavision@gmail.com
- WhatsApp: +55 33 99860-1427

**Em caso de incidente de segurança:**
1. Notificar imediatamente via email
2. Não divulgar publicamente
3. Documentar todos os detalhes
4. Aguardar orientações da equipe

---

**Última Atualização:** 2025-10-13  
**Versão:** 1.0
