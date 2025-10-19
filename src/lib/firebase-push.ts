/**
 * Firebase Cloud Messaging (FCM) Push Notification Service
 *
 * Handles sending push notifications to users via Firebase Cloud Messaging
 */

import { adminMessaging, adminAuth } from '@/lib/firebase-admin'
import { prisma } from '@/lib/prisma'

export interface PushNotificationData {
  token: string
  title: string
  body: string
  data?: Record<string, string>
  imageUrl?: string
  clickAction?: string
  userId?: string
  type?: 'marketing' | 'transactional' | 'alert'
  priority?: 'high' | 'normal' | 'low'
}

export interface PushNotificationResult {
  success: boolean
  messageId?: string
  error?: string
  invalidToken?: boolean
}

/**
 * Send a push notification via Firebase Cloud Messaging
 */
export async function sendPushNotification(data: PushNotificationData): Promise<PushNotificationResult> {
  try {
    // Check if Firebase Admin is initialized
    if (!adminMessaging) {
      console.warn('[Firebase] Admin SDK not initialized - push notifications disabled')
      return { success: false, error: 'Firebase Admin SDK not initialized' }
    }

    // Check if user has push notifications enabled
    if (data.userId) {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { preferences: true }
      })

      const userPreferences = user?.preferences as any
      if (userPreferences?.notifications?.push === false) {
        console.log(`[Firebase] User ${data.userId} has push notifications disabled`)
        return { success: false, error: 'User has disabled push notifications' }
      }
    }

    // Build the message
    const message: any = {
      token: data.token,
      notification: {
        title: data.title,
        body: data.body,
        ...(data.imageUrl && { imageUrl: data.imageUrl }),
      },
      data: {
        type: data.type || 'transactional',
        timestamp: new Date().toISOString(),
        ...data.data,
      },
      android: {
        priority: data.priority === 'high' ? 'high' : 'normal',
        notification: {
          sound: 'default',
          clickAction: data.clickAction,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            ...(data.clickAction && { 'click-action': data.clickAction }),
          },
        },
      },
      webpush: {
        notification: {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          vibrate: [200, 100, 200],
          ...(data.clickAction && { data: { clickAction: data.clickAction } }),
        },
      },
    }

    // Send the message
    const response = await adminMessaging.send(message)

    console.log(`[Firebase] Push notification sent successfully: ${response}`)

    return {
      success: true,
      messageId: response
    }
  } catch (error: any) {
    console.error('[Firebase] Failed to send push notification:', error)

    // Check if the error is related to invalid token
    const errorMessage = error.message || ''
    const isInvalidToken = errorMessage.includes('registration-token-not-registered') ||
                          errorMessage.includes('invalid-registration-token') ||
                          errorMessage.includes('NotRegistered')

    return {
      success: false,
      error: error.message,
      invalidToken: isInvalidToken
    }
  }
}

/**
 * Send push notification to multiple tokens (batch)
 */
export async function sendBatchPushNotifications(
  notifications: Omit<PushNotificationData, 'token'> & { userId: string }[]
): Promise<PushNotificationResult[]> {
  if (!adminMessaging) {
    return notifications.map(() => ({
      success: false,
      error: 'Firebase Admin SDK not initialized'
    }))
  }

  const results: PushNotificationResult[] = []

  for (const notification of notifications) {
    // Get user's push tokens
    const user = await prisma.user.findUnique({
      where: { id: notification.userId },
      select: {
        preferences: true,
        notificationTokens: true
      }
    })

    if (!user) {
      results.push({ success: false, error: 'User not found' })
      continue
    }

    const userPreferences = user.preferences as any
    if (userPreferences?.notifications?.push === false) {
      results.push({ success: false, error: 'User has disabled push notifications' })
      continue
    }

    const tokens = user.notificationTokens as string[] || []
    if (tokens.length === 0) {
      results.push({ success: false, error: 'No push tokens available for user' })
      continue
    }

    // Send to all tokens for this user
    for (const token of tokens) {
      const result = await sendPushNotification({
        ...notification,
        token
      })
      results.push(result)

      // If token is invalid, remove it
      if (result.invalidToken) {
        await removeInvalidToken(notification.userId, token)
      }
    }
  }

  return results
}

/**
 * Remove invalid push token from user record
 */
async function removeInvalidToken(userId: string, invalidToken: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationTokens: true }
    })

    if (!user) return

    const tokens = (user.notificationTokens as string[]) || []
    const updatedTokens = tokens.filter(token => token !== invalidToken)

    await prisma.user.update({
      where: { id: userId },
      data: {
        notificationTokens: updatedTokens
      }
    })

    console.log(`[Firebase] Removed invalid token for user ${userId}`)
  } catch (error) {
    console.error('[Firebase] Failed to remove invalid token:', error)
  }
}

/**
 * Register a new push token for a user
 */
export async function registerPushToken(userId: string, token: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationTokens: true }
    })

    if (!user) {
      console.error(`[Firebase] User ${userId} not found for token registration`)
      return false
    }

    const tokens = (user.notificationTokens as string[]) || []

    // Add token if not already present
    if (!tokens.includes(token)) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          notificationTokens: [...tokens, token]
        }
      })

      console.log(`[Firebase] Registered push token for user ${userId}`)
    }

    return true
  } catch (error) {
    console.error('[Firebase] Failed to register push token:', error)
    return false
  }
}

/**
 * Unregister a push token for a user
 */
export async function unregisterPushToken(userId: string, token: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationTokens: true }
    })

    if (!user) return false

    const tokens = (user.notificationTokens as string[]) || []
    const updatedTokens = tokens.filter(t => t !== token)

    await prisma.user.update({
      where: { id: userId },
      data: {
        notificationTokens: updatedTokens
      }
    })

    console.log(`[Firebase] Unregistered push token for user ${userId}`)
    return true
  } catch (error) {
    console.error('[Firebase] Failed to unregister push token:', error)
    return false
  }
}

/**
 * Send a notification to all users with push tokens (for admin broadcasts)
 */
export async function broadcastPushNotification(
  data: Omit<PushNotificationData, 'token' | 'userId'>,
  userFilter?: { role?: string; activeOnly?: boolean }
): Promise<{ success: number; failed: number; errors: string[] }> {
  if (!adminMessaging) {
    return { success: 0, failed: 0, errors: ['Firebase Admin SDK not initialized'] }
  }

  try {
    const whereClause: any = {}
    if (userFilter?.role) {
      whereClause.role = userFilter.role
    }
    if (userFilter?.activeOnly) {
      whereClause.active = true
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        notificationTokens: true,
        preferences: true
      }
    })

    let success = 0
    let failed = 0
    const errors: string[] = []

    for (const user of users) {
      const userPreferences = user.preferences as any
      if (userPreferences?.notifications?.push === false) {
        continue
      }

      const tokens = (user.notificationTokens as string[]) || []
      if (tokens.length === 0) continue

      const notificationData = Array(tokens.length).fill(null).map((_, index) => ({
        ...data,
        token: tokens[index],
        userId: user.id
      }))

      const results = await sendBatchPushNotifications(notificationData)

      success += results.filter(r => r.success).length
      failed += results.filter(r => !r.success).length

      const batchErrors = results
        .filter(r => !r.success)
        .map(r => r.error || 'Unknown error')
      errors.push(...batchErrors)
    }

    return { success, failed, errors }
  } catch (error) {
    console.error('[Firebase] Failed to broadcast push notification:', error)
    return { success: 0, failed: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] }
  }
}