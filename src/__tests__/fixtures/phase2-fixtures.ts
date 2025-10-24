/**
 * Test Fixtures for Subscriber Dashboard - Phase 2
 * Shared test data for delivery status, contextual actions, and WhatsApp integration
 */

export const mockDeliveryStatus = {
  current: {
    orderId: 'order_123',
    status: 'in_transit' as const,
    trackingCode: 'BR123456789BR',
    estimatedDelivery: '2025-11-05',
    progress: 60,
    daysRemaining: 3,
    timeline: [
      {
        id: 'event_1',
        status: 'order_placed',
        timestamp: '2025-10-28T10:00:00Z',
        description: 'Pedido realizado',
        location: 'Sistema'
      },
      {
        id: 'event_2',
        status: 'payment_confirmed',
        timestamp: '2025-10-28T14:30:00Z',
        description: 'Pagamento confirmado',
        location: 'Asaas Gateway'
      },
      {
        id: 'event_3',
        status: 'shipped',
        timestamp: '2025-10-30T08:00:00Z',
        description: 'Pedido enviado',
        location: 'Caratinga - MG'
      },
      {
        id: 'event_4',
        status: 'in_transit',
        timestamp: '2025-11-01T12:00:00Z',
        description: 'Em trânsito',
        location: 'Belo Horizonte - MG'
      }
    ]
  },
  pending: {
    orderId: 'order_456',
    status: 'pending_payment' as const,
    trackingCode: null,
    estimatedDelivery: '2025-11-10',
    progress: 10,
    daysRemaining: null,
    timeline: [
      {
        id: 'event_1',
        status: 'order_placed',
        timestamp: '2025-10-28T10:00:00Z',
        description: 'Pedido realizado',
        location: 'Sistema'
      }
    ]
  },
  delivered: {
    orderId: 'order_789',
    status: 'delivered' as const,
    trackingCode: 'BR987654321BR',
    estimatedDelivery: '2025-10-20',
    progress: 100,
    daysRemaining: 0,
    timeline: [
      {
        id: 'event_1',
        status: 'order_placed',
        timestamp: '2025-10-14T10:00:00Z',
        description: 'Pedido realizado',
        location: 'Sistema'
      },
      {
        id: 'event_2',
        status: 'delivered',
        timestamp: '2025-10-20T16:30:00Z',
        description: 'Entregue',
        location: 'Caratinga - MG'
      }
    ]
  }
}

export const mockContextualActions = {
  renewal: {
    id: 'action_renewal',
    type: 'renewal' as const,
    title: 'Renovar Prescrição',
    description: 'Sua prescrição vence em 5 dias',
    icon: 'calendar',
    priority: 'high' as const,
    variant: 'destructive' as const,
    action: () => console.log('Navigate to renewal'),
    daysUntilExpiry: 5
  },
  evaluation: {
    id: 'action_evaluation',
    type: 'evaluation' as const,
    title: 'Agendar Reavaliação',
    description: 'Sua última consulta foi há 6 meses',
    icon: 'stethoscope',
    priority: 'medium' as const,
    variant: 'warning' as const,
    action: () => console.log('Navigate to booking'),
    monthsSinceLastVisit: 6
  },
  payment: {
    id: 'action_payment',
    type: 'payment' as const,
    title: 'Pagamento Pendente',
    description: 'Fatura vence em 2 dias',
    icon: 'credit-card',
    priority: 'high' as const,
    variant: 'destructive' as const,
    action: () => console.log('Navigate to payment'),
    daysUntilDue: 2
  },
  reactivate: {
    id: 'action_reactivate',
    type: 'reactivate' as const,
    title: 'Reativar Assinatura',
    description: 'Sua assinatura está pausada',
    icon: 'play',
    priority: 'medium' as const,
    variant: 'default' as const,
    action: () => console.log('Reactivate subscription'),
    pausedSince: '2025-10-01'
  },
  whatsapp: {
    id: 'action_whatsapp',
    type: 'whatsapp' as const,
    title: 'Falar no WhatsApp',
    description: 'Atendimento rápido e personalizado',
    icon: 'message-circle',
    priority: 'low' as const,
    variant: 'success' as const,
    action: () => console.log('Open WhatsApp'),
    available: true
  }
}

export const mockWhatsAppContext = {
  subscription: {
    userId: 'user_123',
    subscriptionId: 'sub_123',
    status: 'active',
    planName: 'Lentes Diárias Mensal',
    nextBillingDate: '2025-11-14',
    message: 'Olá! Tenho dúvidas sobre minha assinatura Lentes Diárias Mensal.'
  },
  delivery: {
    userId: 'user_123',
    orderId: 'order_123',
    trackingCode: 'BR123456789BR',
    status: 'in_transit',
    estimatedDelivery: '2025-11-05',
    message: 'Olá! Gostaria de saber sobre o status da minha entrega BR123456789BR.'
  },
  payment: {
    userId: 'user_123',
    paymentId: 'pay_123',
    amount: 149.90,
    dueDate: '2025-11-03',
    status: 'pending',
    message: 'Olá! Tenho dúvidas sobre meu pagamento de R$ 149,90.'
  }
}

export const mockUser = {
  id: 'user_123',
  email: 'john@example.com',
  name: 'John Doe',
  avatarUrl: 'https://example.com/avatar.jpg',
  phone: '+5533999898026',
  googleId: 'google_123',
  createdAt: new Date('2025-10-14'),
  lastLoginAt: new Date('2025-10-22')
}

export const mockSubscription = {
  id: 'sub_123',
  userId: 'user_123',
  status: 'active',
  planName: 'Lentes Diárias Mensal',
  price: 149.90,
  billingCycle: 'monthly',
  currentPeriodStart: new Date('2025-10-14'),
  currentPeriodEnd: new Date('2025-11-14'),
  prescriptionExpiryDate: new Date('2025-11-09'), // 5 days from mock "today"
  lastConsultationDate: new Date('2025-04-22'), // 6 months ago
  shippingAddress: {
    street: 'Rua Principal',
    number: '123',
    neighborhood: 'Centro',
    city: 'Caratinga',
    state: 'MG',
    zipCode: '35300-000'
  },
  createdAt: new Date('2025-10-14'),
  updatedAt: new Date('2025-10-22')
}

export const mockOrder = {
  id: 'order_123',
  subscriptionId: 'sub_123',
  status: 'in_transit',
  trackingCode: 'BR123456789BR',
  estimatedDelivery: new Date('2025-11-05'),
  items: [
    {
      productName: 'Lentes Diárias - Caixa 30 unidades',
      quantity: 2,
      price: 74.95
    }
  ],
  totalAmount: 149.90,
  shippingAddress: {
    street: 'Rua Principal',
    number: '123',
    neighborhood: 'Centro',
    city: 'Caratinga',
    state: 'MG',
    zipCode: '35300-000'
  },
  createdAt: new Date('2025-10-28'),
  shippedAt: new Date('2025-10-30')
}

export const mockPayment = {
  id: 'pay_123',
  subscriptionId: 'sub_123',
  amount: 149.90,
  status: 'pending',
  dueDate: new Date('2025-11-03'),
  paymentMethod: 'pix',
  createdAt: new Date('2025-10-28')
}

// Helper functions for tests
export const createMockDeliveryResponse = (status: string) => {
  const statusMap: Record<string, typeof mockDeliveryStatus.current> = {
    in_transit: mockDeliveryStatus.current,
    pending_payment: mockDeliveryStatus.pending,
    delivered: mockDeliveryStatus.delivered
  }

  return {
    delivery: statusMap[status] || mockDeliveryStatus.current,
    nextDelivery: {
      estimatedDate: '2025-12-05',
      daysUntilNext: 30
    }
  }
}

export const createMockActionsResponse = (scenarios: string[]) => {
  const actionMap: Record<string, typeof mockContextualActions.renewal> = {
    renewal: mockContextualActions.renewal,
    evaluation: mockContextualActions.evaluation,
    payment: mockContextualActions.payment,
    reactivate: mockContextualActions.reactivate,
    whatsapp: mockContextualActions.whatsapp
  }

  return {
    actions: scenarios.map(scenario => actionMap[scenario]).filter(Boolean),
    priority: scenarios.includes('renewal') || scenarios.includes('payment') ? 'high' : 'medium'
  }
}

export const createMockWhatsAppMessage = (context: 'subscription' | 'delivery' | 'payment') => {
  const contextMap = {
    subscription: mockWhatsAppContext.subscription,
    delivery: mockWhatsAppContext.delivery,
    payment: mockWhatsAppContext.payment
  }

  return {
    phoneNumber: '+5533999898026',
    message: contextMap[context].message,
    context: contextMap[context]
  }
}
