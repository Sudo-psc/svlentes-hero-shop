/**
 * Skeleton Component Tests
 *
 * Tests loading placeholder components with various configurations,
 * animations, and accessibility features.
 */

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  Skeleton,
  SkeletonGroup,
  SkeletonCard,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonSubscriptionCard,
  SkeletonOrderHistory
} from '../Skeleton'

describe('Skeleton', () => {
  describe('Basic Skeleton', () => {
    it('should render with default props', () => {
      render(<Skeleton />)
      const skeleton = screen.getByRole('status')
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveAttribute('aria-label', 'Carregando conteúdo')
    })

    it('should render with text variant', () => {
      render(<Skeleton variant="text" />)
      const skeleton = screen.getByRole('status')
      expect(skeleton).toHaveClass('h-4', 'rounded')
    })

    it('should render with circular variant', () => {
      render(<Skeleton variant="circular" />)
      const skeleton = screen.getByRole('status')
      expect(skeleton).toHaveClass('rounded-full')
    })

    it('should render with rectangular variant', () => {
      render(<Skeleton variant="rectangular" />)
      const skeleton = screen.getByRole('status')
      expect(skeleton).toHaveClass('rounded-none')
    })

    it('should render with rounded variant', () => {
      render(<Skeleton variant="rounded" />)
      const skeleton = screen.getByRole('status')
      expect(skeleton).toHaveClass('rounded-md')
    })

    it('should apply pulse animation by default', () => {
      render(<Skeleton animation="pulse" />)
      const skeleton = screen.getByRole('status')
      expect(skeleton).toHaveClass('animate-pulse')
    })

    it('should apply wave animation', () => {
      render(<Skeleton animation="wave" />)
      const skeleton = screen.getByRole('status')
      expect(skeleton).toHaveClass('animate-shimmer')
    })

    it('should apply no animation', () => {
      render(<Skeleton animation="none" />)
      const skeleton = screen.getByRole('status')
      expect(skeleton).not.toHaveClass('animate-pulse')
      expect(skeleton).not.toHaveClass('animate-shimmer')
    })

    it('should apply custom width and height', () => {
      render(<Skeleton width={200} height={50} />)
      const skeleton = screen.getByRole('status')
      expect(skeleton).toHaveStyle({ width: '200px', height: '50px' })
    })

    it('should apply custom width and height as strings', () => {
      render(<Skeleton width="50%" height="100px" />)
      const skeleton = screen.getByRole('status')
      expect(skeleton).toHaveStyle({ width: '50%', height: '100px' })
    })

    it('should apply custom className', () => {
      render(<Skeleton className="custom-class" />)
      const skeleton = screen.getByRole('status')
      expect(skeleton).toHaveClass('custom-class')
    })
  })

  describe('SkeletonGroup', () => {
    it('should render default 3 lines', () => {
      render(<SkeletonGroup />)
      const skeletons = screen.getAllByRole('status')
      // SkeletonGroup has 1 parent status + 3 child statuses
      expect(skeletons.length).toBeGreaterThanOrEqual(3)
    })

    it('should render custom number of lines', () => {
      render(<SkeletonGroup lines={5} />)
      const skeletons = screen.getAllByRole('status')
      expect(skeletons.length).toBeGreaterThanOrEqual(5)
    })

    it('should have last line with reduced width', () => {
      const { container } = render(<SkeletonGroup lines={3} />)
      const lines = container.querySelectorAll('[role="status"]')
      // Last skeleton inside the group should have 60% width
      expect(lines[lines.length - 1]).toHaveStyle({ width: '60%' })
    })

    it('should apply custom className', () => {
      const { container } = render(<SkeletonGroup className="custom-group" />)
      expect(container.firstChild).toHaveClass('custom-group')
    })
  })

  describe('SkeletonCard', () => {
    it('should render card skeleton with header and content', () => {
      render(<SkeletonCard />)
      const skeleton = screen.getByRole('status', { name: 'Carregando cartão' })
      expect(skeleton).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(<SkeletonCard className="custom-card" />)
      expect(container.firstChild).toHaveClass('custom-card')
    })
  })

  describe('SkeletonAvatar', () => {
    it('should render circular avatar skeleton', () => {
      render(<SkeletonAvatar />)
      const avatar = screen.getByRole('status', { name: 'Carregando avatar' })
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveClass('rounded-full')
    })

    it('should apply default size of 40px', () => {
      render(<SkeletonAvatar />)
      const avatar = screen.getByRole('status', { name: 'Carregando avatar' })
      expect(avatar).toHaveStyle({ width: '40px', height: '40px' })
    })

    it('should apply custom size', () => {
      render(<SkeletonAvatar size={64} />)
      const avatar = screen.getByRole('status', { name: 'Carregando avatar' })
      expect(avatar).toHaveStyle({ width: '64px', height: '64px' })
    })

    it('should apply custom className', () => {
      render(<SkeletonAvatar className="custom-avatar" />)
      const avatar = screen.getByRole('status', { name: 'Carregando avatar' })
      expect(avatar).toHaveClass('custom-avatar')
    })
  })

  describe('SkeletonButton', () => {
    it('should render button skeleton', () => {
      render(<SkeletonButton />)
      const button = screen.getByRole('status', { name: 'Carregando botão' })
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('rounded-md')
    })

    it('should apply default width of 120px', () => {
      render(<SkeletonButton />)
      const button = screen.getByRole('status', { name: 'Carregando botão' })
      expect(button).toHaveStyle({ width: '120px', height: '40px' })
    })

    it('should apply custom width as number', () => {
      render(<SkeletonButton width={200} />)
      const button = screen.getByRole('status', { name: 'Carregando botão' })
      expect(button).toHaveStyle({ width: '200px' })
    })

    it('should apply custom width as string', () => {
      render(<SkeletonButton width="100%" />)
      const button = screen.getByRole('status', { name: 'Carregando botão' })
      expect(button).toHaveStyle({ width: '100%' })
    })
  })

  describe('SkeletonSubscriptionCard', () => {
    it('should render subscription card skeleton', () => {
      render(<SkeletonSubscriptionCard />)
      const card = screen.getByRole('status', { name: 'Carregando assinatura' })
      expect(card).toBeInTheDocument()
    })

    it('should contain multiple skeleton elements', () => {
      const { container } = render(<SkeletonSubscriptionCard />)
      const skeletons = container.querySelectorAll('[role="status"]')
      // Should have parent + multiple child skeletons
      expect(skeletons.length).toBeGreaterThan(5)
    })
  })

  describe('SkeletonOrderHistory', () => {
    it('should render order history skeleton', () => {
      render(<SkeletonOrderHistory />)
      const history = screen.getByRole('status', { name: 'Carregando histórico de pedidos' })
      expect(history).toBeInTheDocument()
    })

    it('should render 3 order items by default', () => {
      const { container } = render(<SkeletonOrderHistory />)
      const orderItems = container.querySelectorAll('.border.border-gray-200')
      expect(orderItems).toHaveLength(3)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Skeleton />)
      const skeleton = screen.getByRole('status')
      expect(skeleton).toHaveAttribute('aria-label', 'Carregando conteúdo')
      expect(skeleton).toHaveAttribute('aria-live', 'polite')
    })

    it('should contain screen reader text', () => {
      render(<Skeleton />)
      const srText = screen.getByText('Carregando...')
      expect(srText).toHaveClass('sr-only')
    })

    it('should be keyboard accessible (not interactive)', () => {
      render(<Skeleton />)
      const skeleton = screen.getByRole('status')
      // Skeletons should not be focusable as they're not interactive
      expect(skeleton).not.toHaveAttribute('tabIndex')
    })
  })

  describe('Responsive Design', () => {
    it('should support responsive width', () => {
      render(<Skeleton width="100%" />)
      const skeleton = screen.getByRole('status')
      expect(skeleton).toHaveStyle({ width: '100%' })
    })

    it('should maintain aspect ratio for circular variant', () => {
      render(<Skeleton variant="circular" width={50} height={50} />)
      const skeleton = screen.getByRole('status')
      expect(skeleton).toHaveStyle({ width: '50px', height: '50px' })
      expect(skeleton).toHaveClass('rounded-full')
    })
  })
})
