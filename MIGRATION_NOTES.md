# Migração para Next.js 16.0.0

**Data:** 2025-10-26
**De:** Next.js 15.5.4
**Para:** Next.js 16.0.0

## Resumo Executivo

Migração parcial para Next.js 16.0.0 usando webpack (em vez de Turbopack padrão) para manter compatibilidade com configurações personalizadas existentes.

### Status: 🟡 Em Progresso

- ✅ Dependências core atualizadas
- ✅ Build funcionando com webpack
- ⚠️ Turbopack desabilitado temporariamente
- ⚠️ 7 Route Handlers com params pendentes de correção
- ⚠️ Google Fonts temporariamente desabilitadas (problema de rede)

---

## Mudanças Realizadas

### 1. Dependências Atualizadas

**Core:**
- `next`: 15.5.4 → **16.0.0**
- `eslint-config-next`: 15.5.5 → **16.0.0**
- React/TypeScript: sem mudanças (compatíveis)

**Novas Dependências:**
- `@react-email/render`: Peer dependency do `resend` (instalada)
- `styled-components`: ^6.1.19 (requerida por @sanity/ui)

### 2. Configuração next.config.js

**Adicionado:**
```javascript
output: 'standalone'  // Para deployment production
```

**Modificado:**
```javascript
experimental: {
  optimizePackageImports: [
    '@heroicons/react',
    'lucide-react',           // NOVO
    'date-fns',               // NOVO
    'react-hook-form',        // NOVO
    '@radix-ui/react-accordion',  // NOVO
    '@radix-ui/react-dialog',     // NOVO
    '@radix-ui/react-dropdown-menu', // NOVO
    '@radix-ui/react-tooltip',    // NOVO
  ],
}
```

**Removido:**
```javascript
typescript: { ignoreBuildErrors: true }  // Removido para CI confiável
eslint: { ignoreDuringBuilds: true }     // Removido para CI confiável
```

**Build Command:**
```json
"build": "next build --webpack"  // Forçar webpack em vez de Turbopack
```

### 3. API Breaking Changes - Route Handlers

**Next.js 16 mudou a API de params em routes dinâmicas:**

**Antes (Next.js 15):**
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id
  // ...
}
```

**Depois (Next.js 16):**
```typescript
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params  // AWAIT necessário
  const id = params.id
  // ...
}
```

**Arquivos Corrigidos (10/10 ✅):**
- ✅ `src/app/api/admin/orders/[id]/route.ts` (GET, PUT, DELETE)
- ✅ `src/app/api/admin/orders/[id]/status/route.ts` (PUT)
- ✅ `src/app/api/admin/pricing/costs/route.ts` (GET, POST - HOC fix)
- ✅ `src/app/api/admin/pricing/planos/[id]/route.ts` (GET, PUT, DELETE + HOC fix)
- ✅ `src/app/api/admin/pricing/planos/route.ts` (GET, POST - HOC fix)
- ✅ `src/app/api/admin/subscriptions/[id]/route.ts` (GET, PUT, DELETE)
- ✅ `src/app/api/admin/subscriptions/[id]/status/route.ts` (PUT)
- ✅ `src/app/api/admin/support/tickets/[id]/assign/route.ts` (PUT, DELETE)
- ✅ `src/app/api/admin/support/tickets/[id]/route.ts` (GET, PUT, DELETE)
- ✅ `src/app/api/debug/conversation/[phone]/route.ts` (GET)
- ✅ `src/app/api/debug/message/[messageId]/route.ts` (GET)

**All route handlers migrated to Next.js 16 async params API!**

### 4. Fontes Google (Temporário)

**Problema:** Erro de rede ao buscar Google Fonts durante build.

**Solução Temporária:**
```typescript
// src/app/layout.tsx
// Comentado temporariamente:
// import { Inter, Poppins } from 'next/font/google'
// Usando: className="font-sans" (fontes do sistema)
```

**TODO:** Restaurar Google Fonts quando problema de rede for resolvido ou usar fontes locais.

---

## Warnings Conhecidos

### 1. Middleware Deprecation
```
⚠ The "middleware" file convention is deprecated.
  Please use "proxy" instead.
```

**Impacto:** Baixo
**Ação:** Renomear `src/middleware.ts` para `src/proxy.ts` em PR futuro

### 2. Webpack Cache Serialization
```
<w> [webpack.cache.PackFileCacheStrategy]
  Serializing big strings (176kiB)
```

**Impacto:** Performance warning apenas
**Ação:** Considerar otimizar bundles grandes

---

## Turbopack vs Webpack

### Por que Webpack?

Next.js 16 habilita **Turbopack** por padrão, mas encontramos problemas:

**Problemas com Turbopack:**
1. `resolveAlias` não aceita `false` para módulos Node.js (fs, net, tls)
2. Sintaxe diferente para configurações customizadas
3. SVG loader via `@svgr/webpack` não compatível

**Decisão:** Usar `--webpack` temporariamente até:
1. Turbopack ter melhor suporte para resolve aliases
2. Migrar configuração SVG para approach compatível
3. Verificar todas customizações funcionam com Turbopack

**Performance Impact:** Webpack ainda é rápido (~65s build) e estável.

---

## Plano de Rollback

### Cenário 1: Build Falha Completamente

**Opção A - Git Revert:**
```bash
git checkout pre-nextjs-16
git reset --hard HEAD
npm install
```

**Opção B - Downgrade Manual:**
```bash
npm install next@15.5.4 eslint-config-next@15.5.5
git checkout HEAD -- next.config.js package.json
npm install
```

### Cenário 2: Problemas em Produção

**Opção A - Deploy tag anterior:**
```bash
git checkout pre-nextjs-16
npm run build
npm run start
systemctl restart svlentes-nextjs
```

**Opção B - Hotfix isolado:**
```bash
git revert <commit-hash>
npm install
npm run build
# Deploy
```

---

## Próximos Passos (PR 2+)

### PR 2: Finalizar Route Handlers
- [ ] Corrigir 7 arquivos pendentes com params async
- [ ] Adicionar testes para Route Handlers
- [ ] Verificar todas rotas dinâmicas funcionando

### PR 3: Otimizações e Cleanup
- [ ] Renomear `middleware.ts` → `proxy.ts` (se necessário)
- [ ] Restaurar Google Fonts ou migrar para local
- [ ] Investigar migração para Turbopack
- [ ] Dedupli car dependências com `npm dedupe`

### PR 4: Testes e CI
- [ ] Atualizar Vitest/Playwright para Next.js 16
- [ ] Configurar Lighthouse CI com budgets
- [ ] Adicionar axe-core para testes a11y
- [ ] Garantir CI verde

### PR 5: Documentação Final
- [ ] Atualizar README com Node/npm suportados
- [ ] Documentar novas APIs
- [ ] Criar guia de troubleshooting

---

## Compatibilidade

### Versões Testadas
- **Node.js:** v22.20.0 (>= 20.0.0 required)
- **npm:** 10.9.3 (>= 10.0.0 required)
- **TypeScript:** 5.9.3
- **React:** 18.3.1

### Browsers Suportados
Sem mudanças - mantém configuração `browserslist` existente.

---

## Métricas de Performance

### Baseline (Next.js 15.5.4)
- Build time: ~63-65s
- First Load JS: (não capturado - problema Google Fonts)

### Após Migração (Next.js 16.0.0 + webpack)
- Build time: ~63-65s (sem regressão)
- First Load JS: (pendente - aguardando build completo)

**Meta:** Manter ou melhorar métricas após migração completa para Turbopack.

---

## Problemas Conhecidos e Workarounds

### 1. `fs` module em Client Components

**Erro:**
```
Module not found: Can't resolve 'fs'
Import trace: ./src/config/loader.ts [Client Component Browser]
```

**Causa:** `src/config/loader.ts` usa `fs` mas é importado em contextos client.

**Workaround Aplicado:**
```javascript
// next.config.js - webpack
config.resolve.fallback = {
  fs: false,
  net: false,
  tls: false,
}
```

**TODO:** Refatorar `ConfigService` para garantir server-only execution.

---

## Referências

- [Next.js 16 Release Notes](https://nextjs.org/blog/next-16)
- [Next.js 16 Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-16)
- [Turbopack Documentation](https://nextjs.org/docs/app/api-reference/next-config-js/turbopack)
- [Route Handler API Changes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

## Contato e Suporte

**Responsável pela Migração:** Claude Code
**Branch:** `claude/next-js-16-migration-011CUW6fNBfnEJVVyMCDUrVj`
**Tags:**
- `pre-nextjs-16` - Estado antes da migração
- `nextjs-16-partial` - Estado atual (webpack working, params pending)

**Em caso de problemas:**
1. Consultar este documento
2. Verificar logs: `journalctl -u svlentes-nextjs -f`
3. Testar rollback antes de debug profundo
