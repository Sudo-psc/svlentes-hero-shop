import { Resend } from 'resend'

// Lazy initialization to avoid errors during build
let resend: Resend | null = null

function getResendClient() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not defined')
    }
    resend = new Resend(apiKey)
  }
  return resend
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

/**
 * Envia email usando Resend API
 */
export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    const client = getResendClient()
    const { data, error } = await client.emails.send({
      from: process.env.EMAIL_FROM || 'SV Lentes <noreply@svlentes.shop>',
      to,
      subject,
      html,
    })

    if (error) {
      console.error('[EMAIL] Erro ao enviar email:', error)
      throw new Error('Falha ao enviar email')
    }

    console.log('[EMAIL] Email enviado com sucesso:', data?.id)
    return data
  } catch (error: any) {
    console.error('[EMAIL] Exceção ao enviar email:', error.message)
    throw error
  }
}

/**
 * Envia email de verificação
 */
export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirme seu email - SV Lentes</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">SV Lentes</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Confirme seu email</p>
      </div>

      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Olá!</p>

        <p style="font-size: 16px; margin-bottom: 20px;">
          Obrigado por se cadastrar na SV Lentes. Para completar seu cadastro,
          por favor confirme seu endereço de email clicando no botão abaixo:
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}"
             style="background: #06b6d4; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
            Confirmar Email
          </a>
        </div>

        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          Ou copie e cole este link no seu navegador:
        </p>
        <p style="font-size: 14px; color: #06b6d4; word-break: break-all;">
          ${verifyUrl}
        </p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

        <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
          <strong>Este link é válido por 24 horas.</strong>
        </p>

        <p style="font-size: 14px; color: #666;">
          Se você não criou uma conta na SV Lentes, por favor ignore este email.
        </p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
          <p style="font-size: 12px; color: #999; margin: 5px 0;">
            © 2025 SV Lentes - Lentes de Contato com Acompanhamento Médico
          </p>
          <p style="font-size: 12px; color: #999; margin: 5px 0;">
            Caratinga/MG - Dr. Philipe Saraiva Cruz (CRM-MG 69.870)
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'Confirme seu email - SV Lentes',
    html,
  })
}

/**
 * Envia email de recuperação de senha
 */
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recuperação de Senha - SV Lentes</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">SV Lentes</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Recuperação de Senha</p>
      </div>

      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Olá!</p>

        <p style="font-size: 16px; margin-bottom: 20px;">
          Recebemos uma solicitação para redefinir a senha da sua conta na SV Lentes.
        </p>

        <p style="font-size: 16px; margin-bottom: 20px;">
          Para criar uma nova senha, clique no botão abaixo:
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background: #06b6d4; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
            Redefinir Senha
          </a>
        </div>

        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          Ou copie e cole este link no seu navegador:
        </p>
        <p style="font-size: 14px; color: #06b6d4; word-break: break-all;">
          ${resetUrl}
        </p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

        <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
          <strong>Este link é válido por 1 hora.</strong>
        </p>

        <p style="font-size: 14px; color: #666;">
          Se você não solicitou a recuperação de senha, por favor ignore este email.
          Sua senha permanecerá inalterada.
        </p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
          <p style="font-size: 12px; color: #999; margin: 5px 0;">
            © 2025 SV Lentes - Lentes de Contato com Acompanhamento Médico
          </p>
          <p style="font-size: 12px; color: #999; margin: 5px 0;">
            Caratinga/MG - Dr. Philipe Saraiva Cruz (CRM-MG 69.870)
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'Recuperação de Senha - SV Lentes',
    html,
  })
}
