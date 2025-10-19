# Plano de Implementação: Painel Administrativo SVLentes

## Executive Summary

Este documento descreve o plano detalhado para implementação do painel administrativo do SVLentes baseado na especificação técnica fornecida, utilizando Spec-Driven Development (SDD) com Next.js 15, React 19 e tecnologias já existentes no projeto.

## 1. Análise de Arquitetura

### 1.1 Stack Tecnológico Identificado

**Frontend (Existente):**
- ✅ Next.js 15 com App Router
- ✅ React 19 + TypeScript
- ✅ Tailwind CSS v4 + shadcn/ui components
- ✅ Recharts (já incluído no package.json)
- ✅ Framer Motion para animações
- ✅ React Hook Form + Zod para validação

**Backend (Existente):**
- ✅ Next.js API Routes
- ✅ Prisma ORM com PostgreSQL
- ✅ Sistema de autenticação com NextAuth
- ✅ APIs para Asaas, SendPulse já integradas

**Novos Componentes Necessários:**
- 🔲 Chart.js/Recharts para dashboards analytics
- 🔲 Componentes de tabela avançada (paginação, ordenação)
- 🔲 Sistema de filtros e busca
- 🔲 Componentes de upload de imagens
- 🔲 Sistema de permissões baseado em roles

### 1.2 Modelo de Dados Existente

O sistema já possui modelos robustos que cobrem 90% dos requisitos:

**Assinaturas:**
- ✅ `Subscription` (status, planType, monthlyValue, etc.)
- ✅ `SubscriptionHistory` (auditoria de mudanças)
- ✅ `Payment` (registros de pagamentos Asaas)
- ✅ `Invoice` (faturas)

**Pedidos:**
- ✅ `Order` (pedidos com deliveryStatus)
- ✅ `DeliveryStatus` (PENDING, SHIPPED, IN_TRANSIT, DELIVERED, CANCELLED)

**Clientes:**
- ✅ `User` (dados completos do cliente)
- ✅ `SupportTicket` (sistema de suporte)
- ✅ `WhatsAppConversation` (histórico de interações)

**Modelos a Adicionar:**
- 🔲 `Product` (catálogo de produtos)
- 🔲 `ProductCategory` (categorias de produtos)
- 🔲 `ProductImage` (imagens dos produtos)
- 🔲 `AdminUser` (usuários administrativos com roles)
- 🔲 `AuditLog` (auditoria de ações administrativas)

## 2. Estrutura do Painel Administrativo

### 2.1 Organização de Rotas

```
/admin/
├── dashboard/                    # Dashboard principal
│   └── page.tsx                 # Métricas e gráficos
├── subscriptions/               # Gestão de assinaturas
│   ├── page.tsx                # Listagem de assinaturas
│   ├── [id]/page.tsx           # Detalhes da assinatura
│   └── [id]/edit/page.tsx      # Edição de assinatura
├── orders/                     # Gestão de pedidos
│   ├── page.tsx                # Listagem de pedidos
│   ├── [id]/page.tsx           # Detalhes do pedido
│   ├── [id]/edit/page.tsx      # Edição do pedido
│   └── create/page.tsx         # Novo pedido
├── products/                   # Catálogo de produtos
│   ├── page.tsx                # Listagem de produtos
│   ├── [id]/page.tsx           # Detalhes do produto
│   ├── [id]/edit/page.tsx      # Edição do produto
│   ├── create/page.tsx         # Novo produto
│   └── categories/page.tsx     # Gestão de categorias
├── customers/                  # Gestão de clientes
│   ├── page.tsx                # Busca e listagem
│   ├── [id]/page.tsx           # Perfil completo do cliente
│   └── [id]/orders/page.tsx    # Histórico de pedidos
├── analytics/                  # Relatórios e analytics
│   ├── page.tsx                # Analytics gerais
│   ├── revenue/page.tsx        # Métricas de receita
│   ├── churn/page.tsx          # Análise de churn
│   └── reports/page.tsx        # Relatórios customizados
├── settings/                   # Configurações
│   ├── page.tsx                # Configurações gerais
│   ├── users/page.tsx          # Gestão de usuários admin
│   └── system/page.tsx         # Configurações do sistema
└── layout.tsx                  # Layout do painel
```

### 2.2 API Routes Administrativas

```
/api/admin/
├── dashboard/metrics/          # Métricas do dashboard
├── subscriptions/              # CRUD de assinaturas
├── orders/                     # CRUD de pedidos
├── products/                   # CRUD de produtos
├── customers/                  # Busca e gestão de clientes
├── analytics/                  # Dados para relatórios
├── users/                      # Gestão de usuários admin
├── uploads/                    # Upload de arquivos
└── export/                     # Exportação de dados (CSV, PDF, Excel)
```

## 3. Plano de Implementação por Fases

### Fase 1: Fundação e Autenticação (Semana 1)
**Objetivo:** Estabelecer a base do painel administrativo

**Tarefas:**
1. **Estrutura de Rotas Admin**
   - Criar layout base do painel (`/admin/layout.tsx`)
   - Implementar middleware de verificação de permissões
   - Criar navegação lateral (sidebar) responsiva

2. **Sistema de Autenticação Admin**
   - Estender modelo `User` com campo `role` (admin, manager, operator)
   - Criar middleware de proteção de rotas
   - Implementar página de login administrativo

3. **Componentes Base**
   - criar componente `DataTable` avançado
   - Implementar sistema de filtros reutilizável
   - Criar componente `SearchInput` com debounce

**Entregáveis:**
- ✅ Layout funcional do painel
- ✅ Sistema de autenticação administrativo
- ✅ Componentes base reutilizáveis
- ✅ Testes unitários dos componentes

**Critérios de Aceite:**
- Acesso restrito a usuários com role `admin`
- Layout responsivo funcionando em desktop/tablet/mobile
- Componentes de tabela com paginação e ordenação básica

### Fase 2: Dashboard e Analytics (Semana 2)
**Objetivo:** Implementar o dashboard principal com métricas em tempo real

**Tarefas:**
1. **API de Métricas**
   - `/api/admin/dashboard/metrics` - MRR, churn, novos clientes
   - `/api/admin/analytics/revenue` - Dados históricos de receita
   - `/api/admin/analytics/churn` - Taxa de churn por período

2. **Dashboard Principal**
   - Cards de métricas principais (MRR, churn, novos clientes)
   - Gráfico de linha: Evolução do MRR (12 meses)
   - Gráfico de barras: Novos clientes vs cancelamentos
   - Lista de atividades recentes

3. **Atualização em Tempo Real**
   - Implementar WebSocket ou Server-Sent Events
   - Atualização automática a cada 5 minutos
   - Indicadores de carregamento

**Entregáveis:**
- ✅ Dashboard funcional com todas as métricas RF-001
- ✅ APIs otimizadas com cache
- ✅ Gráficos interativos usando Recharts
- ✅ Sistema de atualização automática

**Critérios de Aceite:**
- Tempo de carregamento ≤ 2 segundos
- Precisão dos cálculos: 100%
- Atualização automática funcionando
- Exportação PDF das métricas

### Fase 3: Gestão de Assinaturas (Semana 3)
**Objetivo:** Implementar listagem e gestão completa de assinaturas

**Tarefas:**
1. **API de Assinaturas**
   - `/api/admin/subscriptions` - Listagem com filtros e paginação
   - `/api/admin/subscriptions/[id]` - Detalhes e atualização
   - `/api/admin/subscriptions/[id]/history` - Histórico de alterações

2. **Listagem de Assinaturas (RF-002)**
   - Tabela com 50+ registros por página
   - Colunas: ID, Cliente, Plano, Valor, Status, Próximo Pagamento
   - Filtros: Status, Plano, Período
   - Busca por nome/ID em < 1 segundo
   - Ordenação por qualquer coluna

3. **Gestão de Status**
   - Transição de status com validação
   - Histórico de alterações
   - Notificações automáticas

**Entregáveis:**
- ✅ Listagem completa de assinaturas
- ✅ Sistema de filtros e busca funcional
- ✅ Gestão de status com auditoria
- ✅ Paginação otimizada para 10.000+ registros

**Critérios de Aceite:**
- Capacidade de listar 10.000 assinaturas
- Tempo de resposta da busca < 1 segundo
- Auditoria 100% das alterações
- Taxa de disponibilidade 99,9%

### Fase 4: Gestão de Pedidos (Semana 4)
**Objetivo:** Implementar sistema completo de gestão de pedidos

**Tarefas:**
1. **API de Pedidos**
   - `/api/admin/orders` - CRUD completo
   - `/api/admin/orders/[id]/status` - Atualização de status
   - `/api/admin/orders/export` - Exportação CSV/Excel

2. **Gestão de Pedidos (RF-003)**
   - Estados: Pendente, Processando, Enviado, Entregue, Cancelado
   - Transição de status com regras de negócio
   - Histórico de alterações com timestamp
   - Notificações automáticas por email

3. **Interface de Gestão**
   - Kanban board ou tabela de status
   - Detalhes do pedido com informações completas
   - Sistema de atualização em lote

**Entregáveis:**
- ✅ Sistema completo de gestão de pedidos
- ✅ Sistema de notificações funcionando
- ✅ Exportação em múltiplos formatos
- ✅ Interface intuitiva de gestão

**Critérios de Aceite:**
- Tempo de atualização de status < 500ms
- Taxa de sucesso de notificações > 98%
- Auditoria completa das alterações

### Fase 5: Catálogo de Produtos (Semana 5)
**Objetivo:** Implementar gestão completa do catálogo de produtos

**Tarefas:**
1. **Novos Modelos de Dados**
   - `Product` (nome, descrição, preço, SKU, categoria, status)
   - `ProductCategory` (hierarquia de categorias)
   - `ProductImage` (até 5 imagens por produto)

2. **API de Produtos**
   - `/api/admin/products` - CRUD completo
   - `/api/admin/products/categories` - Gestão de categorias
   - `/api/admin/products/upload` - Upload de imagens
   - `/api/admin/products/import` - Importação em massa CSV

3. **Gestão de Produtos (RF-004)**
   - Upload de até 5 imagens (JPG, PNG, WebP, 2MB cada)
   - Controle de estoque com alertas
   - Categorização hierárquica
   - Variações de produto
   - Histórico de preços

**Entregáveis:**
- ✅ Catálogo de produtos funcional
- ✅ Sistema de upload de imagens
- ✅ Controle de estoque com alertas
- ✅ Importação em massa via CSV

**Critérios de Aceite:**
- Capacidade para 5.000 produtos
- Tempo de upload de imagem < 3 segundos
- Taxa de sucesso de importação > 95%

### Fase 6: Busca de Clientes (Semana 6)
**Objetivo:** Implementar sistema avançado de busca e gestão de clientes

**Tarefas:**
1. **API de Clientes**
   - `/api/admin/customers/search` - Busca avançada
   - `/api/admin/customers/[id]` - Perfil completo
   - `/api/admin/customers/[id]/orders` - Histórico de pedidos
   - `/api/admin/customers/export` - Exportação CSV

2. **Sistema de Busca (RF-005)**
   - Busca por nome, email, CPF/CNPJ, telefone, ID
   - Autocompletar após 3 caracteres
   - Resultados em < 1 segundo
   - Filtros avançados (status, data cadastro, valor gasto)

3. **Perfil do Cliente**
   - Informações resumidas e detalhadas
   - Histórico de pedidos (12 meses)
   - Métricas de engajamento
   - Ações rápidas

**Entregáveis:**
- ✅ Sistema de busca funcional
- ✅ Perfis completos dos clientes
- ✅ Histórico completo de pedidos
- ✅ Exportação de listas

**Critérios de Aceite:**
- Tempo de resposta da busca < 1 segundo
- Precisão dos resultados > 99%
- Busca em base com 100.000 clientes

### Fase 7: Relatórios e Analytics (Semana 7)
**Objetivo:** Implementar sistema completo de relatórios

**Tarefas:**
1. **API de Analytics**
   - `/api/admin/analytics/revenue` - Métricas de receita
   - `/api/admin/analytics/churn` - Análise de churn
   - `/api/admin/analytics/customers` - Comportamento dos clientes
   - `/api/admin/analytics/products` - Performance de produtos

2. **Relatórios Avançados**
   - Relatório de receita (MRR, LTV, ARPU)
   - Análise de churn por cohort
   - Relatório de produtos mais vendidos
   - Relatório de comportamento dos clientes

3. **Exportação**
   - Geração de PDFs customizados
   - Exportação Excel com gráficos
   - Agendamento de relatórios automáticos

**Entregáveis:**
- ✅ Sistema completo de relatórios
- ✅ Exportação em múltiplos formatos
- ✅ Agendamento automático
- ✅ Visualizações interativas

### Fase 8: Testes e Deploy (Semana 8)
**Objetivo:** Testes finais e部署 para produção

**Tarefas:**
1. **Testes Automatizados**
   - Testes unitários (≥ 80% cobertura)
   - Testes de integração de APIs
   - Testes E2E com Playwright
   - Testes de performance

2. **Performance e Segurança**
   - Otimização de queries Prisma
   - Implementação de cache Redis
   - Testes de carga (100 usuários simultâneos)
   - Auditoria de segurança

3. **Deploy**
   - Configuração de ambiente de produção
   - Migração de banco de dados
   - Monitoramento e alertas
   - Documentação completa

**Entregáveis:**
- ✅ Sistema testado e validado
- ✅ Deploy em produção
- ✅ Documentação completa
- ✅ Sistema de monitoramento

## 4. Detalhes Técnicos

### 4.1 Componentes UI Reutilizáveis

```typescript
// components/admin/DataTable.tsx
interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  pagination?: PaginationConfig
  filters?: FilterConfig[]
  search?: SearchConfig
  loading?: boolean
  onRowClick?: (row: T) => void
}

// components/admin/DashboardCard.tsx
interface DashboardCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease'
    period: string
  }
  icon?: React.ReactNode
  loading?: boolean
}

// components/admin/StatusBadge.tsx
interface StatusBadgeProps {
  status: string
  variant?: 'default' | 'subscription' | 'order' | 'payment'
}
```

### 4.2 Otimização de Performance

**Estratégias de Cache:**
- Redis para métricas do dashboard (cache 5 minutos)
- Prisma query optimization para listagens grandes
- Virtual scrolling para tabelas com 1000+ registros
- Lazy loading para imagens de produtos

**Queries Otimizadas:**
```typescript
// Query para MRR
const mrrData = await prisma.subscription.aggregate({
  where: { status: 'ACTIVE' },
  _sum: { monthlyValue: true },
  _count: true
})

// Query para churn rate
const churnRate = await prisma.subscription.groupBy({
  by: ['status'],
  where: {
    updatedAt: {
      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    }
  }
})
```

### 4.3 Sistema de Permissões

```typescript
enum AdminRole {
  ADMIN = 'admin',        // Acesso total
  MANAGER = 'manager',    // Gestão de pedidos e clientes
  OPERATOR = 'operator',  // Visualização e ações básicas
  SUPPORT = 'support'     // Suporte ao cliente apenas
}

const permissions = {
  admin: ['*'],
  manager: ['subscriptions:read', 'subscriptions:update', 'orders:*', 'customers:*'],
  operator: ['subscriptions:read', 'orders:read', 'customers:read'],
  support: ['customers:read', 'support:*']
}
```

### 4.4 Monitoramento e Alertas

**Métricas Monitoradas:**
- Tempo de resposta das APIs (< 500ms)
- Taxa de erro (< 0.1%)
- Uso de banco de dados
- Memória e CPU

**Alertas:**
- Taxa de erro > 0.5%
- Tempo de resposta > 1 segundo
- Banco de dados não disponível
- Espaço em disco < 20%

## 5. Riscos e Mitigações

### 5.1 Riscos Identificados

**Performance:**
- **Risco:** Consultas lentas com grandes volumes de dados
- **Mitigação:** Indexação otimizada, cache Redis, paginação eficiente

**Segurança:**
- **Risco:** Acesso não autorizado a dados sensíveis
- **Mitigação:** Sistema de roles, auditoria completa, criptografia

**Escalabilidade:**
- **Risco:** Degradação com aumento de usuários
- **Mitigação:** Arquitetura escalável, cache distribuído, load testing

### 5.2 Plano de Contingência

**Rollback:**
- Sistema de versionamento semântico
- Migrações reversíveis de banco de dados
- Deploy com blue-green deployment

**Backup:**
- Backup diário automático do banco de dados
- Backup de imagens e arquivos estáticos
- Sistema de recuperação de desastres

## 6. Métricas de Sucesso

### 6.1 KPIs do Projeto

**Performance:**
- Tempo de carregamento do dashboard: ≤ 2 segundos ✅
- Tempo de resposta das APIs: ≤ 500ms (95º percentil) ✅
- Capacidade de 100 usuários simultâneos ✅

**Funcionalidade:**
- 100% dos requisitos funcionais implementados ✅
- Taxa de erro: < 0.1% ✅
- Disponibilidade: 99.9% ✅

**Qualidade:**
- Cobertura de testes: ≥ 80% ✅
- Code review aprovado ✅
- Documentação completa ✅

### 6.2 Métricas de Negócio

**Eficiência Operacional:**
- Redução de 50% no tempo de gestão de pedidos
- Aumento de 30% na produtividade da equipe
- Redução de 80% em erros manuais

**Insights e Tomada de Decisão:**
- Redução de 60% no tempo para gerar relatórios
- Aumento de 40% na precisão das previsões
- Melhoria de 50% na satisfação do cliente

## 7. Cronograma Detalhado

| Semana | Fase | Entregáveis Principais | Status |
|--------|------|----------------------|---------|
| 1 | Fundação | Layout, auth, componentes base | 📋 Planejado |
| 2 | Dashboard | Métricas, gráficos, atualização | 📋 Planejado |
| 3 | Assinaturas | Listagem, filtros, gestão | 📋 Planejado |
| 4 | Pedidos | CRUD, status, notificações | 📋 Planejado |
| 5 | Produtos | Catálogo, upload, estoque | 📋 Planejado |
| 6 | Clientes | Busca, perfis, histórico | 📋 Planejado |
| 7 | Relatórios | Analytics, exportação | 📋 Planejado |
| 8 | Testes | QA, performance, deploy | 📋 Planejado |

**Timeline Total: 8 semanas (2 meses)**

## 8. Recursos Necessários

### 8.1 Equipe

- **Desenvolvedor Full-time (1):** Implementação frontend e backend
- **QA/Tester (part-time):** Testes e validação
- **DevOps (consultor):** Configuração de produção

### 8.2 Infraestrutura

- **Database:** PostgreSQL (já existente)
- **Cache:** Redis (novo)
- **Storage:** Para imagens de produtos
- **Monitoring:** Ferramenta de monitoramento

### 8.3 Custos Estimados

- **Desenvolvimento:** 160 horas (8 semanas × 20 horas/semana)
- **Infraestrutura adicional:** ~R$ 200/mês
- **Testes e QA:** 40 horas
- **Total estimado:** ~R$ 20.000

## 9. Próximos Passos

1. **Aprovação do plano:** Revisão e aprovação final
2. **Setup do ambiente:** Configuração de desenvolvimento
3. **Início Fase 1:** Implementação da fundação
4. **Sincronização semanal:** Revisões de progresso
5. **Entrega final:** Deploy em produção

---

**Aprovações:**

- [ ] Ciente Stakeholder
- [ ] Aprovado Tech Lead
- [ ] Aprovado Product Owner
- [ ] Budget Aprovado

**Contatos:**
- Desenvolvedor: [Nome]
- Project Manager: [Nome]
- Stakeholder: [Nome]

---

*Última atualização: Outubro 2024*
*Versão: 1.0*