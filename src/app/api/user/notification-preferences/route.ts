import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import {
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES
} from '@/types/notification-preferences'

// Validation schema
const notificationPreferencesSchema = z.object({
  channels: z.object({
    email: z.object({
      enabled: z.boolean(),
      events: z.record(z.boolean()).optional()
    }).optional(),
    whatsapp: z.object({
      enabled: z.boolean(),
      events: z.record(z.boolean()).optional()
    }).optional(),
    sms: z.object({
      enabled: z.boolean(),
      events: z.record(z.boolean()).optional()
    }).optional(),
    push: z.object({
      enabled: z.boolean(),
      events: z.record(z.boolean()).optional()
    }).optional()
  }).optional(),

  quietHours: z.object({
    enabled: z.boolean(),
    start: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
    end: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
    timezone: z.string()
  }).optional(),

  frequency: z.object({
    maxPerDay: z.number().min(1).max(100),
    maxPerWeek: z.number().min(1).max(500),
    respectQuietHours: z.boolean()
  }).optional(),

  fallback: z.object({
    enabled: z.boolean(),
    primaryChannel: z.enum(['email', 'whatsapp', 'sms', 'push']),
    fallbackChannel: z.enum(['email', 'whatsapp', 'sms', 'push']),
    fallbackDelayMinutes: z.number().min(5).max(1440)
  }).optional(),

  language: z.enum(['pt-BR', 'en-US']).optional(),
  format: z.enum(['html', 'plain']).optional()
})

/**
 * GET - Retrieve user notification preferences
 */
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Try to find user by database ID or Firebase UID
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, preferences: true }
    })

    if (!user) {
      user = await prisma.user.findUnique({
        where: { firebaseUid: userId },
        select: { id: true, preferences: true }
      })
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Get notification preferences
    const userPrefs = user.preferences as any
    const notificationPrefs = userPrefs?.notifications as NotificationPreferences

    // Merge with defaults
    const preferences: NotificationPreferences = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...notificationPrefs,
      channels: {
        email: { ...DEFAULT_NOTIFICATION_PREFERENCES.channels.email, ...notificationPrefs?.channels?.email },
        whatsapp: { ...DEFAULT_NOTIFICATION_PREFERENCES.channels.whatsapp, ...notificationPrefs?.channels?.whatsapp },
        sms: { ...DEFAULT_NOTIFICATION_PREFERENCES.channels.sms, ...notificationPrefs?.channels?.sms },
        push: { ...DEFAULT_NOTIFICATION_PREFERENCES.channels.push, ...notificationPrefs?.channels?.push }
      }
    }

    return NextResponse.json({
      success: true,
      preferences
    })
  } catch (error) {
    console.error('Error retrieving notification preferences:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar preferências. Tente novamente mais tarde.' },
      { status: 500 }
    )
  }
}

/**
 * PUT - Update user notification preferences
 */
export async function PUT(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const updates = notificationPreferencesSchema.parse(body)

    // Find user by database ID or Firebase UID
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, preferences: true }
    })

    if (!user) {
      user = await prisma.user.findUnique({
        where: { firebaseUid: userId },
        select: { id: true, preferences: true }
      })
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Get current preferences
    const currentPrefs = (user.preferences as any) || {}
    const currentNotificationPrefs = currentPrefs.notifications || {}

    // Deep merge updates with current preferences
    const updatedNotificationPrefs: NotificationPreferences = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...currentNotificationPrefs,
      ...updates,
      channels: {
        email: {
          ...DEFAULT_NOTIFICATION_PREFERENCES.channels.email,
          ...currentNotificationPrefs.channels?.email,
          ...updates.channels?.email
        },
        whatsapp: {
          ...DEFAULT_NOTIFICATION_PREFERENCES.channels.whatsapp,
          ...currentNotificationPrefs.channels?.whatsapp,
          ...updates.channels?.whatsapp
        },
        sms: {
          ...DEFAULT_NOTIFICATION_PREFERENCES.channels.sms,
          ...currentNotificationPrefs.channels?.sms,
          ...updates.channels?.sms
        },
        push: {
          ...DEFAULT_NOTIFICATION_PREFERENCES.channels.push,
          ...currentNotificationPrefs.channels?.push,
          ...updates.channels?.push
        }
      },
      updatedAt: new Date()
    }

    // Update user preferences in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        preferences: {
          ...currentPrefs,
          notifications: updatedNotificationPrefs
        }
      },
      select: { id: true, preferences: true }
    })

    // Log the preference change
    await prisma.consentLog.create({
      data: {
        userId: user.id,
        email: (await prisma.user.findUnique({ where: { id: user.id }, select: { email: true } }))?.email || 'unknown',
        consentType: 'DATA_PROCESSING',
        status: 'GRANTED',
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '0.0.0.0',
        userAgent: req.headers.get('user-agent') || 'unknown',
        metadata: {
          action: 'notification_preferences_updated',
          updates: updates
        }
      }
    }).catch(err => console.error('Error logging consent:', err))

    const finalPreferences = (updatedUser.preferences as any).notifications

    return NextResponse.json({
      success: true,
      preferences: finalPreferences,
      message: 'Preferências atualizadas com sucesso'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating notification preferences:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar preferências. Tente novamente mais tarde.' },
      { status: 500 }
    )
  }
}

/**
 * POST - Reset notification preferences to defaults
 */
export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Find user by database ID or Firebase UID
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, preferences: true, email: true }
    })

    if (!user) {
      user = await prisma.user.findUnique({
        where: { firebaseUid: userId },
        select: { id: true, preferences: true, email: true }
      })
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Reset to default preferences
    const currentPrefs = (user.preferences as any) || {}
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        preferences: {
          ...currentPrefs,
          notifications: DEFAULT_NOTIFICATION_PREFERENCES
        }
      },
      select: { id: true, preferences: true }
    })

    // Log the reset action
    await prisma.consentLog.create({
      data: {
        userId: user.id,
        email: user.email,
        consentType: 'DATA_PROCESSING',
        status: 'GRANTED',
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '0.0.0.0',
        userAgent: req.headers.get('user-agent') || 'unknown',
        metadata: {
          action: 'notification_preferences_reset'
        }
      }
    }).catch(err => console.error('Error logging consent:', err))

    return NextResponse.json({
      success: true,
      preferences: DEFAULT_NOTIFICATION_PREFERENCES,
      message: 'Preferências restauradas para os valores padrão'
    })
  } catch (error) {
    console.error('Error resetting notification preferences:', error)
    return NextResponse.json(
      { error: 'Erro ao restaurar preferências. Tente novamente mais tarde.' },
      { status: 500 }
    )
  }
}
