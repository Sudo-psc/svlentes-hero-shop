# Centralização de Configuração - SV Lentes

**Status**: 📋 Planejamento Completo
**Versão**: 1.0
**Data**: 2025-10-18
**Autor**: Claude Code

---

## 📑 Índice de Documentos

Este plano foi dividido em 3 partes para facilitar a leitura:

### 📄 Parte 1: Análise e Especificação
**Arquivo**: `CENTRALIZACAO_CONFIGURACAO_PLANO.md`

**Conteúdo**:
- ✅ A) Mapa da Situação Atual
- ✅ B) Especificação do Arquivo de Configuração Unificado
  - Formato YAML
  - Estrutura de arquivos
  - Esquema Zod completo
  - Exemplo completo: config/base.yaml (170+ linhas)
  - Overrides por ambiente (production.yaml, staging.yaml)

### 📄 Parte 2: Implementação e Integração
**Arquivo**: `CENTRALIZACAO_CONFIGURACAO_PARTE2.md`

**Conteúdo**:
- ✅ C) Camada de Acesso (Classes/Objetos)
  - ConfigService (singleton) com hot-reload
  - PlanService com cálculo de descontos
  - ThemeService para CSS vars
- ✅ D) Integração com Build e Estilo
  - Tailwind config integrado
  - Injeção de CSS vars no layout
  - Dark mode strategy
  - SSR/ISR cache invalidation
- ✅ E) Plano de Migração e Rollout
  - 7 etapas detalhadas
  - Critérios de aceite
  - Feature flags e rollout gradual
- ✅ F) Testes e Qualidade
  - Testes Zod de validação
  - Snapshot tests
  - Testes de i18n fallback
  - Testes de planos (formatação, período, moeda)
  - Linters/CI checks

### 📄 Parte 3: Riscos, Exemplos e Operação
**Arquivo**: `CENTRALIZACAO_CONFIGURACAO_PARTE3.md`

**Conteúdo**:
- ✅ G) Riscos e Mitigação
  - Exposição de segredos
  - Divergência tema CSS vs. config
  - Regressões de SEO
  - Dependência de CMS
- ✅ H) Exemplos de Código Essenciais
  - ConfigService completo
  - buildCssVars() e uso no layout
  - Exemplo de uso em componentes (Menu, Hero, PlanCard)
  - Script CLI para validar config
- ✅ I) Checklist Operacional
  - Padrão de nomenclatura i18n
  - Versionamento (semver + CHANGELOG)
  - Processo para contribuintes
  - Logs/Observabilidade
- ✅ **Estimativas de Esforço**
  - Breakdown por etapa (29-37h total)
  - Estimativa por perfil (sênior/pleno/júnior)
  - Cronograma recomendado (6-8 semanas)

---

## 🎯 Visão Geral

### Problema Atual
- **24+ arquivos** com número WhatsApp hardcoded
- **8+ locais** com informações do Dr. Philipe duplicadas
- **Sem i18n**: Expansão para inglês é impossível sem refactor massivo
- **Tema disperso**: Tailwind config vs. CSS vars vs. componentes
- **SEO inconsistente**: Metadata duplicada em cada page.tsx
- **Manutenção insustentável**: Alterar um texto = editar múltiplos arquivos

### Solução Proposta
**Configuração centralizada em YAML** com:
- ✅ Fonte única de verdade para todo conteúdo
- ✅ Validação em build-time com Zod
- ✅ Suporte i18n nativo (pt-BR, en-US)
- ✅ Type-safe access via ConfigService
- ✅ Hot-reload em desenvolvimento
- ✅ Versionamento e CHANGELOG

### Estrutura Final

```
config/
├── schema.ts                  # Zod schemas + TypeScript types
├── loader.ts                  # ConfigService (singleton)
├── base.yaml                  # Configuração base (pt-BR) - 400+ linhas
├── production.yaml            # Overrides de produção
├── staging.yaml               # Overrides de staging
├── services/
│   ├── plan-service.ts        # Lógica de planos/pricing
│   └── theme-service.ts       # Geração de CSS vars
├── CHANGELOG.md               # Histórico de mudanças
└── README.md                  # Documentação do sistema
```

---

## 🚀 Quick Start

### 1. Validar Config Atual (Futuro)
```bash
npm run config:validate
```

### 2. Usar em Componente
```typescript
import { config } from '@/config/loader'

export function MyComponent() {
  const t = (key: string) => config.t('pt-BR', key)

  return <h1>{t('hero.title')}</h1>
}
```

### 3. Acessar Planos
```typescript
import { PlanService } from '@/config/services/plan-service'

const planService = new PlanService()
const plans = planService.getPlans('monthly', 'pt-BR')
```

---

## 📊 Métricas de Sucesso

| Métrica | Antes | Depois (Meta) |
|---------|-------|---------------|
| Arquivos com WhatsApp | 24+ | 1 (config/base.yaml) |
| Duplicação Dr. Philipe | 8+ locais | 1 |
| Suporte i18n | ❌ Não | ✅ Sim (pt-BR, en-US) |
| Validação build-time | ❌ Não | ✅ Zod schema |
| Tempo para mudar texto | 15-30min | 2-5min |
| Risco de inconsistência | 🔴 Alto | 🟢 Baixo |

---

## 🗓️ Cronograma Resumido

**Total**: 6-8 semanas (developer sênior)

| Fase | Duração | Deliverable |
|------|---------|-------------|
| **Fase 1: Setup** | Semana 1-2 | Config YAML + Services |
| **Fase 2: Refactor** | Semana 3-4 | Menus, Copy, Planos, SEO, Tema |
| **Fase 3: Testes** | Semana 5-6 | Unit, E2E, Feature Flag |
| **Fase 4: Rollout** | Semana 7-8 | Monitoramento, Docs, 100% |

---

## 💡 Próximas Ações

### Para Implementar Este Plano:

1. **Revisar Documentação**
   - [ ] Ler as 3 partes do plano
   - [ ] Discutir com time técnico
   - [ ] Aprovar escopo e cronograma

2. **Preparar Ambiente**
   - [ ] Criar branch `feature/centralized-config`
   - [ ] Instalar dependências: `zod`, `yaml`
   - [ ] Setup CI para validação de config

3. **Iniciar Implementação**
   - [ ] Seguir etapas 1-7 da Parte 2 (Seção E)
   - [ ] Usar exemplos de código da Parte 3 (Seção H)
   - [ ] Aplicar checklist operacional da Parte 3 (Seção I)

4. **Monitorar e Ajustar**
   - [ ] Acompanhar métricas pós-deploy
   - [ ] Coletar feedback do time
   - [ ] Iterar conforme necessário

---

## 📚 Referências Técnicas

### Tecnologias Utilizadas
- **YAML**: Formato de config (human-readable)
- **Zod**: Validação de schema em TypeScript
- **Next.js 15**: App Router, metadata API, SSR/ISR
- **Tailwind CSS**: Integração com theme tokens
- **Playwright**: Testes E2E de regressão

### Padrões Aplicados
- **Singleton Pattern**: ConfigService
- **Service Layer**: PlanService, ThemeService
- **Deep Merge**: Merge de configs por ambiente
- **Dependency Injection**: Config como dependência
- **Feature Flags**: Rollout gradual e safe deploy

---

## ❓ FAQ

### P: Por que YAML e não JSON?
**R**: YAML suporta comentários, é mais legível para não-desenvolvedores, e é validável via Zod assim como JSON.

### P: Como funciona hot-reload em dev?
**R**: ConfigService usa `fs.watch()` para detectar mudanças em `config/*.yaml` e recarrega automaticamente.

### P: E se o CMS já gerencia parte do conteúdo?
**R**: Use a estratégia de merge (Parte 3, Seção G, Risco 4): Config fornece fallbacks, CMS sobrescreve campos editáveis.

### P: Como garantir que tema CSS e config não divergem?
**R**: Use `themeService.buildTailwindTheme()` no `tailwind.config.js` + CI check (Parte 3, Seção G, Risco 2).

### P: É possível adicionar novos idiomas depois?
**R**: Sim! Basta adicionar `copy.en-US` no YAML e o sistema já está preparado (fallback automático para pt-BR).

---

## 📞 Suporte

- **Dúvidas técnicas**: Consultar as 3 partes da documentação
- **Issues/Bugs**: GitHub Issues do projeto
- **Brainstorming**: `/sc:brainstorm` no Claude Code

---

**Última Atualização**: 2025-10-18
**Mantenedor**: Time SV Lentes
**Status**: ✅ Pronto para implementação
