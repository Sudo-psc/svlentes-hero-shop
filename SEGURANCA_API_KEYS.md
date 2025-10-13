# 🔒 Segurança de API Keys - SV Lentes

## ✅ Auditoria de Segurança Realizada

**Data:** 13 de Janeiro de 2025
**Status:** ✅ **SEGURO** - Sem vazamentos detectados

---

## 📋 Checklist de Segurança

### ✅ Proteção no Git

- [x] `.env.local` está no `.gitignore` (linha 29)
- [x] `.env` está no `.gitignore` (linha 30)
- [x] `.env*.local` captura todas variações
- [x] Arquivos de exemplo não contêm chaves reais
- [x] Chaves de produção **NUNCA** foram commitadas

### ✅ Proteção no Código

- [x] **Nenhuma** chave hardcoded no código fonte
- [x] Todas as chaves usam `process.env`
- [x] Chaves **NUNCA** expostas com `NEXT_PUBLIC_`
- [x] Cliente Asaas usa chaves apenas no backend
- [x] API routes são server-side only

### ✅ Arquivos Verificados

```bash
# Código fonte verificado ✓
src/**/*.ts
src/**/*.tsx
src/**/*.js
src/**/*.jsx

# Nenhuma chave hardcoded encontrada ✓
# Todas as referências usam process.env ✓
```

---

## 🔐 Configuração Segura

### 1. Variáveis de Ambiente

**Arquivo:** `.env.local` (GIT IGNORED ✓)

```bash
# ✅ CORRETO - Backend only
ASAAS_ENV=production
ASAAS_API_KEY_PROD=$aact_prod_...
ASAAS_API_KEY_SANDBOX=$aact_hmlg_...

# ✅ CORRETO - Frontend público (URLs apenas)
NEXT_PUBLIC_APP_URL=https://svlentes.com.br
```

### 2. Cliente Asaas (Backend Only)

**Arquivo:** `src/lib/asaas.ts`

```typescript
// ✅ SEGURO: Chaves acessadas apenas no servidor
const getApiKey = (): string => {
    // Durante build time, retorna placeholder
    if (isBuildTime) {
        return 'build-time-placeholder'
    }

    const env = process.env.ASAAS_ENV || 'sandbox'

    if (env === 'production') {
        const key = process.env.ASAAS_API_KEY_PROD  // ✅ Server-side only
        if (!key) {
            throw new Error('ASAAS_API_KEY_PROD is not defined')
        }
        return key
    }
    // ...
}
```

### 3. API Routes (Server-side)

**Arquivo:** `src/app/api/create-checkout/route.ts`

```typescript
import { asaas } from '@/lib/asaas'  // ✅ Backend import

export async function POST(request: NextRequest) {
    // ✅ SEGURO: asaas só funciona no servidor
    const customer = await asaas.createCustomer(...)
    // ...
}
```

---

## ❌ O QUE NÃO FAZER

### Exposição de Chaves no Frontend

```typescript
// ❌ NUNCA FAÇA ISSO!
const ASAAS_API_KEY = process.env.NEXT_PUBLIC_ASAAS_API_KEY

// ❌ NUNCA FAÇA ISSO!
const apiKey = '$aact_prod_000...'

// ❌ NUNCA FAÇA ISSO!
fetch('https://api.asaas.com/v3/customers', {
    headers: {
        'access_token': process.env.NEXT_PUBLIC_ASAAS_KEY  // ❌ EXPOSTO!
    }
})
```

### Commit de Chaves

```bash
# ❌ NUNCA FAÇA ISSO!
git add .env.local
git commit -m "Add API keys"
git push

# ❌ NUNCA FAÇA ISSO!
echo "ASAAS_API_KEY=..." > .env
git add .env
```

---

## ✅ O QUE FAZER

### 1. Usar Variáveis de Ambiente Corretas

```typescript
// ✅ CORRETO: Backend only, sem NEXT_PUBLIC_
const apiKey = process.env.ASAAS_API_KEY_PROD

// ✅ CORRETO: URL pública (não é sensível)
const appUrl = process.env.NEXT_PUBLIC_APP_URL
```

### 2. Validar .gitignore

```bash
# ✅ Verificar se arquivos estão ignorados
git check-ignore .env.local .env

# ✅ Resultado esperado:
# .env.local
# .env
```

### 3. Usar API Routes para Operações Sensíveis

```typescript
// ✅ CORRETO: Cliente chama API route
// Frontend: src/app/page.tsx
const response = await fetch('/api/create-checkout', {
    method: 'POST',
    body: JSON.stringify(data)
})

// ✅ CORRETO: API route usa chave no servidor
// Backend: src/app/api/create-checkout/route.ts
export async function POST(req) {
    const customer = await asaas.createCustomer(...)  // ✅ Chave no servidor
}
```

---

## 🔍 Como Verificar Segurança

### 1. Verificar Código

```bash
# Buscar chaves hardcoded
grep -r "\$aact_" src/ --include="*.ts" --include="*.tsx"

# Buscar variáveis expostas
grep -r "NEXT_PUBLIC.*API.*KEY" src/

# Resultado esperado: NENHUM arquivo encontrado ✅
```

### 2. Verificar Git

```bash
# Verificar .gitignore
cat .gitignore | grep -E "\.env"

# Resultado esperado:
# .env*.local
# .env
```

### 3. Verificar Build

```bash
# Build não deve conter chaves
npm run build
grep -r "\$aact_" .next/

# Resultado esperado: NENHUMA chave encontrada ✅
```

---

## 🚨 O Que Fazer Se Chave For Exposta

### Se Chave Foi Commitada no Git

1. **IMEDIATAMENTE** rotacione a chave no Asaas:
   - Acesse Dashboard Asaas → Integrações → API
   - Gere nova API key
   - Revogue a chave antiga

2. **Limpe o histórico do Git:**
   ```bash
   # Usar BFG Repo Cleaner ou git-filter-repo
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env.local" \
     --prune-empty --tag-name-filter cat -- --all

   # Force push (cuidado!)
   git push origin --force --all
   ```

3. **Notifique a equipe:**
   - Informe sobre o incidente
   - Confirme rotação das chaves
   - Atualize documentação

### Se Chave Foi Exposta no Frontend

1. **IMEDIATAMENTE** rotacione a chave
2. **Remova do código** e redeploy
3. **Analise logs** para uso indevido
4. **Monitore** transações suspeitas

---

## 📊 Arquitetura de Segurança

```
┌─────────────────────────────────────────────┐
│           FRONTEND (Navegador)               │
│  ❌ Nenhuma chave API                        │
│  ✅ Apenas URLs públicas (NEXT_PUBLIC_)     │
└──────────────────┬──────────────────────────┘
                   │ HTTPS
                   ↓
┌─────────────────────────────────────────────┐
│           API ROUTES (Next.js)               │
│  ✅ process.env.ASAAS_API_KEY_PROD          │
│  ✅ Server-side apenas                      │
│  ✅ Validações de segurança                 │
└──────────────────┬──────────────────────────┘
                   │ HTTPS + API Key
                   ↓
┌─────────────────────────────────────────────┐
│           ASAAS API v3                       │
│  ✅ TLS 1.2+                                │
│  ✅ PCI-DSS Certificado                     │
│  ✅ Headers de autenticação                 │
└─────────────────────────────────────────────┘
```

---

## 🎯 Melhores Práticas

### 1. Separação de Ambientes

```bash
# ✅ Chaves diferentes por ambiente
ASAAS_ENV=sandbox
ASAAS_API_KEY_SANDBOX=$aact_hmlg_...  # Testes
ASAAS_API_KEY_PROD=$aact_prod_...     # Produção
```

### 2. Rotação Regular

- **Sandbox**: Pode ser mantida por tempo indeterminado
- **Produção**: Rotacionar a cada 90 dias ou após incidente

### 3. Monitoramento

```typescript
// ✅ Log de uso (sem expor chave)
console.log('Asaas API call:', {
    endpoint: '/customers',
    environment: process.env.ASAAS_ENV,
    timestamp: new Date().toISOString()
    // ❌ NUNCA logue a chave!
})
```

### 4. Validação de Headers

```typescript
// ✅ Cliente Asaas valida headers obrigatórios
this.headers = {
    'Content-Type': 'application/json',
    'access_token': this.apiKey,  // ✅ Não exposto
    'User-Agent': 'SVLentes/1.0.0'
}
```

---

## 📚 Recursos

### Documentação

- **Asaas Security**: [docs.asaas.com/security](https://docs.asaas.com)
- **Next.js Env Vars**: [nextjs.org/docs/basic-features/environment-variables](https://nextjs.org/docs/basic-features/environment-variables)
- **OWASP API Security**: [owasp.org/api-security](https://owasp.org/www-project-api-security/)

### Ferramentas

- **git-secrets**: Previne commit de chaves
- **truffleHog**: Busca chaves no histórico do Git
- **Sentry**: Monitoramento de erros e logs
- **Vercel**: Environment variables seguras

---

## ✅ Resumo da Auditoria

| Item | Status | Detalhes |
|------|--------|----------|
| **Chaves no .gitignore** | ✅ SEGURO | `.env*.local` e `.env` ignorados |
| **Chaves hardcoded** | ✅ SEGURO | Nenhuma chave no código fonte |
| **Exposição frontend** | ✅ SEGURO | Nenhuma variável `NEXT_PUBLIC_*API*KEY` |
| **Cliente Asaas** | ✅ SEGURO | Backend only, lazy loading |
| **API Routes** | ✅ SEGURO | Server-side apenas |
| **Build Output** | ✅ SEGURO | Nenhuma chave no `.next/` |
| **Git History** | ✅ SEGURO | Chaves nunca commitadas |

---

## 🎉 Conclusão

**Status Final:** ✅ **SISTEMA SEGURO**

Todas as chaves de API estão protegidas e não há riscos de vazamento identificados. O projeto segue as melhores práticas de segurança para aplicações Next.js com integrações de pagamento.

**Próximos Passos:**
1. ✅ Manter `.env.local` sempre no `.gitignore`
2. ✅ Rotacionar chaves de produção a cada 90 dias
3. ✅ Monitorar logs do Asaas para atividades suspeitas
4. ✅ Treinar equipe sobre práticas de segurança

---

*Documento criado em: 13 de Janeiro de 2025*
*Auditoria realizada por: Claude (Anthropic)*
*Próxima revisão: 13 de Abril de 2025*
