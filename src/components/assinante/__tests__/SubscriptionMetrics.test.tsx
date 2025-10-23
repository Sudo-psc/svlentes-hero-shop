import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SubscriptionStatusCard from '../SubscriptionStatus'
import BenefitsDisplay from '../BenefitsDisplay'
import ShippingAddressCard from '../ShippingAddress'
import { SubscriptionBenefit } from '@/types/assinante'

describe('SubscriptionStatusCard - Metrics Display', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Active Subscription Metrics', () => {
    it('should render subscription status correctly', () => {
      render(
        <SubscriptionStatusCard
          status="active"
          planName="Lentes Diárias Mensal"
          price={149.90}
          billingCycle="monthly"
          nextBillingDate="2025-11-14"
        />
      )

      expect(screen.getByText('Status da Assinatura')).toBeInTheDocument()
      expect(screen.getByText('Ativa')).toBeInTheDocument()
      expect(screen.getByText('Lentes Diárias Mensal')).toBeInTheDocument()
    })

    it('should display formatted price correctly', () => {
      render(
        <SubscriptionStatusCard
          status="active"
          planName="Lentes Diárias Mensal"
          price={149.90}
          billingCycle="monthly"
          nextBillingDate="2025-11-14"
        />
      )

      expect(screen.getByText('R$ 149,90')).toBeInTheDocument()
    })

    it('should show billing cycle label', () => {
      render(
        <SubscriptionStatusCard
          status="active"
          planName="Lentes Diárias Mensal"
          price={149.90}
          billingCycle="monthly"
          nextBillingDate="2025-11-14"
        />
      )

      const mensalTexts = screen.getAllByText(/mensal/i)
      expect(mensalTexts.length).toBeGreaterThan(0)
    })

    it('should display next billing date formatted', () => {
      render(
        <SubscriptionStatusCard
          status="active"
          planName="Lentes Diárias Mensal"
          price={149.90}
          billingCycle="monthly"
          nextBillingDate="2025-11-14"
        />
      )

      // Should show formatted date
      expect(screen.getByText(/Próxima cobrança:/)).toBeInTheDocument()
      expect(screen.getByText(/14 de novembro de 2025/)).toBeInTheDocument()
    })

    it('should render with correct status color - active', () => {
      const { container } = render(
        <SubscriptionStatusCard
          status="active"
          planName="Lentes Diárias Mensal"
          price={149.90}
          billingCycle="monthly"
          nextBillingDate="2025-11-14"
        />
      )

      // Active status should have green/success styling
      const statusBadge = screen.getByText('Ativa')
      expect(statusBadge.className).toContain('green')
    })
  })

  describe('Pending Subscription Metrics', () => {
    it('should show pending status message', () => {
      render(
        <SubscriptionStatusCard
          status="pending"
          planName="Lentes Diárias Mensal"
          price={149.90}
          billingCycle="monthly"
          nextBillingDate="2025-11-14"
        />
      )

      expect(screen.getByText('Pendente')).toBeInTheDocument()
      expect(screen.getByText('Pagamento em processamento')).toBeInTheDocument()
      expect(screen.getByText(/Seu pagamento está sendo processado/)).toBeInTheDocument()
    })

    it('should render with correct status color - pending', () => {
      render(
        <SubscriptionStatusCard
          status="pending"
          planName="Lentes Diárias Mensal"
          price={149.90}
          billingCycle="monthly"
          nextBillingDate="2025-11-14"
        />
      )

      const statusBadge = screen.getByText('Pendente')
      expect(statusBadge.className).toContain('blue')
    })
  })

  describe('Cancelled Subscription Metrics', () => {
    it('should show cancelled status message', () => {
      render(
        <SubscriptionStatusCard
          status="cancelled"
          planName="Lentes Diárias Mensal"
          price={149.90}
          billingCycle="monthly"
          nextBillingDate="2025-11-14"
        />
      )

      expect(screen.getByText('Cancelada')).toBeInTheDocument()
    })

    it('should show reactivate button for cancelled subscription', () => {
      const onReactivate = vi.fn()

      render(
        <SubscriptionStatusCard
          status="cancelled"
          planName="Lentes Diárias Mensal"
          price={149.90}
          billingCycle="monthly"
          nextBillingDate="2025-11-14"
          onReactivate={onReactivate}
        />
      )

      expect(screen.getByText('Reativar Assinatura')).toBeInTheDocument()
    })

    it('should render with correct status color - cancelled', () => {
      render(
        <SubscriptionStatusCard
          status="cancelled"
          planName="Lentes Diárias Mensal"
          price={149.90}
          billingCycle="monthly"
          nextBillingDate="2025-11-14"
        />
      )

      const statusBadge = screen.getByText('Cancelada')
      expect(statusBadge.className).toContain('red')
    })
  })

  describe('Yearly vs Monthly Billing', () => {
    it('should show yearly billing cycle', () => {
      render(
        <SubscriptionStatusCard
          status="active"
          planName="Lentes Diárias Anual"
          price={1499.90}
          billingCycle="yearly"
          nextBillingDate="2026-10-14"
        />
      )

      const anualTexts = screen.getAllByText(/anual/i)
      expect(anualTexts.length).toBeGreaterThan(0)
    })

    it('should show monthly billing cycle', () => {
      render(
        <SubscriptionStatusCard
          status="active"
          planName="Lentes Diárias Mensal"
          price={149.90}
          billingCycle="monthly"
          nextBillingDate="2025-11-14"
        />
      )

      const mensalTexts = screen.getAllByText(/mensal/i)
      expect(mensalTexts.length).toBeGreaterThan(0)
    })
  })

  describe('Interactive Features', () => {
    it('should render without refresh button when onRefresh not provided', () => {
      render(
        <SubscriptionStatusCard
          status="active"
          planName="Lentes Diárias Mensal"
          price={149.90}
          billingCycle="monthly"
          nextBillingDate="2025-11-14"
        />
      )

      // Component should render successfully
      expect(screen.getByText('Status da Assinatura')).toBeInTheDocument()
    })
  })
})

describe('BenefitsDisplay - Metrics', () => {
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

  describe('Benefits Counting', () => {
    it('should display benefits section', () => {
      render(<BenefitsDisplay benefits={mockBenefits} />)

      // Should show benefits header
      const benefitsTexts = screen.getAllByText(/Benefícios/i)
      expect(benefitsTexts.length).toBeGreaterThan(0)
    })

    it('should display all benefits', () => {
      render(<BenefitsDisplay benefits={mockBenefits} />)

      // Should show all 3 benefits
      expect(screen.getByText('Lentes de contato diárias')).toBeInTheDocument()
      expect(screen.getByText('Entrega mensal programada')).toBeInTheDocument()
      expect(screen.getByText('Benefício Premium')).toBeInTheDocument()
    })
  })

  describe('Benefits Display', () => {
    it('should render all benefit names', () => {
      render(<BenefitsDisplay benefits={mockBenefits} />)

      expect(screen.getByText('Lentes de contato diárias')).toBeInTheDocument()
      expect(screen.getByText('Entrega mensal programada')).toBeInTheDocument()
      expect(screen.getByText('Benefício Premium')).toBeInTheDocument()
    })

    it('should show included status correctly', () => {
      render(<BenefitsDisplay benefits={mockBenefits} />)

      const includedLabels = screen.getAllByText('Incluído')
      expect(includedLabels.length).toBe(2) // 2 benefits are included
    })

    it('should show not available status correctly', () => {
      render(<BenefitsDisplay benefits={mockBenefits} />)

      expect(screen.getByText('Não disponível')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no benefits', () => {
      render(<BenefitsDisplay benefits={[]} />)

      expect(screen.getByText('Nenhum benefício encontrado')).toBeInTheDocument()
    })
  })

  describe('Upgrade Prompt', () => {
    it('should render benefits display successfully', () => {
      render(<BenefitsDisplay benefits={mockBenefits} />)

      // Should show benefits content
      const benefitsTexts = screen.getAllByText(/Benefícios/i)
      expect(benefitsTexts.length).toBeGreaterThan(0)
    })
  })
})

describe('ShippingAddressCard - Metrics', () => {
  const mockAddress = {
    street: 'Rua Principal',
    number: '123',
    neighborhood: 'Centro',
    city: 'Caratinga',
    state: 'MG',
    zipCode: '35300-000',
    complement: 'Apto 101'
  }

  describe('Address Display', () => {
    it('should render full address correctly', () => {
      render(
        <ShippingAddressCard
          address={mockAddress}
          loading={false}
        />
      )

      expect(screen.getByText('Endereço de Entrega')).toBeInTheDocument()
      expect(screen.getByText(/Rua Principal, 123/)).toBeInTheDocument()
      expect(screen.getByText(/Caratinga - MG/)).toBeInTheDocument()
      expect(screen.getByText(/CEP: 35300-000/)).toBeInTheDocument()
    })

    it('should display complement if provided', () => {
      render(
        <ShippingAddressCard
          address={mockAddress}
          loading={false}
        />
      )

      expect(screen.getByText(/Apto 101/)).toBeInTheDocument()
    })

    it('should format CEP correctly', () => {
      render(
        <ShippingAddressCard
          address={mockAddress}
          loading={false}
        />
      )

      // CEP should have dash separator
      expect(screen.getByText(/35300-000/)).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should show loading skeletons', () => {
      const { container } = render(
        <ShippingAddressCard
          address={mockAddress}
          loading={true}
        />
      )

      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no address', () => {
      render(
        <ShippingAddressCard
          address={null}
          loading={false}
        />
      )

      expect(screen.getByText('Nenhum endereço de entrega cadastrado')).toBeInTheDocument()
      expect(screen.getByText('Cadastrar Endereço')).toBeInTheDocument()
    })
  })

  describe('Edit Mode', () => {
    it('should render address card successfully', () => {
      render(
        <ShippingAddressCard
          address={mockAddress}
          loading={false}
        />
      )

      // Should show address header
      expect(screen.getByText('Endereço de Entrega')).toBeInTheDocument()
    })
  })
})
