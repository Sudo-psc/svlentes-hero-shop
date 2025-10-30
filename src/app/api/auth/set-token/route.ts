// @ts-nocheck - Legacy API with type incompatibilities - needs refactoring
import { NextRequest, NextResponse } from 'next/server'

const isDev = process.env.NODE_ENV === 'development'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, action } = body

    if (action === 'clear') {
      // Clear the authentication cookie
      const response = NextResponse.json({ success: true, message: 'Token cleared' })
      response.cookies.set({
        name: 'firebase-token',
        value: '',
        httpOnly: true,
        secure: !isDev, // Secure only in production
        sameSite: 'lax',
        path: '/',
        maxAge: 0, // Immediately expire
        domain: process.env.NODE_ENV === 'production' ? '.svlentes.com.br' : undefined, // Allow subdomain access in production
      })
      return response
    }

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Invalid token provided' },
        { status: 400 }
      )
    }

    // Set the secure HttpOnly cookie with the Firebase token
    const response = NextResponse.json({ success: true, message: 'Token stored securely' })
    response.cookies.set({
      name: 'firebase-token',
      value: token,
      httpOnly: true, // Critical: prevents client-side JavaScript access
      secure: !isDev, // HTTPS only in production
      sameSite: 'lax', // CSRF protection
      path: '/',
      maxAge: 3600, // 1 hour, matches Firebase token expiry
      domain: process.env.NODE_ENV === 'production' ? '.svlentes.com.br' : undefined, // Allow subdomain access in production
    })

    return response
  } catch (error) {
    console.error('[AUTH_API] Error setting token:', error)
    return NextResponse.json(
      { error: 'Failed to process authentication token' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to set or clear tokens.' },
    { status: 405 }
  )
}
