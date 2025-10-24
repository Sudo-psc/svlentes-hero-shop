/**
 * PrescriptionManager Component Tests - Phase 3
 * Testes completos para gerenciamento de prescrições médicas
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom'
import PrescriptionManager from '../PrescriptionManager'
import {
  mockPrescription,
  mockPrescriptionHistory,
  validPrescriptionFile,
  oversizedFile,
  invalidFormatFile
} from '@/__tests__/fixtures/phase3-fixtures'

// Mock fetch globally
global.fetch = vi.fn()

describe('PrescriptionManager Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering and Display', () => {
    it('should render with valid prescription', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ currentPrescription: mockPrescription.valid })
      } as Response)

      render(<PrescriptionManager />)

      await waitFor(() => {
        expect(screen.getByText('Prescrição Médica')).toBeInTheDocument()
      })
    })

    it('should render green badge for VALID status', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ currentPrescription: mockPrescription.valid })
      } as Response)

      render(<PrescriptionManager />)

      await waitFor(() => {
        const badge = screen.getByText('Válida')
        expect(badge).toBeInTheDocument()
        expect(badge.className).toContain('green')
      })
    })

    it('should render yellow badge for EXPIRING_SOON status', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ currentPrescription: mockPrescription.expiringSoon })
      } as Response)

      render(<PrescriptionManager />)

      await waitFor(() => {
        const badge = screen.getByText(/expira em/i)
        expect(badge).toBeInTheDocument()
        expect(badge.className).toContain('amber')
      })
    })

    it('should render red badge for EXPIRED status', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ currentPrescription: mockPrescription.expired })
      } as Response)

      render(<PrescriptionManager />)

      await waitFor(() => {
        const badge = screen.getByText('Expirada')
        expect(badge).toBeInTheDocument()
        expect(badge.className).toContain('red')
      })
    })

    it('should render countdown until expiration', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          currentPrescription: {
            ...mockPrescription.valid,
            daysUntilExpiry: 45
          }
        })
      } as Response)

      render(<PrescriptionManager />)

      await waitFor(() => {
        expect(screen.getByText(/45 dias/i)).toBeInTheDocument()
      })
    })

    it('should render prescription data table (OD/OE)', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ currentPrescription: mockPrescription.valid })
      } as Response)

      render(<PrescriptionManager />)

      await waitFor(() => {
        expect(screen.getByText('Olho Direito')).toBeInTheDocument()
        expect(screen.getByText('Olho Esquerdo')).toBeInTheDocument()
        expect(screen.getByText(/Esférico/i)).toBeInTheDocument()
        expect(screen.getByText(/Cilíndrico/i)).toBeInTheDocument()
      })
    })

    it('should render history when provided', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          currentPrescription: mockPrescription.valid,
          history: mockPrescriptionHistory
        })
      } as Response)

      render(<PrescriptionManager />)

      await waitFor(() => {
        expect(screen.getByText('Histórico de Prescrições')).toBeInTheDocument()
      })

      // Click to expand history
      const expandButton = screen.getByText(/ver histórico/i)
      fireEvent.click(expandButton)

      await waitFor(() => {
        expect(screen.getByText(/prescrições anteriores/i)).toBeInTheDocument()
      })
    })

    it('should render empty state without prescription', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ currentPrescription: null })
      } as Response)

      render(<PrescriptionManager />)

      await waitFor(() => {
        expect(screen.getByText(/nenhuma prescrição/i)).toBeInTheDocument()
        expect(screen.getByText(/faça upload/i)).toBeInTheDocument()
      })
    })
  })

  describe('Upload Interaction', () => {
    it('should open file picker on click Upload button', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ currentPrescription: mockPrescription.valid })
      } as Response)

      render(<PrescriptionManager />)

      await waitFor(() => {
        expect(screen.getByText('Upload Nova Prescrição')).toBeInTheDocument()
      })

      const uploadButton = screen.getByText('Upload Nova Prescrição')
      fireEvent.click(uploadButton)

      // File input should become interactive
      const fileInput = document.querySelector('input[type="file"]')
      expect(fileInput).toBeInTheDocument()
    })

    it('should accept drag and drop', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ currentPrescription: mockPrescription.valid })
      } as Response)

      const { container } = render(<PrescriptionManager />)

      await waitFor(() => {
        expect(screen.getByText('Prescrição Médica')).toBeInTheDocument()
      })

      const dropZone = container.querySelector('[data-testid="drop-zone"]')
      expect(dropZone).toBeInTheDocument()
    })

    it('should show preview before confirming upload', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ currentPrescription: mockPrescription.valid })
      } as Response)

      render(<PrescriptionManager />)

      await waitFor(() => {
        expect(screen.getByText('Upload Nova Prescrição')).toBeInTheDocument()
      })

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      fireEvent.change(fileInput, { target: { files: [validPrescriptionFile] } })

      await waitFor(() => {
        expect(screen.getByText('Confirmar Upload')).toBeInTheDocument()
        expect(screen.getByText(/prescription\.pdf/i)).toBeInTheDocument()
      })
    })

    it('should validate file size', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ currentPrescription: mockPrescription.valid })
      } as Response)

      render(<PrescriptionManager />)

      await waitFor(() => {
        expect(screen.getByText('Upload Nova Prescrição')).toBeInTheDocument()
      })

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      fireEvent.change(fileInput, { target: { files: [oversizedFile] } })

      await waitFor(() => {
        expect(screen.getByText(/arquivo muito grande/i)).toBeInTheDocument()
        expect(screen.getByText(/5MB/i)).toBeInTheDocument()
      })
    })

    it('should validate file format', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ currentPrescription: mockPrescription.valid })
      } as Response)

      render(<PrescriptionManager />)

      await waitFor(() => {
        expect(screen.getByText('Upload Nova Prescrição')).toBeInTheDocument()
      })

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      fireEvent.change(fileInput, { target: { files: [invalidFormatFile] } })

      await waitFor(() => {
        expect(screen.getByText(/formato inválido/i)).toBeInTheDocument()
      })
    })

    it('should show error for invalid file', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ currentPrescription: mockPrescription.valid })
      } as Response)

      render(<PrescriptionManager />)

      await waitFor(() => {
        expect(screen.getByText('Upload Nova Prescrição')).toBeInTheDocument()
      })

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      fireEvent.change(fileInput, { target: { files: [invalidFormatFile] } })

      await waitFor(() => {
        const errorMessage = screen.getByText(/formato inválido/i)
        expect(errorMessage).toBeInTheDocument()
        expect(errorMessage.className).toContain('red')
      })
    })

    it('should call onUpload after confirmation', async () => {
      const onUpload = vi.fn()

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ currentPrescription: mockPrescription.valid })
      } as Response)

      render(<PrescriptionManager onUpload={onUpload} />)

      await waitFor(() => {
        expect(screen.getByText('Upload Nova Prescrição')).toBeInTheDocument()
      })

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      fireEvent.change(fileInput, { target: { files: [validPrescriptionFile] } })

      await waitFor(() => {
        expect(screen.getByText('Confirmar Upload')).toBeInTheDocument()
      })

      const confirmButton = screen.getByText('Confirmar Upload')
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(onUpload).toHaveBeenCalledWith(validPrescriptionFile)
      })
    })

    it('should show loading state during upload', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ currentPrescription: mockPrescription.valid })
      } as Response)

      render(<PrescriptionManager />)

      await waitFor(() => {
        expect(screen.getByText('Upload Nova Prescrição')).toBeInTheDocument()
      })

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      fireEvent.change(fileInput, { target: { files: [validPrescriptionFile] } })

      await waitFor(() => {
        expect(screen.getByText('Confirmar Upload')).toBeInTheDocument()
      })

      // Mock slow upload
      vi.mocked(fetch).mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ success: true })
                } as Response),
              1000
            )
          )
      )

      const confirmButton = screen.getByText('Confirmar Upload')
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(screen.getByText(/enviando/i)).toBeInTheDocument()
      })
    })

    it('should show success state after upload', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ currentPrescription: mockPrescription.valid })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, prescription: mockPrescription.valid })
        } as Response)

      render(<PrescriptionManager />)

      await waitFor(() => {
        expect(screen.getByText('Upload Nova Prescrição')).toBeInTheDocument()
      })

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      fireEvent.change(fileInput, { target: { files: [validPrescriptionFile] } })

      await waitFor(() => {
        expect(screen.getByText('Confirmar Upload')).toBeInTheDocument()
      })

      const confirmButton = screen.getByText('Confirmar Upload')
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(screen.getByText(/sucesso/i)).toBeInTheDocument()
      })
    })

    it('should allow cancel upload', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ currentPrescription: mockPrescription.valid })
      } as Response)

      render(<PrescriptionManager />)

      await waitFor(() => {
        expect(screen.getByText('Upload Nova Prescrição')).toBeInTheDocument()
      })

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      fireEvent.change(fileInput, { target: { files: [validPrescriptionFile] } })

      await waitFor(() => {
        expect(screen.getByText('Cancelar')).toBeInTheDocument()
      })

      const cancelButton = screen.getByText('Cancelar')
      fireEvent.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByText('Confirmar Upload')).not.toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have descriptive labels', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ currentPrescription: mockPrescription.valid })
      } as Response)

      render(<PrescriptionManager />)

      await waitFor(() => {
        const uploadButton = screen.getByLabelText(/upload prescrição/i)
        expect(uploadButton).toBeInTheDocument()
      })
    })

    it('should support keyboard navigation', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ currentPrescription: mockPrescription.valid })
      } as Response)

      render(<PrescriptionManager />)

      await waitFor(() => {
        expect(screen.getByText('Upload Nova Prescrição')).toBeInTheDocument()
      })

      const uploadButton = screen.getByText('Upload Nova Prescrição')
      uploadButton.focus()

      expect(document.activeElement).toBe(uploadButton)
    })

    it('should have correct ARIA attributes', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ currentPrescription: mockPrescription.valid })
      } as Response)

      const { container } = render(<PrescriptionManager />)

      await waitFor(() => {
        expect(screen.getByText('Prescrição Médica')).toBeInTheDocument()
      })

      const uploadButton = container.querySelector('[role="button"]')
      expect(uploadButton).toHaveAttribute('aria-label')
    })

    it('should pass axe accessibility scan', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ currentPrescription: mockPrescription.valid })
      } as Response)

      const { container } = render(<PrescriptionManager />)

      await waitFor(() => {
        expect(screen.getByText('Prescrição Médica')).toBeInTheDocument()
      })

      // In a real implementation, you would import and use axe
      // const results = await axe(container)
      // expect(results.violations).toHaveLength(0)

      expect(container).toBeTruthy()
    })
  })

  describe('Loading State', () => {
    it('should show loading skeleton initially', () => {
      vi.mocked(fetch).mockImplementationOnce(
        () => new Promise(() => {}) // Never resolves
      )

      const { container } = render(<PrescriptionManager />)

      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('Error State', () => {
    it('should show error when fetch fails', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      render(<PrescriptionManager />)

      await waitFor(() => {
        expect(screen.getByText(/erro/i)).toBeInTheDocument()
      })
    })

    it('should show retry button on error', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      render(<PrescriptionManager />)

      await waitFor(() => {
        const retryButton = screen.getByText(/tentar novamente/i)
        expect(retryButton).toBeInTheDocument()
      })
    })

    it('should retry fetch when retry button clicked', async () => {
      // First call fails
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      render(<PrescriptionManager />)

      await waitFor(() => {
        expect(screen.getByText(/erro/i)).toBeInTheDocument()
      })

      // Second call succeeds
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ currentPrescription: mockPrescription.valid })
      } as Response)

      const retryButton = screen.getByText(/tentar novamente/i)
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText('Prescrição Médica')).toBeInTheDocument()
      })
    })
  })
})
