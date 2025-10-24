import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RealTimeDeliveryStatus from '../RealTimeDeliveryStatus'
import { mockDeliveryStatus } from '@/__tests__/fixtures/phase2-fixtures'

// Mock fetch globally
global.fetch = vi.fn()

describe('RealTimeDeliveryStatus Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering and Display', () => {
    it('should render delivery status and progress bar', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ delivery: mockDeliveryStatus.current })
      } as Response)

      render(<RealTimeDeliveryStatus />)

      await waitFor(() => {
        expect(screen.getByText('Status da Entrega')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText('Em Trânsito')).toBeInTheDocument()
      })

      // Progress bar should be visible
      const progressBar = document.querySelector('[role="progressbar"]')
      expect(progressBar).toBeInTheDocument()
    })

    it('should show countdown of days correctly', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          delivery: {
            ...mockDeliveryStatus.current,
            daysRemaining: 3
          }
        })
      } as Response)

      render(<RealTimeDeliveryStatus />)

      await waitFor(() => {
        expect(screen.getByText(/3 dias/i)).toBeInTheDocument()
      })
    })

    it('should render timeline of events', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ delivery: mockDeliveryStatus.current })
      } as Response)

      render(<RealTimeDeliveryStatus />)

      await waitFor(() => {
        expect(screen.getByText('Linha do Tempo')).toBeInTheDocument()
      })

      // Should show timeline events
      await waitFor(() => {
        expect(screen.getByText('Pedido realizado')).toBeInTheDocument()
        expect(screen.getByText('Pagamento confirmado')).toBeInTheDocument()
        expect(screen.getByText('Pedido enviado')).toBeInTheDocument()
        expect(screen.getByText('Em trânsito')).toBeInTheDocument()
      })
    })

    it('should show tracking link when available', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          delivery: {
            ...mockDeliveryStatus.current,
            trackingUrl: 'https://rastreamento.correios.com.br/BR123456789BR'
          }
        })
      } as Response)

      render(<RealTimeDeliveryStatus />)

      await waitFor(() => {
        const trackingLink = screen.getByText(/rastrear/i)
        expect(trackingLink).toBeInTheDocument()
        expect(trackingLink.closest('a')).toHaveAttribute(
          'href',
          'https://rastreamento.correios.com.br/BR123456789BR'
        )
      })
    })
  })

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      vi.mocked(fetch).mockImplementationOnce(
        () => new Promise(() => {}) // Never resolves
      )

      render(<RealTimeDeliveryStatus />)

      expect(screen.getByText('Carregando...')).toBeInTheDocument()
    })

    it('should show skeleton loaders during loading', () => {
      vi.mocked(fetch).mockImplementationOnce(
        () => new Promise(() => {}) // Never resolves
      )

      const { container } = render(<RealTimeDeliveryStatus />)

      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('Error State', () => {
    it('should show error state when fetch fails', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      render(<RealTimeDeliveryStatus />)

      await waitFor(() => {
        expect(screen.getByText(/erro/i)).toBeInTheDocument()
      })
    })

    it('should show retry button on error', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      render(<RealTimeDeliveryStatus />)

      await waitFor(() => {
        const retryButton = screen.getByText(/tentar novamente/i)
        expect(retryButton).toBeInTheDocument()
      })
    })

    it('should retry fetch when retry button is clicked', async () => {
      // First call fails
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      render(<RealTimeDeliveryStatus />)

      await waitFor(() => {
        expect(screen.getByText(/erro/i)).toBeInTheDocument()
      })

      // Second call succeeds
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ delivery: mockDeliveryStatus.current })
      } as Response)

      const retryButton = screen.getByText(/tentar novamente/i)
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText('Status da Entrega')).toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no deliveries', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ delivery: null })
      } as Response)

      render(<RealTimeDeliveryStatus />)

      await waitFor(() => {
        expect(screen.getByText(/nenhuma entrega/i)).toBeInTheDocument()
      })
    })

    it('should show next delivery estimate when no current delivery', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          delivery: null,
          nextDelivery: {
            estimatedDate: '2025-12-05',
            daysUntilNext: 30
          }
        })
      } as Response)

      render(<RealTimeDeliveryStatus />)

      await waitFor(() => {
        expect(screen.getByText(/próxima entrega/i)).toBeInTheDocument()
        expect(screen.getByText(/30 dias/i)).toBeInTheDocument()
      })
    })
  })

  describe('Status Indicators', () => {
    it('should show correct color for pending payment', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ delivery: mockDeliveryStatus.pending })
      } as Response)

      render(<RealTimeDeliveryStatus />)

      await waitFor(() => {
        const statusBadge = screen.getByText('Aguardando Pagamento')
        expect(statusBadge.className).toContain('blue')
      })
    })

    it('should show correct color for in transit', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ delivery: mockDeliveryStatus.current })
      } as Response)

      render(<RealTimeDeliveryStatus />)

      await waitFor(() => {
        const statusBadge = screen.getByText('Em Trânsito')
        expect(statusBadge.className).toContain('cyan')
      })
    })

    it('should show correct color for delivered', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ delivery: mockDeliveryStatus.delivered })
      } as Response)

      render(<RealTimeDeliveryStatus />)

      await waitFor(() => {
        const statusBadge = screen.getByText('Entregue')
        expect(statusBadge.className).toContain('green')
      })
    })
  })

  describe('Progress Bar Animation', () => {
    it('should display progress bar with correct percentage', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          delivery: {
            ...mockDeliveryStatus.current,
            progress: 60
          }
        })
      } as Response)

      render(<RealTimeDeliveryStatus />)

      await waitFor(() => {
        const progressBar = document.querySelector('[role="progressbar"]')
        expect(progressBar).toBeInTheDocument()
        // Progress bar should show 60%
        expect(progressBar?.getAttribute('aria-valuenow')).toBe('60')
      })
    })

    it('should animate progress bar smoothly', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          delivery: {
            ...mockDeliveryStatus.current,
            progress: 75
          }
        })
      } as Response)

      const { container } = render(<RealTimeDeliveryStatus />)

      await waitFor(() => {
        const progressBar = container.querySelector('.transition-all')
        expect(progressBar).toBeInTheDocument()
      })
    })
  })

  describe('Timeline Events', () => {
    it('should render all timeline events', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ delivery: mockDeliveryStatus.current })
      } as Response)

      render(<RealTimeDeliveryStatus />)

      await waitFor(() => {
        mockDeliveryStatus.current.timeline.forEach(event => {
          expect(screen.getByText(event.description)).toBeInTheDocument()
        })
      })
    })

    it('should show event timestamps', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ delivery: mockDeliveryStatus.current })
      } as Response)

      render(<RealTimeDeliveryStatus />)

      await waitFor(() => {
        // Should show formatted dates
        const dateElements = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/)
        expect(dateElements.length).toBeGreaterThan(0)
      })
    })

    it('should show event locations', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ delivery: mockDeliveryStatus.current })
      } as Response)

      render(<RealTimeDeliveryStatus />)

      await waitFor(() => {
        expect(screen.getByText('Caratinga - MG')).toBeInTheDocument()
        expect(screen.getByText('Belo Horizonte - MG')).toBeInTheDocument()
      })
    })
  })

  describe('Auto-refresh', () => {
    it('should auto-refresh delivery status periodically', async () => {
      vi.useFakeTimers()

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ delivery: mockDeliveryStatus.current })
      } as Response)

      render(<RealTimeDeliveryStatus />)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1)
      })

      // Fast-forward 30 seconds (typical auto-refresh interval)
      vi.advanceTimersByTime(30000)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2)
      })

      vi.useRealTimers()
    })
  })
})
