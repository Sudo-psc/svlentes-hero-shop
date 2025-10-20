'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function AreaAssinantePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    // If user is authenticated, redirect to dashboard
    if (user) {
      router.push('/area-assinante/dashboard')
    } else {
      // If user is not authenticated, redirect to login
      router.push('/area-assinante/login')
    }
  }, [user, loading, router])

  // Show loading spinner while checking authentication
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-silver-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecionando...</p>
      </div>
    </div>
  )
}