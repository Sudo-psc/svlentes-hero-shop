# Changelog

All notable changes to the SV Lentes project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [FASE 2] Portal do Assinante - Engajamento - 2025-10-24

### 🎯 Objetivo
Aumentar engajamento e reduzir suporte através de funcionalidades contextuais e comunicação proativa.

### ✨ Adicionado

#### Real-Time Delivery Tracking
- **Component**: `RealTimeDeliveryStatus.tsx`
- Visual progress bar com 4 estágios de entrega
- Auto-refresh a cada 5 minutos
- Integração com rastreamento dos Correios
- Timeline interativa com status detalhado
- Display de endereço de entrega e itens do pedido
- Estimativa de data de entrega

#### Floating WhatsApp Button
- **Component**: `FloatingWhatsAppButton.tsx`
- Botão flutuante com contexto inteligente
- Comportamento adaptativo ao scroll
- Mensagens WhatsApp pré-formatadas por contexto
- Detecção de horário comercial
- Posicionamento responsivo (desktop/mobile)
- Animações suaves com Framer Motion

#### Contextual Quick Actions
- **Component**: `ContextualQuickActions.tsx`
- Atalhos dinâmicos baseados em estado da assinatura
- Badges de prioridade (urgente, aviso, info)
- 4 tipos de ação: modal, WhatsApp, navegação, link externo
- Ordenação automática por prioridade
- Máximo de 4-6 ações por contexto

### 🌐 APIs Criadas

#### GET /api/assinante/delivery-status
- Retorna status de entrega em tempo real
- Query params: `orderId`, `subscriptionId`
- Response includes: progress, tracking, address, items
- Auto-refresh support com metadata

#### GET /api/assinante/contextual-actions
- Retorna ações contextuais baseadas em estado
- Análise de subscription status, delivery, payments
- Priority-based action filtering
- Action types: modal, whatsapp, navigation, external

#### Enhanced GET /api/whatsapp-redirect
- Suporte a múltiplos contextos (renewal, support, delivery, payment)
- Mensagens pré-formatadas por contexto
- Business hours detection
- User data injection em templates

### 🔧 Melhorias

#### WhatsApp Integration
- Detecção automática de contexto ótimo
- Truncamento de mensagens longas (> 1500 chars)
- URL encoding apropriado para caracteres especiais
- Fallback para contexto 'support' em casos de erro

#### Subscription Dashboard
- Auto-refresh inteligente com page visibility API
- Cleanup adequado de intervals
- Gestão de estado otimizada
- Performance improvements para re-renders

### 📊 Componentes Atualizados
- `AccessibleDashboard.tsx` - Integração dos novos componentes Phase 2
- `QuickActions.tsx` - Coordenação com contextual actions
- `OrdersModal.tsx` - Link para delivery tracking

### 📚 Documentação Adicionada
- `PHASE2_IMPLEMENTATION_GUIDE.md` - Guia completo de implementação
- `WHATSAPP_INTEGRATION_GUIDE.md` - Documentação de integração WhatsApp
- Atualização de `SUBSCRIBER_DASHBOARD_PHASE1_APIS.md` com Phase 2 APIs
- Atualização de `SUBSCRIBER_DASHBOARD_TROUBLESHOOTING.md` com Phase 2 issues

### 🐛 Correções
- Auto-refresh interval cleanup em component unmount
- WhatsApp link encoding para caracteres especiais
- Z-index conflicts com floating button
- Empty state handling para contextual actions

### ⚡ Performance
- Code splitting para Phase 2 components (~18KB gzipped total)
- Lazy loading de componentes pesados
- Memoização de cálculos de contexto
- Cache client-side para delivery status (5 min TTL)

### 📈 Métricas Esperadas
- Redução de 40% em tickets de suporte sobre entregas
- Aumento de 60% em velocidade de contato com suporte
- Redução média de 3 cliques para tarefas comuns
- Aumento de engajamento no dashboard

---

## [FASE 1] Portal do Assinante - Fundação - 2025-10-23

### ✨ Adicionado

#### Dashboard Components
- `AccessibleDashboard.tsx` - Dashboard principal com acessibilidade WCAG 2.1 AA
- `EnhancedSubscriptionCard.tsx` - Card visual de status da assinatura
- `DashboardLoading.tsx` - Skeleton UI para estados de loading
- `DashboardError.tsx` - Componente de erro com retry
- `ToastFeedback.tsx` - Sistema de notificações toast
- `QuickActions.tsx` - Atalhos rápidos para ações comuns

#### Modal Components
- `OrdersModal.tsx` - Histórico de pedidos
- `InvoicesModal.tsx` - Download de faturas
- `ChangePlanModal.tsx` - Alteração de plano
- `UpdateAddressModal.tsx` - Atualização de endereço
- `UpdatePaymentModal.tsx` - Atualização de forma de pagamento

#### API Endpoints
- `GET /api/assinante/subscription` - Buscar assinatura ativa
- `PUT /api/assinante/subscription` - Atualizar endereço de entrega
- `GET /api/assinante/orders` - Listar histórico de pedidos
- `GET /api/assinante/invoices` - Listar faturas
- `POST /api/assinante/register` - Registrar novo usuário

#### Authentication & Security
- Firebase Admin SDK integration
- Bearer token verification
- Rate limiting (200/50/10 requests per 15min)
- CSRF protection em operações write
- LGPD compliance endpoints

### 📚 Documentação Criada
- `SUBSCRIBER_DASHBOARD_PHASE1_APIS.md` - Documentação completa de APIs
- `SUBSCRIBER_DASHBOARD_PHASE1_COMPONENTS.md` - Guia de componentes
- `SUBSCRIBER_DASHBOARD_ARCHITECTURE.md` - Arquitetura do sistema
- `SUBSCRIBER_DASHBOARD_TROUBLESHOOTING.md` - Guia de troubleshooting

### 🔧 Features
- Firebase Google OAuth authentication
- Real-time subscription data
- Framer Motion animations
- Mobile-responsive design
- Accessibility (ARIA, keyboard navigation)
- Toast notification system
- Modal state management
- Error handling com retry logic

### ⚡ Performance
- Code splitting com dynamic imports
- Memoização de componentes
- Lazy loading de modals
- Optimized bundle size

---

## [1.0.0] - Launch - 2025-01-15

### ✨ Adicionado
- Landing page inicial com hero section
- Calculadora de economia de lentes
- Formulário de agendamento de consulta
- Integração com WhatsApp para suporte
- Sistema de assinaturas com Asaas
- Política de privacidade (LGPD compliance)
- Termos de uso
- Design system com Tailwind CSS v4
- Componentes shadcn/ui

### 🔧 Infrastructure
- Next.js 15 com App Router
- TypeScript para type safety
- Prisma ORM com PostgreSQL
- Firebase Authentication
- Nginx reverse proxy
- Systemd service management
- SSL certificates com Let's Encrypt

### 📊 Features
- Responsive design mobile-first
- Accessibility (WCAG 2.1 AA)
- SEO optimization
- Performance monitoring
- Error tracking
- Analytics integration

---

## Semantic Versioning Guide

- **Major**: Breaking changes que requerem migração
- **Minor**: Novas features backward-compatible
- **Patch**: Bug fixes e melhorias menores

**Author**: Dr. Philipe Saraiva Cruz (CRM-MG 69.870)
**Maintained since**: 2025-01-15
