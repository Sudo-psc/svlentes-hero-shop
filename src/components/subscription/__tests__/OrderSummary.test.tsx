import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrderSummary } from '../OrderSummary'
import { type LensData } from '@/types/subscription'

jest.mock('@/config/loader', () => ({
  config: {
    load: jest.fn(() => ({
      featureFlags: { useCentralizedPricing: true },
      pricing: {
        plans: [
          {
            id: 'basico',
            name: 'Plano Básico',
            badge: 'Mock',
            priceMonthly: 89,
            priceAnnual: 1068,
            description: 'Mock plan',
            features: [],
            recommended: false,
            stripeProductId: 'mock',
            stripePriceId: 'mock',
            asaasProductId: 'mock',
            ctaText: 'Mock',
          },
        ],
        featureComparison: { features: [], planComparison: [] },
      },
    })),
    isFeatureEnabled: jest.fn(() => true),
  },
}))

const baseLensData: LensData = {
  type: 'monthly',
  brand: 'Acuvue',
  rightEye: { sphere: '-1.50', cylinder: '', axis: '' },
  leftEye: { sphere: '-1.25', cylinder: '', axis: '' },
}

describe('OrderSummary', () => {
  const createProps = () => ({
    planId: 'basico',
    billingCycle: 'monthly' as const,
    lensData: baseLensData,
    addOns: ['solution', 'express'],
    onBack: jest.fn(),
    onConfirm: jest.fn(),
  })

  it('renders plan details and totals with add-ons', () => {
    render(<OrderSummary {...createProps()} />)

    expect(screen.getByText('Plano Selecionado')).toBeInTheDocument()
    expect(screen.getByText('Plano Básico')).toBeInTheDocument()
    expect(screen.getByText('Serviços Adicionais')).toBeInTheDocument()
    expect(screen.getByText('+R$ 25')).toBeInTheDocument()
    expect(screen.getByText('+R$ 30')).toBeInTheDocument()
    expect(screen.getAllByText('R$ 89.00')).not.toHaveLength(0)
    expect(screen.getAllByText('R$ 55.00')).not.toHaveLength(0)
    expect(screen.getByText('R$ 144.00')).toBeInTheDocument()
  })

  it('applies masks to phone and CPF fields as the user types', async () => {
    const user = userEvent.setup()
    render(<OrderSummary {...createProps()} />)

    const phoneInput = screen.getByPlaceholderText('(11) 99999-9999')
    const documentInput = screen.getByPlaceholderText('000.000.000-00')

    await user.type(phoneInput, '11987654321')
    await user.type(documentInput, '52998224725')

    expect(phoneInput).toHaveValue('(11) 98765-4321')
    expect(documentInput).toHaveValue('529.982.247-25')
  })

  it('displays validation feedback for invalid email on blur', async () => {
    const user = userEvent.setup()
    render(<OrderSummary {...createProps()} />)

    const emailInput = screen.getByPlaceholderText('joao@email.com')
    await user.type(emailInput, 'invalid-email')
    fireEvent.blur(emailInput)

    expect(await screen.findByText('Email inválido')).toBeInTheDocument()
  })

  it('collects sanitized contact data in form state', async () => {
    const user = userEvent.setup()
    const onConfirm = jest.fn()
    render(<OrderSummary {...createProps()} onConfirm={onConfirm} />)

    await user.type(screen.getByPlaceholderText('João Silva'), 'Maria Souza')
    await user.type(screen.getByPlaceholderText('(11) 99999-9999'), '11987654321')
    await user.type(screen.getByPlaceholderText('joao@email.com'), 'maria@souza.com')
    await user.type(screen.getByPlaceholderText('000.000.000-00'), '52998224725')

    const paymentSelect = screen.getByRole('combobox')
    await user.selectOptions(paymentSelect, 'BOLETO')

    const checkboxes = screen.getAllByRole('checkbox')
    for (const checkbox of checkboxes) {
      await user.click(checkbox)
      expect((checkbox as HTMLInputElement).checked).toBe(true)
    }

    expect(screen.getByPlaceholderText('João Silva')).toHaveValue('Maria Souza')
    expect(screen.getByPlaceholderText('(11) 99999-9999')).toHaveValue('(11) 98765-4321')
    expect(screen.getByPlaceholderText('joao@email.com')).toHaveValue('maria@souza.com')
    expect(screen.getByPlaceholderText('000.000.000-00')).toHaveValue('529.982.247-25')
    expect(screen.getByRole('combobox')).toHaveValue('BOLETO')
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
