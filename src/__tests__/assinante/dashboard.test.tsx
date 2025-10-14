import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import DashboardPage from '@/app/area-assinante/dashboard/page'
import SubscriptionStatusCard from '@/components/assinante/SubscriptionStatus'
import BenefitsDisplay from '@/components/assinante/BenefitsDisplay'
import ShippingAddressCard from '@/components/assinante/ShippingAddress'
import EmergencyContactCard from '@/components/assinante/EmergencyContact'
import { useSubscriptionData } from '@/hooks/useSubscriptionData'
import { SubscriptionBenefit } from '@/types/assinante'

// Mock NextAuth
vi.mock('next-auth/react')

// Mock the custom hook
vi.mock('@/hooks/useSubscriptionData')

// Mock Next.js router
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: () => ({
    push: vi.fn()
  })
}))

// Mock fetch for API calls
global.fetch = vi.fn()

const mockSession = {
  user: {
    name: 'John Doe',
    email: 'john@example.com',
    image: 'https://example.com/avatar.jpg'
  },
  expires: '2025-01-01'
}

const mockSubscriptionData = {
  subscription: {
    id: 'sub_123',
    status: 'active' as const,
    plan: {
      name: 'Lentes Diárias Mensal',
      price: 149.90,
      billingCycle: 'monthly' as const
    },
    currentPeriodStart: new Date('2025-10-14'),
    currentPeriodEnd: new Date('2025-11-14'),
    nextBillingDate: '2025-11-14',
    benefits: [
      {
        id: '1',
        name: 'Lentes de contato diárias',
        description: 'Lentes descartáveis de uso diário',
        category: 'product' as const,
        included: true
      }
    ],
    shippingAddress: {
      street: 'Rua Principal',
      number: '123',
      neighborhood: 'Centro',
      city: 'Caratinga',
      state: 'MG',
      zipCode: '35300-000',
      complement: 'Apto 101'
    },
    createdAt: new Date('2025-10-14'),
    updatedAt: new Date('2025-10-14')
  },
  user: {
    id: 'user_123',
    name: 'John Doe',
    email: 'john@example.com',
    avatarUrl: 'https://example.com/avatar.jpg'
  }
}

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
})

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={mockSession}>
        {component}
      </SessionProvider>
    </QueryClientProvider>
  )
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useSubscriptionData).mockReturnValue({
      subscription: mockSubscriptionData.subscription,
      user: mockSubscriptionData.user,
      loading: false,
      error: null,
      refreshData: vi.fn(),
      updateShippingAddress: vi.fn()
    })
  })

  it('should render dashboard with subscription data', () => {
    renderWithProviders(<DashboardPage />)

    expect(screen.getByText('Minha Assinatura')).toBeInTheDocument()
    expect(screen.getByText(/Bem-vindo\(a\), John Doe!/)).toBeInTheDocument()
    expect(screen.getByText('Status da Assinatura')).toBeInTheDocument()
    expect(screen.getByText('Lentes Diárias Mensal')).toBeInTheDocument()
    expect(screen.getByText('R$ 149,90')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    vi.mocked(useSubscriptionData).mockReturnValue({
      subscription: null,
      user: { id: '', name: '', email: '' },
      loading: true,
      error: null,
      refreshData: vi.fn(),
      updateShippingAddress: vi.fn()
    })

    renderWithProviders(<DashboardPage />)

    expect(screen.getByText('Carregando dashboard...')).toBeInTheDocument()
  })

  it('should show error state', () => {
    vi.mocked(useSubscriptionData).mockReturnValue({
      subscription: null,
      user: { id: '', name: '', email: '' },
      loading: false,
      error: 'API Error',
      refreshData: vi.fn(),
      updateShippingAddress: vi.fn()
    })

    renderWithProviders(<DashboardPage />)

    expect(screen.getByText('Erro ao carregar dados')).toBeInTheDocument()
    expect(screen.getByText('API Error')).toBeInTheDocument()
    expect(screen.getByText('Tentar Novamente')).toBeInTheDocument()
  })

  it('should show no subscription state', () => {
    vi.mocked(useSubscriptionData).mockReturnValue({
      subscription: null,
      user: mockSubscriptionData.user,
      loading: false,
      error: null,
      refreshData: vi.fn(),
      updateShippingAddress: vi.fn()
    })

    renderWithProviders(<DashboardPage />)

    expect(screen.getByText('Nenhuma assinatura encontrada')).toBeInTheDocument()
    expect(screen.getByText('Assinar Agora')).toBeInTheDocument()
  })
})

describe('SubscriptionStatusCard', () => {
  it('should render active subscription status', () => {
    renderWithProviders(
      <SubscriptionStatusCard
        status="active"
        planName="Lentes Diárias Mensal"
        price={149.90}
        billingCycle="monthly"
        nextBillingDate="2025-11-14"
      />
    )

    expect(screen.getByText('Ativa')).toBeInTheDocument()
    expect(screen.getByText('Lentes Diárias Mensal')).toBeInTheDocument()
    expect(screen.getByText('R$ 149,90')).toBeInTheDocument()
    expect(screen.getByText('Próxima cobrança: 14 de novembro de 2025')).toBeInTheDocument()
  })

  it('should render pending subscription status', () => {
    renderWithProviders(
      <SubscriptionStatusCard
        status="pending"
        planName="Lentes Diárias Mensal"
        price={149.90}
        billingCycle="monthly"
        nextBillingDate="2025-11-14"
      />
    )

    expect(screen.getByText('Pendente')).toBeInTheDocument()
    expect(screen.getByText('Seu pagamento está sendo processado')).toBeInTheDocument()
  })

  it('should render cancelled subscription status', () => {
    renderWithProviders(
      <SubscriptionStatusCard
        status="cancelled"
        planName="Lentes Diárias Mensal"
        price={149.90}
        billingCycle="monthly"
        nextBillingDate="2025-11-14"
      />
    )

    expect(screen.getByText('Cancelada')).toBeInTheDocument()
    expect(screen.getByText('Reativar Assinatura')).toBeInTheDocument()
  })
})

describe('BenefitsDisplay', () => {
  const mockBenefits: SubscriptionBenefit[] = [
    {
      id: '1',
      name: 'Lentes de contato diárias',
      description: 'Lentes descartáveis de uso diário',
      category: 'product',
      included: true
    },
    {
      id: '2',
      name: 'Entrega mensal programada',
      description: 'Receba suas lentes todo mês',
      category: 'service',
      included: true
    },
    {
      id: '3',
      name: 'Benefício Premium',
      description: 'Benefício não disponível',
      category: 'support',
      included: false
    }
  ]

  it('should render included and excluded benefits', () => {
    renderWithProviders(<BenefitsDisplay benefits={mockBenefits} />)

    expect(screen.getByText('Benefícios da Assinatura')).toBeInTheDocument()
    expect(screen.getByText('Lentes de contato diárias')).toBeInTheDocument()
    expect(screen.getByText('Entrega mensal programada')).toBeInTheDocument()
    expect(screen.getByText('Benefício Premium')).toBeInTheDocument()
    expect(screen.getByText('Incluído')).toBeInTheDocument()
    expect(screen.getByText('Não disponível')).toBeInTheDocument()
  })

  it('should show empty state when no benefits', () => {
    renderWithProviders(<BenefitsDisplay benefits={[]} />)

    expect(screen.getByText('Nenhum benefício encontrado')).toBeInTheDocument()
  })

  it('should show benefits summary', () => {
    renderWithProviders(<BenefitsDisplay benefits={mockBenefits} />)

    expect(screen.getByText('Sua assinatura inclui 2 de 3 benefícios disponíveis')).toBeInTheDocument()
    expect(screen.getByText('Faça upgrade para desbloquear todos os benefícios')).toBeInTheDocument()
  })
})

describe('ShippingAddressCard', () => {
  const mockAddress = {
    street: 'Rua Principal',
    number: '123',
    neighborhood: 'Centro',
    city: 'Caratinga',
    state: 'MG',
    zipCode: '35300-000',
    complement: 'Apto 101'
  }

  it('should render shipping address', () => {
    renderWithProviders(
      <ShippingAddressCard
        address={mockAddress}
        loading={false}
      />
    )

    expect(screen.getByText('Endereço de Entrega')).toBeInTheDocument()
    expect(screen.getByText('Rua Principal, 123, Apto 101')).toBeInTheDocument()
    expect(screen.getByText('Caratinga - MG')).toBeInTheDocument()
    expect(screen.getByText('CEP: 35300-000')).toBeInTheDocument()
    expect(screen.getByText('Editar')).toBeInTheDocument()
  })

  it('should show empty state when no address', () => {
    renderWithProviders(
      <ShippingAddressCard
        address={null}
        loading={false}
      />
    )

    expect(screen.getByText('Nenhum endereço de entrega cadastrado')).toBeInTheDocument()
    expect(screen.getByText('Cadastrar Endereço')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    renderWithProviders(
      <ShippingAddressCard
        address={mockAddress}
        loading={true}
      />
    )

    // Check for skeleton loading elements
    const skeletonElements = document.querySelectorAll('.animate-pulse')
    expect(skeletonElements.length).toBeGreaterThan(0)
  })

  it('should enter edit mode when clicking edit button', () => {
    renderWithProviders(
      <ShippingAddressCard
        address={mockAddress}
        loading={false}
      />
    )

    fireEvent.click(screen.getByText('Editar'))
    expect(screen.getByText('Editar Endereço de Entrega')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Rua Principal')).toBeInTheDocument()
    expect(screen.getByDisplayValue('123')).toBeInTheDocument()
  })
})

describe('EmergencyContactCard', () => {
  const mockContact = {
    phone: '+55 33 99898-026',
    email: 'saraivavision@gmail.com',
    doctor: {
      name: 'Dr. Philipe Saraiva Cruz',
      crm: 'CRM-MG 69.870'
    }
  }

  it('should render emergency contact information', () => {
    renderWithProviders(<EmergencyContactCard contact={mockContact} />)

    expect(screen.getByText('Contato de Emergência')).toBeInTheDocument()
    expect(screen.getByText('Dr. Philipe Saraiva Cruz')).toBeInTheDocument()
    expect(screen.getByText('CRM-MG 69.870')).toBeInTheDocument()
    expect(screen.getByText('(33) 99898-026')).toBeInTheDocument()
    expect(screen.getByText('saraivavision@gmail.com')).toBeInTheDocument()
  })

  it('should show WhatsApp button', () => {
    renderWithProviders(<EmergencyContactCard contact={mockContact} />)

    expect(screen.getByText('WhatsApp')).toBeInTheDocument()
    expect(screen.getByText('Resposta rápida')).toBeInTheDocument()
  })

  it('should show emergency guidelines', () => {
    renderWithProviders(<EmergencyContactCard contact={mockContact} />)

    expect(screen.getByText('Quando procurar ajuda urgente:')).toBeInTheDocument()
    expect(screen.getByText('Irritação intensa, vermelhidão ou dor nos olhos')).toBeInTheDocument()
    expect(screen.getByText('Visão embaçada persistente ou perda súbita de visão')).toBeInTheDocument()
  })
})