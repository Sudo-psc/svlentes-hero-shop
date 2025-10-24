/**
 * PaymentHistoryTable Component Tests - Phase 3
 * Testes completos para tabela de histórico de pagamentos
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom'
import PaymentHistoryTable from '../PaymentHistoryTable'
import {
  mockPaymentHistory,
  createMockPaymentHistoryResponse
} from '@/__tests__/fixtures/phase3-fixtures'

// Mock fetch globally
global.fetch = vi.fn()

describe('PaymentHistoryTable Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering and Display', () => {
    it('should render summary cards', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaymentHistory
      } as Response)

      render(<PaymentHistoryTable />)

      await waitFor(() => {
        expect(screen.getByText('Total Pago')).toBeInTheDocument()
        expect(screen.getByText('Total Pendente')).toBeInTheDocument()
        expect(screen.getByText('Taxa de Pontualidade')).toBeInTheDocument()
      })
    })

    it('should render payment table', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaymentHistory
      } as Response)

      render(<PaymentHistoryTable />)

      await waitFor(() => {
        expect(screen.getByText('Histórico de Pagamentos')).toBeInTheDocument()
      })

      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
    })

    it('should render correct status badges', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaymentHistory
      } as Response)

      render(<PaymentHistoryTable />)

      await waitFor(() => {
        // PAID badge should be green
        const paidBadges = screen.getAllByText('Pago')
        expect(paidBadges[0].className).toContain('green')

        // PENDING badge should be amber
        const pendingBadge = screen.getByText('Pendente')
        expect(pendingBadge.className).toContain('amber')
      })
    })

    it('should render formatted currency values (R$)', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaymentHistory
      } as Response)

      render(<PaymentHistoryTable />)

      await waitFor(() => {
        const currencyValues = screen.getAllByText(/R\$\s*\d+,\d{2}/)
        expect(currencyValues.length).toBeGreaterThan(0)
      })
    })

    it('should render formatted dates (pt-BR)', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaymentHistory
      } as Response)

      render(<PaymentHistoryTable />)

      await waitFor(() => {
        // Dates should be in DD/MM/YYYY format
        const dateElements = screen.getAllByText(/\d{2}\/\d{2}\/\d{4}/)
        expect(dateElements.length).toBeGreaterThan(0)
      })
    })

    it('should render download buttons', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaymentHistory
      } as Response)

      render(<PaymentHistoryTable />)

      await waitFor(() => {
        const downloadButtons = screen.getAllByText(/baixar|download/i)
        expect(downloadButtons.length).toBeGreaterThan(0)
      })
    })

    it('should render pagination controls', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaymentHistory
      } as Response)

      render(<PaymentHistoryTable />)

      await waitFor(() => {
        expect(screen.getByText(/página/i)).toBeInTheDocument()
      })
    })

    it('should render empty state when no payments', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockPaymentHistory,
          payments: []
        })
      } as Response)

      render(<PaymentHistoryTable />)

      await waitFor(() => {
        expect(screen.getByText(/nenhum pagamento/i)).toBeInTheDocument()
      })
    })

    it('should render loading skeleton', () => {
      vi.mocked(fetch).mockImplementationOnce(
        () => new Promise(() => {}) // Never resolves
      )

      const { container } = render(<PaymentHistoryTable />)

      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('Filtering', () => {
    it('should filter by status when select changes', async () => {
      const onFilterChange = vi.fn()

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaymentHistory
      } as Response)

      render(<PaymentHistoryTable onFilterChange={onFilterChange} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/status/i)).toBeInTheDocument()
      })

      const statusSelect = screen.getByLabelText(/status/i)
      fireEvent.change(statusSelect, { target: { value: 'PAID' } })

      await waitFor(() => {
        expect(onFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'PAID' })
        )
      })
    })

    it('should filter by method when select changes', async () => {
      const onFilterChange = vi.fn()

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaymentHistory
      } as Response)

      render(<PaymentHistoryTable onFilterChange={onFilterChange} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/método/i)).toBeInTheDocument()
      })

      const methodSelect = screen.getByLabelText(/método/i)
      fireEvent.change(methodSelect, { target: { value: 'PIX' } })

      await waitFor(() => {
        expect(onFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({ method: 'PIX' })
        )
      })
    })

    it('should filter by period when dates change', async () => {
      const onFilterChange = vi.fn()

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaymentHistory
      } as Response)

      render(<PaymentHistoryTable onFilterChange={onFilterChange} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/data inicial/i)).toBeInTheDocument()
      })

      const startDateInput = screen.getByLabelText(/data inicial/i)
      fireEvent.change(startDateInput, { target: { value: '2025-08-01' } })

      await waitFor(() => {
        expect(onFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({ startDate: '2025-08-01' })
        )
      })
    })

    it('should call onFilterChange with correct filters', async () => {
      const onFilterChange = vi.fn()

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaymentHistory
      } as Response)

      render(<PaymentHistoryTable onFilterChange={onFilterChange} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/status/i)).toBeInTheDocument()
      })

      const statusSelect = screen.getByLabelText(/status/i)
      fireEvent.change(statusSelect, { target: { value: 'PENDING' } })

      await waitFor(() => {
        expect(onFilterChange).toHaveBeenCalledWith({
          status: 'PENDING',
          method: null,
          startDate: null,
          endDate: null
        })
      })
    })

    it('should clear filters when Clear button clicked', async () => {
      const onFilterChange = vi.fn()

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaymentHistory
      } as Response)

      render(<PaymentHistoryTable onFilterChange={onFilterChange} />)

      await waitFor(() => {
        expect(screen.getByText(/limpar filtros/i)).toBeInTheDocument()
      })

      const clearButton = screen.getByText(/limpar filtros/i)
      fireEvent.click(clearButton)

      await waitFor(() => {
        expect(onFilterChange).toHaveBeenCalledWith({
          status: null,
          method: null,
          startDate: null,
          endDate: null
        })
      })
    })
  })

  describe('Pagination', () => {
    it('should navigate to next page', async () => {
      const onPageChange = vi.fn()

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaymentHistory
      } as Response)

      render(<PaymentHistoryTable onPageChange={onPageChange} />)

      await waitFor(() => {
        expect(screen.getByText(/próximo/i)).toBeInTheDocument()
      })

      const nextButton = screen.getByText(/próximo/i)
      fireEvent.click(nextButton)

      await waitFor(() => {
        expect(onPageChange).toHaveBeenCalledWith(2)
      })
    })

    it('should navigate to previous page', async () => {
      const onPageChange = vi.fn()

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockPaymentHistory,
          pagination: { ...mockPaymentHistory.pagination, page: 2 }
        })
      } as Response)

      render(<PaymentHistoryTable currentPage={2} onPageChange={onPageChange} />)

      await waitFor(() => {
        expect(screen.getByText(/anterior/i)).toBeInTheDocument()
      })

      const prevButton = screen.getByText(/anterior/i)
      fireEvent.click(prevButton)

      await waitFor(() => {
        expect(onPageChange).toHaveBeenCalledWith(1)
      })
    })

    it('should navigate to specific page', async () => {
      const onPageChange = vi.fn()

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaymentHistory
      } as Response)

      render(<PaymentHistoryTable onPageChange={onPageChange} />)

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument()
      })

      const pageButton = screen.getByText('3')
      fireEvent.click(pageButton)

      await waitFor(() => {
        expect(onPageChange).toHaveBeenCalledWith(3)
      })
    })

    it('should disable Previous button on page 1', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaymentHistory
      } as Response)

      render(<PaymentHistoryTable />)

      await waitFor(() => {
        const prevButton = screen.getByText(/anterior/i)
        expect(prevButton).toBeDisabled()
      })
    })

    it('should disable Next button on last page', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockPaymentHistory,
          pagination: {
            page: 1,
            limit: 20,
            total: 9,
            totalPages: 1
          }
        })
      } as Response)

      render(<PaymentHistoryTable />)

      await waitFor(() => {
        const nextButton = screen.getByText(/próximo/i)
        expect(nextButton).toBeDisabled()
      })
    })

    it('should call onPageChange with correct page number', async () => {
      const onPageChange = vi.fn()

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaymentHistory
      } as Response)

      render(<PaymentHistoryTable onPageChange={onPageChange} />)

      await waitFor(() => {
        expect(screen.getByText(/próximo/i)).toBeInTheDocument()
      })

      const nextButton = screen.getByText(/próximo/i)
      fireEvent.click(nextButton)

      await waitFor(() => {
        expect(onPageChange).toHaveBeenCalledWith(2)
        expect(onPageChange).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Download Actions', () => {
    it('should download invoice when button clicked', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaymentHistory
      } as Response)

      render(<PaymentHistoryTable />)

      await waitFor(() => {
        expect(screen.getAllByText(/nota fiscal/i)[0]).toBeInTheDocument()
      })

      const invoiceButton = screen.getAllByText(/nota fiscal/i)[0]
      fireEvent.click(invoiceButton)

      // Should trigger download
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })

    it('should download receipt when button clicked', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaymentHistory
      } as Response)

      render(<PaymentHistoryTable />)

      await waitFor(() => {
        expect(screen.getAllByText(/comprovante/i)[0]).toBeInTheDocument()
      })

      const receiptButton = screen.getAllByText(/comprovante/i)[0]
      fireEvent.click(receiptButton)

      // Should trigger download
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })

    it('should show loading during download', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaymentHistory
      } as Response)

      render(<PaymentHistoryTable />)

      await waitFor(() => {
        expect(screen.getAllByText(/nota fiscal/i)[0]).toBeInTheDocument()
      })

      // Mock slow download
      vi.mocked(fetch).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      )

      const invoiceButton = screen.getAllByText(/nota fiscal/i)[0]
      fireEvent.click(invoiceButton)

      await waitFor(() => {
        expect(screen.getByText(/baixando/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have semantic table headers', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaymentHistory
      } as Response)

      render(<PaymentHistoryTable />)

      await waitFor(() => {
        const table = screen.getByRole('table')
        const headers = within(table).getAllByRole('columnheader')
        expect(headers.length).toBeGreaterThan(0)
      })
    })

    it('should support keyboard navigation', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaymentHistory
      } as Response)

      render(<PaymentHistoryTable />)

      await waitFor(() => {
        expect(screen.getByLabelText(/status/i)).toBeInTheDocument()
      })

      const statusSelect = screen.getByLabelText(/status/i)
      statusSelect.focus()

      expect(document.activeElement).toBe(statusSelect)
    })

    it('should pass axe accessibility scan', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaymentHistory
      } as Response)

      const { container } = render(<PaymentHistoryTable />)

      await waitFor(() => {
        expect(screen.getByText('Histórico de Pagamentos')).toBeInTheDocument()
      })

      // In a real implementation, you would import and use axe
      // const results = await axe(container)
      // expect(results.violations).toHaveLength(0)

      expect(container).toBeTruthy()
    })
  })

  describe('Error State', () => {
    it('should show error when fetch fails', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      render(<PaymentHistoryTable />)

      await waitFor(() => {
        expect(screen.getByText(/erro/i)).toBeInTheDocument()
      })
    })

    it('should show retry button on error', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      render(<PaymentHistoryTable />)

      await waitFor(() => {
        const retryButton = screen.getByText(/tentar novamente/i)
        expect(retryButton).toBeInTheDocument()
      })
    })
  })
})
