/**
 * EmptyState Component Tests
 *
 * Tests empty state displays with illustrations, actions, and accessibility.
 */

import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  EmptyState,
  EmptySubscription,
  EmptyOrders,
  EmptySearchResults,
  ErrorState
} from '../EmptyState'

describe('EmptyState', () => {
  describe('Basic EmptyState', () => {
    it('should render with title and description', () => {
      render(
        <EmptyState
          title="Nenhum item encontrado"
          description="Você ainda não possui itens cadastrados."
        />
      )

      expect(screen.getByText('Nenhum item encontrado')).toBeInTheDocument()
      expect(screen.getByText('Você ainda não possui itens cadastrados.')).toBeInTheDocument()
    })

    it('should render with custom illustration', () => {
      render(
        <EmptyState
          illustration="orders"
          title="Sem pedidos"
          description="Nenhum pedido encontrado"
        />
      )

      const container = screen.getByRole('status', { name: 'Conteúdo vazio' })
      expect(container).toBeInTheDocument()
    })

    it('should render with custom icon', () => {
      const CustomIcon = () => <div data-testid="custom-icon">Icon</div>
      render(
        <EmptyState
          icon={<CustomIcon />}
          title="Custom Icon"
          description="Testing custom icon"
        />
      )

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
    })

    it('should render with primary action', () => {
      const handleClick = jest.fn()
      render(
        <EmptyState
          title="Empty"
          description="Description"
          action={{
            label: 'Adicionar Item',
            onClick: handleClick,
            variant: 'primary'
          }}
        />
      )

      const button = screen.getByRole('button', { name: 'Adicionar Item' })
      expect(button).toBeInTheDocument()

      fireEvent.click(button)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should render with secondary action', () => {
      const handlePrimary = jest.fn()
      const handleSecondary = jest.fn()

      render(
        <EmptyState
          title="Empty"
          description="Description"
          action={{
            label: 'Primary',
            onClick: handlePrimary
          }}
          secondaryAction={{
            label: 'Secondary',
            onClick: handleSecondary
          }}
        />
      )

      const primaryButton = screen.getByRole('button', { name: 'Primary' })
      const secondaryButton = screen.getByRole('button', { name: 'Secondary' })

      expect(primaryButton).toBeInTheDocument()
      expect(secondaryButton).toBeInTheDocument()

      fireEvent.click(secondaryButton)
      expect(handleSecondary).toHaveBeenCalledTimes(1)
    })

    it('should apply custom className', () => {
      const { container } = render(
        <EmptyState
          title="Empty"
          description="Description"
          className="custom-empty-state"
        />
      )

      expect(container.firstChild).toHaveClass('custom-empty-state')
    })

    it('should render with different sizes', () => {
      const { rerender, container } = render(
        <EmptyState
          title="Empty"
          description="Description"
          size="sm"
        />
      )

      expect(container.firstChild).toHaveClass('py-8')

      rerender(
        <EmptyState
          title="Empty"
          description="Description"
          size="lg"
        />
      )

      expect(container.firstChild).toHaveClass('py-16')
    })
  })

  describe('EmptySubscription', () => {
    it('should render subscription empty state', () => {
      const handleSubscribe = jest.fn()

      render(<EmptySubscription onStartSubscription={handleSubscribe} />)

      expect(screen.getByText('Nenhuma assinatura ativa')).toBeInTheDocument()
      expect(screen.getByText(/Você ainda não possui uma assinatura/)).toBeInTheDocument()

      const button = screen.getByRole('button', { name: 'Assinar Agora' })
      fireEvent.click(button)

      expect(handleSubscribe).toHaveBeenCalledTimes(1)
    })

    it('should render with large size', () => {
      const { container } = render(
        <EmptySubscription onStartSubscription={() => {}} />
      )

      expect(container.firstChild).toHaveClass('py-16')
    })
  })

  describe('EmptyOrders', () => {
    it('should render orders empty state without action', () => {
      render(<EmptyOrders />)

      expect(screen.getByText('Nenhum pedido encontrado')).toBeInTheDocument()
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('should render orders empty state with action', () => {
      const handleViewPlans = jest.fn()
      render(<EmptyOrders onViewPlans={handleViewPlans} />)

      const button = screen.getByRole('button', { name: 'Ver Planos' })
      expect(button).toBeInTheDocument()

      fireEvent.click(button)
      expect(handleViewPlans).toHaveBeenCalledTimes(1)
    })
  })

  describe('EmptySearchResults', () => {
    it('should render search empty state with search term', () => {
      const handleClear = jest.fn()

      render(
        <EmptySearchResults
          searchTerm="lentes diárias"
          onClear={handleClear}
        />
      )

      expect(screen.getByText('Nenhum resultado encontrado')).toBeInTheDocument()
      expect(screen.getByText(/Não encontramos resultados para "lentes diárias"/)).toBeInTheDocument()

      const button = screen.getByRole('button', { name: 'Limpar Busca' })
      fireEvent.click(button)

      expect(handleClear).toHaveBeenCalledTimes(1)
    })

    it('should render search empty state without search term', () => {
      render(<EmptySearchResults onClear={() => {}} />)

      expect(screen.getByText(/Não encontramos nenhum resultado/)).toBeInTheDocument()
    })
  })

  describe('ErrorState', () => {
    it('should render error state with default messages', () => {
      const handleRetry = jest.fn()

      render(<ErrorState onRetry={handleRetry} />)

      expect(screen.getByText('Algo deu errado')).toBeInTheDocument()
      expect(screen.getByText(/Ocorreu um erro ao carregar/)).toBeInTheDocument()

      const button = screen.getByRole('button', { name: 'Tentar Novamente' })
      fireEvent.click(button)

      expect(handleRetry).toHaveBeenCalledTimes(1)
    })

    it('should render error state with custom messages', () => {
      render(
        <ErrorState
          title="Erro Customizado"
          description="Descrição customizada do erro"
          onRetry={() => {}}
        />
      )

      expect(screen.getByText('Erro Customizado')).toBeInTheDocument()
      expect(screen.getByText('Descrição customizada do erro')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA role', () => {
      render(
        <EmptyState
          title="Empty"
          description="Description"
        />
      )

      const container = screen.getByRole('status', { name: 'Conteúdo vazio' })
      expect(container).toBeInTheDocument()
    })

    it('should have proper heading structure', () => {
      render(
        <EmptyState
          title="Empty Title"
          description="Description"
        />
      )

      const heading = screen.getByRole('heading', { name: 'Empty Title' })
      expect(heading).toBeInTheDocument()
    })

    it('should have keyboard accessible buttons', () => {
      const handleClick = jest.fn()

      render(
        <EmptyState
          title="Empty"
          description="Description"
          action={{
            label: 'Click Me',
            onClick: handleClick
          }}
        />
      )

      const button = screen.getByRole('button', { name: 'Click Me' })

      // Verify button is keyboard accessible
      expect(button).toBeInTheDocument()
      expect(button.tagName).toBe('BUTTON')

      // Simulate keyboard interaction
      fireEvent.click(button)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Responsive Design', () => {
    it('should stack actions on mobile', () => {
      const { container } = render(
        <EmptyState
          title="Empty"
          description="Description"
          action={{ label: 'Primary', onClick: () => {} }}
          secondaryAction={{ label: 'Secondary', onClick: () => {} }}
        />
      )

      const actionsContainer = container.querySelector('.flex.flex-col.sm\\:flex-row')
      expect(actionsContainer).toBeInTheDocument()
    })

    it('should limit description width', () => {
      const { container } = render(
        <EmptyState
          title="Empty"
          description="Very long description that should be constrained to a maximum width"
        />
      )

      const description = container.querySelector('.max-w-md')
      expect(description).toBeInTheDocument()
    })
  })
})
