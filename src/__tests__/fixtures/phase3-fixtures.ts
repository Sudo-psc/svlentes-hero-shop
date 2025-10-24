/**
 * Test Fixtures for Subscriber Dashboard - Phase 3
 * Shared test data for prescription management, payment history, and delivery preferences
 */

export const mockPrescription = {
  valid: {
    id: 'presc_123',
    userId: 'user_123',
    status: 'VALID' as const,
    uploadedAt: new Date('2025-09-15'),
    expiryDate: new Date('2026-09-15'),
    daysUntilExpiry: 326,
    fileUrl: 'https://storage.svlentes.shop/prescriptions/presc_123.pdf',
    fileName: 'prescricao_2025.pdf',
    fileSize: 2048576, // 2MB
    fileMimeType: 'application/pdf',
    prescriptionData: {
      rightEye: {
        spherical: -2.50,
        cylindrical: -0.75,
        axis: 180,
        addition: null
      },
      leftEye: {
        spherical: -2.25,
        cylindrical: -0.50,
        axis: 175,
        addition: null
      },
      pupillaryDistance: 63
    },
    doctorInfo: {
      name: 'Dr. Philipe Saraiva Cruz',
      crm: 'CRM-MG 69.870',
      issueDate: new Date('2025-09-15')
    },
    createdAt: new Date('2025-09-15'),
    updatedAt: new Date('2025-09-15')
  },
  expiringSoon: {
    id: 'presc_456',
    userId: 'user_123',
    status: 'EXPIRING_SOON' as const,
    uploadedAt: new Date('2024-11-05'),
    expiryDate: new Date('2025-11-09'), // 5 days from mock "today" 2025-11-04
    daysUntilExpiry: 5,
    fileUrl: 'https://storage.svlentes.shop/prescriptions/presc_456.pdf',
    fileName: 'prescricao_antiga.pdf',
    fileSize: 1548576,
    fileMimeType: 'application/pdf',
    prescriptionData: {
      rightEye: {
        spherical: -2.00,
        cylindrical: -0.50,
        axis: 180,
        addition: null
      },
      leftEye: {
        spherical: -2.00,
        cylindrical: -0.50,
        axis: 180,
        addition: null
      },
      pupillaryDistance: 63
    },
    doctorInfo: {
      name: 'Dr. Philipe Saraiva Cruz',
      crm: 'CRM-MG 69.870',
      issueDate: new Date('2024-11-05')
    },
    createdAt: new Date('2024-11-05'),
    updatedAt: new Date('2024-11-05')
  },
  expired: {
    id: 'presc_789',
    userId: 'user_123',
    status: 'EXPIRED' as const,
    uploadedAt: new Date('2024-10-15'),
    expiryDate: new Date('2025-10-15'),
    daysUntilExpiry: -20,
    fileUrl: 'https://storage.svlentes.shop/prescriptions/presc_789.pdf',
    fileName: 'prescricao_expirada.pdf',
    fileSize: 1848576,
    fileMimeType: 'application/pdf',
    prescriptionData: {
      rightEye: {
        spherical: -1.75,
        cylindrical: -0.25,
        axis: 180,
        addition: null
      },
      leftEye: {
        spherical: -1.75,
        cylindrical: -0.25,
        axis: 180,
        addition: null
      },
      pupillaryDistance: 63
    },
    doctorInfo: {
      name: 'Dr. Philipe Saraiva Cruz',
      crm: 'CRM-MG 69.870',
      issueDate: new Date('2024-10-15')
    },
    createdAt: new Date('2024-10-15'),
    updatedAt: new Date('2024-10-15')
  }
}

export const mockPrescriptionHistory = [
  mockPrescription.valid,
  mockPrescription.expiringSoon,
  mockPrescription.expired
]

export const mockPaymentHistory = {
  summary: {
    totalPaid: 1199.20,
    totalPending: 149.90,
    totalOverdue: 0,
    paymentCount: 9,
    onTimePaymentRate: 88.89,
    averagePaymentTime: 2.5
  },
  payments: [
    {
      id: 'pay_001',
      subscriptionId: 'sub_123',
      amount: 149.90,
      status: 'PAID' as const,
      paymentMethod: 'PIX' as const,
      dueDate: new Date('2025-10-14'),
      paidAt: new Date('2025-10-14T10:30:00Z'),
      invoiceUrl: 'https://asaas.com/invoices/inv_001.pdf',
      receiptUrl: 'https://asaas.com/receipts/rec_001.pdf',
      createdAt: new Date('2025-10-14'),
      description: 'Assinatura Lentes Diárias - Outubro 2025'
    },
    {
      id: 'pay_002',
      subscriptionId: 'sub_123',
      amount: 149.90,
      status: 'PAID' as const,
      paymentMethod: 'CREDIT_CARD' as const,
      dueDate: new Date('2025-09-14'),
      paidAt: new Date('2025-09-14T14:22:00Z'),
      invoiceUrl: 'https://asaas.com/invoices/inv_002.pdf',
      receiptUrl: 'https://asaas.com/receipts/rec_002.pdf',
      createdAt: new Date('2025-09-14'),
      description: 'Assinatura Lentes Diárias - Setembro 2025'
    },
    {
      id: 'pay_003',
      subscriptionId: 'sub_123',
      amount: 149.90,
      status: 'PAID' as const,
      paymentMethod: 'BOLETO' as const,
      dueDate: new Date('2025-08-14'),
      paidAt: new Date('2025-08-16T09:15:00Z'),
      invoiceUrl: 'https://asaas.com/invoices/inv_003.pdf',
      receiptUrl: 'https://asaas.com/receipts/rec_003.pdf',
      createdAt: new Date('2025-08-14'),
      description: 'Assinatura Lentes Diárias - Agosto 2025'
    },
    {
      id: 'pay_004',
      subscriptionId: 'sub_123',
      amount: 149.90,
      status: 'PENDING' as const,
      paymentMethod: 'PIX' as const,
      dueDate: new Date('2025-11-14'),
      paidAt: null,
      invoiceUrl: 'https://asaas.com/invoices/inv_004.pdf',
      receiptUrl: null,
      createdAt: new Date('2025-11-04'),
      description: 'Assinatura Lentes Diárias - Novembro 2025'
    },
    {
      id: 'pay_005',
      subscriptionId: 'sub_123',
      amount: 149.90,
      status: 'PAID' as const,
      paymentMethod: 'PIX' as const,
      dueDate: new Date('2025-07-14'),
      paidAt: new Date('2025-07-14T11:00:00Z'),
      invoiceUrl: 'https://asaas.com/invoices/inv_005.pdf',
      receiptUrl: 'https://asaas.com/receipts/rec_005.pdf',
      createdAt: new Date('2025-07-14'),
      description: 'Assinatura Lentes Diárias - Julho 2025'
    },
    {
      id: 'pay_006',
      subscriptionId: 'sub_123',
      amount: 149.90,
      status: 'PAID' as const,
      paymentMethod: 'CREDIT_CARD' as const,
      dueDate: new Date('2025-06-14'),
      paidAt: new Date('2025-06-15T16:45:00Z'),
      invoiceUrl: 'https://asaas.com/invoices/inv_006.pdf',
      receiptUrl: 'https://asaas.com/receipts/rec_006.pdf',
      createdAt: new Date('2025-06-14'),
      description: 'Assinatura Lentes Diárias - Junho 2025'
    },
    {
      id: 'pay_007',
      subscriptionId: 'sub_123',
      amount: 149.90,
      status: 'PAID' as const,
      paymentMethod: 'PIX' as const,
      dueDate: new Date('2025-05-14'),
      paidAt: new Date('2025-05-14T08:30:00Z'),
      invoiceUrl: 'https://asaas.com/invoices/inv_007.pdf',
      receiptUrl: 'https://asaas.com/receipts/rec_007.pdf',
      createdAt: new Date('2025-05-14'),
      description: 'Assinatura Lentes Diárias - Maio 2025'
    },
    {
      id: 'pay_008',
      subscriptionId: 'sub_123',
      amount: 149.90,
      status: 'PAID' as const,
      paymentMethod: 'BOLETO' as const,
      dueDate: new Date('2025-04-14'),
      paidAt: new Date('2025-04-20T10:00:00Z'),
      invoiceUrl: 'https://asaas.com/invoices/inv_008.pdf',
      receiptUrl: 'https://asaas.com/receipts/rec_008.pdf',
      createdAt: new Date('2025-04-14'),
      description: 'Assinatura Lentes Diárias - Abril 2025'
    },
    {
      id: 'pay_009',
      subscriptionId: 'sub_123',
      amount: 149.90,
      status: 'PAID' as const,
      paymentMethod: 'PIX' as const,
      dueDate: new Date('2025-03-14'),
      paidAt: new Date('2025-03-14T12:15:00Z'),
      invoiceUrl: 'https://asaas.com/invoices/inv_009.pdf',
      receiptUrl: 'https://asaas.com/receipts/rec_009.pdf',
      createdAt: new Date('2025-03-14'),
      description: 'Assinatura Lentes Diárias - Março 2025'
    }
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 9,
    totalPages: 1
  }
}

export const mockDeliveryPreferences = {
  current: {
    id: 'pref_123',
    userId: 'user_123',
    address: {
      street: 'Rua Principal',
      number: '123',
      complement: 'Apto 201',
      neighborhood: 'Centro',
      city: 'Caratinga',
      state: 'MG',
      zipCode: '35300-000'
    },
    contact: {
      phone: '5533999898026',
      email: 'john@example.com',
      preferredMethod: 'whatsapp' as const
    },
    deliveryWindow: {
      preferredPeriod: 'morning' as const, // morning, afternoon, evening
      instructions: 'Deixar com portaria se ausente'
    },
    notifications: {
      sms: true,
      email: true,
      whatsapp: true,
      pushNotification: false
    },
    upcomingDelivery: {
      estimatedDate: new Date('2025-12-05'),
      daysUntilNext: 31,
      status: 'scheduled' as const
    },
    lastUpdated: new Date('2025-09-15'),
    createdAt: new Date('2025-03-14'),
    updatedAt: new Date('2025-09-15')
  },
  alternate: {
    id: 'pref_456',
    userId: 'user_456',
    address: {
      street: 'Avenida Brasil',
      number: '456',
      complement: null,
      neighborhood: 'São Cristóvão',
      city: 'Belo Horizonte',
      state: 'MG',
      zipCode: '30110-000'
    },
    contact: {
      phone: '5531987654321',
      email: 'jane@example.com',
      preferredMethod: 'email' as const
    },
    deliveryWindow: {
      preferredPeriod: 'afternoon' as const,
      instructions: null
    },
    notifications: {
      sms: false,
      email: true,
      whatsapp: false,
      pushNotification: true
    },
    upcomingDelivery: {
      estimatedDate: new Date('2025-11-20'),
      daysUntilNext: 16,
      status: 'scheduled' as const
    },
    lastUpdated: new Date('2025-10-15'),
    createdAt: new Date('2025-02-10'),
    updatedAt: new Date('2025-10-15')
  }
}

export const mockCepResponse = {
  valid: {
    cep: '35300-000',
    logradouro: 'Rua Principal',
    complemento: '',
    bairro: 'Centro',
    localidade: 'Caratinga',
    uf: 'MG',
    ibge: '3115300',
    gia: '',
    ddd: '33',
    siafi: '4257'
  },
  invalid: {
    erro: true
  }
}

// Helper functions for tests
export const createMockPrescriptionResponse = (status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED') => {
  const prescriptionMap = {
    VALID: mockPrescription.valid,
    EXPIRING_SOON: mockPrescription.expiringSoon,
    EXPIRED: mockPrescription.expired
  }

  return {
    currentPrescription: prescriptionMap[status],
    history: mockPrescriptionHistory,
    alerts: status === 'EXPIRING_SOON' ? [
      {
        type: 'warning',
        message: 'Sua prescrição vence em 5 dias. Agende uma consulta.'
      }
    ] : status === 'EXPIRED' ? [
      {
        type: 'error',
        message: 'Sua prescrição está expirada. Atualize urgentemente.'
      }
    ] : []
  }
}

export const createMockPaymentHistoryResponse = (filters?: {
  status?: 'PAID' | 'PENDING' | 'OVERDUE'
  method?: 'PIX' | 'BOLETO' | 'CREDIT_CARD'
  startDate?: string
  endDate?: string
}) => {
  let filteredPayments = [...mockPaymentHistory.payments]

  if (filters?.status) {
    filteredPayments = filteredPayments.filter(p => p.status === filters.status)
  }

  if (filters?.method) {
    filteredPayments = filteredPayments.filter(p => p.paymentMethod === filters.method)
  }

  if (filters?.startDate || filters?.endDate) {
    filteredPayments = filteredPayments.filter(p => {
      const paymentDate = p.dueDate
      if (filters.startDate && paymentDate < new Date(filters.startDate)) return false
      if (filters.endDate && paymentDate > new Date(filters.endDate)) return false
      return true
    })
  }

  return {
    summary: mockPaymentHistory.summary,
    payments: filteredPayments,
    pagination: {
      ...mockPaymentHistory.pagination,
      total: filteredPayments.length,
      totalPages: Math.ceil(filteredPayments.length / 20)
    }
  }
}

export const createMockDeliveryPreferencesResponse = () => {
  return {
    preferences: mockDeliveryPreferences.current,
    upcomingDelivery: mockDeliveryPreferences.current.upcomingDelivery,
    metadata: {
      lastUpdated: mockDeliveryPreferences.current.lastUpdated,
      canUpdate: true
    }
  }
}

export const createMockFile = (
  name: string,
  size: number,
  type: string
): File => {
  const content = new Array(size).fill('a').join('')
  return new File([content], name, { type })
}

export const validPrescriptionFile = createMockFile(
  'prescription.pdf',
  2048576, // 2MB
  'application/pdf'
)

export const validJpgFile = createMockFile(
  'prescription.jpg',
  1548576, // 1.5MB
  'image/jpeg'
)

export const validPngFile = createMockFile(
  'prescription.png',
  1848576, // 1.8MB
  'image/png'
)

export const oversizedFile = createMockFile(
  'prescription_large.pdf',
  6291456, // 6MB (exceeds 5MB limit)
  'application/pdf'
)

export const invalidFormatFile = createMockFile(
  'prescription.doc',
  1048576, // 1MB
  'application/msword'
)
