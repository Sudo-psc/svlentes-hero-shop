import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  phone: z.string().regex(/^\+?[\d\s()-]+$/, 'Telefone inválido').optional().or(z.literal('')),
  whatsapp: z.string().regex(/^\+?[\d\s()-]+$/, 'WhatsApp inválido').optional().or(z.literal(''))
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        phone: true,
        whatsapp: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar perfil' },
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
    const validatedData = profileSchema.parse(body)

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.phone !== undefined && { phone: validatedData.phone || null }),
        ...(validatedData.whatsapp !== undefined && { whatsapp: validatedData.whatsapp || null })
      },
      select: {
        name: true,
        email: true,
        phone: true,
        whatsapp: true
      }
    })

    return NextResponse.json({
      success: true,
      user: updatedUser
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil' },
      { status: 500 }
    )
  }
}
