'use client'
import React from 'react'

interface SimpleLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function SimpleLogo({ className = '', size = 'md' }: SimpleLogoProps) {
  const sizes = {
    sm: 'w-32 h-8',
    md: 'w-40 h-10',
    lg: 'w-48 h-12'
  }

  return (
    <div className={`${sizes[size]} ${className} flex items-center`} style={{ minHeight: '40px', border: '1px solid transparent' }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 240 60"
        className="w-full h-full"
        aria-label="SV Lentes Logo"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#0891b2', stopOpacity: 1 }} />
          </linearGradient>
        </defs>

        {/* SV Text */}
        <text x="20" y="38" fontFamily="Arial, sans-serif" fontSize="32" fontWeight="bold" fill="#06b6d4">
          SV
        </text>

        {/* Lens Icon */}
        <g transform="translate(70, 18)">
          <circle cx="12" cy="12" r="14" fill="none" stroke="#06b6d4" strokeWidth="2.5"/>
          <circle cx="16" cy="16" r="6" fill="none" stroke="#06b6d4" strokeWidth="2"/>
          <line x1="21" y1="21" x2="28" y2="28" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="9" cy="9" r="2" fill="#06b6d4" opacity="0.5"/>
        </g>

        {/* Lentes Text */}
        <text x="115" y="38" fontFamily="Arial, sans-serif" fontSize="30" fontWeight="300" fill="#2c3e50">
          Lentes
        </text>

        {/* Small dot accent */}
        <circle cx="215" cy="35" r="2" fill="#06b6d4" opacity="0.8"/>
      </svg>
    </div>
  )
}