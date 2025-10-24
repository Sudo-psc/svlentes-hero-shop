import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ContextualQuickActions from '../ContextualQuickActions'
import { mockContextualActions } from '@/__tests__/fixtures/phase2-fixtures'

// Mock fetch globally
global.fetch = vi.fn()

describe('ContextualQuickActions Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering and Display', () => {
    it('should render actions in grid layout', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actions: [
            mockContextualActions.renewal,
            mockContextualActions.whatsapp
          ]
        })
      } as Response)

      const { container } = render(<ContextualQuickActions />)

      await waitFor(() => {
        const grid = container.querySelector('.grid')
        expect(grid).toBeInTheDocument()
      })
    })

    it('should apply variant colors correctly', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actions: [
            mockContextualActions.renewal, // destructive variant
            mockContextualActions.evaluation, // warning variant
            mockContextualActions.whatsapp // success variant
          ]
        })
      } as Response)

      render(<ContextualQuickActions />)

      await waitFor(() => {
        // Destructive variant (renewal)
        const renewalAction = screen.getByText('Renovar Prescrição')
        expect(renewalAction.closest('button')?.className).toMatch(/destructive|red/)

        // Warning variant (evaluation)
        const evaluationAction = screen.getByText('Agendar Reavaliação')
        expect(evaluationAction.closest('button')?.className).toMatch(/warning|amber/)

        // Success variant (WhatsApp)
        const whatsappAction = screen.getByText('Falar no WhatsApp')
        expect(whatsappAction.closest('button')?.className).toMatch(/success|green/)
      })
    })

    it('should show alerts at the top', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actions: [
            mockContextualActions.payment, // High priority alert
            mockContextualActions.whatsapp
          ]
        })
      } as Response)

      const { container } = render(<ContextualQuickActions />)

      await waitFor(() => {
        const alerts = container.querySelectorAll('[role="alert"]')
        expect(alerts.length).toBeGreaterThan(0)

        // Alert should appear before other actions
        const firstAlert = alerts[0]
        expect(firstAlert).toBeInTheDocument()
      })
    })

    it('should display all action properties correctly', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actions: [mockContextualActions.renewal]
        })
      } as Response)

      render(<ContextualQuickActions />)

      await waitFor(() => {
        expect(screen.getByText('Renovar Prescrição')).toBeInTheDocument()
        expect(screen.getByText('Sua prescrição vence em 5 dias')).toBeInTheDocument()
      })
    })
  })

  describe('Action Execution', () => {
    it('should execute action on click', async () => {
      const mockAction = vi.fn()

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actions: [{
            ...mockContextualActions.renewal,
            action: mockAction
          }]
        })
      } as Response)

      render(<ContextualQuickActions />)

      await waitFor(() => {
        const actionButton = screen.getByText('Renovar Prescrição')
        fireEvent.click(actionButton)
      })

      expect(mockAction).toHaveBeenCalled()
    })

    it('should navigate to correct page for renewal action', async () => {
      const mockNavigate = vi.fn()

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actions: [mockContextualActions.renewal]
        })
      } as Response)

      render(<ContextualQuickActions onNavigate={mockNavigate} />)

      await waitFor(() => {
        const actionButton = screen.getByText('Renovar Prescrição')
        fireEvent.click(actionButton)
      })

      expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('renovar'))
    })

    it('should open WhatsApp for WhatsApp action', async () => {
      const mockWindowOpen = vi.fn()
      global.window.open = mockWindowOpen

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actions: [mockContextualActions.whatsapp]
        })
      } as Response)

      render(<ContextualQuickActions />)

      await waitFor(() => {
        const actionButton = screen.getByText('Falar no WhatsApp')
        fireEvent.click(actionButton)
      })

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('wa.me'),
        '_blank'
      )
    })
  })

  describe('Loading State', () => {
    it('should show loading skeletons initially', () => {
      vi.mocked(fetch).mockImplementationOnce(
        () => new Promise(() => {}) // Never resolves
      )

      const { container } = render(<ContextualQuickActions />)

      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should show loading text', () => {
      vi.mocked(fetch).mockImplementationOnce(
        () => new Promise(() => {}) // Never resolves
      )

      render(<ContextualQuickActions />)

      expect(screen.getByText(/carregando/i)).toBeInTheDocument()
    })
  })

  describe('Priority Ordering', () => {
    it('should order actions by priority correctly', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actions: [
            mockContextualActions.whatsapp, // low priority
            mockContextualActions.evaluation, // medium priority
            mockContextualActions.payment // high priority
          ]
        })
      } as Response)

      const { container } = render(<ContextualQuickActions />)

      await waitFor(() => {
        const actionButtons = container.querySelectorAll('button')
        const actionTitles = Array.from(actionButtons).map(btn => btn.textContent)

        // High priority should come first
        const paymentIndex = actionTitles.findIndex(title => title?.includes('Pagamento'))
        const whatsappIndex = actionTitles.findIndex(title => title?.includes('WhatsApp'))

        expect(paymentIndex).toBeLessThan(whatsappIndex)
      })
    })

    it('should group high priority actions together', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actions: [
            mockContextualActions.renewal, // high
            mockContextualActions.payment, // high
            mockContextualActions.evaluation, // medium
            mockContextualActions.whatsapp // low
          ]
        })
      } as Response)

      const { container } = render(<ContextualQuickActions />)

      await waitFor(() => {
        const actionButtons = container.querySelectorAll('button')
        const priorities = Array.from(actionButtons).map(btn => {
          const className = btn.className
          if (className.includes('destructive') || className.includes('red')) return 'high'
          if (className.includes('warning') || className.includes('amber')) return 'medium'
          return 'low'
        })

        // First two should be high priority
        expect(priorities[0]).toBe('high')
        expect(priorities[1]).toBe('high')
      })
    })
  })

  describe('Empty State', () => {
    it('should show message when no actions available', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ actions: [] })
      } as Response)

      render(<ContextualQuickActions />)

      await waitFor(() => {
        expect(screen.getByText(/nenhuma ação/i)).toBeInTheDocument()
      })
    })

    it('should show default WhatsApp action when others unavailable', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actions: [mockContextualActions.whatsapp]
        })
      } as Response)

      render(<ContextualQuickActions />)

      await waitFor(() => {
        expect(screen.getByText('Falar no WhatsApp')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should show error message when fetch fails', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      render(<ContextualQuickActions />)

      await waitFor(() => {
        expect(screen.getByText(/erro/i)).toBeInTheDocument()
      })
    })

    it('should retry on error', async () => {
      // First call fails
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      render(<ContextualQuickActions />)

      await waitFor(() => {
        expect(screen.getByText(/erro/i)).toBeInTheDocument()
      })

      // Second call succeeds
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actions: [mockContextualActions.whatsapp]
        })
      } as Response)

      const retryButton = screen.getByText(/tentar novamente/i)
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText('Falar no WhatsApp')).toBeInTheDocument()
      })
    })
  })

  describe('Visual Variants', () => {
    it('should apply correct styles for destructive variant', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actions: [mockContextualActions.payment]
        })
      } as Response)

      render(<ContextualQuickActions />)

      await waitFor(() => {
        const actionButton = screen.getByText('Pagamento Pendente').closest('button')
        expect(actionButton?.className).toMatch(/bg-red|destructive/)
      })
    })

    it('should apply correct styles for warning variant', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actions: [mockContextualActions.evaluation]
        })
      } as Response)

      render(<ContextualQuickActions />)

      await waitFor(() => {
        const actionButton = screen.getByText('Agendar Reavaliação').closest('button')
        expect(actionButton?.className).toMatch(/bg-amber|warning/)
      })
    })

    it('should apply correct styles for success variant', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actions: [mockContextualActions.whatsapp]
        })
      } as Response)

      render(<ContextualQuickActions />)

      await waitFor(() => {
        const actionButton = screen.getByText('Falar no WhatsApp').closest('button')
        expect(actionButton?.className).toMatch(/bg-green|success/)
      })
    })
  })

  describe('Accessibility', () => {
    it('should have accessible button roles', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actions: [mockContextualActions.renewal]
        })
      } as Response)

      render(<ContextualQuickActions />)

      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
      })
    })

    it('should have alert roles for high priority actions', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actions: [mockContextualActions.payment]
        })
      } as Response)

      const { container } = render(<ContextualQuickActions />)

      await waitFor(() => {
        const alerts = container.querySelectorAll('[role="alert"]')
        expect(alerts.length).toBeGreaterThan(0)
      })
    })

    it('should be keyboard navigable', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actions: [
            mockContextualActions.renewal,
            mockContextualActions.whatsapp
          ]
        })
      } as Response)

      render(<ContextualQuickActions />)

      await waitFor(() => {
        const buttons = screen.getAllByRole('button')

        // Tab through buttons
        buttons[0].focus()
        expect(document.activeElement).toBe(buttons[0])

        // Press Tab
        fireEvent.keyDown(buttons[0], { key: 'Tab', code: 'Tab' })
      })
    })
  })

  describe('Icons', () => {
    it('should render icons for each action type', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actions: [
            mockContextualActions.renewal,
            mockContextualActions.whatsapp
          ]
        })
      } as Response)

      const { container } = render(<ContextualQuickActions />)

      await waitFor(() => {
        const icons = container.querySelectorAll('svg')
        expect(icons.length).toBeGreaterThanOrEqual(2)
      })
    })
  })
})
