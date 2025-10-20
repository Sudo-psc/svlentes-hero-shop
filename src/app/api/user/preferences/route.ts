import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
const notificationPreferencesSchema = z.object({
  channel: z.enum(['EMAIL', 'WHATSAPP', 'BOTH']),
  subscriptionReminders: z.boolean(),
  orderUpdates: z.boolean(),
  appointmentReminders: z.boolean(),
  marketingMessages: z.boolean()
})
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }
    // Try to find user by database ID first, then by Firebase UID
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        preferences: true,
        phone: true,
        whatsapp: true
      }
    })
    // If not found by ID, try Firebase UID
    if (!user) {
      user = await prisma.user.findUnique({
        where: { firebaseUid: userId },
        select: {
          preferences: true,
          phone: true,
          whatsapp: true
        }
      })
    }
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }
    const preferences = user.preferences as Record<string, unknown> || {}
    const notificationPreferences = preferences.notifications || {
      channel: 'EMAIL',
      subscriptionReminders: true,
      orderUpdates: true,
      appointmentReminders: true,
      marketingMessages: false
    }
    return NextResponse.json({
      preferences: notificationPreferences,
      phone: user.whatsapp || user.phone
    })
  } catch (error) {
    console.error('Error fetching preferences:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar preferências' },
      { status: 500 }
    )
  }
}
export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }
    const body = await req.json()
    const validatedData = notificationPreferencesSchema.parse(body)
    // Try to find user by database ID first, then by Firebase UID
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, preferences: true, whatsapp: true, phone: true }
    })
    if (!user) {
      user = await prisma.user.findUnique({
        where: { firebaseUid: userId },
        select: { id: true, preferences: true, whatsapp: true, phone: true }
      })
    }
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }
    const hasPhone = !!(user.whatsapp || user.phone)
    if (!hasPhone && (validatedData.channel === 'WHATSAPP' || validatedData.channel === 'BOTH')) {
      return NextResponse.json(
        { error: 'Adicione um número de telefone para usar WhatsApp' },
        { status: 400 }
      )
    }
    const currentPreferences = (user.preferences as Record<string, unknown>) || {}
    const updatedPreferences = {
      ...currentPreferences,
      notifications: validatedData
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { preferences: updatedPreferences }
    })
    return NextResponse.json({ 
      success: true,
      preferences: validatedData
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating preferences:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar preferências' },
      { status: 500 }
    )
  }
}