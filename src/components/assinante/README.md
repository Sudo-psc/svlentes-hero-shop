# Portal do Assinante - Fase 2 Components

Documentação dos componentes React criados para a Fase 2 do Portal do Assinante.

## Componentes Implementados

### 1. RealTimeDeliveryStatus

Componente de status de entrega em tempo real com rastreamento detalhado.

**Localização:** `src/components/assinante/RealTimeDeliveryStatus.tsx`

**Props:**
```typescript
interface RealTimeDeliveryStatusProps {
  subscriptionId: string
  autoRefreshInterval?: number // default: 5 minutos (300000ms)
  className?: string
}
```

**Features:**
- ✅ Card destacado com status atual da entrega
- ✅ Progress bar animada (0-100%)
- ✅ Timeline de eventos de rastreio com timestamps
- ✅ Countdown dinâmico até chegada
- ✅ Ícone animado baseado em status (processing, shipped, in_transit, out_for_delivery, delivered)
- ✅ Link de rastreio externo quando disponível
- ✅ Auto-refresh a cada 5 minutos (configurável)
- ✅ Refresh manual com botão
- ✅ Loading skeleton durante carregamento
- ✅ Error state com retry
- ✅ Empty state (sem entregas pendentes)
- ✅ Responsive (card completo desktop, compacto mobile)

**Estados de Entrega:**
- `processing` - Processando Pedido (azul)
- `shipped` - Enviado (cyan)
- `in_transit` - Em Trânsito (amber)
- `out_for_delivery` - Saiu para Entrega (purple)
- `delivered` - Entregue (green)

**API Integration:**
```typescript
// Endpoint esperado
GET /api/assinante/delivery-status?subscriptionId={id}

// Response esperada
{
  orderId: string
  trackingCode?: string
  trackingUrl?: string
  currentStatus: 'processing' | 'shipped' | 'in_transit' | 'out_for_delivery' | 'delivered'
  estimatedDelivery: string // ISO 8601 date
  progressPercentage: number // 0-100
  events: Array<{
    id: string
    timestamp: string // ISO 8601
    status: string
    location?: string
    description: string
  }>
  carrier?: string
  lastUpdated: string // ISO 8601
}
```

**Exemplo de Uso:**
```tsx
import RealTimeDeliveryStatus from '@/components/assinante/RealTimeDeliveryStatus'

export default function DashboardPage() {
  return (
    <RealTimeDeliveryStatus
      subscriptionId="sub_123456"
      autoRefreshInterval={300000} // 5 minutos
    />
  )
}
```

---

### 2. FloatingWhatsAppButton

Botão flutuante de WhatsApp com contexto dinâmico e indicador de mensagens não lidas.

**Localização:** `src/components/assinante/FloatingWhatsAppButton.tsx`

**Props:**
```typescript
interface FloatingWhatsAppButtonProps {
  subscriptionId?: string
  context?: 'general' | 'renewal' | 'support' | 'delivery' | 'payment'
  orderId?: string
  hasUnreadMessages?: boolean
  unreadCount?: number
  className?: string
}
```

**Features:**
- ✅ Botão circular fixo (bottom-right)
- ✅ Ícone WhatsApp oficial com cor verde oficial (#25d366)
- ✅ Badge com contador de mensagens não lidas
- ✅ Tooltip on hover com informações
- ✅ Animação de pulse suave
- ✅ Click abre WhatsApp com contexto pré-preenchido
- ✅ Oculta em scroll down, mostra em scroll up
- ✅ Indicador online (ponto verde pulsante)
- ✅ Tooltip automático nos primeiros 2 segundos
- ✅ Responsivo (48x48px mobile, 56x56px desktop)
- ✅ Acessibilidade (ARIA labels, keyboard navigation)

**Mensagens Contextuais:**
- `general`: "Olá! Preciso de ajuda com minha assinatura SV Lentes."
- `renewal`: "Olá! Gostaria de informações sobre a renovação da minha assinatura."
- `support`: "Olá! Preciso de suporte técnico com minha conta."
- `delivery`: "Olá! Gostaria de informações sobre minha entrega."
- `payment`: "Olá! Tenho uma dúvida sobre pagamento."

**Exemplo de Uso:**
```tsx
import FloatingWhatsAppButton from '@/components/assinante/FloatingWhatsAppButton'

export default function Layout({ children }) {
  return (
    <>
      {children}
      <FloatingWhatsAppButton
        subscriptionId="sub_123456"
        context="support"
        hasUnreadMessages={true}
        unreadCount={3}
      />
    </>
  )
}
```

---

### 3. ContextualQuickActions

Grid de ações rápidas contextuais com alertas destacados.

**Localização:** `src/components/assinante/ContextualQuickActions.tsx`

**Props:**
```typescript
interface QuickAction {
  id: string
  label: string
  description: string
  icon: LucideIcon
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  onClick: () => void
}

interface Alert {
  type: 'info' | 'warning' | 'error'
  message: string
  action?: {
    label: string
    onClick: () => void
  }
}

interface ContextualQuickActionsProps {
  actions: QuickAction[]
  alerts?: Alert[]
  isLoading?: boolean
  className?: string
}
```

**Features:**
- ✅ Grid responsivo (2 cols mobile, 4 cols desktop)
- ✅ Máximo 4 ações visíveis (auto-limitado)
- ✅ Ícones coloridos por variante (primary, secondary, success, warning, danger)
- ✅ Descrições em tooltips
- ✅ Alerts destacados no topo com dismiss
- ✅ Click navega ou executa ação
- ✅ Animação fade-in + slide-up
- ✅ Keyboard navigation (Enter/Space)
- ✅ Loading skeleton
- ✅ Empty state
- ✅ Gradientes sutis por variante

**Variantes de Ação:**
- `primary` - Cyan (ações principais)
- `secondary` - Gray (ações secundárias)
- `success` - Green (ações positivas)
- `warning` - Amber (ações de atenção)
- `danger` - Red (ações destrutivas)

**API Integration:**
```typescript
// Endpoint esperado
GET /api/assinante/contextual-actions?subscriptionId={id}

// Response esperada
{
  actions: Array<{
    id: string
    label: string
    description: string
    icon: string // Lucide icon name
    variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
    action: string // URL or action identifier
  }>
  alerts?: Array<{
    type: 'info' | 'warning' | 'error'
    message: string
    action?: {
      label: string
      url: string
    }
  }>
}
```

**Exemplo de Uso:**
```tsx
import { Package, CreditCard, Calendar, MessageCircle } from 'lucide-react'
import ContextualQuickActions from '@/components/assinante/ContextualQuickActions'

export default function Dashboard() {
  const actions = [
    {
      id: 'renewal',
      label: 'Renovar Agora',
      description: 'Renove sua assinatura antecipadamente',
      icon: Package,
      variant: 'primary' as const,
      onClick: () => router.push('/renovar')
    },
    {
      id: 'payment',
      label: 'Ver Pagamentos',
      description: 'Histórico de cobranças',
      icon: CreditCard,
      variant: 'secondary' as const,
      onClick: () => router.push('/pagamentos')
    },
    {
      id: 'schedule',
      label: 'Agendar Consulta',
      description: 'Marque seu retorno oftalmológico',
      icon: Calendar,
      variant: 'success' as const,
      onClick: () => router.push('/agendar')
    },
    {
      id: 'support',
      label: 'Suporte',
      description: 'Fale conosco via WhatsApp',
      icon: MessageCircle,
      variant: 'warning' as const,
      onClick: () => window.open('https://wa.me/5533999898026')
    }
  ]

  const alerts = [
    {
      type: 'warning' as const,
      message: 'Sua assinatura vence em 3 dias. Renove para não perder benefícios!',
      action: {
        label: 'Renovar',
        onClick: () => router.push('/renovar')
      }
    }
  ]

  return (
    <ContextualQuickActions
      actions={actions}
      alerts={alerts}
    />
  )
}
```

---

## Integração Completa

Exemplo de página dashboard completa integrando todos os componentes:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Package,
  CreditCard,
  Calendar,
  MessageCircle,
  User,
  Settings
} from 'lucide-react'
import RealTimeDeliveryStatus from '@/components/assinante/RealTimeDeliveryStatus'
import FloatingWhatsAppButton from '@/components/assinante/FloatingWhatsAppButton'
import ContextualQuickActions, {
  type QuickAction,
  type Alert
} from '@/components/assinante/ContextualQuickActions'

export default function DashboardPage() {
  const router = useRouter()
  const subscriptionId = 'sub_123456' // From session/auth

  // Fetch contextual actions
  const [actions, setActions] = useState<QuickAction[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchActions = async () => {
      try {
        const response = await fetch(
          `/api/assinante/contextual-actions?subscriptionId=${subscriptionId}`
        )
        const data = await response.json()

        // Transform API response to component props
        setActions(
          data.actions.map((action: any) => ({
            ...action,
            icon: getIconByName(action.icon), // Helper to map icon names
            onClick: () => handleActionClick(action.action)
          }))
        )

        setAlerts(data.alerts || [])
      } catch (error) {
        console.error('Failed to fetch actions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchActions()
  }, [subscriptionId])

  const handleActionClick = (action: string) => {
    if (action.startsWith('http')) {
      window.open(action, '_blank')
    } else {
      router.push(action)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Quick Actions */}
      <ContextualQuickActions
        actions={actions}
        alerts={alerts}
        isLoading={isLoading}
      />

      {/* Delivery Status */}
      <RealTimeDeliveryStatus
        subscriptionId={subscriptionId}
        autoRefreshInterval={300000}
      />

      {/* Floating WhatsApp Button */}
      <FloatingWhatsAppButton
        subscriptionId={subscriptionId}
        context="support"
        hasUnreadMessages={false}
      />
    </div>
  )
}

// Helper function to map icon names to Lucide icons
function getIconByName(name: string) {
  const icons: Record<string, any> = {
    Package,
    CreditCard,
    Calendar,
    MessageCircle,
    User,
    Settings
  }
  return icons[name] || Package
}
```

---

## Endpoints API Necessários

### 1. GET /api/assinante/delivery-status
```typescript
// Query params: subscriptionId
// Response: DeliveryStatusData
```

### 2. GET /api/assinante/contextual-actions
```typescript
// Query params: subscriptionId
// Response: { actions: [], alerts: [] }
```

### 3. GET /api/whatsapp-redirect
```typescript
// Existing endpoint - no changes needed
```

---

## Design Tokens Utilizados

### Cores
- **Primary**: Cyan (#06b6d4) - Ações principais
- **Success**: Green (#22c55e) - Estados positivos
- **Warning**: Amber (#f59e0b) - Alertas
- **Danger**: Red (#ef4444) - Erros/ações destrutivas
- **WhatsApp**: Official green (#25d366) - WhatsApp branding
- **Medical**: Professional gray (#64748b) - Contexto médico

### Animações
- `fade-in` - 0.5s ease-in-out
- `slide-up` - 0.5s ease-out
- `pulse-slow` - 3s infinite
- Framer Motion spring animations (stiffness: 260, damping: 20)

### Responsividade
- Mobile: 2 colunas, cards compactos, botões 48x48px
- Desktop: 4 colunas, cards expandidos, botões 56x56px
- Breakpoint: 768px (md)

---

## Acessibilidade (WCAG 2.1 AA)

✅ Keyboard navigation completa
✅ ARIA labels em todos os botões
✅ Focus visible indicators
✅ Screen reader support
✅ Color contrast ratios >4.5:1
✅ Touch targets ≥44x44px (mobile)
✅ Reduced motion support (prefers-reduced-motion)

---

## Performance

✅ Auto-refresh otimizado (5 min default)
✅ Lazy loading de dados
✅ Memoização de componentes pesados
✅ Debounce em scroll listeners
✅ Skeleton states para perceived performance
✅ Animações GPU-accelerated (transform, opacity)

---

## Considerações de Integração

### 1. Estado de Autenticação
- Componentes assumem que `subscriptionId` está disponível
- Usar NextAuth ou sistema de sessão existente
- Redirecionar para login se não autenticado

### 2. Error Handling
- Todos os componentes têm error boundaries locais
- Retry automático em falhas de rede
- Mensagens de erro amigáveis

### 3. Loading States
- Skeletons durante carregamento inicial
- Spinners em refresh manual
- Estados vazios quando sem dados

### 4. Real-time Updates
- Auto-refresh configurável
- WebSocket opcional (futura melhoria)
- Polling inteligente baseado em atividade

---

## Próximos Passos (Fase 3)

- [ ] Implementar endpoints API no backend
- [ ] Testes E2E com Playwright
- [ ] Integração com sistema de notificações
- [ ] WebSocket para updates em tempo real
- [ ] Análise de engajamento (tracking events)
- [ ] A/B testing de CTAs contextuais
