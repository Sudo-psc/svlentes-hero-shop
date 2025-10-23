"use client"

import Image from "next/image"

import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

const DIMENSIONS = {
  sm: { width: 120, height: 32 },
  md: { width: 160, height: 40 },
  lg: { width: 200, height: 50 }
} as const

type DimensionKey = keyof typeof DIMENSIONS

export function SVLentesLogo({ className = "", size = "md" }: LogoProps) {
  const hasSize = Object.prototype.hasOwnProperty.call(DIMENSIONS, size)
  const sizeKey = (hasSize ? size : "md") as DimensionKey
  const { width, height } = DIMENSIONS[sizeKey]

  return (
    <Image
      src="/images/logo_transparent.png"
      alt="SV Lentes"
      width={width}
      height={height}
      className={cn("object-contain", className)}
      loading="lazy"
    />
  )
}
