'use client'

import { type FC } from 'react'
import { Phone } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ClickToCallProps {
  phone: string
  displayPhone?: string
  className?: string
  variant?: 'button' | 'link'
}

export const ClickToCall: FC<ClickToCallProps> = ({
  phone,
  displayPhone,
  className,
  variant = 'button',
}) => {
  const cleanPhone = phone.replace(/\D/g, '')
  const display = displayPhone || phone

  const handleClick = () => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'telefone_click', {
        phone: cleanPhone,
      })
    }
  }

  if (variant === 'link') {
    return (
      <a
        href={`tel:+${cleanPhone}`}
        onClick={handleClick}
        className={cn(
          'inline-flex items-center gap-2 text-primary hover:underline',
          className
        )}
      >
        <Phone className="h-4 w-4" />
        <span>{display}</span>
      </a>
    )
  }

  return (
    <a
      href={`tel:+${cleanPhone}`}
      onClick={handleClick}
      className={cn(
        'flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-4 text-white transition-colors hover:bg-primary/90 min-h-[48px]',
        className
      )}
    >
      <Phone className="h-5 w-5" />
      <span className="font-semibold">{display}</span>
    </a>
  )
}
