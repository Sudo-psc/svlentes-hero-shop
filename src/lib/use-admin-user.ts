'use client'

import { useState, useEffect } from 'react'
import { AdminUser } from '@/lib/admin-auth'

interface UseAdminUserState {
  user: AdminUser | null
  loading: boolean
  error: string | null
}

// Cache user data to avoid repeated API calls
let userCache: AdminUser | null = null
let userPromise: Promise<AdminUser | null> | null = null

/**
 * Fetch current admin user from API
 */
async function fetchCurrentUser(): Promise<AdminUser | null> {
  // Return cached user if available
  if (userCache) {
    return userCache
  }

  // Return existing promise if request is in progress
  if (userPromise) {
    return userPromise
  }

  // Create new request promise
  userPromise = (async () => {
    try {
      const token = localStorage.getItem('admin_token')
      if (!token) {
        return null
      }

      const response = await fetch('/api/admin/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid, clear it
          localStorage.removeItem('admin_token')
        }
        return null
      }

      const result = await response.json()

      if (!result.success) {
        return null
      }

      const user: AdminUser = {
        id: result.data.id,
        email: result.data.email,
        name: result.data.name,
        role: result.data.role,
        permissions: result.data.permissions
      }

      userCache = user
      return user
    } catch (error) {
      console.error('Failed to fetch admin user:', error)
      return null
    } finally {
      userPromise = null
    }
  })()

  return userPromise
}

/**
 * Hook to get current admin user
 * Automatically fetches user on mount and caches it
 */
export function useAdminUser(): UseAdminUserState {
  const [state, setState] = useState<UseAdminUserState>({
    user: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    let mounted = true

    const loadUser = async () => {
      try {
        const user = await fetchCurrentUser()

        if (mounted) {
          setState({
            user,
            loading: false,
            error: null
          })
        }
      } catch (error) {
        if (mounted) {
          setState({
            user: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to load user'
          })
        }
      }
    }

    loadUser()

    return () => {
      mounted = false
    }
  }, [])

  return state
}

/**
 * Get current user synchronously (from cache)
 * Returns null if user not cached
 */
export function getCurrentUser(): AdminUser | null {
  return userCache
}

/**
 * Clear user cache (useful after logout)
 */
export function clearUserCache(): void {
  userCache = null
  userPromise = null
}

/**
 * Check if current user has specific permission
 */
export function useHasPermission(permission: string): boolean {
  const { user } = useAdminUser()
  return user?.permissions?.includes(permission) || false
}

/**
 * Check if current user has any of the specified permissions
 */
export function useHasAnyPermission(permissions: string[]): boolean {
  const { user } = useAdminUser()
  if (!user?.permissions) return false
  return permissions.some(permission => user.permissions.includes(permission))
}

/**
 * Check if current user has specific role
 */
export function useHasRole(role: string): boolean {
  const { user } = useAdminUser()
  return user?.role === role
}

/**
 * Get user display name (fallback to email if name not provided)
 */
export function useUserDisplayName(): string {
  const { user } = useAdminUser()
  if (!user) return 'Usuário Desconhecido'
  return user.name || user.email
}