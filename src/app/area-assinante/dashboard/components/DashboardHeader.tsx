/**
 * Dashboard Header Component
 *
 * Displays logo, title, and user actions (sign out)
 * Used in subscriber dashboard header
 *
 * @author Dr. Philipe Saraiva Cruz
 */

'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'

interface DashboardHeaderProps {
  /**
   * Title displayed in header
   */
  title?: string

  /**
   * Subtitle/description displayed under title
   */
  subtitle?: string

  /**
   * Callback when sign out button is clicked
   */
  onSignOut: () => void

  /**
   * Optional additional buttons to display before sign out button
   */
  children?: React.ReactNode
}

/**
 * Header component for subscriber dashboard
 *
 * Features:
 * - SVLentes logo with home link
 * - Dashboard title and subtitle
 * - Sign out button
 *
 * @example
 * <DashboardHeader
 *   title="Área do Assinante"
 *   subtitle="Gerencie sua assinatura"
 *   onSignOut={() => signOut()}
 * />
 */
export function DashboardHeader({
  title = 'Área do Assinante',
  subtitle = 'Gerencie sua assinatura e preferências',
  onSignOut,
  children
}: DashboardHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center">
              <div className="h-10 w-10 relative">
                <Logo size="md" variant="header" />
              </div>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {title}
              </h1>
              <p className="text-sm text-gray-600">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {children}
            <Button
              variant="outline"
              size="sm"
              onClick={onSignOut}
            >
              Sair
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
