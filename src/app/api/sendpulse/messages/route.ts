import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSendPulseClient } from '@/lib/sendpulse';
import { generateContextualMessage } from '@/lib/whatsapp';

const sendMessageSchema = z.object({
  phone: z.string().min(10, 'Número de telefone inválido'),
  message: z.string().min(1).max(4096, 'Mensagem muito longa').optional(),
  context: z.enum(['hero', 'pricing', 'consultation', 'support', 'calculator', 'emergency']).optional(),
  userData: z.object({
    nome: z.string().optional(),
    email: z.string().email().optional(),
    whatsapp: z.string().optional(),
  }).optional(),
  contextData: z.object({
    page: z.string().optional(),
    section: z.string().optional(),
    planInterest: z.string().optional(),
    calculatedEconomy: z.number().optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = sendMessageSchema.parse(body);

    const client = getSendPulseClient();

    let messageText: string;

    if (validatedData.message) {
      messageText = validatedData.message;
    } else if (validatedData.context) {
      messageText = generateContextualMessage(validatedData.context, {
        page: validatedData.contextData?.page || 'website',
        section: validatedData.contextData?.section,
        planInterest: validatedData.contextData?.planInterest,
        calculatedEconomy: validatedData.contextData?.calculatedEconomy,
        userInfo: validatedData.userData,
      });
    } else {
      return NextResponse.json(
        { error: 'Você deve fornecer uma mensagem ou contexto' },
        { status: 400 }
      );
    }

    const response = await client.sendTextMessage(
      validatedData.phone,
      messageText
    );

    if (!response.result) {
      return NextResponse.json(
        { 
          error: response.error?.message || 'Falha ao enviar mensagem',
          details: response.error 
        },
        { status: 500 }
      );
    }

    console.log(`Message sent via SendPulse to ${validatedData.phone}:`, {
      messageId: response.data?.message_id,
      status: response.data?.status,
      context: validatedData.context,
    });

    return NextResponse.json({
      success: true,
      messageId: response.data?.message_id,
      status: response.data?.status,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error sending message via SendPulse:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json(
        { error: 'Número de telefone é obrigatório' },
        { status: 400 }
      );
    }

    const client = getSendPulseClient();
    const contact = await client.getContactInfo(phone);

    if (!contact) {
      return NextResponse.json(
        { error: 'Contato não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      contact,
    });

  } catch (error) {
    console.error('Error getting contact info from SendPulse:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
