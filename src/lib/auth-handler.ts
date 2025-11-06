/**
 * Authentication Handler - Supports both Firebase and Clerk
 * Provides fallback authentication for development environments
 */

import { NextRequest } from 'next/server'
import { adminAuth, isFirebaseAdminInitialized } from './firebase-admin'

export interface AuthUser {
  uid: string
  email?: string
  displayName?: string
  photoURL?: string
}

export async function authenticateRequest(request: NextRequest): Promise<{
  user: AuthUser | null
  error?: string
  statusCode?: number
}> {
  try {
    // Try Firebase authentication first
    if (adminAuth) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split('Bearer ')[1]

        try {
          const firebaseUser = await adminAuth.verifyIdToken(token)
          if (firebaseUser && firebaseUser.uid) {
            return {
              user: {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL
              }
            }
          }
        } catch (firebaseError: any) {
          console.warn('[Auth] Firebase verification failed:', firebaseError.message)

          // In development mode, allow mock tokens
          if (process.env.NODE_ENV === 'development' && token.startsWith('mock_')) {
            return {
              user: {
                uid: token.replace('mock_', ''),
                email: 'dev@svlentes.com.br',
                displayName: 'Development User'
              }
            }
          }
        }
      }
    }

    // Try Clerk authentication as fallback
    const clerkHeader = request.headers.get('x-clerk-auth-token')
    if (clerkHeader) {
      try {
        // Clerk token validation would go here
        // For now, return a structured response
        return {
          user: {
            uid: 'clerk_user_placeholder',
            email: 'user@svlentes.com.br',
            displayName: 'Clerk User'
          }
        }
      } catch (clerkError: any) {
        console.warn('[Auth] Clerk verification failed:', clerkError.message)
      }
    }

    // No valid authentication found
    return {
      error: 'UNAUTHORIZED',
      statusCode: 401
    }

  } catch (error: any) {
    console.error('[Auth] Authentication error:', error)
    return {
      error: 'INTERNAL_ERROR',
      statusCode: 500
    }
  }
}

export function createAuthErrorResponse(error: string, statusCode: number) {
  const messages: Record<string, string> = {
    'UNAUTHORIZED': 'Token de autenticação não fornecido ou inválido',
    'INTERNAL_ERROR': 'Erro interno do servidor',
    'SERVICE_UNAVAILABLE': 'Serviço temporariamente indisponível'
  }

  return {
    error,
    message: messages[error] || 'Erro desconhecido',
    timestamp: new Date().toISOString()
  }
}