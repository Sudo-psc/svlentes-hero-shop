# Guia Rápido de Implementação - Centralização de Config

**Para**: Desenvolvedores que vão implementar o plano
**Tempo de Leitura**: 10 minutos
**Pré-requisito**: Ler o Sumário Executivo

---

## 🚀 Setup Inicial (30 minutos)

### 1. Criar Estrutura de Diretórios

```bash
cd /root/svlentes-hero-shop

# Criar estrutura config/
mkdir -p config/services
touch config/schema.ts
touch config/loader.ts
touch config/base.yaml
touch config/production.yaml
touch config/staging.yaml
touch config/services/plan-service.ts
touch config/services/theme-service.ts
touch config/README.md
touch config/CHANGELOG.md
```

### 2. Instalar Dependências

```bash
npm install zod yaml
npm install -D @types/js-yaml
```

### 3. Copiar Templates

**De**: `CENTRALIZACAO_CONFIGURACAO_PLANO.md` (Parte 1, Seção B)
**Para**: `config/base.yaml`

**De**: `CENTRALIZACAO_CONFIGURACAO_PARTE2.md` (Seção C)
**Para**: `config/schema.ts`, `config/loader.ts`

---

## 📝 Passo a Passo (Ordem de Execução)

### Etapa 1: Schema e Loader (2 horas)

```typescript
// 1. config/schema.ts
import { z } from 'zod'

// Copiar schema completo da documentação (Parte 1, Seção B)
export const ConfigSchema = z.object({
  site: /* ... */,
  i18n: /* ... */,
  // ... resto do schema
})

export type AppConfig = z.infer<typeof ConfigSchema>
```

```typescript
// 2. config/loader.ts
import { ConfigSchema, type AppConfig } from './schema'
import { readFileSync } from 'fs'
import { parse } from 'yaml'

class ConfigService {
  // Copiar implementação completa da documentação (Parte 2, Seção C)
}

export const config = ConfigService.getInstance()
```

**Validar**:
```bash
# Criar teste simples
npx ts-node -e "
import { config } from './config/loader'
config.load('development')
console.log('✅ Config loaded:', config.get().site.name)
"
```

### Etapa 2: Base Config (3 horas)

**Inventário**: Antes de criar o YAML, mapeie o conteúdo existente:

```bash
# 1. Listar arquivos data/
ls -la src/data/

# 2. Buscar strings hardcoded
grep -r "Assine agora" src/ | wc -l
grep -r "Dr. Philipe" src/ | wc -l
grep -r "+5533" src/ | wc -l

# 3. Identificar menus
grep -r "href=" src/components/layout/Header.tsx
```

**Migração**:
1. Abrir `src/data/pricing-plans.ts` → Copiar para `config/base.yaml` seção `plans`
2. Abrir `src/data/doctor-info.ts` → Copiar para seção `doctor`
3. Abrir `src/components/layout/Header.tsx` → Extrair menu para seção `menus.header`
4. Repetir para todos os arquivos identificados

**Validar**:
```bash
npm run config:validate # Criar este script:
# package.json: "config:validate": "ts-node scripts/validate-config.ts"
```

### Etapa 3: Services (2 horas)

```typescript
// config/services/plan-service.ts
import { config } from '../loader'

export class PlanService {
  getPlans(period: 'monthly' | 'annual', locale: string) {
    // Copiar implementação da documentação
  }
}
```

```typescript
// config/services/theme-service.ts
export class ThemeService {
  buildCssVars(): string {
    // Copiar implementação da documentação
  }

  buildTailwindTheme() {
    // Copiar implementação da documentação
  }
}

export const themeService = new ThemeService()
```

---

## 🔄 Refactor Componentes (Ordem Recomendada)

### 1. Header (30 min) - BAIXO RISCO

```typescript
// ANTES: src/components/layout/Header.tsx
export function Header() {
  return (
    <nav>
      <a href="/">Início</a>
      <a href="/#planos">Planos</a>
      <a href="/calculadora">Calculadora</a>
    </nav>
  )
}

// DEPOIS:
import { config } from '@/config/loader'

export function Header() {
  const menu = config.getMenu('pt-BR', 'header')

  return (
    <nav>
      {menu.main.map(item => (
        <a key={item.href} href={item.href}>{item.label}</a>
      ))}
    </nav>
  )
}
```

**Teste**:
```bash
npm run dev
# Verificar visualmente que menu está correto
```

### 2. Footer (30 min) - BAIXO RISCO

```typescript
// Similar ao Header, usar config.getMenu('pt-BR', 'footer')
```

### 3. HeroSection (1 hora) - MÉDIO RISCO

```typescript
// ANTES:
export function HeroSection() {
  return (
    <section>
      <h1>Lentes de Contato por Assinatura</h1>
      <button>Assine Agora</button>
    </section>
  )
}

// DEPOIS:
import { config } from '@/config/loader'

export function HeroSection() {
  const t = (key: string) => config.t('pt-BR', key)

  return (
    <section>
      <h1>{t('hero.title')}</h1>
      <button>{t('hero.cta')}</button>
    </section>
  )
}
```

### 4. PricingSection (1.5 horas) - ALTO IMPACTO

```typescript
// ANTES: Planos hardcoded
export function PricingSection() {
  const plans = [
    { id: 'basico', name: 'Plano Básico', price: 89 },
    // ...
  ]
  // ...
}

// DEPOIS:
import { PlanService } from '@/config/services/plan-service'
import { useState } from 'react'

export function PricingSection() {
  const planService = new PlanService()
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly')
  const plans = planService.getPlans(period, 'pt-BR')

  return (
    <>
      {/* Period toggle */}
      <button onClick={() => setPeriod('monthly')}>Mensal</button>
      <button onClick={() => setPeriod('annual')}>Anual</button>

      {/* Plan cards */}
      {plans.map(plan => (
        <div key={plan.id}>
          <h3>{plan.name}</h3>
          <span>{plan.currentPriceFormatted}</span>
          {plan.annualDiscount && (
            <p>Economize {plan.annualDiscount.savingsFormatted}</p>
          )}
        </div>
      ))}
    </>
  )
}
```

### 5. SEO Metadata (1 hora) - MÉDIO RISCO

```typescript
// ANTES: src/app/page.tsx
export const metadata = {
  title: "SV Lentes - Assinatura de Lentes",
  description: "Descrição hardcoded...",
}

// DEPOIS:
import { config } from '@/config/loader'

const seo = config.get().seo.pages.home
export const metadata = {
  title: seo.title,
  description: seo.description,
  keywords: seo.keywords,
  openGraph: seo.openGraph,
}
```

---

## ✅ Checklist de Validação (Após Cada Refactor)

### Antes de Commitar

```bash
# 1. Build sem erros
npm run build

# 2. Testes passando
npm run test

# 3. Lint limpo
npm run lint

# 4. Config válido
npm run config:validate

# 5. Preview visual
npm run dev
# Navegar pelo site e verificar:
# - Menus funcionando
# - Textos corretos
# - Planos exibindo preços corretos
# - SEO metadata no <head>
```

### Testes Específicos

```typescript
// __tests__/config/integration.test.ts
import { config } from '@/config/loader'

test('config loads successfully', () => {
  const cfg = config.load('development')
  expect(cfg.site.name).toBe('SV Lentes')
})

test('translation fallback works', () => {
  const text = config.t('en-US', 'hero.title', 'soft')
  expect(text).toBeDefined()
})

test('plans have correct format', () => {
  const planService = new PlanService()
  const plans = planService.getPlans('monthly', 'pt-BR')

  expect(plans.length).toBe(3)
  expect(plans[0].currentPriceFormatted).toMatch(/R\$/)
})
```

---

## 🚨 Troubleshooting Comum

### Erro: "Cannot find module 'yaml'"
```bash
npm install yaml
```

### Erro: Zod validation failed
```bash
# Verificar YAML syntax
npx yaml-validator config/base.yaml

# Ver erro específico
npx ts-node -e "
import { config } from './config/loader'
try {
  config.load('development')
} catch (e) {
  console.error('Validation error:', e)
}
"
```

### Erro: "Translation key not found"
```typescript
// Verificar se key existe no YAML:
# grep -r "hero.title" config/

// Adicionar key faltando:
copy:
  pt-BR:
    hero:
      title: "Seu título aqui"
```

### CSS vars não funcionam
```typescript
// Verificar injeção no layout.tsx:
<style dangerouslySetInnerHTML={{ __html: themeService.buildCssVars() }} />

// Testar geração manual:
npx ts-node -e "
import { themeService } from './config/services/theme-service'
console.log(themeService.buildCssVars())
"
```

---

## 📊 Progresso Tracking

### Crie um Checklist no GitHub Issue

```markdown
## Etapa 1: Setup ✅
- [x] Criar estrutura config/
- [x] Instalar dependências
- [x] Implementar schema.ts
- [x] Implementar loader.ts
- [x] Criar base.yaml

## Etapa 2: Services ⏳
- [x] PlanService
- [x] ThemeService
- [ ] Testes unitários

## Etapa 3: Refactor 🔄
- [x] Header.tsx
- [x] Footer.tsx
- [ ] HeroSection.tsx
- [ ] PricingSection.tsx
- [ ] SEO metadata
- [ ] Tema (Tailwind)

## Etapa 4: Testes 📝
- [ ] Unit tests
- [ ] E2E tests
- [ ] Visual regression

## Etapa 5: Rollout 🚀
- [ ] Feature flag
- [ ] Staging deploy
- [ ] Production 10%
- [ ] Production 100%
```

---

## 💡 Dicas de Produtividade

### 1. Use Snippets (VSCode)

```json
// .vscode/config.code-snippets
{
  "Import Config": {
    "prefix": "iconfig",
    "body": [
      "import { config } from '@/config/loader'",
      ""
    ]
  },
  "Translation Function": {
    "prefix": "tfunc",
    "body": [
      "const t = (key: string) => config.t('pt-BR', key)"
    ]
  }
}
```

### 2. Hot-Reload Config em Dev

```typescript
// config/loader.ts (já implementado)
if (process.env.NODE_ENV === 'development') {
  config.load('development', true) // enableHotReload = true
}

// Agora você pode editar config/base.yaml e ver mudanças ao vivo!
```

### 3. Debug Config com Pretty Print

```bash
# Ver config carregado formatado:
npx ts-node -e "
import { config } from './config/loader'
console.log(JSON.stringify(config.get(), null, 2))
" | less
```

---

## 📚 Referências Rápidas

| Preciso de... | Onde encontrar |
|---------------|----------------|
| **Schema Zod completo** | Parte 1, Seção B |
| **ConfigService impl** | Parte 2, Seção C |
| **Exemplo base.yaml** | Parte 1, Seção B (170+ linhas) |
| **PlanService impl** | Parte 2, Seção C |
| **ThemeService impl** | Parte 2, Seção C |
| **Exemplos de componentes** | Parte 3, Seção H |
| **Testes** | Parte 2, Seção F |
| **Riscos e mitigações** | Parte 3, Seção G |

---

## 🎯 Meta de Hoje

**Developer Sênior (8h/dia)**:

- ✅ **Dia 1-2**: Setup + Schema + Loader + Base YAML
- ✅ **Dia 3-4**: Services + Refactor Menus/Copy
- ✅ **Dia 5**: Refactor Planos + SEO
- ✅ **Dia 6**: Testes unitários
- ✅ **Dia 7-8**: E2E + Feature flag

**Developer Pleno (6h/dia)**:
- Adicionar +3 dias para setup e testes extras

---

**Última Atualização**: 2025-10-18
**Status**: ✅ Pronto para uso
**Feedback**: Abrir issue no GitHub ou consultar Parte 1-3 para dúvidas
