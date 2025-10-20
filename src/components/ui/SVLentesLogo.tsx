'use client'

import Image from 'next/image'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function SVLentesLogo({ className = '', size = 'md' }: LogoProps) {
  const dimensions = {
    sm: { width: 120, height: 32 },
    md: { width: 160, height: 40 },
    lg: { width: 200, height: 50 }
  }

  const { width, height } = dimensions[size]

  return (
    <Image
      src="/logosv-md.webp"
      alt="SV Lentes"
      width={width}
      height={height}
      priority
      className={`object-contain ${className}`}
    />
  )
}