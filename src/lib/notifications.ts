// Sistema de notificações para assinantes

export interface NotificationData {
  type: 'subscription_created' | 'subscription_cancelled' | 'payment_success' | 'payment_failed' | 'plan_changed' | 'order_shipped' | 'order_delivered' | 'pause_reminder'
  userId: string
  email: string
  displayName: string
  data: Record<string, any>
}

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export class NotificationService {
  // Enviar notificação por email
  static async sendEmail(data: NotificationData): Promise<boolean> {
    try {
      const template = this.generateEmailTemplate(data)

      // Aqui você integraria com seu serviço de email preferido
      // Ex: Resend, SendGrid, Amazon SES, etc.

      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email enviado:', {
          to: data.email,
          subject: template.subject,
          type: data.type
        })
        return true
      }

      // Implementar envio real de email
      // const response = await fetch('https://api.resend.com/emails', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     from: 'noreply@svlentes.shop',
      //     to: [data.email],
      //     subject: template.subject,
      //     html: template.html,
      //     text: template.text,
      //   }),
      // })

      return true
    } catch (error) {
      console.error('Erro ao enviar email:', error)
      return false
    }
  }

  // Gerar template de email baseado no tipo
  private static generateEmailTemplate(data: NotificationData): EmailTemplate {
    switch (data.type) {
      case 'subscription_created':
        return this.subscriptionCreatedTemplate(data)
      case 'subscription_cancelled':
        return this.subscriptionCancelledTemplate(data)
      case 'payment_success':
        return this.paymentSuccessTemplate(data)
      case 'payment_failed':
        return this.paymentFailedTemplate(data)
      case 'plan_changed':
        return this.planChangedTemplate(data)
      case 'order_shipped':
        return this.orderShippedTemplate(data)
      case 'order_delivered':
        return this.orderDeliveredTemplate(data)
      case 'pause_reminder':
        return this.pauseReminderTemplate(data)
      default:
        return this.defaultTemplate(data)
    }
  }

  // Templates de email
  private static subscriptionCreatedTemplate(data: NotificationData): EmailTemplate {
    return {
      subject: 'Bem-vindo à SV Lentes! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #06b6d4; font-size: 28px;">🎉 Bem-vindo à SV Lentes!</h1>
          </div>

          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Olá <strong>${data.displayName}</strong>,
          </p>

          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Sua assinatura foi criada com sucesso! Estamos muito felizes em ter você conosco.
          </p>

          <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #0369a1; margin-top: 0;">Detalhes da sua assinatura:</h2>
            <ul style="color: #333; line-height: 1.6;">
              <li><strong>Plano:</strong> ${data.data.plan === 'monthly' ? 'Mensal' : 'Anual'}</li>
              <li><strong>Tipo de Lente:</strong> ${data.data.lensType}</li>
              <li><strong>Valor Mensal:</strong> R$ ${data.data.monthlyPrice.toFixed(2)}</li>
              <li><strong>Próxima Entrega:</strong> ${new Date(data.data.nextBillingDate).toLocaleDateString('pt-BR')}</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://svlentes.shop/area-assinante/dashboard"
               style="background: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Acessar Minha Área
            </a>
          </div>

          <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>👨‍⚕️ Dr. Philipe Saraiva Cruz</strong><br>
              CRM-MG 69.870<br>
              Em caso de emergência, ligue: +55 33 99898-026
            </p>
          </div>

          <p style="font-size: 14px; color: #666; text-align: center;">
            Atenciosamente,<br>
            Equipe SV Lentes
          </p>
        </div>
      `,
      text: `
        Bem-vindo à SV Lentes!

        Olá ${data.displayName},

        Sua assinatura foi criada com sucesso! Estamos muito felizes em ter você conosco.

        Detalhes da sua assinatura:
        - Plano: ${data.data.plan === 'monthly' ? 'Mensal' : 'Anual'}
        - Tipo de Lente: ${data.data.lensType}
        - Valor Mensal: R$ ${data.data.monthlyPrice.toFixed(2)}
        - Próxima Entrega: ${new Date(data.data.nextBillingDate).toLocaleDateString('pt-BR')}

        Acesse sua área do assinante em: https://svlentes.shop/area-assinante/dashboard

        Dr. Philipe Saraiva Cruz - CRM-MG 69.870
        Emergência: +55 33 99898-026

        Atenciosamente,
        Equipe SV Lentes
      `
    }
  }

  private static subscriptionCancelledTemplate(data: NotificationData): EmailTemplate {
    return {
      subject: 'Seu pedido de cancelamento foi processado',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; font-size: 28px;">Cancelamento Processado</h1>
          </div>

          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Olá <strong>${data.displayName}</strong>,
          </p>

          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Seu pedido de cancelamento foi processado com sucesso.
          </p>

          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #dc2626; margin-top: 0;">Informações do Cancelamento:</h2>
            <ul style="color: #333; line-height: 1.6;">
              <li><strong>Data do Cancelamento:</strong> ${new Date().toLocaleDateString('pt-BR')}</li>
              <li><strong>Motivo:</strong> ${data.data.reason || 'Não informado'}</li>
              <li><strong>Período Ativo:</strong> ${data.data.activePeriod || 'Finalizado'}</li>
            </ul>
          </div>

          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Sentiremos sua falta! Você sempre será bem-vindo de volta.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://svlentes.shop/calculadora"
               style="background: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Criar Nova Assinatura
            </a>
          </div>

          <p style="font-size: 14px; color: #666; text-align: center;">
            Atenciosamente,<br>
            Equipe SV Lentes
          </p>
        </div>
      `,
      text: `
        Cancelamento Processado

        Olá ${data.displayName},

        Seu pedido de cancelamento foi processado com sucesso.

        Informações do Cancelamento:
        - Data do Cancelamento: ${new Date().toLocaleDateString('pt-BR')}
        - Motivo: ${data.data.reason || 'Não informado'}
        - Período Ativo: ${data.data.activePeriod || 'Finalizado'}

        Sentiremos sua falta! Você sempre será bem-vindo de volta.

        Criar nova assinatura: https://svlentes.shop/calculadora

        Atenciosamente,
        Equipe SV Lentes
      `
    }
  }

  private static paymentSuccessTemplate(data: NotificationData): EmailTemplate {
    return {
      subject: 'Pagamento Confirmado ✅',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #059669; font-size: 28px;">✅ Pagamento Confirmado!</h1>
          </div>

          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Olá <strong>${data.displayName}</strong>,
          </p>

          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Seu pagamento foi processado com sucesso. Obrigado por continuar com a gente!
          </p>

          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #059669; margin-top: 0;">Detalhes do Pagamento:</h2>
            <ul style="color: #333; line-height: 1.6;">
              <li><strong>Valor:</strong> R$ ${data.data.amount.toFixed(2)}</li>
              <li><strong>Data:</strong> ${new Date(data.data.date).toLocaleDateString('pt-BR')}</li>
              <li><strong>Método:</strong> ${data.data.paymentMethod}</li>
              <li><strong>Referência:</strong> ${data.data.reference}</li>
            </ul>
          </div>

          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Sua próxima entrega será processada conforme o cronograma.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://svlentes.shop/area-assinante/dashboard"
               style="background: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Ver Minha Assinatura
            </a>
          </div>

          <p style="font-size: 14px; color: #666; text-align: center;">
            Atenciosamente,<br>
            Equipe SV Lentes
          </p>
        </div>
      `,
      text: `
        Pagamento Confirmado

        Olá ${data.displayName},

        Seu pagamento foi processado com sucesso. Obrigado por continuar com a gente!

        Detalhes do Pagamento:
        - Valor: R$ ${data.data.amount.toFixed(2)}
        - Data: ${new Date(data.data.date).toLocaleDateString('pt-BR')}
        - Método: ${data.data.paymentMethod}
        - Referência: ${data.data.reference}

        Sua próxima entrega será processada conforme o cronograma.

        Ver sua assinatura: https://svlentes.shop/area-assinante/dashboard

        Atenciosamente,
        Equipe SV Lentes
      `
    }
  }

  private static paymentFailedTemplate(data: NotificationData): EmailTemplate {
    return {
      subject: '⚠️ Falha no processamento do pagamento',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; font-size: 28px;">⚠️ Falha no Pagamento</h1>
          </div>

          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Olá <strong>${data.displayName}</strong>,
          </p>

          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Encontramos uma falha ao processar seu pagamento. Por favor, verifique seus dados e tente novamente.
          </p>

          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #dc2626; margin-top: 0;">Detalhes da Tentativa:</h2>
            <ul style="color: #333; line-height: 1.6;">
              <li><strong>Valor:</strong> R$ ${data.data.amount.toFixed(2)}</li>
              <li><strong>Data:</strong> ${new Date(data.data.date).toLocaleDateString('pt-BR')}</li>
              <li><strong>Motivo:</strong> ${data.data.reason}</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://svlentes.shop/area-assinante/dashboard"
               style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Atualizar Pagamento
            </a>
          </div>

          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Se precisar de ajuda, entre em contato conosco.
          </p>

          <div style="background: #f3f4f6; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #374151;">
              <strong>Contato de Suporte:</strong><br>
              WhatsApp: +55 33 99898-026<br>
              Email: saraivavision@gmail.com
            </p>
          </div>

          <p style="font-size: 14px; color: #666; text-align: center;">
            Atenciosamente,<br>
            Equipe SV Lentes
          </p>
        </div>
      `,
      text: `
        Falha no Pagamento

        Olá ${data.displayName},

        Encontramos uma falha ao processar seu pagamento. Por favor, verifique seus dados e tente novamente.

        Detalhes da Tentativa:
        - Valor: R$ ${data.data.amount.toFixed(2)}
        - Data: ${new Date(data.data.date).toLocaleDateString('pt-BR')}
        - Motivo: ${data.data.reason}

        Atualizar pagamento: https://svlentes.shop/area-assinante/dashboard

        Se precisar de ajuda, entre em contato conosco.

        Contato de Suporte:
        WhatsApp: +55 33 99898-026
        Email: saraivavision@gmail.com

        Atenciosamente,
        Equipe SV Lentes
      `
    }
  }

  private static planChangedTemplate(data: NotificationData): EmailTemplate {
    return {
      subject: 'Seu plano foi alterado com sucesso! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #7c3aed; font-size: 28px;">🎉 Plano Alterado!</h1>
          </div>

          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Olá <strong>${data.displayName}</strong>,
          </p>

          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Seu plano foi alterado conforme sua solicitação.
          </p>

          <div style="background: #f3e8ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #7c3aed; margin-top: 0;">Resumo da Alteração:</h2>
            <ul style="color: #333; line-height: 1.6;">
              <li><strong>Plano Anterior:</strong> ${data.data.previousPlan === 'monthly' ? 'Mensal' : 'Anual'}</li>
              <li><strong>Novo Plano:</strong> ${data.data.newPlan === 'monthly' ? 'Mensal' : 'Anual'}</li>
              <li><strong>Valor Mensal:</strong> R$ ${data.data.newPrice.toFixed(2)}</li>
              <li><strong>Vigência:</strong> ${data.data.effectiveDate}</li>
              ${data.data.savings > 0 ? `<li><strong>Economia:</strong> R$ ${data.data.savings.toFixed(2)}/mês</li>` : ''}
            </ul>
          </div>

          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            ${data.data.savings > 0 ?
              'Parabéns pela economia! Você está aproveitando ao máximo nossos benefícios.' :
              'Agradecemos por continuar com a gente!'
            }
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://svlentes.shop/area-assinante/dashboard"
               style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Ver Meu Plano
            </a>
          </div>

          <p style="font-size: 14px; color: #666; text-align: center;">
            Atenciosamente,<br>
            Equipe SV Lentes
          </p>
        </div>
      `,
      text: `
        Plano Alterado!

        Olá ${data.displayName},

        Seu plano foi alterado conforme sua solicitação.

        Resumo da Alteração:
        - Plano Anterior: ${data.data.previousPlan === 'monthly' ? 'Mensal' : 'Anual'}
        - Novo Plano: ${data.data.newPlan === 'monthly' ? 'Mensal' : 'Anual'}
        - Valor Mensal: R$ ${data.data.newPrice.toFixed(2)}
        - Vigência: ${data.data.effectiveDate}
        ${data.data.savings > 0 ? `- Economia: R$ ${data.data.savings.toFixed(2)}/mês` : ''}

        ${data.data.savings > 0 ?
          'Parabéns pela economia! Você está aproveitando ao máximo nossos benefícios.' :
          'Agradecemos por continuar com a gente!'
        }

        Ver seu plano: https://svlentes.shop/area-assinante/dashboard

        Atenciosamente,
        Equipe SV Lentes
      `
    }
  }

  private static orderShippedTemplate(data: NotificationData): EmailTemplate {
    return {
      subject: 'Seu pedido foi enviado! 📦',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0891b2; font-size: 28px;">📦 Pedido Enviado!</h1>
          </div>

          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Olá <strong>${data.displayName}</strong>,
          </p>

          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Ótimas notícias! Seu pedido foi enviado e está a caminho da sua casa.
          </p>

          <div style="background: #ecfeff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #0891b2; margin-top: 0;">Informações da Entrega:</h2>
            <ul style="color: #333; line-height: 1.6;">
              <li><strong>Pedido:</strong> #${data.data.orderId}</li>
              <li><strong>Código de Rastreamento:</strong> ${data.data.trackingCode}</li>
              <li><strong>Transportadora:</strong> ${data.data.carrier}</li>
              <li><strong>Previsão de Entrega:</strong> ${data.data.estimatedDelivery}</li>
            </ul>
          </div>

          <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #075985;">
              <strong>Endereço de Entrega:</strong><br>
              ${data.data.address.street}, ${data.data.address.number}<br>
              ${data.data.address.neighborhood}, ${data.data.address.city} - ${data.data.address.state}<br>
              ${data.data.address.zipCode}
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.data.trackingUrl}"
               style="background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Rastrear Pedido
            </a>
          </div>

          <p style="font-size: 14px; color: #666; text-align: center;">
            Atenciosamente,<br>
            Equipe SV Lentes
          </p>
        </div>
      `,
      text: `
        Pedido Enviado!

        Olá ${data.displayName},

        Ótimas notícias! Seu pedido foi enviado e está a caminho da sua casa.

        Informações da Entrega:
        - Pedido: #${data.data.orderId}
        - Código de Rastreamento: ${data.data.trackingCode}
        - Transportadora: ${data.data.carrier}
        - Previsão de Entrega: ${data.data.estimatedDelivery}

        Endereço de Entrega:
        ${data.data.address.street}, ${data.data.address.number}
        ${data.data.address.neighborhood}, ${data.data.address.city} - ${data.data.address.state}
        ${data.data.address.zipCode}

        Rastrear pedido: ${data.data.trackingUrl}

        Atenciosamente,
        Equipe SV Lentes
      `
    }
  }

  private static orderDeliveredTemplate(data: NotificationData): EmailTemplate {
    return {
      subject: 'Seu pedido foi entregue! ✅',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #059669; font-size: 28px;">✅ Pedido Entregue!</h1>
          </div>

          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Olá <strong>${data.displayName}</strong>,
          </p>

          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Seu pedido foi entregue com sucesso! Esperamos que goste dos seus produtos.
          </p>

          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #059669; margin-top: 0;">Resumo da Entrega:</h2>
            <ul style="color: #333; line-height: 1.6;">
              <li><strong>Pedido:</strong> #${data.data.orderId}</li>
              <li><strong>Data da Entrega:</strong> ${new Date(data.data.deliveryDate).toLocaleDateString('pt-BR')}</li>
            </ul>
          </div>

          <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0;">Dicas Importantes:</h3>
            <ul style="color: #92400e; line-height: 1.6;">
              <li>Verifique se todos os itens estão corretos</li>
              <li>Guarde o produto em local seguro e adequado</li>
              <li>Siga as instruções de uso que acompanham o produto</li>
              <li>Em caso de problemas, entre em contato conosco</li>
            </ul>
          </div>

          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Alguma dúvida ou problema com seu pedido? Estamos aqui para ajudar!
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://svlentes.shop/area-assinante/dashboard"
               style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Avaliar Entrega
            </a>
          </div>

          <p style="font-size: 14px; color: #666; text-align: center;">
            Atenciosamente,<br>
            Equipe SV Lentes
          </p>
        </div>
      `,
      text: `
        Pedido Entregue!

        Olá ${data.displayName},

        Seu pedido foi entregue com sucesso! Esperamos que goste dos seus produtos.

        Resumo da Entrega:
        - Pedido: #${data.data.orderId}
        - Data da Entrega: ${new Date(data.data.deliveryDate).toLocaleDateString('pt-BR')}

        Dicas Importantes:
        - Verifique se todos os itens estão corretos
        - Guarde o produto em local seguro e adequado
        - Siga as instruções de uso que acompanham o produto
        - Em caso de problemas, entre em contato conosco

        Alguma dúvida ou problema com seu pedido? Estamos aqui para ajudar!

        Avaliar entrega: https://svlentes.shop/area-assinante/dashboard

        Atenciosamente,
        Equipe SV Lentes
      `
    }
  }

  private static pauseReminderTemplate(data: NotificationData): EmailTemplate {
    return {
      subject: 'Lembrete: Sua assinatura está pausada ⏸️',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #f59e0b; font-size: 28px;">⏸️ Assinatura Pausada</h1>
          </div>

          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Olá <strong>${data.displayName}</strong>,
          </p>

          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Este é um lembrete de que sua assinatura SV Lentes está atualmente pausada.
          </p>

          <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #d97706; margin-top: 0;">Status da Assinatura:</h2>
            <ul style="color: #333; line-height: 1.6;">
              <li><strong>Status:</strong> Pausada</li>
              <li><strong>Data da Pausa:</strong> ${new Date(data.data.pauseDate).toLocaleDateString('pt-BR')}</li>
              <li><strong>Motivo:</strong> ${data.data.reason || 'Não informado'}</li>
            </ul>
          </div>

          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Você pode reativar sua assinatura a qualquer momento através da sua área do assinante.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://svlentes.shop/area-assinante/dashboard"
               style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reativar Assinatura
            </a>
          </div>

          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Estamos aguardando seu retorno!
          </p>

          <p style="font-size: 14px; color: #666; text-align: center;">
            Atenciosamente,<br>
            Equipe SV Lentes
          </p>
        </div>
      `,
      text: `
        Assinatura Pausada

        Olá ${data.displayName},

        Este é um lembrete de que sua assinatura SV Lentes está atualmente pausada.

        Status da Assinatura:
        - Status: Pausada
        - Data da Pausa: ${new Date(data.data.pauseDate).toLocaleDateString('pt-BR')}
        - Motivo: ${data.data.reason || 'Não informado'}

        Você pode reativar sua assinatura a qualquer momento através da sua área do assinante.

        Reativar assinatura: https://svlentes.shop/area-assinante/dashboard

        Estamos aguardando seu retorno!

        Atenciosamente,
        Equipe SV Lentes
      `
    }
  }

  private static defaultTemplate(data: NotificationData): EmailTemplate {
    return {
      subject: 'Notificação da SV Lentes',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #06b6d4; text-align: center;">Notificação SV Lentes</h1>
          <p>Você recebeu uma notificação sobre sua assinatura.</p>
          <p>Tipo: ${data.type}</p>
        </div>
      `,
      text: `Notificação SV Lentes\n\nVocê recebeu uma notificação sobre sua assinatura.\n\nTipo: ${data.type}`
    }
  }

  // Enviar notificação WhatsApp
  static async sendWhatsApp(data: NotificationData): Promise<boolean> {
    try {
      let message = ''

      switch (data.type) {
        case 'subscription_created':
          message = `🎉 Olá ${data.displayName}! Sua assinatura SV Lentes foi criada com sucesso! Acesse sua área: https://svlentes.shop/area-assinante/dashboard`
          break
        case 'order_shipped':
          message = `📦 Olá ${data.displayName}! Seu pedido #${data.data.orderId} foi enviado! Rastreie: ${data.data.trackingCode}`
          break
        case 'order_delivered':
          message = `✅ Olá ${data.displayName}! Seu pedido foi entregue! Esperamos que goste! Avalie em: https://svlentes.shop/area-assinante/dashboard`
          break
        default:
          message = `Olá ${data.displayName}! Você tem uma atualização sobre sua assinatura SV Lentes. Acesse: https://svlentes.shop/area-assinante/dashboard`
      }

      const whatsappUrl = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`

      if (process.env.NODE_ENV === 'development') {
        console.log('📱 WhatsApp:', message)
        return true
      }

      // Implementar envio real via API do WhatsApp
      return true
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error)
      return false
    }
  }
}