/**
 * Modal Management Hook
 *
 * Custom hook to manage multiple modal states with a single hook
 * Reduces boilerplate and improves maintainability
 *
 * @author Dr. Philipe Saraiva Cruz
 */

import { useState, useCallback } from 'react'

export type ModalType =
  | 'orders'
  | 'invoices'
  | 'changePlan'
  | 'updateAddress'
  | 'updatePayment'

interface ModalState {
  orders: boolean
  invoices: boolean
  changePlan: boolean
  updateAddress: boolean
  updatePayment: boolean
}

interface UseModalsReturn {
  /**
   * Current state of all modals
   */
  modals: ModalState

  /**
   * Open a specific modal
   */
  openModal: (modal: ModalType) => void

  /**
   * Close a specific modal
   */
  closeModal: (modal: ModalType) => void

  /**
   * Toggle a specific modal
   */
  toggleModal: (modal: ModalType) => void

  /**
   * Close all modals
   */
  closeAllModals: () => void

  /**
   * Check if a specific modal is open
   */
  isModalOpen: (modal: ModalType) => boolean
}

const initialState: ModalState = {
  orders: false,
  invoices: false,
  changePlan: false,
  updateAddress: false,
  updatePayment: false,
}

/**
 * Custom hook for managing multiple modal states
 *
 * Features:
 * - Single source of truth for all modal states
 * - Memoized callbacks for performance
 * - Type-safe modal identifiers
 * - Utility functions for common operations
 *
 * @example
 * const { modals, openModal, closeModal } = useModals()
 *
 * // Open a modal
 * openModal('orders')
 *
 * // Check if modal is open
 * {modals.orders && <OrdersModal />}
 *
 * // Close a modal
 * closeModal('orders')
 */
export function useModals(): UseModalsReturn {
  const [modals, setModals] = useState<ModalState>(initialState)

  const openModal = useCallback((modal: ModalType) => {
    setModals(prev => ({ ...prev, [modal]: true }))
  }, [])

  const closeModal = useCallback((modal: ModalType) => {
    setModals(prev => ({ ...prev, [modal]: false }))
  }, [])

  const toggleModal = useCallback((modal: ModalType) => {
    setModals(prev => ({ ...prev, [modal]: !prev[modal] }))
  }, [])

  const closeAllModals = useCallback(() => {
    setModals(initialState)
  }, [])

  const isModalOpen = useCallback((modal: ModalType) => {
    return modals[modal]
  }, [modals])

  return {
    modals,
    openModal,
    closeModal,
    toggleModal,
    closeAllModals,
    isModalOpen,
  }
}
