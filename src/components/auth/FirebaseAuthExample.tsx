/**
 * Firebase Authentication Example Component
 *
 * This component demonstrates how to use the custom Firebase Auth hook
 * for sign in, sign up, and user management in React components.
 *
 * Usage:
 * ```tsx
 * <FirebaseAuthExample />
 * ```
 *
 * @author Dr. Philipe Saraiva Cruz
 */

'use client'

import { useState } from 'react'
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth'

export function FirebaseAuthExample() {
  const {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithFacebook,
    signInWithGitHub,
    sendVerificationEmail,
    sendPasswordReset,
    updateUserProfile,
    getIdToken,
    debug
  } = useFirebaseAuth()

  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showSignUp, setShowSignUp] = useState(false)
  const [resetEmail, setResetEmail] = useState('')

  // Get token for API calls
  const handleGetToken = async () => {
    const token = await getIdToken()
    console.log('Firebase ID Token:', token?.substring(0, 20) + '...')

    if (token) {
      // Example: Use token to call protected API
      try {
        const response = await fetch('/api/stripe/subscription', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          console.log('API Response:', data)
        } else {
          console.error('API Error:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('Network Error:', error)
      }
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    await signIn(email, password)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    await signUp(email, password, displayName || undefined)
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    await sendPasswordReset(resetEmail)
    setResetEmail('')
  }

  const handleUpdateProfile = async () => {
    if (!user) return

    const newName = prompt('Enter new display name:', user.displayName || '')
    if (newName && newName !== user.displayName) {
      await updateUserProfile({ displayName: newName })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Firebase Authentication
      </h2>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* User Info */}
      {user && (
        <div className="mb-6 p-4 bg-green-100 rounded">
          <h3 className="font-semibold mb-2">Welcome, {user.displayName || user.email}!</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}</p>
            <p><strong>User ID:</strong> {user.uid}</p>
            {!user.emailVerified && (
              <button
                onClick={sendVerificationEmail}
                className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                Resend Verification Email
              </button>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <button
              onClick={handleUpdateProfile}
              className="w-full px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
            >
              Update Profile
            </button>

            <button
              onClick={handleGetToken}
              className="w-full px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
            >
              Get ID Token & Test API
            </button>

            <button
              onClick={signOut}
              className="w-full px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {!user && (
        <div>
          {/* Toggle Sign In/Sign Up */}
          <div className="mb-4 text-center">
            <button
              onClick={() => setShowSignUp(!showSignUp)}
              className="text-blue-600 hover:underline"
            >
              {showSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>

          {/* Sign Up Form */}
          {showSignUp ? (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name (Optional)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Sign Up
              </button>
            </form>
          ) : (
            /* Sign In Form */
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Sign In
              </button>
            </form>
          )}

          {/* OAuth Sign In */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <button
                onClick={signInWithGoogle}
                className="flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Google
              </button>

              <button
                onClick={signInWithFacebook}
                className="flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Facebook
              </button>

              <button
                onClick={signInWithGitHub}
                className="flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                GitHub
              </button>
            </div>
          </div>

          {/* Password Reset */}
          <div className="mt-6">
            <details className="text-sm">
              <summary className="cursor-pointer text-blue-600 hover:underline">
                Forgot your password?
              </summary>
              <form onSubmit={handlePasswordReset} className="mt-2 space-y-2">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                />
                <button
                  type="submit"
                  className="w-full py-1 px-3 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  Send Reset Email
                </button>
              </form>
            </details>
          </div>
        </div>
      )}

      {/* Debug Button */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={debug}
          className="w-full py-1 px-3 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
        >
          Debug Firebase Config
        </button>
      </div>
    </div>
  )
}