import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

interface NotificationData {
  userId: string
  subject: string
  message: string
  type: 'PLAN_CHANGE' | 'ADDRESS_UPDATE' | 'PAYMENT_METHOD_UPDATE' | 'STATUS_CHANGE'
  metadata?: any
}

/**
 * Send email notification to user
 */
export async function sendEmailNotification(data: NotificationData) {
  try {
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: {
        email: true,
        name: true
      }
    })

    if (!user || !user.email) {
      console.error('User not found or no email:', data.userId)
      return { success: false, error: 'User not found or no email' }
    }

    // Check if user has email notifications enabled
    const preferences = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { preferences: true }
    })

    const userPreferences = preferences?.preferences as any
    if (userPreferences?.notifications?.email === false) {
      console.log('User has email notifications disabled:', data.userId)
      return { success: false, error: 'User has email notifications disabled' }
    }

    if (!resend) {
      console.error('Resend API key not configured')
      return { success: false, error: 'Email service not configured' }
    }

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: 'SVLentes <noreply@svlentes.shop>',
      to: user.email,
      subject: data.subject,
      html: generateEmailTemplate({
        userName: user.name || 'Cliente',
        subject: data.subject,
        message: data.message,
        metadata: data.metadata
      })
    })

    // Log notification in database
    await prisma.notification.create({
      data: {
        userId: data.userId,
        channel: 'EMAIL',
        type: 'UPDATE',
        subject: data.subject,
        content: data.message,
        metadata: data.metadata,
        scheduledAt: new Date(),
        sentAt: new Date(),
        status: 'SENT'
      }
    })

    console.log('Email notification sent successfully:', emailResponse.id)
    return { success: true, id: emailResponse.id }
  } catch (error) {
    console.error('Error sending email notification:', error)

    // Log failed notification
    try {
      await prisma.notification.create({
        data: {
          userId: data.userId,
          channel: 'EMAIL',
          type: 'UPDATE',
          subject: data.subject,
          content: data.message,
          metadata: data.metadata,
          scheduledAt: new Date(),
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      })
    } catch (logError) {
      console.error('Error logging failed notification:', logError)
    }

    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Send WhatsApp notification to user via SendPulse
 */
export async function sendWhatsAppNotification(data: NotificationData) {
  try {
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: {
        whatsapp: true,
        phone: true,
        name: true
      }
    })

    if (!user) {
      console.error('User not found:', data.userId)
      return { success: false, error: 'User not found' }
    }

    const phoneNumber = user.whatsapp || user.phone
    if (!phoneNumber) {
      console.error('User has no WhatsApp/phone number:', data.userId)
      return { success: false, error: 'No WhatsApp/phone number' }
    }

    // Check if user has WhatsApp notifications enabled
    const preferences = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { preferences: true }
    })

    const userPreferences = preferences?.preferences as any
    if (userPreferences?.notifications?.whatsapp === false) {
      console.log('User has WhatsApp notifications disabled:', data.userId)
      return { success: false, error: 'User has WhatsApp notifications disabled' }
    }

    // Import SendPulse client
    const { sendPulseClient } = await import('@/lib/sendpulse-client')

    // Format message
    const message = `*${data.subject}*\n\n${data.message}\n\n_Mensagem automática da SVLentes_`

    // Send message via SendPulse
    await sendPulseClient.sendMessage(phoneNumber, message)

    // Log notification in database
    await prisma.notification.create({
      data: {
        userId: data.userId,
        channel: 'WHATSAPP',
        type: 'UPDATE',
        subject: data.subject,
        content: data.message,
        metadata: {
          ...data.metadata,
          phone: phoneNumber
        },
        scheduledAt: new Date(),
        sentAt: new Date(),
        status: 'SENT'
      }
    })

    console.log('WhatsApp notification sent successfully to:', phoneNumber)
    return { success: true }
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error)

    // Log failed notification
    try {
      await prisma.notification.create({
        data: {
          userId: data.userId,
          channel: 'WHATSAPP',
          type: 'UPDATE',
          subject: data.subject,
          content: data.message,
          metadata: data.metadata,
          scheduledAt: new Date(),
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      })
    } catch (logError) {
      console.error('Error logging failed notification:', logError)
    }

    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Generate HTML email template
 */
function generateEmailTemplate(data: {
  userName: string
  subject: string
  message: string
  metadata?: any
}) {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.subject}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background-color: #ffffff;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #06b6d4;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: #06b6d4;
          margin-bottom: 10px;
        }
        .content {
          margin-bottom: 30px;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
          color: #333;
        }
        .message {
          font-size: 16px;
          line-height: 1.8;
          color: #555;
          margin-bottom: 20px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          text-align: center;
          font-size: 14px;
          color: #777;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: #06b6d4;
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: bold;
        }
        .contact-info {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          margin-top: 20px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">SVLentes</div>
          <p style="color: #666; margin: 0;">Lentes de Contato por Assinatura</p>
        </div>

        <div class="content">
          <p class="greeting">Olá, ${data.userName}!</p>
          <div class="message">
            ${data.message}
          </div>

          <div style="text-align: center;">
            <a href="https://svlentes.shop/area-assinante/dashboard" class="button">
              Acessar Meu Painel
            </a>
          </div>

          <div class="contact-info">
            <strong>Precisa de ajuda?</strong><br>
            WhatsApp: (33) 99989-8026<br>
            Email: contato@svlentes.com.br<br>
            <br>
            <strong>Responsável Técnico:</strong><br>
            Dr. Philipe Saraiva Cruz - CRM-MG 69.870
          </div>
        </div>

        <div class="footer">
          <p>Este é um email automático. Por favor, não responda.</p>
          <p>&copy; 2025 SVLentes - Saraiva Vision. Todos os direitos reservados.</p>
          <p style="font-size: 12px; margin-top: 10px;">
            <a href="https://svlentes.shop/politica-privacidade" style="color: #06b6d4; text-decoration: none;">Política de Privacidade</a> |
            <a href="https://svlentes.shop/termos-uso" style="color: #06b6d4; text-decoration: none;">Termos de Uso</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
