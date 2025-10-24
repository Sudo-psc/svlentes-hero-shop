import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import FloatingWhatsAppButton from '../FloatingWhatsAppButton'

// Mock window.open
const mockWindowOpen = vi.fn()
global.window.open = mockWindowOpen

describe('FloatingWhatsAppButton Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset scroll position
    window.scrollY = 0
  })

  describe('Rendering', () => {
    it('should render floating WhatsApp button', () => {
      render(<FloatingWhatsAppButton />)

      const button = screen.getByRole('button', { name: /whatsapp/i })
      expect(button).toBeInTheDocument()
    })

    it('should have fixed positioning', () => {
      const { container } = render(<FloatingWhatsAppButton />)

      const button = container.querySelector('button')
      expect(button?.className).toContain('fixed')
    })

    it('should be positioned in bottom-right corner', () => {
      const { container } = render(<FloatingWhatsAppButton />)

      const button = container.querySelector('button')
      expect(button?.className).toMatch(/bottom-|right-/)
    })
  })

  describe('Badge with Message Counter', () => {
    it('should show badge when unread messages exist', () => {
      render(<FloatingWhatsAppButton unreadCount={3} />)

      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should not show badge when no unread messages', () => {
      render(<FloatingWhatsAppButton unreadCount={0} />)

      expect(screen.queryByText('0')).not.toBeInTheDocument()
    })

    it('should show 9+ for counts greater than 9', () => {
      render(<FloatingWhatsAppButton unreadCount={15} />)

      expect(screen.getByText('9+')).toBeInTheDocument()
    })

    it('should apply correct badge styling', () => {
      const { container } = render(<FloatingWhatsAppButton unreadCount={5} />)

      const badge = screen.getByText('5')
      expect(badge.className).toContain('bg-red')
    })
  })

  describe('Click Interaction', () => {
    it('should redirect to WhatsApp on click', () => {
      render(<FloatingWhatsAppButton />)

      const button = screen.getByRole('button', { name: /whatsapp/i })
      fireEvent.click(button)

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('wa.me'),
        '_blank'
      )
    })

    it('should include phone number in WhatsApp URL', () => {
      render(<FloatingWhatsAppButton phoneNumber="+5533999898026" />)

      const button = screen.getByRole('button', { name: /whatsapp/i })
      fireEvent.click(button)

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('5533999898026'),
        '_blank'
      )
    })

    it('should include context message when provided', () => {
      const contextMessage = 'Olá! Tenho dúvidas sobre minha assinatura.'

      render(<FloatingWhatsAppButton message={contextMessage} />)

      const button = screen.getByRole('button', { name: /whatsapp/i })
      fireEvent.click(button)

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(contextMessage)),
        '_blank'
      )
    })

    it('should use default message when no context provided', () => {
      render(<FloatingWhatsAppButton />)

      const button = screen.getByRole('button', { name: /whatsapp/i })
      fireEvent.click(button)

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('Ol%C3%A1'), // Encoded "Olá"
        '_blank'
      )
    })
  })

  describe('Tooltip', () => {
    it('should show tooltip on hover', async () => {
      render(<FloatingWhatsAppButton />)

      const button = screen.getByRole('button', { name: /whatsapp/i })

      fireEvent.mouseEnter(button)

      await waitFor(() => {
        expect(screen.getByText(/falar no whatsapp/i)).toBeInTheDocument()
      })
    })

    it('should hide tooltip when not hovering', async () => {
      render(<FloatingWhatsAppButton />)

      const button = screen.getByRole('button', { name: /whatsapp/i })

      fireEvent.mouseEnter(button)

      await waitFor(() => {
        expect(screen.getByText(/falar no whatsapp/i)).toBeInTheDocument()
      })

      fireEvent.mouseLeave(button)

      await waitFor(() => {
        expect(screen.queryByText(/falar no whatsapp/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Scroll Behavior', () => {
    it('should hide button on scroll down', () => {
      const { container } = render(<FloatingWhatsAppButton />)

      const button = container.querySelector('button')
      expect(button).toBeVisible()

      // Simulate scroll down
      window.scrollY = 200
      fireEvent.scroll(window)

      waitFor(() => {
        expect(button?.className).toContain('translate-y-')
      })
    })

    it('should show button on scroll up', () => {
      const { container } = render(<FloatingWhatsAppButton />)

      // Start with scrolled position
      window.scrollY = 200
      fireEvent.scroll(window)

      // Scroll back up
      window.scrollY = 100
      fireEvent.scroll(window)

      const button = container.querySelector('button')

      waitFor(() => {
        expect(button?.className).not.toContain('translate-y-')
      })
    })

    it('should always show button at top of page', () => {
      const { container } = render(<FloatingWhatsAppButton />)

      window.scrollY = 0
      fireEvent.scroll(window)

      const button = container.querySelector('button')
      expect(button).toBeVisible()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible button role', () => {
      render(<FloatingWhatsAppButton />)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should have aria-label', () => {
      render(<FloatingWhatsAppButton />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Falar no WhatsApp')
    })

    it('should be keyboard accessible', () => {
      render(<FloatingWhatsAppButton />)

      const button = screen.getByRole('button')

      // Tab to button
      button.focus()
      expect(document.activeElement).toBe(button)

      // Press Enter
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' })

      expect(mockWindowOpen).toHaveBeenCalled()
    })

    it('should show unread count in aria-label when badge visible', () => {
      render(<FloatingWhatsAppButton unreadCount={3} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Falar no WhatsApp - 3 mensagens não lidas')
    })
  })

  describe('Animation', () => {
    it('should have pulse animation', () => {
      const { container } = render(<FloatingWhatsAppButton />)

      const button = container.querySelector('button')
      expect(button?.className).toContain('animate-')
    })

    it('should have hover effect', () => {
      const { container } = render(<FloatingWhatsAppButton />)

      const button = container.querySelector('button')
      expect(button?.className).toMatch(/hover:/)
    })

    it('should have transition for smooth animations', () => {
      const { container } = render(<FloatingWhatsAppButton />)

      const button = container.querySelector('button')
      expect(button?.className).toContain('transition')
    })
  })

  describe('WhatsApp Branding', () => {
    it('should use WhatsApp green color', () => {
      const { container } = render(<FloatingWhatsAppButton />)

      const button = container.querySelector('button')
      expect(button?.className).toMatch(/bg-.*green|whatsapp/)
    })

    it('should render WhatsApp icon', () => {
      const { container } = render(<FloatingWhatsAppButton />)

      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should render on mobile viewports', () => {
      // Set mobile viewport
      window.innerWidth = 375

      render(<FloatingWhatsAppButton />)

      const button = screen.getByRole('button', { name: /whatsapp/i })
      expect(button).toBeInTheDocument()
    })

    it('should render on desktop viewports', () => {
      // Set desktop viewport
      window.innerWidth = 1920

      render(<FloatingWhatsAppButton />)

      const button = screen.getByRole('button', { name: /whatsapp/i })
      expect(button).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined unreadCount', () => {
      render(<FloatingWhatsAppButton />)

      expect(screen.queryByText(/\d+/)).not.toBeInTheDocument()
    })

    it('should handle empty message gracefully', () => {
      render(<FloatingWhatsAppButton message="" />)

      const button = screen.getByRole('button', { name: /whatsapp/i })
      fireEvent.click(button)

      // Should still open WhatsApp
      expect(mockWindowOpen).toHaveBeenCalled()
    })

    it('should handle rapid clicks', () => {
      render(<FloatingWhatsAppButton />)

      const button = screen.getByRole('button', { name: /whatsapp/i })

      // Click multiple times rapidly
      fireEvent.click(button)
      fireEvent.click(button)
      fireEvent.click(button)

      // Should open WhatsApp 3 times (or handle debouncing if implemented)
      expect(mockWindowOpen).toHaveBeenCalled()
    })
  })
})
