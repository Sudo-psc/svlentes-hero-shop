# Sumário Executivo - Centralização de Configuração

**Projeto**: SV Lentes - Landing Page Next.js 15
**Objetivo**: Consolidar configurações dispersas em fonte única de verdade
**Status**: 📋 Planejamento Completo | ⏳ Aguardando Aprovação
**Impacto**: 🔴 Alto (Manutenibilidade) | 🟢 Baixo Risco (Rollout Gradual)

---

## 🎯 Problema

### Situação Atual (Dor)
```
📂 src/
├── data/
│   ├── pricing-plans.ts      ← Planos hardcoded
│   ├── doctor-info.ts         ← Dr. Philipe (8+ locais)
│   ├── calculator-data.ts
│   └── [6+ outros arquivos]
├── components/
│   ├── Header.tsx             ← Menu hardcoded
│   ├── Footer.tsx             ← Menu duplicado
│   ├── PricingSection.tsx     ← Strings hardcoded
│   └── [20+ componentes]      ← WhatsApp em 24+ arquivos
└── app/
    ├── layout.tsx             ← SEO defaults
    ├── page.tsx               ← SEO duplicado
    └── [15+ páginas]          ← Metadata inconsistente
```

**Consequências**:
- 🔴 **Manutenção insustentável**: Alterar WhatsApp = editar 24 arquivos
- 🔴 **Alto risco de erro**: Informação médica (Dr. Philipe) duplicada em 8+ locais
- 🔴 **Sem i18n**: Expansão para inglês é impossível
- 🟡 **SEO inconsistente**: Metadata repetida manualmente
- 🟡 **Tema fragmentado**: Tailwind config vs. CSS vars vs. componentes

### Incidente Recente (Evidência Real)
**2025-10-17**: Correção do número WhatsApp (3399898026 → 5533999898026) exigiu edição de **24 arquivos** com alto risco de erro.

---

## 💡 Solução Proposta

### Configuração Centralizada em YAML

```yaml
# config/base.yaml (400+ linhas)
site:
  name: "SV Lentes"
  url: "https://svlentes.com.br"

doctor:
  name: "Dr. Philipe Saraiva Cruz"
  crm: "CRM-MG 69.870"
  contact:
    whatsapp: "+5533999898026"  ← Fonte única de verdade

plans:
  plans:
    - id: "basico"
      price:
        monthly: 89.00
        annual: 979.00

copy:
  pt-BR:
    hero:
      title: "Lentes de Contato por Assinatura"
      cta: "Assine Agora"
```

### Acesso Type-Safe (TypeScript + Zod)

```typescript
import { config } from '@/config/loader'

// ✅ Validado em build-time
const whatsapp = config.get().doctor.contact.whatsapp
const plans = planService.getPlans('monthly', 'pt-BR')
const heroTitle = config.t('pt-BR', 'hero.title')
```

---

## 📊 Benefícios Quantificáveis

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| **Arquivos com WhatsApp** | 24+ | 1 | -96% |
| **Locais com Dr. Philipe** | 8+ | 1 | -87% |
| **Tempo para mudar texto** | 15-30min | 2-5min | -83% |
| **Suporte i18n** | ❌ Não | ✅ Sim (pt-BR, en-US) | ∞ |
| **Validação build-time** | ❌ Não | ✅ Zod schema | ✅ |
| **Risco de inconsistência** | 🔴 Alto | 🟢 Baixo | 🔴→🟢 |

---

## 🏗️ Arquitetura da Solução

### Estrutura de Arquivos

```
config/
├── schema.ts          # Zod schema (validação TypeScript)
├── loader.ts          # ConfigService (singleton)
├── base.yaml          # Config base (pt-BR) - 400+ linhas
├── production.yaml    # Overrides produção
├── staging.yaml       # Overrides staging
└── services/
    ├── plan-service.ts   # Lógica de planos
    └── theme-service.ts  # Geração CSS vars
```

### Fluxo de Dados

```
┌─────────────────────┐
│  config/base.yaml   │  ← Fonte única de verdade
└──────────┬──────────┘
           │ Deep merge
┌──────────▼──────────┐
│ production.yaml     │  ← Overrides por ambiente
└──────────┬──────────┘
           │ Interpolate env vars
┌──────────▼──────────┐
│  Zod Validation     │  ← Validação em build-time
└──────────┬──────────┘
           │ Type-safe
┌──────────▼──────────┐
│  ConfigService      │  ← Singleton com cache
└──────────┬──────────┘
           │ t(), getPlans(), getMenu()
┌──────────▼──────────┐
│  React Components   │  ← Consumo type-safe
└─────────────────────┘
```

---

## 📅 Plano de Implementação

### Cronograma (6-8 semanas - Developer Sênior)

```
┌────────────────────────────────────────────────────────────┐
│ SEMANA 1-2: Setup e Preparação                           │
│ ✓ Inventário de conteúdo disperso                         │
│ ✓ Criar config/base.yaml completo (400+ linhas)           │
│ ✓ Implementar ConfigService + PlanService + ThemeService  │
├────────────────────────────────────────────────────────────┤
│ SEMANA 3-4: Refactor Incremental                         │
│ ✓ Menus (Header, Footer)                                  │
│ ✓ Copy/Textos (Hero, CTAs, etc.)                          │
│ ✓ Planos (PricingSection)                                 │
│ ✓ SEO (layout metadata)                                   │
│ ✓ Tema (Tailwind integration)                             │
├────────────────────────────────────────────────────────────┤
│ SEMANA 5-6: Testes e Feature Flags                       │
│ ✓ Unit tests (ConfigService, PlanService)                 │
│ ✓ E2E tests (regressão visual)                            │
│ ✓ Feature flag: useCentralizedConfig                      │
│ ✓ Rollout gradual: 10% → 50% → 100%                       │
├────────────────────────────────────────────────────────────┤
│ SEMANA 7-8: Monitoramento e Documentação                 │
│ ✓ Logs/Observabilidade (config hash, X-Config-Hash)       │
│ ✓ Health endpoint (/api/admin/config-health)              │
│ ✓ CHANGELOG.md + README.md                                │
│ ✓ PR template para mudanças de config                     │
└────────────────────────────────────────────────────────────┘
```

### Esforço Estimado

| Perfil | Duração | Story Points |
|--------|---------|--------------|
| **Developer Sênior** | 6-8 semanas | 31 pts |
| **Developer Pleno** | 10-12 semanas | 31 pts |
| **Developer Júnior** | 14-16 semanas | 31 pts |

**Total de Horas**: 29-37h

---

## ⚠️ Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| **Exposição de secrets** | 🟡 Média | 🔴 Alta | ✅ Secrets em .env + interpolação `${VAR}` |
| **Regressão de SEO** | 🟡 Média | 🔴 Alta | ✅ Snapshot tests + Lighthouse CI |
| **Divergência tema** | 🟡 Média | 🟡 Média | ✅ Config como fonte única + CI check |
| **Rollout problemático** | 🟢 Baixa | 🟡 Média | ✅ Feature flags + rollout gradual (10%→100%) |

**Nível de Risco Geral**: 🟡 Médio (Com mitigações: 🟢 Baixo)

---

## ✅ Critérios de Sucesso

### Aceite Técnico
- ✅ `npm run build` sem erros
- ✅ `npm run test` 100% passing
- ✅ Zod validation sem throws
- ✅ Lighthouse CI: CLS/LCP variação <5%
- ✅ Percy/Chromatic: 0 visual regressions

### Aceite de Negócio
- ✅ Tempo para alterar texto reduzido de 15min → 2min
- ✅ Zero inconsistências (WhatsApp, Dr. Philipe)
- ✅ Preparado para expansão i18n (inglês)
- ✅ Documentação completa para contribuintes

---

## 💰 ROI Estimado

### Custos
- **Desenvolvimento**: 29-37h × R$ 150/h = **R$ 4.350 - R$ 5.550**
- **QA/Testes**: 8h × R$ 100/h = **R$ 800**
- **Rollout/Monitoring**: 4h × R$ 150/h = **R$ 600**
- **TOTAL**: **R$ 5.750 - R$ 6.950**

### Benefícios (Anual)
- **Redução de tempo de manutenção**: 10h/mês × R$ 150/h × 12 = **R$ 18.000/ano**
- **Redução de erros**: 2 incidentes/ano × R$ 2.000 = **R$ 4.000/ano**
- **Preparação i18n**: Economia de 40h futuras × R$ 150/h = **R$ 6.000**
- **TOTAL**: **R$ 28.000/ano**

**Payback**: <3 meses | **ROI Anual**: 302%

---

## 📈 Roadmap Pós-Implementação

### Curto Prazo (1-3 meses)
- ✅ Monitorar métricas de performance
- ✅ Coletar feedback do time
- ✅ Ajustar processo de contribuição

### Médio Prazo (3-6 meses)
- 🌐 Adicionar locale `en-US` (inglês)
- 📊 Dashboard de config health
- 🔄 Hot-reload em produção (opcional)

### Longo Prazo (6-12 meses)
- 🎨 Design system tokens centralizados
- 🤖 CMS integration (WordPress/Strapi)
- 📱 Mobile app config sharing

---

## 🎬 Próximas Ações

### Para Stakeholders (Aprovação)
1. ⏸️ **Revisar este sumário executivo**
2. ⏸️ **Aprovar escopo e cronograma**
3. ⏸️ **Alocar developer sênior por 6-8 semanas**

### Para Equipe Técnica (Implementação)
1. ⏸️ **Ler documentação completa** (3 partes + README)
2. ⏸️ **Criar branch** `feature/centralized-config`
3. ⏸️ **Seguir etapas 1-7** do plano de migração
4. ⏸️ **Usar feature flags** para rollout gradual

---

## 📞 Contato

**Documentação Completa**:
- 📄 Parte 1: `CENTRALIZACAO_CONFIGURACAO_PLANO.md`
- 📄 Parte 2: `CENTRALIZACAO_CONFIGURACAO_PARTE2.md`
- 📄 Parte 3: `CENTRALIZACAO_CONFIGURACAO_PARTE3.md`
- 📚 README: `CENTRALIZACAO_CONFIG_README.md`

**Suporte**:
- GitHub Issues (bugs/dúvidas técnicas)
- `/sc:brainstorm` no Claude Code
- Email: Time SV Lentes

---

**Última Atualização**: 2025-10-18
**Status**: ✅ Pronto para aprovação e implementação
**Nível de Confiança**: 🟢 Alto (Plano detalhado + exemplos de código + testes)
