import { trackEvent } from './analytics'

export const seoEvents = {
  telefoneClick: (_phone: string, location?: string) => {
    trackEvent('cta_whatsapp_clicked', {
      section: location || 'phone_link',
      context: 'telefone_click',
      has_user_data: false,
    })
  },

  whatsappClick: (params?: { phone?: string; message?: string; location?: string }) => {
    trackEvent('cta_whatsapp_clicked', {
      section: params?.location || 'whatsapp_button',
      context: params?.message || 'default_message',
      has_user_data: false,
    })
  },

  faqExpand: (question: string, index: number) => {
    trackEvent('faq_opened', {
      question_id: `faq_${index}`,
      question_text: question,
      section_position: index,
    })
  },

  agendarConsultaClick: (location: string) => {
    trackEvent('cta_agendar_clicked', {
      section: location,
      position: location,
      user_journey_stage: 'interest',
    })
  },
}
