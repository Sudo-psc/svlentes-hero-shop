/**
 * Push Token Management API
 * Handles registration and unregistration of push notification tokens
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/admin-auth'
import {
  registerPushToken,
  unregisterPushToken
} from '@/lib/firebase-push'

export async function POST(request: NextRequest) {
  try {
    // Require user authentication
    const { user, error } = await requireAuth(request)

    if (error) {
      return error
    }

    const body = await request.json()
    const { token, action } = body

    if (!token || !action) {
      return NextResponse.json(
        {
          error: 'INVALID_REQUEST',
          message: 'Token and action are required'
        },
        { status: 400 }
      )
    }

    if (action !== 'register' && action !== 'unregister') {
      return NextResponse.json(
        {
          error: 'INVALID_ACTION',
          message: 'Action must be "register" or "unregister"'
        },
        { status: 400 }
      )
    }

    let success = false

    if (action === 'register') {
      success = await registerPushToken(user.id, token)
    } else if (action === 'unregister') {
      success = await unregisterPushToken(user.id, token)
    }

    if (!success) {
      return NextResponse.json(
        {
          error: 'OPERATION_FAILED',
          message: `Failed to ${action} push token`
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Push token ${action}d successfully`,
      action,
      userId: user.id
    })
  } catch (error) {
    console.error('Push token management error:', error)
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Require user authentication
    const { user, error } = await requireAuth(request)

    if (error) {
      return error
    }

    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        {
          error: 'MISSING_TOKEN',
          message: 'Token parameter is required'
        },
        { status: 400 }
      )
    }

    const success = await unregisterPushToken(user.id, token)

    if (!success) {
      return NextResponse.json(
        {
          error: 'OPERATION_FAILED',
          message: 'Failed to unregister push token'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Push token unregistered successfully',
      token
    })
  } catch (error) {
    console.error('Push token deletion error:', error)
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Internal server error'
      },
      { status: 500 }
    )
  }
}