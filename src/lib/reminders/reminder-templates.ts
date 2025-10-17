import type { ReminderMessage, ReminderRecipient, ReminderType } from '@/lib/reminders/reminder-types'

interface TemplateAction {
  label: string
  url: string
}

interface ReminderTemplateDefinition {
  icon: string
  defaultSubject: string
  action: TemplateAction
  whatsappExtras?: string[][]
}

const reminderTemplateMap: Record<ReminderType, ReminderTemplateDefinition> = {
  subscription_renewal: {
    icon: '🔔',
    defaultSubject: '🔔 Lembrete: Renovação da sua assinatura SV Lentes',
    action: {
      label: 'Ver Minha Assinatura',
      url: 'https://svlentes.com.br/area-usuario?tab=assinatura'
    },
    whatsappExtras: [
      ['📱 *Precisa de ajuda?*', 'Responda esta mensagem ou acesse:', 'https://svlentes.com.br/area-usuario']
    ]
  },
  order_delivery: {
    icon: '📦',
    defaultSubject: '📦 Seu pedido SV Lentes está a caminho!',
    action: {
      label: 'Rastrear Pedido',
      url: 'https://svlentes.com.br/area-usuario?tab=pedidos'
    },
    whatsappExtras: [
      ['📦 *Rastreie seu pedido:*', 'https://svlentes.com.br/area-usuario?tab=pedidos']
    ]
  },
  appointment: {
    icon: '👓',
    defaultSubject: '👓 Lembrete: Consulta de acompanhamento SV Lentes',
    action: {
      label: 'Ver Minhas Consultas',
      url: 'https://svlentes.com.br/area-usuario?tab=consultas'
    },
    whatsappExtras: [
      ['💡 *Precisa reagendar?*', 'Responda esta mensagem e nossa equipe cuida de tudo para você.']
    ]
  },
  general: {
    icon: '💬',
    defaultSubject: '🔔 Lembrete - SV Lentes',
    action: {
      label: 'Acessar Minha Conta',
      url: 'https://svlentes.com.br/area-usuario'
    }
  }
}

const supportContacts = [
  {
    label: 'WhatsApp',
    value: '(33) 99989-8026',
    href: 'https://wa.me/5533999898026'
  },
  {
    label: 'Email',
    value: 'contato@svlentes.com.br',
    href: 'mailto:contato@svlentes.com.br'
  }
]

function getTemplateDefinition(type: ReminderType): ReminderTemplateDefinition {
  return reminderTemplateMap[type] ?? reminderTemplateMap.general
}

const htmlEscapeMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => htmlEscapeMap[character] ?? character)
}

function renderSupportSection(): string {
  const lines: string[] = []
  lines.push('<div style="margin-top: 35px; padding: 20px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">')
  lines.push('<p style="font-size: 14px; color: #64748b; margin: 0 0 10px 0; font-weight: 600;">📞 Precisa de ajuda?</p>')
  for (const contact of supportContacts) {
    lines.push(
      `<p style="font-size: 14px; color: #64748b; margin: 5px 0;">${contact.label}: <a href="${contact.href}" style="color: #0891b2; text-decoration: none;">${contact.value}</a></p>`
    )
  }
  lines.push('</div>')
  return lines.join('')
}

function renderEmailAction(action: TemplateAction): string {
  return [
    '<div style="text-align: center; margin: 30px 0;">',
    `<a href="${action.url}" style="background: #06b6d4; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 2px 4px rgba(6, 182, 212, 0.3);">`,
    action.label,
    '</a>',
    '</div>'
  ].join('')
}

function renderEmailLayout({
  greetingName,
  icon,
  messageHtml,
  action
}: {
  greetingName: string
  icon: string
  messageHtml: string
  action: TemplateAction
}): string {
  const layout: string[] = []
  layout.push('<!DOCTYPE html>')
  layout.push('<html lang="pt-BR">')
  layout.push('<head>')
  layout.push('<meta charset="UTF-8">')
  layout.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">')
  layout.push('<title>Lembrete - SV Lentes</title>')
  layout.push('</head>')
  layout.push("<body style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;\">")
  layout.push('<div style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">')
  layout.push('<h1 style="color: white; margin: 0; font-size: 28px;">SV Lentes</h1>')
  layout.push('<p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Lentes de Contato com Acompanhamento Médico</p>')
  layout.push('</div>')
  layout.push('<div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">')
  layout.push(`<p style="font-size: 18px; margin-bottom: 20px; color: #0891b2;">Olá, ${greetingName}!</p>`)

  layout.push('<div style="background-color: #f0f9ff; border-left: 4px solid #06b6d4; padding: 20px; margin: 25px 0; border-radius: 4px;">')
  layout.push(`<p style="font-size: 16px; margin: 0; color: #0c4a6e; line-height: 1.6;">${icon} ${messageHtml}</p>`)
  layout.push('</div>')
  layout.push(renderEmailAction(action))
  layout.push(renderSupportSection())
  layout.push('<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">')
  layout.push('<div style="text-align: center;">')
  layout.push('<p style="font-size: 13px; color: #94a3b8; margin: 10px 0;">© 2025 SV Lentes - Dr. Philipe Saraiva Cruz (CRM-MG 69.870)</p>')
  layout.push('<p style="font-size: 12px; color: #cbd5e1; margin: 15px 0 5px 0;">Você está recebendo este email porque é assinante da SV Lentes.<br><a href="https://svlentes.com.br/area-usuario?tab=preferencias" style="color: #0891b2;">Alterar preferências de notificação</a></p>')
  layout.push('</div>')
  layout.push('</div>')
  layout.push('</body>')
  layout.push('</html>')
  return layout.join('')
}

export function buildEmailReminderContent({
  recipient,
  reminder
}: {
  recipient: ReminderRecipient
  reminder: ReminderMessage
}): { subject: string; html: string } {
  const template = getTemplateDefinition(reminder.type)
  const greetingName = escapeHtml(recipient.name ?? 'Cliente')
  const messageHtml = escapeHtml(reminder.message).replace(/\n/g, '<br>')
  const html = renderEmailLayout({
    greetingName,
    icon: template.icon,
    messageHtml,
    action: template.action
  })
  return {
    subject: reminder.subject ?? template.defaultSubject,
    html
  }
}

export function buildWhatsAppReminderContent({
  recipient,
  reminder
}: {
  recipient: ReminderRecipient
  reminder: ReminderMessage
}): string {
  const template = getTemplateDefinition(reminder.type)
  const greeting = recipient.name ? `Olá, ${recipient.name}!` : 'Olá!'
  const extraSections = template.whatsappExtras?.map((block) => block.join('\n')) ?? []
  const sections: string[] = [
    `${template.icon} *SV Lentes - Lembrete*`,
    greeting,
    reminder.message.trim(),
    ...extraSections,
    '_SV Lentes - Lentes de Contato com Acompanhamento Médico_'
  ].filter(Boolean)
  return sections.join('\n\n')
}
