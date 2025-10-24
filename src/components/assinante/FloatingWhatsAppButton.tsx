/**
 * Floating WhatsApp Button - Phase 2
 * Botão flutuante sempre visível com contexto dinâmico
 */

'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  subscriptionId?: string
  context?: string
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5533999898026'

export function FloatingWhatsAppButton({ subscriptionId, context = 'support' }: Props) {
  const handleClick = () => {
    try {
      let message = 'Olá! Preciso de ajuda.'

      if (subscriptionId && context) {
        const shortId = subscriptionId.substring(0, 8)
        message = `Olá! Preciso de ajuda com minha assinatura (ID: ${shortId}).`
      }

      const cleanNumber = WHATSAPP_NUMBER.replace(/\D/g, '')
      const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      console.error('[FloatingWhatsAppButton] Error:', error)
      const cleanNumber = WHATSAPP_NUMBER.replace(/\D/g, '')
      const fallbackUrl = `https://wa.me/${cleanNumber}`
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={handleClick}
        size="lg"
        className="rounded-full w-14 h-14 bg-[#25d366] hover:bg-[#20ba5a] shadow-lg hover:shadow-xl transition-all"
        aria-label="Abrir WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    </div>
  )
}
