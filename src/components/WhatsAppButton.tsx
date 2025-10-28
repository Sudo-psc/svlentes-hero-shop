'use client'

import { type FC } from 'react'
import { MessageCircle } from 'lucide-react'

interface WhatsAppButtonProps {
  phone?: string
  message?: string
  className?: string
}

export const WhatsAppButton: FC<WhatsAppButtonProps> = ({
  phone = '5511999999999',
  message = 'Olá! Gostaria de agendar uma consulta na Saraiva Vision.',
  className,
}) => {
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 shadow-lg transition-all hover:scale-110 hover:bg-green-600 md:h-16 md:w-16 ${className}`}
      aria-label="Falar no WhatsApp"
      onClick={() => {
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'whatsapp_click', {
            phone,
            message,
          })
        }
      }}
    >
      <MessageCircle className="h-6 w-6 text-white md:h-8 md:w-8" />
    </a>
  )
}
