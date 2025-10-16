import { NextRequest, NextResponse } from 'next/server';
import { type SendPulseWebhookPayload } from '@/types/sendpulse';
import { getSendPulseClient } from '@/lib/sendpulse';

export async function POST(request: NextRequest) {
  try {
    const body: SendPulseWebhookPayload = await request.json();

    const webhookSecret = process.env.SENDPULSE_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get('X-SendPulse-Signature');
      if (!signature || !verifyWebhookSignature(body, signature, webhookSecret)) {
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 403 }
        );
      }
    }

    await processWebhookEvent(body);

    return NextResponse.json({ status: 'processed' });
  } catch (error) {
    console.error('Error processing SendPulse webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function verifyWebhookSignature(
  payload: SendPulseWebhookPayload,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto');
  const payloadString = JSON.stringify(payload);
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payloadString)
    .digest('hex');
  
  return signature === expectedSignature;
}

async function processWebhookEvent(payload: SendPulseWebhookPayload) {
  console.log(`Processing SendPulse event: ${payload.event}`);

  switch (payload.event) {
    case 'message_received':
      await handleIncomingMessage(payload);
      break;
    
    case 'message_sent':
      console.log(`Message sent to ${payload.contact.phone}`, payload.status);
      break;
    
    case 'message_delivered':
      console.log(`Message delivered to ${payload.contact.phone}`, payload.status);
      break;
    
    case 'message_read':
      console.log(`Message read by ${payload.contact.phone}`, payload.status);
      break;
    
    case 'message_failed':
      console.error(`Message failed for ${payload.contact.phone}`, payload.status);
      break;
    
    default:
      console.warn(`Unknown event type: ${payload.event}`);
  }
}

async function handleIncomingMessage(payload: SendPulseWebhookPayload) {
  const { contact, message } = payload;

  if (!message) {
    console.warn('No message content in webhook payload');
    return;
  }

  console.log(`Incoming message from ${contact.phone} (${contact.name || 'Unknown'}):`, {
    type: message.type,
    text: message.text,
    messageId: message.id,
  });

  const client = getSendPulseClient();

  await processMessageContent(contact.phone, message, client);
}

async function processMessageContent(
  phone: string,
  message: SendPulseWebhookPayload['message'],
  client: ReturnType<typeof getSendPulseClient>
) {
  if (!message) return;

  const messageText = extractMessageText(message);
  
  if (!messageText) {
    return;
  }

  const lowerText = messageText.toLowerCase();

  if (lowerText.includes('agendar') || lowerText.includes('consulta')) {
    await sendConsultationResponse(phone, client);
  } else if (lowerText.includes('plano') || lowerText.includes('preço') || lowerText.includes('valor')) {
    await sendPricingResponse(phone, client);
  } else if (lowerText.includes('ajuda') || lowerText.includes('suporte')) {
    await sendSupportResponse(phone, client);
  } else {
    await sendDefaultResponse(phone, client);
  }
}

function extractMessageText(message: SendPulseWebhookPayload['message']): string | null {
  if (!message) return null;

  if (message.type === 'text' && message.text) {
    return message.text;
  }

  if (message.caption) {
    return message.caption;
  }

  if (message.type === 'audio') {
    return '[Mensagem de áudio recebida]';
  }

  if (message.type === 'image') {
    return '[Imagem recebida]';
  }

  if (message.type === 'document') {
    return '[Documento recebido]';
  }

  return null;
}

async function sendConsultationResponse(
  phone: string,
  client: ReturnType<typeof getSendPulseClient>
) {
  const message = `Ótimo! Você gostaria de agendar uma consulta com Dr. Philipe? 📅

Nosso horário de atendimento é:
• Segunda a Sexta: 8h às 18h
• Sábado: 8h às 12h

Para agendar, compartilhe sua preferência de:
1. Dia da semana
2. Período (manhã/tarde)

Ou acesse nosso site: ${process.env.NEXT_PUBLIC_APP_URL}`;

  await client.sendTextMessage(phone, message);
}

async function sendPricingResponse(
  phone: string,
  client: ReturnType<typeof getSendPulseClient>
) {
  const message = `Veja nossos planos de assinatura SV Lentes: 💰

🔹 **Plano Básico** - R$ 149/mês
• Lentes mensais
• 2 consultas/ano
• Suporte por WhatsApp

🔹 **Plano Premium** - R$ 249/mês
• Lentes diárias ou mensais
• 4 consultas/ano
• Atendimento prioritário

🔹 **Plano VIP** - R$ 349/mês
• Lentes premium
• Consultas ilimitadas
• Delivery express

Todos os planos incluem acompanhamento com Dr. Philipe.

Qual plano te interessa? 😊`;

  await client.sendTextMessage(phone, message);
}

async function sendSupportResponse(
  phone: string,
  client: ReturnType<typeof getSendPulseClient>
) {
  const message = `Estou aqui para ajudar! 🤝

Como posso te auxiliar?

1️⃣ Informações sobre planos
2️⃣ Agendar consulta
3️⃣ Status do pedido
4️⃣ Problemas com lentes
5️⃣ Dúvidas sobre o serviço

Digite o número da opção ou descreva sua dúvida.`;

  await client.sendTextMessage(phone, message);
}

async function sendDefaultResponse(
  phone: string,
  client: ReturnType<typeof getSendPulseClient>
) {
  const message = `Olá! Bem-vindo à SV Lentes! 👋

Somos especialistas em assinatura de lentes de contato com acompanhamento médico.

Como posso te ajudar hoje?

• **Agendar consulta** 📅
• **Ver planos** 💰
• **Tirar dúvidas** ❓
• **Suporte** 🆘

Nossa equipe está disponível de segunda a sexta, das 8h às 18h.

Digite sua dúvida ou escolha uma opção! 😊`;

  await client.sendTextMessage(phone, message);
}
