# Exemplo de Uso - Componentes Dashboard

**Data**: 2025-10-23
**Componentes**: DashboardMetricsCards, NotificationCenter, DeliveryTimeline, SavingsWidget

---

## Importação dos Componentes

```typescript
// src/app/area-assinante/dashboard/page.tsx
'use client'

import { DashboardMetricsCards } from '@/components/assinante/DashboardMetricsCards'
import { NotificationCenter } from '@/components/assinante/NotificationCenter'
import { DeliveryTimeline } from '@/components/assinante/DeliveryTimeline'
import { SavingsWidget } from '@/components/assinante/SavingsWidget'
import type { Notification, DeliveryData } from '@/components/assinante/...'
```

---

## 1. DashboardMetricsCards

### Uso Básico

```typescript
export default function DashboardPage() {
  return (
    <DashboardMetricsCards
      totalSavings={285.50}
      lensesReceived={6}
      nextDeliveryDate="2025-11-15"
      punctualityRate={95}
    />
  )
}
```

### Com Estado de Loading

```typescript
export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [metrics, setMetrics] = useState(null)

  useEffect(() => {
    fetch('/api/v1/subscriber/metrics')
      .then(res => res.json())
      .then(data => {
        setMetrics(data)
        setIsLoading(false)
      })
  }, [])

  return (
    <DashboardMetricsCards
      totalSavings={metrics?.totalSavings}
      lensesReceived={metrics?.lensesReceived}
      nextDeliveryDate={metrics?.nextDeliveryDate}
      punctualityRate={metrics?.punctualityRate}
      isLoading={isLoading}
    />
  )
}
```

### Com Hook Customizado

```typescript
// hooks/useSubscriberMetrics.ts
export function useSubscriberMetrics() {
  const [data, setData] = useState<MetricsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/v1/subscriber/metrics')
      .then(res => {
        if (!res.ok) throw new Error('Falha ao carregar métricas')
        return res.json()
      })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [])

  return { data, isLoading, error }
}

// Uso na página
export default function DashboardPage() {
  const { data, isLoading, error } = useSubscriberMetrics()

  return (
    <DashboardMetricsCards
      totalSavings={data?.totalSavings}
      lensesReceived={data?.lensesReceived}
      nextDeliveryDate={data?.nextDeliveryDate}
      punctualityRate={data?.punctualityRate}
      isLoading={isLoading}
      error={error}
    />
  )
}
```

---

## 2. NotificationCenter

### Uso Básico no Header

```typescript
// components/layout/DashboardHeader.tsx
export function DashboardHeader() {
  const notifications: Notification[] = [
    {
      id: '1',
      type: 'delivery',
      title: 'Pedido enviado',
      message: 'Seu pedido #1234 foi enviado e deve chegar em 3 dias úteis',
      timestamp: new Date('2025-10-20'),
      isRead: false,
      link: '/area-assinante/pedidos/1234'
    },
    {
      id: '2',
      type: 'payment',
      title: 'Pagamento confirmado',
      message: 'Pagamento de R$ 89,90 processado com sucesso',
      timestamp: new Date('2025-10-19'),
      isRead: true
    }
  ]

  const handleMarkAsRead = (id: string) => {
    fetch(`/api/v1/subscriber/notifications/${id}/mark-read`, {
      method: 'POST'
    })
  }

  const handleMarkAllAsRead = () => {
    fetch('/api/v1/subscriber/notifications/mark-all-read', {
      method: 'POST'
    })
  }

  return (
    <header className="flex items-center justify-between p-4">
      <h1>Dashboard</h1>
      <NotificationCenter
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
      />
    </header>
  )
}
```

### Com Real-time Updates (Polling)

```typescript
export function DashboardHeader() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch inicial
  useEffect(() => {
    fetchNotifications()
  }, [])

  // Polling a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/v1/subscriber/notifications?limit=5')
      const data = await res.json()
      setNotifications(data.notifications)
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    await fetch(`/api/v1/subscriber/notifications/${id}/mark-read`, {
      method: 'POST'
    })
    fetchNotifications() // Refresh
  }

  return (
    <NotificationCenter
      notifications={notifications}
      onMarkAsRead={handleMarkAsRead}
      isLoading={isLoading}
    />
  )
}
```

---

## 3. DeliveryTimeline

### Uso Básico

```typescript
export default function DashboardPage() {
  const deliveries: DeliveryData[] = [
    {
      id: '1',
      orderNumber: '1234',
      status: 'delivered',
      scheduledDate: '2025-09-15',
      deliveredDate: '2025-09-14',
      items: [{ name: 'Lentes Diárias Acuvue', quantity: 30 }]
    },
    {
      id: '2',
      orderNumber: '1235',
      status: 'delivered',
      scheduledDate: '2025-10-15',
      deliveredDate: '2025-10-15',
      items: [{ name: 'Lentes Diárias Acuvue', quantity: 30 }]
    },
    {
      id: '3',
      orderNumber: '1236',
      status: 'in_transit',
      scheduledDate: '2025-11-15',
      trackingCode: 'BR123456789',
      trackingUrl: 'https://rastreamento.correios.com.br/app/index.php?objetos=BR123456789',
      items: [{ name: 'Lentes Diárias Acuvue', quantity: 30 }]
    }
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        {/* Outros componentes */}
      </div>
      <div>
        <DeliveryTimeline deliveries={deliveries} />
      </div>
    </div>
  )
}
```

### Com Dados da API

```typescript
export default function DashboardPage() {
  const [deliveries, setDeliveries] = useState<DeliveryData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/v1/subscriber/deliveries?limit=4')
      .then(res => {
        if (!res.ok) throw new Error('Falha ao carregar entregas')
        return res.json()
      })
      .then(data => {
        setDeliveries(data.deliveries)
        setIsLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setIsLoading(false)
      })
  }, [])

  return (
    <DeliveryTimeline
      deliveries={deliveries}
      isLoading={isLoading}
      error={error}
    />
  )
}
```

---

## 4. SavingsWidget

### Uso Básico

```typescript
export default function DashboardPage() {
  const savingsData = {
    totalSavings: 285.50,
    monthlySavings: 47.58,
    monthlyChange: 15,
    retailCost: 950.00,
    subscriptionCost: 664.50,
    monthsSubscribed: 6
  }

  return (
    <SavingsWidget
      savings={savingsData}
      showSparkline={true}
    />
  )
}
```

### Com Hook Customizado

```typescript
// hooks/useSubscriberSavings.ts
export function useSubscriberSavings() {
  const [data, setData] = useState<SavingsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/v1/subscriber/savings')
      .then(res => {
        if (!res.ok) throw new Error('Falha ao carregar economias')
        return res.json()
      })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [])

  return { data, isLoading, error }
}

// Uso na página
export default function DashboardPage() {
  const { data, isLoading, error } = useSubscriberSavings()

  return (
    <SavingsWidget
      savings={data}
      isLoading={isLoading}
      error={error}
      showSparkline={true}
    />
  )
}
```

---

## Layout Completo do Dashboard

```typescript
// src/app/area-assinante/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { DashboardMetricsCards } from '@/components/assinante/DashboardMetricsCards'
import { NotificationCenter } from '@/components/assinante/NotificationCenter'
import { DeliveryTimeline } from '@/components/assinante/DeliveryTimeline'
import { SavingsWidget } from '@/components/assinante/SavingsWidget'

export default function DashboardPage() {
  // Hooks customizados
  const { data: metrics, isLoading: metricsLoading } = useSubscriberMetrics()
  const { data: savings, isLoading: savingsLoading } = useSubscriberSavings()
  const { data: deliveries, isLoading: deliveriesLoading } = useDeliveries()

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header com Notificações */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Acompanhe sua assinatura e economias
          </p>
        </div>
        <NotificationCenter />
      </header>

      {/* Cards de Métricas */}
      <DashboardMetricsCards
        totalSavings={metrics?.totalSavings}
        lensesReceived={metrics?.lensesReceived}
        nextDeliveryDate={metrics?.nextDeliveryDate}
        punctualityRate={metrics?.punctualityRate}
        isLoading={metricsLoading}
      />

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Widget de Economias */}
          <SavingsWidget
            savings={savings}
            isLoading={savingsLoading}
            showSparkline={true}
          />

          {/* Outros componentes podem vir aqui */}
        </div>

        {/* Coluna Direita (1/3) */}
        <div className="space-y-6">
          {/* Timeline de Entregas */}
          <DeliveryTimeline
            deliveries={deliveries}
            isLoading={deliveriesLoading}
          />
        </div>
      </div>
    </div>
  )
}
```

---

## Estrutura de Resposta da API (Exemplo)

### GET /api/v1/subscriber/metrics

```json
{
  "success": true,
  "data": {
    "totalSavings": 285.50,
    "lensesReceived": 6,
    "nextDeliveryDate": "2025-11-15T00:00:00.000Z",
    "punctualityRate": 95
  }
}
```

### GET /api/v1/subscriber/notifications

```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_123",
        "type": "delivery",
        "title": "Pedido enviado",
        "message": "Seu pedido #1234 foi enviado",
        "timestamp": "2025-10-20T10:30:00.000Z",
        "isRead": false,
        "link": "/area-assinante/pedidos/1234"
      }
    ],
    "unreadCount": 3
  }
}
```

### GET /api/v1/subscriber/deliveries

```json
{
  "success": true,
  "data": {
    "deliveries": [
      {
        "id": "order_123",
        "orderNumber": "1234",
        "status": "delivered",
        "scheduledDate": "2025-09-15T00:00:00.000Z",
        "deliveredDate": "2025-09-14T14:20:00.000Z",
        "items": [
          {
            "name": "Lentes Diárias Acuvue",
            "quantity": 30
          }
        ]
      }
    ]
  }
}
```

### GET /api/v1/subscriber/savings

```json
{
  "success": true,
  "data": {
    "totalSavings": 285.50,
    "monthlySavings": 47.58,
    "monthlyChange": 15,
    "retailCost": 950.00,
    "subscriptionCost": 664.50,
    "monthsSubscribed": 6
  }
}
```

---

## Customização de Cores

```typescript
// tailwind.config.js - cores já configuradas no projeto
module.exports = {
  theme: {
    extend: {
      colors: {
        cyan: {
          50: '#ecfeff',
          600: '#06b6d4',  // Cor primária
        },
        silver: {
          600: '#64748b',  // Cor secundária
        }
      }
    }
  }
}
```

---

## Acessibilidade

Todos os componentes seguem práticas de acessibilidade:

```typescript
// Exemplo: NotificationCenter com ARIA
<Button
  variant="ghost"
  size="icon"
  aria-label={`Notificações ${unreadCount > 0 ? `(${unreadCount} não lidas)` : ''}`}
>
  <Bell className="h-5 w-5" />
</Button>

// Tooltip com informações adicionais
<Tooltip>
  <TooltipTrigger>
    <Info className="h-4 w-4" />
  </TooltipTrigger>
  <TooltipContent>
    <p>Valores baseados na comparação...</p>
  </TooltipContent>
</Tooltip>
```

---

## Performance

### Lazy Loading

```typescript
import dynamic from 'next/dynamic'

const DeliveryTimeline = dynamic(
  () => import('@/components/assinante/DeliveryTimeline').then(mod => mod.DeliveryTimeline),
  { loading: () => <DeliveryTimelineSkeleton /> }
)
```

### Memoização

```typescript
import { memo } from 'react'

export const DashboardMetricsCards = memo(function DashboardMetricsCards({ ... }) {
  // ...
})
```

---

**Autor**: Dr. Philipe Saraiva Cruz
**Documentação**: Claude Code - Frontend Architect
