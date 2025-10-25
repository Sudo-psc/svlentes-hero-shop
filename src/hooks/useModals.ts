/**
 * Generic modal state management hook
 * Provides type-safe modal state management with open/close/toggle actions
 *
 * @author Dr. Philipe Saraiva Cruz
 * @date 2025-10-25
 */

import { useState, useCallback } from 'react'

type ModalState<T extends string> = Record<T, boolean>

interface UseModalsReturn<T extends string> {
  modals: ModalState<T>
  open: (name: T) => void
  close: (name: T) => void
  toggle: (name: T) => void
  isOpen: (name: T) => boolean
}

/**
 * Hook for managing multiple modal states with a clean API
 *
 * @example
 * ```tsx
 * const { modals, open, close, isOpen } = useModals([
 *   'orders',
 *   'invoices',
 *   'changePlan'
 * ])
 *
 * <Button onClick={() => open('orders')}>Ver Pedidos</Button>
 * <OrdersModal isOpen={isOpen('orders')} onClose={() => close('orders')} />
 * ```
 */
export function useModals<T extends string>(
  modalNames: readonly T[]
): UseModalsReturn<T> {
  // Initialize all modals as closed
  const initialState = modalNames.reduce((acc, name) => {
    acc[name] = false
    return acc
  }, {} as ModalState<T>)

  const [modals, setModals] = useState<ModalState<T>>(initialState)

  const open = useCallback((name: T) => {
    setModals(prev => ({ ...prev, [name]: true }))
  }, [])

  const close = useCallback((name: T) => {
    setModals(prev => ({ ...prev, [name]: false }))
  }, [])

  const toggle = useCallback((name: T) => {
    setModals(prev => ({ ...prev, [name]: !prev[name] }))
  }, [])

  const isOpen = useCallback(
    (name: T): boolean => {
      return modals[name] || false
    },
    [modals]
  )

  return {
    modals,
    open,
    close,
    toggle,
    isOpen
  }
}
