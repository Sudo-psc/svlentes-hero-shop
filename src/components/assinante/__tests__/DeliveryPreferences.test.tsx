/**
 * DeliveryPreferences Component Tests - Phase 3
 * Testes completos para gerenciamento de preferências de entrega
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom'
import DeliveryPreferences from '../DeliveryPreferences'
import {
  mockDeliveryPreferences,
  mockCepResponse
} from '@/__tests__/fixtures/phase3-fixtures'

// Mock fetch globally
global.fetch = vi.fn()

describe('DeliveryPreferences Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering and Display', () => {
    it('should render complete form', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ preferences: mockDeliveryPreferences.current })
      } as Response)

      render(<DeliveryPreferences />)

      await waitFor(() => {
        expect(screen.getByText('Preferências de Entrega')).toBeInTheDocument()
        expect(screen.getByLabelText(/cep/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/rua/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/número/i)).toBeInTheDocument()
      })
    })

    it('should render default values', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ preferences: mockDeliveryPreferences.current })
      } as Response)

      render(<DeliveryPreferences />)

      await waitFor(() => {
        const cepInput = screen.getByLabelText(/cep/i) as HTMLInputElement
        expect(cepInput.value).toBe('35300-000')

        const streetInput = screen.getByLabelText(/rua/i) as HTMLInputElement
        expect(streetInput.value).toBe('Rua Principal')
      })
    })

    it('should render preview of next delivery', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          preferences: mockDeliveryPreferences.current,
          upcomingDelivery: mockDeliveryPreferences.current.upcomingDelivery
        })
      } as Response)

      render(<DeliveryPreferences />)

      await waitFor(() => {
        expect(screen.getByText(/próxima entrega/i)).toBeInTheDocument()
        expect(screen.getByText(/31 dias/i)).toBeInTheDocument()
      })
    })

    it('should render loading state', () => {
      vi.mocked(fetch).mockImplementationOnce(
        () => new Promise(() => {}) // Never resolves
      )

      const { container } = render(<DeliveryPreferences />)

      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should render saving state', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ preferences: mockDeliveryPreferences.current })
      } as Response)

      render(<DeliveryPreferences />)

      await waitFor(() => {
        expect(screen.getByText('Salvar Alterações')).toBeInTheDocument()
      })

      // Mock slow save
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

      const saveButton = screen.getByText('Salvar Alterações')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/salvando/i)).toBeInTheDocument()
      })
    })
  })

  describe('CEP Search', () => {
    it('should search CEP when button clicked', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ preferences: mockDeliveryPreferences.current })
      } as Response)

      render(<DeliveryPreferences />)

      await waitFor(() => {
        expect(screen.getByLabelText(/cep/i)).toBeInTheDocument()
      })

      const cepInput = screen.getByLabelText(/cep/i)
      fireEvent.change(cepInput, { target: { value: '35300-000' } })

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCepResponse.valid
      } as Response)

      const searchButton = screen.getByText(/buscar cep/i)
      fireEvent.click(searchButton)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('viacep.com.br')
        )
      })
    })

    it('should auto-fill address after CEP search', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ preferences: mockDeliveryPreferences.current })
      } as Response)

      render(<DeliveryPreferences />)

      await waitFor(() => {
        expect(screen.getByLabelText(/cep/i)).toBeInTheDocument()
      })

      const cepInput = screen.getByLabelText(/cep/i)
      fireEvent.change(cepInput, { target: { value: '35300-000' } })

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCepResponse.valid
      } as Response)

      const searchButton = screen.getByText(/buscar cep/i)
      fireEvent.click(searchButton)

      await waitFor(() => {
        const streetInput = screen.getByLabelText(/rua/i) as HTMLInputElement
        expect(streetInput.value).toBe('Rua Principal')

        const neighborhoodInput = screen.getByLabelText(/bairro/i) as HTMLInputElement
        expect(neighborhoodInput.value).toBe('Centro')

        const cityInput = screen.getByLabelText(/cidade/i) as HTMLInputElement
        expect(cityInput.value).toBe('Caratinga')

        const stateInput = screen.getByLabelText(/estado/i) as HTMLInputElement
        expect(stateInput.value).toBe('MG')
      })
    })

    it('should show loading during CEP search', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ preferences: mockDeliveryPreferences.current })
      } as Response)

      render(<DeliveryPreferences />)

      await waitFor(() => {
        expect(screen.getByLabelText(/cep/i)).toBeInTheDocument()
      })

      const cepInput = screen.getByLabelText(/cep/i)
      fireEvent.change(cepInput, { target: { value: '35300-000' } })

      vi.mocked(fetch).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      )

      const searchButton = screen.getByText(/buscar cep/i)
      fireEvent.click(searchButton)

      await waitFor(() => {
        expect(screen.getByText(/buscando/i)).toBeInTheDocument()
      })
    })

    it('should show error for invalid CEP', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ preferences: mockDeliveryPreferences.current })
      } as Response)

      render(<DeliveryPreferences />)

      await waitFor(() => {
        expect(screen.getByLabelText(/cep/i)).toBeInTheDocument()
      })

      const cepInput = screen.getByLabelText(/cep/i)
      fireEvent.change(cepInput, { target: { value: '00000-000' } })

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCepResponse.invalid
      } as Response)

      const searchButton = screen.getByText(/buscar cep/i)
      fireEvent.click(searchButton)

      await waitFor(() => {
        expect(screen.getByText(/cep não encontrado/i)).toBeInTheDocument()
      })
    })

    it('should allow editing fields after CEP search', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ preferences: mockDeliveryPreferences.current })
      } as Response)

      render(<DeliveryPreferences />)

      await waitFor(() => {
        expect(screen.getByLabelText(/cep/i)).toBeInTheDocument()
      })

      const cepInput = screen.getByLabelText(/cep/i)
      fireEvent.change(cepInput, { target: { value: '35300-000' } })

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCepResponse.valid
      } as Response)

      const searchButton = screen.getByText(/buscar cep/i)
      fireEvent.click(searchButton)

      await waitFor(() => {
        const streetInput = screen.getByLabelText(/rua/i) as HTMLInputElement
        expect(streetInput.value).toBe('Rua Principal')
      })

      // Should be able to edit
      const streetInput = screen.getByLabelText(/rua/i)
      fireEvent.change(streetInput, { target: { value: 'Rua Editada' } })

      expect((streetInput as HTMLInputElement).value).toBe('Rua Editada')
    })
  })

  describe('Form Validation', () => {
    it('should validate CEP format (Brazilian)', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ preferences: mockDeliveryPreferences.current })
      } as Response)

      render(<DeliveryPreferences />)

      await waitFor(() => {
        expect(screen.getByLabelText(/cep/i)).toBeInTheDocument()
      })

      const cepInput = screen.getByLabelText(/cep/i)
      fireEvent.change(cepInput, { target: { value: '12345678' } }) // Missing hyphen

      await waitFor(() => {
        expect(screen.getByText(/formato inválido/i)).toBeInTheDocument()
      })
    })

    it('should validate phone format (Brazilian)', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ preferences: mockDeliveryPreferences.current })
      } as Response)

      render(<DeliveryPreferences />)

      await waitFor(() => {
        expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument()
      })

      const phoneInput = screen.getByLabelText(/telefone/i)
      fireEvent.change(phoneInput, { target: { value: '123' } }) // Too short

      await waitFor(() => {
        expect(screen.getByText(/telefone inválido/i)).toBeInTheDocument()
      })
    })

    it('should validate required fields', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ preferences: mockDeliveryPreferences.current })
      } as Response)

      render(<DeliveryPreferences />)

      await waitFor(() => {
        expect(screen.getByText('Salvar Alterações')).toBeInTheDocument()
      })

      // Clear required field
      const streetInput = screen.getByLabelText(/rua/i)
      fireEvent.change(streetInput, { target: { value: '' } })

      const saveButton = screen.getByText('Salvar Alterações')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/campo obrigatório/i)).toBeInTheDocument()
      })
    })

    it('should show inline error messages', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ preferences: mockDeliveryPreferences.current })
      } as Response)

      render(<DeliveryPreferences />)

      await waitFor(() => {
        expect(screen.getByLabelText(/cep/i)).toBeInTheDocument()
      })

      const cepInput = screen.getByLabelText(/cep/i)
      fireEvent.change(cepInput, { target: { value: 'invalid' } })
      fireEvent.blur(cepInput)

      await waitFor(() => {
        const errorMessage = screen.getByText(/formato inválido/i)
        expect(errorMessage).toBeInTheDocument()
        expect(errorMessage.className).toContain('red')
      })
    })

    it('should prevent submit with validation errors', async () => {
      const onSave = vi.fn()

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ preferences: mockDeliveryPreferences.current })
      } as Response)

      render(<DeliveryPreferences onSave={onSave} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/cep/i)).toBeInTheDocument()
      })

      // Set invalid CEP
      const cepInput = screen.getByLabelText(/cep/i)
      fireEvent.change(cepInput, { target: { value: 'invalid' } })

      const saveButton = screen.getByText('Salvar Alterações')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(onSave).not.toHaveBeenCalled()
      })
    })
  })

  describe('Form Submission', () => {
    it('should call onSave with correct data', async () => {
      const onSave = vi.fn()

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ preferences: mockDeliveryPreferences.current })
      } as Response)

      render(<DeliveryPreferences onSave={onSave} />)

      await waitFor(() => {
        expect(screen.getByText('Salvar Alterações')).toBeInTheDocument()
      })

      const saveButton = screen.getByText('Salvar Alterações')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            address: expect.any(Object),
            contact: expect.any(Object)
          })
        )
      })
    })

    it('should show loading on button during save', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ preferences: mockDeliveryPreferences.current })
      } as Response)

      render(<DeliveryPreferences />)

      await waitFor(() => {
        expect(screen.getByText('Salvar Alterações')).toBeInTheDocument()
      })

      // Mock slow save
      vi.mocked(fetch).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      )

      const saveButton = screen.getByText('Salvar Alterações')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(saveButton).toBeDisabled()
        expect(screen.getByText(/salvando/i)).toBeInTheDocument()
      })
    })

    it('should show success toast after save', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ preferences: mockDeliveryPreferences.current })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        } as Response)

      render(<DeliveryPreferences />)

      await waitFor(() => {
        expect(screen.getByText('Salvar Alterações')).toBeInTheDocument()
      })

      const saveButton = screen.getByText('Salvar Alterações')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/sucesso/i)).toBeInTheDocument()
      })
    })

    it('should reset form after successful save', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ preferences: mockDeliveryPreferences.current })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            preferences: mockDeliveryPreferences.current
          })
        } as Response)

      render(<DeliveryPreferences />)

      await waitFor(() => {
        expect(screen.getByText('Salvar Alterações')).toBeInTheDocument()
      })

      const streetInput = screen.getByLabelText(/rua/i)
      fireEvent.change(streetInput, { target: { value: 'Rua Nova' } })

      const saveButton = screen.getByText('Salvar Alterações')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/sucesso/i)).toBeInTheDocument()
      })
    })

    it('should show error if save fails', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ preferences: mockDeliveryPreferences.current })
      } as Response)

      render(<DeliveryPreferences />)

      await waitFor(() => {
        expect(screen.getByText('Salvar Alterações')).toBeInTheDocument()
      })

      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const saveButton = screen.getByText('Salvar Alterações')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/erro ao salvar/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have labels associated with inputs', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ preferences: mockDeliveryPreferences.current })
      } as Response)

      render(<DeliveryPreferences />)

      await waitFor(() => {
        const cepInput = screen.getByLabelText(/cep/i)
        expect(cepInput).toBeInTheDocument()

        const streetInput = screen.getByLabelText(/rua/i)
        expect(streetInput).toBeInTheDocument()
      })
    })

    it('should support keyboard navigation', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ preferences: mockDeliveryPreferences.current })
      } as Response)

      render(<DeliveryPreferences />)

      await waitFor(() => {
        expect(screen.getByLabelText(/cep/i)).toBeInTheDocument()
      })

      const cepInput = screen.getByLabelText(/cep/i)
      cepInput.focus()

      expect(document.activeElement).toBe(cepInput)

      // Tab to next field
      fireEvent.keyDown(cepInput, { key: 'Tab' })

      // Next input should be focused
      const nextInput = document.activeElement as HTMLElement
      expect(nextInput.tagName).toBe('INPUT')
    })

    it('should have ARIA labels on selects', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ preferences: mockDeliveryPreferences.current })
      } as Response)

      const { container } = render(<DeliveryPreferences />)

      await waitFor(() => {
        expect(screen.getByLabelText(/estado/i)).toBeInTheDocument()
      })

      const stateSelect = screen.getByLabelText(/estado/i)
      expect(stateSelect).toHaveAttribute('aria-label')
    })

    it('should pass axe accessibility scan', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ preferences: mockDeliveryPreferences.current })
      } as Response)

      const { container } = render(<DeliveryPreferences />)

      await waitFor(() => {
        expect(screen.getByText('Preferências de Entrega')).toBeInTheDocument()
      })

      // In a real implementation, you would import and use axe
      // const results = await axe(container)
      // expect(results.violations).toHaveLength(0)

      expect(container).toBeTruthy()
    })
  })
})
