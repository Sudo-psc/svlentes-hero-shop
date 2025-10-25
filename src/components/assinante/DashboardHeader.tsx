/**
 * Dashboard Header Component
 * Reusable header for subscriber area pages
 *
 * @author Dr. Philipe Saraiva Cruz
 * @date 2025-10-25
 */

import Link from 'next/link'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'

interface DashboardHeaderProps {
  /** User display name */
  userName?: string | null
  /** Callback when sign out button is clicked */
  onSignOut: () => void
  /** Optional title override (defaults to "Área do Assinante") */
  title?: string
  /** Optional subtitle override */
  subtitle?: string
}

/**
 * Header component for subscriber dashboard pages
 * Features logo, title, user info, and sign out button
 *
 * @example
 * ```tsx
 * <DashboardHeader
 *   userName={user?.displayName}
 *   onSignOut={() => signOut()}
 * />
 * ```
 */
export function DashboardHeader({
  userName,
  onSignOut,
  title = 'Área do Assinante',
  subtitle = 'Gerencie sua assinatura e preferências'
}: DashboardHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center" aria-label="Voltar para página inicial">
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

          {/* User Actions */}
          <div className="flex items-center gap-3">
            {userName && (
              <span className="hidden sm:inline text-sm text-gray-700">
                Olá, <span className="font-medium">{userName}</span>
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onSignOut}
              aria-label="Sair da conta"
            >
              Sair
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
