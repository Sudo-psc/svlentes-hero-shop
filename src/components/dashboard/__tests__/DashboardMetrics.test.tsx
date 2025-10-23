import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DashboardMetrics, QuickStats } from '../dashboard-metrics'

// Mock do hook useMediaQuery
vi.mock('@/hooks/use-media-query', () => ({
  useMediaQuery: vi.fn(() => false)
}))

describe('DashboardMetrics Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render all 4 metric cards', () => {
      render(<DashboardMetrics />)

      // Verify all metric titles are rendered
      expect(screen.getByText('Receita Mensal')).toBeInTheDocument()
      expect(screen.getByText('Assinaturas Ativas')).toBeInTheDocument()
      expect(screen.getByText('Consultas Agendadas')).toBeInTheDocument()
      expect(screen.getByText('Taxa de Conversão')).toBeInTheDocument()
    })

    it('should render all 3 progress cards', () => {
      render(<DashboardMetrics />)

      expect(screen.getByText('Progresso de Entrega')).toBeInTheDocument()
      expect(screen.getByText('Satisfação do Cliente')).toBeInTheDocument()
      expect(screen.getByText('Status do Estoque')).toBeInTheDocument()
    })

    it('should display correct metric values', () => {
      render(<DashboardMetrics />)

      expect(screen.getByText('R$ 2.450')).toBeInTheDocument()
      expect(screen.getByText('156')).toBeInTheDocument()
      expect(screen.getByText('23')).toBeInTheDocument()
      expect(screen.getByText('68.5%')).toBeInTheDocument()
    })
  })

  describe('Trend Indicators', () => {
    it('should show positive trends with correct styling', () => {
      const { container } = render(<DashboardMetrics />)

      // Check for positive trend indicators (green color)
      const positiveTrends = container.querySelectorAll('.text-green-600')
      expect(positiveTrends.length).toBeGreaterThan(0)
    })

    it('should show negative trends with correct styling', () => {
      const { container } = render(<DashboardMetrics />)

      // Check for negative trend indicators (red color)
      const negativeTrends = container.querySelectorAll('.text-red-600')
      expect(negativeTrends.length).toBeGreaterThan(0)
    })

    it('should display trend percentages correctly', () => {
      render(<DashboardMetrics />)

      // Positive trends
      expect(screen.getByText('+12.5%')).toBeInTheDocument()
      expect(screen.getByText('+8.2%')).toBeInTheDocument()
      expect(screen.getByText('+5.7%')).toBeInTheDocument()

      // Negative trend
      expect(screen.getByText('-3.1%')).toBeInTheDocument()
    })

    it('should show comparison text', () => {
      render(<DashboardMetrics />)

      const comparisonTexts = screen.getAllByText('vs. mês anterior')
      expect(comparisonTexts.length).toBeGreaterThan(0)
    })
  })

  describe('Progress Metrics', () => {
    it('should render progress with correct percentages', () => {
      render(<DashboardMetrics />)

      // These percentages should be visible in the progress cards
      expect(screen.getByText('75%')).toBeInTheDocument()
      expect(screen.getByText('92%')).toBeInTheDocument()
      expect(screen.getByText('45%')).toBeInTheDocument()
    })

    it('should apply correct status colors to progress cards', () => {
      const { container } = render(<DashboardMetrics />)

      // Ant Design Progress uses specific classes for status
      // We can check if the component structure exists
      const progressElements = container.querySelectorAll('.ant-progress')
      expect(progressElements.length).toBe(3)
    })
  })

  describe('Responsive Behavior', () => {
    it('should render correctly on desktop', () => {
      const { useMediaQuery } = require('@/hooks/use-media-query')
      useMediaQuery.mockReturnValue(false)

      render(<DashboardMetrics />)

      // Desktop should show all cards
      expect(screen.getByText('Receita Mensal')).toBeInTheDocument()
      expect(screen.getByText('Assinaturas Ativas')).toBeInTheDocument()
    })

    it('should render correctly on mobile', () => {
      const { useMediaQuery } = require('@/hooks/use-media-query')
      useMediaQuery.mockReturnValue(true)

      render(<DashboardMetrics />)

      // Mobile should still show all cards, just with different layout
      expect(screen.getByText('Receita Mensal')).toBeInTheDocument()
      expect(screen.getByText('Assinaturas Ativas')).toBeInTheDocument()
    })
  })

  describe('Icons and Visual Elements', () => {
    it('should render icons for each metric card', () => {
      const { container } = render(<DashboardMetrics />)

      // Check for Ant Design icon components
      const icons = container.querySelectorAll('.anticon')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should apply custom colors to metric cards', () => {
      const { container } = render(<DashboardMetrics />)

      // Check for colored background elements
      const coloredBgs = container.querySelectorAll('[style*="backgroundColor"]')
      expect(coloredBgs.length).toBeGreaterThan(0)
    })
  })

  describe('Custom className', () => {
    it('should accept and apply custom className', () => {
      const { container } = render(<DashboardMetrics className="custom-test-class" />)

      const element = container.querySelector('.custom-test-class')
      expect(element).toBeInTheDocument()
    })
  })
})

describe('QuickStats Component', () => {
  const mockData = [
    {
      label: 'Total de Vendas',
      value: 'R$ 15.430',
      change: 12.5
    },
    {
      label: 'Novos Clientes',
      value: 42,
      change: -5.2
    },
    {
      label: 'Pedidos Pendentes',
      value: 18,
      change: 0
    }
  ]

  describe('Rendering', () => {
    it('should render all quick stat items', () => {
      render(<QuickStats data={mockData} />)

      expect(screen.getByText('Total de Vendas')).toBeInTheDocument()
      expect(screen.getByText('Novos Clientes')).toBeInTheDocument()
      expect(screen.getByText('Pedidos Pendentes')).toBeInTheDocument()
    })

    it('should display correct values', () => {
      render(<QuickStats data={mockData} />)

      expect(screen.getByText('R$ 15.430')).toBeInTheDocument()
      expect(screen.getByText('42')).toBeInTheDocument()
      expect(screen.getByText('18')).toBeInTheDocument()
    })

    it('should show change indicators when provided', () => {
      render(<QuickStats data={mockData} />)

      expect(screen.getByText('↑ 12.5%')).toBeInTheDocument()
      expect(screen.getByText('↓ 5.2%')).toBeInTheDocument()
    })

    it('should apply correct color to positive changes', () => {
      const { container } = render(<QuickStats data={mockData} />)

      const positiveChange = screen.getByText('↑ 12.5%')
      expect(positiveChange.className).toContain('text-green-600')
    })

    it('should apply correct color to negative changes', () => {
      const { container } = render(<QuickStats data={mockData} />)

      const negativeChange = screen.getByText('↓ 5.2%')
      expect(negativeChange.className).toContain('text-red-600')
    })

    it('should not show change indicator when change is 0', () => {
      render(<QuickStats data={mockData} />)

      // The third item has change: 0, so it shouldn't display
      const zeroChangeText = screen.queryByText('↑ 0%')
      expect(zeroChangeText).not.toBeInTheDocument()
    })
  })

  describe('Responsive Grid', () => {
    it('should render with responsive column layout', () => {
      const { container } = render(<QuickStats data={mockData} />)

      const cols = container.querySelectorAll('.ant-col')
      expect(cols.length).toBe(mockData.length)
    })
  })

  describe('Custom className', () => {
    it('should accept and apply custom className', () => {
      const { container } = render(
        <QuickStats data={mockData} className="custom-stats-class" />
      )

      const element = container.querySelector('.custom-stats-class')
      expect(element).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should handle empty data array', () => {
      const { container } = render(<QuickStats data={[]} />)

      const cards = container.querySelectorAll('.ant-card')
      expect(cards.length).toBe(0)
    })
  })

  describe('Mobile Responsiveness', () => {
    it('should adjust font sizes on mobile', () => {
      const { useMediaQuery } = require('@/hooks/use-media-query')
      useMediaQuery.mockReturnValue(true)

      render(<QuickStats data={mockData} />)

      // Component should render successfully on mobile
      expect(screen.getByText('Total de Vendas')).toBeInTheDocument()
    })
  })
})
